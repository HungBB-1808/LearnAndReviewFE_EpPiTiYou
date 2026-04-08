import { create } from 'zustand'
import { supabase } from '../lib/supabase'

const ADMIN_EMAILS = ['hungtrantien1808@gmail.com'] // Add admin emails here

export const useAuthStore = create((set, get) => ({
  user: null,         // Supabase user object
  profile: null,      // { display_name, avatar_url, role }
  isGuest: false,
  isLoading: true,
  
  // Computed
  isLoggedIn: () => !!get().user,
  isAdmin: () => {
    const u = get().user
    if (!u) return false
    return ADMIN_EMAILS.includes(u.email?.toLowerCase())
  },
  getDisplayName: () => {
    const { user, profile, isGuest } = get()
    if (isGuest) return 'Guest'
    if (profile?.display_name) return profile.display_name
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name
    if (user?.email) return user.email.split('@')[0]
    return 'User'
  },
  getAvatarUrl: () => {
    const { user, profile } = get()
    if (profile?.avatar_url) return profile.avatar_url
    if (user?.user_metadata?.avatar_url) return user.user_metadata.avatar_url
    return null
  },

  // --- Actions ---
  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        set({ user: session.user, isGuest: false, isLoading: false })
        // Load or create profile
        await get().loadProfile(session.user.id)
      } else {
        set({ isLoading: false })
      }

      // Listen for auth state changes (e.g. tab focus, token refresh)
      supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          set({ user: session.user, isGuest: false })
        } else {
          set({ user: null, profile: null, isGuest: false })
        }
      })
    } catch (e) {
      console.error('Auth init failed:', e)
      set({ isLoading: false })
    }
  },

  signInWithGoogle: async () => {
    // Always redirect to the production domain, NOT preview deployments
    const PRODUCTION_URL = 'https://edufuhung.vercel.app'
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    const redirectUrl = isLocalhost ? window.location.origin : PRODUCTION_URL

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl
      }
    })
    if (error) {
      console.error('Google sign in failed:', error)
      return false
    }
    return true
  },

  continueAsGuest: () => {
    set({ isGuest: true, user: null, profile: null, isLoading: false })
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, profile: null, isGuest: false })
    // Clear local storage for guest-like clean state
    localStorage.removeItem('edufu-storage')
    window.location.reload()
  },

  loadProfile: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, create one
        const user = get().user
        const newProfile = {
          id: userId,
          display_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User',
          avatar_url: user?.user_metadata?.avatar_url || null,
          role: ADMIN_EMAILS.includes(user?.email?.toLowerCase()) ? 'admin' : 'student'
        }
        await supabase.from('user_profiles').insert(newProfile)
        set({ profile: newProfile })
      } else if (data) {
        set({ profile: data })
      }
    } catch (e) {
      console.warn('Could not load profile:', e)
    }
  },

  // --- Cloud History ---
  saveExamToCloud: async (result) => {
    const user = get().user
    if (!user) return // Guest: don't save to cloud

    try {
      await supabase.from('exam_history').insert({
        user_id: user.id,
        subject: result.subject,
        score: result.score,
        correct: result.correct,
        total: result.total,
        time_spent: result.timeSpent,
        details: result
      })
    } catch (e) {
      console.warn('Could not save exam to cloud:', e)
    }
  },

  loadExamHistory: async () => {
    const user = get().user
    if (!user) return []

    try {
      const { data, error } = await supabase
        .from('exam_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return data || []
    } catch (e) {
      console.warn('Could not load exam history:', e)
      return []
    }
  },

  saveBookmarkToCloud: async (qId, action) => {
    const user = get().user
    if (!user) return

    try {
      if (action === 'add') {
        await supabase.from('bookmarks').insert({ user_id: user.id, question_id: qId })
      } else {
        await supabase.from('bookmarks').delete().eq('user_id', user.id).eq('question_id', qId)
      }
    } catch (e) {
      console.warn('Bookmark cloud sync failed:', e)
    }
  },

  loadBookmarks: async () => {
    const user = get().user
    if (!user) return []

    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('question_id, created_at')
        .eq('user_id', user.id)

      if (error) throw error
      return (data || []).map(b => ({ id: b.question_id, date: b.created_at }))
    } catch (e) {
      console.warn('Could not load bookmarks:', e)
      return []
    }
  }
}))
