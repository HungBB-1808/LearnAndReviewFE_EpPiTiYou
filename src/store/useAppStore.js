import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../lib/supabase'

// We import useAuthStore at the TOP level - no dynamic import needed.
// This is safe because useAuthStore has no dependency on useAppStore.
import { useAuthStore } from './useAuthStore'

const formatQuestionText = (text) => {
    if (!text) return "";
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
      // ============================================
      // DATA: Question Database
      // ============================================
      questionDB: {},
      isDataLoaded: false,

      // --- Cloud Sync (Supabase) ---
      syncToCloud: async () => {
        try {
            const isAdmin = useAuthStore.getState().isAdmin();
            if (!isAdmin) {
                console.error("syncToCloud: Not an admin. Aborting.");
                return false;
            }

            const db = get().questionDB;
            if (!db || Object.keys(db).length === 0) {
                console.warn("syncToCloud: questionDB is empty. Nothing to sync.");
                return false;
            }

            const uniquePayload = new Map();
            
            Object.entries(db).forEach(([key, qList]) => {
                if (!Array.isArray(qList)) return;
                qList.forEach(q => {
                    if (q && q.id) {
                        uniquePayload.set(q.id.toLowerCase(), {
                            id: q.id,
                            parent_key: key,
                            content: q
                        });
                    }
                });
            });

            const allPayloads = Array.from(uniquePayload.values());
            console.log(`syncToCloud: Syncing ${allPayloads.length} unique questions...`);

            if (allPayloads.length === 0) {
                console.warn("syncToCloud: No valid questions found.");
                return false;
            }

            // Batch processing (100 per request) to prevent 500 errors
            const CHUNK_SIZE = 100;
            let successCount = 0;
            for (let i = 0; i < allPayloads.length; i += CHUNK_SIZE) {
                const chunk = allPayloads.slice(i, i + CHUNK_SIZE);
                const { error } = await supabase
                    .from('questions')
                    .upsert(chunk, { onConflict: 'id' });
                
                if (error) {
                    console.error(`syncToCloud: Chunk ${Math.floor(i/CHUNK_SIZE) + 1} failed:`, error);
                    throw error;
                }
                successCount += chunk.length;
                console.log(`syncToCloud: ${successCount}/${allPayloads.length} synced...`);
            }

            console.log("syncToCloud: Complete!");
            return true;
        } catch (e) {
            console.error("syncToCloud: FAILED:", e.message || e);
            return false;
        }
      },

      loadFromCloud: async () => {
        try {
            const { data, error } = await supabase
                .from('questions')
                .select('*');
            
            if (error) throw error;
            if (!data || data.length === 0) return null;

            const newDB = {};
            data.forEach(row => {
                if (!newDB[row.parent_key]) newDB[row.parent_key] = [];
                newDB[row.parent_key].push(row.content);
            });
            return newDB;
        } catch (e) {
            console.warn("loadFromCloud: Failed, will use local files:", e.message || e);
            return null;
        }
      },

      loadInitialData: async () => {
        try {
            // Step 1: Always load static JSON files first (the full base database)
            const files = [
                `/FE_Data_IOT102_Final.json?v=${Date.now()}`,
                `/FE_Data_SSG104_Final.json?v=${Date.now()}`
            ];
            const baseDB = {};

            for (const file of files) {
                try {
                    const response = await fetch(file);
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    const rawData = await response.json();
                    
                    Object.keys(rawData).forEach(key => {
                        baseDB[key] = rawData[key].map(q => {
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
                    console.warn(`loadInitialData: Could not load ${file}:`, err.message);
                }
            }

            // Step 2: Try to fetch cloud edits to merge on top
            let cloudDB = null;
            try {
                cloudDB = await get().loadFromCloud();
            } catch (e) {
                console.warn("loadInitialData: Cloud load failed, using base only.");
            }
            
            // Step 3: Merge - base first, cloud edits override by question ID
            const finalDB = { ...baseDB };
            
            if (cloudDB) {
                Object.keys(cloudDB).forEach(key => {
                    if (!finalDB[key]) {
                        // Entirely new key from cloud
                        finalDB[key] = cloudDB[key];
                    } else {
                        // Merge: cloud versions win for matching IDs
                        const cloudMap = new Map(cloudDB[key].map(q => [q.id, q]));
                        finalDB[key] = finalDB[key].map(baseQ => {
                            return cloudMap.has(baseQ.id) ? cloudMap.get(baseQ.id) : baseQ;
                        });
                        // Add new questions from cloud that aren't in base
                        const baseIds = new Set(finalDB[key].map(q => q.id));
                        cloudDB[key].forEach(cloudQ => {
                            if (!baseIds.has(cloudQ.id)) finalDB[key].push(cloudQ);
                        });
                    }
                });
                console.log("loadInitialData: Merged cloud edits with base database.");
            } else {
                console.log("loadInitialData: Using base JSON files only.");
            }

            set({ questionDB: finalDB, isDataLoaded: true });
        } catch (e) {
            console.error("loadInitialData: FAILED:", e);
            // Fallback: at least mark as loaded so UI doesn't hang
            set({ isDataLoaded: true });
        }
      },

      // ============================================
      // SELECTORS: Data Access
      // ============================================
      getUniqueSubjects: () => {
          const subjects = new Set();
          const db = get().questionDB;
          if (!db) return [];
          Object.keys(db).forEach(k => {
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
                  terms.add(k);
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
            const ansRaw = Array.isArray(q.answer) ? q.answer.join(',') : q.answer;
            if (ansRaw) return ansRaw.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
        }
        return ['A'];
      },
      
      // ============================================
      // ADMIN: Edit Operations
      // ============================================
      updateQuestion: async (qId, newText) => {
        let parentKey = null;
        let localQ = null;
        
        set(state => {
            const db = { ...state.questionDB };
            for(let k in db) {
                const idx = db[k].findIndex(q => q.id === qId);
                if(idx !== -1) {
                    parentKey = k;
                    db[k][idx] = { ...db[k][idx], question: newText, questionTextCleaned: newText };
                    localQ = db[k][idx];
                    break;
                }
            }
            return { questionDB: db };
        });

        // Cloud Push for admin
        if (useAuthStore.getState().isAdmin() && parentKey && localQ) {
            try {
                await supabase.from('questions').upsert({ id: qId, parent_key: parentKey, content: localQ });
            } catch(e) { console.warn("Cloud push failed for updateQuestion:", e); }
        }
      },
      updateAnswer: async (qId, newAnswer) => {
        let parentKey = null;
        let localQ = null;
        
        set(state => {
            const db = { ...state.questionDB };
            for(let k in db) {
                const idx = db[k].findIndex(q => q.id === qId);
                if(idx !== -1) {
                    parentKey = k;
                    const ansArray = newAnswer.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
                    db[k][idx] = { ...db[k][idx], answer: ansArray };
                    localQ = db[k][idx];
                    break;
                }
            }
            return { questionDB: db };
        });

        if (useAuthStore.getState().isAdmin() && parentKey && localQ) {
            try {
                await supabase.from('questions').upsert({ id: qId, parent_key: parentKey, content: localQ });
            } catch(e) { console.warn("Cloud push failed for updateAnswer:", e); }
        }
      },
      updateOption: async (qId, optKey, newText) => {
          let parentKey = null;
          let localQ = null;
          
          set(state => {
              const db = { ...state.questionDB };
              for(let k in db) {
                  const idx = db[k].findIndex(q => q.id === qId);
                  if (idx !== -1) {
                      parentKey = k;
                      db[k][idx] = { 
                          ...db[k][idx], 
                          options: { ...db[k][idx].options, [optKey]: newText } 
                      };
                      localQ = db[k][idx];
                      break;
                  }
              }
              return { questionDB: db };
          });

          if (useAuthStore.getState().isAdmin() && parentKey && localQ) {
              try {
                  await supabase.from('questions').upsert({ id: qId, parent_key: parentKey, content: localQ });
              } catch(e) { console.warn("Cloud push failed for updateOption:", e); }
          }
      },

      // ============================================
      // USER STATE
      // ============================================
      selectedSubject: null,
      examSettings: { timeLimit: 30, questionCount: 40 },
      bookmarks: [],
      examHistory: [],
      lockedSubjects: [],

      setSelectedSubject: (sub) => set({ selectedSubject: sub }),
      setExamSettings: (settings) => set({ examSettings: settings }),
      
      toggleBookmark: (qId) => {
          const exists = get().bookmarks.some(b => b.id === qId);
          const action = exists ? 'remove' : 'add';
          
          set(state => {
              if (exists) return { bookmarks: state.bookmarks.filter(b => b.id !== qId) };
              return { bookmarks: [...state.bookmarks, { id: qId, date: new Date().toISOString() }] };
          });

          // Cloud sync for logged-in users (fire and forget)
          try {
              useAuthStore.getState().saveBookmarkToCloud(qId, action);
          } catch(e) {}
      },
      isBookmarked: (qId) => get().bookmarks.some(b => b.id === qId),
      
      saveExamResult: (result) => {
          const fullResult = { ...result, date: new Date().toISOString(), subject: get().selectedSubject };
          set(state => ({
              examHistory: [...state.examHistory, fullResult]
          }));

          // Cloud sync for logged-in users (fire and forget)
          try {
              useAuthStore.getState().saveExamToCloud(fullResult);
          } catch(e) {}
      },

      toggleSubjectLock: (subject) => set(state => {
          const lk = [...state.lockedSubjects];
          if(lk.includes(subject)) return { lockedSubjects: lk.filter(s => s !== subject) };
          return { lockedSubjects: [...lk, subject] };
      }),
      isSubjectLocked: (subject) => get().lockedSubjects.includes(subject),

      // ============================================
      // EXAM SESSION STATE
      // ============================================
      activeSession: null,
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
          
          const currParts = currAns.split(',').filter(Boolean);
          let nextAns = "";
          
          if (ans === "LOCKED") {
              nextAns = currAns || " ";
          } else if (corrects.length > 1 || currParts.length > 1 || (currParts.length === 1 && currParts[0] !== ans && corrects.some(c => c === ans && c !== currParts[0]))) {
              if (currParts.includes(ans)) {
                  nextAns = currParts.filter(p => p !== ans).sort().join(',');
              } else {
                  nextAns = [...currParts, ans].sort().join(',');
              }
          } else {
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
      clearSession: () => set({ activeSession: null })

    }),
    {
      name: 'edufu-storage',
      partialize: (state) => ({ 
          selectedSubject: state.selectedSubject,
          examSettings: state.examSettings,
          bookmarks: state.bookmarks,
          examHistory: state.examHistory,
          lockedSubjects: state.lockedSubjects,
          questionDB: state.questionDB,
          isDataLoaded: state.isDataLoaded,
          activeSession: state.activeSession
      }),
    }
  )
)
