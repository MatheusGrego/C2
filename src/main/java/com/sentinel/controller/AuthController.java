package com.sentinel.controller;

import com.sentinel.dto.request.LoginRequest;
import com.sentinel.dto.response.LoginResponse;
import com.sentinel.security.AuthenticationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST Controller for authentication operations.
 * 
 * Endpoints:
 * - POST /api/auth/login - Authenticate and get JWT token
 * - POST /api/auth/validate - Validate JWT token
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthenticationService authenticationService;

    /**
     * Authenticate operator and return JWT token.
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        log.info("Login attempt for user: {}", request.getUsername());
        LoginResponse response = authenticationService.authenticate(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Validate JWT token (used by frontend to check if token is still valid).
     */
    @GetMapping("/validate")
    public ResponseEntity<Map<String, Object>> validateToken() {
        return ResponseEntity.ok(Map.of(
                "valid", true,
                "message", "Token is valid"
        ));
    }
}
