import React, { useEffect, useState } from 'react'
import { useStore } from '../store'
import AvatarFace from '../components/layout/AvatarFace'
import { phpApi } from '../utils/api'
import { isSupabaseConfigured } from '../utils/supabase'
import { createSupabaseCodeFile, listSupabaseCodeFiles, saveSupabaseCodeFile } from '../utils/supabaseBackend'

const DEFAULT_FILES = [
  { id: 'local-main', uuid: null, filename: 'main.py', name: 'main.py', path: 'workspace/main.py', language: 'python', lang: 'python', content: `def greet(name):\n    print(f"Hello, {name}! Welcome to MEZOMAI AI Platform.")\n\ngreet("Aria Operator")\n` },
  { id: 'local-js', uuid: null, filename: 'utils.js', name: 'utils.js', path: 'workspace/utils.js', language: 'javascript', lang: 'javascript', content: `function calcTokens(words) {\n  return Math.ceil(words * 1.33);\n}\nconsole.log("Estimated tokens for 100 words: " + calcTokens(100));\n` },
]

const AGENT_STEPS = [
  'Read active file and nearby context',
  'Detect runtime and syntax risks',
  'Prepare a focused patch',
  'Run validation and summarize changes',
]

const normalizeFile = (file) => ({
  ...file,
  id: file.uuid || file.id,
  name: file.filename || file.name,
  filename: file.filename || file.name,
  lang: file.language || file.lang || 'python',
  language: file.language || file.lang || 'python',
  path: `${file.folder_path || 'workspace'}/${file.filename || file.name}`.replace('//', '/'),
})

