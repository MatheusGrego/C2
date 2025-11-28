package com.sentinel.controller;

import com.sentinel.dto.response.ScreenshotMetadataResponse;
import com.sentinel.service.ScreenshotService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * REST Controller for screenshot operations.
 * 
 * Provides HTTP endpoints for retrieving screenshots.
 * Screenshot upload is handled via WebSocket from agents.
 */
@RestController
@RequestMapping("/api/screenshots")
@RequiredArgsConstructor
@Slf4j
public class ScreenshotController {

    private final ScreenshotService screenshotService;

    /**
     * Get screenshot metadata for an agent (paginated).
     */
    @GetMapping("/agent/{hwid}")
    public ResponseEntity<Page<ScreenshotMetadataResponse>> getAgentScreenshots(
            @PathVariable String hwid,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(screenshotService.getScreenshotsByAgent(hwid, PageRequest.of(page, size)));
    }

    /**
     * Get screenshot metadata by ID.
     */
    @GetMapping("/{screenshotId}/metadata")
    public ResponseEntity<ScreenshotMetadataResponse> getScreenshotMetadata(@PathVariable UUID screenshotId) {
        return screenshotService.getScreenshotMetadata(screenshotId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get screenshot image (binary) by ID.
     */
    @GetMapping("/{screenshotId}/image")
    public ResponseEntity<byte[]> getScreenshotImage(@PathVariable UUID screenshotId) {
        return screenshotService.getScreenshotImage(screenshotId)
                .map(imageData -> ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_TYPE, MediaType.IMAGE_JPEG_VALUE)
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"screenshot-" + screenshotId + ".jpg\"")
                        .body(imageData))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get screenshot count for an agent.
     */
    @GetMapping("/agent/{hwid}/count")
    public ResponseEntity<Long> getScreenshotCount(@PathVariable String hwid) {
        return ResponseEntity.ok(screenshotService.countByAgent(hwid));
    }

    /**
     * Delete a screenshot.
     */
    @DeleteMapping("/{screenshotId}")
    public ResponseEntity<Void> deleteScreenshot(@PathVariable UUID screenshotId) {
        screenshotService.deleteScreenshot(screenshotId);
        return ResponseEntity.noContent().build();
    }
}
