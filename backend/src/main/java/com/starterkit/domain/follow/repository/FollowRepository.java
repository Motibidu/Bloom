package com.starterkit.domain.follow.repository;

import com.starterkit.domain.follow.entity.Follow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FollowRepository extends JpaRepository<Follow, Long> {
    boolean existsByFollowerIdAndFollowingId(Long followerId, Long followingId);
    Optional<Follow> findByFollowerIdAndFollowingId(Long followerId, Long followingId);
    long countByFollowingId(Long followingId);
    long countByFollowerId(Long followerId);
    List<Follow> findByFollowerId(Long followerId);

    @Query("SELECT f FROM Follow f JOIN FETCH f.following WHERE f.follower.id = :followerId")
    List<Follow> findByFollowerIdWithFollowing(@Param("followerId") Long followerId);

    @Query("SELECT f FROM Follow f JOIN FETCH f.follower WHERE f.following.id = :followingId")
    List<Follow> findByFollowingIdWithFollower(@Param("followingId") Long followingId);
}
