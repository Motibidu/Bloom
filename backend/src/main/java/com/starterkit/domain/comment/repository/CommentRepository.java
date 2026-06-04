package com.starterkit.domain.comment.repository;

import com.starterkit.domain.comment.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    List<Comment> findByCheckinIdOrderByCreatedAtDesc(Long checkinId);

    @Query("SELECT c FROM Comment c LEFT JOIN FETCH c.replies r WHERE c.checkin.id = :checkinId AND c.parent IS NULL ORDER BY c.createdAt DESC")
    List<Comment> findRootCommentsByCheckinId(@Param("checkinId") Long checkinId);

    @Query("SELECT c FROM Comment c LEFT JOIN FETCH c.replies r WHERE c.checkin.id = :checkinId AND c.parent IS NULL AND c.user.id NOT IN :excludeUserIds ORDER BY c.createdAt DESC")
    List<Comment> findRootCommentsByCheckinIdExcludingUsers(@Param("checkinId") Long checkinId,
                                                             @Param("excludeUserIds") List<Long> excludeUserIds);

    @Modifying
    @Query("DELETE FROM Comment c WHERE c.checkin.id = :checkinId")
    void deleteByCheckinId(@Param("checkinId") Long checkinId);

    @Query("SELECT c FROM Comment c WHERE c.checkin.id = :checkinId AND c.user.id NOT IN :excludeUserIds ORDER BY c.createdAt DESC")
    List<Comment> findByCheckinIdExcludingUsersOrderByCreatedAtDesc(@Param("checkinId") Long checkinId,
                                                                     @Param("excludeUserIds") List<Long> excludeUserIds);
}
