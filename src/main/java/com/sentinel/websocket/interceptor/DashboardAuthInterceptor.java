package com.sentinel.websocket.interceptor;

import com.sentinel.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.List;
import java.util.Map;

/**
 * Interceptor for authenticating Dashboard (Operator) WebSocket connections.
 * 
 * Authentication flow:
 * 1. Dashboard sends HTTP upgrade request with:
 *    - Authorization header: "Bearer <JWT_TOKEN>"
 *    - OR query parameter: ?token=<JWT_TOKEN>
 * 
 * 2. Server validates JWT token
 * 
 * 3. If valid, connection is allowed and username is stored in session attributes
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DashboardAuthInterceptor implements HandshakeInterceptor {

    private final JwtService jwtService;

    @Override
    public boolean beforeHandshake(
            @NonNull ServerHttpRequest request,
            @NonNull ServerHttpResponse response,
            @NonNull WebSocketHandler wsHandler,
            @NonNull Map<String, Object> attributes
    ) {
        String path = request.getURI().getPath();
        
        if (!path.contains("ws-dashboard")) {
            return true;
        }

        log.debug("Dashboard handshake attempt from: {}", request.getRemoteAddress());

        String token = extractTokenFromHeader(request);
        
        if (token == null) {
            token = extractTokenFromQuery(request);
        }

        if (token == null) {
            log.warn("Dashboard connection rejected: No token provided from {}", request.getRemoteAddress());
            return false;
        }

        if (!jwtService.isTokenValid(token)) {
            log.warn("Dashboard connection rejected: Invalid token from {}", request.getRemoteAddress());
            return false;
        }

        String username = jwtService.extractUsername(token);
        attributes.put("username", username);

        log.info("Dashboard authenticated: {} from {}", username, request.getRemoteAddress());
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
            log.error("Dashboard handshake error: {}", exception.getMessage());
        }
    }

    /**
     * Extract JWT token from Authorization header.
     * Expected format: "Bearer <token>"
     */
    private String extractTokenFromHeader(ServerHttpRequest request) {
        List<String> authHeaders = request.getHeaders().get("Authorization");
        
        if (authHeaders != null && !authHeaders.isEmpty()) {
            String authHeader = authHeaders.get(0);
            if (authHeader.startsWith("Bearer ")) {
                return authHeader.substring(7);
            }
        }
        
        return null;
    }

    /**
     * Extract JWT token from query parameter.
     * Used when header is not available (e.g., WebSocket from browser)
     */
    private String extractTokenFromQuery(ServerHttpRequest request) {
        String query = request.getURI().getQuery();
        
        if (query != null) {
            for (String param : query.split("&")) {
                String[] keyValue = param.split("=");
                if (keyValue.length == 2 && "token".equals(keyValue[0])) {
                    return keyValue[1];
                }
            }
        }
        
        return null;
    }
}
