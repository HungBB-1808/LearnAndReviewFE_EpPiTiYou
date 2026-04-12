import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useAppStore } from '../store/useAppStore'
import { useAuthStore } from '../store/useAuthStore'
import { useNavigate } from 'react-router-dom'

const BARCA_LOGO = 'https://upload.wikimedia.org/wikipedia/en/thumb/4/47/FC_Barcelona_%28crest%29.svg/800px-FC_Barcelona_%28crest%29.svg.png'

export const EOSExam = () => {
    const { activeSession, selectedSubject, updateSessionIndex, updateSessionAnswer, updateSessionTime, examSettings, getCorrectAnswerFor, saveExamResult } = useAppStore()
    const { getDisplayName, getAvatarUrl } = useAuthStore()
    const navigate = useNavigate()
    const [timeLeft, setTimeLeft] = useState(examSettings.timeLimit * 60)
    const timerRef = useRef()
    const sessionStartRef = useRef(Date.now())
    const [zoom, setZoom] = useState(10)
    const [fontSize, setFontSize] = useState(10)
    const [leftPanelWidth, setLeftPanelWidth] = useState(30)
    const isResizing = useRef(false)
    const containerRef = useRef(null)
    const [wantFinish, setWantFinish] = useState(false)
    const [wantFinishFooter, setWantFinishFooter] = useState(false)
    const [vol, setVol] = useState(8)
    const avatarUrl = getAvatarUrl()

    // Enter fullscreen on mount
    useEffect(() => {
        const enterFullscreen = async () => {
            try {
                if (document.documentElement.requestFullscreen) {
                    await document.documentElement.requestFullscreen()
                } else if (document.documentElement.webkitRequestFullscreen) {
                    await document.documentElement.webkitRequestFullscreen()
                } else if (document.documentElement.msRequestFullscreen) {
                    await document.documentElement.msRequestFullscreen()
                }
            } catch (e) {
                console.warn('Fullscreen request failed:', e)
            }
        }
        enterFullscreen()

        return () => {
            try {
                if (document.fullscreenElement) {
                    document.exitFullscreen()
                } else if (document.webkitFullscreenElement) {
                    document.webkitExitFullscreen()
                }
            } catch (e) { /* ignore */ }
        }
    }, [])

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
    const optionKeys = q?.options ? Object.keys(q.options).sort() : []
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

    // Resizer
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

    /* ========== Inline styles to match eos.html exactly ========== */
    const labelStyle = { fontSize: 11, fontWeight: 600, color: '#374151' }
    const valueStyle = { fontSize: 11, color: '#111827', marginLeft: 4 }
    const controlInputStyle = { border: '1px solid #9ca3af', padding: '0 4px', height: 20, fontSize: 11, outline: 'none', background: '#fff' }
    const btnGray = { background: '#d1d5db', border: '1px solid #4b5563', fontSize: 10, height: 20, padding: '0 6px', cursor: 'pointer' }

    return (
        <div style={{ fontFamily: 'sans-serif', fontSize: 14, height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#d4d0c8', color: '#000', userSelect: 'none' }}>

            {/* ===== HEADER — exact match to eos.html ===== */}
            <header style={{ background: '#d4d0c8', padding: 8, borderBottom: '1px solid #9ca3af', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', height: 160 }}>

                {/* Left Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, width: 450 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 4 }}>
                        <label style={{ display: 'flex', alignItems: 'center', fontSize: 11, cursor: 'pointer' }}>
                            <input type="checkbox" style={{ marginRight: 4, width: 12, height: 12 }} checked={wantFinish} onChange={e => setWantFinish(e.target.checked)} />
                            I want to finish the exam.
                        </label>
                        <button onClick={() => { if (wantFinish) handleSubmit() }} disabled={!wantFinish} style={{ ...btnGray, fontSize: 11, padding: '0 12px', opacity: wantFinish ? 1 : 0.5 }}>
                            Finish (Submit)
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 8px' }}>
                        {/* Row 1 */}
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span style={{ ...labelStyle, width: 64 }}>Machine:</span>
                            <span style={valueStyle}>EDU-FU-FPT</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span style={{ ...labelStyle, width: 80 }}>Exam Code:</span>
                            <span style={valueStyle}>{selectedSubject || 'FDU_FU_TEST'}</span>
                        </div>
                        {/* Row 2 */}
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span style={{ ...labelStyle, width: 64 }}>Server:</span>
                            <span style={valueStyle}>Edu_FU_EOS_123456</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span style={{ ...labelStyle, width: 80 }}>Student:</span>
                            <span style={valueStyle}>{studentId}</span>
                        </div>
                        {/* Row 3 */}
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span style={{ ...labelStyle, width: 64 }}>Duration:</span>
                            <span style={{ ...valueStyle, fontWeight: 700 }}>{examSettings.timeLimit} minutes</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span style={{ ...labelStyle, width: 80 }}>Open Code:</span>
                            <input style={{ ...controlInputStyle, width: 96, marginRight: 4 }} type="text" defaultValue="12345" readOnly />
                            <button style={{ ...btnGray, fontSize: 10 }}>Show Question</button>
                        </div>
                        {/* Row 4 */}
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span style={{ ...labelStyle, width: 64 }}>Q mark:</span>
                            <span style={valueStyle}>1</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span style={{ ...labelStyle, width: 80 }}>Total Marks:</span>
                            <span style={{ ...valueStyle, fontWeight: 700 }}>{questions.length}</span>
                            <span style={{ ...labelStyle, marginLeft: 8 }}>Vol:</span>
                            <div style={{ display: 'flex', alignItems: 'center', marginLeft: 4, border: '1px solid #9ca3af', background: '#fff' }}>
                                <input style={{ width: 32, fontSize: 11, padding: '0 4px', outline: 'none', border: 'none' }} type="text" value={vol} onChange={e => setVol(e.target.value)} />
                                <div style={{ display: 'flex', flexDirection: 'column', borderLeft: '1px solid #9ca3af' }}>
                                    <button onClick={() => setVol(v => Number(v) + 1)} style={{ padding: '0 2px', fontSize: 8, lineHeight: 1, borderBottom: '1px solid #9ca3af', cursor: 'pointer', background: 'transparent', border: 'none', borderLeft: 'none', borderBottom: '1px solid #9ca3af' }}>▲</button>
                                    <button onClick={() => setVol(v => Math.max(0, Number(v) - 1))} style={{ padding: '0 2px', fontSize: 8, lineHeight: 1, cursor: 'pointer', background: 'transparent', border: 'none' }}>▼</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Font & Size */}
                    <div style={{ display: 'flex', alignItems: 'center', marginTop: 4 }}>
                        <span style={{ ...labelStyle, width: 64 }}>Font:</span>
                        <select style={{ ...controlInputStyle, width: 128 }} defaultValue="Microsoft Sans Serif">
                            <option>Microsoft Sans Serif</option>
                            <option>Arial</option>
                            <option>Times New Roman</option>
                        </select>
                        <span style={{ ...labelStyle, marginLeft: 16 }}>Size:</span>
                        <div style={{ display: 'flex', alignItems: 'center', marginLeft: 4, border: '1px solid #9ca3af', background: '#fff' }}>
                            <input style={{ width: 32, fontSize: 11, padding: '0 4px', outline: 'none', border: 'none' }} type="text" value={fontSize} onChange={e => setFontSize(Number(e.target.value) || 10)} />
                            <div style={{ display: 'flex', flexDirection: 'column', borderLeft: '1px solid #9ca3af' }}>
                                <button onClick={() => setFontSize(s => s + 1)} style={{ padding: '0 2px', fontSize: 8, lineHeight: 1, borderBottom: '1px solid #9ca3af', cursor: 'pointer', background: 'transparent', border: 'none' }}>▲</button>
                                <button onClick={() => setFontSize(s => Math.max(6, s - 1))} style={{ padding: '0 2px', fontSize: 8, lineHeight: 1, cursor: 'pointer', background: 'transparent', border: 'none' }}>▼</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Center: Profile & Timer */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', flexGrow: 1 }}>
                    <div style={{ position: 'relative', marginBottom: 4 }}>
                        <div style={{ width: 64, height: 80, background: '#fff', border: '1px solid #9ca3af', padding: 2 }}>
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Student" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ width: '100%', height: '100%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                                </div>
                            )}
                        </div>
                        <div style={{ position: 'absolute', right: -8, top: '50%', transform: 'translateY(-50%)', width: 12, height: 12, background: '#22c55e', borderRadius: '50%', border: '2px solid #fff' }}></div>
                    </div>
                    <div style={{ fontSize: 56, fontFamily: 'monospace', fontWeight: 700, color: '#1e3a8a', lineHeight: 1 }}>{formatTime(timeLeft)}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#374151', marginTop: 4, textTransform: 'uppercase' }}>Time Left</div>
                </div>

                {/* Right: ID & Barcelona Logo */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', width: 150, gap: 4, paddingRight: 16 }}>
                    <div style={{ fontSize: 32, fontWeight: 700, color: '#1f2937', letterSpacing: '-0.025em' }}>123456</div>
                    <div style={{ width: 64, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src={BARCA_LOGO} alt="FC Barcelona Crest" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                </div>
            </header>

            {/* ===== TABS ===== */}
            <nav style={{ background: '#ccc', padding: '4px 2px 0', display: 'flex', gap: 2, borderBottom: '1px solid #9ca3af' }}>
                <button style={{ padding: '4px 12px', fontSize: 11, background: '#e5e7eb', borderTop: '1px solid #d1d5db', borderLeft: '1px solid #d1d5db', borderRight: '1px solid #d1d5db', borderBottom: 'none', cursor: 'pointer' }}>Reading</button>
                <button style={{ padding: '4px 12px', fontSize: 11, background: '#fff', borderTop: '1px solid #9ca3af', borderLeft: '1px solid #9ca3af', borderRight: '1px solid #9ca3af', borderBottom: 'none', fontWeight: 700, cursor: 'pointer' }}>Multiple Choices</button>
                <button style={{ padding: '4px 12px', fontSize: 11, background: '#e5e7eb', borderTop: '1px solid #d1d5db', borderLeft: '1px solid #d1d5db', borderRight: '1px solid #d1d5db', borderBottom: 'none', cursor: 'pointer' }}>Indicate Mistake</button>
                <button style={{ padding: '4px 12px', fontSize: 11, background: '#e5e7eb', borderTop: '1px solid #d1d5db', borderLeft: '1px solid #d1d5db', borderRight: '1px solid #d1d5db', borderBottom: 'none', cursor: 'pointer' }}>Matching</button>
                <button style={{ padding: '4px 12px', fontSize: 11, background: '#e5e7eb', borderTop: '1px solid #d1d5db', borderLeft: '1px solid #d1d5db', borderRight: '1px solid #d1d5db', borderBottom: 'none', cursor: 'pointer' }}>Fill Blank</button>
            </nav>

            {/* ===== MAIN CONTENT ===== */}
            <main style={{ flexGrow: 1, display: 'flex', overflow: 'hidden', background: '#fff' }}>

                {/* Far Left Sidebar: Answer Selection */}
                <div style={{ borderRight: '1px solid #9ca3af', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 16, paddingBottom: 16, background: '#fff', flexShrink: 0, width: 120 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#15803d', marginBottom: 16 }}>Answer</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {optionKeys.map(opt => (
                            <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    style={{ width: 14, height: 14 }}
                                    checked={selectedParts.includes(opt.toUpperCase())}
                                    onChange={() => handleOptionToggle(opt.toUpperCase())}
                                />
                                <span style={{ fontSize: 11, fontWeight: 700 }}>{opt.toUpperCase()}</span>
                            </label>
                        ))}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
                        <button
                            onClick={() => { if (currentIndex > 0) updateSessionIndex(currentIndex - 1) }}
                            disabled={currentIndex === 0}
                            style={{ ...btnGray, width: 48, opacity: currentIndex === 0 ? 0.4 : 1 }}
                        >Back</button>
                        <button
                            onClick={() => { if (currentIndex < questions.length - 1) updateSessionIndex(currentIndex + 1) }}
                            disabled={currentIndex === questions.length - 1}
                            style={{ ...btnGray, width: 48, opacity: currentIndex === questions.length - 1 ? 0.4 : 1 }}
                        >Next</button>
                    </div>
                </div>

                {/* Question Content */}
                <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {/* Progress bar */}
                    <div style={{ background: '#fff', borderBottom: '1px solid #d1d5db', padding: '4px 8px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 11, color: '#15803d', fontWeight: 700 }}>
                            There are {questions.length} questions, and your progress of answering is
                        </span>
                        <div style={{ width: 160, height: 12, background: '#e5e7eb', border: '1px solid #9ca3af', marginLeft: 8 }}>
                            <div style={{ width: `${progressPercent}%`, height: '100%', background: '#22c55e', transition: 'width 0.3s' }}></div>
                        </div>
                    </div>

                    {/* Resizable Split Pane */}
                    <div style={{ flexGrow: 1, display: 'flex', overflow: 'hidden' }} ref={containerRef}>

                        {/* Left: Instruction */}
                        <div style={{ width: `${leftPanelWidth}%`, padding: 16, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
                            <div style={{ fontSize: 11, color: '#1f2937', fontWeight: 700 }}>
                                Number of answers to select: {numCorrectAnswers}
                            </div>
                            <div style={{ fontSize: 11, color: '#4b5563', fontStyle: 'italic' }}>
                                (Choose {numCorrectAnswers} answer{numCorrectAnswers > 1 ? 's' : ''})
                            </div>
                        </div>

                        {/* Resizer Divider */}
                        <div
                            onMouseDown={onMouseDown}
                            style={{ width: 4, cursor: 'col-resize', background: '#d4d0c8', borderLeft: '1px solid #a0a0a0', borderRight: '1px solid #fff', flexShrink: 0, zIndex: 10 }}
                        ></div>

                        {/* Right: Question Area */}
                        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            {/* Zoom controls */}
                            <div style={{ background: '#f3f4f6', borderBottom: '1px solid #d1d5db', padding: '4px 8px', display: 'flex', justifyContent: 'flex-end', gap: 4, flexShrink: 0 }}>
                                <button onClick={() => setFontSize(10)} style={btnGray}>Real size</button>
                                <button onClick={() => setFontSize(s => Math.min(s + 2, 30))} style={btnGray}>Zoom In</button>
                                <button onClick={() => setFontSize(s => Math.max(6, s - 2))} style={btnGray}>Zoom Out</button>
                            </div>
                            {/* Question text */}
                            <div style={{ flexGrow: 1, padding: 16, overflowY: 'auto' }}>
                                <div style={{ fontSize: fontSize, color: '#1f2937', lineHeight: 1.6 }}>
                                    <p>{q?.questionTextCleaned || q?.question}</p>
                                    <div style={{ paddingLeft: 16, marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {optionKeys.map(opt => {
                                            if (!q.options[opt]) return null
                                            return (
                                                <p key={opt}>{opt.toUpperCase()}. {q.options[opt]}</p>
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
            <footer style={{ background: '#d4d0c8', borderTop: '1px solid #4b5563', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 36 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <label style={{ display: 'flex', alignItems: 'center', fontSize: 11, marginLeft: 8, cursor: 'pointer' }}>
                        <input type="checkbox" style={{ marginRight: 4, width: 12, height: 12 }} checked={wantFinishFooter} onChange={e => setWantFinishFooter(e.target.checked)} />
                        I want to finish the exam.
                    </label>
                    <button
                        onClick={() => { if (wantFinishFooter) handleSubmit() }}
                        disabled={!wantFinishFooter}
                        style={{ background: wantFinishFooter ? '#f0ad4e' : '#d1d5db', border: '1px solid #4b5563', padding: '0 24px', fontSize: 12, fontWeight: 700, cursor: wantFinishFooter ? 'pointer' : 'default', opacity: wantFinishFooter ? 1 : 0.5 }}
                    >Finish</button>
                </div>
                <div style={{ color: '#000080', fontWeight: 700, fontSize: 20, fontStyle: 'italic', letterSpacing: '0.1em', textAlign: 'center', flexGrow: 1 }}>
                    USB RUNNING
                </div>
                <div style={{ display: 'flex', alignItems: 'center', paddingRight: 8 }}>
                    <button
                        onClick={() => { if (window.confirm('Exit the exam? Your progress will be lost.')) { clearInterval(timerRef.current); navigate('/mode') } }}
                        style={{ background: '#e5e7eb', border: '1px solid #4b5563', padding: '2px 24px', fontSize: 12, cursor: 'pointer' }}
                    >Exit</button>
                </div>
            </footer>
        </div>
    )
}
