import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const formatQuestionText = (text) => {
    if (!text) return "";
    // Remove "Kizspy |" and typical OCR garbage
    let clean = text.replace(/Kizspy\s*\|\s*/gi, '')
                    .replace(/^.*?and\s*[_]+\s*(?:n?swer)?\s*\|?\s*\|?\s*/i, '')
                    .trim();
    return clean;
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
            const files = [`/FE_Data_IOT102_Final.json?v=${Date.now()}`, `/FE_Data_SSG104_Final.json?v=${Date.now()}`];
            const allCleanData = {};

            for (const file of files) {
                try {
                    const response = await fetch(file);
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    const rawData = await response.json();
                    
                    Object.keys(rawData).forEach(key => {
                        allCleanData[key] = rawData[key].map(q => {
                            const cleaned = formatQuestionText(q.question);
                            return {
                                ...q,
                                question: cleaned,
                                questionTextCleaned: cleaned,
                                id: generateHash(q.question)
                            };
                        });
                    });
                } catch (err) {
                    console.warn(`Could not load ${file}:`, err);
                }
            }
            
            // Merge with existing questionDB to preserve admin edits
            // We put state.questionDB on the RIGHT so user edits win
            set(state => {
                const combined = { ...allCleanData, ...state.questionDB };
                // Also clean any leftover Kizspy markers in the existing state
                Object.keys(combined).forEach(k => {
                    combined[k] = combined[k].map(q => {
                        const txt = formatQuestionText(q.question);
                        return { ...q, question: txt, questionTextCleaned: txt };
                    });
                });
                return { questionDB: combined, isDataLoaded: true };
            });
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
                    db[k][idx] = { ...db[k][idx], question: newText, questionTextCleaned: newText };
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
                    const ansArray = newAnswer.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
                    db[k][idx] = { ...db[k][idx], answer: ansArray };
                    break;
                }
            }
            return { questionDB: db };
        });
      },
      updateOption: (qId, optKey, newText) => {
          set(state => {
              const db = { ...state.questionDB };
              for(let k in db) {
                  const idx = db[k].findIndex(q => q.id === qId);
                  if (idx !== -1) {
                      db[k][idx] = { 
                          ...db[k][idx], 
                          options: { ...db[k][idx].options, [optKey]: newText } 
                      };
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
      updateSessionAnswer: (index, ans) => set(state => {
          if (!state.activeSession) return state;
          const currAns = state.activeSession.answers[index] || "";
          const q = state.activeSession.questions[index];
          const corrects = get().getCorrectAnswerFor(q.id);
          
          let nextAns = "";
          if (ans === "LOCKED") {
              // Lock current selection
              nextAns = currAns || " "; // Space means answered but empty (all wrong)
          } else if (corrects.length > 1) {
              // Multiple choice toggle
              const parts = currAns.split(',').filter(Boolean);
              if (parts.includes(ans)) {
                  nextAns = parts.filter(p => p !== ans).sort().join(',');
              } else {
                  nextAns = [...parts, ans].sort().join(',');
              }
          } else {
              // Single choice
              nextAns = ans;
          }

          return {
              activeSession: {
                  ...state.activeSession,
                  answers: { ...state.activeSession.answers, [index]: nextAns }
              }
          };
      }),
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
