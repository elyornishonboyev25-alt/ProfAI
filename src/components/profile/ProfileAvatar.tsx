import { useEffect, useState } from 'react'
import { cn } from '@/components/ui/utils'
import { isLegacyAvatarAsset, isLegacyGeneratedAvatar } from '@/utils/legacyGeneratedAvatar'

export function getProfileInitials(name?: string | null) {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? []
  return [parts[0], parts.length > 1 ? parts[parts.length - 1] : undefined]
    .filter(Boolean)
    .map((part) => Array.from(part!)[0]?.toLocaleUpperCase())
    .join('') || '?'
}

export function ProfileAvatar({ src, name, alt = '', className }: {
  src?: string | null
  name?: string | null
  alt?: string
  className?: string
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const [checked, setChecked] = useState<{ src: string; generated: boolean } | null>(null)
  const imageSrc = src?.trim()
  const displayName = name || alt

  useEffect(() => {
    if (!imageSrc?.startsWith('data:image/')) return
    let active = true
    void isLegacyGeneratedAvatar(imageSrc).then((generated) => {
      if (active) setChecked({ src: imageSrc, generated })
    })
    return () => { active = false }
  }, [imageSrc])

  const generated = imageSrc && (isLegacyAvatarAsset(imageSrc) || (checked?.src === imageSrc && checked.generated))
  const checking = imageSrc?.startsWith('data:image/') && checked?.src !== imageSrc
  if (!imageSrc || failedSrc === imageSrc || generated || checking) {
    return (
      <span
        className={cn('profile-avatar-media profile-avatar-initials', className)}
        role={alt ? 'img' : undefined}
        aria-label={alt ? (displayName ? `${displayName} avatar` : 'Profile avatar') : undefined}
        aria-hidden={alt ? undefined : true}
      >
        {getProfileInitials(displayName)}
      </span>
    )
  }

  return (
    <img
      key={imageSrc}
      src={imageSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      className={cn('profile-avatar-media', className)}
      onError={() => setFailedSrc(imageSrc)}
    />
  )
}
