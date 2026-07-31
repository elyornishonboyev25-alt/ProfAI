// Premium gamification & animation primitives.
// Hero3D is intentionally NOT re-exported here — import Hero3DStage instead,
// which lazy-loads the heavy three.js bundle on demand.
export { default as Tilt3D } from './Tilt3D'
export { default as CountUp } from './CountUp'
export { default as ProgressRing } from './ProgressRing'
export { default as AnimatedBar } from './AnimatedBar'
export { default as Reveal } from './Reveal'
export { Stagger, StaggerItem } from './Stagger'
export { default as AmbientBackdrop } from './AmbientBackdrop'
export { default as BrandIcon } from './BrandIcon'
export { default as DifficultyBadge, type Difficulty } from './DifficultyBadge'
export { default as XPBadge } from './XPBadge'
export { default as CrownBadge } from './CrownBadge'
export { default as Burst } from './Burst'
export { default as XPGem } from './XPGem'
export { default as FeatureSticker } from './FeatureSticker'
// Hero3DStage (react-three-fiber) is available at '@/components/fx/Hero3DStage'
// but intentionally not re-exported here so the heavy three.js bundle is only
// pulled in if a page imports it directly.
