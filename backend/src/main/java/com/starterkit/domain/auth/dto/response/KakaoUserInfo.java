package com.starterkit.domain.auth.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

public record KakaoUserInfo(
        Long id,
        @JsonProperty("kakao_account") KakaoAccount kakaoAccount) {

    public record KakaoAccount(
            String email,
            KakaoProfile profile) {
    }

    public record KakaoProfile(String nickname) {
    }

    public String getEmail() {
        return kakaoAccount != null ? kakaoAccount.email() : null;
    }

    public String getNickname() {
        return kakaoAccount != null && kakaoAccount.profile() != null
                ? kakaoAccount.profile().nickname() : null;
    }
}
