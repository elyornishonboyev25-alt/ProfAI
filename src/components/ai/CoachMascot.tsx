import { useId, useState, type CSSProperties } from 'react'
import type { AiVoiceState } from '@/store/aiAssistantStore'
import './coach-studio.css'

export type CoachMascotProps = { state?: AiVoiceState; level?: number; size?: number; className?: string }

/** Nova is an inline vector character. Mouth opening follows measured playback amplitude. */
export default function CoachMascot({ state = 'idle', level = 0, size = 160, className = '' }: CoachMascotProps) {
  const id = useId().replace(/:/g, '')
  const [look, setLook] = useState({ x: 0, y: 0 })
  const amplitude = Number.isFinite(level) ? Math.min(1, Math.max(0, level)) : 0
  const mouth = state === 'speaking' ? Math.max(1.5, amplitude * 15) : 1.5
  return (
    <span className={`coach-mascot coach-mascot--${state} ${className}`} data-state={state}
      style={{ width: size, height: size, '--nova-level': amplitude } as CSSProperties} aria-hidden="true"
      onPointerMove={(event) => {
        if (event.pointerType !== 'mouse') return
        const rect = event.currentTarget.getBoundingClientRect()
        setLook({ x: ((event.clientX - rect.left) / rect.width - .5) * 5, y: ((event.clientY - rect.top) / rect.height - .5) * 3 })
      }} onPointerLeave={() => setLook({ x: 0, y: 0 })}>
      <svg viewBox="0 0 240 240" focusable="false">
        <defs>
          <linearGradient id={`${id}-metal`} x1=".2" y1="0" x2=".8" y2="1"><stop stopColor="#fff"/><stop offset=".35" stopColor="#eef0f3"/><stop offset=".65" stopColor="#c8ced7"/><stop offset="1" stopColor="#f5f6f8"/></linearGradient>
          <linearGradient id={`${id}-red`} x2=".7" y2="1"><stop stopColor="#f45565"/><stop offset=".6" stopColor="#cf1834"/><stop offset="1" stopColor="#9d102b"/></linearGradient>
          <linearGradient id={`${id}-glass`} x2=".5" y2="1"><stop stopColor="#343644"/><stop offset="1" stopColor="#151522"/></linearGradient>
          <radialGradient id={`${id}-halo`}><stop stopColor="#dc2443" stopOpacity=".13"/><stop offset="1" stopColor="#dc2443" stopOpacity="0"/></radialGradient>
        </defs>
        <circle cx="120" cy="122" r="116" fill={`url(#${id}-halo)`}/>
        <ellipse className="nova-shadow" cx="120" cy="216" rx="56" ry="9" fill="#374151" opacity=".12"/>
        <g className="nova-body">
          <path d="M89 164 Q120 149 151 164 L158 199 Q120 217 82 199Z" fill={`url(#${id}-metal)`} stroke="#b4bac6" strokeWidth="1.5"/>
          <path d="M92 177 Q120 186 148 177" fill="none" stroke="#fff" strokeWidth="2"/>
          <path d="M102 167 L120 182 L138 167" fill="none" stroke={`url(#${id}-red)`} strokeWidth="9" strokeLinejoin="round"/>
          <circle cx="120" cy="192" r="5" fill={`url(#${id}-red)`}/>
          <g className="nova-arm nova-arm-left"><path d="M85 170 Q66 170 64 187 Q65 197 80 193" fill={`url(#${id}-metal)`} stroke="#bac0ca" strokeWidth="1.5"/></g>
          <g className="nova-arm nova-arm-right"><path d="M155 170 Q174 170 176 187 Q175 197 160 193" fill={`url(#${id}-metal)`} stroke="#bac0ca" strokeWidth="1.5"/></g>
          <ellipse cx="98" cy="207" rx="18" ry="9" fill={`url(#${id}-metal)`} stroke="#c1c6ce"/>
          <ellipse cx="142" cy="207" rx="18" ry="9" fill={`url(#${id}-metal)`} stroke="#c1c6ce"/>
          <g className="nova-head">
            <g className="nova-ear nova-ear-left"><path d="M58 79 L49 27 Q48 19 56 24 L92 62Z" fill={`url(#${id}-metal)`} stroke="#b8bec8" strokeWidth="1.5"/><path d="M61 62 L57 37 L77 62Z" fill={`url(#${id}-red)`}/></g>
            <g className="nova-ear nova-ear-right"><path d="M182 79 L191 27 Q192 19 184 24 L148 62Z" fill={`url(#${id}-metal)`} stroke="#b8bec8" strokeWidth="1.5"/><path d="M179 62 L183 37 L163 62Z" fill={`url(#${id}-red)`}/></g>
            <rect x="39" y="88" width="17" height="45" rx="8" fill={`url(#${id}-red)`}/><rect x="184" y="88" width="17" height="45" rx="8" fill={`url(#${id}-red)`}/>
            <rect x="48" y="55" width="144" height="113" rx="47" fill={`url(#${id}-metal)`} stroke="#b8bec8" strokeWidth="1.5"/>
            <path d="M65 78 Q83 62 114 63" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity=".9"/>
            <rect x="59" y="76" width="122" height="73" rx="30" fill={`url(#${id}-glass)`} stroke="#a5a8b4"/>
            <path d="M72 89 Q104 79 152 86" fill="none" stroke="#fff" strokeWidth="2" opacity=".1"/>
            <g className="nova-eyes" style={{ transform: `translate(${look.x}px, ${look.y}px)` }}>
              <g className="nova-blink"><rect x="79" y="98" width="17" height="23" rx="8.5" fill="#fbf4f5"/><rect x="144" y="98" width="17" height="23" rx="8.5" fill="#fbf4f5"/>
              <circle cx="90" cy="104" r="3" fill="#fff"/><circle cx="155" cy="104" r="3" fill="#fff"/></g>
              <path className="nova-brow" d="M79 93 Q87 89 96 93 M144 93 Q153 89 161 93" fill="none" stroke="#fa6d82" strokeWidth="2.5" strokeLinecap="round"/>
            </g>
            <ellipse cx="73" cy="127" rx="8" ry="3" fill="#e24a62" opacity=".45"/><ellipse cx="167" cy="127" rx="8" ry="3" fill="#e24a62" opacity=".45"/>
            {state === 'speaking' ? <g><ellipse className="nova-mouth" data-mouth-open={mouth.toFixed(2)} cx="120" cy="130" rx={8 + amplitude * 4} ry={mouth} fill="#faeff1"/><ellipse cx="120" cy={130 + mouth * .45} rx={5 + amplitude * 2} ry={mouth * .33} fill="#eb6379"/></g>
              : <path className="nova-smile" d="M110 128 Q120 138 130 128" fill="none" stroke="#fdf2f4" strokeWidth="3" strokeLinecap="round"/>}
            <path d="M116 58 L120 52 L124 58" fill={`url(#${id}-red)`}/>
          </g>
        </g>
        {state === 'thinking' ? <g className="nova-thought"><circle cx="197" cy="54" r="4" fill="#cf1834"/><circle cx="209" cy="43" r="3" fill="#cf1834" opacity=".5"/><circle cx="217" cy="31" r="2" fill="#cf1834" opacity=".3"/></g> : null}
      </svg>
    </span>
  )
}
