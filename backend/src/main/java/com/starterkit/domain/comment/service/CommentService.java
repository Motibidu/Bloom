package com.starterkit.domain.comment.service;

import com.starterkit.domain.checkin.entity.Checkin;
import com.starterkit.domain.checkin.repository.CheckinRepository;
import com.starterkit.domain.comment.dto.request.CreateCommentRequest;
import com.starterkit.domain.comment.dto.response.CommentResponse;
import com.starterkit.domain.comment.entity.Comment;
import com.starterkit.domain.comment.repository.CommentRepository;
import com.starterkit.domain.notification.service.NotificationService;
import com.starterkit.domain.user.entity.User;
import com.starterkit.domain.user.repository.UserRepository;
import com.starterkit.global.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CommentService {

    private final CheckinRepository checkinRepository;
    private final CommentRepository commentRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public List<CommentResponse> getComments(Long checkinId) {
        checkinRepository.findById(checkinId)
                .orElseThrow(() -> new ResourceNotFoundException("체크인을 찾을 수 없습니다."));
        return commentRepository.findByCheckinIdOrderByCreatedAtDesc(checkinId)
                .stream()
                .map(CommentResponse::from)
                .toList();
    }

    @Transactional
    public CommentResponse addComment(Long checkinId, CreateCommentRequest req, UserDetails userDetails) {
        Checkin checkin = checkinRepository.findById(checkinId)
                .orElseThrow(() -> new ResourceNotFoundException("체크인을 찾을 수 없습니다."));
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다."));

        String content = req.content() != null ? req.content() : "";
        Comment comment = Comment.builder()
                .user(user)
                .checkin(checkin)
                .content(content)
                .commentType(req.resolvedCommentType())
                .praiseCardType(req.praiseCardType())
                .build();

        CommentResponse response = CommentResponse.from(commentRepository.save(comment));

        if (!checkin.getUser().getId().equals(user.getId())) {
            String msg = user.getNickname() + "님이 댓글을 남겼어요";
            notificationService.sendPush(checkin.getUser().getId(), "새 댓글", msg);
            notificationService.sendInApp(
                    checkin.getUser().getId(),
                    user.getNickname(),
                    com.starterkit.domain.notification.entity.NotificationType.COMMENT,
                    checkinId,
                    msg
            );
        }

        return response;
    }
}
