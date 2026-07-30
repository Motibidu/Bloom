package com.starterkit.domain.board.service;

import com.starterkit.domain.board.dto.request.CreatePostRequest;
import com.starterkit.domain.board.dto.response.PostPageResponse;
import com.starterkit.domain.board.dto.response.PostResponse;
import com.starterkit.domain.board.dto.response.PostSummaryResponse;
import com.starterkit.domain.board.entity.Post;
import com.starterkit.domain.board.entity.PostCategory;
import com.starterkit.domain.board.entity.PostPhoto;
import com.starterkit.domain.board.exception.PostNotFoundException;
import com.starterkit.domain.board.repository.PostRepository;
import com.starterkit.domain.block.service.BlockService;
import com.starterkit.domain.checkin.dto.request.PhotoUploadUrlRequest;
import com.starterkit.domain.checkin.dto.response.PhotoUploadUrlResponse;
import com.starterkit.domain.comment.repository.CommentRepository;
import com.starterkit.domain.like.entity.ReactionType;
import com.starterkit.domain.like.repository.LikeRepository;
import com.starterkit.domain.user.entity.User;
import com.starterkit.domain.user.repository.UserRepository;
import com.starterkit.global.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final CommentRepository commentRepository;
    private final LikeRepository likeRepository;
    private final BlockService blockService;
    private final S3Client s3Client;
    private final S3Presigner s3Presigner;

    @Value("${app.s3.bucket}")
    private String s3Bucket;

    @Value("${app.s3.region}")
    private String s3Region;

    private String s3BaseUrl() {
        return "https://" + s3Bucket + ".s3." + s3Region + ".amazonaws.com";
    }

    @Transactional
    public PostResponse create(String email, CreatePostRequest req) {
        User user = findUserByEmail(email);
        if (!user.isAdult50s()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "50대 이상만 게시글을 작성할 수 있습니다.");
        }
        String expectedPrefix = "posts/" + user.getId() + "/";
        if (req.photoObjectKeys() != null) {
            for (String key : req.photoObjectKeys()) {
                if (!key.startsWith(expectedPrefix)) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "잘못된 이미지 경로입니다.");
                }
            }
        }
        Post post = Post.builder()
                .user(user)
                .category(req.category())
                .title(req.title())
                .content(req.content())
                .build();
        if (req.photoObjectKeys() != null) {
            for (int i = 0; i < req.photoObjectKeys().size(); i++) {
                post.getPhotos().add(
                        PostPhoto.builder()
                                .post(post)
                                .objectKey(req.photoObjectKeys().get(i))
                                .sortOrder(i)
                                .build());
            }
        }
        postRepository.save(post);
        return PostResponse.of(post, 0, null, Map.of(), 0, s3BaseUrl());
    }

    @Transactional
    public PostResponse getById(String email, Long id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new PostNotFoundException("게시글을 찾을 수 없습니다."));
        post.incrementViewCount();
        User user = findUserByEmail(email);

        long likeCount = likeRepository.countByPostId(id);
        long commentCount = commentRepository.countByPostId(id);

        Map<String, Long> reactionCounts = buildReactionCountMap(likeRepository.countByReactionTypeForPost(id));
        ReactionType myReactionType = likeRepository.findByUserIdAndPostId(user.getId(), id)
                .map(com.starterkit.domain.like.entity.Like::getReactionType)
                .orElse(null);

        return PostResponse.of(post, likeCount, myReactionType, reactionCounts, commentCount, s3BaseUrl());
    }

    public PostPageResponse getList(PostCategory category, int page, String email) {
        User user = findUserByEmail(email);
        List<Long> blockedIds = blockService.getBlockedUserIds(user.getId());
        PageRequest pageRequest = PageRequest.of(page, 10);

        Page<Post> postPage;
        if (category != null) {
            postPage = blockedIds.isEmpty()
                    ? postRepository.findByCategoryOrderByCreatedAtDesc(category, pageRequest)
                    : postRepository.findByCategoryExcludingUsersOrderByCreatedAtDesc(category, blockedIds, pageRequest);
        } else {
            postPage = blockedIds.isEmpty()
                    ? postRepository.findAllByOrderByCreatedAtDesc(pageRequest)
                    : postRepository.findAllExcludingUsersOrderByCreatedAtDesc(blockedIds, pageRequest);
        }

        List<PostSummaryResponse> summaries = postPage.getContent().stream()
                .map(p -> PostSummaryResponse.of(
                        p,
                        commentRepository.countByPostId(p.getId()),
                        likeRepository.countByPostId(p.getId()),
                        s3BaseUrl()))
                .toList();

        return new PostPageResponse(summaries, postPage.getNumber(), postPage.getTotalPages(), postPage.getTotalElements());
    }

    @Transactional
    public void delete(String email, Long id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new PostNotFoundException("게시글을 찾을 수 없습니다."));
        User user = findUserByEmail(email);
        if (!post.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "본인 게시글만 삭제할 수 있습니다.");
        }
        likeRepository.deleteByPostId(id);
        commentRepository.deleteByPostId(id);
        post.getPhotos().forEach(p ->
                s3Client.deleteObject(DeleteObjectRequest.builder()
                        .bucket(s3Bucket)
                        .key(p.getObjectKey())
                        .build()));
        postRepository.delete(post);
    }

    public PhotoUploadUrlResponse generatePhotoUploadUrl(PhotoUploadUrlRequest request, UserDetails userDetails) {
        if (!List.of("image/jpeg", "image/png").contains(request.contentType())) {
            throw new IllegalArgumentException("허용되지 않는 파일 형식입니다. image/jpeg 또는 image/png만 허용됩니다.");
        }

        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다."));

        String ext = request.contentType().equals("image/jpeg") ? "jpg" : "png";
        String objectKey = "posts/" + user.getId() + "/" + UUID.randomUUID() + "." + ext;

        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(s3Bucket)
                .key(objectKey)
                .contentType(request.contentType())
                .build();

        PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                .signatureDuration(Duration.ofSeconds(300))
                .putObjectRequest(putObjectRequest)
                .build();

        PresignedPutObjectRequest presignedRequest = s3Presigner.presignPutObject(presignRequest);

        return new PhotoUploadUrlResponse(presignedRequest.url().toString(), objectKey, 300);
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다."));
    }

    private Map<String, Long> buildReactionCountMap(List<Object[]> rows) {
        Map<String, Long> counts = new LinkedHashMap<>();
        for (Object[] row : rows) {
            ReactionType rt = (ReactionType) row[0];
            Long cnt = (Long) row[1];
            counts.put(rt.name(), cnt);
        }
        return counts;
    }
}
