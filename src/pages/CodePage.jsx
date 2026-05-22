import React, { useState } from 'react'
import { useStore } from '../store'
import AvatarFace from '../components/layout/AvatarFace'

const MOCK_FILES = [
  { id: 'f1', name: 'main.py', path: 'workspace/main.py', lang: 'python', content: `def greet(name):\n    print(f"Hello, {name}! Welcome to MEZOMAI AI Platform.")\n\ngreet("Aria Operator")\n` },
  { id: 'f2', name: 'utils.js', path: 'workspace/utils.js', lang: 'javascript', content: `function calcTokens(words) {\n  return Math.ceil(words * 1.33);\n}\nconsole.log("Estimated tokens for 100 words: " + calcTokens(100));\n` },
  { id: 'f3', name: 'styles.css', path: 'workspace/styles.css', lang: 'css', content: `.surface-card {\n  border: 1px solid #dfe5ee;\n  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);\n}\n` },
]

const AGENT_STEPS = [
  'Read active file and nearby context',
  'Detect runtime and syntax risks',
  'Prepare a focused patch',
  'Run validation and summarize changes',
]

const PROBLEMS = [
  { file: 'utils.js', line: 2, severity: 'hint', text: 'Token estimate is heuristic; document expected variance.' },
  { file: 'main.py', line: 1, severity: 'info', text: 'Add type hints before production execution.' },
]

export default function CodePage() {
  const { setAvatarState, avatarState } = useStore()
  const [files, setFiles] = useState(MOCK_FILES)
  const [activeFileId, setActiveFileId] = useState('f1')
  const [openTabs, setOpenTabs] = useState(['f1', 'f2'])
  const [aiInput, setAiInput] = useState('')
  const [aiResponse, setAiResponse] = useState('Ask the agent for a refactor, explanation, or bug sweep. Suggested changes will appear here.')
  const [terminalLogs, setTerminalLogs] = useState([{ type: 'info', text: 'MEZOMAI workspace ready. Select Run to execute the active file.' }])
  const [isDiffMode, setIsDiffMode] = useState(false)
  const [activity, setActivity] = useState('explorer')
  const [bottomPanel, setBottomPanel] = useState('terminal')

  const activeFile = files.find(f => f.id === activeFileId) || files[0]

  const updateFileContent = (val) => {
    setFiles(files.map(f => f.id === activeFile.id ? { ...f, content: val } : f))
  }

  const openFile = (fileId) => {
    setActiveFileId(fileId)
    if (!openTabs.includes(fileId)) setOpenTabs([...openTabs, fileId])
  }

  const runCode = () => {
    setBottomPanel('terminal')
    setAvatarState('thinking')
    setTerminalLogs(prev => [...prev, { type: 'info', text: `$ mezomai run ${activeFile.path}` }])

    setTimeout(() => {
      try {
        if (activeFile.lang === 'javascript') {
          const logs = []
          const originalLog = console.log
          console.log = (...args) => logs.push(args.join(' '))
          try {
            // eslint-disable-next-line no-eval
            eval(activeFile.content)
            console.log = originalLog
            setTerminalLogs(prev => [...prev, ...logs.map(l => ({ type: 'success', text: l })), { type: 'success', text: 'Process finished with exit code 0.' }])
          } catch (e) {
            console.log = originalLog
            setTerminalLogs(prev => [...prev, { type: 'error', text: `RuntimeError: ${e.message}` }])
          }
        } else if (activeFile.lang === 'python') {
          setTerminalLogs(prev => [...prev, { type: 'success', text: 'Hello, Aria Operator! Welcome to MEZOMAI AI Platform.' }, { type: 'success', text: 'Process finished with exit code 0.' }])
        } else {
          setTerminalLogs(prev => [...prev, { type: 'info', text: 'Static assets cannot be compiled in this local demo.' }])
        }
        setAvatarState('talking')
        setTimeout(() => setAvatarState('idle'), 1400)
      } catch (err) {
        setTerminalLogs(prev => [...prev, { type: 'error', text: err.message }])
        setAvatarState('idle')
      }
    }, 650)
  }

  const handleAiAction = (action) => {
    setAvatarState('thinking')
    setAiResponse('Agent is scanning the active editor, terminal output, and project hints...')

    setTimeout(() => {
      if (action === 'explain') {
        setAiResponse(`Summary for ${activeFile.name}\n\nThis ${activeFile.lang} file is part of the local workspace demo. The current logic is small and readable. Production hardening should add stronger validation and real backend execution boundaries.`)
      } else if (action === 'fix') {
        setBottomPanel('problems')
        setAiResponse(`Bug sweep completed\n\nNo blocking syntax errors found. I flagged ${PROBLEMS.length} improvement notes in the Problems panel.`)
      } else if (action === 'refactor') {
        setIsDiffMode(true)
        setAiResponse(`Patch prepared for ${activeFile.name}\n\nDiff view is open. Review the proposed typed function and clearer output string before applying changes.`)
      } else {
        setAiResponse(`Generated snippet for ${activeFile.name}\n\nconsole.log("Telemetry check active...");\n\nUse this in a runtime diagnostics block or move it behind a debug flag.`)
      }
      setAvatarState('talking')
      setTimeout(() => setAvatarState('idle'), 1200)
    }, 850)
  }

  return (
    <div style={workspace} className="fade-in">
      <ActivityRail activity={activity} setActivity={setActivity}/>
      <SidePanel activity={activity} files={files} activeFileId={activeFileId} openFile={openFile}/>

      <main style={mainArea}>
        <TopBar activeFile={activeFile} runCode={runCode} openDiff={() => setIsDiffMode(true)}/>
        <TabBar files={files} openTabs={openTabs} setOpenTabs={setOpenTabs} activeFileId={activeFileId} setActiveFileId={setActiveFileId}/>
        <Editor activeFile={activeFile} isDiffMode={isDiffMode} setIsDiffMode={setIsDiffMode} updateFileContent={updateFileContent}/>
        <BottomPanel panel={bottomPanel} setPanel={setBottomPanel} logs={terminalLogs} setLogs={setTerminalLogs}/>
        <StatusBar activeFile={activeFile} avatarState={avatarState}/>
      </main>

      <AgentPanel
        aiInput={aiInput}
        setAiInput={setAiInput}
        aiResponse={aiResponse}
        handleAiAction={handleAiAction}
        activeFile={activeFile}
      />
    </div>
  )
}

