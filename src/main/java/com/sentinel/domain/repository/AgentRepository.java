package com.sentinel.domain.repository;

import com.sentinel.domain.entity.Agent;
import com.sentinel.domain.enums.AgentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AgentRepository extends JpaRepository<Agent, String> {

    List<Agent> findByStatus(AgentStatus status);

    @Query("SELECT a FROM Agent a WHERE a.status = :status AND a.lastSeen < :threshold")
    List<Agent> findByStatusAndLastSeenBefore(
            @Param("status") AgentStatus status,
            @Param("threshold") LocalDateTime threshold
    );

    @Query("SELECT COUNT(a) FROM Agent a WHERE a.status = :status")
    long countByStatus(@Param("status") AgentStatus status);

    @Modifying
    @Query("UPDATE Agent a SET a.status = :newStatus WHERE a.status = :currentStatus AND a.lastSeen < :threshold")
    int updateStatusForStaleAgents(
            @Param("currentStatus") AgentStatus currentStatus,
            @Param("newStatus") AgentStatus newStatus,
            @Param("threshold") LocalDateTime threshold
    );

    @Query("SELECT a FROM Agent a ORDER BY a.lastSeen DESC")
    List<Agent> findAllOrderByLastSeenDesc();
}
