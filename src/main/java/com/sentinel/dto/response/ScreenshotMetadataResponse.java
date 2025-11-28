package com.sentinel.dto.response;

import com.sentinel.domain.entity.AgentScreenshot;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScreenshotMetadataResponse {

    private String id;
    private String agentHwid;
    private String triggerCommandId;
    private LocalDateTime capturedAt;

    public static ScreenshotMetadataResponse fromEntity(AgentScreenshot screenshot) {
        return ScreenshotMetadataResponse.builder()
                .id(screenshot.getId().toString())
                .agentHwid(screenshot.getAgentHwid())
                .triggerCommandId(screenshot.getTriggerCommandId() != null 
                        ? screenshot.getTriggerCommandId().toString() : null)
                .capturedAt(screenshot.getCapturedAt())
                .build();
    }
}
