import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '../../store/useAuthStore'

export const TopHeader = ({ toggleSidebar }) => {
  const { user, isGuest, getDisplayName, getAvatarUrl, signOut, isAdmin } = useAuthStore()
  const avatarUrl = getAvatarUrl()
  const displayName = getDisplayName()

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
            {/* User Profile Chip */}
            <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover ring-2 ring-primary/30" />
                ) : (
                    <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary text-sm">
                            {isGuest ? 'visibility' : 'person'}
                        </span>
                    </div>
                )}
                <span className="text-sm font-bold text-white hidden md:block">{displayName}</span>
                {isGuest && (
                    <span className="text-[8px] uppercase tracking-widest text-yellow-400/80 font-black bg-yellow-400/10 px-2 py-0.5 rounded-full border border-yellow-400/20">Guest</span>
                )}
                {isAdmin() && (
                    <span className="text-[8px] uppercase tracking-widest text-error font-black bg-error/10 px-2 py-0.5 rounded-full border border-error/20">Admin</span>
                )}
            </div>

            {/* Admin Portal Link */}
            {isAdmin() && (
                <Link 
                    to="/admin"
                    className="w-10 h-10 rounded-full bg-error/10 border border-error/20 flex items-center justify-center text-error hover:bg-error/20 transition-colors"
                    title="Admin Portal"
                >
                    <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
                </Link>
            )}

            {/* Sign Out / Sign In */}
            {!isGuest && user ? (
                <button 
                    onClick={() => {
                        if(window.confirm("Are you sure you want to sign out?")) {
                            signOut()
                        }
                    }}
                    className="px-5 py-2 rounded-full bg-white/5 hover:bg-error/10 border border-white/10 hover:border-error/30 text-white/60 hover:text-error text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2"
                >
                    <span className="material-symbols-outlined text-sm">logout</span>
                    <span className="hidden md:inline">Sign Out</span>
                </button>
            ) : isGuest ? (
                <button 
                    onClick={() => {
                        useAuthStore.getState().signInWithGoogle()
                    }}
                    className="px-5 py-2 rounded-full bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2"
                >
                    <span className="material-symbols-outlined text-sm">login</span>
                    <span className="hidden md:inline">Sign In</span>
                </button>
            ) : null}
        </div>
    </motion.header>
  )
}
