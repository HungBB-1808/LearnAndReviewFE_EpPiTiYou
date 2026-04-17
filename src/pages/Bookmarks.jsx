import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../store/useAppStore'
import { useNavigate } from 'react-router-dom'

const translations = {
    en: {
        title: 'Saved Questions',
        subtitle: 'Your personalized collection categorized by subject for efficient learning.',
        noBookmarks: 'No Bookmarks',
        noBookmarksDesc: 'Questions you star during study or practice will appear here.',
        all: 'All',
        review: 'Review',
        allOptions: 'All Options',
    },
    vi: {
        title: 'Câu Hỏi Đã Lưu',
        subtitle: 'Bộ sưu tập cá nhân được phân loại theo môn học để ôn tập hiệu quả.',
        noBookmarks: 'Chưa Có Bookmark',
        noBookmarksDesc: 'Các câu hỏi bạn đánh dấu sao trong khi học hoặc luyện tập sẽ xuất hiện ở đây.',
        all: 'Tất cả',
        review: 'Ôn tập',
        allOptions: 'Tất Cả Đáp Án',
    }
}

export const Bookmarks = () => {
    const { bookmarks, questionDB, toggleBookmark, getCorrectAnswerFor, startSession, language } = useAppStore()
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState('ALL')

    const t = translations[language] || translations.en

    // Find and group questions from DB
    const subjects = useMemo(() => {
        const grouped = {}
        bookmarks.forEach(b => {
             for (const key in questionDB) {
                 const q = questionDB[key].find(x => x.id === b.id)
                 if (q) {
                     const match = key.match(/^([a-z]{3}\d{3})/i)
                     const base = match ? match[1].toUpperCase() : key.split('-')[0].trim().toUpperCase()
                     if (!grouped[base]) grouped[base] = []
                     grouped[base].push({ ...q, parentKey: key })
                     break
                 }
             }
        })
        return grouped
    }, [bookmarks, questionDB])

    const totalCount = bookmarks.length

    const handleReviewSubject = (subQuestions) => {
        if(subQuestions.length === 0) return
        startSession('study', subQuestions)
        navigate('/study')
    }

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="p-4 md:p-10 max-w-6xl mx-auto"
        >
            <div className="flex justify-between items-end mb-12">
                <div className="space-y-2">
                    <h2 className="text-2xl md:text-4xl font-black tracking-tight text-white flex items-center gap-3 md:gap-4">
                        <span className="material-symbols-outlined text-4xl text-yellow-400" style={{ fontVariationSettings: "'FILL' 1" }}>bookmark</span>
                        {t.title}
                    </h2>
                    <p className="text-on-surface-variant max-w-md">{t.subtitle}</p>
                </div>
            </div>

            {totalCount === 0 ? (
                <div className="glass-panel p-20 rounded-[2rem] flex flex-col items-center justify-center text-center">
                    <span className="material-symbols-outlined text-6xl text-white/20 mb-4">bookmark_border</span>
                    <h3 className="text-2xl font-bold text-white mb-2">{t.noBookmarks}</h3>
                    <p className="text-on-surface-variant">{t.noBookmarksDesc}</p>
                </div>
            ) : (
                <div className="space-y-12">
                    {/* Tabs / Filter Navigation */}
                    <div className="flex gap-3 md:gap-4 mb-8 p-2 bg-white/5 rounded-3xl w-full md:w-fit border border-white/5 backdrop-blur-3xl overflow-x-auto">
                        <button 
                            onClick={() => setActiveTab('ALL')}
                            className={`px-4 md:px-6 py-2 md:py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'ALL' ? 'bg-primary text-black shadow-[0_10px_20px_rgba(0,188,212,0.3)]' : 'text-white/40 hover:text-white'}`}
                        >
                            {t.all} ({totalCount})
                        </button>
                        {Object.entries(subjects).map(([subject, qList]) => (
                            <button 
                                key={subject}
                                onClick={() => setActiveTab(subject)}
                                className={`px-4 md:px-6 py-2 md:py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === subject ? 'bg-primary text-black shadow-[0_10px_20px_rgba(0,188,212,0.3)]' : 'text-white/40 hover:text-white'}`}
                            >
                                {subject} ({qList.length})
                            </button>
                        ))}
                    </div>

                    {Object.entries(subjects)
                        .filter(([subject]) => activeTab === 'ALL' || activeTab === subject)
                        .map(([subject, qList]) => (
                        <div key={subject} className="space-y-6">
                            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                <h3 className="text-2xl font-black text-white flex items-center gap-3">
                                    <div className="w-2 h-8 bg-primary rounded-full"></div>
                                    {subject} <span className="text-lg text-on-surface-variant opacity-50 font-medium">({qList.length})</span>
                                </h3>
                                <button 
                                    onClick={() => handleReviewSubject(qList)}
                                    className="px-6 py-2 rounded-full bg-white/5 text-white text-xs font-bold hover:bg-white/10 border border-white/10 transition-all active:scale-95 flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-xs">play_arrow</span> {t.review} {subject}
                                </button>
                            </div>

                            <div className="grid gap-6">
                                <AnimatePresence>
                                    {qList.map((q) => {
                                        const corrects = getCorrectAnswerFor(q.id)
                                        return (
                                            <motion.div 
                                                key={q.id}
                                                layout
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                className="glass-card p-6 rounded-2xl flex flex-col relative group border border-white/5 hover:border-white/10 transition-colors"
                                            >
                                                <button 
                                                    onClick={() => toggleBookmark(q.id)}
                                                    className="absolute top-6 right-6 text-yellow-500 hover:text-white/30 transition-all p-2 bg-white/5 rounded-full"
                                                >
                                                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>bookmark</span>
                                                </button>
                                                
                                                <div className="flex items-center gap-3 mb-4">
                                                    <span className="px-3 py-1 bg-primary/10 rounded-full text-[10px] font-black tracking-widest uppercase text-primary border border-primary/20">
                                                        {q.parentKey.toUpperCase()}
                                                    </span>
                                                </div>
                                                
                                                <h4 className="text-lg font-bold text-white mb-6 pr-12 leading-relaxed">{q.questionTextCleaned || q.question}</h4>
                                                
                                                <div className="mt-auto space-y-2">
                                                    <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-3">{t.allOptions}</p>
                                                    <div className="grid gap-2">
                                                        {q.options && Object.entries(q.options).sort(([a],[b]) => a.localeCompare(b)).map(([key, value]) => {
                                                            const isCorrect = corrects.includes(key.toUpperCase())
                                                            return (
                                                                <div 
                                                                    key={key}
                                                                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                                                                        isCorrect 
                                                                        ? 'bg-green-500/10 border-green-500/30' 
                                                                        : 'bg-white/[0.02] border-white/5'
                                                                    }`}
                                                                >
                                                                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                                                                        isCorrect 
                                                                        ? 'bg-green-500/20 text-green-400' 
                                                                        : 'bg-white/5 text-white/40'
                                                                    }`}>
                                                                        {key.toUpperCase()}
                                                                    </span>
                                                                    <span className={`text-sm ${isCorrect ? 'font-bold text-green-400' : 'text-white/60'}`}>
                                                                        {value}
                                                                    </span>
                                                                    {isCorrect && (
                                                                        <span className="material-symbols-outlined text-green-400 text-[16px] ml-auto" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                                                    )}
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )
                                    })}
                                </AnimatePresence>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </motion.div>
    )
}
