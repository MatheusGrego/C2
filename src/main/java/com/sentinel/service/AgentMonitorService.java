package com.sentinel.service;

import com.sentinel.domain.entity.Agent;
import com.sentinel.domain.enums.AgentStatus;
import com.sentinel.domain.repository.AgentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AgentMonitorService {

    private final AgentRepository agentRepository;
    private final WebSocketBroadcastService broadcastService;

    @Value("${sentinel.agent.heartbeat-timeout:30}")
    private int heartbeatTimeoutSeconds;

    @Value("${sentinel.agent.dead-timeout-days:7}")
    private int deadTimeoutDays;


    @Scheduled(fixedRate = 10000)
    @Transactional
    public void checkStaleAgents() {
        LocalDateTime offlineThreshold = LocalDateTime.now().minusSeconds(heartbeatTimeoutSeconds);
        LocalDateTime deadThreshold = LocalDateTime.now().minusDays(deadTimeoutDays);

        List<Agent> staleAgents = agentRepository.findByStatusAndLastSeenBefore(
                AgentStatus.ONLINE, offlineThreshold);

        for (Agent agent : staleAgents) {
            AgentStatus previousStatus = agent.getStatus();
            
            if (agent.getLastSeen().isBefore(deadThreshold)) {
                agent.setStatus(AgentStatus.DEAD);
                log.warn("Agent {} marked as DEAD (last seen: {})", 
                        agent.getHostname(), agent.getLastSeen());
            } else {
                agent.setStatus(AgentStatus.OFFLINE);
                log.info("Agent {} marked as OFFLINE (last seen: {})", 
                        agent.getHostname(), agent.getLastSeen());
            }
            
            agentRepository.save(agent);
            
            broadcastService.broadcastAgentStatusChange(
                    agent.getHwid(),
                    previousStatus.name(),
                    agent.getStatus().name()
            );
            broadcastService.broadcastAgentDisconnected(agent.getHwid(), agent.getHostname());
        }

        List<Agent> offlineAgents = agentRepository.findByStatusAndLastSeenBefore(
                AgentStatus.OFFLINE, deadThreshold);

        for (Agent agent : offlineAgents) {
            agent.setStatus(AgentStatus.DEAD);
            agentRepository.save(agent);
            log.warn("Agent {} marked as DEAD after extended offline period", agent.getHostname());
            
            broadcastService.broadcastAgentStatusChange(
                    agent.getHwid(),
                    AgentStatus.OFFLINE.name(),
                    AgentStatus.DEAD.name()
            );
        }
    }
}
