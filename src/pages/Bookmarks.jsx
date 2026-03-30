import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../store/useAppStore'
import { useNavigate } from 'react-router-dom'

export const Bookmarks = () => {
    const { bookmarks, questionDB, toggleBookmark, getCorrectAnswerFor, startSession } = useAppStore()
    const navigate = useNavigate()

    // Find the actual questions from the DB
    const bookmarkedQuestions = bookmarks
        .map(b => {
             for (const key in questionDB) {
                 const q = questionDB[key].find(x => x.id === b.id)
                 if (q) return q
             }
             return null
        })
        .filter(Boolean)

    const handleReviewAll = () => {
        if(bookmarkedQuestions.length === 0) return
        startSession('study', bookmarkedQuestions)
        navigate('/study')
    }

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="p-10 max-w-6xl mx-auto"
        >
            <div className="flex justify-between items-end mb-12">
                <div className="space-y-2">
                    <h2 className="text-4xl font-black tracking-tight text-white flex items-center gap-4">
                        <span className="material-symbols-outlined text-4xl text-yellow-400" style={{ fontVariationSettings: "'FILL' 1" }}>bookmark</span>
                        Saved Questions
                    </h2>
                    <p className="text-on-surface-variant max-w-md">Your personalized collection of tricky questions mapped for quick review.</p>
                </div>
                <button 
                    onClick={handleReviewAll}
                    disabled={bookmarkedQuestions.length === 0}
                    className="px-6 py-3 rounded-full bg-primary/20 text-primary-fixed font-bold hover:bg-primary/30 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                    <span className="material-symbols-outlined text-sm">menu_book</span> Review All
                </button>
            </div>

            {bookmarkedQuestions.length === 0 ? (
                <div className="glass-panel p-20 rounded-[2rem] flex flex-col items-center justify-center text-center">
                    <span className="material-symbols-outlined text-6xl text-white/20 mb-4">bookmark_border</span>
                    <h3 className="text-2xl font-bold text-white mb-2">No Bookmarks</h3>
                    <p className="text-on-surface-variant">Questions you star during study or practice will appear here.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    <AnimatePresence>
                        {bookmarkedQuestions.map((q, i) => {
                            const corrects = getCorrectAnswerFor(q.id)
                            return (
                                <motion.div 
                                    key={q.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="glass-card p-6 rounded-2xl flex flex-col relative group"
                                >
                                    <button 
                                        onClick={() => toggleBookmark(q.id)}
                                        className="absolute top-6 right-6 text-yellow-500 hover:text-white/50 transition-colors"
                                    >
                                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>bookmark</span>
                                    </button>
                                    
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold tracking-widest uppercase text-tertiary border border-white/5">{q.parentKey || 'Unknown Subject'}</span>
                                    </div>
                                    
                                    <h4 className="text-lg font-medium text-white mb-6 pr-12">{q.questionTextCleaned || q.question}</h4>
                                    
                                    <div className="mt-auto p-4 rounded-xl bg-green-500/5 border border-green-500/10 flex items-start gap-4 inline-block w-fit">
                                        <span className="material-symbols-outlined text-green-400 text-sm mt-0.5">check_circle</span>
                                        <div>
                                            {corrects.map(c => (
                                                <p key={c} className="text-sm font-medium text-green-400">{c}. {q.options[c]}</p>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </AnimatePresence>
                </div>
            )}
        </motion.div>
    )
}
