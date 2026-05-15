import { useState } from 'react'
import { Search, UserPlus, UserCheck, Users } from 'lucide-react'
import { Input } from '@/components/ui/shadcn/input'
import { useSearchUsers, useFollowToggle } from '@/hooks/useFollow'
import type { UserSearchResult } from '@/types'

const main  = 'oklch(0.62 0.15 220)'
const dark  = 'oklch(0.48 0.15 220)'
const light = 'oklch(0.76 0.12 220)'
const mA = (a: number) => `oklch(0.62 0.15 220 / ${a})`
const grad  = `linear-gradient(135deg, ${main}, ${light})`

function UserCard({ user }: { user: UserSearchResult }) {
  const followToggle = useFollowToggle(user.id, user.isFollowing)

  return (
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
        onClick={() => followToggle.mutate()}
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
  )
}

export default function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const { data: users = [], isLoading } = useSearchUsers(searchQuery)

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

      {/* 팔로우 현황 뱃지 */}
      {users.filter(u => u.isFollowing).length > 0 && (
        <div
          className="flex items-center gap-3 rounded-2xl px-5 py-4"
          style={{ background: mA(0.06), border: `1px solid ${mA(0.15)}` }}
        >
          <Users size={20} style={{ color: main }} aria-hidden="true" />
          <p className="text-base font-bold" style={{ color: dark }}>
            현재 <span className="font-black">{users.filter(u => u.isFollowing).length}명</span>을 팔로우하고 있어요
          </p>
        </div>
      )}

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

      {/* 사용자 목록 */}
      {!searchQuery ? (
        <div
          className="rounded-2xl px-6 py-14 flex flex-col items-center gap-4 text-center"
          style={{ background: mA(0.04), border: `1px dashed ${mA(0.20)}` }}
        >
          <span className="text-5xl" aria-hidden="true">🔍</span>
          <p className="text-xl font-black text-foreground">닉네임을 입력해보세요</p>
          <p className="text-base font-medium text-muted-foreground">
            함께 활동할 이웃을 찾아보세요
          </p>
        </div>
      ) : isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
            style={{ borderColor: `${mA(0.20)} transparent ${mA(0.20)} ${mA(0.20)}` }} />
        </div>
      ) : users.length === 0 ? (
        <div
          className="rounded-2xl px-6 py-14 flex flex-col items-center gap-4 text-center"
          style={{ background: mA(0.04), border: `1px dashed ${mA(0.20)}` }}
        >
          <span className="text-5xl" aria-hidden="true">🔍</span>
          <p className="text-xl font-black text-foreground">검색 결과가 없어요</p>
          <p className="text-base font-medium text-muted-foreground">
            다른 닉네임으로 검색해보세요
          </p>
        </div>
      ) : (
        <ul className="space-y-3" role="list" aria-label="사용자 목록">
          {users.map(user => (
            <li key={user.id}>
              <UserCard user={user} />
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
