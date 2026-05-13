package com.starterkit.domain.comment.repository;

import com.starterkit.domain.comment.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    List<Comment> findByCheckinIdOrderByCreatedAtDesc(Long checkinId);

    @Modifying
    @Query("DELETE FROM Comment c WHERE c.checkin.id = :checkinId")
    void deleteByCheckinId(@Param("checkinId") Long checkinId);
}
