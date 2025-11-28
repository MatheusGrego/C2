package com.sentinel.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.*;

/**
 * Generic WebSocket message envelope for routing.
 * All messages between server/agent/dashboard use this structure.
 * 
 * Message Types from Agent:
 * - HEARTBEAT: Telemetry data
 * - COMMAND_RESULT: Result of executed command
 * - SCREENSHOT_UPLOAD: Base64 encoded screenshot
 * 
 * Message Types from Server to Agent:
 * - COMMAND: Command to execute
 * 
 * Message Types from Dashboard:
 * - SEND_COMMAND: Request to send command to agent
 * - GET_AGENTS: Request list of agents
 * - GET_STATS: Request dashboard statistics
 * 
 * Message Types from Server to Dashboard:
 * - AGENT_UPDATE: Agent telemetry update
 * - AGENT_STATUS: Agent status change
 * - COMMAND_UPDATE: Command status update
 * - STATS: Dashboard statistics
 * - AGENTS_LIST: List of all agents
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WebSocketMessage {

    /**
     * Message type for routing
     */
    private String type;

    /**
     * The actual payload (varies by message type)
     */
    private JsonNode payload;

    /**
     * Optional correlation ID for request/response matching
     */
    @JsonProperty("request_id")
    private String requestId;
}
