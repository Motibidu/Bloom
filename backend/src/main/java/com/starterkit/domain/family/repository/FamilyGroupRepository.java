package com.starterkit.domain.family.repository;

import com.starterkit.domain.family.entity.FamilyGroup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FamilyGroupRepository extends JpaRepository<FamilyGroup, Long> {

    Optional<FamilyGroup> findByInviteCode(String inviteCode);

    boolean existsByInviteCode(String inviteCode);
}
