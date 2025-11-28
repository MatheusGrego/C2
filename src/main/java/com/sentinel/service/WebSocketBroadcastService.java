package com.sentinel.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sentinel.dto.request.WebSocketMessage;
import com.sentinel.dto.response.AdminEventDTO;
import com.sentinel.dto.response.AgentResponse;
import com.sentinel.dto.response.CommandRequestDTO;
import com.sentinel.dto.response.CommandResponse;
import com.sentinel.websocket.session.WebSocketSessionManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Service for broadcasting messages to WebSocket clients.
 * Replaces SimpMessagingTemplate functionality with raw WebSocket messaging.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WebSocketBroadcastService {

    private final WebSocketSessionManager sessionManager;
    private final ObjectMapper objectMapper;

    // ==================== AGENT MESSAGING ====================

    /**
     * Send a command to a specific agent.
     */
    public boolean sendCommandToAgent(String hwid, CommandRequestDTO command) {
        try {
            WebSocketMessage message = WebSocketMessage.builder()
                    .type("COMMAND")
                    .payload(objectMapper.valueToTree(command))
                    .build();
            
            String json = objectMapper.writeValueAsString(message);
            boolean sent = sessionManager.sendToAgent(hwid, json);
            
            if (sent) {
                log.debug("Command sent to agent {}: {}", hwid, command.getType());
            } else {
                log.warn("Failed to send command to agent {} - not connected", hwid);
            }
            
            return sent;
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize command: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Check if an agent is currently connected.
     */
    public boolean isAgentConnected(String hwid) {
        return sessionManager.isAgentConnected(hwid);
    }

    // ==================== DASHBOARD MESSAGING ====================

    /**
     * Broadcast an admin event to all dashboards.
     */
    public void broadcastAdminEvent(AdminEventDTO event) {
        try {
            WebSocketMessage message = WebSocketMessage.builder()
                    .type("ADMIN_EVENT")
                    .payload(objectMapper.valueToTree(event))
                    .build();
            
            String json = objectMapper.writeValueAsString(message);
            sessionManager.broadcastToDashboards(json);
            log.debug("Admin event broadcasted: {}", event.getEventType());
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize admin event: {}", e.getMessage());
        }
    }

    /**
     * Broadcast agent telemetry update to all dashboards.
     */
    public void broadcastAgentUpdate(AgentResponse agent) {
        try {
            WebSocketMessage message = WebSocketMessage.builder()
                    .type("AGENT_UPDATE")
                    .payload(objectMapper.valueToTree(agent))
                    .build();
            
            String json = objectMapper.writeValueAsString(message);
            sessionManager.broadcastToDashboards(json);
            log.debug("Agent update broadcasted: {}", agent.getHwid());
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize agent update: {}", e.getMessage());
        }
    }

    /**
     * Broadcast command status update to all dashboards.
     */
    public void broadcastCommandUpdate(CommandResponse command) {
        try {
            WebSocketMessage message = WebSocketMessage.builder()
                    .type("COMMAND_UPDATE")
                    .payload(objectMapper.valueToTree(command))
                    .build();
            
            String json = objectMapper.writeValueAsString(message);
            sessionManager.broadcastToDashboards(json);
            log.debug("Command update broadcasted: {}", command.getId());
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize command update: {}", e.getMessage());
        }
    }

    /**
     * Broadcast agent status change to all dashboards.
     */
    public void broadcastAgentStatusChange(String hwid, String oldStatus, String newStatus) {
        AdminEventDTO event = AdminEventDTO.agentStatusChanged(hwid, oldStatus, newStatus);
        broadcastAdminEvent(event);
    }

    /**
     * Broadcast agent connection event to all dashboards.
     */
    public void broadcastAgentConnected(String hwid, String hostname) {
        AdminEventDTO event = AdminEventDTO.agentConnected(hwid, hostname);
        broadcastAdminEvent(event);
    }

    /**
     * Broadcast agent disconnection event to all dashboards.
     */
    public void broadcastAgentDisconnected(String hwid, String hostname) {
        AdminEventDTO event = AdminEventDTO.agentDisconnected(hwid, hostname);
        broadcastAdminEvent(event);
    }

    /**
     * Broadcast screenshot received event to all dashboards.
     */
    public void broadcastScreenshotReceived(String hwid) {
        AdminEventDTO event = AdminEventDTO.screenshotReceived(hwid);
        broadcastAdminEvent(event);
    }

    /**
     * Broadcast command result event to all dashboards.
     */
    public void broadcastCommandResult(String hwid, String commandId, String status) {
        AdminEventDTO event = AdminEventDTO.commandResult(hwid, commandId, status);
        broadcastAdminEvent(event);
    }
}
