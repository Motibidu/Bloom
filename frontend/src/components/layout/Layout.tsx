import { useRef } from 'react'
import { Outlet } from 'react-router-dom'
import Header from './Header'
import BottomTabBar from './BottomTabBar'
import { ScrollContainerContext } from '@/lib/scrollContext'

export default function Layout() {
  const scrollRef = useRef<HTMLElement>(null)

  return (
    <ScrollContainerContext.Provider value={scrollRef}>
      <div className="flex flex-col h-screen bg-background">
        {/* 상단 헤더 - 스크롤 고정 */}
        <div className="sticky top-0 z-40 shrink-0">
          <Header />
        </div>
        {/* 메인 콘텐츠 영역 - 독립 스크롤 */}
        <main ref={scrollRef} className="flex-1 overflow-y-auto pb-16 md:pb-0">
          <Outlet />
        </main>
        {/* 모바일 하단 탭바 */}
        <BottomTabBar />
      </div>
    </ScrollContainerContext.Provider>
  )
}