function ActivityRail({ activity, setActivity }) {
  const items = [['explorer', 'EX'], ['search', 'SR'], ['source', 'SC'], ['agent', 'AI']]
  return (
    <aside style={activityRail}>
      {items.map(([id, label]) => (
        <button key={id} onClick={() => setActivity(id)} title={id} style={railBtn(activity === id)}>
          {label}
        </button>
      ))}
    </aside>
  )
}

function SidePanel({ activity, files, activeFileId, openFile }) {
  return (
    <aside style={sidePanel}>
      <div style={panelTitle}>{activity === 'explorer' ? 'Explorer' : activity === 'search' ? 'Search' : activity === 'source' ? 'Source Control' : 'Agent Context'}</div>
      {activity === 'explorer' && (
        <>
          <div style={folderName}>MEZOMAI-WORKSPACE</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {files.map(file => (
              <button key={file.id} onClick={() => openFile(file.id)} style={fileRow(activeFileId === file.id)}>
                <span style={fileBadge}>{file.lang.slice(0, 2).toUpperCase()}</span>
                <span>{file.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
      {activity === 'search' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input placeholder="Search files" style={{ fontSize: 12 }}/>
          <div style={mutedBox}>No search query yet. Search is scoped to the open workspace.</div>
        </div>
      )}
      {activity === 'source' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={changeItem}>M src/pages/CodePage.jsx</div>
          <div style={changeItem}>M src/index.css</div>
          <div style={mutedBox}>2 working tree changes detected.</div>
        </div>
      )}
      {activity === 'agent' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {AGENT_STEPS.map((step, index) => <div key={step} style={stepRow}><span>{index + 1}</span>{step}</div>)}
        </div>
      )}
    </aside>
  )
}

function TopBar({ activeFile, runCode, openDiff }) {
  return (
    <div style={topBar}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <span style={crumb}>workspace</span>
        <span style={crumbSep}>/</span>
        <span style={crumb}>{activeFile.name}</span>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={openDiff} style={toolbarBtn}>Diff Preview</button>
        <button onClick={runCode} className="gold-glow-btn" style={{ ...toolbarBtn, border: 'none', color: '#fff' }}>Run</button>
      </div>
    </div>
  )
}

function TabBar({ files, openTabs, setOpenTabs, activeFileId, setActiveFileId }) {
  return (
    <div style={tabBar}>
      {openTabs.map(tabId => {
        const file = files.find(f => f.id === tabId)
        if (!file) return null
        const isActive = activeFileId === tabId
        return (
          <button key={tabId} style={tabStyle(isActive)} onClick={() => setActiveFileId(tabId)}>
            <span>{file.name}</span>
            <span onClick={(e) => {
              e.stopPropagation()
              setOpenTabs(openTabs.filter(t => t !== tabId))
              if (activeFileId === tabId && openTabs.length > 1) setActiveFileId(openTabs.find(t => t !== tabId))
            }} style={{ opacity: 0.55 }}>x</span>
          </button>
        )
      })}
    </div>
  )
}

function Editor({ activeFile, isDiffMode, setIsDiffMode, updateFileContent }) {
  return (
    <section style={editorShell}>
      {isDiffMode ? (
        <div style={diffGrid}>
          <div style={diffHeader}>
            <span style={{ color: 'var(--red)' }}>Original</span>
            <span style={{ color: 'var(--green)' }}>Agent Proposal</span>
            <button onClick={() => setIsDiffMode(false)} style={smallBtn}>Close Diff</button>
          </div>
          <pre style={diffPane}>{`def greet(name):\n    print(f"Hello, {name}! Welcome to MEZOMAI AI Platform.")`}</pre>
          <pre style={{ ...diffPane, borderColor: 'rgba(22,163,74,.35)' }}>{`def greet(name: str) -> None:\n    message = f"Hello, {name}! Ready to code in MEZOMAI."\n    print(message)`}</pre>
        </div>
      ) : (
        <div style={editorWrap}>
          <LineNumbers content={activeFile.content}/>
          <textarea value={activeFile?.content || ''} onChange={e => updateFileContent(e.target.value)} style={editorStyle} spellCheck={false}/>
        </div>
      )}
    </section>
  )
}

function LineNumbers({ content }) {
  const count = Math.max(content.split('\n').length, 12)
  return (
    <div style={lineNumbers}>
      {Array.from({ length: count }, (_, i) => <div key={i}>{i + 1}</div>)}
    </div>
  )
}

function BottomPanel({ panel, setPanel, logs, setLogs }) {
  return (
    <section style={bottomPanelStyle}>
      <div style={bottomTabs}>
        {['terminal', 'problems', 'output'].map(id => <button key={id} onClick={() => setPanel(id)} style={bottomTab(panel === id)}>{id}</button>)}
        <button onClick={() => setLogs([])} style={{ ...smallBtn, marginLeft: 'auto' }}>Clear</button>
      </div>
      <div style={terminalBody}>
        {panel === 'terminal' && logs.map((log, i) => <div key={i} style={{ color: log.type === 'error' ? 'var(--red)' : log.type === 'success' ? 'var(--green)' : 'var(--t2)' }}>{log.text}</div>)}
        {panel === 'problems' && PROBLEMS.map((p) => <div key={`${p.file}-${p.line}`} style={{ color: p.severity === 'hint' ? 'var(--amber)' : 'var(--cyan)' }}>{p.file}:{p.line} - {p.text}</div>)}
        {panel === 'output' && <div style={{ color: 'var(--t3)' }}>No background task output yet.</div>}
      </div>
    </section>
  )
}

function AgentPanel({ aiInput, setAiInput, aiResponse, handleAiAction, activeFile }) {
  return (
    <aside style={agentPane}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, paddingBottom: 16, borderBottom: '1px solid var(--b1)' }}>
        <AvatarFace size={82}/>
        <div style={{ fontFamily: 'var(--ff-display)', fontSize: 15, fontWeight: 800 }}>MEZOMAI Agent</div>
        <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 9, color: 'var(--t3)' }}>Context: {activeFile.name}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
        <button onClick={() => handleAiAction('explain')} style={assistBtn}>Explain</button>
        <button onClick={() => handleAiAction('fix')} style={assistBtn}>Fix Bugs</button>
        <button onClick={() => handleAiAction('refactor')} style={assistBtn}>Refactor</button>
        <button onClick={() => handleAiAction('generate')} style={assistBtn}>Generate</button>
      </div>

      <div style={agentCard}>
        <div style={sectionLabel}>Agent Plan</div>
        {AGENT_STEPS.map((step, index) => <div key={step} style={agentStep}><span>{index + 1}</span>{step}</div>)}
      </div>

      <textarea value={aiInput} onChange={e => setAiInput(e.target.value)} placeholder="Ask for a patch, test, or explanation..." style={agentInput}/>
      <div style={aiResponseBox}>{aiResponse}</div>
    </aside>
  )
}

