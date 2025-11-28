package com.sentinel.dto.response;

import com.sentinel.domain.enums.CommandType;
import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommandRequestDTO {

    private String id;
    
    private CommandType type;
    
    private List<String> params;
}
