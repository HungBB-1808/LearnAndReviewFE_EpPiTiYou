import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { MainLayout } from './components/layout/MainLayout'
import { SubjectSelection } from './pages/SubjectSelection'
import { ModeSelection } from './pages/ModeSelection'
import { StudySession } from './pages/Study'
import { PracticeSession } from './pages/Practice'
import { ActiveExam } from './pages/ActiveExam'
import { ExamResult } from './pages/ExamResult'
import { ExamHistory } from './pages/ExamHistory'
import { Bookmarks } from './pages/Bookmarks'
import { AdminDashboard } from './pages/AdminDashboard'

function App() {
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
