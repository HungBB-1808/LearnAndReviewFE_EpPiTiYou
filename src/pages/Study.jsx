import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../store/useAppStore'
import { useNavigate } from 'react-router-dom'
import { ProgressBar } from '../components/shared/ProgressBar'
import { getTranslations } from '../lib/translations'

export const StudySession = () => {
    const { activeSession, selectedSubject, getCorrectAnswerFor, toggleBookmark, isBookmarked, updateSessionIndex, language } = useAppStore()
    const navigate = useNavigate()
    const t = getTranslations(language)

    useEffect(() => {
        if (!activeSession || activeSession.mode !== 'study') {
            navigate('/mode')
        }
    }, [activeSession, navigate])

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowRight' && activeSession?.currentIndex < activeSession?.questions.length - 1) updateSessionIndex(activeSession.currentIndex + 1)
            if (e.key === 'ArrowLeft' && activeSession?.currentIndex > 0) updateSessionIndex(activeSession.currentIndex - 1)
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [activeSession?.currentIndex, activeSession?.questions.length, updateSessionIndex])

    if (!activeSession) return null

    const questions = activeSession.questions
    const currentIndex = activeSession.currentIndex
    const q = questions[currentIndex]
    
    if (!q) return <div className="p-10 text-white">Question not found.</div>

    const bookmarked = isBookmarked(q.id)
    const corrects = getCorrectAnswerFor(q.id)
    
    const handleNext = () => {
        if (currentIndex < questions.length - 1) updateSessionIndex(currentIndex + 1)
    }
    const handlePrev = () => {
        if (currentIndex > 0) updateSessionIndex(currentIndex - 1)
    }

    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="p-4 md:p-10 flex flex-col h-full overflow-hidden"
        >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-4 md:mb-8 gap-4">
                <div className="space-y-2 md:space-y-4">
                    <div className="flex items-center gap-4 text-primary font-black tracking-widest uppercase text-xs">
                        <span className="w-12 h-[2px] bg-primary/30"></span>
                        {selectedSubject}
                        <span className="w-12 h-[2px] bg-primary/30"></span>
                    </div>
                    <h1 className="text-2xl md:text-4xl font-black text-white flex items-center gap-2 md:gap-4">
                        {t.study.question} <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300">{currentIndex + 1} / {questions.length}</span>
                        <button onClick={() => toggleBookmark(q.id)} className="ml-2 text-white/30 hover:text-yellow-400 transition-colors">
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: `'FILL' ${bookmarked ? 1 : 0}` }}>bookmark</span>
                        </button>
                    </h1>
                </div>
                <div className="flex gap-2 md:gap-4 w-full md:w-auto">
                    <button className="px-4 md:px-6 py-2 md:py-3 rounded-xl bg-white/5 text-white/50 font-bold hover:bg-white/10 hover:text-white transition-all flex items-center gap-2 text-xs md:text-sm">
                        <span className="material-symbols-outlined text-sm">flag</span> <span className="hidden md:inline">{t.study.report}</span>
                    </button>
                    <button onClick={() => navigate('/mode')} className="px-4 md:px-6 py-2 md:py-3 rounded-xl border border-error/50 text-error font-bold hover:bg-error/10 transition-all flex items-center gap-2 text-xs md:text-sm">
                        <span className="material-symbols-outlined text-sm">exit_to_app</span> {t.study.exit}
                    </button>
                </div>
            </div>

            <ProgressBar current={currentIndex + 1} total={questions.length} />

            <div className="flex-1 glass-panel rounded-2xl md:rounded-[2rem] p-4 md:p-10 flex flex-col min-h-0 bg-surface-container-high relative overflow-y-auto custom-scrollbar">
                <AnimatePresence mode="wait">
                    <motion.div 
                        key={q.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col h-full relative"
                    >
                        <h2 className="text-lg md:text-2xl font-medium leading-relaxed text-white mb-6 md:mb-10 max-w-4xl">
                            {q.questionTextCleaned || q.question}
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-auto">
                            {Object.keys(q.options).sort().map(opt => {
                                if (!q.options[opt]) return null
                                const isCorrect = corrects.includes(opt)
                                return (
                                    <div key={opt} className={`p-6 rounded-2xl flex items-center gap-4 transition-all ${isCorrect ? 'border border-green-500/50 bg-green-500/10 shadow-[0_0_20px_rgba(34,197,94,0.1)]' : 'border border-white/10 bg-white/5 opacity-70'}`}>
                                        <span className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full text-sm ${isCorrect ? 'bg-green-500 text-black font-black' : 'bg-white/10 text-white'}`}>{opt}</span>
                                        <span className={`text-md font-bold ${isCorrect ? 'text-white' : 'text-white/60'}`}>{q.options[opt]}</span>
                                        {isCorrect && <span className="material-symbols-outlined text-green-400 ml-auto">check_circle</span>}
                                    </div>
                                )
                            })}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            <footer className="flex justify-between items-center mt-4 md:mt-8 relative z-50">
                <button onClick={handlePrev} disabled={currentIndex === 0} className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/5 hover:bg-white/10 flex flex-col items-center justify-center text-white/50 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div className="flex space-x-2">
                    {questions.map((_, i) => (
                        <div key={i} className={`w-2 h-2 rounded-full transition-all duration-300 ${i === currentIndex ? 'bg-primary w-8' : 'bg-white/10'}`}></div>
                    )).slice(Math.max(0, currentIndex - 2), Math.min(questions.length, currentIndex + 3))}
                </div>
                <button onClick={handleNext} disabled={currentIndex === questions.length - 1} className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-primary hover:bg-primary-dim text-black shadow-[0_5px_20px_rgba(133,173,255,0.3)] flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                    <span className="material-symbols-outlined">arrow_forward</span>
                </button>
            </footer>
        </motion.div>
    )
}
