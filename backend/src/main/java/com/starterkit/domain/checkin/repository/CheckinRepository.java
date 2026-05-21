package com.starterkit.domain.checkin.repository;

import com.starterkit.domain.checkin.entity.Category;
import com.starterkit.domain.checkin.entity.Checkin;
import com.starterkit.domain.user.entity.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface CheckinRepository extends JpaRepository<Checkin, Long> {

    @EntityGraph(attributePaths = "user")
    List<Checkin> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = "user")
    @Query("SELECT c FROM Checkin c WHERE c.createdAt BETWEEN :start AND :end ORDER BY c.createdAt DESC")
    List<Checkin> findAllByDateRangeOrderByCreatedAtDesc(@Param("start") LocalDateTime start,
                                                         @Param("end") LocalDateTime end);

    List<Checkin> findByUserIdAndCreatedAtBetweenOrderByCreatedAtAsc(Long userId, LocalDateTime start, LocalDateTime end);

    List<Checkin> findByUserIdAndCreatedAtBetweenOrderByCreatedAtDesc(Long userId, LocalDateTime start, LocalDateTime end);

    @Query("SELECT COUNT(DISTINCT c.user.id) FROM Checkin c " +
           "WHERE c.createdAt BETWEEN :start AND :end " +
           "AND c.category IN :categories AND c.user.id != :userId")
    long countDistinctUsersByCategories(@Param("start") LocalDateTime start,
                                        @Param("end") LocalDateTime end,
                                        @Param("categories") List<Category> categories,
                                        @Param("userId") Long userId);

    @Query("SELECT DISTINCT c.user FROM Checkin c " +
           "WHERE c.createdAt BETWEEN :start AND :end " +
           "AND c.category IN :categories AND c.user.id <> :userId")
    List<User> findDistinctUsersByCategoriesToday(@Param("userId") Long userId,
                                                  @Param("start") LocalDateTime start,
                                                  @Param("end") LocalDateTime end,
                                                  @Param("categories") List<Category> categories);

    @Query("SELECT DISTINCT c.category FROM Checkin c " +
           "WHERE c.user.id = :userId AND c.createdAt BETWEEN :start AND :end")
    List<Category> findMyCategoriesToday(@Param("userId") Long userId,
                                         @Param("start") LocalDateTime start,
                                         @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(l) FROM Like l WHERE l.checkin.id = :checkinId")
    long countLikesByCheckinId(@Param("checkinId") Long checkinId);

    @Query("SELECT COUNT(l) > 0 FROM Like l WHERE l.checkin.id = :checkinId AND l.user.id = :userId")
    boolean existsLikeByCheckinIdAndUserId(@Param("checkinId") Long checkinId, @Param("userId") Long userId);

    @Query("SELECT COUNT(c) FROM Comment c WHERE c.checkin.id = :checkinId")
    long countCommentsByCheckinId(@Param("checkinId") Long checkinId);

    // 벌크 집계 쿼리 — N+1 방지용
    @Query("SELECT l.checkin.id, COUNT(l) FROM Like l WHERE l.checkin.id IN :checkinIds GROUP BY l.checkin.id")
    List<Object[]> countLikesByCheckinIds(@Param("checkinIds") List<Long> checkinIds);

    @Query("SELECT l.checkin.id FROM Like l WHERE l.checkin.id IN :checkinIds AND l.user.id = :userId")
    List<Long> findLikedCheckinIdsByUserId(@Param("checkinIds") List<Long> checkinIds, @Param("userId") Long userId);

    @Query("SELECT c.checkin.id, COUNT(c) FROM Comment c WHERE c.checkin.id IN :checkinIds GROUP BY c.checkin.id")
    List<Object[]> countCommentsByCheckinIds(@Param("checkinIds") List<Long> checkinIds);

    @Query("SELECT c FROM Checkin c WHERE c.user.id = :userId " +
           "AND c.createdAt >= :start AND c.createdAt < :end " +
           "ORDER BY c.createdAt ASC")
    List<Checkin> findByUserIdAndDateRange(
            @Param("userId") Long userId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    /**
     * 특정 사용자가 여러 체크인에 남긴 리액션 타입 조회 (피드 렌더링용).
     * result[0] = checkinId, result[1] = ReactionType
     */
    @Query("SELECT l.checkin.id, l.reactionType FROM Like l WHERE l.checkin.id IN :checkinIds AND l.user.id = :userId")
    List<Object[]> findReactionsByUserIdAndCheckinIds(@Param("checkinIds") List<Long> checkinIds, @Param("userId") Long userId);

    /**
     * 커서 기반 피드 조회 (날짜 필터 없음 — 의도된 설계).
     * cursor가 null이면 최신순으로 limit개 반환.
     * cursor가 있으면 해당 id보다 작은 체크인만 반환.
     */
    @EntityGraph(attributePaths = "user")
    @Query("SELECT c FROM Checkin c WHERE (:cursor IS NULL OR c.id < :cursor) ORDER BY c.id DESC LIMIT :limit")
    List<Checkin> findAllByCursorOrderByIdDesc(@Param("cursor") Long cursor, @Param("limit") int limit);

    /**
     * 팔로우 피드 커서 기반 조회
     */
    @EntityGraph(attributePaths = "user")
    @Query("SELECT c FROM Checkin c WHERE c.user.id IN :userIds AND (:cursor IS NULL OR c.id < :cursor) ORDER BY c.id DESC LIMIT :limit")
    List<Checkin> findByUserIdsByCursorOrderByIdDesc(@Param("userIds") List<Long> userIds,
                                                     @Param("cursor") Long cursor,
                                                     @Param("limit") int limit);

    // 가족 피드: 특정 사용자들의 전체 체크인 조회 (날짜 제한 없음)
    @EntityGraph(attributePaths = "user")
    @Query("SELECT c FROM Checkin c WHERE c.user.id IN :userIds ORDER BY c.createdAt DESC")
    List<Checkin> findByUserIdsOrderByCreatedAtDesc(@Param("userIds") List<Long> userIds);

    // 팔로우 피드: 특정 사용자들의 오늘 체크인 조회
    @EntityGraph(attributePaths = "user")
    @Query("SELECT c FROM Checkin c WHERE c.user.id IN :userIds AND c.createdAt BETWEEN :start AND :end ORDER BY c.createdAt DESC")
    List<Checkin> findByUserIdsAndDateRangeOrderByCreatedAtDesc(@Param("userIds") List<Long> userIds,
                                                                @Param("start") LocalDateTime start,
                                                                @Param("end") LocalDateTime end);

    // 단순 체크인 집계: 카테고리별 참여자 수 + 닉네임 (최신순 3명)
    @Query("SELECT c.category, c.user.nickname FROM Checkin c " +
           "WHERE c.isSimple = true AND c.createdAt BETWEEN :start AND :end " +
           "ORDER BY c.createdAt DESC")
    List<Object[]> findSimpleCheckinSummary(@Param("start") LocalDateTime start,
                                            @Param("end") LocalDateTime end);
}
