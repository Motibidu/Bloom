package com.starterkit.domain.checkin.service;

import com.starterkit.domain.checkin.dto.request.CreateCheckinRequest;
import com.starterkit.domain.checkin.dto.request.PhotoUploadUrlRequest;
import com.starterkit.domain.checkin.dto.response.*;
import com.starterkit.domain.checkin.entity.Category;
import com.starterkit.domain.checkin.entity.Checkin;
import com.starterkit.domain.checkin.repository.CheckinRepository;
import com.starterkit.domain.comment.repository.CommentRepository;
import com.starterkit.domain.like.entity.ReactionType;
import com.starterkit.domain.like.repository.LikeRepository;
import com.starterkit.domain.user.entity.User;
import com.starterkit.domain.user.repository.UserRepository;
import com.starterkit.global.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
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
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CheckinService {

        private final CheckinRepository checkinRepository;
        private final UserRepository userRepository;
        private final CommentRepository commentRepository;
        private final LikeRepository likeRepository;
        private final S3Client s3Client;
        private final S3Presigner s3Presigner;

        @Value("${app.s3.bucket}")
        private String s3Bucket;

        @Value("${app.s3.region}")
        private String s3Region;

        private String s3BaseUrl() {
                return "https://" + s3Bucket + ".s3." + s3Region + ".amazonaws.com";
        }

        private LocalDateTime[] todayKstRange() {
                LocalDate today = LocalDate.now(ZoneId.of("Asia/Seoul"));
                LocalDateTime startUtc = today.atStartOfDay(ZoneId.of("Asia/Seoul"))
                                .withZoneSameInstant(ZoneId.of("UTC")).toLocalDateTime();
                LocalDateTime endUtc = today.plusDays(1).atStartOfDay(ZoneId.of("Asia/Seoul"))
                                .withZoneSameInstant(ZoneId.of("UTC")).toLocalDateTime();
                return new LocalDateTime[] { startUtc, endUtc };
        }

        @Transactional
        public CheckinResponse create(String email, CreateCheckinRequest req) {
                User user = findUserByEmail(email);
                if (!user.isAdult50s()) {
                        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "50대 이상만 활동을 기록할 수 있습니다.");
                }
                String expectedPrefix = "checkins/" + user.getId() + "/";
                if (req.photoObjectKeys() != null) {
                        for (String key : req.photoObjectKeys()) {
                                if (!key.startsWith(expectedPrefix)) {
                                        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "잘못된 이미지 경로입니다.");
                                }
                        }
                }
                Checkin checkin = Checkin.builder()
                                .user(user)
                                .category(req.category())
                                .title(req.title())
                                .description(req.description())
                                .build();
                if (req.photoObjectKeys() != null) {
                        for (int i = 0; i < req.photoObjectKeys().size(); i++) {
                                checkin.getPhotos().add(
                                        com.starterkit.domain.checkin.entity.CheckinPhoto.builder()
                                                .checkin(checkin)
                                                .objectKey(req.photoObjectKeys().get(i))
                                                .sortOrder(i)
                                                .build());
                        }
                }
                checkinRepository.save(checkin);
                return CheckinResponse.of(checkin, 0, false, 0, s3BaseUrl());
        }

        @Transactional
        public void delete(String email, Long id) {
                Checkin checkin = checkinRepository.findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException("체크인을 찾을 수 없습니다."));
                User user = findUserByEmail(email);
                if (!checkin.getUser().getId().equals(user.getId())) {
                        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "본인의 체크인만 삭제할 수 있습니다.");
                }
                likeRepository.deleteByCheckinId(id);
                commentRepository.deleteByCheckinId(id);
                checkin.getPhotos().forEach(p ->
                        s3Client.deleteObject(DeleteObjectRequest.builder()
                                        .bucket(s3Bucket)
                                        .key(p.getObjectKey())
                                        .build()));
                checkinRepository.delete(checkin);
        }

        @Transactional
        public CheckinResponse getById(String email, Long id) {
                Checkin checkin = checkinRepository.findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException("체크인을 찾을 수 없습니다."));
                checkin.incrementViewCount();
                User user = findUserByEmail(email);
                long likeCount = checkinRepository.countLikesByCheckinId(id);
                boolean likedByMe = checkinRepository.existsLikeByCheckinIdAndUserId(id, user.getId());
                long commentCount = checkinRepository.countCommentsByCheckinId(id);

                // 리액션 집계
                List<Object[]> reactionRows = likeRepository.countByReactionTypeForCheckin(id);
                Map<String, Long> reactionCounts = buildReactionCountMap(reactionRows);

                // 내 리액션 타입 조회
                List<Object[]> myReactions = checkinRepository.findReactionsByUserIdAndCheckinIds(List.of(id), user.getId());
                ReactionType myReactionType = myReactions.isEmpty() ? null : (ReactionType) myReactions.get(0)[1];

                return CheckinResponse.of(checkin, likeCount, likedByMe, myReactionType, reactionCounts, commentCount, s3BaseUrl());
        }

        public TodayFeedResponse getTodayFeed(String email, List<Long> followingIds) {
                User user = findUserByEmail(email);
                LocalDateTime[] range = todayKstRange();
                List<Checkin> checkins;
                if (followingIds != null) {
                        // 팔로우 피드: 팔로잉 목록이 없으면 빈 결과 반환
                        if (followingIds.isEmpty()) {
                                return new TodayFeedResponse(List.of(), 0);
                        }
                        checkins = checkinRepository.findByUserIdsOrderByCreatedAtDesc(followingIds);
                } else {
                        checkins = checkinRepository.findAllByOrderByCreatedAtDesc();
                }

                if (checkins.isEmpty()) {
                        return new TodayFeedResponse(List.of(), 0);
                }

                List<Long> checkinIds = checkins.stream().map(Checkin::getId).toList();

                // 벌크 집계 — 쿼리로 N+1 해소
                Map<Long, Long> likeCountMap = checkinRepository.countLikesByCheckinIds(checkinIds)
                                .stream().collect(Collectors.toMap(r -> (Long) r[0], r -> (Long) r[1]));
                Map<Long, Long> commentCountMap = checkinRepository.countCommentsByCheckinIds(checkinIds)
                                .stream().collect(Collectors.toMap(r -> (Long) r[0], r -> (Long) r[1]));

                // 리액션 집계: checkinId → Map<reactionTypeName, count>
                Map<Long, Map<String, Long>> reactionCountsMap = new HashMap<>();
                List<Object[]> reactionBulk = likeRepository.countByReactionTypeForCheckinIds(checkinIds);
                for (Object[] row : reactionBulk) {
                        Long cId = (Long) row[0];
                        ReactionType rt = (ReactionType) row[1];
                        Long cnt = (Long) row[2];
                        reactionCountsMap.computeIfAbsent(cId, k -> new LinkedHashMap<>()).put(rt.name(), cnt);
                }

                // 내 리액션: checkinId → ReactionType
                Map<Long, ReactionType> myReactionMap = new HashMap<>();
                List<Object[]> myReactions = checkinRepository.findReactionsByUserIdAndCheckinIds(checkinIds, user.getId());
                for (Object[] row : myReactions) {
                        myReactionMap.put((Long) row[0], (ReactionType) row[1]);
                }

                List<Category> myCategories = checkinRepository.findMyCategoriesToday(user.getId(), range[0], range[1]);
                long sameCategoryUserCount = myCategories.isEmpty() ? 0
                                : checkinRepository.countDistinctUsersByCategories(range[0], range[1], myCategories, user.getId());

                List<CheckinResponse> responses = checkins.stream()
                                .map(c -> CheckinResponse.of(c,
                                                likeCountMap.getOrDefault(c.getId(), 0L),
                                                myReactionMap.containsKey(c.getId()),
                                                myReactionMap.get(c.getId()),
                                                reactionCountsMap.getOrDefault(c.getId(), Map.of()),
                                                commentCountMap.getOrDefault(c.getId(), 0L),
                                                s3BaseUrl()))
                                .toList();
                return new TodayFeedResponse(responses, sameCategoryUserCount);
        }

        public List<CheckinResponse> getMyCheckins(String email, String date) {
                User user = findUserByEmail(email);
                LocalDate localDate = LocalDate.parse(date, DateTimeFormatter.ISO_LOCAL_DATE);
                LocalDateTime startUtc = localDate.atStartOfDay(ZoneId.of("Asia/Seoul"))
                                .withZoneSameInstant(ZoneId.of("UTC")).toLocalDateTime();
                LocalDateTime endUtc = localDate.plusDays(1).atStartOfDay(ZoneId.of("Asia/Seoul"))
                                .withZoneSameInstant(ZoneId.of("UTC")).toLocalDateTime();
                return checkinRepository
                                .findByUserIdAndCreatedAtBetweenOrderByCreatedAtAsc(user.getId(), startUtc, endUtc)
                                .stream()
                                .map(c -> CheckinResponse.of(c, 0, false, 0, s3BaseUrl()))
                                .toList();
        }

        public List<CalendarDayEntry> getMyCalendar(String email, int year, int month) {
                User user = findUserByEmail(email);
                LocalDate startDate = LocalDate.of(year, month, 1);
                LocalDate endDate = startDate.plusMonths(1);
                LocalDateTime startUtc = startDate.atStartOfDay(ZoneId.of("Asia/Seoul"))
                                .withZoneSameInstant(ZoneId.of("UTC")).toLocalDateTime();
                LocalDateTime endUtc = endDate.atStartOfDay(ZoneId.of("Asia/Seoul"))
                                .withZoneSameInstant(ZoneId.of("UTC")).toLocalDateTime();
                List<Checkin> checkins = checkinRepository.findByUserIdAndCreatedAtBetweenOrderByCreatedAtDesc(
                                user.getId(), startUtc, endUtc);
                Map<String, List<Category>> grouped = new LinkedHashMap<>();
                for (Checkin c : checkins) {
                        String dateStr = c.getCreatedAt()
                                        .atZone(ZoneId.of("UTC"))
                                        .withZoneSameInstant(ZoneId.of("Asia/Seoul"))
                                        .toLocalDate()
                                        .format(DateTimeFormatter.ISO_LOCAL_DATE);
                        grouped.computeIfAbsent(dateStr, k -> new ArrayList<>()).add(c.getCategory());
                }
                return grouped.entrySet().stream()
                                .sorted(Map.Entry.comparingByKey())
                                .map(e -> new CalendarDayEntry(e.getKey(), e.getValue()))
                                .toList();
        }

        public List<CategoryStats> getMyCategoryStats(String email, int year, int month) {
                User user = findUserByEmail(email);
                LocalDate startDate = LocalDate.of(year, month, 1);
                LocalDate endDate = startDate.plusMonths(1);
                LocalDateTime startUtc = startDate.atStartOfDay(ZoneId.of("Asia/Seoul"))
                                .withZoneSameInstant(ZoneId.of("UTC")).toLocalDateTime();
                LocalDateTime endUtc = endDate.atStartOfDay(ZoneId.of("Asia/Seoul"))
                                .withZoneSameInstant(ZoneId.of("UTC")).toLocalDateTime();
                List<Checkin> checkins = checkinRepository.findByUserIdAndCreatedAtBetweenOrderByCreatedAtDesc(
                                user.getId(), startUtc, endUtc);
                Map<Category, Long> countMap = checkins.stream()
                                .collect(Collectors.groupingBy(Checkin::getCategory, Collectors.counting()));
                return countMap.entrySet().stream()
                                .map(e -> new CategoryStats(e.getKey(), e.getValue()))
                                .sorted(Comparator.comparingLong(CategoryStats::count).reversed())
                                .toList();
        }

        public MonthlyReportResponse getMonthlyReport(String email, int year, int month) {
                User user = findUserByEmail(email);
                ZoneId kst = ZoneId.of("Asia/Seoul");

                ZonedDateTime kstStart = ZonedDateTime.of(year, month, 1, 0, 0, 0, 0, kst);
                ZonedDateTime kstEnd = kstStart.plusMonths(1);
                LocalDateTime utcStart = kstStart.withZoneSameInstant(ZoneOffset.UTC).toLocalDateTime();
                LocalDateTime utcEnd = kstEnd.withZoneSameInstant(ZoneOffset.UTC).toLocalDateTime();

                List<Checkin> checkins = checkinRepository.findByUserIdAndDateRange(user.getId(), utcStart, utcEnd);

                // 카테고리별 집계
                Map<String, Integer> categoryStats = new LinkedHashMap<>();
                for (Checkin c : checkins) {
                        String key = c.getCategory().name();
                        categoryStats.merge(key, 1, Integer::sum);
                }

                // 활동 날짜(KST 일) 집계 — 중복 제거 후 정렬
                Set<Integer> activeDaySet = new TreeSet<>();
                for (Checkin c : checkins) {
                        int day = c.getCreatedAt()
                                .atZone(ZoneOffset.UTC)
                                .withZoneSameInstant(kst)
                                .getDayOfMonth();
                        activeDaySet.add(day);
                }
                List<Integer> activeDays = new ArrayList<>(activeDaySet);

                int totalDays = activeDays.size();
                int totalCheckins = checkins.size();

                // 가장 많은 카테고리
                String mostActiveCategory = categoryStats.entrySet().stream()
                        .max(Map.Entry.comparingByValue())
                        .map(Map.Entry::getKey)
                        .orElse(null);

                // 현재 연속 활동 일수 (오늘 KST 기준 역순)
                LocalDate today = LocalDate.now(kst);
                int currentStreak = 0;
                LocalDate cursor = today;
                while (activeDaySet.contains(cursor.getDayOfMonth())
                        && cursor.getYear() == year
                        && cursor.getMonthValue() == month) {
                        currentStreak++;
                        cursor = cursor.minusDays(1);
                }

                // 해당 월 최장 연속 활동 일수
                int longestStreak = 0;
                int streak = 0;
                int daysInMonth = kstStart.toLocalDate().lengthOfMonth();
                for (int d = 1; d <= daysInMonth; d++) {
                        if (activeDaySet.contains(d)) {
                                streak++;
                                longestStreak = Math.max(longestStreak, streak);
                        } else {
                                streak = 0;
                        }
                }

                return new MonthlyReportResponse(
                        year, month, totalDays, totalCheckins,
                        categoryStats, activeDays, mostActiveCategory,
                        currentStreak, longestStreak
                );
        }

        public PhotoUploadUrlResponse generatePhotoUploadUrl(PhotoUploadUrlRequest request, UserDetails userDetails) {
                if (!List.of("image/jpeg", "image/png").contains(request.contentType())) {
                        throw new IllegalArgumentException("허용되지 않는 파일 형식입니다. image/jpeg 또는 image/png만 허용됩니다.");
                }

                User user = userRepository.findByEmail(userDetails.getUsername())
                                .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다."));

                String ext = request.contentType().equals("image/jpeg") ? "jpg" : "png";
                String objectKey = "checkins/" + user.getId() + "/" + UUID.randomUUID() + "." + ext;

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

                return new PhotoUploadUrlResponse(
                                presignedRequest.url().toString(),
                                objectKey,
                                300);
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
