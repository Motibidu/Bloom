package com.starterkit.domain.checkin.repository;

import com.starterkit.domain.checkin.entity.CheckinPhoto;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CheckinPhotoRepository extends JpaRepository<CheckinPhoto, Long> {
}
