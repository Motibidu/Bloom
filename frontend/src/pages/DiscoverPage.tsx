import { useState } from 'react'
import { Search, UserPlus, UserCheck } from 'lucide-react'
import { Input } from '@/components/ui/shadcn/input'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/shadcn/alert-dialog'
import { useSearchUsers, useFollowToggle, useFollowingList, useFollowersList } from '@/hooks/useFollow'
import type { UserSearchResult } from '@/types'

const main  = 'oklch(0.62 0.15 220)'
const dark  = 'oklch(0.48 0.15 220)'
const light = 'oklch(0.76 0.12 220)'
const mA = (a: number) => `oklch(0.62 0.15 220 / ${a})`
const grad  = `linear-gradient(135deg, ${main}, ${light})`

type Tab = 'search' | 'following' | 'followers'

function UserCard({ user }: { user: UserSearchResult }) {
  const followToggle = useFollowToggle(user.id, user.isFollowing)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const handleFollowClick = () => {
    if (user.isFollowing) {
      setConfirmOpen(true)
    } else {
      followToggle.mutate()
    }
  }

  return (
    <>
      <div
        className="rounded-2xl px-5 py-5 flex items-center gap-4"
        style={{
          background: 'white',
          border: `1px solid ${user.isFollowing ? mA(0.22) : mA(0.10)}`,
          boxShadow: user.isFollowing ? `0 2px 12px ${mA(0.10)}` : `0 1px 4px ${mA(0.06)}`,
          transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
        }}
      >
        {/* 아바타 */}
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 text-xl font-black text-white"
          style={{ background: grad, boxShadow: `0 2px 8px ${mA(0.25)}` }}
          aria-hidden="true"
        >
          {user.nickname[0]}
        </div>

        {/* 텍스트 정보 */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <span className="text-lg font-black text-foreground leading-none">
            {user.nickname}
          </span>
          {user.bio && (
            <p className="text-base font-medium text-foreground/65 leading-snug line-clamp-1">
              {user.bio}
            </p>
          )}
          <div
            className="flex items-center gap-3 text-sm font-bold"
            style={{ color: `oklch(0.58 0.05 220)` }}
          >
            <span>팔로워 {user.followerCount}명</span>
            <span aria-hidden="true">·</span>
            <span>팔로잉 {user.followingCount}명</span>
          </div>
        </div>

        {/* 팔로우 버튼 */}
        <button
          onClick={handleFollowClick}
          disabled={followToggle.isPending}
          aria-pressed={user.isFollowing}
          aria-label={user.isFollowing ? `${user.nickname} 팔로우 취소` : `${user.nickname} 팔로우`}
          className="shrink-0 flex items-center gap-1.5 min-h-[48px] px-4 rounded-2xl text-base font-black transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95 disabled:opacity-50"
          style={{
            background: user.isFollowing ? mA(0.10) : grad,
            color: user.isFollowing ? dark : 'white',
            border: user.isFollowing ? `1.5px solid ${mA(0.22)}` : 'none',
            '--tw-ring-color': main,
          } as React.CSSProperties}
        >
          {user.isFollowing ? (
            <><UserCheck size={18} aria-hidden="true" />팔로잉</>
          ) : (
            <><UserPlus size={18} aria-hidden="true" />팔로우</>
          )}
        </button>
      </div>

      {/* 팔로우 취소 확인 모달 */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black">
              {user.nickname}님을 언팔로우할까요?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              팔로우를 취소하면 {user.nickname}님의 활동이 피드에 보이지 않아요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-base font-bold h-12">
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => followToggle.mutate()}
              className="text-base font-black h-12"
              style={{ background: grad }}
            >
              언팔로우
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function EmptyState({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div
      className="rounded-2xl px-6 py-14 flex flex-col items-center gap-4 text-center"
      style={{ background: mA(0.04), border: `1px dashed ${mA(0.20)}` }}
    >
      <span className="text-5xl" aria-hidden="true">{icon}</span>
      <p className="text-xl font-black text-foreground">{title}</p>
      <p className="text-base font-medium text-muted-foreground">{desc}</p>
    </div>
  )
}

function Spinner() {
  return (
    <div className="flex justify-center py-12">
      <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
        style={{ borderColor: `${mA(0.20)} transparent ${mA(0.20)} ${mA(0.20)}` }} />
    </div>
  )
}

function UserList({ users }: { users: UserSearchResult[] }) {
  return (
    <ul className="space-y-3" role="list" aria-label="사용자 목록">
      {users.map(user => (
        <li key={user.id}>
          <UserCard user={user} />
        </li>
      ))}
    </ul>
  )
}

function SearchTab() {
  const [searchQuery, setSearchQuery] = useState('')
  const { data: users = [], isLoading } = useSearchUsers(searchQuery)

  return (
    <div className="space-y-5">
      {/* 검색 입력 */}
      <div className="relative">
        <Search
          size={20}
          className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: mA(0.45) }}
          aria-hidden="true"
        />
        <Input
          type="search"
          placeholder="닉네임으로 검색해보세요"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          aria-label="닉네임 검색"
          className="pl-12 h-14 text-lg rounded-2xl border-2 focus-visible:ring-0"
          style={searchQuery ? { borderColor: mA(0.45) } : { borderColor: mA(0.15) }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            aria-label="검색어 지우기"
            className="absolute right-4 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: mA(0.10), color: dark }}
          >
            <span className="text-sm font-black leading-none">×</span>
          </button>
        )}
      </div>

      {/* 결과 헤더 */}
      {searchQuery && (
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-black text-foreground shrink-0">
            "{searchQuery}" 검색 결과
          </h2>
          <div
            className="flex-1 h-0.5 rounded-full"
            style={{ background: `linear-gradient(90deg, ${mA(0.25)}, transparent)` }}
            aria-hidden="true"
          />
          {!isLoading && (
            <span
              className="text-sm font-black px-3 py-1 rounded-full text-white shrink-0"
              style={{ background: grad }}
            >
              {users.length}명
            </span>
          )}
        </div>
      )}

      {/* 결과 */}
      {!searchQuery ? (
        <EmptyState icon="🔍" title="닉네임을 입력해보세요" desc="함께 활동할 이웃을 찾아보세요" />
      ) : isLoading ? (
        <Spinner />
      ) : users.length === 0 ? (
        <EmptyState icon="🔍" title="검색 결과가 없어요" desc="다른 닉네임으로 검색해보세요" />
      ) : (
        <UserList users={users} />
      )}
    </div>
  )
}