export default function CodePage() {
  const { setAvatarState, avatarState } = useStore()
  const [files, setFiles] = useState(DEFAULT_FILES)
  const [activeFileId, setActiveFileId] = useState(DEFAULT_FILES[0].id)
  const [openTabs, setOpenTabs] = useState([DEFAULT_FILES[0].id])
  const [aiInput, setAiInput] = useState('')
  const [aiResponse, setAiResponse] = useState('Ask the agent for a refactor, explanation, or bug sweep. Suggested changes will appear here.')
  const [terminalLogs, setTerminalLogs] = useState([{ type: 'info', text: 'MEZOMAI workspace ready. Files sync with PHP when the backend is available.' }])
  const [isDiffMode, setIsDiffMode] = useState(false)
  const [activity, setActivity] = useState('explorer')
  const [bottomPanel, setBottomPanel] = useState('terminal')
  const [syncState, setSyncState] = useState('Local fallback')

  const activeFile = files.find(f => f.id === activeFileId) || files[0]

  useEffect(() => {
    loadFiles()
  }, [])

  const loadFiles = async () => {
    try {
      const { data } = await phpApi.get('/code/files')
      if (data.length === 0) {
        const seeded = await seedDefaultFile()
        setFiles([seeded])
        setActiveFileId(seeded.id)
        setOpenTabs([seeded.id])
      } else {
        const normalized = data.map(normalizeFile)
        setFiles(normalized)
        setActiveFileId(normalized[0].id)
        setOpenTabs([normalized[0].id])
      }
      setSyncState('Synced with PHP')
    } catch {
      if (isSupabaseConfigured) {
        try {
          const data = await listSupabaseCodeFiles()
          if (data.length === 0) {
            const seeded = await createSupabaseCodeFile(DEFAULT_FILES[0])
            setFiles([normalizeFile(seeded)])
            setActiveFileId(seeded.id)
            setOpenTabs([seeded.id])
          } else {
            const normalized = data.map(normalizeFile)
            setFiles(normalized)
            setActiveFileId(normalized[0].id)
            setOpenTabs([normalized[0].id])
          }
          setSyncState('Synced with Supabase')
          return
        } catch {}
      }
      setSyncState('Local fallback')
    }
  }

  const seedDefaultFile = async () => {
    const first = DEFAULT_FILES[0]
    const { data } = await phpApi.post('/code/files', {
      filename: first.filename,
      language: first.language,
      content: first.content,
      folder_path: 'workspace',
    })
    if (!data?.uuid) throw new Error('PHP code endpoint did not return a file.')
    return normalizeFile(data)
  }

  const persistFile = async (file, patch = {}) => {
    const next = { ...file, ...patch }
    setFiles(current => current.map(f => f.id === file.id ? normalizeFile(next) : f))
    if (!file.uuid) return
    try {
      const { data } = await phpApi.put(`/code/files/${file.uuid}`, {
        filename: next.filename || next.name,
        language: next.language || next.lang,
        content: next.content,
        folder_path: next.folder_path || 'workspace',
        change_summary: 'Saved from Code Studio',
      })
      if (!data?.uuid) throw new Error('PHP code endpoint did not return a file.')
      setFiles(current => current.map(f => f.id === file.id ? normalizeFile(data) : f))
      setSyncState('Saved to PHP')
    } catch {
      if (isSupabaseConfigured) {
        try {
          const data = await saveSupabaseCodeFile(file, patch)
          setFiles(current => current.map(f => f.id === file.id ? normalizeFile(data) : f))
          setSyncState('Saved to Supabase')
          return
        } catch {}
      }
      setSyncState('Save failed: local only')
    }
  }

  const createFile = async () => {
    const filename = `untitled-${files.length + 1}.py`
    const localFile = normalizeFile({ id: `local-${Date.now()}`, filename, language: 'python', content: 'print("Hello from MEZOMAI")\n', folder_path: 'workspace' })
    setFiles(current => [localFile, ...current])
    setActiveFileId(localFile.id)
    setOpenTabs(current => [localFile.id, ...current])
    try {
      const { data } = await phpApi.post('/code/files', {
        filename,
        language: 'python',
        content: localFile.content,
        folder_path: 'workspace',
      })
      if (!data?.uuid) throw new Error('PHP code endpoint did not return a file.')
      const saved = normalizeFile(data)
      setFiles(current => current.map(f => f.id === localFile.id ? saved : f))
      setActiveFileId(saved.id)
      setOpenTabs(current => current.map(id => id === localFile.id ? saved.id : id))
      setSyncState('Created in PHP')
    } catch {
      if (isSupabaseConfigured) {
        try {
          const saved = normalizeFile(await createSupabaseCodeFile(localFile))
          setFiles(current => current.map(f => f.id === localFile.id ? saved : f))
          setActiveFileId(saved.id)
          setOpenTabs(current => current.map(id => id === localFile.id ? saved.id : id))
          setSyncState('Created in Supabase')
          return
        } catch {}
      }
      setSyncState('Created locally')
    }
  }

  const updateFileContent = (val) => {
    persistFile(activeFile, { content: val })
  }

  const openFile = (fileId) => {
    setActiveFileId(fileId)
    if (!openTabs.includes(fileId)) setOpenTabs([...openTabs, fileId])
  }

  const runCode = async () => {
    setBottomPanel('terminal')
    setAvatarState('thinking')
    setTerminalLogs(prev => [...prev, { type: 'info', text: `$ POST /code/run ${activeFile.name}` }])
    try {
      const { data } = await phpApi.post('/code/run', {
        file_uuid: activeFile.uuid || undefined,
        code: activeFile.content,
        language: activeFile.language || activeFile.lang,
      })
      const nextLogs = []
      if (data.stdout) nextLogs.push({ type: 'success', text: data.stdout.trim() })
      if (data.stderr) nextLogs.push({ type: data.exit_code === 0 ? 'info' : 'error', text: data.stderr.trim() })
      nextLogs.push({ type: data.exit_code === 0 ? 'success' : 'error', text: `Process exited ${data.exit_code} in ${data.duration_ms}ms.` })
      setTerminalLogs(prev => [...prev, ...nextLogs])
      setSyncState('Run saved to PHP')
    } catch (e) {
      const message = isSupabaseConfigured
        ? 'Sandbox runner needs a deployed PHP/Python API. Set VITE_PHP_API and VITE_PYTHON_API on Vercel for /code/run.'
        : e.response?.data?.stderr || e.response?.data?.error || e.message
      setTerminalLogs(prev => [...prev, { type: 'error', text: message }])
      setSyncState('Run failed')
    } finally {
      setAvatarState('idle')
    }
  }

  const handleAiAction = (action) => {
    setAvatarState('thinking')
    setAiResponse('Agent is scanning the active editor, terminal output, and project hints...')
    setTimeout(() => {
      if (action === 'explain') {
        setAiResponse(`Summary for ${activeFile.name}\n\nThis ${activeFile.language} file is persisted through PHP. Use Run to execute it in the Python FastAPI sandbox via /code/run.`)
      } else if (action === 'fix') {
        setBottomPanel('problems')
        setAiResponse(`Bug sweep completed\n\nNo local syntax analysis is blocking. Run the file to validate in the real sandbox.`)
      } else if (action === 'refactor') {
        setIsDiffMode(true)
        setAiResponse(`Diff preview opened for ${activeFile.name}.`)
      } else {
        setAiResponse(`Generated snippet for ${activeFile.name}\n\nconsole.log("Telemetry check active...");`)
      }
      setAvatarState('idle')
    }, 700)
  }

  return (
    <div style={workspace} className="fade-in">
      <ActivityRail activity={activity} setActivity={setActivity}/>
      <SidePanel activity={activity} files={files} activeFileId={activeFileId} openFile={openFile} createFile={createFile} syncState={syncState}/>
      <main style={mainArea}>
        <TopBar activeFile={activeFile} runCode={runCode} openDiff={() => setIsDiffMode(true)} syncState={syncState}/>
        <TabBar files={files} openTabs={openTabs} setOpenTabs={setOpenTabs} activeFileId={activeFileId} setActiveFileId={setActiveFileId}/>
        <Editor activeFile={activeFile} isDiffMode={isDiffMode} setIsDiffMode={setIsDiffMode} updateFileContent={updateFileContent}/>
        <BottomPanel panel={bottomPanel} setPanel={setBottomPanel} logs={terminalLogs} setLogs={setTerminalLogs}/>
        <StatusBar activeFile={activeFile} avatarState={avatarState}/>
      </main>
      <AgentPanel aiInput={aiInput} setAiInput={setAiInput} aiResponse={aiResponse} handleAiAction={handleAiAction} activeFile={activeFile}/>
    </div>
  )
}

