package com.sentinel.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminEventDTO {

    private String eventType;
    private String agentHwid;
    private String message;
    private Object payload;
    private LocalDateTime timestamp;

    public static AdminEventDTO agentConnected(String hwid, String hostname) {
        return AdminEventDTO.builder()
                .eventType("AGENT_CONNECTED")
                .agentHwid(hwid)
                .message("Agent " + hostname + " connected")
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static AdminEventDTO agentDisconnected(String hwid, String hostname) {
        return AdminEventDTO.builder()
                .eventType("AGENT_DISCONNECTED")
                .agentHwid(hwid)
                .message("Agent " + hostname + " disconnected")
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static AdminEventDTO agentStatusChanged(String hwid, String oldStatus, String newStatus) {
        return AdminEventDTO.builder()
                .eventType("AGENT_STATUS_CHANGED")
                .agentHwid(hwid)
                .message("Agent status changed from " + oldStatus + " to " + newStatus)
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static AdminEventDTO commandResult(String hwid, String commandId, String status) {
        return AdminEventDTO.builder()
                .eventType("COMMAND_RESULT")
                .agentHwid(hwid)
                .message("Command " + commandId + " completed with status: " + status)
                .payload(commandId)
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static AdminEventDTO screenshotReceived(String hwid) {
        return AdminEventDTO.builder()
                .eventType("SCREENSHOT_RECEIVED")
                .agentHwid(hwid)
                .message("New screenshot received from agent")
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static AdminEventDTO telemetryUpdate(String hwid, AgentResponse agent) {
        return AdminEventDTO.builder()
                .eventType("TELEMETRY_UPDATE")
                .agentHwid(hwid)
                .payload(agent)
                .timestamp(LocalDateTime.now())
                .build();
    }
}