function FollowingTab() {
  const { data: users = [], isLoading } = useFollowingList()

  if (isLoading) return <Spinner />
  if (users.length === 0)
    return <EmptyState icon="🌱" title="아직 팔로우하는 이웃이 없어요" desc="검색 탭에서 이웃을 찾아 팔로우해보세요" />
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <span className="text-base font-bold" style={{ color: dark }}>
          총 <span className="font-black">{users.length}명</span>을 팔로우하고 있어요
        </span>
      </div>
      <UserList users={users} />
    </div>
  )
}

function FollowersTab() {
  const { data: users = [], isLoading } = useFollowersList()

  if (isLoading) return <Spinner />
  if (users.length === 0)
    return <EmptyState icon="🌸" title="아직 팔로워가 없어요" desc="활동을 기록하면 이웃들이 찾아올 거예요" />
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <span className="text-base font-bold" style={{ color: dark }}>
          <span className="font-black">{users.length}명</span>이 나를 팔로우하고 있어요
        </span>
      </div>
      <UserList users={users} />
    </div>
  )
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'search',    label: '검색' },
  { id: 'following', label: '팔로잉' },
  { id: 'followers', label: '팔로워' },
]

export default function DiscoverPage() {
  const [activeTab, setActiveTab] = useState<Tab>('search')

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-7">

      {/* 헤더 */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: grad }}
            aria-hidden="true"
          >
            <Search size={20} className="text-white" />
          </div>
          <h1
            className="text-2xl font-black text-foreground"
            style={{ fontFamily: "'Noto Serif KR', serif" }}
          >
            사람 찾기
          </h1>
        </div>
        <p className="text-base font-medium text-muted-foreground pl-14">
          닉네임으로 이웃을 찾아 팔로우해보세요
        </p>
      </div>

      {/* 탭 */}
      <div
        className="flex rounded-2xl p-1 gap-1"
        style={{ background: mA(0.08) }}
        role="tablist"
        aria-label="보기 방식 선택"
      >
        {TABS.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex-1 h-11 rounded-xl text-base font-black transition-all"
            style={
              activeTab === tab.id
                ? { background: grad, color: 'white', boxShadow: `0 2px 8px ${mA(0.20)}` }
                : { background: 'transparent', color: dark }
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      {activeTab === 'search'    && <SearchTab />}
      {activeTab === 'following' && <FollowingTab />}
      {activeTab === 'followers' && <FollowersTab />}

    </main>
  )
}
