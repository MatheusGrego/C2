package com.sentinel.domain.entity;

import com.sentinel.domain.enums.AgentStatus;
import com.sentinel.domain.enums.CommunicationMode;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "agents", schema = "public")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Agent {

    @Id
    @Column(length = 64)
    private String hwid;

    @Column(nullable = false, length = 100)
    private String hostname;

    @Column(name = "os_info", length = 100)
    private String osInfo;

    @Column(name = "ip_local", length = 45)
    private String ipLocal;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    @Builder.Default
    private AgentStatus status = AgentStatus.OFFLINE;

    @Enumerated(EnumType.STRING)
    @Column(name = "communication_mode", length = 20)
    @Builder.Default
    private CommunicationMode communicationMode = CommunicationMode.SESSION;

    @Column(name = "beacon_interval")
    private Integer beaconInterval;

    @Column(name = "cpu_load")
    @Builder.Default
    private Double cpuLoad = 0.0;

    @Column(name = "ram_usage")
    @Builder.Default
    private Long ramUsage = 0L;

    @Column(name = "active_window")
    private String activeWindow;

    @Column(name = "first_seen")
    private LocalDateTime firstSeen;

    @Column(name = "last_seen")
    private LocalDateTime lastSeen;

    @OneToMany(mappedBy = "agent", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Command> commands = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        firstSeen = now;
        lastSeen = now;
    }

    public void updateTelemetry(String hostname, String osInfo, String ipLocal, 
                                 Double cpuLoad, Long ramUsage, String activeWindow) {
        this.hostname = hostname;
        this.osInfo = osInfo;
        this.ipLocal = ipLocal;
        this.cpuLoad = cpuLoad;
        this.ramUsage = ramUsage;
        this.activeWindow = activeWindow;
        this.lastSeen = LocalDateTime.now();
        this.status = AgentStatus.ONLINE;
    }

    public void switchToBeaconMode(int intervalSeconds) {
        this.communicationMode = CommunicationMode.BEACON;
        this.beaconInterval = intervalSeconds;
    }

    public void switchToSessionMode() {
        this.communicationMode = CommunicationMode.SESSION;
        this.beaconInterval = null;
    }
}
