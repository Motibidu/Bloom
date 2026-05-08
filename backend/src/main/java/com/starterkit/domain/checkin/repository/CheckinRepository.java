package com.starterkit.domain.checkin.repository;

import com.starterkit.domain.checkin.entity.Category;
import com.starterkit.domain.checkin.entity.Checkin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface CheckinRepository extends JpaRepository<Checkin, Long> {

    List<Checkin> findAllByOrderByCreatedAtDesc();

    List<Checkin> findByUserIdAndCreatedAtBetweenOrderByCreatedAtAsc(Long userId, LocalDateTime start, LocalDateTime end);

    List<Checkin> findByUserIdAndCreatedAtBetweenOrderByCreatedAtDesc(Long userId, LocalDateTime start, LocalDateTime end);

    @Query("SELECT COUNT(DISTINCT c.user.id) FROM Checkin c " +
           "WHERE c.createdAt BETWEEN :start AND :end " +
           "AND c.category IN :categories AND c.user.id != :userId")
    long countDistinctUsersByCategories(@Param("start") LocalDateTime start,
                                        @Param("end") LocalDateTime end,
                                        @Param("categories") List<Category> categories,
                                        @Param("userId") Long userId);

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
}
