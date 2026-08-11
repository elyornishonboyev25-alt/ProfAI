import { motion } from 'framer-motion'

export default function UniversityGlobe() {
  return (
    <motion.figure
      className="university-globe-card"
      initial={{ opacity: 0, scale: 0.9, x: -36 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
    >
      <img
        src="/assets/university-globe-glass.png"
        alt="Glass globe showing university routes from Uzbekistan"
        className="university-globe-reference-image"
        draggable={false}
        decoding="async"
      />
    </motion.figure>
  )
}
