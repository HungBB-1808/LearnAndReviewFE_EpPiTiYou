import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAppStore } from '../../store/useAppStore'

export const TopHeader = ({ toggleSidebar }) => {
  return (
    <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="h-20 border-b border-white/5 bg-surface-container-low/50 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-40"
    >
        <div className="flex items-center gap-6">
            <button 
                onClick={toggleSidebar}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white transition-all active:scale-95"
            >
                <span className="material-symbols-outlined text-[20px]">menu_open</span>
            </button>
            <div className="hidden md:flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <span className="material-symbols-outlined text-black font-black text-sm">school</span>
                </div>
                <h2 className="text-lg font-bold text-white tracking-tight">EduFU SPA Portal</h2>
            </div>
        </div>

        <div className="flex items-center gap-4 relative z-50 pointer-events-auto">
            {/* Notifications */}
            <button 
                onClick={() => alert("No new notifications")}
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-on-surface-variant hover:text-white hover:bg-white/10 transition-colors relative"
            >
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-error animate-pulse"></span>
                <span className="material-symbols-outlined text-sm">notifications</span>
            </button>

            {/* Admin Shield Dropdown/Access */}
            <Link 
                to="/admin"
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-on-surface-variant hover:text-white hover:bg-white/10 transition-colors"
                title="Admin Portal"
            >
                <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
            </Link>

            <button 
                onClick={() => {
                    if(window.confirm("Are you sure you want to log out?")) {
                        useAppStore.getState().userLogout();
                        window.location.reload();
                    }
                }}
                className="md:ml-4 px-6 py-2 rounded-full bg-primary/20 text-primary-fixed border border-primary/30 text-xs font-black uppercase tracking-widest hover:bg-primary/30 transition-colors"
            >
                Logout
            </button>
        </div>
    </motion.header>
  )
}
