CREATE TABLE IF NOT EXISTS users (
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    email      VARCHAR(255) NOT NULL,
    password   VARCHAR(255) NOT NULL,
    nickname   VARCHAR(50)  NOT NULL,
    bio        VARCHAR(50)  NULL,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email    (email),
    UNIQUE KEY uq_users_nickname (nickname)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS checkins (
    id               BIGINT       NOT NULL AUTO_INCREMENT,
    user_id          BIGINT       NOT NULL,
    category         ENUM('WALK','COOKING','READING','GARDENING','EXERCISE','MEETING','OTHER') NOT NULL,
    description      VARCHAR(300) NOT NULL,
    photo_object_key VARCHAR(300) NULL,
    is_simple        TINYINT(1)   NOT NULL DEFAULT 0,
    created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_checkins_user FOREIGN KEY (user_id) REFERENCES users (id),
    INDEX idx_checkins_user_created  (user_id, created_at),
    INDEX idx_checkins_created_cat   (created_at, category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS checkin_photos (
    id               BIGINT       NOT NULL AUTO_INCREMENT,
    checkin_id       BIGINT       NOT NULL,
    object_key       VARCHAR(300) NOT NULL,
    sort_order       TINYINT      NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    CONSTRAINT fk_checkin_photos_checkin FOREIGN KEY (checkin_id) REFERENCES checkins (id) ON DELETE CASCADE,
    INDEX idx_checkin_photos_checkin (checkin_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS likes (
    id         BIGINT   NOT NULL AUTO_INCREMENT,
    user_id    BIGINT   NOT NULL,
    checkin_id BIGINT   NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_likes_user_checkin (user_id, checkin_id),
    CONSTRAINT fk_likes_user    FOREIGN KEY (user_id)    REFERENCES users    (id),
    CONSTRAINT fk_likes_checkin FOREIGN KEY (checkin_id) REFERENCES checkins (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS follows (
    id           BIGINT   NOT NULL AUTO_INCREMENT,
    follower_id  BIGINT   NOT NULL,
    following_id BIGINT   NOT NULL,
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_follow (follower_id, following_id),
    CONSTRAINT fk_follows_follower  FOREIGN KEY (follower_id)  REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_follows_following FOREIGN KEY (following_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS family_groups (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    name        VARCHAR(50)  NOT NULL,
    invite_code VARCHAR(20)  NOT NULL,
    created_by  BIGINT       NOT NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_family_groups_invite_code (invite_code),
    CONSTRAINT fk_family_groups_created_by FOREIGN KEY (created_by) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS family_members (
    id        BIGINT      NOT NULL AUTO_INCREMENT,
    group_id  BIGINT      NOT NULL,
    user_id   BIGINT      NOT NULL,
    role      ENUM('OWNER','GUEST') NOT NULL DEFAULT 'OWNER',
    joined_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_family_members_group_user (group_id, user_id),
    CONSTRAINT fk_family_members_group FOREIGN KEY (group_id) REFERENCES family_groups (id) ON DELETE CASCADE,
    CONSTRAINT fk_family_members_user  FOREIGN KEY (user_id)  REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS comments (
    id               BIGINT       NOT NULL AUTO_INCREMENT,
    user_id          BIGINT       NOT NULL,
    checkin_id       BIGINT       NOT NULL,
    parent_id        BIGINT       NULL,
    content          VARCHAR(200) NULL,
    comment_type     ENUM('TEXT','PRAISE_CARD') NOT NULL DEFAULT 'TEXT',
    praise_card_type ENUM('GREAT_JOB','KEEP_IT_UP','IMPRESSIVE','HEALTHY','INSPIRING') NULL,
    created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_comments_user    FOREIGN KEY (user_id)    REFERENCES users    (id),
    CONSTRAINT fk_comments_checkin FOREIGN KEY (checkin_id) REFERENCES checkins (id),
    CONSTRAINT fk_comments_parent  FOREIGN KEY (parent_id)  REFERENCES comments (id) ON DELETE CASCADE,
    INDEX idx_comments_parent (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
