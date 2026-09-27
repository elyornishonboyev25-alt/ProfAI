import type { LeaderboardRow } from '@/types/platform'
import { ProfileAvatar } from '@/components/profile/ProfileAvatar'

type LeaderboardAvatarProps = {
  row: LeaderboardRow
  size?: 'sm' | 'lg'
  showRank?: boolean
}

export default function LeaderboardAvatar({ row, size = 'sm', showRank = false }: LeaderboardAvatarProps) {
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-red-50 to-zinc-200 font-black text-red-800 shadow-[0_5px_16px_rgba(73,43,52,.14)] ${size === 'lg' ? 'h-20 w-20 text-xl' : 'h-10 w-10 text-xs'}`}
      title={row.fullName}
      role="img"
      aria-label={`${row.fullName}, rank ${row.rank}`}
    >
      <ProfileAvatar src={row.avatarUrl} name={row.fullName} className="rounded-full" />
      {showRank ? (
        <span className="absolute -bottom-1 -right-1 rounded-full border border-white bg-gradient-to-r from-red-700 to-red-500 px-1.5 py-0.5 text-[8px] font-black leading-none text-white shadow-sm">
          #{row.rank}
        </span>
      ) : null}
    </span>
  )
}
