package com.sentinel.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScreenshotUploadDTO {

    private String hwid;
    
    @JsonProperty("trigger_command_id")
    private String triggerCommandId;
    
    @JsonProperty("image_base64")
    private String imageBase64;
}
