import UiText from '@/components/common/UiText'
﻿import { useState, useRef, useEffect } from 'react'
import { PlayIcon, PauseIcon, SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/solid'

interface AudioPlayerProps {
    src: string
    onPlay?: () => void
    onPause?: () => void
    onEnded?: () => void
    disabled?: boolean
}

export default function AudioPlayer({ src, onPlay, onPause, onEnded, disabled = false }: AudioPlayerProps) {
    const audioRef = useRef<HTMLAudioElement>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [volume, setVolume] = useState(1)
    const [isMuted, setIsMuted] = useState(false)
    const [playbackSpeed, setPlaybackSpeed] = useState(1)

    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return

        const updateTime = () => setCurrentTime(audio.currentTime)
        const updateDuration = () => setDuration(audio.duration)
        const handleEnded = () => {
            setIsPlaying(false)
            onEnded?.()
        }

        audio.addEventListener('timeupdate', updateTime)
        audio.addEventListener('loadedmetadata', updateDuration)
        audio.addEventListener('ended', handleEnded)

        return () => {
            audio.removeEventListener('timeupdate', updateTime)
            audio.removeEventListener('loadedmetadata', updateDuration)
            audio.removeEventListener('ended', handleEnded)
        }
    }, [onEnded])

    const togglePlay = () => {
        if (disabled) return
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause()
                onPause?.()
            } else {
                audioRef.current.play()
                onPlay?.()
            }
            setIsPlaying(!isPlaying)
        }
    }

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTime = parseFloat(e.target.value)
        if (audioRef.current) {
            audioRef.current.currentTime = newTime
            setCurrentTime(newTime)
        }
    }

    const toggleMute = () => {
        if (audioRef.current) {
            audioRef.current.muted = !isMuted
            setIsMuted(!isMuted)
        }
    }

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value)
        if (audioRef.current) {
            audioRef.current.volume = newVolume
            setVolume(newVolume)
            setIsMuted(newVolume === 0)
        }
    }

    const changeSpeed = () => {
        const speeds = [0.75, 1, 1.25, 1.5]
        const currentIndex = speeds.indexOf(playbackSpeed)
        const nextSpeed = speeds[(currentIndex + 1) % speeds.length]
        if (audioRef.current) {
            audioRef.current.playbackRate = nextSpeed
            setPlaybackSpeed(nextSpeed)
        }
    }

    const formatTime = (time: number) => {
        if (isNaN(time)) return '00:00'
        const mins = Math.floor(time / 60)
        const secs = Math.floor(time % 60)
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <div className={`
      bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm
      ${disabled ? 'opacity-60 pointer-events-none' : ''}
    `}>
            <audio ref={audioRef} src={src} />

            <div className="flex items-center space-x-4 mb-3">
                <button
                    onClick={togglePlay}
                    disabled={disabled}
                    className="w-12 h-12 flex items-center justify-center bg-primary-500 hover:bg-primary-600 text-white rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-300 dark:focus:ring-primary-700"
                >
                    {isPlaying ? (
                        <PauseIcon className="h-6 w-6" />
                    ) : (
                        <PlayIcon className="h-6 w-6 ml-1" />
                    )}
                </button>

                <div className="flex-1">
                    <input
                        type="range"
                        min="0"
                        max={duration || 0}
                        value={currentTime}
                        onChange={handleSeek}
                        disabled={disabled}
                        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
                    />
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <button
                        onClick={toggleMute}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                        {isMuted || volume === 0 ? (
                            <SpeakerXMarkIcon className="h-5 w-5" />
                        ) : (
                            <SpeakerWaveIcon className="h-5 w-5" />
                        )}
                    </button>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={isMuted ? 0 : volume}
                        onChange={handleVolumeChange}
                        className="w-20 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-gray-500"
                    />
                </div>

                <button
                    onClick={changeSpeed}
                    className="text-xs font-medium px-2 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                    {playbackSpeed}<UiText text={"x Speed"} />
                </button>
            </div>
        </div>
    )
}

