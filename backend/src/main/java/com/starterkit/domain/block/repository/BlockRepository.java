package com.starterkit.domain.block.repository;

import com.starterkit.domain.block.entity.Block;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BlockRepository extends JpaRepository<Block, Long> {

    @Query("SELECT b.blocked.id FROM Block b WHERE b.blocker.id = :blockerId")
    List<Long> findBlockedUserIdsByBlockerId(@Param("blockerId") Long blockerId);

    boolean existsByBlockerIdAndBlockedId(Long blockerId, Long blockedId);

    void deleteByBlockerIdAndBlockedId(Long blockerId, Long blockedId);

    @Query("SELECT b FROM Block b JOIN FETCH b.blocked WHERE b.blocker.id = :blockerId")
    List<Block> findByBlockerIdWithBlocked(@Param("blockerId") Long blockerId);
}
