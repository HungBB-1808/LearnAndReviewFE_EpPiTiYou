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
        // Force reload to pick up new files or changes
        try {
            const files = ['/FE_Data_IOT102_Final.json', '/FE_Data_SSG104_Final.json'];
            const allCleanData = {};

            for (const file of files) {
                try {
                    const response = await fetch(file);
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    const rawData = await response.json();
                    
                    Object.keys(rawData).forEach(key => {
                        allCleanData[key] = rawData[key].map(q => ({
                            ...q,
                            questionTextCleaned: formatQuestionText(q.question) || q.question,
                            id: generateHash(q.question)
                        }));
                    });
                } catch (err) {
                    console.warn(`Could not load ${file}:`, err);
                }
            }
            
            // Merge with existing questionDB to preserve possible admin edits 
            // but prioritize fresh loads for new subjects
            set(state => ({ 
                questionDB: { ...allCleanData, ...state.questionDB }, 
                isDataLoaded: true 
            }));
        } catch (e) {
            console.error("Failed to load initial JSON:", e);
        }
      },

      // --- Selectors for Data ---
      getUniqueSubjects: () => {
          const subjects = new Set();
          Object.keys(get().questionDB).forEach(k => {
              const match = k.match(/^([a-z]{3}\d{3})/i);
              const base = match ? match[1].toUpperCase() : k.split('-')[0].trim().toUpperCase();
              if (base) subjects.add(base);
          });
          return Array.from(subjects);
      },
      getSemestersForSubject: (subjectPrefix) => {
          const terms = new Set();
          Object.keys(get().questionDB).forEach(k => {
              const match = k.match(/^([a-z]{3}\d{3})/i);
              const base = match ? match[1].toUpperCase() : k.split('-')[0].trim().toUpperCase();
              if (base === subjectPrefix.toUpperCase()) {
                  terms.add(k); // We now keep the full original key as the "semester" indentifier
              }
          });
          return Array.from(terms);
      },
      getAllQuestionsForSubject: (subjectPrefix) => {
          let results = [];
          Object.entries(get().questionDB).forEach(([key, qList]) => {
              const match = key.match(/^([a-z]{3}\d{3})/i);
              const base = match ? match[1].toUpperCase() : key.split('-')[0].trim().toUpperCase();
              if (base === subjectPrefix.toUpperCase()) {
                  results = results.concat(qList.map(q => ({...q, parentKey: key})));
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
      clearSession: () => set({ activeSession: null }),
      userLogout: () => set(state => ({
          bookmarks: [],
          examHistory: [],
          activeSession: null,
          isAdmin: false,
          selectedSubject: null
      }))

    }),
    {
      name: 'edufu-storage',
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
