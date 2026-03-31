import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../store/useAppStore'
import { useNavigate } from 'react-router-dom'

export const AdminDashboard = () => {
    const { questionDB, isDataLoaded, updateQuestion, updateAnswer, getCorrectAnswerFor, isAdmin, setIsAdmin, toggleSubjectLock, isSubjectLocked } = useAppStore()
    const navigate = useNavigate()
    const [filterSubject, setFilterSubject] = useState('ALL')
    const [filterKey, setFilterKey] = useState('ALL')
    const [searchTerm, setSearchTerm] = useState('')
    
    // Login State
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [loginError, setLoginError] = useState('')

    // Edit Modal State
    const [editQuestionText, setEditQuestionText] = useState('')
    const [editAnswerText, setEditAnswerText] = useState('')
    const [editOptions, setEditOptions] = useState({ A: '', B: '', C: '', D: '', E: '' })

    const dbKeys = Object.keys(questionDB)
    const allSubjects = useMemo(() => {
        const set = new Set()
        dbKeys.forEach(k => {
            const match = k.match(/^([a-z]{3}\d{3})/i)
            const base = match ? match[1].toUpperCase() : k.split('-')[0].trim().toUpperCase()
            if (base) set.add(base)
        })
        return Array.from(set)
    }, [dbKeys])

    const availableKeys = useMemo(() => {
        if (filterSubject === 'ALL') return []
        return dbKeys.filter(k => {
            const match = k.match(/^([a-z]{3}\d{3})/i)
            const base = match ? match[1].toUpperCase() : k.split('-')[0].trim().toUpperCase()
            return base === filterSubject
        })
    }, [dbKeys, filterSubject])

    let displayList = []
    if (isDataLoaded) {
        dbKeys.forEach(k => {
            const match = k.match(/^([a-z]{3}\d{3})/i)
            const base = match ? match[1].toUpperCase() : k.split('-')[0].trim().toUpperCase()
            
            const matchesSubject = filterSubject === 'ALL' || base === filterSubject
            const matchesKey = filterKey === 'ALL' || k === filterKey

            if (matchesSubject && matchesKey) {
                questionDB[k].forEach(q => {
                    if (q.question.toLowerCase().includes(searchTerm.toLowerCase())) {
                        displayList.push({...q, actualKey: k})
                    }
                })
            }
        })
    }

    // Simplified Pagination for Demo
    const [page, setPage] = useState(1)
    const perPage = 50
    const currentList = displayList.slice((page - 1) * perPage, page * perPage)
    
    const handleSave = () => {
        if (!editingQ) return
        updateQuestion(editingQ.id, editQuestionText)
        updateAnswer(editingQ.id, editAnswerText)
        Object.entries(editOptions).forEach(([k, v]) => {
            updateOption(editingQ.id, k, v)
        })
        setEditingQ(null)
    }

    const handleLogin = (e) => {
        e.preventDefault()
        if (username === 'HungBB' && password === '091104Hb@') {
            setIsAdmin(true)
            setLoginError('')
        } else {
            setLoginError('Invalid Administrator credentials')
        }
    }

    if (!isAdmin) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-10 h-full flex items-center justify-center relative">
                <div className="glass-panel p-10 rounded-[2rem] w-full max-w-md border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.5)] relative overflow-hidden ring-1 ring-white/5">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-error/10 blur-3xl rounded-full pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/10 blur-3xl rounded-full pointer-events-none"></div>
                    
                    <div className="text-center mb-10 relative z-10">
                        <div className="w-20 h-20 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto mb-6 border border-error/20 shadow-[0_0_20px_rgba(255,110,132,0.15)] relative isolate">
                            <div className="absolute inset-0 rounded-full bg-error/20 blur-xl -z-10"></div>
                            <span className="material-symbols-outlined text-4xl">admin_panel_settings</span>
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tight">Access Portal</h2>
                        <p className="text-on-surface-variant text-sm mt-2 font-medium">Restricted Area. Authorized personnel only.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5 relative z-10">
                        {loginError && <p className="text-error text-xs font-bold text-center bg-error/10 py-3 rounded-xl border border-error/20 uppercase tracking-widest">{loginError}</p>}
                        <div>
                            <label className="text-xs uppercase tracking-widest text-primary font-bold mb-2 block ml-2">Username</label>
                            <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-surface-container/50 border border-white/5 hover:border-white/20 rounded-2xl p-4 text-white placeholder-white/20 focus:ring-2 focus:ring-primary/50 outline-none transition-all" placeholder="Enter admin ID" required />
                        </div>
                        <div>
                            <label className="text-xs uppercase tracking-widest text-primary font-bold mb-2 block ml-2">Password</label>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-surface-container/50 border border-white/5 hover:border-white/20 rounded-2xl p-4 text-white placeholder-white/20 focus:ring-2 focus:ring-primary/50 outline-none transition-all" placeholder="••••••••" required />
                        </div>
                        <button type="submit" className="w-full py-4 mt-8 bg-gradient-to-r from-error to-error-dim text-white font-black uppercase tracking-widest text-sm rounded-2xl hover:scale-[1.02] shadow-[0_10px_20px_rgba(255,110,132,0.3)] transition-all flex items-center justify-center gap-3">
                            <span className="material-symbols-outlined text-sm">lock_open</span> Authenticate
                        </button>
                    </form>
                </div>
            </motion.div>
        )
    }

    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="p-10 relative"
        >
            <header className="flex justify-between items-end mb-12">
                <div className="space-y-2">
                    <h2 className="text-4xl font-black tracking-tight text-white">Content Management</h2>
                    <p className="text-on-surface-variant max-w-md">Oversee the question database, verify accuracy, and maintain subject integrity.</p>
                </div>
                
                <div className="flex gap-4">
                    <div className="glass-panel px-6 py-3 rounded-xl flex items-center gap-4 group cursor-pointer hover:bg-error/10 hover:border-error/30 transition-all border border-transparent" onClick={() => { setIsAdmin(false); navigate('/subjects') }}>
                        <span className="text-sm font-bold text-white group-hover:text-error transition-colors uppercase tracking-widest">Logout Admin</span>
                        <span className="material-symbols-outlined text-error">logout</span>
                    </div>
                </div>
            </header>

            <section className="grid grid-cols-4 gap-6 mb-10">
                <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between h-32">
                    <span className="material-symbols-outlined text-primary-fixed text-3xl">quiz</span>
                    <div>
                        <p className="text-2xl font-bold text-white">{displayList.length}</p>
                        <p className="text-xs text-on-surface-variant font-medium uppercase tracking-tight">Total Questions</p>
                    </div>
                </div>
                <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between h-32">
                    <span className="material-symbols-outlined text-tertiary text-3xl">verified</span>
                    <div>
                        <p className="text-2xl font-bold text-white">100%</p>
                        <p className="text-xs text-on-surface-variant font-medium uppercase tracking-tight">Accuracy Rate</p>
                    </div>
                </div>
                {/* Visual decorators only */}
                <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between h-32">
                    <span className="material-symbols-outlined text-secondary text-3xl">trending_up</span>
                    <div>
                        <p className="text-2xl font-bold text-white">0</p>
                        <p className="text-xs text-on-surface-variant font-medium uppercase tracking-tight">New Today</p>
                    </div>
                </div>
                <div className="bg-primary-container/20 border border-primary/20 text-center glass-card p-6 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-primary/20 transition-all group">
                    <span className="material-symbols-outlined text-primary text-3xl mb-2 group-hover:scale-110 transition-transform">add_circle</span>
                    <p className="text-white font-bold text-sm">Create Entry</p>
                </div>
            </section>

            {/* Subject Locking Management */}
            <section className="mb-12">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">lock_reset</span>
                    Course Availability Management
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {allSubjects.map(sub => {
                        const locked = isSubjectLocked(sub)
                        return (
                            <button 
                                key={sub}
                                onClick={() => toggleSubjectLock(sub)}
                                className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-3 group relative overflow-hidden ${
                                    locked 
                                    ? 'bg-error/10 border-error/30 text-error shadow-[0_10px_20px_rgba(255,110,132,0.1)]' 
                                    : 'bg-primary/5 border-white/5 text-white/70 hover:border-primary/40 hover:bg-primary/10'
                                }`}
                            >
                                <span className={`material-symbols-outlined text-2xl transition-transform group-hover:scale-110 ${locked ? 'text-error' : 'text-primary/40 group-hover:text-primary'}`}>
                                    {locked ? 'lock' : 'lock_open'}
                                </span>
                                <span className="text-xs font-black tracking-widest uppercase">{sub}</span>
                                {locked && (
                                    <div className="absolute top-0 right-0 p-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-error animate-pulse"></div>
                                    </div>
                                )}
                            </button>
                        )
                    })}
                </div>
            </section>

            <section className="glass-panel rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col h-[calc(100vh-380px)] min-h-[500px]">
                <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-surface-container-low/50">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
                            <input 
                                value={searchTerm}
                                onChange={e => { setSearchTerm(e.target.value); setPage(1) }}
                                className="bg-surface-container-highest/50 border-none rounded-full pl-10 pr-6 py-2 text-sm text-white focus:ring-2 focus:ring-primary/50 w-64 placeholder-white/20 outline-none" 
                                placeholder="Search all questions..." 
                                type="text" 
                            />
                        </div>
                        <select 
                            value={filterSubject}
                            onChange={e => { setFilterSubject(e.target.value); setFilterKey('ALL'); setPage(1) }}
                            className="bg-surface-container-highest/50 border-none rounded-full px-4 py-2 text-sm text-white outline-none cursor-pointer focus:ring-2 focus:ring-primary/50"
                        >
                            <option value="ALL">All Subjects</option>
                            {allSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>

                        {filterSubject !== 'ALL' && (
                            <select 
                                value={filterKey}
                                onChange={e => { setFilterKey(e.target.value); setPage(1) }}
                                className="bg-surface-container-highest/50 border-none rounded-full px-4 py-2 text-sm text-white outline-none cursor-pointer animate-in fade-in slide-in-from-left-2 duration-300 focus:ring-2 focus:ring-primary/50"
                            >
                                <option value="ALL">All Semesters</option>
                                {availableKeys.map(k => <option key={k} value={k}>{k.toUpperCase()}</option>)}
                            </select>
                        )}
                    </div>
                    <div className="flex gap-2 text-white/40">
                        <button className="p-2 hover:bg-white/5 rounded-full transition-all hover:text-white"><span className="material-symbols-outlined">filter_list</span></button>
                        <button className="p-2 hover:bg-white/5 rounded-full transition-all hover:text-white"><span className="material-symbols-outlined">download</span></button>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse table-fixed">
                        <thead className="sticky top-0 bg-surface-container/90 backdrop-blur-md z-10 border-b border-white/5">
                            <tr className="text-[10px] uppercase tracking-widest text-on-surface-variant">
                                <th className="px-8 py-4 font-bold w-32 border-r border-white/5">ID</th>
                                <th className="px-8 py-4 font-bold w-48 border-r border-white/5">Subject Block</th>
                                <th className="px-8 py-4 font-bold border-r border-white/5">Content Map</th>
                                <th className="px-8 py-4 font-bold w-32 border-r border-white/5">Ref</th>
                                <th className="px-8 py-4 font-bold text-right w-40">Controls</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {currentList.map(q => {
                                const cAns = getCorrectAnswerFor(q.id).join(',')
                                return (
                                    <tr key={q.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-8 py-5 text-xs font-mono text-primary truncate" title={q.id}>{q.id.substring(0,8)}...</td>
                                        <td className="px-8 py-5">
                                            <span className="px-3 py-1 bg-primary/10 text-primary-fixed text-[10px] font-bold rounded-full truncate max-w-full inline-block">{q.actualKey}</span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <p className="text-sm font-medium text-white truncate max-w-md">{q.questionTextCleaned || q.question}</p>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-[10px] font-black">{cAns}</span>
                                        </td>
                                        <td className="px-8 py-5 text-right flex justify-end">
                                            <div className="flex gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => { 
                                                    setEditingQ(q)
                                                    setEditQuestionText(q.question)
                                                    setEditAnswerText(cAns)
                                                    setEditOptions({
                                                        A: q.options.A || '',
                                                        B: q.options.B || '',
                                                        C: q.options.C || '',
                                                        D: q.options.D || '',
                                                        E: q.options.E || ''
                                                    })
                                                }} className="p-2 hover:bg-primary/20 rounded-lg text-primary transition-all flex items-center gap-2 px-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]" title="Edit Question & Answer">
                                                    <span className="material-symbols-outlined text-sm">edit</span> Edit node
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                            {currentList.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center py-20 text-white/30 text-sm">No matches found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="px-8 py-4 bg-surface-container-highest/30 flex justify-between items-center text-xs text-on-surface-variant border-t border-white/5">
                    <p>Showing {(page-1)*perPage + 1}-{Math.min(page*perPage, displayList.length)} of {displayList.length} items</p>
                    <div className="flex gap-2">
                        <button disabled={page === 1} onClick={() => setPage(page-1)} className="px-4 py-2 hover:bg-white/5 rounded-full transition-all disabled:opacity-30 disabled:cursor-not-allowed text-white">Prev</button>
                        <button disabled={page * perPage >= displayList.length} onClick={() => setPage(page+1)} className="px-4 py-2 bg-primary/20 text-primary-fixed rounded-full transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/30">Next</button>
                    </div>
                </div>
            </section>

            <AnimatePresence>
                {editingQ && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass-panel p-8 rounded-2xl w-full max-w-2xl border border-white/20 shadow-[-10px_-10px_30px_4px_rgba(0,0,0,0.1),_10px_10px_30px_4px_rgba(45,78,255,0.15)] flex flex-col relative"
                        >
                            <button onClick={() => setEditingQ(null)} className="absolute top-6 right-6 text-on-surface-variant hover:text-white transition-colors bg-white/5 p-2 rounded-full"><span className="material-symbols-outlined text-sm">close</span></button>
                            
                            <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                                <span className={`material-symbols-outlined text-primary`}>edit_note</span>
                                Modify Node Content
                            </h3>
                            <p className="text-on-surface-variant text-sm mb-6 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div> Node ID: {editingQ.id}</p>
                            
                            <div className="grid grid-cols-2 gap-8 flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-2 mb-8 mt-4">
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[10px] uppercase tracking-widest text-primary-fixed block mb-3 font-black">Question Mapping</label>
                                        <textarea 
                                            className="w-full h-40 bg-white/5 border border-white/10 rounded-xl p-5 text-white placeholder-white/30 focus:ring-2 focus:ring-primary/50 outline-none custom-scrollbar resize-none font-medium text-[14px] leading-relaxed" 
                                            value={editQuestionText}
                                            onChange={e => setEditQuestionText(e.target.value)}
                                        ></textarea>
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase tracking-widest text-tertiary block mb-3 font-black flex items-center gap-2">
                                            Solution Key(s) <span className="text-[8px] text-white/30 font-normal normal-case">(Comma separated: A,B)</span>
                                        </label>
                                        <input 
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:ring-2 focus:ring-tertiary/50 outline-none font-black tracking-widest text-lg" 
                                            value={editAnswerText}
                                            onChange={e => setEditAnswerText(e.target.value.toUpperCase())}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] uppercase tracking-widest text-secondary block mb-1 font-black">Option Content</label>
                                    {['A','B','C','D','E'].map(opt => (
                                        <div key={opt} className="relative group/opt">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary border border-primary/20">{opt}</div>
                                            <input 
                                                className={`w-full bg-white/5 border ${editAnswerText.includes(opt) ? 'border-green-500/30 ring-1 ring-green-500/20' : 'border-white/10'} rounded-xl pl-14 pr-4 py-3 text-sm text-white focus:ring-1 focus:ring-secondary/50 outline-none transition-all`}
                                                value={editOptions[opt]}
                                                placeholder={`Option ${opt} content...`}
                                                onChange={e => setEditOptions({ ...editOptions, [opt]: e.target.value })}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button onClick={handleSave} className="w-full py-4 bg-gradient-to-r from-primary to-primary-dim text-black font-black uppercase tracking-widest text-sm rounded-xl hover:scale-[1.02] shadow-[0_10px_20px_rgba(133,173,255,0.3)] transition-all">Submit Revision</button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}
