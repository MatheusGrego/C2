package com.sentinel;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Sentinel Core - Command & Control Backend Server
 * 
 * A C2 framework backend built with Spring Boot.
 * 
 * Features:
 * - Raw WebSocket communication (no STOMP overhead)
 * - JWT authentication for operators
 * - PSK authentication for agents
 * - Real-time telemetry processing
 * - Command dispatch and result handling
 * - Screenshot storage and retrieval
 * - Agent monitoring with zombie detection
 * 
 * @version 1.0.6
 */
@SpringBootApplication
public class SentinelCoreApplication {

    public static void main(String[] args) {
        
        SpringApplication.run(SentinelCoreApplication.class, args);

        System.out.println("""
        
        ╔══════════════════════════════════════════════════════════════════════╗
        ║                                                                      ║
        ║   ███████╗███████╗███╗   ██╗████████╗██╗███╗   ██╗███████╗██╗        ║
        ║   ██╔════╝██╔════╝████╗  ██║╚══██╔══╝██║████╗  ██║██╔════╝██║        ║
        ║   ███████╗█████╗  ██╔██╗ ██║   ██║   ██║██╔██╗ ██║█████╗  ██║        ║
        ║   ╚════██║██╔══╝  ██║╚██╗██║   ██║   ██║██║╚██╗██║██╔══╝  ██║        ║
        ║   ███████║███████╗██║ ╚████║   ██║   ██║██║ ╚████║███████╗███████╗   ║
        ║   ╚══════╝╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚═╝╚═╝  ╚═══╝╚══════╝╚══════╝   ║
        ║                                                                      ║
        ║                         SENTINEL C2 CORE v1.0.6                      ║
        ║                         Command & Control Server                     ║
        ║                                                                      ║
        ╚══════════════════════════════════════════════════════════════════════╝
        
        """);

    }
}
