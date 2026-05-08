package com.starterkit.domain.user.service;

import com.starterkit.domain.user.dto.response.UserResponse;
import com.starterkit.domain.user.repository.UserRepository;
import com.starterkit.global.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;

    public UserResponse findByEmail(String email) {
        return userRepository.findByEmail(email)
                .map(UserResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    public Map<String, Boolean> checkNickname(String nickname) {
        boolean available = !userRepository.existsByNickname(nickname);
        return Map.of("available", available);
    }
}
