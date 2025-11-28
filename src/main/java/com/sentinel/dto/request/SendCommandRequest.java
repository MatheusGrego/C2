package com.sentinel.dto.request;

import com.sentinel.domain.enums.CommandType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SendCommandRequest {

    @NotBlank(message = "Agent HWID is required")
    private String hwid;
    
    @NotNull(message = "Command type is required")
    private CommandType type;
    
    private List<String> params;
}