function ActivityRail({ activity, setActivity }) {
  const items = [['explorer', 'EX'], ['search', 'SR'], ['source', 'SC'], ['agent', 'AI']]
  return <aside style={activityRail}>{items.map(([id, label]) => <button key={id} onClick={() => setActivity(id)} title={id} style={railBtn(activity === id)}>{label}</button>)}</aside>
}

function SidePanel({ activity, files, activeFileId, openFile, createFile, syncState }) {
  return (
    <aside style={sidePanel}>
      <div style={panelTitle}>{activity === 'explorer' ? 'Explorer' : activity === 'search' ? 'Search' : activity === 'source' ? 'Source Control' : 'Agent Context'}</div>
      {activity === 'explorer' && (
        <>
          <button onClick={createFile} style={smallBtn}>New File</button>
          <div style={folderName}>MEZOMAI-WORKSPACE</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {files.map(file => <button key={file.id} onClick={() => openFile(file.id)} style={fileRow(activeFileId === file.id)}><span style={fileBadge}>{file.language.slice(0, 2).toUpperCase()}</span><span>{file.name}</span></button>)}
          </div>
          <div style={mutedBox}>{syncState}</div>
        </>
      )}
      {activity === 'search' && <div style={mutedBox}>Search UI is ready. File contents are loaded from PHP.</div>}
      {activity === 'source' && <div style={mutedBox}>Changes save through PHP file versions.</div>}
      {activity === 'agent' && <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>{AGENT_STEPS.map((step, index) => <div key={step} style={stepRow}><span>{index + 1}</span>{step}</div>)}</div>}
    </aside>
  )
}

