package com.sentinel.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommandResultDTO {

    @JsonProperty("command_id")
    private String commandId;
    
    private String hwid;
    
    private String status;
    
    private String output;
}
