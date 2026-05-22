import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ArrowLeft, CheckCircle2, XCircle, Loader2, User, FileText, Save, Camera } from 'lucide-react'
import { useCurrentUser, useUpdateProfile, useProfileImageUrl } from '@/hooks/useUser'
import api from '@/lib/api'

// ── 디자인 토큰 (프로젝트 공통) ────────────────────────────────────────────
const main  = 'oklch(0.62 0.15 220)'
const dark  = 'oklch(0.48 0.15 220)'
const light = 'oklch(0.76 0.12 220)'
const mA = (a: number) => `oklch(0.62 0.15 220 / ${a})`
const lA = (a: number) => `oklch(0.76 0.12 220 / ${a})`
const grad  = `linear-gradient(135deg, ${main}, ${light})`

// ── Toast ───────────────────────────────────────────────────────────────────
function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 px-6 py-4 rounded-2xl text-base font-bold text-white shadow-lg"
      style={{
        background: type === 'success'
          ? `linear-gradient(135deg, oklch(0.55 0.16 145), oklch(0.65 0.14 155))`
          : `linear-gradient(135deg, oklch(0.55 0.18 25), oklch(0.65 0.16 30))`,
        boxShadow: type === 'success'
          ? '0 8px 32px oklch(0.55 0.16 145 / 0.35)'
          : '0 8px 32px oklch(0.55 0.18 25 / 0.35)',
        minWidth: '260px',
        maxWidth: '90vw',
        animation: 'toastIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
      }}
    >
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translate(-50%, -12px) scale(0.92); }
          to   { opacity: 1; transform: translate(-50%, 0)      scale(1); }
        }
      `}</style>
      {type === 'success'
        ? <CheckCircle2 size={22} aria-hidden="true" />
        : <XCircle size={22} aria-hidden="true" />}
      <span>{message}</span>
    </div>
  )
}

// ── 닉네임 상태 배지 ────────────────────────────────────────────────────────
type NicknameStatus = 'idle' | 'checking' | 'available' | 'duplicate' | 'same'

function NicknameBadge({ status }: { status: NicknameStatus }) {
  if (status === 'idle') return null

  const config = {
    checking:   { label: '확인 중…',    color: dark,                       bg: mA(0.10), icon: <Loader2 size={14} className="animate-spin" aria-hidden="true" /> },
    available:  { label: '사용 가능',   color: 'oklch(0.45 0.14 145)',     bg: 'oklch(0.45 0.14 145 / 0.10)', icon: <CheckCircle2 size={14} aria-hidden="true" /> },
    duplicate:  { label: '이미 사용 중', color: 'oklch(0.50 0.18 25)',    bg: 'oklch(0.50 0.18 25 / 0.10)',  icon: <XCircle size={14} aria-hidden="true" /> },
    same:       { label: '현재 닉네임',  color: 'oklch(0.55 0.04 220)',    bg: mA(0.08),                      icon: <CheckCircle2 size={14} aria-hidden="true" /> },
  }[status]

  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold"
      style={{ background: config.bg, color: config.color }}
      aria-live="polite"
    >
      {config.icon}
      {config.label}
    </span>
  )
}

// ── 폼 타입 ─────────────────────────────────────────────────────────────────
interface ProfileForm {
  nickname: string
  bio: string
}

// ── 페이지 ──────────────────────────────────────────────────────────────────
export default function ProfileEditPage() {
  const navigate = useNavigate()
  const { data: currentUser, isLoading } = useCurrentUser()
  const updateProfile = useUpdateProfile()

  const [nicknameStatus, setNicknameStatus] = useState<NicknameStatus>('idle')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [pendingObjectKey, setPendingObjectKey] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const getProfileImageUrl = useProfileImageUrl()

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileForm>({
    defaultValues: { nickname: '', bio: '' },
  })

  // 현재 유저 데이터로 폼 초기화
  useEffect(() => {
    if (currentUser) {
      reset({ nickname: currentUser.nickname, bio: currentUser.bio ?? '' })
    }
  }, [currentUser, reset])

  const watchedNickname = watch('nickname')
  const watchedBio = watch('bio')

  // 닉네임 중복 확인 (디바운스 500ms)
  const checkNickname = useCallback(
    (value: string) => {
      if (!currentUser) return
      if (!value || value.length < 2 || value.length > 12) {
        setNicknameStatus('idle')
        return
      }
      if (value === currentUser.nickname) {
        setNicknameStatus('same')
        return
      }
      setNicknameStatus('checking')
      if (debounceTimer) clearTimeout(debounceTimer)
      const t = setTimeout(async () => {
        try {
          const res = await api.get<{ available: boolean }>(
            `/users/check-nickname?nickname=${encodeURIComponent(value)}`
          )
          setNicknameStatus(res.data.available ? 'available' : 'duplicate')
        } catch {
          setNicknameStatus('idle')
        }
      }, 500)
      setDebounceTimer(t)
    },
    [currentUser, debounceTimer]
  )

  useEffect(() => {
    checkNickname(watchedNickname)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedNickname])

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 로컬 미리보기
    const reader = new FileReader()
    reader.onload = (ev) => setImagePreview(ev.target?.result as string)
    reader.readAsDataURL(file)

    setIsUploadingImage(true)
    try {
      // 1. Presigned URL 발급
      const { uploadUrl, objectKey } = await getProfileImageUrl.mutateAsync()
      // 2. S3에 직접 PUT
      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': 'image/jpeg' },
      })
      // 3. objectKey 저장 (onSubmit 시 서버로 전송)
      setPendingObjectKey(objectKey)
    } catch {
      showToast('이미지 업로드에 실패했어요. 다시 시도해 주세요.', 'error')
      setImagePreview(null)
    } finally {
      setIsUploadingImage(false)
      // input value 초기화 (같은 파일 재선택 허용)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const onSubmit = async (data: ProfileForm) => {
    if (nicknameStatus === 'duplicate') return
    try {
      await updateProfile.mutateAsync({
        nickname: data.nickname.trim(),
        bio: data.bio.trim() || undefined,
        profileImageObjectKey: pendingObjectKey ?? undefined,
      })
      showToast('프로필이 수정되었어요!', 'success')
      setTimeout(() => navigate('/me'), 1200)
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? '저장에 실패했어요. 다시 시도해 주세요.'
      showToast(msg, 'error')
    }
  }

  // ── 로딩 ──────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <main className="max-w-2xl mx-auto px-5 py-8">
        <div
          role="status"
          aria-live="polite"
          aria-label="프로필을 불러오는 중이에요"
          className="flex flex-col items-center gap-5 py-24"
        >
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center"
            style={{ background: mA(0.10) }}
            aria-hidden="true"
          >
            <svg className="animate-spin h-9 w-9" viewBox="0 0 24 24" fill="none" style={{ color: main }}>
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
          <p className="text-xl font-semibold text-muted-foreground">프로필을 불러오는 중이에요...</p>
        </div>
      </main>
    )
  }

  if (!currentUser) return null

  const canSave = (isDirty || !!pendingObjectKey) && nicknameStatus !== 'duplicate' && !updateProfile.isPending

  return (
    <main className="max-w-2xl mx-auto px-5 py-8 space-y-8">
      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} />}

      {/* 뒤로가기 */}
      <button
        type="button"
        onClick={() => navigate('/me')}
        aria-label="내 활동으로 돌아가기"
        className="inline-flex items-center gap-1.5 min-h-[48px] px-3 py-1 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 [-webkit-tap-highlight-color:transparent]"
        style={{ color: dark }}
        onMouseEnter={e => { e.currentTarget.style.background = mA(0.08) }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
      >
        <ArrowLeft size={20} aria-hidden="true" />
        <span className="text-base font-bold">내 활동으로</span>
      </button>

      {/* 헤더 카드 */}
      <header
        className="relative rounded-3xl px-7 py-8 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${mA(0.07)} 0%, ${lA(0.11)} 100%)`,
          border: `1px solid ${mA(0.14)}`,
        }}
      >
        {/* 배경 장식 */}
        <div
          className="absolute -top-10 -right-10 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: `radial-gradient(circle, ${lA(0.22)}, transparent 70%)` }}
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-8 -left-6 w-36 h-36 rounded-full pointer-events-none"
          style={{ background: `radial-gradient(circle, ${mA(0.13)}, transparent 70%)` }}
          aria-hidden="true"
        />

        <div className="relative flex items-center gap-5">
          {/* 아바타 */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 text-2xl font-black text-white"
            style={{ background: grad, boxShadow: `0 4px 16px ${mA(0.30)}` }}
            aria-hidden="true"
          >
            {currentUser.nickname?.[0] ?? '?'}
          </div>
          <div>
            <p className="text-sm font-bold mb-0.5" style={{ color: dark }}>프로필 편집</p>
            <h1 className="text-2xl font-black text-foreground">{currentUser.nickname}</h1>
            <p className="text-sm font-medium text-muted-foreground">{currentUser.email}</p>
          </div>
        </div>
      </header>

      {/* 숨겨진 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-hidden="true"
        onChange={handleImageChange}
      />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="rounded-3xl px-7 py-8 space-y-7"
        style={{
          background: 'white',
          border: `1.5px solid ${mA(0.13)}`,
          boxShadow: `0 4px 24px ${mA(0.07)}`,
        }}
        noValidate
      >

        {/* 프로필 이미지 */}
        <div className="flex flex-col items-center gap-3 pb-2">
          <div className="relative">
            {/* 원형 아바타 */}
            <div
              className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center text-3xl font-black text-white shrink-0"
              style={{
                background: (imagePreview || currentUser.profileImageUrl) ? 'transparent' : grad,
                boxShadow: `0 4px 20px ${mA(0.28)}`,
              }}
              aria-label="프로필 이미지"
            >
              {imagePreview ? (
                <img src={imagePreview} alt="새 프로필 이미지 미리보기" className="w-full h-full object-cover" />
              ) : currentUser.profileImageUrl ? (
                <img src={currentUser.profileImageUrl} alt="현재 프로필 이미지" className="w-full h-full object-cover" />
              ) : (
                currentUser.nickname?.[0] ?? '?'
              )}
            </div>

            {/* 카메라 오버레이 버튼 */}
            <button
              type="button"
              aria-label="프로필 이미지 변경"
              disabled={isUploadingImage}
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full flex items-center justify-center transition-transform active:scale-90 disabled:opacity-50 [-webkit-tap-highlight-color:transparent] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                background: grad,
                boxShadow: `0 2px 10px ${mA(0.35)}`,
              }}
            >
              {isUploadingImage
                ? <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" aria-hidden="true" />
                : <Camera size={16} className="text-white" aria-hidden="true" />
              }
            </button>
          </div>

          {isUploadingImage && (
            <p className="text-sm font-bold" style={{ color: dark }} aria-live="polite">
              이미지 업로드 중...
            </p>
          )}
          {pendingObjectKey && !isUploadingImage && (
            <p className="text-sm font-bold" style={{ color: 'oklch(0.45 0.14 145)' }} aria-live="polite">
              새 이미지가 준비됐어요. 저장하면 반영돼요.
            </p>
          )}
        </div>

        {/* 구분선 */}
        <hr className="border-none h-px rounded-full" style={{ background: mA(0.10) }} />

        {/* 닉네임 필드 */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-3">
            <label
              htmlFor="nickname"
              className="flex items-center gap-2 text-lg font-black text-foreground"
            >
              <User size={18} style={{ color: dark }} aria-hidden="true" />
              닉네임
              <span className="text-sm font-bold text-destructive" aria-hidden="true">*</span>
            </label>
            <NicknameBadge status={nicknameStatus} />
          </div>

          <input
            id="nickname"
            type="text"
            autoComplete="nickname"
            aria-required="true"
            aria-describedby="nickname-hint nickname-error"
            aria-invalid={!!errors.nickname || nicknameStatus === 'duplicate'}
            className="w-full min-h-[56px] rounded-2xl px-5 text-lg font-bold text-foreground outline-none border-2 transition-colors bg-transparent focus-visible:outline-none"
            style={{
              borderColor: errors.nickname || nicknameStatus === 'duplicate'
                ? 'oklch(0.55 0.18 25)'
                : watchedNickname.length >= 2
                  ? mA(0.45)
                  : mA(0.15),
              background: mA(0.02),
            }}
            {...register('nickname', {
              required: '닉네임을 입력해 주세요',
              minLength: { value: 2, message: '닉네임은 2자 이상이어야 해요' },
              maxLength: { value: 12, message: '닉네임은 12자 이하여야 해요' },
            })}
          />

          <div className="flex items-center justify-between">
            <p id="nickname-hint" className="text-sm font-medium text-muted-foreground">
              2~12자, 공백 없이 입력해 주세요
            </p>
            <span
              className="text-sm font-bold"
              style={{ color: watchedNickname.length > 12 ? 'oklch(0.55 0.18 25)' : 'oklch(0.60 0.04 220)' }}
              aria-live="polite"
            >
              {watchedNickname.length}/12
            </span>
          </div>

          {(errors.nickname || nicknameStatus === 'duplicate') && (
            <p
              id="nickname-error"
              role="alert"
              className="text-sm font-bold flex items-center gap-1.5"
              style={{ color: 'oklch(0.50 0.18 25)' }}
            >
              <XCircle size={14} aria-hidden="true" />
              {errors.nickname?.message ?? '이미 사용 중인 닉네임이에요'}
            </p>
          )}
        </div>

        {/* 구분선 */}
        <hr className="border-none h-px rounded-full" style={{ background: mA(0.10) }} />

        {/* 자기소개 필드 */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-3">
            <label
              htmlFor="bio"
              className="flex items-center gap-2 text-lg font-black text-foreground"
            >
              <FileText size={18} style={{ color: dark }} aria-hidden="true" />
              자기소개
              <span className="text-sm font-medium text-muted-foreground">(선택)</span>
            </label>
            <span
              className="text-sm font-bold"
              style={{ color: watchedBio.length > 50 ? 'oklch(0.55 0.18 25)' : 'oklch(0.60 0.04 220)' }}
              aria-live="polite"
            >
              {watchedBio.length}/50
            </span>
          </div>

          <textarea
            id="bio"
            rows={3}
            aria-describedby="bio-hint bio-error"
            aria-invalid={!!errors.bio}
            className="w-full resize-none rounded-2xl px-5 py-4 text-lg font-medium text-foreground leading-relaxed outline-none border-2 transition-colors focus-visible:outline-none"
            style={{
              borderColor: errors.bio
                ? 'oklch(0.55 0.18 25)'
                : watchedBio.length > 0
                  ? mA(0.40)
                  : mA(0.15),
              background: mA(0.02),
            }}
            placeholder="간단한 자기소개를 남겨보세요 (예: 매일 산책하는 것을 즐겨요)"
            {...register('bio', {
              maxLength: { value: 50, message: '자기소개는 50자 이하로 입력해 주세요' },
            })}
          />

          {errors.bio && (
            <p
              id="bio-error"
              role="alert"
              className="text-sm font-bold flex items-center gap-1.5"
              style={{ color: 'oklch(0.50 0.18 25)' }}
            >
              <XCircle size={14} aria-hidden="true" />
              {errors.bio.message}
            </p>
          )}
          <p id="bio-hint" className="sr-only">최대 50자까지 입력할 수 있어요</p>
        </div>

        {/* 저장 버튼 */}
        <button
          type="submit"
          disabled={!canSave}
          aria-busy={updateProfile.isPending}
          aria-label={updateProfile.isPending ? '저장하는 중이에요' : '프로필 저장하기'}
          className="w-full min-h-[60px] rounded-2xl text-xl font-black text-white flex items-center justify-center gap-2.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 [-webkit-tap-highlight-color:transparent]"
          style={{
            background: grad,
            boxShadow: canSave ? `0 4px 20px ${mA(0.30)}` : 'none',
          }}
          onMouseEnter={e => {
            if (canSave) { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-2px)' }
          }}
          onMouseLeave={e => {
            e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          {updateProfile.isPending ? (
            <>
              <div className="w-5 h-5 rounded-full border-2 border-white/40 border-t-white animate-spin" aria-hidden="true" />
              <span>저장하는 중이에요...</span>
            </>
          ) : (
            <>
              <Save size={22} aria-hidden="true" />
              <span>저장하기</span>
            </>
          )}
        </button>

        {/* 변경사항 없을 때 안내 */}
        {!isDirty && !pendingObjectKey && (
          <p className="text-center text-base font-medium text-muted-foreground" aria-live="polite">
            변경사항이 없어요
          </p>
        )}
      </form>
    </main>
  )
}
