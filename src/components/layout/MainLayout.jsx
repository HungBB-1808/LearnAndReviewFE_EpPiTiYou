import React, { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopHeader } from './TopHeader'
import { cn } from '../../lib/utils'

export const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768)
  const { pathname } = useLocation()
  
  // Expose setSidebarState to global window if necessary, but ideally we use props.
  useEffect(() => {
    window.setSidebarState = setIsSidebarOpen
    return () => delete window.setSidebarState
  }, [])
  
  const isExamMode = pathname.startsWith('/exam')

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Background Decor */}
      <div className="fixed top-1/4 right-0 w-[500px] h-[500px] bg-secondary-container/20 blur-[120px] -z-10 rounded-full pointer-events-none"></div>
      <div className="fixed bottom-0 left-1/4 w-[600px] h-[600px] bg-primary-dim/10 blur-[150px] -z-10 rounded-full pointer-events-none"></div>

      <Sidebar isOpen={isSidebarOpen && !isExamMode} setIsOpen={setIsSidebarOpen} />
      
      <div 
        className={cn(
            "flex-1 flex flex-col transition-all duration-500 ease-in-out h-full w-full relative z-10",
            isSidebarOpen && !isExamMode ? "md:ml-64" : "ml-0"
        )}
      >
        {!isExamMode && <TopHeader toggleSidebar={() => setIsSidebarOpen(prev => !prev)} />}
        <main className="flex-1 overflow-y-auto scroll-smooth relative w-full mx-auto max-w-full custom-scrollbar">
            <Outlet />
        </main>
      </div>
    </div>
  )
}
