import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAppStore } from '../../store/useAppStore'
import { useAuthStore } from '../../store/useAuthStore'
import { getTranslations } from '../../lib/translations'
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

export const Sidebar = ({ isOpen, setIsOpen }) => {
  const { pathname } = useLocation()
  const { user, isGuest, getDisplayName, getAvatarUrl, isAdmin } = useAuthStore()
  const { language, setLanguage } = useAppStore()
  const t = getTranslations(language)
  const avatarUrl = getAvatarUrl()
  const displayName = getDisplayName()
  
  // Auto close on mobile navigation
  useEffect(() => {
    if (window.innerWidth < 768) setIsOpen(false)
  }, [pathname, setIsOpen])

  const links = [
    { to: "/subjects", icon: "book", label: t.sidebar.subjects },
    { to: "/history", icon: "history", label: t.sidebar.examHistory },
    { to: "/bookmarks", icon: "bookmark", label: t.sidebar.bookmarks },
  ]

  const isActive = (path) => pathname.startsWith(path)

  return (
    <motion.aside
      initial={false}
      animate={{ x: isOpen ? 0 : '-100%' }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed top-0 left-0 h-full w-64 bg-surface-container-low/30 backdrop-blur-3xl border-r border-white/5 shadow-2xl z-50 flex flex-col transition-transform duration-500 will-change-transform"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>

      <div className="p-8 relative z-10 flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-black tracking-tight text-white mb-1">EduFU</h1>
            <p className="text-[10px] font-bold tracking-widest text-primary uppercase">Portal</p>
        </div>
        {/* Mobile close button */}
        <button className="md:hidden text-on-surface-variant p-2" onClick={() => setIsOpen(false)}>
            <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-8 relative z-10">
        {links.map((link, idx) => {
            const active = isActive(link.to) && link.to !== '#'
            return (
                <Link key={idx} to={link.to} className={cn(
                    "w-full flex items-center gap-4 px-6 py-4 rounded-xl text-sm font-bold transition-all group overflow-hidden relative",
                    active ? "bg-white/10 text-white shadow-lg" : "text-on-surface-variant hover:text-white hover:bg-white/5"
                )}>
                    {active && <motion.div layoutId="activeNav" className="absolute left-0 w-1 h-8 rounded-r bg-primary"></motion.div>}
                    <span className={cn("material-symbols-outlined transition-colors", active ? "text-primary" : "")} style={{ fontVariationSettings: "'FILL' 0" }}>{link.icon}</span>
                    {link.label}
                </Link>
            )
        })}

        {/* Language Toggle */}
        <div className="my-6 px-2">
            <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-3 px-4">{t.sidebar.language}</p>
            <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/5">
                <button
                    onClick={() => setLanguage('en')}
                    className={`flex-1 px-3 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                        language === 'en' 
                        ? 'bg-primary text-black shadow-[0_4px_12px_rgba(0,188,212,0.3)]' 
                        : 'text-white/40 hover:text-white'
                    }`}
                >
                    🇺🇸 EN
                </button>
                <button
                    onClick={() => setLanguage('vi')}
                    className={`flex-1 px-3 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                        language === 'vi' 
                        ? 'bg-primary text-black shadow-[0_4px_12px_rgba(0,188,212,0.3)]' 
                        : 'text-white/40 hover:text-white'
                    }`}
                >
                    🇻🇳 VI
                </button>
            </div>
        </div>

        {/* Admin link - only show if user is admin */}
        {isAdmin() && (
          <>
            <div className="my-8 h-px w-3/4 mx-auto bg-white/5"></div>
            <Link to="/admin" className={cn(
                "w-full flex items-center gap-4 px-6 py-4 rounded-xl text-sm font-bold transition-all group overflow-hidden relative",
                isActive("/admin") ? "bg-error/10 text-error shadow-lg" : "text-error hover:text-white hover:bg-error/20"
            )}>
                {isActive("/admin") && <motion.div layoutId="activeNav" className="absolute left-0 w-1 h-8 rounded-r bg-error"></motion.div>}
                <span className="material-symbols-outlined transition-colors">admin_panel_settings</span>
                {t.sidebar.adminAccess}
            </Link>
          </>
        )}
      </nav>

      <div className="p-6 border-t border-white/5 relative z-10">
        <div className="flex items-center gap-4 p-3 rounded-xl">
            <div className={`w-10 h-10 rounded-full p-[2px] transition-all duration-500 ${isAdmin() ? 'bg-gradient-to-tr from-error to-secondary shadow-[0_0_15px_rgba(255,110,132,0.5)]' : 'bg-gradient-to-tr from-primary to-secondary'}`}>
                {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                    <div className={`w-full h-full rounded-full bg-surface-container overflow-hidden flex items-center justify-center transition-colors ${isAdmin() ? 'text-error' : 'text-white/40'}`}>
                        <span className="material-symbols-outlined text-2xl">
                            {isAdmin() ? 'admin_panel_settings' : isGuest ? 'visibility' : 'person'}
                        </span>
                    </div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{displayName}</p>
                <p className={`text-[10px] truncate uppercase tracking-widest font-black transition-colors ${isAdmin() ? 'text-error' : isGuest ? 'text-yellow-400/80' : 'text-on-surface-variant'}`}>
                    {isAdmin() ? t.sidebar.administrator : isGuest ? t.sidebar.guestMode : t.sidebar.student}
                </p>
            </div>
        </div>
      </div>
    </motion.aside>
  )
}
