import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '../store/useAppStore'
import { useNavigate } from 'react-router-dom'

export const SubjectSelection = () => {
    const { getUniqueSubjects, isSubjectLocked, setSelectedSubject, loadInitialData, isDataLoaded } = useAppStore()
    const navigate = useNavigate()

    useEffect(() => {
        loadInitialData()
    }, [loadInitialData])

    if (!isDataLoaded) {
        return (
            <div className="flex items-center justify-center h-[80vh] w-full mt-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        )
    }

    const subjects = getUniqueSubjects()
    const colors = ['primary-dim', 'secondary', 'tertiary', 'error']

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="p-10"
        >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {subjects.map((sub, i) => {
                    const cls = colors[i % colors.length]
                    const locked = isSubjectLocked(sub)

                    return (
                        <div 
                            key={sub}
                            onClick={() => {
                                if (locked) {
                                    alert('Khóa học này đang tạm thời bị khóa bởi Admin.')
                                } else {
                                    setSelectedSubject(sub)
                                    navigate('/mode')
                                }
                            }}
                            className={`glass-card rounded-xl p-8 flex flex-col h-[320px] relative overflow-hidden group transition-all duration-300 ${
                                locked ? 'cursor-not-allowed opacity-50 grayscale' : 'cursor-pointer hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]'
                            }`}
                        >
                            {locked && (
                                <div className="absolute inset-0 bg-black/40 z-10 flex flex-col items-center justify-center backdrop-blur-sm transition-all">
                                    <span className="material-symbols-outlined text-5xl text-white/50 mb-2">lock</span>
                                    <span className="text-white/80 font-black uppercase tracking-widest text-xs">Locked by Admin</span>
                                </div>
                            )}

                            <div className={`absolute -top-12 -right-12 w-32 h-32 bg-${cls}/20 rounded-full blur-3xl group-hover:bg-${cls}/40 transition-colors pointer-events-none`}></div>
                            
                            <div className="mb-auto pointer-events-none transition-all">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className={`inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold tracking-widest text-${cls}`}>
                                        {sub}
                                    </div>
                                    {locked && <span className="material-symbols-outlined text-xs text-error">lock</span>}
                                </div>
                                <h3 className="text-2xl font-bold leading-tight text-white mb-2">{sub} Module</h3>
                                <p className="text-on-surface-variant text-sm line-clamp-2">Master the fundamentals and advanced topics of {sub}.</p>
                            </div>
                            
                            <div className="mt-8 z-20">
                                <button 
                                    disabled={locked}
                                    className={`w-full py-4 bg-white/5 ${locked ? '' : 'hover:bg-white/10 active:scale-95'} border border-white/10 text-white font-bold rounded-full backdrop-blur-md transition-all flex items-center justify-center gap-2`}
                                >
                                    Start Learning 
                                    <span className="material-symbols-outlined text-sm">{locked ? 'lock' : 'arrow_forward'}</span>
                                </button>
                            </div>
                        </div>
                    )
                })}

            </div>
        </motion.div>
    )
}
