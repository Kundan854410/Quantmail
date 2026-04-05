'use client'

import { motion } from 'framer-motion'
import { mockInboxMessages, mockShadowMessages, mockUser } from '@/lib/mockData'
import EmailCard from './EmailCard'

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
    },
  },
}

interface InboxDashboardProps {
  onSignOut?: () => void
}

export default function InboxDashboard({ onSignOut }: InboxDashboardProps) {
  return (
    <div className="min-h-screen bg-cyber-darker flex flex-col">
      {/* Navbar */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between px-6 py-4 border-b border-cyber-border bg-cyber-panel/60 backdrop-blur"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold tracking-widest bg-gradient-to-r from-cyber-blue to-cyber-purple bg-clip-text text-transparent">
            QUANTMAIL
          </span>
          <span className="text-xs px-2 py-0.5 rounded border border-cyber-blue/30 text-cyber-blue/70 tracking-wider">
            v3.0
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyber-green animate-pulse" />
            <span className="text-sm text-slate-400 font-mono">{mockUser.email}</span>
          </div>
          <button
            onClick={onSignOut}
            className="text-xs px-3 py-1.5 rounded border border-cyber-border text-slate-400 hover:border-cyber-blue hover:text-cyber-blue transition-colors duration-200 tracking-wider"
          >
            SIGN OUT
          </button>
        </div>
      </motion.nav>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Human inbox — 60% */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-3/5 flex flex-col border-r border-cyber-border overflow-hidden"
        >
          {/* Panel header */}
          <div className="px-6 py-4 border-b border-cyber-border bg-cyber-panel/40">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-cyber-green" />
              <h2 className="text-xs font-semibold tracking-[0.25em] text-slate-300 uppercase">
                Human Communications
              </h2>
              <span className="ml-auto text-xs text-slate-600 font-mono">
                {mockInboxMessages.length} messages
              </span>
            </div>
          </div>

          {/* Message list */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="flex-1 overflow-y-auto p-4 space-y-3"
          >
            {mockInboxMessages.map((msg) => (
              <EmailCard key={msg.id} message={msg} isShadow={false} />
            ))}
          </motion.div>
        </motion.div>

        {/* Shadow inbox — 40% */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-2/5 flex flex-col overflow-hidden"
        >
          {/* Panel header */}
          <div className="px-6 py-4 border-b border-cyber-border bg-cyber-panel/40">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              <div>
                <h2 className="text-xs font-semibold tracking-[0.25em] text-slate-400 uppercase">
                  AI Auto-Negotiated Spam
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">(AI is handling these)</p>
              </div>
              <span className="ml-auto text-xs text-slate-600 font-mono">
                {mockShadowMessages.length} intercepted
              </span>
            </div>
          </div>

          {/* Shadow message list */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="flex-1 overflow-y-auto p-4 space-y-3 opacity-70"
          >
            {mockShadowMessages.map((msg) => (
              <EmailCard key={msg.id} message={msg} isShadow={true} />
            ))}
          </motion.div>

          {/* AI status footer */}
          <div className="px-6 py-3 border-t border-cyber-border bg-cyber-panel/20">
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-orange-500"
              />
              <p className="text-xs text-slate-600 font-mono">
                AI COPILOT ACTIVE — AUTO-REJECTING UNVERIFIED DOMAINS
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