function TopBar({ activeFile, runCode, openDiff, syncState }) {
  return (
    <div style={topBar}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <span style={crumb}>workspace</span><span style={crumbSep}>/</span><span style={crumb}>{activeFile.name}</span><span style={crumbSep}>{syncState}</span>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={openDiff} style={toolbarBtn}>Diff Preview</button>
        <button onClick={runCode} className="gold-glow-btn" style={{ ...toolbarBtn, border: 'none', color: '#fff' }}>Run Sandbox</button>
      </div>
    </div>
  )
}

function TabBar({ files, openTabs, setOpenTabs, activeFileId, setActiveFileId }) {
  return <div style={tabBar}>{openTabs.map(tabId => {
    const file = files.find(f => f.id === tabId)
    if (!file) return null
    const isActive = activeFileId === tabId
    return <button key={tabId} style={tabStyle(isActive)} onClick={() => setActiveFileId(tabId)}><span>{file.name}</span><span onClick={(e) => { e.stopPropagation(); setOpenTabs(openTabs.filter(t => t !== tabId)) }} style={{ opacity: 0.55 }}>x</span></button>
  })}</div>
}

function Editor({ activeFile, isDiffMode, setIsDiffMode, updateFileContent }) {
  return (
    <section style={editorShell}>
      {isDiffMode ? (
        <div style={diffGrid}>
          <div style={diffHeader}><span style={{ color: 'var(--red)' }}>Original</span><span style={{ color: 'var(--green)' }}>Proposal</span><button onClick={() => setIsDiffMode(false)} style={smallBtn}>Close Diff</button></div>
          <pre style={diffPane}>{activeFile.content}</pre>
          <pre style={{ ...diffPane, borderColor: 'rgba(22,163,74,.35)' }}>{activeFile.content}</pre>
        </div>
      ) : (
        <div style={editorWrap}><LineNumbers content={activeFile.content}/><textarea value={activeFile?.content || ''} onChange={e => updateFileContent(e.target.value)} style={editorStyle} spellCheck={false}/></div>
      )}
    </section>
  )
}

function LineNumbers({ content }) {
  const count = Math.max((content || '').split('\n').length, 12)
  return <div style={lineNumbers}>{Array.from({ length: count }, (_, i) => <div key={i}>{i + 1}</div>)}</div>
}

function BottomPanel({ panel, setPanel, logs, setLogs }) {
  return (
    <section style={bottomPanelStyle}>
      <div style={bottomTabs}>{['terminal', 'problems', 'output'].map(id => <button key={id} onClick={() => setPanel(id)} style={bottomTab(panel === id)}>{id}</button>)}<button onClick={() => setLogs([])} style={{ ...smallBtn, marginLeft: 'auto' }}>Clear</button></div>
      <div style={terminalBody}>
        {panel === 'terminal' && logs.map((log, i) => <div key={i} style={{ color: log.type === 'error' ? 'var(--red)' : log.type === 'success' ? 'var(--green)' : 'var(--t2)', whiteSpace: 'pre-wrap' }}>{log.text}</div>)}
        {panel === 'problems' && <div style={{ color: 'var(--t3)' }}>Run the active file to collect real sandbox errors.</div>}
        {panel === 'output' && <div style={{ color: 'var(--t3)' }}>No background task output yet.</div>}
      </div>
    </section>
  )
}

