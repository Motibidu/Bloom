# 블룸 앱 배포 가이드

## 사전 준비

### 1. EAS CLI 설치 및 로그인

```bash
npm install -g eas-cli
eas login
```

expo.dev에서 무료 계정을 생성한 후 로그인합니다.

### 2. 프로젝트를 EAS에 연결

```bash
cd mobile
eas init
```

생성된 `projectId`가 `app.json`의 `extra.eas.projectId`에 자동으로 추가됩니다.

---

## 환경 변수 설정

`eas.json`의 `env.EXPO_PUBLIC_WEBVIEW_URL`을 실제 도메인으로 교체합니다.

`app.json`의 `extra.webviewUrl`도 동일하게 맞춰줍니다:

```json
"extra": {
  "webviewUrl": "https://your-production-domain.com"
}
```

---

## 빌드

### Android

```bash
eas build --platform android --profile production
```

### iOS

```bash
eas build --platform ios --profile production
```

> iOS 빌드는 Apple Developer Program 가입($99/년)이 필요합니다.

### 인증서 자동 관리

처음 빌드 시 EAS가 인증서를 자동으로 생성합니다:

```bash
eas credentials
```

---

## 앱 스토어 제출

### Google Play Store

1. [Google Play Console](https://play.google.com/console)에서 앱 생성
2. 앱 패키지명: `com.bloom.app`
3. 첫 빌드는 직접 업로드 (`.aab` 파일):
   ```bash
   eas build --platform android --profile production
   # 빌드 완료 후 다운로드한 .aab 파일을 Play Console에 업로드
   ```
4. 이후 자동 제출:
   ```bash
   eas submit --platform android --profile production
   ```

### Apple App Store

1. [App Store Connect](https://appstoreconnect.apple.com)에서 앱 생성
2. Bundle ID: `com.bloom.app`
3. 제출:
   ```bash
   eas submit --platform ios --profile production
   ```

---

## 개발용 빌드 (실기기 테스트)

Expo Go 대신 개발 클라이언트를 사용하면 네이티브 모듈(연락처, 카메라 등)을 테스트할 수 있습니다:

```bash
eas build --platform android --profile development
# 빌드된 .apk를 기기에 설치 후:
npx expo start --dev-client
```

### Expo Go로 빠른 테스트 (네이티브 기능 제외)

```bash
npx expo start
# QR 코드를 Expo Go 앱으로 스캔
```

WebView URL은 개발 PC의 실제 IP로 설정해야 합니다 (Android 에뮬레이터: `10.0.2.2`, 실기기: PC IP 주소).

---

## 업데이트 배포 (OTA)

앱 스토어 심사 없이 JS 코드만 업데이트:

```bash
eas update --branch production --message "버그 수정"
```

> 네이티브 코드(권한, 새 모듈 추가)가 변경된 경우 반드시 새 빌드가 필요합니다.
