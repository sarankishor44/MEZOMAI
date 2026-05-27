import React, { useEffect, useState } from 'react'
import { useStore } from '../store'
import AvatarFace from '../components/layout/AvatarFace'
import { phpApi, pyApi, pyRootApi } from '../utils/api'
import { activeProvider, aiErrorMessage, aiRequestConfig, hasProviderKey, providerModel } from '../utils/aiConfig'


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

const WORKSPACE_META_KEY = 'mezomai_code_workspace_meta'
const WORKSPACE_HANDLE_DB = 'mezomai_code_workspace_handles'
const WORKSPACE_HANDLE_STORE = 'handles'
const WORKSPACE_ROOT_HANDLE_KEY = 'workspace-root'
const SKIPPED_LOCAL_DIRS = new Set(['.git', 'node_modules', 'dist', 'build', '.next', 'vendor', '__pycache__'])
const TEXT_EXTENSIONS = new Set([
  'js', 'jsx', 'ts', 'tsx', 'py', 'php', 'css', 'scss', 'html', 'json', 'md', 'txt', 'env',
  'yml', 'yaml', 'xml', 'sql', 'sh', 'ps1', 'vue', 'svelte', 'java', 'go', 'rs', 'rb', 'c', 'cpp', 'h',
])

const inferLanguage = (filename = '') => {
  const ext = filename.split('.').pop()?.toLowerCase()
  if (['js', 'jsx', 'ts', 'tsx'].includes(ext)) return 'javascript'
  if (ext === 'py') return 'python'
  if (ext === 'php') return 'php'
  if (ext === 'css') return 'css'
  if (ext === 'html') return 'html'
  if (ext === 'json') return 'json'
  if (['md', 'txt'].includes(ext)) return 'markdown'
  return ext || 'text'
}

const isTextFile = (filename = '') => {
  const parts = filename.split('.')
  if (parts.length === 1) return true
  return TEXT_EXTENSIONS.has(parts.pop().toLowerCase())
}

async function collectLocalFiles(directoryHandle, rootName, prefix = '', bucket = { count: 0, max: 200 }) {
  const results = []
  for await (const [name, handle] of directoryHandle.entries()) {
    if (bucket.count >= bucket.max) break
    if (handle.kind === 'directory') {
      if (SKIPPED_LOCAL_DIRS.has(name)) continue
      results.push(...await collectLocalFiles(handle, rootName, prefix ? `${prefix}/${name}` : name, bucket))
      continue
    }
    if (!isTextFile(name)) continue
    const file = await handle.getFile()
    if (file.size > 512 * 1024) continue
    const content = await file.text()
    const path = prefix ? `${prefix}/${name}` : name
    bucket.count += 1
    results.push(normalizeFile({
      id: `localfs:${path}`,
      uuid: null,
      filename: name,
      name,
      folder_path: prefix || rootName,
      path: `${rootName}/${path}`,
      localPath: path,
      language: inferLanguage(name),
      content,
      local: true,
      handle,
    }))
  }
  return results
}

async function writeLocalFile(file, content) {
  if (!file?.handle?.createWritable) throw new Error('Local file handle is not writable.')
  const writable = await file.handle.createWritable()
  await writable.write(content)
  await writable.close()
}

const normalizeFile = (file) => ({
  ...file,
  id: file.uuid || file.id,
  name: file.filename || file.name,
  filename: file.filename || file.name,
  lang: file.language || file.lang || 'python',
  language: file.language || file.lang || 'python',
  path: file.path || `${file.folder_path || 'workspace'}/${file.filename || file.name}`.replace('//', '/'),
})

