package com.sentinel.domain.repository;

import com.sentinel.domain.entity.Command;
import com.sentinel.domain.enums.CommandStatus;
import com.sentinel.domain.enums.CommandType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CommandRepository extends JpaRepository<Command, UUID> {

    @Query("SELECT c FROM Command c WHERE c.agent.hwid = :hwid ORDER BY c.createdAt DESC")
    List<Command> findByAgentHwidOrderByCreatedAtDesc(@Param("hwid") String hwid);

    @Query("SELECT c FROM Command c WHERE c.agent.hwid = :hwid ORDER BY c.createdAt DESC")
    Page<Command> findByAgentHwid(@Param("hwid") String hwid, Pageable pageable);

    @Query("SELECT c FROM Command c WHERE c.agent.hwid = :hwid AND c.status = :status ORDER BY c.createdAt ASC")
    List<Command> findPendingCommandsForAgent(
            @Param("hwid") String hwid,
            @Param("status") CommandStatus status
    );

    List<Command> findByStatus(CommandStatus status);

    @Query("SELECT c FROM Command c WHERE c.agent.hwid = :hwid AND c.type = :type ORDER BY c.createdAt DESC")
    List<Command> findByAgentAndType(@Param("hwid") String hwid, @Param("type") CommandType type);

    @Query("SELECT COUNT(c) FROM Command c WHERE c.status = :status")
    long countByStatus(@Param("status") CommandStatus status);
}
