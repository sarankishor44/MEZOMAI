import React, { useEffect, useState } from 'react'
import { useStore } from '../store'
import AvatarFace from '../components/layout/AvatarFace'
import { phpApi, pyApi } from '../utils/api'
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

async function collectLocalFiles(directoryHandle, rootName, prefix = '', bucket = { count: 0, max: 160 }) {
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

function openWorkspaceHandleDb() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('Local folder restore needs IndexedDB support.'))
      return
    }
    const request = indexedDB.open(WORKSPACE_HANDLE_DB, 1)
    request.onupgradeneeded = () => {
      request.result.createObjectStore(WORKSPACE_HANDLE_STORE)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error('Could not open local file handle storage.'))
  })
}

async function readWorkspaceHandle() {
  const db = await openWorkspaceHandleDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(WORKSPACE_HANDLE_STORE, 'readonly')
    const request = tx.objectStore(WORKSPACE_HANDLE_STORE).get(WORKSPACE_ROOT_HANDLE_KEY)
    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error || new Error('Could not read local workspace handle.'))
    tx.oncomplete = () => db.close()
    tx.onerror = () => {
      db.close()
      reject(tx.error || new Error('Could not read local workspace handle.'))
    }
  })
}

async function saveWorkspaceHandle(handle) {
  const db = await openWorkspaceHandleDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(WORKSPACE_HANDLE_STORE, 'readwrite')
    tx.objectStore(WORKSPACE_HANDLE_STORE).put(handle, WORKSPACE_ROOT_HANDLE_KEY)
    tx.oncomplete = () => {
      db.close()
      resolve()
    }
    tx.onerror = () => {
      db.close()
      reject(tx.error || new Error('Could not save local workspace handle.'))
    }
  })
}

async function ensureWorkspacePermission(handle, mode = 'readwrite', requestAccess = false) {
  if (!handle?.queryPermission) return true
  const options = { mode }
  if (await handle.queryPermission(options) === 'granted') return true
  if (!requestAccess || !handle.requestPermission) return false
  return await handle.requestPermission(options) === 'granted'
}