export default function CodePage() {
  const { setAvatarState, avatarState, settings } = useStore()
  const [files, setFiles] = useState(DEFAULT_FILES)
  const [activeFileId, setActiveFileId] = useState(DEFAULT_FILES[0].id)
  const [openTabs, setOpenTabs] = useState([DEFAULT_FILES[0].id])
  const [aiInput, setAiInput] = useState('')
  const [aiResponse, setAiResponse] = useState('Ask the agent for a refactor, explanation, or bug sweep. Suggested changes will appear here.')
  const [terminalLogs, setTerminalLogs] = useState([{ type: 'info', text: 'MEZOMAI Codex Studio ready. Dynamic local directory mounting supported.' }])
  const [isDiffMode, setIsDiffMode] = useState(false)
  const [activity, setActivity] = useState('explorer')
  const [bottomPanel, setBottomPanel] = useState('terminal')
  const [syncState, setSyncState] = useState('Local fallback')
  const [directoryHandle, setDirectoryHandle] = useState(null)
  
  const [hasStoredWorkspace, setHasStoredWorkspace] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(WORKSPACE_META_KEY) || '{}').storage === 'local-file-system'
    } catch {
      return false
    }
  })
  const [workspaceRoot, setWorkspaceRoot] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(WORKSPACE_META_KEY) || '{}').rootName || 'MEZOMAI-WORKSPACE'
    } catch {
      return 'MEZOMAI-WORKSPACE'
    }
  })

  const activeFile = files.find(f => f.id === activeFileId) || files[0]

  useEffect(() => {
    loadFiles()
  }, [])

  const loadFiles = async () => {
    // If local folder is configured, request permission again to fetch fresh
    if (hasStoredWorkspace) {
      setSyncState('Reconnect local folder')
      setTerminalLogs(prev => [...prev, { type: 'info', text: 'Local workspace requires folder mount. Click Reconnect to link directory.' }])
      return
    }
    
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
      setSyncState('Local fallback')
    }
  }

  const restoreLocalWorkspace = async () => {
    if (!('showDirectoryPicker' in window)) {
      setSyncState('Unsupported platform')
      return
    }
    try {
      const handle = await window.showDirectoryPicker({ mode: 'readwrite' })
      const localFiles = await collectLocalFiles(handle, handle.name)
      setDirectoryHandle(handle)
      setWorkspaceRoot(handle.name)
      setFiles(localFiles.length ? localFiles : DEFAULT_FILES)
      setActiveFileId((localFiles[0] || DEFAULT_FILES[0]).id)
      setOpenTabs([(localFiles[0] || DEFAULT_FILES[0]).id])
      
      // Store ONLY metadata header, NO file list or contents saved to browser storage
      localStorage.setItem(WORKSPACE_META_KEY, JSON.stringify({
        rootName: handle.name,
        storage: 'local-file-system',
        updatedAt: new Date().toISOString()
      }))
      setHasStoredWorkspace(true)
      setTerminalLogs(prev => [...prev, { type: 'success', text: `Mounted folder ${handle.name}. Loaded ${localFiles.length} files cleanly into memory.` }])
      setSyncState('Local folder mounted')
    } catch (error) {
      if (error?.name !== 'AbortError') {
        setSyncState('Connection failed')
        setTerminalLogs(prev => [...prev, { type: 'error', text: `Folder mount failed: ${error.message}` }])
      }
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
    if (file.local) {
      try {
        await writeLocalFile(file, next.content || '')
        setSyncState('Saved to local disk')
      } catch (error) {
        setSyncState('Save failed')
        setTerminalLogs(prev => [...prev, { type: 'error', text: `Write-back failed: ${error.message}` }])
      }
      return
    }

    if (!file.uuid) return
    try {
      const { data } = await phpApi.put(`/code/files/${file.uuid}`, {
        filename: next.filename || next.name,
        language: next.language || next.lang,
        content: next.content,
        folder_path: next.folder_path || 'workspace',
        change_summary: 'Saved from Code Studio',
      })
      setFiles(current => current.map(f => f.id === file.id ? normalizeFile(data) : f))
      setSyncState('Saved to PHP')
    } catch {
      setSyncState('Save failed: local only')
    }
  }

  const createFile = async () => {
    const filename = `untitled-${files.length + 1}.py`
    if (directoryHandle) {
      try {
        const handle = await directoryHandle.getFileHandle(filename, { create: true })
        const localFile = normalizeFile({
          id: `localfs:${filename}`,
          uuid: null,
          filename,
          language: 'python',
          content: 'print("Hello from MEZOMAI")\n',
          folder_path: '',
          path: `${workspaceRoot}/${filename}`,
          local: true,
          handle,
        })
        await writeLocalFile(localFile, localFile.content)
        setFiles(current => [localFile, ...current])
        setActiveFileId(localFile.id)
        setOpenTabs(current => [localFile.id, ...current])
        setSyncState('Created in local folder')
        return
      } catch (error) {
        setSyncState('Create failed')
      }
    }
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
    setTerminalLogs(prev => [...prev, { type: 'info', text: `$ run sandbox: ${activeFile.name}` }])
    const payload = {
      file_uuid: activeFile.uuid || undefined,
      code: activeFile.content,
      language: activeFile.language || activeFile.lang,
    }
    const renderRunLogs = (data, source) => {
      const nextLogs = []
      if (data.stdout) nextLogs.push({ type: 'success', text: data.stdout.trim() })
      if (data.stderr) nextLogs.push({ type: data.exit_code === 0 ? 'info' : 'error', text: data.stderr.trim() })
      nextLogs.push({ type: data.exit_code === 0 ? 'success' : 'error', text: `Process exited ${data.exit_code} in ${data.duration_ms}ms via ${source}.` })
      setTerminalLogs(prev => [...prev, ...nextLogs])

    }
    try {
      const { data } = await phpApi.post('/code/run', payload)
      renderRunLogs(data, 'PHP')
    } catch (e) {
      try {
        const { data } = await pyRootApi.post('/code/run', {
          code: payload.code,
          language: payload.language,
        })
        renderRunLogs(data, 'Python Sandbox')
      } catch (pyError) {
        setTerminalLogs(prev => [...prev, {
          type: 'error',
          text: `Sandbox run failed. Verify setup configurations.`,
        }])
      }
    } finally {
      setAvatarState('idle')
    }
  }

  return (
    <div style={workspace} className="fade-in">
      <ActivityRail activity={activity} setActivity={setActivity}/>
      <SidePanel 
        activity={activity} 
        files={files} 
        activeFileId={activeFileId} 
        openFile={openFile} 
        createFile={createFile} 
        openLocalFolder={restoreLocalWorkspace} 
        syncState={syncState} 
        workspaceRoot={workspaceRoot}
      />
      <main style={mainArea}>
        <TopBar activeFile={activeFile} runCode={runCode} openDiff={() => setIsDiffMode(true)} syncState={syncState} workspaceRoot={workspaceRoot}/>
        <TabBar files={files} openTabs={openTabs} setOpenTabs={setOpenTabs} activeFileId={activeFileId} setActiveFileId={setActiveFileId}/>
        <Editor activeFile={activeFile} isDiffMode={isDiffMode} setIsDiffMode={setIsDiffMode} updateFileContent={updateFileContent}/>
        <BottomPanel panel={bottomPanel} setPanel={setBottomPanel} logs={terminalLogs} setLogs={setTerminalLogs}/>
        <StatusBar activeFile={activeFile} avatarState={avatarState}/>
      </main>
    </div>
  )
}

