import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useAppStore } from '../store/useAppStore'
import { useAuthStore } from '../store/useAuthStore'
import { useNavigate } from 'react-router-dom'

const BARCA_LOGO = 'https://upload.wikimedia.org/wikipedia/en/thumb/4/47/FC_Barcelona_%28crest%29.svg/800px-FC_Barcelona_%28crest%29.svg.png'

export const EOSExam = () => {
    const { activeSession, selectedSubject, updateSessionIndex, updateSessionAnswer, updateSessionTime, examSettings, getCorrectAnswerFor, saveExamResult } = useAppStore()
    const { getDisplayName } = useAuthStore()
    const navigate = useNavigate()
    const [timeLeft, setTimeLeft] = useState(examSettings.timeLimit * 60)
    const timerRef = useRef()
    const sessionStartRef = useRef(Date.now())
    const [zoom, setZoom] = useState(100)
    const [leftPanelWidth, setLeftPanelWidth] = useState(30)
    const isResizing = useRef(false)
    const containerRef = useRef(null)
    const [wantFinish, setWantFinish] = useState(false)

    useEffect(() => {
        if (!activeSession || activeSession.mode !== 'exam') {
            navigate('/mode')
            return
        }
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
                if (passed > 0 && passed % 10 === 0) {
                    useAppStore.getState().updateSessionTime(initialTimeSpent + passed)
                }
                if (remaining <= 0) {
                    clearInterval(timerRef.current)
                    timerRef.current = null
                    handleSubmit()
                }
            }, 1000)
        }
        if (window.setSidebarState) window.setSidebarState(false)
        return () => {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        return () => { if (timerRef.current) clearInterval(timerRef.current) }
    }, [])

    // Keyboard nav
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
    const selectedParts = (userAnswer || "").split(',').filter(Boolean)
    const corrects = getCorrectAnswerFor(q?.id)
    const numCorrectAnswers = corrects.length

    // Calculate the dynamic options: A, B, C, D + E, F if needed
    const optionKeys = q?.options ? Object.keys(q.options).sort() : []

    // Progress: how many questions have been answered
    const answeredCount = Object.keys(activeSession.answers).length
    const progressPercent = (answeredCount / questions.length) * 100

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
            const cAns = store.getCorrectAnswerFor(q.id).sort().join(',')
            const uAns = (sess.answers[i] || "").split(',').filter(Boolean).sort().join(',')
            // Correct only when the exact right count & values match
            if (cAns === uAns && cAns !== "") correctCount++
        })

        const score = Number(((correctCount / sess.questions.length) * 10).toFixed(2))
        store.saveExamResult({ score, correct: correctCount, total: sess.questions.length, timeSpent: finalTimeSpent, questions: sess.questions, answers: sess.answers })
        navigate('/result', { state: { score, correct: correctCount, total: sess.questions.length, timeSpent: finalTimeSpent, questions: sess.questions, answers: sess.answers } })
        store.clearSession()
    }

    const handleOptionToggle = (opt) => {
        updateSessionAnswer(currentIndex, opt)
    }

    const formatTime = (secs) => {
        if (secs < 0) secs = 0
        const m = Math.floor(secs / 60).toString().padStart(2, '0')
        const s = (secs % 60).toString().padStart(2, '0')
        return `${m}:${s}`
    }

    // Resizer handlers
    const onMouseDown = useCallback(() => { isResizing.current = true }, [])
    const onMouseMove = useCallback((e) => {
        if (!isResizing.current || !containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        const offsetX = e.clientX - rect.left
        const pct = (offsetX / rect.width) * 100
        if (pct > 10 && pct < 80) setLeftPanelWidth(pct)
    }, [])
    const onMouseUp = useCallback(() => { isResizing.current = false }, [])

    useEffect(() => {
        document.addEventListener('mousemove', onMouseMove)
        document.addEventListener('mouseup', onMouseUp)
        return () => {
            document.removeEventListener('mousemove', onMouseMove)
            document.removeEventListener('mouseup', onMouseUp)
        }
    }, [onMouseMove, onMouseUp])

    const studentId = getDisplayName()?.substring(0, 10) || 'DE123456'

    return (
        <div className="font-sans text-sm h-screen flex flex-col overflow-hidden select-none" style={{ background: '#d4d0c8', color: '#000' }}>
            {/* ===== HEADER ===== */}
            <header className="p-2 border-b flex justify-between items-start" style={{ borderColor: '#999', background: '#d4d0c8', minHeight: 140 }}>
                {/* Left: Exam Details */}
                <div className="flex flex-col gap-0.5" style={{ width: 450 }}>
                    <div className="flex items-center gap-4 mb-1">
                        <label className="flex items-center text-[11px]">
                            <input type="checkbox" className="mr-1 h-3 w-3" checked={wantFinish} onChange={e => setWantFinish(e.target.checked)} /> I want to finish the exam.
                        </label>
                        <button
                            onClick={() => { if (wantFinish) handleSubmit() }}
                            disabled={!wantFinish}
                            className="border px-3 py-0 text-[11px] shadow-sm active:shadow-inner"
                            style={{ background: wantFinish ? '#f0ad4e' : '#ccc', borderColor: '#666', opacity: wantFinish ? 1 : 0.6 }}
                        >Finish (Submit)</button>
                    </div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                        <div className="flex items-center">
                            <span className="text-[11px] font-semibold text-gray-700 w-16">Machine:</span>
                            <span className="text-[11px] ml-1">EDU-FU-FPT</span>
                        </div>
                        <div className="flex items-center">
                            <span className="text-[11px] font-semibold text-gray-700 w-20">Exam Code:</span>
                            <span className="text-[11px] ml-1">{selectedSubject || 'FDU_FU_TEST'}</span>
                        </div>
                        <div className="flex items-center">
                            <span className="text-[11px] font-semibold text-gray-700 w-16">Server:</span>
                            <span className="text-[11px] ml-1">Edu_FU_EOS</span>
                        </div>
                        <div className="flex items-center">
                            <span className="text-[11px] font-semibold text-gray-700 w-20">Student:</span>
                            <span className="text-[11px] ml-1">{studentId}</span>
                        </div>
                        <div className="flex items-center">
                            <span className="text-[11px] font-semibold text-gray-700 w-16">Duration:</span>
                            <span className="text-[11px] font-bold ml-1">{examSettings.timeLimit} minutes</span>
                        </div>
                        <div className="flex items-center">
                            <span className="text-[11px] font-semibold text-gray-700 w-20">Q mark:</span>
                            <span className="text-[11px] ml-1">1</span>
                        </div>
                        <div className="flex items-center">
                            <span className="text-[11px] font-semibold text-gray-700 w-16">Total Marks:</span>
                            <span className="text-[11px] font-bold ml-1">{questions.length}</span>
                        </div>
                    </div>
                </div>

                {/* Center: Profile & Timer */}
                <div className="flex flex-col items-center justify-start flex-grow">
                    <div className="relative mb-1">
                        <div className="w-16 h-20 bg-white border p-0.5" style={{ borderColor: '#999' }}>
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                            </div>
                        </div>
                        <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>
                    <div className="text-5xl font-mono font-bold leading-none" style={{ color: '#003399' }}>{formatTime(timeLeft)}</div>
                    <div className="text-[10px] font-semibold text-gray-700 mt-1 uppercase">Time Left</div>
                </div>

                {/* Right: ID & Logo */}
                <div className="flex flex-col items-end gap-1 pr-4" style={{ width: 150 }}>
                    <div className="text-3xl font-bold text-gray-800 tracking-tight">{String(currentIndex + 1).padStart(2, '0')}/{questions.length}</div>
                    <div className="w-16 h-20 flex items-center justify-center">
                        <img src={BARCA_LOGO} alt="FC Barcelona" className="w-full h-full object-contain" />
                    </div>
                </div>
            </header>

            {/* ===== TABS (for EOS look) ===== */}
            <nav className="px-0.5 pt-1 flex gap-0.5 border-b" style={{ background: '#ccc', borderColor: '#999' }}>
                <button className="px-3 py-1 text-[11px] bg-white border-t border-x font-bold" style={{ borderColor: '#999' }}>Multiple Choices</button>
            </nav>

            {/* ===== MAIN CONTENT ===== */}
            <main className="flex-grow flex overflow-hidden bg-white">
                {/* Left sidebar: Answer checkboxes */}
                <div className="border-r flex flex-col items-center py-4 bg-white shrink-0" style={{ borderColor: '#999', width: 120 }}>
                    <span className="text-[11px] font-bold text-green-700 mb-4">Answer</span>
                    <div className="flex flex-col gap-3">
                        {optionKeys.map(opt => (
                            <label key={opt} className="flex items-center gap-1.5 cursor-pointer hover:bg-blue-50 px-2 py-0.5 rounded transition-colors">
                                <input
                                    type="checkbox"
                                    className="w-3.5 h-3.5 accent-blue-600"
                                    checked={selectedParts.includes(opt.toUpperCase())}
                                    onChange={() => handleOptionToggle(opt.toUpperCase())}
                                />
                                <span className="text-[11px] font-bold">{opt.toUpperCase()}</span>
                            </label>
                        ))}
                    </div>
                    <div className="flex gap-2 mt-6">
                        <button
                            onClick={() => { if (currentIndex > 0) updateSessionIndex(currentIndex - 1) }}
                            disabled={currentIndex === 0}
                            className="border px-2 py-0 text-[10px] h-5 w-12 shadow-sm active:shadow-inner disabled:opacity-40"
                            style={{ background: '#ccc', borderColor: '#666' }}
                        >Back</button>
                        <button
                            onClick={() => { if (currentIndex < questions.length - 1) updateSessionIndex(currentIndex + 1) }}
                            disabled={currentIndex === questions.length - 1}
                            className="border px-2 py-0 text-[10px] h-5 w-12 shadow-sm active:shadow-inner disabled:opacity-40"
                            style={{ background: '#ccc', borderColor: '#666' }}
                        >Next</button>
                    </div>
                </div>

                {/* Question content with resizable split */}
                <div className="flex-grow flex flex-col overflow-hidden">
                    {/* Progress bar */}
                    <div className="bg-white border-b px-2 py-1 flex items-center shrink-0" style={{ borderColor: '#ddd' }}>
                        <span className="text-[11px] text-green-700 font-bold">
                            There are {questions.length} questions, and your progress of answering is
                        </span>
                        <div className="w-40 h-3 bg-gray-200 border ml-2" style={{ borderColor: '#999' }}>
                            <div className="h-full bg-green-500 transition-all duration-300" style={{ width: `${progressPercent}%` }}></div>
                        </div>
                        <span className="text-[10px] text-gray-600 ml-2">{answeredCount}/{questions.length}</span>
                    </div>

                    {/* Resizable split view */}
                    <div className="flex-grow flex overflow-hidden" ref={containerRef}>
                        {/* Left: Number of answers info */}
                        <div className="p-4 flex flex-col gap-4 overflow-y-auto" style={{ width: `${leftPanelWidth}%` }}>
                            <div className="text-[11px] text-gray-800 font-bold">
                                Number of answers to select: {numCorrectAnswers}
                            </div>
                            <div className="text-[11px] text-gray-600 italic">
                                (Choose {numCorrectAnswers} answer{numCorrectAnswers > 1 ? 's' : ''})
                            </div>
                            
                            {/* Question navigator grid */}
                            <div className="mt-4">
                                <div className="text-[10px] font-bold text-gray-500 uppercase mb-2">Question Navigator</div>
                                <div className="grid grid-cols-5 gap-1">
                                    {questions.map((_, i) => {
                                        const isCurrent = i === currentIndex
                                        const isAnswered = !!activeSession.answers[i]
                                        return (
                                            <button
                                                key={i}
                                                onClick={() => updateSessionIndex(i)}
                                                className="h-6 text-[10px] font-bold border transition-all"
                                                style={{
                                                    background: isCurrent ? '#003399' : isAnswered ? '#90ee90' : '#fff',
                                                    color: isCurrent ? '#fff' : '#333',
                                                    borderColor: '#999',
                                                }}
                                            >{i + 1}</button>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Resizer */}
                        <div
                            onMouseDown={onMouseDown}
                            className="shrink-0 cursor-col-resize"
                            style={{
                                width: 4,
                                background: '#d4d0c8',
                                borderLeft: '1px solid #a0a0a0',
                                borderRight: '1px solid #fff',
                            }}
                        ></div>

                        {/* Right: Question display */}
                        <div className="flex-grow flex flex-col overflow-hidden">
                            {/* Zoom controls */}
                            <div className="bg-gray-100 border-b px-2 py-1 flex justify-end gap-1 shrink-0" style={{ borderColor: '#ddd' }}>
                                <button onClick={() => setZoom(100)} className="border px-2 text-[10px] h-5" style={{ background: '#ccc', borderColor: '#666' }}>Real size</button>
                                <button onClick={() => setZoom(z => Math.min(z + 15, 200))} className="border px-2 text-[10px] h-5" style={{ background: '#ccc', borderColor: '#666' }}>Zoom In</button>
                                <button onClick={() => setZoom(z => Math.max(z - 15, 60))} className="border px-2 text-[10px] h-5" style={{ background: '#ccc', borderColor: '#666' }}>Zoom Out</button>
                                <span className="text-[10px] text-gray-500 ml-2 self-center">{zoom}%</span>
                            </div>
                            <div className="flex-grow p-4 overflow-y-auto">
                                <div style={{ fontSize: `${zoom}%` }} className="text-gray-800 space-y-4 leading-normal transition-all">
                                    <p className="font-medium">{q?.questionTextCleaned || q?.question}</p>
                                    <div className="space-y-2 pl-4">
                                        {optionKeys.map(opt => {
                                            if (!q.options[opt]) return null
                                            const isSelected = selectedParts.includes(opt.toUpperCase())
                                            return (
                                                <p key={opt} className={`${isSelected ? 'font-bold text-blue-800' : ''}`}>
                                                    {opt.toUpperCase()}. {q.options[opt]}
                                                </p>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* ===== FOOTER ===== */}
            <footer className="border-t p-1 flex items-center justify-between" style={{ background: '#d4d0c8', borderColor: '#666', minHeight: 36 }}>
                <div className="flex items-center gap-4">
                    <label className="flex items-center text-[11px] ml-2">
                        <input type="checkbox" className="mr-1 h-3 w-3" checked={wantFinish} onChange={e => setWantFinish(e.target.checked)} /> I want to finish the exam.
                    </label>
                    <button
                        onClick={() => { if (wantFinish) handleSubmit() }}
                        disabled={!wantFinish}
                        className="border px-6 py-0 text-xs font-bold shadow-sm"
                        style={{ background: wantFinish ? '#f0ad4e' : '#ccc', borderColor: '#666', opacity: wantFinish ? 1 : 0.6 }}
                    >Finish</button>
                </div>
                <div className="font-bold text-xl italic tracking-wider text-center flex-grow" style={{ color: '#000080' }}>
                    USB RUNNING
                </div>
                <div className="flex items-center pr-2">
                    <button
                        onClick={() => { if (window.confirm('Exit the exam? Your progress will be lost.')) { clearInterval(timerRef.current); navigate('/mode') } }}
                        className="border px-6 py-0.5 text-xs"
                        style={{ background: '#e0e0e0', borderColor: '#666' }}
                    >Exit</button>
                </div>
            </footer>
        </div>
    )
}
