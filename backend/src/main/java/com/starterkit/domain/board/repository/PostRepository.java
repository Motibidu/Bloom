package com.starterkit.domain.board.repository;

import com.starterkit.domain.board.entity.Post;
import com.starterkit.domain.board.entity.PostCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {

    Page<Post> findByCategoryOrderByCreatedAtDesc(PostCategory category, Pageable pageable);

    Page<Post> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT p FROM Post p WHERE p.category = :category AND p.user.id NOT IN :excludeUserIds ORDER BY p.createdAt DESC")
    Page<Post> findByCategoryExcludingUsersOrderByCreatedAtDesc(@Param("category") PostCategory category,
                                                                 @Param("excludeUserIds") List<Long> excludeUserIds,
                                                                 Pageable pageable);

    @Query("SELECT p FROM Post p WHERE p.user.id NOT IN :excludeUserIds ORDER BY p.createdAt DESC")
    Page<Post> findAllExcludingUsersOrderByCreatedAtDesc(@Param("excludeUserIds") List<Long> excludeUserIds,
                                                          Pageable pageable);
}