function ActivityRail({ activity, setActivity }) {
  const items = [['explorer', '📁'], ['agent', '🤖']]
  return <aside style={activityRail}>{items.map(([id, label]) => <button key={id} onClick={() => setActivity(id)} title={id} style={railBtn(activity === id)}>{label}</button>)}</aside>
}

function SidePanel({ activity, files, activeFileId, openFile, createFile, openLocalFolder, syncState, workspaceRoot }) {
  return (
    <aside style={sidePanel}>
      <div style={panelTitle}>{activity === 'explorer' ? 'Codex Workspace' : 'Core Plan'}</div>
      {activity === 'explorer' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button onClick={openLocalFolder} style={smallBtn}>Mount Folder</button>
            <button onClick={createFile} style={smallBtn}>New File</button>
          </div>
          <div style={folderName}>📂 {workspaceRoot}</div>
          
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            <FolderTree files={files} activeFileId={activeFileId} openFile={openFile} workspaceRoot={workspaceRoot}/>
          </div>
          
          <div style={mutedBox}>{syncState}</div>
        </>
      )}
      {activity === 'agent' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {AGENT_STEPS.map((step, index) => <div key={step} style={stepRow}><span>{index + 1}</span>{step}</div>)}
        </div>
      )}
    </aside>
  )
}

