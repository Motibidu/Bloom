package com.starterkit.domain.comment.service;

import com.starterkit.domain.block.service.BlockService;
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
import org.springframework.security.access.AccessDeniedException;
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
    private final BlockService blockService;

    public List<CommentResponse> getComments(Long checkinId, UserDetails userDetails) {
        checkinRepository.findById(checkinId)
                .orElseThrow(() -> new ResourceNotFoundException("체크인을 찾을 수 없습니다."));
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다."));
        List<Long> blockedIds = blockService.getBlockedUserIds(user.getId());
        if (!blockedIds.isEmpty()) {
            return commentRepository.findRootCommentsByCheckinIdExcludingUsers(checkinId, blockedIds)
                    .stream()
                    .map(CommentResponse::from)
                    .toList();
        }
        return commentRepository.findRootCommentsByCheckinId(checkinId)
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

        Comment parent = null;
        if (req.parentId() != null) {
            parent = commentRepository.findById(req.parentId())
                    .orElseThrow(() -> new ResourceNotFoundException("부모 댓글을 찾을 수 없습니다."));
        }

        String content = req.content() != null ? req.content() : "";
        Comment comment = Comment.builder()
                .user(user)
                .checkin(checkin)
                .parent(parent)
                .content(content)
                .commentType(req.resolvedCommentType())
                .praiseCardType(req.praiseCardType())
                .build();

        CommentResponse response = CommentResponse.fromReply(commentRepository.save(comment));

        if (!checkin.getUser().getId().equals(user.getId())) {
            boolean isReply = parent != null;
            String msg = isReply
                    ? user.getNickname() + "님이 대댓글을 남겼어요"
                    : user.getNickname() + "님이 댓글을 남겼어요";
            Long notifyUserId = isReply ? parent.getUser().getId() : checkin.getUser().getId();
            notificationService.sendPush(notifyUserId, isReply ? "새 대댓글" : "새 댓글", msg);
            notificationService.sendInApp(
                    notifyUserId,
                    user.getNickname(),
                    com.starterkit.domain.notification.entity.NotificationType.COMMENT,
                    checkinId,
                    msg
            );
        }

        return response;
    }

    @Transactional
    public void deleteComment(Long commentId, UserDetails userDetails) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("댓글을 찾을 수 없습니다."));
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다."));
        if (!comment.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("본인 댓글만 삭제할 수 있습니다.");
        }
        commentRepository.delete(comment);
    }

    @Transactional
    public CommentResponse updateComment(Long commentId, String content, UserDetails userDetails) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("댓글을 찾을 수 없습니다."));
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다."));
        if (!comment.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("본인 댓글만 수정할 수 있습니다.");
        }
        comment.updateContent(content);
        return CommentResponse.from(comment);
    }
}
