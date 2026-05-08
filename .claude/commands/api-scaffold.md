# /api-scaffold

새 API 리소스에 필요한 모든 파일을 이 프로젝트의 패턴에 맞게 생성합니다.

## 사용법

```
/api-scaffold <ResourceName> "<한글 설명>" <field1>:<Type1> <field2>:<Type2> ...
```

**예시:**
```
/api-scaffold Post "게시글" title:String content:String authorId:Long
/api-scaffold Product "상품" name:String price:Long stock:Integer
```

## 생성 규칙

아래 규칙을 **반드시** 따릅니다.

### 공통
- `ResourceName`은 PascalCase. `{resource}`는 소문자형 (예: `Post` → `post`). URL은 소문자 복수형(`/api/posts`).
- 인자로 받은 필드 외에 `id:Long`, `createdAt:LocalDateTime`, `updatedAt:LocalDateTime`을 Entity에 자동 추가.

---

### 백엔드 (6개 파일)

**1. `backend/src/main/java/com/starterkit/domain/{resource}/entity/{ResourceName}.java`**
- 패키지: `com.starterkit.domain.{resource}.entity`
- `@Entity`, `@Table(name = "{resource}s")`
- Lombok: `@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder`
- `@Id @GeneratedValue(strategy = GenerationType.IDENTITY)` — `id` 필드
- `@PrePersist` / `@PreUpdate`로 `createdAt` / `updatedAt` 자동 관리
- `domain/user/entity/User.java` 패턴 참고

**2. `backend/src/main/java/com/starterkit/domain/{resource}/repository/{ResourceName}Repository.java`**
- 패키지: `com.starterkit.domain.{resource}.repository`
- `JpaRepository<{ResourceName}, Long>` 확장
- `domain/user/repository/UserRepository.java` 패턴 참고

**3. `backend/src/main/java/com/starterkit/domain/{resource}/dto/request/{ResourceName}Request.java`**
- 패키지: `com.starterkit.domain.{resource}.dto.request`
- Java `record` 사용 (인자로 받은 필드만 포함, `id`/`createdAt`/`updatedAt` 제외)

**4. `backend/src/main/java/com/starterkit/domain/{resource}/dto/response/{ResourceName}Response.java`**
- 패키지: `com.starterkit.domain.{resource}.dto.response`
- Java `record` 사용
- `public static {ResourceName}Response from({ResourceName} entity)` 정적 팩토리 메서드 포함
- `domain/user/dto/response/UserResponse.java` 패턴 참고

**5. `backend/src/main/java/com/starterkit/domain/{resource}/service/{ResourceName}Service.java`**
- 패키지: `com.starterkit.domain.{resource}.service`
- `@Service @RequiredArgsConstructor @Transactional(readOnly = true)`
- `findAll()`, `findById(Long id)`, `create({ResourceName}Request request)`, `update(Long id, {ResourceName}Request request)`, `delete(Long id)` 메서드 구현
- `ResourceNotFoundException` import: `com.starterkit.global.exception.ResourceNotFoundException`
- `create` / `update` / `delete`에는 `@Transactional` 별도 추가
- `domain/user/service/UserService.java` 패턴 참고

**6. `backend/src/main/java/com/starterkit/domain/{resource}/controller/{ResourceName}Controller.java`**
- 패키지: `com.starterkit.domain.{resource}.controller`
- `@RestController @RequestMapping("/api/{resources}") @RequiredArgsConstructor`
- Swagger: `@Tag(name = "{ResourceName}") @SecurityRequirement(name = "bearerAuth")`
- `@Operation(summary = "...")` 한글로 작성
- CRUD 엔드포인트: `GET /`, `GET /{id}`, `POST /`, `PUT /{id}`, `DELETE /{id}`
- `domain/user/controller/UserController.java` 패턴 참고

---

### 프론트엔드 (2개 파일)

**7. `frontend/src/types/{resource}.ts`**
- `export interface {ResourceName}` — 인자로 받은 필드 + `id`, `createdAt`, `updatedAt`
- `export interface {ResourceName}Request` — 인자로 받은 필드만

**8. `frontend/src/hooks/use{ResourceName}.ts`**
- `import api from '@/lib/api'` — **반드시 이 인스턴스만 사용**, 직접 axios import 금지
- `use{ResourceName}List()` — `useQuery`, queryKey: `['{resource}s']`
- `use{ResourceName}(id)` — `useQuery`, queryKey: `['{resource}s', id]`
- `useCreate{ResourceName}()` — `useMutation`, 성공 시 `['{resource}s']` invalidate
- `useUpdate{ResourceName}()` — `useMutation`, 성공 시 해당 queryKey invalidate
- `useDelete{ResourceName}()` — `useMutation`, 성공 시 `['{resource}s']` invalidate
- `useUser.ts` 패턴 참고

---

## 생성 후 안내

모든 파일 생성이 끝나면 아래 내용을 출력합니다.

```
생성 완료 ({ResourceName})
──────────────────────────────
백엔드
  domain/{resource}/entity/        {ResourceName}.java
  domain/{resource}/repository/    {ResourceName}Repository.java
  domain/{resource}/dto/request/   {ResourceName}Request.java
  domain/{resource}/dto/response/  {ResourceName}Response.java
  domain/{resource}/service/       {ResourceName}Service.java
  domain/{resource}/controller/    {ResourceName}Controller.java

프론트엔드
  types/           {resource}.ts
  hooks/           use{ResourceName}.ts

다음 단계
  1. SecurityConfig.java — 새 엔드포인트 공개/보호 여부 확인
  2. 백엔드 서버 재시작 후 Swagger에서 확인: http://localhost:8080/swagger-ui.html
  3. 필요 시 {ResourceName}Response에 연관 엔티티 필드 추가
```
