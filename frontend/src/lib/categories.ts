import { Footprints, ChefHat, BookOpen, Sprout, Dumbbell, Users, MoreHorizontal } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Category } from '@/types'

export const CATEGORY_META: Record<Category, { icon: LucideIcon; label: string }> = {
  WALK:       { icon: Footprints,     label: '산책'        },
  COOKING:    { icon: ChefHat,        label: '요리'        },
  READING:    { icon: BookOpen,       label: '독서'        },
  GARDENING:  { icon: Sprout,         label: '정원 가꾸기' },
  EXERCISE:   { icon: Dumbbell,       label: '운동'        },
  MEETING:    { icon: Users,          label: '친구 만남'   },
  OTHER:      { icon: MoreHorizontal, label: '기타'        },
}

export const CATEGORY_ORDER: Category[] = [
  'WALK', 'COOKING', 'READING', 'GARDENING', 'EXERCISE', 'MEETING', 'OTHER',
]
