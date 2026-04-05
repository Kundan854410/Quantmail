'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type Phase = 'init' | 'scanning' | 'verified' | 'confirmed'

interface BiometricLoginProps {
  onSuccess: () => void
}

const phaseMessages: Record<Phase, string> = {
  init: 'INITIALIZING BIOMETRIC SCAN',
  scanning: 'ANALYZING FACIAL MATRIX...',
  verified: 'LIVENESS VERIFIED ✓',
  confirmed: 'IDENTITY CONFIRMED',
}

const phaseColors: Record<Phase, string> = {
  init: 'text-cyber-blue',
  scanning: 'text-cyber-blue',
  verified: 'text-cyber-green',
  confirmed: 'text-cyber-green',
}

export default function BiometricLogin({ onSuccess }: BiometricLoginProps) {
  const [phase, setPhase] = useState<Phase>('init')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('scanning'), 800)
    const t2 = setTimeout(() => setPhase('verified'), 2200)
    const t3 = setTimeout(() => setPhase('confirmed'), 3000)
    const t4 = setTimeout(() => onSuccess(), 3800)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
    }
  }, [onSuccess])

  return (
    <div className="min-h-screen bg-cyber-darker flex flex-col items-center justify-center px-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-12 text-center"
      >
        <h1 className="text-5xl font-bold tracking-widest bg-gradient-to-r from-cyber-blue to-cyber-purple bg-clip-text text-transparent">
          QUANTMAIL
        </h1>
        <p className="mt-2 text-xs tracking-[0.4em] text-slate-500 uppercase">
          Biometric Identity Gateway
        </p>
      </motion.div>

      {/* Scanner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="relative flex items-center justify-center mb-10"
      >
        {/* Outer pulsing ring */}
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute w-64 h-64 rounded-full border border-cyber-blue/40"
        />

        {/* Second ring */}
        <motion.div
          animate={{ scale: [1, 1.04, 1], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
          className="absolute w-56 h-56 rounded-full border border-cyber-purple/30"
        />

        {/* Rotating ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          className="absolute w-52 h-52 rounded-full border-2 border-dashed border-cyber-blue/50"
        />

        {/* Inner circle */}
        <div className="relative w-44 h-44 rounded-full bg-cyber-panel border border-cyber-border flex items-center justify-center overflow-hidden">
          {/* Scanning line */}
          {(phase === 'scanning' || phase === 'init') && (
            <motion.div
              initial={{ y: -88 }}
              animate={{ y: 88 }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyber-blue to-transparent opacity-80"
            />
          )}

          {/* Face icon */}
          <motion.svg
            animate={
              phase === 'verified' || phase === 'confirmed'
                ? { scale: [1, 1.1, 1] }
                : {}
            }
            transition={{ duration: 0.4 }}
            className={`w-16 h-16 transition-colors duration-500 ${
              phase === 'verified' || phase === 'confirmed'
                ? 'text-cyber-green'
                : 'text-cyber-blue/60'
            }`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            <circle cx="9" cy="7.5" r="0.5" fill="currentColor" />
            <circle cx="15" cy="7.5" r="0.5" fill="currentColor" />
            <path d="M9.5 10c0.7 0.8 2.3 0.8 3 0" strokeLinecap="round" />
          </motion.svg>

          {/* Corner brackets */}
          <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-cyber-blue/70" />
          <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-cyber-blue/70" />
          <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-cyber-blue/70" />
          <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-cyber-blue/70" />
        </div>

        {/* Glow on verified */}
        <AnimatePresence>
          {(phase === 'verified' || phase === 'confirmed') && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute w-64 h-64 rounded-full bg-cyber-green/5 border border-cyber-green/30"
            />
          )}
        </AnimatePresence>
      </motion.div>

      {/* Phase message */}
      <div className="h-10 flex items-center justify-center mb-8">
        <AnimatePresence mode="wait">
          <motion.p
            key={phase}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className={`text-sm tracking-[0.3em] font-mono font-semibold ${phaseColors[phase]}`}
          >
            {phaseMessages[phase]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Progress dots */}
      <div className="flex gap-2">
        {(['init', 'scanning', 'verified', 'confirmed'] as Phase[]).map((p, i) => (
          <motion.div
            key={p}
            animate={{
              backgroundColor:
                ['init', 'scanning', 'verified', 'confirmed'].indexOf(phase) >= i
                  ? '#00f5ff'
                  : '#1a1a3e',
              scale:
                ['init', 'scanning', 'verified', 'confirmed'].indexOf(phase) === i
                  ? 1.4
                  : 1,
            }}
            transition={{ duration: 0.3 }}
            className="w-2 h-2 rounded-full bg-cyber-border"
          />
        ))}
      </div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ delay: 0.8 }}
        className="absolute bottom-6 text-xs text-slate-600 tracking-widest"
      >
        QUANTUM BIOMETRIC PROTOCOL v3.0 — ZERO TRUST AUTH
      </motion.p>
    </div>
  )
}
