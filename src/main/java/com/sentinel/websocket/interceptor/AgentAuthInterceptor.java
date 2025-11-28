package com.sentinel.websocket.interceptor;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;

/**
 * Interceptor for authenticating Agent (Implant) WebSocket connections.
 * 
 * Authentication flow:
 * 1. Agent sends HTTP upgrade request with custom headers:
 *    - X-Agent-Auth: SHA256(PSK + TIMESTAMP)
 *    - X-Agent-Timestamp: Unix timestamp in milliseconds
 * 
 * 2. Server validates:
 *    - Timestamp is within tolerance window (5 minutes)
 *    - Hash matches calculated hash using server's PSK
 * 
 * 3. If valid, connection is allowed; otherwise, 401 Unauthorized
 */
@Component
@Slf4j
public class AgentAuthInterceptor implements HandshakeInterceptor {

    @Value("${sentinel.security.agent-secret}")
    private String agentSecret;

    private static final long TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000;

    @Override
    public boolean beforeHandshake(
            @NonNull ServerHttpRequest request,
            @NonNull ServerHttpResponse response,
            @NonNull WebSocketHandler wsHandler,
            @NonNull Map<String, Object> attributes
    ) {
        String path = request.getURI().getPath();
        
        if (!path.contains("ws-sentinel")) {
            return true;
        }

        log.debug("Agent handshake attempt from: {}", request.getRemoteAddress());

        List<String> authHeaders = request.getHeaders().get("X-Agent-Auth");
        List<String> timestampHeaders = request.getHeaders().get("X-Agent-Timestamp");

        if (authHeaders == null || authHeaders.isEmpty()) {
            log.warn("Agent connection rejected: Missing X-Agent-Auth header");
            return false;
        }

        String providedHash = authHeaders.get(0);
        String timestamp = (timestampHeaders != null && !timestampHeaders.isEmpty()) 
                ? timestampHeaders.get(0) : null;

        // Validate authentication
        if (!validateAgentAuth(providedHash, timestamp)) {
            log.warn("Agent connection rejected: Invalid credentials from {}", request.getRemoteAddress());
            return false;
        }

        log.info("Agent authenticated successfully from {}", request.getRemoteAddress());
        return true;
    }

    @Override
    public void afterHandshake(
            @NonNull ServerHttpRequest request,
            @NonNull ServerHttpResponse response,
            @NonNull WebSocketHandler wsHandler,
            Exception exception
    ) {
        if (exception != null) {
            log.error("Agent handshake error: {}", exception.getMessage());
        }
    }

    /**
     * Validate agent authentication.
     * 
     * If timestamp is provided:
     *   - Validate timestamp is within tolerance window
     *   - Calculate SHA256(PSK + TIMESTAMP) and compare with provided hash
     * 
     * If no timestamp (simplified mode):
     *   - Calculate SHA256(PSK) and compare with provided hash
     */
    private boolean validateAgentAuth(String providedHash, String timestamp) {
        if (providedHash == null || providedHash.isEmpty()) {
            return false;
        }

        try {
            String expectedHash;

            if (timestamp != null && !timestamp.isEmpty()) {
                long timestampLong = Long.parseLong(timestamp);
                long currentTime = System.currentTimeMillis();

                if (Math.abs(currentTime - timestampLong) > TIMESTAMP_TOLERANCE_MS) {
                    log.warn("Agent auth failed: Timestamp outside tolerance window");
                    return false;
                }

                expectedHash = calculateSHA256(agentSecret + timestamp);
            } else {
                expectedHash = calculateSHA256(agentSecret);
            }

            return MessageDigest.isEqual(
                    providedHash.toLowerCase().getBytes(StandardCharsets.UTF_8),
                    expectedHash.toLowerCase().getBytes(StandardCharsets.UTF_8)
            );

        } catch (NumberFormatException e) {
            log.warn("Agent auth failed: Invalid timestamp format");
            return false;
        } catch (Exception e) {
            log.error("Agent auth error: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Calculate SHA-256 hash of a string.
     */
    private String calculateSHA256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }
}
