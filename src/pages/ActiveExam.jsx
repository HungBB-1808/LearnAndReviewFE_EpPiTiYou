import React, { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '../store/useAppStore'
import { useNavigate } from 'react-router-dom'
import { getTranslations } from '../lib/translations'

export const ActiveExam = () => {
    const { activeSession, selectedSubject, updateSessionIndex, updateSessionAnswer, updateSessionTime, examSettings, getCorrectAnswerFor, saveExamResult, language } = useAppStore()
    const navigate = useNavigate()
    const t = getTranslations(language)
    const [timeLeft, setTimeLeft] = useState(examSettings.timeLimit * 60)
    const timerRef = useRef()
    const sessionStartRef = useRef(Date.now())
    const [showNav, setShowNav] = useState(false)

    useEffect(() => {
        if (!activeSession || activeSession.mode !== 'exam') {
            navigate('/mode')
            return
        }
        
        // Timer logic - ONLY RUN ONCE
        if (!timerRef.current) {
            sessionStartRef.current = Date.now()
            const start = sessionStartRef.current
            const initialTimeSpent = useAppStore.getState().activeSession?.timeSpent || 0
            const initialTimeLeft = (examSettings.timeLimit * 60) - initialTimeSpent
            setTimeLeft(initialTimeLeft)

            timerRef.current = setInterval(() => {
                const passed = Math.floor((Date.now() - start) / 1000)
                const remaining = initialTimeLeft - passed
                setTimeLeft(remaining)
                
                // Save state occasionally without depending on closure
                if (passed > 0 && passed % 10 === 0) {
                    useAppStore.getState().updateSessionTime(initialTimeSpent + passed)
                }

                if (remaining <= 0) {
                    clearInterval(timerRef.current)
                    timerRef.current = null
                    
                    // We must use fresh state, not closure
                    const store = useAppStore.getState()
                    const sess = store.activeSession
                    const passedSec = Math.floor((Date.now() - sessionStartRef.current) / 1000)
                    const totalT = (sess?.timeSpent || 0) + passedSec
                    store.updateSessionTime(totalT)
                    
                    let correctCount = 0
                    sess.questions.forEach((q, i) => {
                        const corrects = store.getCorrectAnswerFor(q.id).sort().join(',')
                        const userAns = (sess.answers[i] || "").split(',').filter(Boolean).sort().join(',')
                        if (corrects === userAns && corrects !== "") {
                            correctCount++
                        }
                    })

                    const score = Number(((correctCount / sess.questions.length) * 10).toFixed(2))

                    store.saveExamResult({
                        score,
                        correct: correctCount,
                        total: sess.questions.length,
                        timeSpent: totalT,
                        questions: sess.questions,
                        answers: sess.answers
                    })

                    navigate('/result', { state: { score, correct: correctCount, total: sess.questions.length, timeSpent: totalT, questions: sess.questions, answers: sess.answers }})
                    store.clearSession()
                }
            }, 1000)
        }

        // Force Sidebar closed
        if (window.setSidebarState) window.setSidebarState(false)

        return () => { } // cleanup moved to unmount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        return () => {
             if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [])

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowRight' && activeSession?.currentIndex < activeSession?.questions.length - 1) {
                updateSessionIndex(activeSession.currentIndex + 1)
            }
            if (e.key === 'ArrowLeft' && activeSession?.currentIndex > 0) {
                updateSessionIndex(activeSession.currentIndex - 1)
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [activeSession?.currentIndex, activeSession?.questions.length, updateSessionIndex])

    if (!activeSession) return null

    const questions = activeSession.questions
    const currentIndex = activeSession.currentIndex
    const q = questions[currentIndex]
    const userAnswer = activeSession.answers[currentIndex]

    const handleSubmit = () => {
        clearInterval(timerRef.current)
        timerRef.current = null
        
        const store = useAppStore.getState()
        const sess = store.activeSession
        if (!sess) return

        const passedSeconds = Math.floor((Date.now() - sessionStartRef.current) / 1000)
        const initialTimeSpent = sess.timeSpent - passedSeconds > 0 ? sess.timeSpent : 0 
        const finalTimeSpent = initialTimeSpent + passedSeconds
        
        store.updateSessionTime(finalTimeSpent)
        
        let correctCount = 0
        sess.questions.forEach((q, i) => {
            const corrects = store.getCorrectAnswerFor(q.id).sort().join(',')
            const userAns = (sess.answers[i] || "").split(',').filter(Boolean).sort().join(',')
            if (corrects === userAns && corrects !== "") {
                correctCount++
            }
        })

        const score = Number(((correctCount / sess.questions.length) * 10).toFixed(2))

        store.saveExamResult({
            score,
            correct: correctCount,
            total: sess.questions.length,
            timeSpent: finalTimeSpent,
            questions: sess.questions,
            answers: sess.answers
        })

        navigate('/result', { state: { score, correct: correctCount, total: sess.questions.length, timeSpent: finalTimeSpent, questions: sess.questions, answers: sess.answers }})
        store.clearSession()
    }

    const formatTime = (secs) => {
        if(secs < 0) secs = 0
        const m = Math.floor(secs / 60).toString().padStart(2, '0')
        const s = (secs % 60).toString().padStart(2, '0')
        return `${m}:${s}`
    }

    const isWarning = timeLeft < 300 // < 5 mins

    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="flex flex-col md:flex-row h-full bg-surface relative"
        >
            <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-10 relative overflow-hidden">
                <div className="hidden md:block absolute top-0 right-0 w-[800px] h-[800px] bg-error/5 blur-[150px] rounded-full pointer-events-none"></div>

                <div className="w-full max-w-4xl relative z-10 flex flex-col h-full">
                    <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-8 gap-3">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="w-2 h-2 rounded-full bg-error animate-pulse"></span>
                                <span className="text-[10px] text-error font-black uppercase tracking-widest">{t.exam.liveExam}</span>
                            </div>
                            <h2 className="text-xl md:text-3xl font-bold text-white tracking-tight">{selectedSubject} {t.exam.mockExam}</h2>
                        </div>
                        <div className={`px-6 py-3 rounded-2xl border ${isWarning ? 'bg-error/20 border-error/50 text-error animate-pulse' : 'bg-surface-container-highest border-white/10 text-white'} flex items-center gap-3 backdrop-blur-md`}>
                            <span className="material-symbols-outlined">{isWarning ? 'warning' : 'schedule'}</span>
                            <span className="text-3xl font-mono font-bold tracking-tight">{formatTime(timeLeft)}</span>
                        </div>
                    </header>

                    <div className="flex-1 glass-card p-4 md:p-10 rounded-2xl flex flex-col ring-1 ring-white/5 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-surface-container">
                            <motion.div 
                                className="h-full bg-error rounded-r-full" 
                                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                                transition={{ type: "spring" }}
                            />
                        </div>

                        <div className="flex items-start md:items-center gap-3 md:gap-4 mb-4 md:mb-8">
                            <span className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-error/10 text-error flex items-center justify-center font-black shrink-0">{currentIndex + 1}</span>
                            <h3 className="text-base md:text-xl font-medium text-white/90 leading-relaxed flex-1">
                                {q.questionTextCleaned || q.question}
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 gap-4 mt-auto">
                            {Object.keys(q.options).sort().map(opt => {
                                if (!q.options[opt]) return null
                                const parts = (userAnswer || "").split(',').filter(Boolean)
                                const selected = parts.includes(opt)
                                return (
                                    <button 
                                        key={opt}
                                        onClick={() => updateSessionAnswer(currentIndex, opt)}
                                        className={`group relative flex items-center p-6 rounded-xl border transition-colors text-left w-full overflow-hidden ${selected ? 'bg-primary/20 border-primary/60 ring-1 ring-primary/50 shadow-[0_0_20px_rgba(133,173,255,0.2)]' : 'bg-surface-container-highest border-white/5 hover:border-white/20 hover:bg-white/5'}`}
                                    >
                                        <div className={`flex flex-shrink-0 items-center justify-center w-10 h-10 rounded-lg font-black mr-6 transition-colors ${selected ? 'bg-primary text-black' : 'bg-surface-container text-on-surface-variant group-hover:bg-primary/20 group-hover:text-primary'}`}>
                                            {selected ? <span className="material-symbols-outlined text-sm font-black">done</span> : opt}
                                        </div>
                                        <span className={`text-base font-bold transition-colors ${selected ? 'text-white' : 'text-on-surface-variant group-hover:text-white'}`}>
                                            {q.options[opt]}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    <footer className="mt-4 md:mt-8 flex justify-between items-center gap-2">
                        <button 
                            onClick={() => updateSessionIndex(currentIndex - 1)} 
                            disabled={currentIndex === 0} 
                            className="px-4 md:px-8 py-3 md:py-4 rounded-full bg-white/5 text-white/50 hover:bg-white/10 hover:text-white font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 md:gap-2 text-xs md:text-sm"
                        >
                            <span className="material-symbols-outlined text-sm">arrow_back</span> <span className="hidden md:inline">{t.exam.previous}</span>
                        </button>
                        <div className="flex items-center gap-2">
                            <p className="text-xs md:text-sm font-medium text-on-surface-variant hidden md:block">{t.exam.questionOf(currentIndex + 1, questions.length)}</p>
                            {/* Mobile nav toggle */}
                            <button onClick={() => setShowNav(!showNav)} className="md:hidden w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center">
                                <span className="material-symbols-outlined text-sm">grid_view</span>
                            </button>
                        </div>
                        <button 
                            onClick={() => {
                                if (currentIndex < questions.length - 1) updateSessionIndex(currentIndex + 1)
                                else handleSubmit()
                            }} 
                            className="px-4 md:px-8 py-3 md:py-4 rounded-full bg-error hover:bg-error-dim text-white font-black shadow-[0_10px_20px_rgba(255,110,132,0.3)] transition-all flex items-center gap-1 md:gap-2 active:scale-95 text-xs md:text-sm"
                        >
                            {currentIndex === questions.length - 1 ? t.exam.finishExam : t.exam.nextQuestion}
                            {currentIndex !== questions.length - 1 && <span className="material-symbols-outlined text-sm">arrow_forward</span>}
                        </button>
                    </footer>
                </div>
            </main>

            {/* Desktop sidebar */}
            <aside className="hidden md:flex w-80 bg-surface-container/80 backdrop-blur-xl border-l border-white/5 p-6 flex-col h-full z-20 shadow-[-20px_0_50px_rgba(0,0,0,0.5)]">
                <div className="mb-6 flex justify-between items-center">
                    <h3 className="text-white font-bold tracking-tight">{t.exam.questionNav}</h3>
                    <span className="text-[10px] font-black uppercase text-on-surface-variant bg-white/5 px-2 py-1 rounded">{t.exam.gridView}</span>
                </div>
                <div className="grid grid-cols-4 gap-2 overflow-y-auto custom-scrollbar pr-2 flex-1 content-start">
                    {questions.map((_, i) => {
                        const isCurrent = i === currentIndex
                        const isAnswered = !!activeSession.answers[i]
                        return (
                            <button 
                                key={i}
                                onClick={() => updateSessionIndex(i)}
                                className={`h-12 rounded-lg font-bold text-sm transition-all flex items-center justify-center ${
                                    isCurrent ? 'bg-primary text-black ring-2 ring-primary/50 ring-offset-2 ring-offset-surface' : 
                                    isAnswered ? 'bg-primary/20 text-primary border border-primary/20 hover:bg-primary/30' : 
                                    'bg-surface-container-highest text-white/50 border border-white/5 hover:bg-white/10 hover:text-white'
                                }`}
                            >
                                {i + 1}
                            </button>
                        )
                    })}
                </div>
                <div className="mt-6 pt-6 border-t border-white/5 space-y-4">
                    <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-on-surface-variant"><div className="w-3 h-3 rounded-full bg-error/20 border border-error/20"></div> {t.exam.answered}</div>
                        <span className="font-bold text-white">{Object.keys(activeSession.answers).length}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-on-surface-variant"><div className="w-3 h-3 rounded-full bg-surface-container-highest border border-white/5"></div> {t.exam.unanswered}</div>
                        <span className="font-bold text-white">{questions.length - Object.keys(activeSession.answers).length}</span>
                    </div>
                    <button onClick={() => { if(window.confirm(t.exam.submitConfirm)) handleSubmit() }} className="w-full py-4 mt-4 rounded-xl border border-error/30 text-error font-bold hover:bg-error/10 transition-colors uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-sm">publish</span> {t.exam.submitExam}
                    </button>
                </div>
            </aside>

            {/* Mobile slide-up nav */}
            {showNav && (
                <div className="md:hidden fixed inset-0 z-50 bg-black/70 flex items-end" onClick={() => setShowNav(false)}>
                    <div className="w-full bg-surface-container rounded-t-3xl p-6 max-h-[60vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-white font-bold">{t.exam.questionNav}</h3>
                            <button onClick={() => setShowNav(false)} className="text-white/50 p-1"><span className="material-symbols-outlined">close</span></button>
                        </div>
                        <div className="grid grid-cols-5 gap-2 mb-4">
                            {questions.map((_, i) => {
                                const isCurrent = i === currentIndex
                                const isAnswered = !!activeSession.answers[i]
                                return (
                                    <button key={i} onClick={() => { updateSessionIndex(i); setShowNav(false) }}
                                        className={`h-10 rounded-lg font-bold text-sm transition-all flex items-center justify-center ${
                                            isCurrent ? 'bg-primary text-black' : isAnswered ? 'bg-primary/20 text-primary' : 'bg-white/5 text-white/50'
                                        }`}
                                    >{i + 1}</button>
                                )
                            })}
                        </div>
                        <div className="flex justify-between text-xs text-on-surface-variant mb-4">
                            <span>{t.exam.answered}: {Object.keys(activeSession.answers).length}</span>
                            <span>{t.exam.unanswered}: {questions.length - Object.keys(activeSession.answers).length}</span>
                        </div>
                        <button onClick={() => { if(window.confirm(t.exam.submitConfirm)) handleSubmit() }} className="w-full py-3 rounded-xl border border-error/30 text-error font-bold hover:bg-error/10 transition-colors uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-sm">publish</span> {t.exam.submitExam}
                        </button>
                    </div>
                </div>
            )}
        </motion.div>
    )
}
