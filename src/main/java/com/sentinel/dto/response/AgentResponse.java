package com.sentinel.dto.response;

import com.sentinel.domain.entity.Agent;
import com.sentinel.domain.enums.AgentStatus;
import com.sentinel.domain.enums.CommunicationMode;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AgentResponse {

    private String hwid;
    private String hostname;
    private String osInfo;
    private String ipLocal;
    private AgentStatus status;
    private CommunicationMode communicationMode;
    private Integer beaconInterval;
    private Double cpuLoad;
    private Long ramUsage;
    private String activeWindow;
    private LocalDateTime firstSeen;
    private LocalDateTime lastSeen;

    public static AgentResponse fromEntity(Agent agent) {
        return AgentResponse.builder()
                .hwid(agent.getHwid())
                .hostname(agent.getHostname())
                .osInfo(agent.getOsInfo())
                .ipLocal(agent.getIpLocal())
                .status(agent.getStatus())
                .communicationMode(agent.getCommunicationMode())
                .beaconInterval(agent.getBeaconInterval())
                .cpuLoad(agent.getCpuLoad())
                .ramUsage(agent.getRamUsage())
                .activeWindow(agent.getActiveWindow())
                .firstSeen(agent.getFirstSeen())
                .lastSeen(agent.getLastSeen())
                .build();
    }
}
