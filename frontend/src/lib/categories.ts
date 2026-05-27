import { Footprints, ChefHat, BookOpen, Sprout, Dumbbell, Users, MoreHorizontal } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Category } from '@/types'

export const CATEGORY_META: Record<Category, { icon: LucideIcon; label: string; shortLabel: string }> = {
  WALK:       { icon: Footprints,     label: '산책',        shortLabel: '산책'   },
  COOKING:    { icon: ChefHat,        label: '요리',        shortLabel: '요리'   },
  READING:    { icon: BookOpen,       label: '독서',        shortLabel: '독서'   },
  GARDENING:  { icon: Sprout,         label: '정원 가꾸기', shortLabel: '정원'   },
  EXERCISE:   { icon: Dumbbell,       label: '운동',        shortLabel: '운동'   },
  MEETING:    { icon: Users,          label: '친구 만남',   shortLabel: '친구'   },
  OTHER:      { icon: MoreHorizontal, label: '기타',        shortLabel: '기타'   },
}

export const CATEGORY_ORDER: Category[] = [
  'WALK', 'COOKING', 'READING', 'GARDENING', 'EXERCISE', 'MEETING', 'OTHER',
]

export const AUTO_TITLES: Record<Category, string> = {
  WALK:      '산책했어요',
  COOKING:   '요리했어요',
  READING:   '독서했어요',
  GARDENING: '정원을 가꿨어요',
  EXERCISE:  '운동했어요',
  MEETING:   '친구를 만났어요',
  OTHER:     '활동했어요',
}
