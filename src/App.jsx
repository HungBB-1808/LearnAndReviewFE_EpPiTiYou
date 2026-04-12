import { useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { MainLayout } from './components/layout/MainLayout'
import { SubjectSelection } from './pages/SubjectSelection'
import { ModeSelection } from './pages/ModeSelection'
import { StudySession } from './pages/Study'
import { PracticeSession } from './pages/Practice'
import { ActiveExam } from './pages/ActiveExam'
import { EOSExam } from './pages/EOSExam'
import { ExamResult } from './pages/ExamResult'
import { ExamHistory } from './pages/ExamHistory'
import { Bookmarks } from './pages/Bookmarks'
import { AdminDashboard } from './pages/AdminDashboard'
import { LoginPage } from './pages/LoginPage'
import { useAuthStore } from './store/useAuthStore'

function App() {
  const { user, isGuest, isLoading, initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  // Show a centered spinner while checking auth state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="text-on-surface-variant text-sm font-medium animate-pulse">Loading EduFU...</p>
        </div>
      </div>
    )
  }

  // If not logged in AND not a guest, show the Login page
  if (!user && !isGuest) {
    return (
      <HashRouter>
        <LoginPage />
      </HashRouter>
    )
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/subjects" replace />} />
          <Route path="subjects" element={<SubjectSelection />} />
          <Route path="mode" element={<ModeSelection />} />
          <Route path="study" element={<StudySession />} />
          <Route path="practice" element={<PracticeSession />} />
          <Route path="exam" element={<ActiveExam />} />
          <Route path="eos-exam" element={<EOSExam />} />
          <Route path="result" element={<ExamResult />} />
          <Route path="history" element={<ExamHistory />} />
          <Route path="bookmarks" element={<Bookmarks />} />
          <Route path="admin" element={<AdminDashboard />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default App
