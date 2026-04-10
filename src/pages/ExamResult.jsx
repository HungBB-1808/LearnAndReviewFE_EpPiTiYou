import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { getTranslations } from '../lib/translations'

export const ExamResult = () => {
    const { state } = useLocation()
    const navigate = useNavigate()
    const { selectedSubject, getCorrectAnswerFor, language } = useAppStore()
    const [viewAnswers, setViewAnswers] = useState(false)
    const t = getTranslations(language)

    useEffect(() => {
        if (!state) navigate('/subjects')
    }, [state, navigate])

    if (!state) return null

    const { score, correct, total, timeSpent, questions, answers } = state
    const formatTimeSpent = (secs) => {
        const m = Math.floor(secs / 60)
        const s = secs % 60
        return `${m}m ${s}s`
    }

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-10 max-w-5xl mx-auto"
        >
            <div className="flex justify-between items-center mb-12">
                <div>
                    <h2 className="text-4xl font-black text-white tracking-tight mb-2">{t.result.performanceAnalytics}</h2>
                    <p className="text-on-surface-variant flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                        {selectedSubject} {t.result.moduleReport}
                    </p>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => navigate('/history')} className="px-6 py-3 rounded-full bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-all font-bold">
                        {t.result.viewHistory}
                    </button>
                    <button onClick={() => navigate('/subjects')} className="px-6 py-3 rounded-full border border-primary/30 text-primary font-bold hover:bg-primary/10 transition-colors">
                        {t.result.backToSubjects}
                    </button>
                    <button onClick={() => navigate('/mode')} className="px-6 py-3 rounded-full bg-gradient-to-r from-primary to-primary-dim text-black font-black shadow-[0_10px_30px_rgba(0,112,235,0.3)] hover:scale-105 transition-transform">
                        {t.result.tryAgain}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="glass-card p-8 rounded-[2rem] flex flex-col items-center justify-center relative overflow-hidden ring-2 ring-primary/20">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full"></div>
                    <span className="text-[10px] font-black uppercase text-primary tracking-widest mb-2 z-10">{t.result.totalScore}</span>
                    <span className="text-7xl font-black text-white z-10">{score.toFixed(1)}<span className="text-2xl text-white/30">/10</span></span>
                    <span className="text-sm font-medium text-white/50 mt-4 px-4 py-1 bg-white/5 rounded-full z-10 border border-white/5">Percentile: 85th</span>
                </motion.div>
                
                <div className="glass-card p-8 rounded-[2rem] flex flex-col justify-center">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-400">
                            <span className="material-symbols-outlined">task_alt</span>
                        </div>
                        <div>
                            <span className="text-[10px] font-black uppercase text-on-surface-variant tracking-widest">{t.result.accuracyDetails}</span>
                            <div className="text-3xl font-bold text-white mt-1">
                                {correct} <span className="text-sm text-white/30 font-medium">/ {total} {t.result.correct}</span>
                            </div>
                        </div>
                    </div>
                    <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${(correct/total)*100}%` }} className="h-full bg-green-500 rounded-full" />
                    </div>
                </div>

                <div className="glass-card p-8 rounded-[2rem] flex flex-col justify-center">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-tertiary/10 flex items-center justify-center text-tertiary">
                            <span className="material-symbols-outlined">timer</span>
                        </div>
                        <div>
                            <span className="text-[10px] font-black uppercase text-on-surface-variant tracking-widest">{t.result.timeEfficiency}</span>
                            <div className="text-3xl font-bold text-white mt-1">{formatTimeSpent(timeSpent)}</div>
                        </div>
                    </div>
                    <p className="text-xs text-white/40">{t.result.avgPerQuestion((timeSpent / total).toFixed(1))}</p>
                </div>
            </div>

            <div className="flex justify-center mb-8">
                <button 
                  onClick={() => setViewAnswers(!viewAnswers)} 
                  className="px-8 py-4 rounded-full bg-surface-container border border-white/5 text-white/80 hover:text-white transition-all font-medium flex items-center gap-2"
                >
                    {viewAnswers ? t.result.hideReview : t.result.reviewAnswers}
                    <span className="material-symbols-outlined text-sm">{viewAnswers ? 'expand_less' : 'expand_more'}</span>
                </button>
            </div>

            <AnimatePresence>
                {viewAnswers && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-6 overflow-hidden"
                    >
                        {questions.map((q, i) => {
                            const uAnsRaw = (answers[i] || "").split(',').filter(Boolean).sort()
                            const cAnsRaw = getCorrectAnswerFor(q.id).sort()
                            const isCorrect = uAnsRaw.join(',') === cAnsRaw.join(',')
                            
                            return (
                                <div key={i} className={`glass-card p-6 rounded-2xl border-l-4 ${isCorrect ? 'border-l-green-500' : 'border-l-error'}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-4">
                                            <span className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-sm font-bold text-white/50">{i + 1}</span>
                                            <h4 className="text-lg font-medium text-white max-w-2xl">{q.questionTextCleaned || q.question}</h4>
                                        </div>
                                        <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isCorrect ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-error/10 text-error border border-error/20'}`}>
                                            {isCorrect ? t.result.correctLabel : t.result.incorrectLabel}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 ml-12">
                                        {Object.keys(q.options).sort().map(opt => {
                                            if (!q.options[opt]) return null
                                            const isSelected = uAnsRaw.includes(opt)
                                            const isActualCorrect = cAnsRaw.includes(opt)
                                            
                                            let borderClass = 'border-white/5 bg-surface-container-highest/20 text-white/50'
                                            let iconCode = null
                                            
                                            if (isActualCorrect) {
                                                borderClass = 'border-green-500/50 bg-green-500/10 text-green-400 ring-1 ring-green-500/20'
                                                iconCode = <span className="material-symbols-outlined ml-auto text-green-400 text-sm">check_circle</span>
                                            } else if (isSelected) {
                                                borderClass = 'border-error/50 bg-error/10 text-error ring-1 ring-error/20'
                                                iconCode = <span className="material-symbols-outlined ml-auto text-error text-sm">cancel</span>
                                            }

                                            return (
                                                <div key={opt} className={`p-4 rounded-xl flex items-center gap-3 border transition-all ${borderClass}`}>
                                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${isActualCorrect ? 'bg-green-500 text-black' : isSelected ? 'bg-error text-white' : 'bg-surface-container text-white/50'}`}>
                                                        {opt}
                                                    </span>
                                                    <span className="text-sm font-medium">{q.options[opt]}</span>
                                                    {iconCode}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}
