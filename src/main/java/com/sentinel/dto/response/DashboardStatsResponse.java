package com.sentinel.dto.response;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardStatsResponse {

    private long totalAgents;
    private long onlineAgents;
    private long offlineAgents;
    private long deadAgents;
    private long pendingCommands;
    private long executedCommands;
    private long failedCommands;
}
