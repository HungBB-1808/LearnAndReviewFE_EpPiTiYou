import React from 'react'
import { motion } from 'framer-motion'

export const ProgressBar = ({ current, total, colorClass = "from-primary to-secondary" }) => {
    const pct = total === 0 ? 0 : Math.round((current / total) * 100)
    
    return (
        <div className="w-full max-w-2xl mx-auto mb-8">
            <div className="flex justify-between items-end mb-2">
                <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-black text-white/80 uppercase tracking-widest bg-white/5 py-1 px-3 rounded-full border border-white/10 w-fit">
                        Progress: {current} / {total}
                    </span>
                    <span className="text-[11px] font-black text-white/80 uppercase tracking-widest bg-white/5 py-1 px-3 rounded-full border border-white/10 w-fit">
                        Remaining: {total - current}
                    </span>
                </div>
                <span className="text-2xl font-black text-white px-2">{pct}%</span>
            </div>
            
            <div className="w-full h-2 bg-surface-container-low rounded-full overflow-hidden border border-white/5 shadow-inner relative">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                    className={`h-full bg-gradient-to-r ${colorClass} rounded-full shadow-[0_0_15px_rgba(133,173,255,0.5)]`}
                />
            </div>
        </div>
    )
}
