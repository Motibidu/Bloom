package com.starterkit.domain.auth.service;

import com.starterkit.domain.auth.entity.EmailVerification;
import com.starterkit.domain.auth.exception.EmailVerificationException;
import com.starterkit.domain.auth.repository.EmailVerificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
public class EmailVerificationService {

    private static final int CODE_LENGTH = 6;
    private static final int EXPIRE_MINUTES = 10;

    private final EmailVerificationRepository emailVerificationRepository;
    private final JavaMailSender mailSender;

    public void sendCode(String email) {
        emailVerificationRepository.deleteAllByEmail(email);

        String code = generateCode();
        EmailVerification verification = EmailVerification.builder()
                .email(email)
                .code(code)
                .expiresAt(LocalDateTime.now().plusMinutes(EXPIRE_MINUTES))
                .verified(false)
                .build();
        emailVerificationRepository.save(verification);

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("[오늘 뭐 했어요?] 이메일 인증 코드");
        message.setText(String.format(
                "안녕하세요!\n\n이메일 인증 코드: %s\n\n10분 이내에 입력해 주세요.",
                code));
        mailSender.send(message);
    }

    public void verifyCode(String email, String code) {
        EmailVerification verification = emailVerificationRepository
                .findTopByEmailOrderByCreatedAtDesc(email)
                .orElseThrow(() -> new EmailVerificationException("인증 코드를 먼저 발송해 주세요"));

        if (verification.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new EmailVerificationException("인증 코드가 만료되었어요. 다시 발송해 주세요");
        }
        if (!verification.getCode().equals(code)) {
            throw new EmailVerificationException("인증 코드가 일치하지 않아요");
        }

        verification.setVerified(true);
    }

    @Transactional(readOnly = true)
    public boolean isVerified(String email) {
        return emailVerificationRepository.existsByEmailAndVerifiedTrue(email);
    }

    private String generateCode() {
        SecureRandom random = new SecureRandom();
        int number = random.nextInt(1_000_000);
        return String.format("%06d", number);
    }
}
