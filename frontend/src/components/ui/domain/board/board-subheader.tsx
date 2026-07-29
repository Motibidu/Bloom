import type { ReactNode } from 'react'

const dark = 'oklch(0.48 0.15 220)'
const mA = (a: number) => `oklch(0.62 0.15 220 / ${a})`
const serifStyle = { fontFamily: "'Noto Serif KR', serif" }

interface Props {
  title: string
  left?: ReactNode
}

export default function BoardSubheader({ title, left }: Props) {
  return (
    <div
      className="flex items-center gap-2 px-2 h-14"
      style={{ borderBottom: `1px solid ${mA(0.10)}` }}
    >
      {left && <div className="shrink-0 flex items-center">{left}</div>}
      <h1
        className="text-xl font-black text-foreground truncate"
        style={{ ...serifStyle, color: dark }}
      >
        {title}
      </h1>
    </div>
  )
}