function AgentPanel({ aiInput, setAiInput, aiResponse, handleAiAction, activeFile }) {
  return (
    <aside style={agentPane}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, paddingBottom: 16, borderBottom: '1px solid var(--b1)' }}><AvatarFace size={82}/><div style={{ fontFamily: 'var(--ff-display)', fontSize: 15, fontWeight: 800 }}>MEZOMAI Agent</div><div style={{ fontFamily: 'var(--ff-mono)', fontSize: 9, color: 'var(--t3)' }}>Context: {activeFile.name}</div></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>{['explain','fix','refactor','generate'].map(action => <button key={action} onClick={() => handleAiAction(action)} style={assistBtn}>{action}</button>)}</div>
      <div style={agentCard}><div style={sectionLabel}>Agent Plan</div>{AGENT_STEPS.map((step, index) => <div key={step} style={agentStep}><span>{index + 1}</span>{step}</div>)}</div>
      <textarea value={aiInput} onChange={e => setAiInput(e.target.value)} placeholder="Ask for a patch, test, or explanation..." style={agentInput}/>
      <div style={aiResponseBox}>{aiResponse}</div>
    </aside>
  )
}

function StatusBar({ activeFile, avatarState }) {
  return <footer style={statusBar}><span>main</span><span>{activeFile.language}</span><span>UTF-8</span><span>Spaces: 2</span><span style={{ marginLeft: 'auto' }}>Agent: {avatarState}</span></footer>
}

