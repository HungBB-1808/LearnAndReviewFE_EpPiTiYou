import React from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '../store/useAppStore'
import { getTranslations } from '../lib/translations'

export const ExamHistory = () => {
    const { examHistory, language } = useAppStore()
    const t = getTranslations(language)

    const formatTimeSpent = (secs) => {
        const m = Math.floor(secs / 60)
        const s = secs % 60
        return `${m}m ${s}s`
    }

    return (
        <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="p-4 md:p-10 max-w-6xl mx-auto"
        >
            <div className="flex justify-between items-end mb-12">
                <div className="space-y-2">
                    <h2 className="text-2xl md:text-4xl font-black tracking-tight text-white">{t.history.title}</h2>
                    <p className="text-on-surface-variant max-w-md">{t.history.subtitle}</p>
                </div>
            </div>

            {examHistory.length === 0 ? (
                <div className="glass-panel p-20 rounded-[2rem] flex flex-col items-center justify-center text-center">
                    <span className="material-symbols-outlined text-6xl text-white/20 mb-4">history</span>
                    <h3 className="text-2xl font-bold text-white mb-2">{t.history.noHistory}</h3>
                    <p className="text-on-surface-variant">{t.history.noHistoryDesc}</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {[...examHistory].reverse().map((exam, i) => (
                        <div key={i} className="glass-card p-4 md:p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between group hover:-translate-y-1 transition-transform cursor-pointer gap-3">
                            <div className="flex items-center gap-4 md:gap-6">
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center font-black text-2xl ${exam.score >= 8 ? 'bg-green-500/20 text-green-400' : exam.score >= 5 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-error/20 text-error'}`}>
                                    {exam.score.toFixed(1)}
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-white mb-1">{exam.subject} {t.history.mockExam}</h4>
                                    <p className="text-xs md:text-sm text-on-surface-variant flex flex-wrap items-center gap-2 md:gap-4">
                                        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">calendar_today</span> {new Date(exam.date).toLocaleDateString()}</span>
                                        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">timer</span> {formatTimeSpent(exam.timeSpent)}</span>
                                        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">fact_check</span> {exam.correct}/{exam.total} {t.history.correct}</span>
                                    </p>
                                </div>
                            </div>
                            <span className="material-symbols-outlined text-white/20 group-hover:text-primary transition-colors">chevron_right</span>
                        </div>
                    ))}
                </div>
            )}
        </motion.div>
    )
}
