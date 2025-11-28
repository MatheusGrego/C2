package com.sentinel.controller;

import com.sentinel.dto.response.DashboardStatsResponse;
import com.sentinel.service.DashboardService;
import com.sentinel.websocket.session.WebSocketSessionManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * REST Controller for dashboard operations.
 * 
 * Provides HTTP endpoints for dashboard statistics and system health.
 */
@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@Slf4j
public class DashboardController {

    private final DashboardService dashboardService;
    private final WebSocketSessionManager sessionManager;

    /**
     * Get dashboard statistics.
     */
    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsResponse> getStats() {
        return ResponseEntity.ok(dashboardService.getStats());
    }

    /**
     * Get WebSocket connection statistics.
     */
    @GetMapping("/connections")
    public ResponseEntity<Map<String, Object>> getConnectionStats() {
        return ResponseEntity.ok(Map.of(
                "connectedAgents", sessionManager.getConnectedAgentCount(),
                "connectedDashboards", sessionManager.getConnectedDashboardCount(),
                "connectedHwids", sessionManager.getConnectedAgentHwids()
        ));
    }

    /**
     * Health check endpoint.
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "Sentinel Core",
                "version", "1.0.6"
        ));
    }
}
