package com.sentinel.controller;

import com.sentinel.dto.request.SendCommandRequest;
import com.sentinel.dto.response.CommandResponse;
import com.sentinel.service.CommandService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST Controller for command operations.
 * 
 * Provides HTTP endpoints for sending commands and querying history.
 * Primary command sending is via WebSocket, but REST provides fallback.
 */
@RestController
@RequestMapping("/api/commands")
@RequiredArgsConstructor
@Slf4j
public class CommandController {

    private final CommandService commandService;

    /**
     * Send a command to an agent.
     */
    @PostMapping
    public ResponseEntity<CommandResponse> sendCommand(@Valid @RequestBody SendCommandRequest request) {
        log.info("REST command request: {} to {}", request.getType(), request.getHwid());
        CommandResponse response = commandService.sendCommand(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Get command by ID.
     */
    @GetMapping("/{commandId}")
    public ResponseEntity<CommandResponse> getCommand(@PathVariable UUID commandId) {
        return commandService.getCommandById(commandId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get command history for an agent.
     */
    @GetMapping("/agent/{hwid}")
    public ResponseEntity<List<CommandResponse>> getAgentCommands(@PathVariable String hwid) {
        return ResponseEntity.ok(commandService.getCommandHistory(hwid));
    }

    /**
     * Get paginated command history for an agent.
     */
    @GetMapping("/agent/{hwid}/paged")
    public ResponseEntity<Page<CommandResponse>> getAgentCommandsPaged(
            @PathVariable String hwid,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        return ResponseEntity.ok(commandService.getCommandHistoryPaged(hwid, PageRequest.of(page, size)));
    }

    /**
     * Get pending commands for an agent.
     */
    @GetMapping("/agent/{hwid}/pending")
    public ResponseEntity<List<CommandResponse>> getPendingCommands(@PathVariable String hwid) {
        return ResponseEntity.ok(commandService.getPendingCommands(hwid));
    }
}
