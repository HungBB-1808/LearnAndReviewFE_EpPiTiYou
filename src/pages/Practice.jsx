import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../store/useAppStore'
import { useNavigate } from 'react-router-dom'
import { ProgressBar } from '../components/shared/ProgressBar'

export const PracticeSession = () => {
    const { activeSession, selectedSubject, getCorrectAnswerFor, toggleBookmark, isBookmarked, updateSessionIndex, updateSessionAnswer } = useAppStore()
    const navigate = useNavigate()

    useEffect(() => {
        if (!activeSession || activeSession.mode !== 'practice') {
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
    const hasAnswered = !!activeSession.answers[currentIndex]
    const userAnswer = activeSession.answers[currentIndex]
    
    const handleNext = () => {
        if (currentIndex < questions.length - 1) updateSessionIndex(currentIndex + 1)
    }
    const handlePrev = () => {
        if (currentIndex > 0) updateSessionIndex(currentIndex - 1)
    }

    const handleSelectOption = (opt) => {
        if (hasAnswered) return
        updateSessionAnswer(currentIndex, opt)
    }

    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="p-10 flex flex-col h-full overflow-hidden"
        >
            <div className="flex justify-between items-end mb-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-4 text-tertiary font-black tracking-widest uppercase text-xs">
                        <span className="w-12 h-[2px] bg-tertiary/30"></span>
                        {selectedSubject}
                        <span className="w-12 h-[2px] bg-tertiary/30"></span>
                    </div>
                    <h1 className="text-4xl font-black text-white flex items-center gap-4">
                        Luyện tập <span className="text-[0.6em] text-cyan-400 align-middle ml-4 bg-white/10 px-4 py-2 rounded-full border border-white/5">{currentIndex + 1} / {questions.length}</span>
                        <button onClick={() => toggleBookmark(q.id)} className="ml-2 text-white/30 hover:text-yellow-400 transition-colors">
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: `'FILL' ${bookmarked ? 1 : 0}` }}>bookmark</span>
                        </button>
                    </h1>
                </div>
                <div className="flex gap-4">
                    <button className="px-6 py-3 rounded-xl bg-white/5 text-white/50 font-bold hover:bg-white/10 hover:text-white transition-all flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">flag</span> Report
                    </button>
                    <button onClick={() => navigate('/mode')} className="px-6 py-3 rounded-xl border border-error/50 text-error font-bold hover:bg-error/10 transition-all flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">exit_to_app</span> Exit
                    </button>
                </div>
            </div>

            <ProgressBar current={currentIndex + 1} total={questions.length} colorClass="from-tertiary to-tertiary-dim" />

            <div className="flex-1 glass-panel rounded-[2rem] p-10 flex flex-col min-h-0 bg-surface-container-high relative overflow-y-auto custom-scrollbar">
                <AnimatePresence mode="wait">
                    <motion.div 
                        key={q.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col h-full relative"
                    >
                        <h2 className="text-2xl font-medium leading-relaxed text-white mb-10 max-w-4xl">
                            {q.questionTextCleaned || q.question}
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-auto">
                            {['A','B','C','D'].map(opt => {
                                if (!q.options[opt]) return null
                                
                                const isSelected = userAnswer === opt
                                const isCorrect = corrects.includes(opt)
                                
                                let wrapperClass = "group relative flex items-center p-6 glass-card rounded-lg border border-white/5 hover:border-white/20 hover:bg-white/10 transition-all text-left w-full overflow-hidden cursor-pointer"
                                let tokenClass = "flex flex-shrink-0 items-center justify-center w-10 h-10 rounded-lg bg-surface-container-highest text-on-surface font-bold mr-4 group-hover:bg-primary group-hover:text-black transition-colors border-none"
                                let iconCode = null
                                
                                if (hasAnswered) {
                                    wrapperClass = "group relative flex items-center p-6 rounded-lg transition-all text-left w-full overflow-hidden"
                                    
                                    if (isCorrect) {
                                        wrapperClass += " border border-green-500/40 bg-green-500/10 ring-1 ring-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.15)]"
                                        tokenClass = "flex flex-shrink-0 items-center justify-center w-10 h-10 rounded-lg bg-green-500 text-white font-bold mr-4 border-none"
                                        iconCode = <span className="material-symbols-outlined ml-auto text-green-400">check_circle</span>
                                    } else if (isSelected) {
                                        wrapperClass += " border border-error/40 bg-error/10 ring-1 ring-error/50 shadow-[0_0_20px_rgba(255,110,132,0.15)]"
                                        tokenClass = "flex flex-shrink-0 items-center justify-center w-10 h-10 rounded-lg bg-error text-white font-bold mr-4 border-none"
                                        iconCode = <span className="material-symbols-outlined ml-auto text-error">cancel</span>
                                    } else {
                                        wrapperClass += " border border-white/5 bg-white/5 opacity-40"
                                    }
                                }

                                return (
                                    <motion.button 
                                        key={opt}
                                        whileHover={!hasAnswered ? { scale: 1.02 } : {}}
                                        whileTap={!hasAnswered ? { scale: 0.98 } : {}}
                                        onClick={() => handleSelectOption(opt)}
                                        className={wrapperClass}
                                    >
                                        <div className={tokenClass}>{opt}</div>
                                        <span className="text-lg font-medium text-on-surface-variant group-hover:text-on-surface">{q.options[opt]}</span>
                                        {iconCode}
                                    </motion.button>
                                )
                            })}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            <footer className="flex justify-between items-center mt-8 relative z-50">
                <button onClick={handlePrev} disabled={currentIndex === 0} className="w-16 h-16 rounded-full bg-white/5 hover:bg-white/10 flex flex-col items-center justify-center text-white/50 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div className="flex space-x-2">
                    {questions.map((_, i) => (
                        <div key={i} className={`w-2 h-2 rounded-full transition-all duration-300 ${i === currentIndex ? 'bg-tertiary w-8' : 'bg-white/10'}`}></div>
                    )).slice(Math.max(0, currentIndex - 2), Math.min(questions.length, currentIndex + 3))}
                </div>
                <button 
                  onClick={handleNext} 
                  disabled={currentIndex === questions.length - 1} 
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-[0_5px_20px_rgba(92,202,252,0.3)] ${hasAnswered ? 'bg-tertiary hover:bg-tertiary-dim text-black' : 'bg-white/10 text-white/20'}`}
                >
                    <span className="material-symbols-outlined">arrow_forward</span>
                </button>
            </footer>
        </motion.div>
    )
}
