package com.starterkit.domain.comment.repository;

import com.starterkit.domain.comment.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    List<Comment> findByCheckinIdOrderByCreatedAtAsc(Long checkinId);
}