function FolderTree({ files, activeFileId, openFile, workspaceRoot }) {
  const [collapsed, setCollapsed] = useState({})

  const toggle = (path) => {
    setCollapsed(prev => ({ ...prev, [path]: !prev[path] }))
  }

  // Build node hierarchy
  const tree = { name: workspaceRoot, path: '', isDir: true, children: {} }

  files.forEach(file => {
    // Determine path components relative to the tree root
    // For local files we can parse their folder path structure.
    const parts = file.path ? file.path.split('/') : [file.name]
    let current = tree
    
    // Traversal down directories
    for (let i = 1; i < parts.length - 1; i++) {
      const part = parts[i]
      if (!current.children[part]) {
        current.children[part] = { name: part, path: parts.slice(0, i + 1).join('/'), isDir: true, children: {} }
      }
      current = current.children[part]
    }
    const filename = parts[parts.length - 1]
    current.children[filename] = { name: filename, path: file.path, isDir: false, file }
  })

  const renderNode = (node, depth = 0) => {
    if (node.isDir) {
      const isCollapsed = collapsed[node.path]
      return (
        <div key={node.path || 'root'} style={{ display: 'flex', flexDirection: 'column' }}>
          <button onClick={() => toggle(node.path)} style={folderRowStyle(depth)}>
            <span>{isCollapsed ? '▶' : '▼'}</span>
            <span>📁</span>
            <span style={{ fontWeight: 700 }}>{node.name}</span>
          </button>
          {!isCollapsed && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {Object.values(node.children).map(child => renderNode(child, depth + 1))}
            </div>
          )}
        </div>
      )
    } else {
      const active = activeFileId === node.file.id
      return (
        <button key={node.file.id} onClick={() => openFile(node.file.id)} style={fileRowStyle(active, depth)}>
          <span style={fileBadgeStyle}>{node.file.language.slice(0, 2).toUpperCase()}</span>
          <span>{node.name}</span>
        </button>
      )
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 10 }}>
      {Object.values(tree.children).map(child => renderNode(child, 0))}
    </div>
  )
}

function TopBar({ activeFile, runCode, openDiff, syncState, workspaceRoot }) {
  return (
    <div style={topBar}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <span style={crumb}>{workspaceRoot}</span><span style={crumbSep}>/</span><span style={crumb}>{activeFile.name}</span><span style={crumbSep}>({syncState})</span>
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
      <div style={bottomTabs}>{['terminal', 'problems'].map(id => <button key={id} onClick={() => setPanel(id)} style={bottomTab(panel === id)}>{id}</button>)}<button onClick={() => setLogs([])} style={{ ...smallBtn, marginLeft: 'auto' }}>Clear</button></div>
      <div style={terminalBody}>
        {panel === 'terminal' && logs.map((log, i) => <div key={i} style={{ color: log.type === 'error' ? 'var(--red)' : log.type === 'success' ? 'var(--green)' : 'var(--t2)', whiteSpace: 'pre-wrap' }}>{log.text}</div>)}
        {panel === 'problems' && <div style={{ color: 'var(--t3)' }}>Sandbox environment execution diagnostics show up here.</div>}
      </div>
    </section>
  )
}

function StatusBar({ activeFile, avatarState }) {
  return <footer style={statusBar}><span>main</span><span>{activeFile.language}</span><span>UTF-8</span><span style={{ marginLeft: 'auto' }}>Agent Core: {avatarState}</span></footer>
}

