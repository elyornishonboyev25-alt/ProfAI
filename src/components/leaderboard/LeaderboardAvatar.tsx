import { useState } from 'react'
import type { LeaderboardRow } from '@/types/platform'

type LeaderboardAvatarProps = {
  row: LeaderboardRow
  size?: 'sm' | 'lg'
  showRank?: boolean
}

export default function LeaderboardAvatar({ row, size = 'sm', showRank = false }: LeaderboardAvatarProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const initials = row.fullName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || '?'
  const showImage = Boolean(row.avatarUrl && failedUrl !== row.avatarUrl)

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-red-50 to-zinc-200 font-black text-red-800 shadow-[0_5px_16px_rgba(73,43,52,.14)] ${size === 'lg' ? 'h-20 w-20 text-xl' : 'h-10 w-10 text-xs'}`}
      title={row.fullName}
      role="img"
      aria-label={`${row.fullName}, rank ${row.rank}`}
    >
      {showImage ? (
        <img
          src={row.avatarUrl!}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailedUrl(row.avatarUrl)}
          className="h-full w-full rounded-full object-cover"
        />
      ) : <span>{initials}</span>}
      {showRank ? (
        <span className="absolute -bottom-1 -right-1 rounded-full border border-white bg-gradient-to-r from-red-700 to-red-500 px-1.5 py-0.5 text-[8px] font-black leading-none text-white shadow-sm">
          #{row.rank}
        </span>
      ) : null}
    </span>
  )
}
