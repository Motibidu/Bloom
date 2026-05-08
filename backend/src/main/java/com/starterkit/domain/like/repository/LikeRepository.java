package com.starterkit.domain.like.repository;

import com.starterkit.domain.like.entity.Like;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface LikeRepository extends JpaRepository<Like, Long> {

    boolean existsByUserIdAndCheckinId(Long userId, Long checkinId);

    @Modifying
    @Transactional
    @Query("DELETE FROM Like l WHERE l.user.id = :userId AND l.checkin.id = :checkinId")
    void deleteByUserIdAndCheckinId(@Param("userId") Long userId, @Param("checkinId") Long checkinId);
}