function StatusBar({ activeFile, avatarState }) {
  return (
    <footer style={statusBar}>
      <span>main</span>
      <span>{activeFile.lang}</span>
      <span>UTF-8</span>
      <span>Spaces: 2</span>
      <span style={{ marginLeft: 'auto' }}>Agent: {avatarState}</span>
    </footer>
  )
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
const changeItem = { background: 'var(--bg2)', border: '1px solid var(--b1)', borderRadius: 8, padding: '8px 10px', fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--t2)' }
const stepRow = { background: 'var(--bg2)', border: '1px solid var(--b1)', borderRadius: 8, padding: '8px 10px', display: 'flex', gap: 8, fontSize: 11, color: 'var(--t2)' }
const mainArea = { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: '1px solid var(--b1)' }
const topBar = { height: 46, background: 'var(--bg1)', borderBottom: '1px solid var(--b1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', flexShrink: 0 }
const crumb = { fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--t2)' }
const crumbSep = { color: 'var(--t3)' }
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
const assistBtn = { background: 'var(--bg2)', border: '1px solid var(--b1)', padding: '8px 5px', fontSize: 10, fontFamily: 'var(--ff-display)', fontWeight: 800, color: 'var(--t1)', cursor: 'pointer' }
const agentCard = { background: 'var(--bg2)', border: '1px solid var(--b1)', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }
const sectionLabel = { fontFamily: 'var(--ff-mono)', fontSize: 9, color: 'var(--t3)', letterSpacing: '.12em', textTransform: 'uppercase' }
const agentStep = { display: 'flex', gap: 8, color: 'var(--t2)', fontSize: 11, lineHeight: 1.4 }
const agentInput = { width: '100%', minHeight: 74, fontSize: 12, resize: 'vertical' }
const aiResponseBox = { flex: 1, minHeight: 130, background: 'var(--bg2)', border: '1px solid var(--b1)', borderRadius: 10, padding: 12, fontSize: 12, color: 'var(--t2)', overflowY: 'auto', lineHeight: 1.5, whiteSpace: 'pre-wrap' }
const statusBar = { height: 26, background: 'var(--gold)', color: '#fff', display: 'flex', alignItems: 'center', gap: 16, padding: '0 12px', fontFamily: 'var(--ff-mono)', fontSize: 10, flexShrink: 0 }
const smallBtn = { border: '1px solid var(--b1)', background: 'var(--bg1)', color: 'var(--t2)', fontSize: 10, padding: '5px 10px', borderRadius: 6 }
