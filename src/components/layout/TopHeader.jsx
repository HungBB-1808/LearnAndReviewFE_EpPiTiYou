import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '../../store/useAuthStore'
import { useAppStore } from '../../store/useAppStore'
import { getTranslations } from '../../lib/translations'
import { flushSync } from 'react-dom'
import { TextMorph } from '../ui/TextMorph'
import { LiquidGlassTabs } from '../ui/LiquidGlassTabs'

export const TopHeader = ({ toggleSidebar }) => {
  const { user, isGuest, getDisplayName, getAvatarUrl, signOut, isAdmin } = useAuthStore()
  const language = useAppStore((s) => s.language)
  const themeMode = useAppStore((s) => s.themeMode)
  const setThemeMode = useAppStore((s) => s.setThemeMode)
  const t = getTranslations(language)
  const avatarUrl = getAvatarUrl()
  const displayName = getDisplayName()

  const themeTabs = [
      { id: 'light', icon: 'light_mode', color: '#f59e0b' },
      { id: 'dark', icon: 'dark_mode', color: '#85adff' }
  ];

  const handleThemeChange = (targetMode, e) => {
      if (themeMode === targetMode) return;
      if (!document.startViewTransition) {
          setThemeMode(targetMode);
          return;
      }

      const valX = e.clientX;
      const valY = e.clientY;
      
      const endRadius = Math.hypot(
          Math.max(valX, window.innerWidth - valX),
          Math.max(valY, window.innerHeight - valY)
      );

      const transition = document.startViewTransition(() => {
          flushSync(() => {
              setThemeMode(targetMode);
              const rootUrl = document.documentElement;
              if (targetMode === 'light') rootUrl.classList.add('light');
              else rootUrl.classList.remove('light');
          });
      });

      transition.ready.then(() => {
          const clipPath = [
              `circle(0px at ${valX}px ${valY}px)`,
              `circle(${endRadius}px at ${valX}px ${valY}px)`
          ];
          
          document.documentElement.animate(
              {
                 clipPath: clipPath
              },
              {
                  duration: 500,
                  easing: 'ease-in-out',
                  pseudoElement: '::view-transition-new(root)'
              }
          );
      });
  }

  return (
    <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="h-16 md:h-20 border-b border-white/5 bg-surface-container-low/50 backdrop-blur-xl flex items-center justify-between px-4 md:px-8 sticky top-0 z-40"
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

        <div className="flex items-center gap-2 md:gap-4 relative z-50 pointer-events-auto">
            {/* Theme Toggle */}
            <LiquidGlassTabs 
                tabs={themeTabs} 
                activeTab={themeMode} 
                onTabChange={handleThemeChange} 
                layoutIdPrefix="theme-switch" 
            />

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
                        if(window.confirm(t.topHeader.confirmSignOut)) {
                            signOut()
                        }
                    }}
                    className="px-5 py-2 rounded-full bg-white/5 hover:bg-error/10 border border-white/10 hover:border-error/30 text-white/60 hover:text-error text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2"
                >
                    <span className="material-symbols-outlined text-sm">logout</span>
                    <TextMorph text={t.topHeader.signOut} className="hidden md:flex" />
                </button>
            ) : isGuest ? (
                <button 
                    onClick={() => {
                        useAuthStore.getState().signInWithGoogle()
                    }}
                    className="px-5 py-2 rounded-full bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2"
                >
                    <span className="material-symbols-outlined text-sm">login</span>
                    <TextMorph text={t.topHeader.signIn} className="hidden md:flex" />
                </button>
            ) : null}
        </div>
    </motion.header>
  )
}
