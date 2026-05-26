package com.starterkit.domain.family.repository;

import com.starterkit.domain.family.entity.FamilyMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface FamilyMemberRepository extends JpaRepository<FamilyMember, Long> {

    @Query("SELECT fm FROM FamilyMember fm JOIN FETCH fm.user WHERE fm.group.id = :groupId")
    List<FamilyMember> findByGroupId(@Param("groupId") Long groupId);

    boolean existsByGroupIdAndUserId(Long groupId, Long userId);

    @Query("SELECT fm FROM FamilyMember fm JOIN FETCH fm.group WHERE fm.user.id = :userId")
    List<FamilyMember> findByUserId(@Param("userId") Long userId);

    @Query("SELECT fm.user.id FROM FamilyMember fm WHERE fm.group.id = :groupId")
    List<Long> findUserIdsByGroupId(@Param("groupId") Long groupId);

    long countByGroupId(Long groupId);

    void deleteByGroupId(Long groupId);

    void deleteByGroupIdAndUserId(Long groupId, Long userId);
}
