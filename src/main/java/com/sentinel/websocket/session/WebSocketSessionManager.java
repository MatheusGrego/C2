package com.sentinel.websocket.session;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

/**
 * Manages WebSocket sessions for both agents and dashboard operators.
 * Thread-safe implementation using ConcurrentHashMap.
 */
@Component
@Slf4j
public class WebSocketSessionManager {

    private final Map<String, WebSocketSession> agentSessions = new ConcurrentHashMap<>();
    
    private final Set<WebSocketSession> dashboardSessions = new CopyOnWriteArraySet<>();

    // ==================== AGENT SESSION MANAGEMENT ====================

    public void registerAgent(String hwid, WebSocketSession session) {
        WebSocketSession existing = agentSessions.put(hwid, session);
        if (existing != null && existing.isOpen()) {
            try {
                existing.close();
            } catch (IOException e) {
                log.warn("Error closing existing session for agent {}", hwid);
            }
        }
        log.info("Agent registered: {} (session: {})", hwid, session.getId());
    }

    public void unregisterAgent(String hwid) {
        agentSessions.remove(hwid);
        log.info("Agent unregistered: {}", hwid);
    }

    public WebSocketSession getAgentSession(String hwid) {
        return agentSessions.get(hwid);
    }

    public boolean isAgentConnected(String hwid) {
        WebSocketSession session = agentSessions.get(hwid);
        return session != null && session.isOpen();
    }

    public Set<String> getConnectedAgentHwids() {
        return agentSessions.keySet();
    }

    public int getConnectedAgentCount() {
        return agentSessions.size();
    }

    /**
     * Send a message to a specific agent by HWID.
     */
    public boolean sendToAgent(String hwid, String message) {
        WebSocketSession session = agentSessions.get(hwid);
        if (session != null && session.isOpen()) {
            try {
                synchronized (session) {
                    session.sendMessage(new TextMessage(message));
                }
                return true;
            } catch (IOException e) {
                log.error("Failed to send message to agent {}: {}", hwid, e.getMessage());
                unregisterAgent(hwid);
            }
        }
        return false;
    }

    // ==================== DASHBOARD SESSION MANAGEMENT ====================

    public void registerDashboard(WebSocketSession session) {
        dashboardSessions.add(session);
        log.info("Dashboard client connected: {}", session.getId());
    }

    public void unregisterDashboard(WebSocketSession session) {
        dashboardSessions.remove(session);
        log.info("Dashboard client disconnected: {}", session.getId());
    }

    public int getConnectedDashboardCount() {
        return dashboardSessions.size();
    }

    /**
     * Broadcast a message to all connected dashboard clients.
     */
    public void broadcastToDashboards(String message) {
        TextMessage textMessage = new TextMessage(message);
        for (WebSocketSession session : dashboardSessions) {
            if (session.isOpen()) {
                try {
                    synchronized (session) {
                        session.sendMessage(textMessage);
                    }
                } catch (IOException e) {
                    log.error("Failed to send message to dashboard {}: {}", session.getId(), e.getMessage());
                    dashboardSessions.remove(session);
                }
            }
        }
    }

    /**
     * Send a message to a specific dashboard session.
     */
    public boolean sendToDashboard(WebSocketSession session, String message) {
        if (session != null && session.isOpen()) {
            try {
                synchronized (session) {
                    session.sendMessage(new TextMessage(message));
                }
                return true;
            } catch (IOException e) {
                log.error("Failed to send message to dashboard {}: {}", session.getId(), e.getMessage());
                dashboardSessions.remove(session);
            }
        }
        return false;
    }

    // ==================== CLEANUP ====================

    /**
     * Clean up stale sessions (called periodically).
     */
    public void cleanupStaleSessions() {
        // Clean agent sessions
        agentSessions.entrySet().removeIf(entry -> {
            if (!entry.getValue().isOpen()) {
                log.info("Removing stale agent session: {}", entry.getKey());
                return true;
            }
            return false;
        });

        // Clean dashboard sessions
        dashboardSessions.removeIf(session -> {
            if (!session.isOpen()) {
                log.info("Removing stale dashboard session: {}", session.getId());
                return true;
            }
            return false;
        });
    }
}
