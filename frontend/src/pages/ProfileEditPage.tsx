import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ArrowLeft, CheckCircle2, XCircle, Loader2, Camera } from 'lucide-react'
import { useCurrentUser, useUpdateProfile, useProfileImageUrl } from '@/hooks/useUser'
import api from '@/lib/api'

// ── 디자인 토큰 ────────────────────────────────────────────────────────────
const main  = 'oklch(0.62 0.15 220)'
const dark  = 'oklch(0.48 0.15 220)'
const light = 'oklch(0.76 0.12 220)'
const mA = (a: number) => `oklch(0.62 0.15 220 / ${a})`
const lA = (a: number) => `oklch(0.76 0.12 220 / ${a})`
const grad  = `linear-gradient(135deg, ${main}, ${light})`
const serif = { fontFamily: "'Noto Serif KR', serif" }

// ── Toast ───────────────────────────────────────────────────────────────────
function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 px-6 py-4 rounded-2xl text-base font-bold text-white"
      style={{
        background: type === 'success'
          ? `linear-gradient(135deg, oklch(0.50 0.14 145), oklch(0.60 0.12 155))`
          : `linear-gradient(135deg, oklch(0.50 0.18 25), oklch(0.60 0.16 30))`,
        boxShadow: type === 'success'
          ? '0 8px 32px oklch(0.50 0.14 145 / 0.30)'
          : '0 8px 32px oklch(0.50 0.18 25 / 0.30)',
        minWidth: '260px',
        maxWidth: '90vw',
        animation: 'peToastIn 0.35s cubic-bezier(0.34,1.56,0.64,1)',
      }}
    >
      <style>{`
        @keyframes peToastIn {
          from { opacity:0; transform:translate(-50%,-14px) scale(0.90); }
          to   { opacity:1; transform:translate(-50%,0) scale(1); }
        }
        @keyframes peSlideUp {
          from { opacity:0; transform:translateY(20px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .pe-in { animation: peSlideUp 0.45s cubic-bezier(0.22,1,0.36,1) both; }
        .pe-in-1 { animation-delay:0.04s; }
        .pe-in-2 { animation-delay:0.10s; }
        .pe-in-3 { animation-delay:0.16s; }
        .pe-in-4 { animation-delay:0.22s; }
        .pe-in-5 { animation-delay:0.28s; }
      `}</style>
      {type === 'success' ? <CheckCircle2 size={20} aria-hidden="true" /> : <XCircle size={20} aria-hidden="true" />}
      <span>{message}</span>
    </div>
  )
}

// ── 닉네임 상태 배지 ────────────────────────────────────────────────────────
type NicknameStatus = 'idle' | 'checking' | 'available' | 'duplicate' | 'same'

function NicknameBadge({ status }: { status: NicknameStatus }) {
  if (status === 'idle') return null
  const config = {
    checking:  { label: '확인 중…',     color: dark,                   icon: <Loader2 size={13} className="animate-spin" aria-hidden="true" /> },
    available: { label: '사용 가능',    color: 'oklch(0.42 0.14 145)', icon: <CheckCircle2 size={13} aria-hidden="true" /> },
    duplicate: { label: '이미 사용 중', color: 'oklch(0.48 0.18 25)',  icon: <XCircle size={13} aria-hidden="true" /> },
    same:      { label: '현재 닉네임',  color: main,                   icon: <CheckCircle2 size={13} aria-hidden="true" /> },
  }[status]
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-bold" style={{ color: config.color }} aria-live="polite">
      {config.icon}{config.label}
    </span>
  )
}

