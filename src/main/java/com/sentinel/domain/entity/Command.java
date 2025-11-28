package com.sentinel.domain.entity;

import com.sentinel.domain.enums.CommandStatus;
import com.sentinel.domain.enums.CommandType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "commands", schema = "public")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Command {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agent_hwid", nullable = false)
    private Agent agent;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private CommandType type;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<String> payload;

    @Column(name = "response_text", columnDefinition = "TEXT")
    private String responseText;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    @Builder.Default
    private CommandStatus status = CommandStatus.PENDING;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "executed_at")
    private LocalDateTime executedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public void markAsSent() {
        this.status = CommandStatus.SENT;
    }

    public void markAsExecuted(String output) {
        this.status = CommandStatus.EXECUTED;
        this.responseText = output;
        this.executedAt = LocalDateTime.now();
    }

    public void markAsFailed(String errorMessage) {
        this.status = CommandStatus.FAILED;
        this.responseText = errorMessage;
        this.executedAt = LocalDateTime.now();
    }
}
