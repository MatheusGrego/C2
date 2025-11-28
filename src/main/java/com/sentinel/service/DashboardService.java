package com.sentinel.service;

import com.sentinel.domain.enums.AgentStatus;
import com.sentinel.domain.enums.CommandStatus;
import com.sentinel.dto.response.DashboardStatsResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final AgentService agentService;
    private final CommandService commandService;

    @Transactional(readOnly = true)
    public DashboardStatsResponse getStats() {
        long onlineAgents = agentService.countByStatus(AgentStatus.ONLINE);
        long offlineAgents = agentService.countByStatus(AgentStatus.OFFLINE);
        long deadAgents = agentService.countByStatus(AgentStatus.DEAD);
        
        long pendingCommands = commandService.countByStatus(CommandStatus.PENDING) +
                               commandService.countByStatus(CommandStatus.SENT);
        long executedCommands = commandService.countByStatus(CommandStatus.EXECUTED);
        long failedCommands = commandService.countByStatus(CommandStatus.FAILED);

        return DashboardStatsResponse.builder()
                .totalAgents(onlineAgents + offlineAgents + deadAgents)
                .onlineAgents(onlineAgents)
                .offlineAgents(offlineAgents)
                .deadAgents(deadAgents)
                .pendingCommands(pendingCommands)
                .executedCommands(executedCommands)
                .failedCommands(failedCommands)
                .build();
    }
}
