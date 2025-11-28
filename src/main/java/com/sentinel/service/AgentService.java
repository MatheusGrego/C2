package com.sentinel.service;

import com.sentinel.domain.entity.Agent;
import com.sentinel.domain.enums.AgentStatus;
import com.sentinel.domain.enums.CommunicationMode;
import com.sentinel.domain.repository.AgentRepository;
import com.sentinel.dto.request.HeartbeatDTO;
import com.sentinel.dto.response.AgentResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AgentService {

    private final AgentRepository agentRepository;
    private final WebSocketBroadcastService broadcastService;

    @Transactional
    public Agent processHeartbeat(HeartbeatDTO heartbeat) {
        Optional<Agent> existingAgent = agentRepository.findById(heartbeat.getHwid());
        
        Agent agent;
        boolean isNewAgent = existingAgent.isEmpty();
        
        if (isNewAgent) {
            agent = Agent.builder()
                    .hwid(heartbeat.getHwid())
                    .hostname(heartbeat.getHostname())
                    .osInfo(heartbeat.getOsInfo())
                    .ipLocal(heartbeat.getIpLocal())
                    .cpuLoad(heartbeat.getCpuLoad())
                    .ramUsage(heartbeat.getRamUsage())
                    .activeWindow(heartbeat.getActiveWindow())
                    .status(AgentStatus.ONLINE)
                    .communicationMode(CommunicationMode.SESSION)
                    .build();
            
            agent = agentRepository.save(agent);
            log.info("New agent registered: {} ({})", agent.getHostname(), agent.getHwid());
            
            broadcastService.broadcastAgentConnected(agent.getHwid(), agent.getHostname());
        } else {
            agent = existingAgent.get();
            AgentStatus previousStatus = agent.getStatus();
            
            agent.updateTelemetry(
                    heartbeat.getHostname(),
                    heartbeat.getOsInfo(),
                    heartbeat.getIpLocal(),
                    heartbeat.getCpuLoad(),
                    heartbeat.getRamUsage(),
                    heartbeat.getActiveWindow()
            );
            
            agent = agentRepository.save(agent);
            
            if (previousStatus != AgentStatus.ONLINE) {
                log.info("Agent {} came back online", agent.getHostname());
                broadcastService.broadcastAgentStatusChange(
                        agent.getHwid(), previousStatus.name(), AgentStatus.ONLINE.name());
            }
        }
        
        broadcastService.broadcastAgentUpdate(AgentResponse.fromEntity(agent));
        
        return agent;
    }

    @Transactional(readOnly = true)
    public List<AgentResponse> getAllAgents() {
        return agentRepository.findAllOrderByLastSeenDesc()
                .stream()
                .map(AgentResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public Optional<AgentResponse> getAgentByHwid(String hwid) {
        return agentRepository.findById(hwid)
                .map(AgentResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<AgentResponse> getAgentsByStatus(AgentStatus status) {
        return agentRepository.findByStatus(status)
                .stream()
                .map(AgentResponse::fromEntity)
                .toList();
    }

    @Transactional
    public void switchAgentMode(String hwid, CommunicationMode mode, Integer interval) {
        agentRepository.findById(hwid).ifPresent(agent -> {
            if (mode == CommunicationMode.BEACON && interval != null) {
                agent.switchToBeaconMode(interval);
            } else {
                agent.switchToSessionMode();
            }
            agentRepository.save(agent);
            log.info("Agent {} switched to {} mode", hwid, mode);
        });
    }

    @Transactional(readOnly = true)
    public long countByStatus(AgentStatus status) {
        return agentRepository.countByStatus(status);
    }

    @Transactional(readOnly = true)
    public boolean agentExists(String hwid) {
        return agentRepository.existsById(hwid);
    }
}
