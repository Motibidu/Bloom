package com.starterkit.domain.board.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "post_photos")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostPhoto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    @Column(name = "object_key", nullable = false, length = 300)
    private String objectKey;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;
}
