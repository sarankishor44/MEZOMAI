import { create } from 'zustand'

const readJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) ?? fallback
  } catch {
    localStorage.removeItem(key)
    return fallback
  }
}

const readJsonArray = (key) => {
  const value = readJson(key, [])
  return Array.isArray(value) ? value : []
}

export const useStore = create((set, get) => ({
  // ── THEME ─────────────────────────────────────
  theme: localStorage.getItem('aria_theme_mode') || 'dark',
  setTheme: (theme) => {
    localStorage.setItem('aria_theme_mode', theme);
    document.documentElement.setAttribute('data-theme', theme);
    set({ theme });
  },
  toggleTheme: () => {
    const nextTheme = get().theme === 'light' ? 'dark' : 'light';
    get().setTheme(nextTheme);
  },

  // ── AUTH ──────────────────────────────────────
  user: readJson('aria_user', null),
  token: localStorage.getItem('aria_token') || null,
  setUser: (user) => {
    if (user) {
      localStorage.setItem('aria_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('aria_user');
    }
    set({ user });
  },
  setToken: (token) => {
    if (token) {
      localStorage.setItem('aria_token', token);
    } else {
      localStorage.removeItem('aria_token');
    }
    set({ token });
  },
  logout: () => {
    localStorage.removeItem('aria_token');
    localStorage.removeItem('aria_user');
    set({ user: null, token: null });
  },

  // ── NAVIGATION ────────────────────────────────
  page: 'dashboard',
  setPage: (page) => set({ page }),

  // ── AVATAR STATE ──────────────────────────────
  avatarState: 'idle',   // idle | listening | thinking | talking
  setAvatarState: (s) => set({ avatarState: s }),

  // ── CHAT ──────────────────────────────────────
  sessions: readJsonArray('aria_sessions').length ? readJsonArray('aria_sessions') : [
    { id: 'default', title: 'Default Session', personality: 'friendly', message_count: 0, token_count: 0 }
  ],
  activeSession: 'default',
  messages: readJsonArray('aria_messages_default'),
  addMessage: (msg) => {
    const active = get().activeSession || 'default';
    const updatedMessages = [...get().messages, msg];
    localStorage.setItem(`aria_messages_${active}`, JSON.stringify(updatedMessages));
    set({ messages: updatedMessages });
  },
  setMessages: (messages) => {
    const active = get().activeSession || 'default';
    localStorage.setItem(`aria_messages_${active}`, JSON.stringify(messages));
    set({ messages });
  },
  setActiveSession: (sessionId) => {
    const saved = readJsonArray(`aria_messages_${sessionId}`);
    set({ activeSession: sessionId, messages: saved });
  },
  clearHistory: () => {
    const active = get().activeSession || 'default';
    localStorage.removeItem(`aria_messages_${active}`);
    set({ messages: [] });
  },

  // ── SETTINGS ──────────────────────────────────
  settings: readJson('aria_settings', {
    apiKey: '',
    openAiKey: '',
    geminiKey: '',
    elevenLabsKey: '',
    dailyKey: '',
    activeProvider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    avatarName: 'ARIA',
    avatarStyle: 'gold',
    avatarGender: 'female',
    personality: 'friendly',
    systemPrompt: 'You are ARIA, a helpful and intelligent AI assistant. Speak in a concise, conversational tone.',
    voiceName: 'Rachel',
    voiceSpeed: 1.0,
    voicePitch: 1.0,
  }),
  updateSettings: (patch) => set((s) => {
    const updated = { ...s.settings, ...patch };
    localStorage.setItem('aria_settings', JSON.stringify(updated));
    return { settings: updated };
  }),

  // ── MEETING ───────────────────────────────────
  meetingState: 'configure',  // configure | incall | postcall
  activeRoom: null,
  transcript: [],
  meetingNotes: null,
  recentMeetings: readJsonArray('aria_recent_meetings'),
  setMeetingState: (s) => set({ meetingState: s }),
  addTranscriptLine: (line) => {
    const updated = [...get().transcript, line];
    set({ transcript: updated });
  },
  setMeetingNotes: (notes) => set({ meetingNotes: notes }),
  saveRecentMeeting: (meeting) => set((s) => {
    const existing = Array.isArray(s.recentMeetings) ? s.recentMeetings : [];
    const updated = [meeting, ...existing].slice(0, 10);
    localStorage.setItem('aria_recent_meetings', JSON.stringify(updated));
    return { recentMeetings: updated };
  }),

  // ── ANALYTICS ─────────────────────────────────
  analytics: readJson('aria_analytics', {
    totalMessages: 124,
    totalMeetings: 8,
    totalTokens: 48500,
    totalCost: 0.74,
  }),
  setAnalytics: (data) => {
    localStorage.setItem('aria_analytics', JSON.stringify(data));
    set({ analytics: data });
  },
}))
