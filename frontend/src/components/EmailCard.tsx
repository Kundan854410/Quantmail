'use client'

import { motion } from 'framer-motion'
import { InboxMessage } from '@/lib/mockData'

interface EmailCardProps {
  message: InboxMessage
  isShadow?: boolean
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

export default function EmailCard({ message, isShadow = false }: EmailCardProps) {
  const showAiInsight = !isShadow && !!message.aiSummary

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ scale: 1.01 }}
      className={`
        rounded-lg border p-4 cursor-pointer transition-colors duration-200
        ${isShadow
          ? 'bg-cyber-panel/50 border-cyber-border hover:border-orange-500/40'
          : 'bg-cyber-panel border-cyber-border hover:border-cyber-blue'
        }
      `}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {!message.isRead && (
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isShadow ? 'bg-orange-500' : 'bg-cyber-blue'}`} />
            )}
            <span className={`text-xs font-mono truncate ${isShadow ? 'text-slate-500' : 'text-slate-400'}`}>
              {message.from}
            </span>
          </div>
          <h3 className={`text-sm font-semibold leading-tight truncate ${isShadow ? 'text-slate-500' : 'text-slate-200'}`}>
            {message.subject}
          </h3>
        </div>
        <span className={`text-xs font-mono flex-shrink-0 ${isShadow ? 'text-slate-700' : 'text-slate-600'}`}>
          {relativeTime(message.receivedAt)}
        </span>
      </div>

      {/* Preview */}
      <p className={`text-xs leading-relaxed line-clamp-2 mb-3 ${isShadow ? 'text-slate-600' : 'text-slate-500'}`}>
        {message.preview}
      </p>

      {/* Domain badge */}
      {isShadow && (
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-xs px-1.5 py-0.5 rounded bg-orange-500/10 border border-orange-500/20 text-orange-500/70 font-mono">
            ⚠ UNVERIFIED: @{message.fromDomain}
          </span>
        </div>
      )}

      {/* AI Insight */}
      {showAiInsight && (
        <div className="mt-2 rounded border border-cyan-500/20 bg-cyan-500/5 p-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-xs font-bold tracking-widest text-cyan-400">⚡ AI INSIGHT</span>
          </div>
          <p className="text-xs text-cyan-300/80 leading-relaxed mb-2">
            {message.aiSummary}
          </p>
          {message.aiActions && message.aiActions.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {message.aiActions.map((action) => (
                <button
                  key={action.action}
                  className="text-xs px-2 py-1 rounded border border-cyber-blue/30 bg-cyber-blue/5 text-cyber-blue/80 hover:bg-cyber-blue/10 hover:border-cyber-blue/60 transition-colors duration-150 font-mono"
                >
                  ✓ {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}