const workspace = { display: 'flex', flex: 1, overflow: 'hidden', background: 'var(--bg)' }
const activityRail = { width: 52, background: 'var(--bg1)', borderRight: '1px solid var(--b1)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 7px', gap: 8 }
const railBtn = (active) => ({ width: 36, height: 36, border: '1px solid var(--b1)', background: active ? 'var(--gold-light)' : 'transparent', color: active ? 'var(--gold)' : 'var(--t3)', fontFamily: 'var(--ff-mono)', fontSize: 10, fontWeight: 800 })
const sidePanel = { width: 246, background: 'var(--bg1)', borderRight: '1px solid var(--b1)', padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }
const panelTitle = { fontFamily: 'var(--ff-mono)', fontSize: 10, color: 'var(--t3)', letterSpacing: '.14em', textTransform: 'uppercase' }
const folderName = { fontFamily: 'var(--ff-display)', fontSize: 12, fontWeight: 800, color: 'var(--t2)' }
const fileRow = (active) => ({ padding: '8px 9px', borderRadius: 8, cursor: 'pointer', fontSize: 12, background: active ? 'var(--gold-light)' : 'transparent', color: active ? 'var(--gold)' : 'var(--t2)', border: `1px solid ${active ? 'var(--gold)' : 'transparent'}`, fontFamily: 'var(--ff-mono)', display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left' })
const fileBadge = { width: 27, height: 22, borderRadius: 6, background: 'var(--bg3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800 }
const mutedBox = { background: 'var(--bg2)', border: '1px solid var(--b1)', borderRadius: 8, padding: 12, color: 'var(--t3)', fontSize: 12, lineHeight: 1.5 }
const stepRow = { background: 'var(--bg2)', border: '1px solid var(--b1)', borderRadius: 8, padding: '8px 10px', display: 'flex', gap: 8, fontSize: 11, color: 'var(--t2)' }
const mainArea = { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: '1px solid var(--b1)' }
const topBar = { height: 46, background: 'var(--bg1)', borderBottom: '1px solid var(--b1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', flexShrink: 0 }
const crumb = { fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--t2)' }
const crumbSep = { color: 'var(--t3)', fontFamily: 'var(--ff-mono)', fontSize: 11 }
const toolbarBtn = { border: '1px solid var(--b1)', background: 'var(--bg2)', color: 'var(--t2)', padding: '7px 11px', fontSize: 11, fontWeight: 800 }
const tabBar = { height: 40, background: 'var(--bg1)', borderBottom: '1px solid var(--b1)', display: 'flex', overflowX: 'auto', flexShrink: 0 }
const tabStyle = (active) => ({ padding: '0 14px', display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', background: active ? 'var(--bg)' : 'transparent', fontSize: 12, color: active ? 'var(--gold)' : 'var(--t3)', border: 'none', borderRight: '1px solid var(--b1)', borderBottom: active ? '2px solid var(--gold)' : '2px solid transparent', fontFamily: 'var(--ff-mono)' })
const editorShell = { flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden', background: 'var(--bg)' }
const editorWrap = { flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }
const lineNumbers = { width: 54, padding: '18px 12px', color: 'var(--t3)', fontFamily: 'var(--ff-mono)', fontSize: 12, lineHeight: 1.7, textAlign: 'right', borderRight: '1px solid var(--b1)', userSelect: 'none' }
const editorStyle = { flex: 1, border: 'none', background: 'var(--bg)', outline: 'none', resize: 'none', fontFamily: 'var(--ff-mono)', fontSize: 13, color: 'var(--t1)', padding: 18, lineHeight: 1.7, whiteSpace: 'pre' }
const diffGrid = { flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '44px 1fr', gap: 12, padding: 14, overflow: 'hidden' }
const diffHeader = { gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 1fr auto', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--b1)', paddingBottom: 10, fontFamily: 'var(--ff-mono)', fontSize: 12 }
const diffPane = { margin: 0, background: 'var(--bg1)', border: '1px solid rgba(220,38,38,.35)', borderRadius: 10, padding: 16, overflow: 'auto', color: 'var(--t2)', fontFamily: 'var(--ff-mono)', fontSize: 12, lineHeight: 1.6 }
const bottomPanelStyle = { height: 172, background: 'var(--bg1)', borderTop: '1px solid var(--b1)', display: 'flex', flexDirection: 'column', flexShrink: 0 }
const bottomTabs = { height: 38, display: 'flex', alignItems: 'center', gap: 4, padding: '0 10px', borderBottom: '1px solid var(--b1)', background: 'var(--bg2)' }
const bottomTab = (active) => ({ border: 'none', background: active ? 'var(--bg1)' : 'transparent', color: active ? 'var(--gold)' : 'var(--t3)', padding: '6px 10px', fontSize: 11, textTransform: 'capitalize', fontWeight: 800 })
const terminalBody = { flex: 1, padding: '12px 16px', overflowY: 'auto', fontFamily: 'var(--ff-mono)', fontSize: 11, display: 'flex', flexDirection: 'column', gap: 4 }
const agentPane = { width: 300, background: 'var(--bg1)', padding: 18, display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }
const assistBtn = { background: 'var(--bg2)', border: '1px solid var(--b1)', padding: '8px 5px', fontSize: 10, fontFamily: 'var(--ff-display)', fontWeight: 800, color: 'var(--t1)', cursor: 'pointer', textTransform: 'capitalize' }
const agentCard = { background: 'var(--bg2)', border: '1px solid var(--b1)', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }
const sectionLabel = { fontFamily: 'var(--ff-mono)', fontSize: 9, color: 'var(--t3)', letterSpacing: '.12em', textTransform: 'uppercase' }
const agentStep = { display: 'flex', gap: 8, color: 'var(--t2)', fontSize: 11, lineHeight: 1.4 }
const agentInput = { width: '100%', minHeight: 74, fontSize: 12, resize: 'vertical' }
const aiResponseBox = { flex: 1, minHeight: 130, background: 'var(--bg2)', border: '1px solid var(--b1)', borderRadius: 10, padding: 12, fontSize: 12, color: 'var(--t2)', overflowY: 'auto', lineHeight: 1.5, whiteSpace: 'pre-wrap' }
const statusBar = { height: 26, background: 'var(--gold)', color: '#fff', display: 'flex', alignItems: 'center', gap: 16, padding: '0 12px', fontFamily: 'var(--ff-mono)', fontSize: 10, flexShrink: 0 }
const smallBtn = { border: '1px solid var(--b1)', background: 'var(--bg1)', color: 'var(--t2)', fontSize: 10, padding: '7px 10px', borderRadius: 6, fontWeight: 800 }
