package com.sentinel.dto.response;

import com.sentinel.domain.entity.Command;
import com.sentinel.domain.enums.CommandStatus;
import com.sentinel.domain.enums.CommandType;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommandResponse {

    private String id;
    private String agentHwid;
    private CommandType type;
    private List<String> payload;
    private String responseText;
    private CommandStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime executedAt;

    public static CommandResponse fromEntity(Command command) {
        return CommandResponse.builder()
                .id(command.getId().toString())
                .agentHwid(command.getAgent().getHwid())
                .type(command.getType())
                .payload(command.getPayload())
                .responseText(command.getResponseText())
                .status(command.getStatus())
                .createdAt(command.getCreatedAt())
                .executedAt(command.getExecutedAt())
                .build();
    }
}
