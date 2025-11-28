package com.sentinel.domain.repository;

import com.sentinel.domain.entity.AgentScreenshot;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ScreenshotRepository extends JpaRepository<AgentScreenshot, UUID> {

    @Query("SELECT new AgentScreenshot(s.id, s.agentHwid, s.triggerCommandId, null, s.capturedAt) " +
           "FROM AgentScreenshot s WHERE s.agentHwid = :hwid ORDER BY s.capturedAt DESC")
    Page<AgentScreenshot> findMetadataByAgentHwid(@Param("hwid") String hwid, Pageable pageable);

    @Query("SELECT s FROM AgentScreenshot s WHERE s.agentHwid = :hwid ORDER BY s.capturedAt DESC")
    List<AgentScreenshot> findByAgentHwidOrderByCapturedAtDesc(@Param("hwid") String hwid);

    Optional<AgentScreenshot> findByTriggerCommandId(UUID triggerCommandId);

    @Query("SELECT COUNT(s) FROM AgentScreenshot s WHERE s.agentHwid = :hwid")
    long countByAgentHwid(@Param("hwid") String hwid);

    @Query("SELECT s.id, s.agentHwid, s.capturedAt FROM AgentScreenshot s " +
           "WHERE s.agentHwid = :hwid ORDER BY s.capturedAt DESC")
    List<Object[]> findScreenshotMetadataByAgent(@Param("hwid") String hwid);
}
