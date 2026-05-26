import React, { useEffect } from 'react'
import { useStore } from './store'
import Sidebar from './components/layout/Sidebar'
import DashboardPage from './pages/DashboardPage'
import ChatPage from './pages/ChatPage'
import CodePage from './pages/CodePage'
import MeetingsPage from './pages/MeetingsPage'
import AnalyticsPage from './pages/AnalyticsPage'
import SettingsPage from './pages/SettingsPage'
import LoginPage from './pages/LoginPage'
import { phpApi } from './utils/api'
import { isSupabaseConfigured } from './utils/supabase'
import { hydrateSupabaseAuth } from './utils/supabaseBackend'

export default function App() {
  const { page, token, theme, setUser, updateSettings } = useStore()

  // Apply theme class to document root for CSS variables
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    if (token?.startsWith('supabase:')) {
      hydrateSupabaseAuth()
        .then((data) => {
          if (!data) return
          setUser(data.user)
          updateSettings(userToSettings(data.user))
        })
        .catch(() => {})
      return
    }
    if (!token && isSupabaseConfigured) {
      hydrateSupabaseAuth()
        .then((data) => {
          if (!data) return
          useStore.getState().setToken(data.token)
          setUser(data.user)
          updateSettings(userToSettings(data.user))
        })
        .catch(() => {})
      return
    }
    if (!token || token.startsWith('demo_')) return
    phpApi.get('/auth/user')
      .then(({ data }) => {
        if (!data?.user) throw new Error('PHP auth endpoint did not return a user.')
        setUser(data.user)
        updateSettings(userToSettings(data.user))
      })
      .catch(() => {})
  }, [token, setUser, updateSettings])

  // Login Gate
  if (!token) {
    return <LoginPage />
  }

  return (
    <div className="ios-shell">
      <Sidebar />
      <main className="ios-app-window">
        {page === 'dashboard'  && <DashboardPage />}
        {page === 'chat'       && <ChatPage />}
        {page === 'code'       && <CodePage />}
        {page === 'meetings'   && <MeetingsPage />}
        {page === 'analytics'  && <AnalyticsPage />}
        {page === 'settings'   && <SettingsPage />}
      </main>
    </div>
  )
}

function userToSettings(user = {}) {
  return {
    avatarName: user.avatar_name || user.avatarName || 'ARIA',
    avatarStyle: user.avatar_style || user.avatarStyle || 'gold',
    avatarGender: user.avatar_gender || user.avatarGender || 'female',
    personality: user.personality || 'friendly',
    model: user.model || 'claude-3-5-sonnet-20241022',
    systemPrompt: user.system_prompt || user.systemPrompt || undefined,
    voiceName: user.voice_name || user.voiceName || 'Rachel',
    voiceSpeed: Number(user.voice_speed || user.voiceSpeed || 1),
    voicePitch: Number(user.voice_pitch || user.voicePitch || 1),
    activeProvider: user.active_provider || user.activeProvider || 'anthropic',
  }
}
