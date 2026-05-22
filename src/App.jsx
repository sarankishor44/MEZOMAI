import React, { useEffect } from 'react'
import { useStore } from './store'
import Sidebar from './components/layout/Sidebar'
import DashboardPage from './pages/DashboardPage'
import ChatPage from './pages/ChatPage'
import CodePage from './pages/CodePage'
import MeetingsPage from './pages/MeetingsPage'
import AnalyticsPage from './pages/AnalyticsPage'
import SettingsPage from './pages/SettingsPage'
import DeploymentChecklistPage from './pages/DeploymentChecklistPage'
import LoginPage from './pages/LoginPage'

export default function App() {
  const { page, token, theme } = useStore()

  // Apply theme class to document root for CSS variables
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // Login Gate
  if (!token) {
    return <LoginPage />
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--bg)' }}>
      <Sidebar />
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {page === 'dashboard'  && <DashboardPage />}
        {page === 'chat'       && <ChatPage />}
        {page === 'code'       && <CodePage />}
        {page === 'meetings'   && <MeetingsPage />}
        {page === 'analytics'  && <AnalyticsPage />}
        {page === 'deployment' && <DeploymentChecklistPage />}
        {page === 'settings'   && <SettingsPage />}
      </main>
    </div>
  )
}