interface ProfileForm { nickname: string; bio: string }

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

  const { register, handleSubmit, watch, reset, formState: { errors, isDirty } } = useForm<ProfileForm>({
    defaultValues: { nickname: '', bio: '' },
  })

  useEffect(() => {
    if (currentUser) reset({ nickname: currentUser.nickname, bio: currentUser.bio ?? '' })
  }, [currentUser, reset])

  const watchedNickname = watch('nickname')
  const watchedBio = watch('bio')

  const checkNickname = useCallback((value: string) => {
    if (!currentUser) return
    if (!value || value.length < 2 || value.length > 12) { setNicknameStatus('idle'); return }
    if (value === currentUser.nickname) { setNicknameStatus('same'); return }
    setNicknameStatus('checking')
    if (debounceTimer) clearTimeout(debounceTimer)
    const t = setTimeout(async () => {
      try {
        const res = await api.get<{ available: boolean }>(`/users/check-nickname?nickname=${encodeURIComponent(value)}`)
        setNicknameStatus(res.data.available ? 'available' : 'duplicate')
      } catch { setNicknameStatus('idle') }
    }, 500)
    setDebounceTimer(t)
  }, [currentUser, debounceTimer])

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
    const reader = new FileReader()
    reader.onload = (ev) => setImagePreview(ev.target?.result as string)
    reader.readAsDataURL(file)
    setIsUploadingImage(true)
    try {
      const { uploadUrl, objectKey } = await getProfileImageUrl.mutateAsync()
      await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': 'image/jpeg' } })
      setPendingObjectKey(objectKey)
    } catch {
      showToast('이미지 업로드에 실패했어요. 다시 시도해 주세요.', 'error')
      setImagePreview(null)
    } finally {
      setIsUploadingImage(false)
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
      <main className="min-h-screen flex items-center justify-center" role="status" aria-live="polite" aria-label="프로필을 불러오는 중이에요">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-[3px] border-t-transparent animate-spin" style={{ borderColor: `${mA(0.25)} transparent transparent transparent`, borderTopColor: main }} aria-hidden="true" />
          <p className="text-sm font-bold text-muted-foreground">불러오는 중이에요…</p>
        </div>
      </main>
    )
  }

  if (!currentUser) return null

  const canSave = (isDirty || !!pendingObjectKey) && nicknameStatus !== 'duplicate' && !updateProfile.isPending
  const avatarSrc = imagePreview || currentUser.profileImageUrl

  return (
    <main className="min-h-screen bg-background" style={{ wordBreak: 'keep-all' }}>
      {toast && <Toast message={toast.message} type={toast.type} />}

      <input ref={fileInputRef} type="file" accept="image/*" className="sr-only" aria-hidden="true" onChange={handleImageChange} />

      <div className="max-w-xl mx-auto px-5 pt-6 pb-24">

        {/* 뒤로가기 */}
        <div className="pe-in pe-in-1 mb-8">
          <button
            type="button"
            onClick={() => navigate('/me')}
            aria-label="내 활동으로 돌아가기"
            className="inline-flex items-center gap-2 min-h-[48px] px-2 -ml-2 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ color: dark }}
            onMouseEnter={e => { e.currentTarget.style.background = mA(0.07) }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            <ArrowLeft size={20} aria-hidden="true" />
            <span className="text-base font-bold">내 활동으로</span>
          </button>
        </div>

        {/* ── 헤더 카드: 아바타 + 이름 가로 배치 ── */}
        <div
          className="pe-in pe-in-2 rounded-3xl p-6 mb-5 flex items-center gap-5"
          style={{
            background: `linear-gradient(135deg, ${mA(0.07)}, ${lA(0.10)})`,
            border: `1.5px solid ${mA(0.12)}`,
          }}
        >
          {/* 아바타 */}
          <div className="relative shrink-0">
            <button
              type="button"
              aria-label="프로필 이미지 변경"
              disabled={isUploadingImage}
              onClick={() => fileInputRef.current?.click()}
              className="block w-20 h-20 rounded-2xl overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 [-webkit-tap-highlight-color:transparent] disabled:opacity-60 group"
              style={{ boxShadow: `0 4px 16px ${mA(0.22)}` }}
            >
              {avatarSrc ? (
                <img src={avatarSrc} alt="프로필 이미지" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-black text-white" style={{ background: grad }}>
                  <span style={{ ...serif }}>{currentUser.nickname?.[0] ?? '?'}</span>
                </div>
              )}
              {/* 호버 오버레이 */}
              <div
                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'oklch(0 0 0 / 0.35)' }}
                aria-hidden="true"
              >
                <Camera size={22} className="text-white" />
              </div>
            </button>

            {/* 업로드 중 스피너 */}
            {isUploadingImage && (
              <div className="absolute inset-0 rounded-2xl flex items-center justify-center" style={{ background: mA(0.60) }} aria-hidden="true">
                <div className="w-6 h-6 rounded-full border-2 border-t-transparent border-white animate-spin" />
              </div>
            )}
          </div>

          {/* 이름/이메일 */}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: main }}>프로필 편집</p>
            <p className="text-xl font-black text-foreground truncate" style={{ ...serif }}>
              {watchedNickname || currentUser.nickname}
            </p>
            <p className="text-sm text-muted-foreground truncate mt-0.5">{currentUser.email}</p>
            {pendingObjectKey && !isUploadingImage && (
              <p className="text-xs font-bold mt-1" style={{ color: 'oklch(0.42 0.14 145)' }} aria-live="polite">
                ✓ 새 이미지 준비됨
              </p>
            )}
          </div>
        </div>

        {/* ── 폼 카드 ── */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="pe-in pe-in-3 rounded-3xl overflow-hidden"
          style={{
            background: 'white',
            border: `1.5px solid ${mA(0.10)}`,
            boxShadow: `0 4px 24px ${mA(0.06)}`,
          }}
        >
          {/* 닉네임 섹션 */}
          <div className="px-6 pt-7 pb-6" style={{ borderBottom: `1px solid ${mA(0.08)}` }}>
            {/* 섹션 번호 + 라벨 */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white shrink-0"
                  style={{ background: grad }}
                  aria-hidden="true"
                >
                  01
                </span>
                <label htmlFor="nickname" className="text-base font-black text-foreground">
                  닉네임
                  <span className="ml-1 text-sm font-bold text-destructive" aria-hidden="true">*</span>
                </label>
              </div>
              <NicknameBadge status={nicknameStatus} />
            </div>

            <input
              id="nickname"
              type="text"
              autoComplete="nickname"
              aria-required="true"
              aria-describedby="nickname-hint nickname-error"
              aria-invalid={!!errors.nickname || nicknameStatus === 'duplicate'}
              className="w-full min-h-[56px] rounded-2xl px-5 text-lg font-bold text-foreground outline-none border-2 transition-all bg-transparent focus-visible:outline-none"
              style={{
                borderColor: errors.nickname || nicknameStatus === 'duplicate'
                  ? 'oklch(0.55 0.18 25)'
                  : watchedNickname.length >= 2 ? mA(0.40) : mA(0.14),
                background: mA(0.03),
              }}
              placeholder={currentUser.nickname}
              {...register('nickname', {
                required: '닉네임을 입력해 주세요',
                minLength: { value: 2, message: '닉네임은 2자 이상이어야 해요' },
                maxLength: { value: 12, message: '닉네임은 12자 이하여야 해요' },
              })}
            />

            <div className="flex items-center justify-between mt-2.5">
              <p id="nickname-hint" className="text-sm text-muted-foreground">2~12자, 공백 없이</p>
              <span
                className="text-sm font-bold tabular-nums"
                style={{ color: watchedNickname.length > 12 ? 'oklch(0.55 0.18 25)' : undefined }}
                aria-live="polite"
              >
                <span className={watchedNickname.length <= 12 ? 'text-muted-foreground' : ''}>{watchedNickname.length}/12</span>
              </span>
            </div>

            {(errors.nickname || nicknameStatus === 'duplicate') && (
              <p id="nickname-error" role="alert" className="mt-2 text-sm font-bold flex items-center gap-1.5" style={{ color: 'oklch(0.50 0.18 25)' }}>
                <XCircle size={14} aria-hidden="true" />
                {errors.nickname?.message ?? '이미 사용 중인 닉네임이에요'}
              </p>
            )}
          </div>

          {/* 자기소개 섹션 */}
          <div className="px-6 pt-6 pb-7">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white shrink-0"
                  style={{ background: `linear-gradient(135deg, ${light}, ${main})` }}
                  aria-hidden="true"
                >
                  02
                </span>
                <label htmlFor="bio" className="text-base font-black text-foreground">
                  자기소개
                  <span className="ml-2 text-sm font-medium text-muted-foreground">선택</span>
                </label>
              </div>
              <span
                className="text-sm font-bold tabular-nums"
                style={{ color: watchedBio.length > 50 ? 'oklch(0.55 0.18 25)' : undefined }}
                aria-live="polite"
              >
                <span className={watchedBio.length <= 50 ? 'text-muted-foreground' : ''}>{watchedBio.length}/50</span>
              </span>
            </div>

            <textarea
              id="bio"
              rows={3}
              aria-describedby="bio-hint bio-error"
              aria-invalid={!!errors.bio}
              className="w-full resize-none rounded-2xl px-5 py-4 text-lg font-medium text-foreground leading-relaxed outline-none border-2 transition-all focus-visible:outline-none"
              style={{
                borderColor: errors.bio ? 'oklch(0.55 0.18 25)' : watchedBio.length > 0 ? mA(0.35) : mA(0.14),
                background: mA(0.03),
              }}
              placeholder="간단한 자기소개를 남겨보세요"
              {...register('bio', {
                maxLength: { value: 50, message: '자기소개는 50자 이하로 입력해 주세요' },
              })}
            />

            {errors.bio && (
              <p id="bio-error" role="alert" className="mt-2 text-sm font-bold flex items-center gap-1.5" style={{ color: 'oklch(0.50 0.18 25)' }}>
                <XCircle size={14} aria-hidden="true" />
                {errors.bio.message}
              </p>
            )}
            <p id="bio-hint" className="sr-only">최대 50자까지 입력할 수 있어요</p>
          </div>
        </form>

        {/* ── 저장 버튼 ── */}
        <div className="pe-in pe-in-4 mt-5">
          <button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={!canSave}
            aria-busy={updateProfile.isPending}
            aria-label={updateProfile.isPending ? '저장하는 중이에요' : '프로필 저장하기'}
            className="w-full h-16 rounded-2xl text-xl font-black text-white flex items-center justify-center gap-3 transition-all duration-200 disabled:opacity-35 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 [-webkit-tap-highlight-color:transparent]"
            style={{
              background: grad,
              boxShadow: canSave ? `0 6px 28px ${mA(0.30)}` : 'none',
            }}
            onMouseEnter={e => { if (canSave) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 10px 36px ${mA(0.38)}` } }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = canSave ? `0 6px 28px ${mA(0.30)}` : 'none' }}
          >
            {updateProfile.isPending ? (
              <>
                <div className="w-5 h-5 rounded-full border-2 border-white/40 border-t-white animate-spin" aria-hidden="true" />
                <span>저장하는 중이에요…</span>
              </>
            ) : (
              <span style={{ ...serif }}>저장하기</span>
            )}
          </button>

          {!isDirty && !pendingObjectKey && (
            <p className="mt-3 text-center text-sm text-muted-foreground" aria-live="polite">변경사항이 없어요</p>
          )}
        </div>

      </div>

      <div className="pb-[env(safe-area-inset-bottom)]" />
    </main>
  )
}
