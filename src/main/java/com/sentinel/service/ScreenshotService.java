package com.sentinel.service;

import com.sentinel.domain.entity.AgentScreenshot;
import com.sentinel.domain.repository.ScreenshotRepository;
import com.sentinel.dto.request.ScreenshotUploadDTO;
import com.sentinel.dto.response.ScreenshotMetadataResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Base64;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScreenshotService {

    private final ScreenshotRepository screenshotRepository;
    private final WebSocketBroadcastService broadcastService;

    @Transactional
    public ScreenshotMetadataResponse processUpload(ScreenshotUploadDTO upload) {
        byte[] imageData;
        try {
            imageData = Base64.getDecoder().decode(upload.getImageBase64());
        } catch (IllegalArgumentException e) {
            log.error("Invalid Base64 data from agent {}", upload.getHwid());
            throw new IllegalArgumentException("Invalid Base64 image data");
        }

        UUID triggerCommandId = null;
        if (upload.getTriggerCommandId() != null && !upload.getTriggerCommandId().isEmpty()) {
            try {
                triggerCommandId = UUID.fromString(upload.getTriggerCommandId());
            } catch (IllegalArgumentException e) {
                log.warn("Invalid trigger command ID: {}", upload.getTriggerCommandId());
            }
        }

        AgentScreenshot screenshot = AgentScreenshot.builder()
                .agentHwid(upload.getHwid())
                .triggerCommandId(triggerCommandId)
                .imageData(imageData)
                .build();

        screenshot = screenshotRepository.save(screenshot);
        log.info("Screenshot saved for agent {}: {} bytes", upload.getHwid(), imageData.length);

        // Notify dashboard
        broadcastService.broadcastScreenshotReceived(upload.getHwid());

        return ScreenshotMetadataResponse.fromEntity(screenshot);
    }

    @Transactional(readOnly = true)
    public Page<ScreenshotMetadataResponse> getScreenshotsByAgent(String hwid, Pageable pageable) {
        return screenshotRepository.findMetadataByAgentHwid(hwid, pageable)
                .map(ScreenshotMetadataResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Optional<byte[]> getScreenshotImage(UUID screenshotId) {
        return screenshotRepository.findById(screenshotId)
                .map(AgentScreenshot::getImageData);
    }

    @Transactional(readOnly = true)
    public Optional<ScreenshotMetadataResponse> getScreenshotMetadata(UUID screenshotId) {
        return screenshotRepository.findById(screenshotId)
                .map(ScreenshotMetadataResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public long countByAgent(String hwid) {
        return screenshotRepository.countByAgentHwid(hwid);
    }

    @Transactional
    public void deleteScreenshot(UUID screenshotId) {
        screenshotRepository.deleteById(screenshotId);
        log.info("Screenshot deleted: {}", screenshotId);
    }
}
