package com.starterkit.domain.checkin.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "checkin_photos")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CheckinPhoto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "checkin_id", nullable = false)
    private Checkin checkin;

    @Column(name = "object_key", nullable = false, length = 300)
    private String objectKey;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;
}
