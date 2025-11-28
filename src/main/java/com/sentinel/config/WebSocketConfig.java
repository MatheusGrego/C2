package com.sentinel.config;

import com.sentinel.websocket.handler.AgentWebSocketHandler;
import com.sentinel.websocket.handler.DashboardWebSocketHandler;
import com.sentinel.websocket.interceptor.AgentAuthInterceptor;
import com.sentinel.websocket.interceptor.DashboardAuthInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import org.springframework.web.socket.server.standard.ServletServerContainerFactoryBean;

/**
 * WebSocket Configuration using Raw WebSocket (no STOMP).
 * 
 * This approach provides:
 * - Direct JSON message handling without STOMP framing overhead
 * - Better compatibility with Go implant (gorilla/websocket)
 * - Simpler debugging (plain JSON messages)
 * - Custom authentication via HTTP headers during handshake
 */
@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketConfigurer {

    private final AgentWebSocketHandler agentWebSocketHandler;
    private final DashboardWebSocketHandler dashboardWebSocketHandler;
    private final AgentAuthInterceptor agentAuthInterceptor;
    private final DashboardAuthInterceptor dashboardAuthInterceptor;

    @Value("${sentinel.cors.allowed-origins}")
    private String allowedOrigins;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {

        registry.addHandler(agentWebSocketHandler, "/ws-sentinel")
                .addInterceptors(agentAuthInterceptor)
                .setAllowedOrigins("*");

        registry.addHandler(dashboardWebSocketHandler, "/ws-dashboard")
                .addInterceptors(dashboardAuthInterceptor)
                .setAllowedOrigins(allowedOrigins.split(","));
    }

    @Bean
    public ServletServerContainerFactoryBean createWebSocketContainer() {
        ServletServerContainerFactoryBean container = new ServletServerContainerFactoryBean();
        container.setMaxTextMessageBufferSize(10 * 1024 * 1024);
        container.setMaxBinaryMessageBufferSize(10 * 1024 * 1024);
        container.setMaxSessionIdleTimeout(60_000L);
        return container;
    }


}
