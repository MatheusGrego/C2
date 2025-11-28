package com.sentinel.service;

import com.sentinel.domain.entity.Agent;
import com.sentinel.domain.entity.Command;
import com.sentinel.domain.enums.CommandStatus;
import com.sentinel.domain.enums.CommandType;
import com.sentinel.domain.enums.CommunicationMode;
import com.sentinel.domain.repository.AgentRepository;
import com.sentinel.domain.repository.CommandRepository;
import com.sentinel.dto.request.CommandResultDTO;
import com.sentinel.dto.request.SendCommandRequest;
import com.sentinel.dto.response.CommandRequestDTO;
import com.sentinel.dto.response.CommandResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommandService {

    private final CommandRepository commandRepository;
    private final AgentRepository agentRepository;
    private final WebSocketBroadcastService broadcastService;

    @Transactional
    public CommandResponse sendCommand(SendCommandRequest request) {
        Agent agent = agentRepository.findById(request.getHwid())
                .orElseThrow(() -> new IllegalArgumentException("Agent not found: " + request.getHwid()));

        Command command = Command.builder()
                .agent(agent)
                .type(request.getType())
                .payload(request.getParams())
                .status(CommandStatus.PENDING)
                .build();

        command = commandRepository.save(command);
        log.info("Command created: {} for agent {}", command.getId(), agent.getHwid());

        // Build command DTO for agent
        CommandRequestDTO commandDTO = CommandRequestDTO.builder()
                .id(command.getId().toString())
                .type(command.getType())
                .params(command.getPayload())
                .build();

        // Send to agent via WebSocket
        boolean sent = broadcastService.sendCommandToAgent(agent.getHwid(), commandDTO);
        
        if (sent) {
            command.markAsSent();
            command = commandRepository.save(command);
            log.info("Command {} sent to agent {}", command.getId(), agent.getHwid());
        } else {
            log.warn("Agent {} not connected, command {} queued", agent.getHwid(), command.getId());
        }

        // Handle SWITCH_MODE command
        if (request.getType() == CommandType.SWITCH_MODE && request.getParams() != null && !request.getParams().isEmpty()) {
            handleSwitchModeCommand(agent.getHwid(), request.getParams());
        }

        return CommandResponse.fromEntity(command);
    }

    @Transactional
    public void processCommandResult(CommandResultDTO result) {
        UUID commandId = UUID.fromString(result.getCommandId());
        
        commandRepository.findById(commandId).ifPresent(command -> {
            if ("SUCCESS".equalsIgnoreCase(result.getStatus())) {
                command.markAsExecuted(result.getOutput());
                log.info("Command {} executed successfully", commandId);
            } else {
                command.markAsFailed(result.getOutput());
                log.warn("Command {} failed: {}", commandId, result.getOutput());
            }
            
            commandRepository.save(command);
            
            broadcastService.broadcastCommandResult(
                    result.getHwid(), 
                    result.getCommandId(), 
                    result.getStatus()
            );
            
            broadcastService.broadcastCommandUpdate(CommandResponse.fromEntity(command));
        });
    }

    @Transactional(readOnly = true)
    public List<CommandResponse> getCommandHistory(String hwid) {
        return commandRepository.findByAgentHwidOrderByCreatedAtDesc(hwid)
                .stream()
                .map(CommandResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<CommandResponse> getCommandHistoryPaged(String hwid, Pageable pageable) {
        return commandRepository.findByAgentHwid(hwid, pageable)
                .map(CommandResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Optional<CommandResponse> getCommandById(UUID commandId) {
        return commandRepository.findById(commandId)
                .map(CommandResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<CommandResponse> getPendingCommands(String hwid) {
        return commandRepository.findPendingCommandsForAgent(hwid, CommandStatus.PENDING)
                .stream()
                .map(CommandResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public long countByStatus(CommandStatus status) {
        return commandRepository.countByStatus(status);
    }

    private void handleSwitchModeCommand(String hwid, List<String> params) {
        String mode = params.get(0).toLowerCase();
        
        agentRepository.findById(hwid).ifPresent(agent -> {
            if ("beacon".equals(mode) && params.size() > 1) {
                int interval = Integer.parseInt(params.get(1));
                agent.switchToBeaconMode(interval);
            } else if ("session".equals(mode)) {
                agent.switchToSessionMode();
            }
            agentRepository.save(agent);
            log.info("Agent {} switched to {} mode", hwid, agent.getCommunicationMode());
        });
    }
}
