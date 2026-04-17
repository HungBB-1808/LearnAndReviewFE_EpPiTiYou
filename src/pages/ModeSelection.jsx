import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../store/useAppStore'
import { useNavigate } from 'react-router-dom'
import { getTranslations } from '../lib/translations'

export const ModeSelection = () => {
    const { selectedSubject, getSemestersForSubject, getAllQuestionsForSubject, startSession, bookmarks, language } = useAppStore()
    const navigate = useNavigate()
    const [modalMode, setModalMode] = useState(null) // 'study' | 'practice' | 'exam'
    const [examStyle, setExamStyle] = useState(null) // null | 'edufu' | 'eos'
    const t = getTranslations(language)
    
    // Modal State
    const [timeLimit, setTimeLimit] = useState(30)
    const [questionCount, setQuestionCount] = useState(40)
    const [bookmarksOnly, setBookmarksOnly] = useState(false)
    const availableTerms = getSemestersForSubject(selectedSubject)
    const [selectedTerms, setSelectedTerms] = useState([])

    useEffect(() => {
        if (availableTerms.length > 0 && selectedTerms.length === 0) {
            setSelectedTerms(availableTerms)
        }
    }, [availableTerms, selectedTerms])

    if (!selectedSubject) {
        navigate('/subjects')
        return null
    }

    const handleLaunch = () => {
        let pool = []
        if (bookmarksOnly) {
            pool = bookmarks.map(b => useAppStore.getState().getQuestionById(b.id)).filter(q => q && Object.keys(useAppStore.getState().questionDB).some(k => k.startsWith(selectedSubject.toUpperCase()) && k === q.parentKey || true)) 
            // Better filter:
            pool = bookmarks.map(b => useAppStore.getState().getQuestionById(b.id)).filter(q => q && q.id) 
            // In vanilla we checked parentKey, we can just filter by finding if it belongs to selectedSubject
            pool = pool.filter(q => {
                for (let k in useAppStore.getState().questionDB) {
                    if (k.toLowerCase().startsWith(selectedSubject.toLowerCase())) {
                        if (useAppStore.getState().questionDB[k].find(x => x.id === q.id)) return true
                    }
                }
                return false
            })
            if (pool.length === 0) {
                alert(t.mode.noBookmarksAlert)
                return
            }
        } else {
            if (selectedTerms.length === 0) {
                alert(t.mode.selectTermAlert)
                return
            }
            const allDB = useAppStore.getState().questionDB
            selectedTerms.forEach(term => {
                if (allDB[term]) {
                    pool = pool.concat(allDB[term])
                }
            })
        }

        // Unique
        pool = [...new Map(pool.map(item => [item.id, item])).values()]
        if (pool.length === 0) {
            alert(t.mode.noQuestionsAlert)
            return
        }

        // Shuffle
        for (let i = pool.length - 1; i > 0; i--) { 
            const j = Math.floor(Math.random() * (i + 1)); 
            [pool[i], pool[j]] = [pool[j], pool[i]] 
        }

        setModalMode(null)
        setExamStyle(null)

        if (modalMode === 'exam') {
            const limit = Math.min(questionCount, pool.length)
            useAppStore.getState().setExamSettings({ timeLimit, questionCount: limit })
            startSession('exam', pool.slice(0, limit))
            navigate(examStyle === 'eos' ? '/eos-exam' : '/exam')
        } else {
            startSession(modalMode, pool)
            navigate(`/${modalMode}`)
        }
    }

    return (
        <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="p-4 md:p-10 min-h-[80vh] flex flex-col justify-center"
        >
            <div className="text-center mb-16 space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-4">
                    <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
                    <span className="text-sm font-bold tracking-widest text-on-surface-variant uppercase">{t.mode.courseId}: {selectedSubject}</span>
                </div>
                <h2 className="text-3xl md:text-6xl font-black tracking-tighter text-white">{t.mode.selectPath} <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">{t.mode.pathHighlight}</span></h2>
                <p className="text-on-surface-variant max-w-2xl mx-auto text-lg">{t.mode.description(selectedSubject)}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 max-w-6xl mx-auto w-full">
                {/* Study Card */}
                <div onClick={() => setModalMode('study')} className="glass-card p-6 md:p-10 rounded-2xl md:rounded-[2rem] flex flex-col items-center text-center cursor-pointer hover:-translate-y-4 hover:shadow-[0_20px_40px_rgba(133,173,255,0.2)] transition-all duration-300 group ring-1 ring-white/5 hover:ring-primary/30">
                    <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4 md:mb-8 isolate relative group-hover:scale-110 transition-transform">
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full -z-10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <span className="material-symbols-outlined text-5xl text-primary">menu_book</span>
                    </div>
                    <h3 className="text-xl md:text-3xl font-bold text-white mb-2 md:mb-4">{t.mode.studyMode}</h3>
                    <p className="text-on-surface-variant mb-8 line-clamp-3">{t.mode.studyDesc}</p>
                    <button className="mt-auto w-full py-4 rounded-xl bg-white/5 text-primary font-bold hover:bg-primary/20 transition-colors uppercase tracking-widest text-sm">{t.mode.configureSetup}</button>
                </div>

                {/* Practice Card */}
                <div onClick={() => setModalMode('practice')} className="glass-card p-6 md:p-10 rounded-2xl md:rounded-[2rem] flex flex-col items-center text-center cursor-pointer hover:-translate-y-4 hover:shadow-[0_20px_40px_rgba(92,202,252,0.2)] transition-all duration-300 group border-t-2 border-t-tertiary ring-1 ring-white/5">
                    <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-tertiary/10 flex items-center justify-center mb-4 md:mb-8 isolate relative group-hover:scale-110 transition-transform">
                        <div className="absolute inset-0 bg-tertiary/20 blur-xl rounded-full -z-10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <span className="material-symbols-outlined text-5xl text-tertiary">psychology</span>
                    </div>
                    <h3 className="text-xl md:text-3xl font-bold text-white mb-2 md:mb-4">{t.mode.practiceMode}</h3>
                    <p className="text-on-surface-variant mb-8 line-clamp-3">{t.mode.practiceDesc}</p>
                    <button className="mt-auto w-full py-4 rounded-xl bg-gradient-to-r from-tertiary to-tertiary-dim text-black font-black shadow-[0_10px_20px_rgba(92,202,252,0.3)] hover:scale-[1.02] transition-transform uppercase tracking-widest text-sm">{t.mode.configureSetup}</button>
                </div>

                {/* Exam Card */}
                <div onClick={() => setModalMode('exam')} className="glass-card p-6 md:p-10 rounded-2xl md:rounded-[2rem] flex flex-col items-center text-center cursor-pointer hover:-translate-y-4 hover:shadow-[0_20px_40px_rgba(255,110,132,0.2)] transition-all duration-300 group ring-1 ring-white/5 hover:ring-error/30 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-error/10 blur-3xl rounded-full pointer-events-none group-hover:bg-error/20 transition-colors"></div>
                    <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-error/10 flex items-center justify-center mb-4 md:mb-8 isolate relative group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-5xl text-error">timer</span>
                    </div>
                    <h3 className="text-xl md:text-3xl font-bold text-white mb-2 md:mb-4">{t.mode.mockExam}</h3>
                    <p className="text-on-surface-variant mb-8 line-clamp-3">{t.mode.examDesc}</p>
                    <button className="mt-auto w-full py-4 rounded-xl bg-white/5 text-error font-bold hover:bg-error/20 transition-colors uppercase tracking-widest text-sm">{t.mode.configureSetup}</button>
                </div>
            </div>

            {/* Setup Modal */}
            <AnimatePresence>
                {modalMode && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    >
                        <motion.div 
                            initial={{ y: 50, scale: 0.95 }}
                            animate={{ y: 0, scale: 1 }}
                            exit={{ y: 20, scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className="glass-panel p-6 md:p-10 rounded-xl max-w-md w-full border border-white/20 shadow-[-10px_-10px_30px_4px_rgba(0,0,0,0.1),_10px_10px_30px_4px_rgba(45,78,255,0.15)] relative max-h-[90vh] overflow-y-auto"
                        >
                            <button className="absolute top-4 right-4 text-white/50 hover:text-white bg-white/5 p-2 rounded-full transition-colors" onClick={() => setModalMode(null)}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                            
                            <h4 className="text-2xl font-bold mb-6 text-center text-white capitalize">
                                {modalMode === 'study' ? t.mode.studyMode : modalMode === 'practice' ? t.mode.practiceMode : t.mode.mockExam} {t.mode.setup}
                            </h4>
                            
                            <div className="space-y-6 mb-8">
                                {modalMode === 'exam' && (
                                    <>
                                        {/* Exam Style Chooser */}
                                        <div>
                                            <label className="block text-xs uppercase tracking-widest text-error mb-3">Exam Interface</label>
                                            <div className="grid grid-cols-2 gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setExamStyle('edufu')}
                                                    className={`p-4 rounded-xl border-2 transition-all text-left ${examStyle === 'edufu' ? 'border-primary bg-primary/10 ring-1 ring-primary/30' : 'border-white/10 bg-white/5 hover:border-white/20'}`}
                                                >
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="material-symbols-outlined text-primary text-lg">school</span>
                                                        <span className="text-sm font-black text-white">EduFU</span>
                                                    </div>
                                                    <p className="text-[10px] text-white/50 leading-relaxed">Modern dark interface with sidebar navigator</p>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768
                                                        if (isMobile) {
                                                            alert('⚠️ EOS Exam interface is only available on desktop devices (PC/Laptop). Please use a computer to access this mode.')
                                                            return
                                                        }
                                                        setExamStyle('eos')
                                                    }}
                                                    className={`p-4 rounded-xl border-2 transition-all text-left ${examStyle === 'eos' ? 'border-error bg-error/10 ring-1 ring-error/30' : 'border-white/10 bg-white/5 hover:border-white/20'}`}
                                                >
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="material-symbols-outlined text-error text-lg">computer</span>
                                                        <span className="text-sm font-black text-white">EOS</span>
                                                        <span className="text-[8px] text-white/30 md:hidden">🖥️ Desktop only</span>
                                                    </div>
                                                    <p className="text-[10px] text-white/50 leading-relaxed">Classic EOS exam delivery system interface</p>
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs uppercase tracking-widest text-primary-fixed mb-2">{t.mode.timeLimit}</label>
                                            <input type="number" min="15" max="60" value={timeLimit} onChange={e => setTimeLimit(Number(e.target.value))} className="w-full bg-surface-container-highest/50 border border-white/10 rounded-lg p-3 text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all" />
                                        </div>
                                        <div>
                                            <label className="block text-xs uppercase tracking-widest text-secondary mb-2">{t.mode.numQuestions}</label>
                                            <input type="number" min="20" max="100" value={questionCount} onChange={e => setQuestionCount(Number(e.target.value))} className="w-full bg-surface-container-highest/50 border border-white/10 rounded-lg p-3 text-white focus:ring-2 focus:ring-secondary/50 outline-none transition-all" />
                                        </div>
                                    </>
                                )}
                                <div>
                                    <label className="block text-xs uppercase tracking-widest text-tertiary mb-3 flex items-center justify-between">
                                        {t.mode.sourceFilter} <span className="text-[10px] text-white/40 normal-case">{t.mode.sourceFilterNote}</span>
                                    </label>
                                    <div className="grid grid-cols-1 gap-3 text-sm text-white/80 max-h-48 overflow-y-auto custom-scrollbar p-1 mb-2">
                                        {availableTerms.map(term => (
                                            <label key={term} className="flex items-center gap-4 cursor-pointer p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all border border-white/5 group">
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedTerms.includes(term)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) setSelectedTerms([...selectedTerms, term])
                                                        else setSelectedTerms(selectedTerms.filter(x => x !== term))
                                                    }}
                                                    className="rounded bg-black/40 border-white/20 text-primary w-5 h-5 cursor-pointer accent-primary" 
                                                /> 
                                                <span className="text-base font-bold text-white group-hover:text-primary transition-colors">{term.toUpperCase()}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <label className="flex items-center gap-3 mt-4 p-4 bg-primary/10 border border-primary/20 rounded-xl cursor-pointer hover:bg-primary/20 transition-colors group">
                                        <input type="checkbox" checked={bookmarksOnly} onChange={e => setBookmarksOnly(e.target.checked)} className="rounded bg-black/40 border-white/20 text-primary w-6 h-6 cursor-pointer accent-primary" /> 
                                        <span className="text-primary-fixed font-black tracking-tight text-lg group-hover:scale-[1.02] transition-transform">{t.mode.savedOnly}</span>
                                    </label>
                                </div>
                            </div>

                            <button 
                                onClick={handleLaunch} 
                                disabled={modalMode === 'exam' && !examStyle}
                                className={`w-full py-4 rounded-xl ${modalMode === 'exam' ? 'bg-gradient-to-r from-error to-error-dim shadow-[0_10px_20px_rgba(255,110,132,0.3)]' : 'bg-gradient-to-r from-primary to-primary-dim shadow-[0_10px_20px_rgba(133,173,255,0.3)] text-black'} text-white font-black hover:scale-[1.02] transition-all uppercase tracking-widest text-sm disabled:opacity-40 disabled:hover:scale-100`}
                            >
                                {t.mode.launch} {modalMode === 'study' ? t.mode.studyMode : modalMode === 'practice' ? t.mode.practiceMode : t.mode.mockExam}
                                {modalMode === 'exam' && examStyle && <span className="ml-2 normal-case text-[10px] opacity-70">({examStyle.toUpperCase()} Style)</span>}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}
