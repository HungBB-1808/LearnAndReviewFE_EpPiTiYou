import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const formatQuestionText = (text) => {
    if (!text) return "";
    let clean = text.replace(/^.*?and\s*[_]+\s*(?:n?swer)?\s*\|?\s*\|?\s*/i, '').trim();
    return clean.length > 0 ? clean : text;
}

const generateHash = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return 'Q_' + Math.abs(hash).toString(16);
}

export const useAppStore = create(
  persist(
    (set, get) => ({
      // --- Data DB ---
      questionDB: {}, // the master loaded JSON
      isDataLoaded: false,

      loadInitialData: async () => {
        if (get().isDataLoaded && Object.keys(get().questionDB).length > 0) return;
        try {
            const response = await fetch('/FE_Data_IOT102_Final.json');
            const rawData = await response.json();
            
            const cleanData = {};
            Object.keys(rawData).forEach(key => {
                cleanData[key] = rawData[key].map(q => ({
                    ...q,
                    questionTextCleaned: formatQuestionText(q.question) || q.question,
                    id: generateHash(q.question)
                }));
            });
            set({ questionDB: cleanData, isDataLoaded: true });
        } catch (e) {
            console.error("Failed to load initial JSON:", e);
        }
      },

      // --- Selectors for Data ---
      getUniqueSubjects: () => {
          const subjects = new Set();
          Object.keys(get().questionDB).forEach(k => {
              const match = k.match(/^([a-z0-9]+)-/i);
              if (match) subjects.add(match[1].toUpperCase());
              else subjects.add(k.toUpperCase()); 
          });
          return Array.from(subjects);
      },
      getSemestersForSubject: (subjectPrefix) => {
          const terms = new Set();
          Object.keys(get().questionDB).forEach(k => {
              if (k.toLowerCase().startsWith(subjectPrefix.toLowerCase())) {
                  const match = k.match(new RegExp(`^${subjectPrefix}-([a-z0-9\\-]+)-fe`, 'i')) || k.match(new RegExp(`^${subjectPrefix}-([a-z0-9\\-]+)`, 'i'));
                  if (match && match[1]) terms.add(match[1].toUpperCase());
              }
          });
          return Array.from(terms);
      },
      getAllQuestionsForSubject: (subjectPrefix) => {
          let results = [];
          Object.entries(get().questionDB).forEach(([key, qList]) => {
              if (key.toLowerCase().startsWith(subjectPrefix.toLowerCase())) {
                  results = results.concat(qList);
              }
          });
          return results;
      },
      getQuestionsByKey: (key) => get().questionDB[key] || [],
      getQuestionById: (id) => {
          for (const key in get().questionDB) {
              const q = get().questionDB[key].find(x => x.id === id);
              if (q) return q;
          }
          return null;
      },
      getCorrectAnswerFor: (id) => {
        const q = get().getQuestionById(id);
        if(!q) return ['A'];
        if(q.answer) {
            const ansStr = Array.isArray(q.answer) ? q.answer[0] : q.answer;
            if (ansStr) return ansStr.split(',').map(s => s.trim().toUpperCase());
        }
        return ['A']; // Fallback like vanilla
      },
      
      // --- Admin / Editors ---
      updateQuestion: (qId, newText) => {
        set(state => {
            const db = { ...state.questionDB };
            for(let k in db) {
                const idx = db[k].findIndex(q => q.id === qId);
                if(idx !== -1) {
                    const newArray = [...db[k]];
                    newArray[idx] = { ...newArray[idx], question: newText, questionTextCleaned: formatQuestionText(newText) };
                    db[k] = newArray;
                    break;
                }
            }
            return { questionDB: db };
        });
      },
      updateAnswer: (qId, newAnswer) => {
        set(state => {
            const db = { ...state.questionDB };
            for(let k in db) {
                const idx = db[k].findIndex(q => q.id === qId);
                if(idx !== -1) {
                    const newArray = [...db[k]];
                    newArray[idx] = { ...newArray[idx], answer: [newAnswer.toUpperCase()] };
                    db[k] = newArray;
                    break;
                }
            }
            return { questionDB: db };
        });
      },

      // --- User State ---
      selectedSubject: null,
      isAdmin: false,
      examSettings: { timeLimit: 30, questionCount: 40 },
      bookmarks: [],
      examHistory: [],
      lockedSubjects: [],

      setSelectedSubject: (sub) => set({ selectedSubject: sub }),
      setIsAdmin: (val) => set({ isAdmin: val }),
      setExamSettings: (settings) => set({ examSettings: settings }),
      
      toggleBookmark: (qId) => set(state => {
          const exists = state.bookmarks.some(b => b.id === qId);
          if (exists) return { bookmarks: state.bookmarks.filter(b => b.id !== qId) };
          return { bookmarks: [...state.bookmarks, { id: qId, date: new Date().toISOString() }] };
      }),
      isBookmarked: (qId) => get().bookmarks.some(b => b.id === qId),
      
      saveExamResult: (result) => set(state => ({
          examHistory: [...state.examHistory, { ...result, date: new Date().toISOString(), subject: state.selectedSubject }]
      })),

      toggleSubjectLock: (subject) => set(state => {
          const lk = [...state.lockedSubjects];
          if(lk.includes(subject)) return { lockedSubjects: lk.filter(s => s !== subject) };
          return { lockedSubjects: [...lk, subject] };
      }),
      isSubjectLocked: (subject) => get().lockedSubjects.includes(subject),

      // --- Active Exam / Session State ---
      activeSession: null, // { mode: 'exam' | 'practice' | 'study', questions: [], answers: {}, currentIndex: 0, timeSpent: 0 }
      startSession: (mode, questions) => set({
          activeSession: { mode, questions, answers: {}, currentIndex: 0, timeSpent: 0 }
      }),
      updateSessionIndex: (index) => set(state => ({
          activeSession: { ...state.activeSession, currentIndex: index }
      })),
      updateSessionAnswer: (index, ans) => set(state => ({
          activeSession: {
              ...state.activeSession,
              answers: { ...state.activeSession.answers, [index]: ans }
          }
      })),
      updateSessionTime: (time) => set(state => ({
          activeSession: { ...state.activeSession, timeSpent: time }
      })),
      clearSession: () => set({ activeSession: null })

    }),
    {
      name: 'eduglass-storage',
      partialize: (state) => ({ 
          selectedSubject: state.selectedSubject,
          isAdmin: state.isAdmin,
          examSettings: state.examSettings,
          bookmarks: state.bookmarks,
          examHistory: state.examHistory,
          lockedSubjects: state.lockedSubjects,
          questionDB: state.questionDB,
          isDataLoaded: state.isDataLoaded,
          activeSession: state.activeSession // so if they refresh during exam, it persists!
      }),
    }
  )
)
