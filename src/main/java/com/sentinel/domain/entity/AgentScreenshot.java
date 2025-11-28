package com.sentinel.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "agent_screenshots", schema = "blob_storage")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AgentScreenshot {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "agent_hwid", nullable = false, length = 64)
    private String agentHwid;

    @Column(name = "trigger_command_id")
    private UUID triggerCommandId;

    @Basic(fetch = FetchType.LAZY)
    @Column(name = "image_data", nullable = false, columnDefinition = "BYTEA")
    private byte[] imageData;

    @Column(name = "captured_at")
    private LocalDateTime capturedAt;

    @PrePersist
    protected void onCreate() {
        capturedAt = LocalDateTime.now();
    }
}
