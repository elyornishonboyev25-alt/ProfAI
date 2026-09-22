import { cn } from '@/components/ui/utils'
import defaultAvatar from '@/assets/avatars/default-profile.jpg?inline'

// Ship the fallback inside the bundle: even an offline or failed image request
// must not leave an empty circle (or trigger another failing asset request).
export const DEFAULT_PROFILE_AVATAR = defaultAvatar

export function ProfileAvatar({ src, alt = '', className }: { src?: string | null; alt?: string; className?: string }) {
  return (
    <img
      key={src}
      src={src?.trim() || DEFAULT_PROFILE_AVATAR}
      alt={alt}
      referrerPolicy="no-referrer"
      className={cn('profile-avatar-media', className)}
      onError={(event) => {
        if (event.currentTarget.getAttribute('src') !== DEFAULT_PROFILE_AVATAR) {
          event.currentTarget.src = DEFAULT_PROFILE_AVATAR
        }
      }}
    />
  )
}
