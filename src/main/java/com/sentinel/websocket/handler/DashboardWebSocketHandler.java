package com.sentinel.websocket.handler;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sentinel.domain.enums.CommandType;
import com.sentinel.dto.request.SendCommandRequest;
import com.sentinel.dto.request.WebSocketMessage;
import com.sentinel.dto.response.*;
import com.sentinel.service.AgentService;
import com.sentinel.service.CommandService;
import com.sentinel.service.DashboardService;
import com.sentinel.service.ScreenshotService;
import com.sentinel.websocket.session.WebSocketSessionManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * WebSocket handler for Dashboard (Operator) connections.
 * 
 * Handles incoming requests:
 * - SEND_COMMAND: Send command to an agent
 * - GET_AGENTS: Get list of all agents
 * - GET_AGENT: Get specific agent details
 * - GET_STATS: Get dashboard statistics
 * - GET_COMMANDS: Get command history for agent
 * - GET_SCREENSHOTS: Get screenshot metadata for agent
 * 
 * Sends updates:
 * - AGENT_UPDATE: Real-time telemetry updates
 * - AGENT_STATUS: Status change notifications
 * - COMMAND_UPDATE: Command execution results
 * - STATS: Dashboard statistics
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DashboardWebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper objectMapper;
    private final WebSocketSessionManager sessionManager;
    private final AgentService agentService;
    private final CommandService commandService;
    private final DashboardService dashboardService;
    private final ScreenshotService screenshotService;

    private static final String ATTR_USERNAME = "username";

    @Override
    public void afterConnectionEstablished(@NonNull WebSocketSession session) {
        sessionManager.registerDashboard(session);
        
        String username = (String) session.getAttributes().get(ATTR_USERNAME);
        log.info("Dashboard connected: {} (user: {})", session.getId(), username);

        // Send initial data
        sendInitialData(session);
    }

    @Override
    protected void handleTextMessage(@NonNull WebSocketSession session, @NonNull TextMessage message) {
        try {
            String payload = message.getPayload();
            log.debug("Received from dashboard: {}", payload);

            WebSocketMessage wsMessage = objectMapper.readValue(payload, WebSocketMessage.class);
            String messageType = wsMessage.getType();
            String requestId = wsMessage.getRequestId();

            if (messageType == null) {
                log.warn("Received message without type from dashboard {}", session.getId());
                return;
            }

            switch (messageType.toUpperCase()) {
                case "SEND_COMMAND" -> handleSendCommand(session, wsMessage.getPayload(), requestId);
                case "GET_AGENTS" -> handleGetAgents(session, requestId);
                case "GET_AGENT" -> handleGetAgent(session, wsMessage.getPayload(), requestId);
                case "GET_STATS" -> handleGetStats(session, requestId);
                case "GET_COMMANDS" -> handleGetCommands(session, wsMessage.getPayload(), requestId);
                case "GET_SCREENSHOTS" -> handleGetScreenshots(session, wsMessage.getPayload(), requestId);
                case "PING" -> handlePing(session, requestId);
                default -> log.warn("Unknown message type from dashboard: {}", messageType);
            }

        } catch (JsonProcessingException e) {
            log.error("Failed to parse dashboard message: {}", e.getMessage());
            sendError(session, "Invalid JSON format", null);
        } catch (Exception e) {
            log.error("Error handling dashboard message: {}", e.getMessage(), e);
            sendError(session, e.getMessage(), null);
        }
    }

    @Override
    public void afterConnectionClosed(@NonNull WebSocketSession session, @NonNull CloseStatus status) {
        sessionManager.unregisterDashboard(session);
        log.info("Dashboard disconnected: {} (status: {})", session.getId(), status);
    }

    @Override
    public void handleTransportError(@NonNull WebSocketSession session, @NonNull Throwable exception) {
        log.error("Transport error for dashboard {}: {}", session.getId(), exception.getMessage());
    }

    // ==================== MESSAGE HANDLERS ====================

    /**
     * Send command to an agent.
     */
    private void handleSendCommand(WebSocketSession session, JsonNode payload, String requestId) {
        try {
            String hwid = payload.get("hwid").asText();
            String typeStr = payload.get("type").asText();
            CommandType type = CommandType.valueOf(typeStr.toUpperCase());
            
            List<String> params = new ArrayList<>();
            JsonNode paramsNode = payload.get("params");
            if (paramsNode != null && paramsNode.isArray()) {
                for (JsonNode param : paramsNode) {
                    params.add(param.asText());
                }
            }

            SendCommandRequest request = SendCommandRequest.builder()
                    .hwid(hwid)
                    .type(type)
                    .params(params)
                    .build();

            CommandResponse response = commandService.sendCommand(request);
            sendResponse(session, "COMMAND_SENT", response, requestId);
            
            log.info("Command sent to agent {}: {}", hwid, type);
            
        } catch (IllegalArgumentException e) {
            sendError(session, "Invalid command type or agent not found", requestId);
        } catch (Exception e) {
            log.error("Failed to send command: {}", e.getMessage());
            sendError(session, "Failed to send command: " + e.getMessage(), requestId);
        }
    }

    /**
     * Get list of all agents.
     */
    private void handleGetAgents(WebSocketSession session, String requestId) {
        try {
            List<AgentResponse> agents = agentService.getAllAgents();
            sendResponse(session, "AGENTS_LIST", agents, requestId);
        } catch (Exception e) {
            log.error("Failed to get agents: {}", e.getMessage());
            sendError(session, "Failed to get agents", requestId);
        }
    }

    /**
     * Get specific agent details.
     */
    private void handleGetAgent(WebSocketSession session, JsonNode payload, String requestId) {
        try {
            String hwid = payload.get("hwid").asText();
            agentService.getAgentByHwid(hwid)
                    .ifPresentOrElse(
                            agent -> sendResponse(session, "AGENT_DETAILS", agent, requestId),
                            () -> sendError(session, "Agent not found", requestId)
                    );
        } catch (Exception e) {
            log.error("Failed to get agent: {}", e.getMessage());
            sendError(session, "Failed to get agent", requestId);
        }
    }

    /**
     * Get dashboard statistics.
     */
    private void handleGetStats(WebSocketSession session, String requestId) {
        try {
            DashboardStatsResponse stats = dashboardService.getStats();
            sendResponse(session, "STATS", stats, requestId);
        } catch (Exception e) {
            log.error("Failed to get stats: {}", e.getMessage());
            sendError(session, "Failed to get stats", requestId);
        }
    }

    /**
     * Get command history for an agent.
     */
    private void handleGetCommands(WebSocketSession session, JsonNode payload, String requestId) {
        try {
            String hwid = payload.get("hwid").asText();
            int page = payload.has("page") ? payload.get("page").asInt() : 0;
            int size = payload.has("size") ? payload.get("size").asInt() : 50;

            var commands = commandService.getCommandHistoryPaged(hwid, PageRequest.of(page, size));
            sendResponse(session, "COMMANDS_LIST", commands, requestId);
        } catch (Exception e) {
            log.error("Failed to get commands: {}", e.getMessage());
            sendError(session, "Failed to get commands", requestId);
        }
    }

    /**
     * Get screenshot metadata for an agent.
     */
    private void handleGetScreenshots(WebSocketSession session, JsonNode payload, String requestId) {
        try {
            String hwid = payload.get("hwid").asText();
            int page = payload.has("page") ? payload.get("page").asInt() : 0;
            int size = payload.has("size") ? payload.get("size").asInt() : 20;

            var screenshots = screenshotService.getScreenshotsByAgent(hwid, PageRequest.of(page, size));
            sendResponse(session, "SCREENSHOTS_LIST", screenshots, requestId);
        } catch (Exception e) {
            log.error("Failed to get screenshots: {}", e.getMessage());
            sendError(session, "Failed to get screenshots", requestId);
        }
    }

    /**
     * Handle ping (keep-alive).
     */
    private void handlePing(WebSocketSession session, String requestId) {
        sendResponse(session, "PONG", null, requestId);
    }

    // ==================== RESPONSE METHODS ====================

    /**
     * Send initial data to newly connected dashboard.
     */
    private void sendInitialData(WebSocketSession session) {
        try {
            // Send agents list
            List<AgentResponse> agents = agentService.getAllAgents();
            sendResponse(session, "AGENTS_LIST", agents, null);

            // Send stats
            DashboardStatsResponse stats = dashboardService.getStats();
            sendResponse(session, "STATS", stats, null);
            
        } catch (Exception e) {
            log.error("Failed to send initial data: {}", e.getMessage());
        }
    }

    private void sendResponse(WebSocketSession session, String type, Object payload, String requestId) {
        try {
            WebSocketMessage response = WebSocketMessage.builder()
                    .type(type)
                    .payload(objectMapper.valueToTree(payload))
                    .requestId(requestId)
                    .build();
            
            String json = objectMapper.writeValueAsString(response);
            sessionManager.sendToDashboard(session, json);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize response: {}", e.getMessage());
        }
    }

    private void sendError(WebSocketSession session, String message, String requestId) {
        try {
            var errorPayload = objectMapper.createObjectNode().put("error", message);
            WebSocketMessage response = WebSocketMessage.builder()
                    .type("ERROR")
                    .payload(errorPayload)
                    .requestId(requestId)
                    .build();
            
            String json = objectMapper.writeValueAsString(response);
            sessionManager.sendToDashboard(session, json);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize error response: {}", e.getMessage());
        }
    }
}
