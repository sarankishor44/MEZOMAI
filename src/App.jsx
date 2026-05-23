import React, { useEffect, useState } from 'react'
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

export default function App() {
  const { page, token, theme, setUser, updateSettings } = useStore()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Apply theme class to document root for CSS variables
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    if (!token || token.startsWith('demo_')) return
    phpApi.get('/auth/user')
      .then(({ data }) => {
        setUser(data.user)
        updateSettings({
          avatarName: data.user.avatar_name,
          avatarStyle: data.user.avatar_style,
          avatarGender: data.user.avatar_gender || 'female',
          personality: data.user.personality,
          model: data.user.model,
          systemPrompt: data.user.system_prompt,
          voiceName: data.user.voice_name,
          voiceSpeed: Number(data.user.voice_speed || 1),
          voicePitch: Number(data.user.voice_pitch || 1),
          activeProvider: data.user.active_provider || 'anthropic',
        })
      })
      .catch(() => {})
  }, [token, setUser, updateSettings])

  // Login Gate
  if (!token) {
    return <LoginPage />
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--bg)' }}>
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(v => !v)} />
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
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
