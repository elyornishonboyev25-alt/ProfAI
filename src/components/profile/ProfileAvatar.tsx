import { cn } from '@/components/ui/utils'

export const DEFAULT_PROFILE_AVATAR = '/assets/avatars/profai-neutral.jpg'

export function ProfileAvatar({ src, alt = '', className }: { src?: string | null; alt?: string; className?: string }) {
  return (
    <img
      src={src || DEFAULT_PROFILE_AVATAR}
      alt={alt}
      className={cn('profile-avatar-media', className)}
      onError={(event) => {
        if (!event.currentTarget.src.endsWith(DEFAULT_PROFILE_AVATAR)) event.currentTarget.src = DEFAULT_PROFILE_AVATAR
      }}
    />
  )
}
