package com.starterkit.domain.board.service;

import com.starterkit.domain.board.dto.request.CreatePostRequest;
import com.starterkit.domain.board.dto.response.PostResponse;
import com.starterkit.domain.board.entity.Post;
import com.starterkit.domain.board.entity.PostCategory;
import com.starterkit.domain.board.repository.PostRepository;
import com.starterkit.domain.comment.repository.CommentRepository;
import com.starterkit.domain.like.repository.LikeRepository;
import com.starterkit.domain.user.entity.User;
import com.starterkit.domain.user.entity.UserRole;
import com.starterkit.domain.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PostServiceTest {

    @Mock private PostRepository postRepository;
    @Mock private UserRepository userRepository;
    @Mock private CommentRepository commentRepository;
    @Mock private LikeRepository likeRepository;

    @InjectMocks
    private PostService postService;

    @Test
    void 게시글을_생성하면_카테고리와_제목이_저장된다() {
        User user = User.builder()
                .id(1L)
                .email("test@example.com")
                .nickname("테스트유저")
                .role(UserRole.MEMBER)
                .birthYear(1970)
                .build();
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(postRepository.save(any(Post.class))).thenAnswer(inv -> {
            Post p = inv.getArgument(0);
            ReflectionTestUtils.setField(p, "id", 1L);
            ReflectionTestUtils.setField(p, "createdAt", java.time.LocalDateTime.now());
            return p;
        });

        CreatePostRequest req = new CreatePostRequest(PostCategory.FREE, "제목", "내용", null);
        PostResponse response = postService.create("test@example.com", req);

        assertThat(response.category()).isEqualTo(PostCategory.FREE);
        assertThat(response.title()).isEqualTo("제목");
    }
}
