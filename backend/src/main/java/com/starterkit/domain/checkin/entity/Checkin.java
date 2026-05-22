package com.starterkit.domain.checkin.entity;

import com.starterkit.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "checkins", indexes = {
    @Index(name = "idx_checkins_user_created", columnList = "user_id, created_at"),
    @Index(name = "idx_checkins_created_cat", columnList = "created_at, category")
})
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Checkin {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Category category;

    @Column(nullable = false, length = 30)
    private String title;

    @Column(nullable = false, length = 300)
    private String description;

    @Column(name = "photo_object_key", length = 300)
    private String photoObjectKey;

    @OneToMany(mappedBy = "checkin", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    @Builder.Default
    private List<CheckinPhoto> photos = new ArrayList<>();

    @Column(name = "is_simple", nullable = false)
    @Builder.Default
    private boolean isSimple = false;

    @Column(name = "view_count", nullable = false)
    @Builder.Default
    private long viewCount = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now(java.time.ZoneOffset.UTC);
    }

    public void incrementViewCount() {
        this.viewCount++;
    }

    public void update(Category category, String title, String description) {
        if (category != null) this.category = category;
        if (title != null) this.title = title;
        if (description != null) this.description = description;
    }
}