// Tree view styles
const folderRowStyle = (depth) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 8px',
  paddingLeft: 10 + depth * 12,
  background: 'transparent',
  border: 'none',
  color: 'var(--t2)',
  fontSize: 12,
  cursor: 'pointer',
  textAlign: 'left',
  width: '100%',
})

const fileRowStyle = (active, depth) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '6px 8px',
  paddingLeft: 22 + depth * 12,
  background: active ? 'var(--gold-light)' : 'transparent',
  border: 'none',
  color: active ? 'var(--gold)' : 'var(--t2)',
  fontSize: 12,
  cursor: 'pointer',
  textAlign: 'left',
  width: '100%',
  fontFamily: 'var(--ff-mono)',
  borderRadius: 6,
})

const fileBadgeStyle = {
  fontSize: 8,
  padding: '2px 4px',
  background: 'var(--bg3)',
  borderRadius: 4,
  fontWeight: 800,
  color: 'var(--t3)',
}

// CSS Workspace overrides
const workspace = { display: 'flex', flex: 1, overflow: 'hidden', background: 'var(--bg)' }
const activityRail = { width: 52, background: 'var(--bg1)', borderRight: '1px solid var(--b1)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 7px', gap: 8 }
const railBtn = (active) => ({ width: 36, height: 36, border: '1px solid var(--b1)', background: active ? 'var(--gold-light)' : 'transparent', color: active ? 'var(--gold)' : 'var(--t3)', fontSize: 16, cursor: 'pointer', display: 'grid', placeItems: 'center' })
const sidePanel = { width: 246, background: 'var(--bg1)', borderRight: '1px solid var(--b1)', padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }
const panelTitle = { fontFamily: 'var(--ff-mono)', fontSize: 10, color: 'var(--t3)', letterSpacing: '.14em', textTransform: 'uppercase' }
const folderName = { fontFamily: 'var(--ff-display)', fontSize: 12, fontWeight: 800, color: 'var(--t2)', marginTop: 8 }
const mutedBox = { background: 'var(--bg2)', border: '1px solid var(--b1)', borderRadius: 8, padding: 12, color: 'var(--t3)', fontSize: 11, lineHeight: 1.5, marginTop: 'auto' }
const stepRow = { background: 'var(--bg2)', border: '1px solid var(--b1)', borderRadius: 8, padding: '8px 10px', display: 'flex', gap: 8, fontSize: 11, color: 'var(--t2)' }
const mainArea = { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: '1px solid var(--b1)' }
const topBar = { height: 46, background: 'var(--bg1)', borderBottom: '1px solid var(--b1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', flexShrink: 0 }
const crumb = { fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--t2)' }
const crumbSep = { color: 'var(--t3)', fontFamily: 'var(--ff-mono)', fontSize: 11 }
const toolbarBtn = { border: '1px solid var(--b1)', background: 'var(--bg2)', color: 'var(--t2)', padding: '7px 11px', fontSize: 11, fontWeight: 800, cursor: 'pointer' }
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
const bottomTab = (active) => ({ border: 'none', background: active ? 'var(--bg1)' : 'transparent', color: active ? 'var(--gold)' : 'var(--t3)', padding: '6px 10px', fontSize: 11, textTransform: 'capitalize', fontWeight: 800, cursor: 'pointer' })
const terminalBody = { flex: 1, padding: '12px 16px', overflowY: 'auto', fontFamily: 'var(--ff-mono)', fontSize: 11, display: 'flex', flexDirection: 'column', gap: 4 }
const statusBar = { height: 26, background: 'var(--gold)', color: '#fff', display: 'flex', alignItems: 'center', gap: 16, padding: '0 12px', fontFamily: 'var(--ff-mono)', fontSize: 10, flexShrink: 0 }
const smallBtn = { border: '1px solid var(--b1)', background: 'var(--bg1)', color: 'var(--t2)', fontSize: 10, padding: '7px 10px', borderRadius: 6, fontWeight: 800, cursor: 'pointer' }
