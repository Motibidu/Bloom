package com.starterkit.global.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;

import jakarta.annotation.PostConstruct;

@Slf4j
@Configuration
public class FirebaseConfig {

    @Value("${app.push.firebase-service-account}")
    private String serviceAccountPath;

    private final ResourceLoader resourceLoader;

    public FirebaseConfig(ResourceLoader resourceLoader) {
        this.resourceLoader = resourceLoader;
    }

    @PostConstruct
    public void initialize() {
        if (!FirebaseApp.getApps().isEmpty()) {
            return;
        }
        try {
            Resource resource = resourceLoader.getResource(serviceAccountPath);
            GoogleCredentials credentials = GoogleCredentials.fromStream(resource.getInputStream());
            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(credentials)
                    .build();
            FirebaseApp.initializeApp(options);
            log.info("Firebase Admin SDK 초기화 완료");
        } catch (Exception e) {
            log.warn("Firebase Admin SDK 초기화 실패 — FCM 발송 비활성화: {}", e.getMessage());
        }
    }
}
