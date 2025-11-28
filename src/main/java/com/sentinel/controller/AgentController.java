package com.sentinel.controller;

import com.sentinel.domain.enums.AgentStatus;
import com.sentinel.dto.response.AgentResponse;
import com.sentinel.service.AgentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for agent management.
 * 
 * Provides HTTP endpoints for agent operations (complementary to WebSocket).
 * Useful for initial data loading and state queries.
 */
@RestController
@RequestMapping("/api/agents")
@RequiredArgsConstructor
@Slf4j
public class AgentController {

    private final AgentService agentService;

    /**
     * Get all agents.
     */
    @GetMapping
    public ResponseEntity<List<AgentResponse>> getAllAgents() {
        return ResponseEntity.ok(agentService.getAllAgents());
    }

    /**
     * Get agent by HWID.
     */
    @GetMapping("/{hwid}")
    public ResponseEntity<AgentResponse> getAgent(@PathVariable String hwid) {
        return agentService.getAgentByHwid(hwid)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get agents by status.
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<List<AgentResponse>> getAgentsByStatus(@PathVariable String status) {
        try {
            AgentStatus agentStatus = AgentStatus.valueOf(status.toUpperCase());
            return ResponseEntity.ok(agentService.getAgentsByStatus(agentStatus));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get online agents count.
     */
    @GetMapping("/count/online")
    public ResponseEntity<Long> getOnlineCount() {
        return ResponseEntity.ok(agentService.countByStatus(AgentStatus.ONLINE));
    }
}
