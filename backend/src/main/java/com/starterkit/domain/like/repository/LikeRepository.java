package com.starterkit.domain.like.repository;

import com.starterkit.domain.like.entity.Like;
import com.starterkit.domain.like.entity.ReactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface LikeRepository extends JpaRepository<Like, Long> {

    boolean existsByUserIdAndCheckinId(Long userId, Long checkinId);

    Optional<Like> findByUserIdAndCheckinId(Long userId, Long checkinId);

    @Modifying
    @Transactional
    @Query("DELETE FROM Like l WHERE l.user.id = :userId AND l.checkin.id = :checkinId")
    void deleteByUserIdAndCheckinId(@Param("userId") Long userId, @Param("checkinId") Long checkinId);

    @Modifying
    @Query("DELETE FROM Like l WHERE l.checkin.id = :checkinId")
    void deleteByCheckinId(@Param("checkinId") Long checkinId);

    /**
     * 특정 체크인의 리액션 타입별 카운트 반환.
     * result[0] = ReactionType, result[1] = count
     */
    @Query("SELECT l.reactionType, COUNT(l) FROM Like l WHERE l.checkin.id = :checkinId GROUP BY l.reactionType")
    List<Object[]> countByReactionTypeForCheckin(@Param("checkinId") Long checkinId);

    /**
     * 여러 체크인의 리액션 타입별 카운트 반환 (N+1 방지용 벌크 쿼리).
     * result[0] = checkinId, result[1] = ReactionType, result[2] = count
     */
    @Query("SELECT l.checkin.id, l.reactionType, COUNT(l) FROM Like l WHERE l.checkin.id IN :checkinIds GROUP BY l.checkin.id, l.reactionType")
    List<Object[]> countByReactionTypeForCheckinIds(@Param("checkinIds") List<Long> checkinIds);

    /**
     * 특정 사용자가 여러 체크인에 남긴 리액션 조회 (피드 렌더링용).
     * result[0] = checkinId, result[1] = ReactionType
     */
    @Query("SELECT l.checkin.id, l.reactionType FROM Like l WHERE l.checkin.id IN :checkinIds AND l.user.id = :userId")
    List<Object[]> findReactionsByUserIdAndCheckinIds(@Param("checkinIds") List<Long> checkinIds, @Param("userId") Long userId);
}