const toStoredLocalMeta = (localFiles, rootName) => ({
  rootName,
  storage: 'local-file-system',
  files: localFiles.map(({ handle: _handle, content: _content, ...file }) => file),
  updatedAt: new Date().toISOString(),
})

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
  const [terminalLogs, setTerminalLogs] = useState([{ type: 'info', text: 'MEZOMAI workspace ready. Files sync with PHP when the backend is available.' }])
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
    if (await restoreLocalWorkspace(false)) return
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

  const restoreLocalWorkspace = async (requestAccess = false) => {
    let meta = {}
    try {
      meta = JSON.parse(localStorage.getItem(WORKSPACE_META_KEY) || '{}')
    } catch {
      meta = {}
    }
    if (meta.storage !== 'local-file-system') return false
    setHasStoredWorkspace(true)
    try {
      const handle = await readWorkspaceHandle()
      if (!handle) {
        setSyncState('Reconnect local folder')
        return false
      }
      const hasPermission = await ensureWorkspacePermission(handle, 'readwrite', requestAccess)
      if (!hasPermission) {
        setSyncState('Reconnect local folder')
        setTerminalLogs(prev => [...prev, { type: 'info', text: `Click Reconnect to fetch files again from ${meta.rootName || 'your local folder'}.` }])
        return false
      }
      const localFiles = await collectLocalFiles(handle, handle.name)
      setDirectoryHandle(handle)
      setWorkspaceRoot(handle.name)
      setFiles(localFiles.length ? localFiles : DEFAULT_FILES)
      setActiveFileId((localFiles[0] || DEFAULT_FILES[0]).id)
      setOpenTabs([(localFiles[0] || DEFAULT_FILES[0]).id])
      localStorage.setItem(WORKSPACE_META_KEY, JSON.stringify(toStoredLocalMeta(localFiles, handle.name)))
      setTerminalLogs(prev => [...prev, { type: 'success', text: `Fetched ${localFiles.length} text files from local folder ${handle.name}.` }])
      setSyncState(localFiles.length ? 'Fetched from local folder' : 'Local folder empty')
      return true
    } catch (error) {
      setSyncState(error.message || 'Local folder fetch failed')
      return false
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
        setSyncState('Saved to local folder')
      } catch (error) {
        setSyncState(error.message || 'Local file save failed')
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
      if (!data?.uuid) throw new Error('PHP code endpoint did not return a file.')
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
          folder_path: workspaceRoot,
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
        setSyncState(error.message || 'Local create failed')
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

  const openLocalFolder = async () => {
    if (!('showDirectoryPicker' in window)) {
      setSyncState('Local folders need Chrome or Edge desktop')
      return
    }
    try {
      const handle = await window.showDirectoryPicker({ mode: 'readwrite' })
      const localFiles = await collectLocalFiles(handle, handle.name)
      await saveWorkspaceHandle(handle)
      setDirectoryHandle(handle)
      setHasStoredWorkspace(true)
      setWorkspaceRoot(handle.name)
      if (localFiles.length) {
        setFiles(localFiles)
        setActiveFileId(localFiles[0].id)
        setOpenTabs([localFiles[0].id])
      }
      localStorage.setItem(WORKSPACE_META_KEY, JSON.stringify(toStoredLocalMeta(localFiles, handle.name)))
      setTerminalLogs(prev => [...prev, { type: 'success', text: `Opened local folder ${handle.name}. Loaded ${localFiles.length} text files.` }])
      setSyncState(localFiles.length ? 'Local folder mounted' : 'Local folder empty')
    } catch (error) {
      if (error?.name !== 'AbortError') setSyncState(error.message || 'Folder access cancelled')
    }
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
      const message = e.response?.data?.stderr || e.response?.data?.error || e.message
      setTerminalLogs(prev => [...prev, { type: 'error', text: message }])
      setSyncState('Run failed')
    } finally {
      setAvatarState('idle')
    }
  }

  const handleAiAction = async (action) => {
    setAvatarState('thinking')
    setAiResponse('Agent is scanning the active editor, terminal output, and project hints with your configured AI provider...')
    const provider = activeProvider(settings)
    if (!hasProviderKey(settings)) {
      setAiResponse(`Add a ${provider} API key in Settings before using the Code agent.\n\nThe agent uses the same provider setup as Chat. Current model target: ${providerModel(settings)}.`)
      setAvatarState('idle')
      return
    }

    const actionPrompts = {
      explain: 'Explain the file clearly. Include purpose, key logic, risks, and suggested next steps.',
      fix: 'Find bugs, syntax errors, runtime risks, and missing validation. Give a focused patch plan and corrected snippets when helpful.',
      refactor: 'Suggest a refactor that improves readability and maintainability. Keep behavior the same unless you clearly mark a change.',
      generate: aiInput.trim() || 'Generate a useful code snippet or improvement for this file.',
    }

    try {
      const { data } = await pyApi.post('/completion', {
        system_prompt: settings.systemPrompt || `You are ${settings.avatarName || 'ARIA'}, a senior coding assistant inside MEZOMAI Code Studio.`,
        prompt: [
          `Action: ${action}`,
          `Instruction: ${actionPrompts[action]}`,
          `Workspace root: ${workspaceRoot}`,
          `File: ${activeFile.path || activeFile.name}`,
          `Language: ${activeFile.language || activeFile.lang}`,
          'Terminal context:',
          terminalLogs.slice(-8).map(log => `[${log.type}] ${log.text}`).join('\n') || 'No terminal output yet.',
          'Current file content:',
          '```',
          activeFile.content || '',
          '```',
        ].join('\n\n'),
        ...aiRequestConfig(settings),
      })
      if (action === 'fix') setBottomPanel('problems')
      if (action === 'refactor') setIsDiffMode(true)
      setAiResponse(data.response || 'The AI provider returned an empty response.')
    } catch (error) {
      setAiResponse(`Code agent request failed.\n\nProvider: ${provider}\nModel: ${providerModel(settings)}\nError: ${aiErrorMessage(error)}`)
    } finally {
      setAvatarState('idle')
    }
  }

  return (
    <div style={workspace} className="fade-in">
      <ActivityRail activity={activity} setActivity={setActivity}/>
      <SidePanel activity={activity} files={files} activeFileId={activeFileId} openFile={openFile} createFile={createFile} openLocalFolder={openLocalFolder} reconnectLocalFolder={() => restoreLocalWorkspace(true)} syncState={syncState} workspaceRoot={workspaceRoot} hasStoredWorkspace={hasStoredWorkspace}/>
      <main style={mainArea}>
        <TopBar activeFile={activeFile} runCode={runCode} openDiff={() => setIsDiffMode(true)} syncState={syncState} workspaceRoot={workspaceRoot}/>
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

function SidePanel({ activity, files, activeFileId, openFile, createFile, openLocalFolder, reconnectLocalFolder, syncState, workspaceRoot, hasStoredWorkspace }) {
  return (
    <aside style={sidePanel}>
      <div style={panelTitle}>{activity === 'explorer' ? 'Explorer' : activity === 'search' ? 'Search' : activity === 'source' ? 'Source Control' : 'Agent Context'}</div>
      {activity === 'explorer' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button onClick={openLocalFolder} style={smallBtn}>Open Folder</button>
            <button onClick={createFile} style={smallBtn}>New File</button>
          </div>
          {hasStoredWorkspace && (
            <button onClick={reconnectLocalFolder} style={smallBtn}>Reconnect Folder</button>
          )}
          <div style={folderName}>{workspaceRoot}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {files.map(file => <button key={file.id} onClick={() => openFile(file.id)} style={fileRow(activeFileId === file.id)}><span style={fileBadge}>{file.language.slice(0, 2).toUpperCase()}</span><span>{file.name}</span></button>)}
          </div>
          <div style={mutedBox}>{syncState}</div>
        </>
      )}
      {activity === 'search' && <div style={mutedBox}>Search UI is ready. Mounted folders read directly from the selected local directory.</div>}
      {activity === 'source' && <div style={mutedBox}>Local workspaces save to disk. Remote files still save through PHP file versions.</div>}
      {activity === 'agent' && <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>{AGENT_STEPS.map((step, index) => <div key={step} style={stepRow}><span>{index + 1}</span>{step}</div>)}</div>}
    </aside>
  )
}

function TopBar({ activeFile, runCode, openDiff, syncState, workspaceRoot }) {
  return (
    <div style={topBar}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <span style={crumb}>{workspaceRoot}</span><span style={crumbSep}>/</span><span style={crumb}>{activeFile.name}</span><span style={crumbSep}>{syncState}</span>
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
