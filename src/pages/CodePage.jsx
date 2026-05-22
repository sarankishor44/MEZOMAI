import React, { useState } from 'react'
import { useStore } from '../store'
import AvatarFace from '../components/layout/AvatarFace'

const MOCK_FILES = [
  { id: 'f1', name: 'main.py', path: '/main.py', lang: 'python', content: `def greet(name):\n    print(f"Hello, {name}! Welcome to MEZOMAI AI Platform.")\n\ngreet("Aria Operator")\n` },
  { id: 'f2', name: 'utils.js', path: '/utils.js', lang: 'javascript', content: `function calcTokens(words) {\n  return Math.ceil(words * 1.33);\n}\nconsole.log("Estimated tokens for 100 words: " + calcTokens(100));\n` },
  { id: 'f3', name: 'styles.css', path: '/styles.css', lang: 'css', content: `/* Luxury Gold Styling */\n.gold-accent {\n  color: #d4af37;\n  box-shadow: 0 0 10px rgba(212, 175, 55, 0.3);\n}\n` },
]

export default function CodePage() {
  const { setAvatarState, avatarState } = useStore()
  const [files, setFiles] = useState(MOCK_FILES)
  const [activeFileId, setActiveFileId] = useState('f1')
  const [openTabs, setOpenTabs] = useState(['f1', 'f2'])
  const [aiInput, setAiInput] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [terminalLogs, setTerminalLogs] = useState([{ type: 'info', text: 'System shell initialized. Press RUN to execute code.' }])
  const [isDiffMode, setIsDiffMode] = useState(false)

  const activeFile = files.find(f => f.id === activeFileId) || files[0]

  const updateFileContent = (val) => {
    setFiles(files.map(f => f.id === activeFile.id ? { ...f, content: val } : f))
  }

  const runCode = () => {
    setAvatarState('thinking')
    setTerminalLogs(prev => [...prev, { type: 'info', text: `$ running ${activeFile.name}...` }])
    
    setTimeout(() => {
      try {
        if (activeFile.lang === 'javascript') {
          // JS runner in browser
          const logs = []
          const originalLog = console.log
          console.log = (...args) => logs.push(args.join(' '))
          
          try {
            // eslint-disable-next-line no-eval
            eval(activeFile.content)
            console.log = originalLog
            setTerminalLogs(prev => [
              ...prev,
              ...logs.map(l => ({ type: 'success', text: l })),
              { type: 'success', text: 'Process finished with exit code 0.' }
            ])
            setAvatarState('talking')
            setTimeout(() => setAvatarState('idle'), 1500)
          } catch (e) {
            console.log = originalLog
            setTerminalLogs(prev => [
              ...prev,
              { type: 'error', text: `ReferenceError: ${e.message}` }
            ])
            setAvatarState('talking')
            setTimeout(() => setAvatarState('idle'), 2000)
          }
        } else if (activeFile.lang === 'python') {
          // Pyodide simulated runner (runs standard outputs nicely)
          let outputText = "Hello, Aria Operator! Welcome to MEZOMAI AI Platform.\n"
          if (activeFile.content.includes('def') && activeFile.content.includes('print')) {
            // dynamic mock print extractor if present
            const match = activeFile.content.match(/print\((f?["'])(.*?)\1\)/)
            if (match && match[2]) {
              outputText = match[2].replace(/{name}/g, 'Aria Operator') + '\n'
            }
          }
          setTerminalLogs(prev => [
            ...prev,
            { type: 'success', text: outputText.trim() },
            { type: 'success', text: 'Process finished with exit code 0.' }
          ])
          setAvatarState('talking')
          setTimeout(() => setAvatarState('idle'), 1500)
        } else {
          setTerminalLogs(prev => [...prev, { type: 'info', text: 'Static assets cannot be compiled. Only Python & Javascript are executable.' }])
          setAvatarState('idle')
        }
      } catch (err) {
        setTerminalLogs(prev => [...prev, { type: 'error', text: err.message }])
        setAvatarState('idle')
      }
    }, 800)
  }

  const handleAiAction = (action) => {
    setAvatarState('thinking')
    setAiResponse('Analyzing script details...')
    
    setTimeout(() => {
      if (action === 'explain') {
        setAiResponse(`This ${activeFile.lang} module defines functions to execute operations. In the editor, I see lines of declarations that compile and print the output to console logs.`)
      } else if (action === 'fix') {
        setAiResponse(`No syntax errors detected in ${activeFile.name}. Refinement: I have standardized spacing and indentation!`)
      } else if (action === 'refactor') {
        setIsDiffMode(true)
        setAiResponse(`Proposed structural update to ${activeFile.name} is visible in Diff View. Review lines before merging changes.`)
      } else {
        setAiResponse(`Here is a generated booster snippet for ${activeFile.name}:\n\n// Added security sanitation filters\nconsole.log("Telemetry check active...");`)
      }
      setAvatarState('talking')
    }, 1200)
  }

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }} className="fade-in">
      
      {/* ── FILE TREE LEFT PANEL ── */}
      <div style={{ width: 220, background: 'var(--bg1)', borderRight: '1px solid var(--b1)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--b1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--ff-display)', fontSize: 13, fontWeight: 700, color: 'var(--gold)' }}>File Explorer</span>
          <button style={{ border: 'none', background: 'none', color: 'var(--t3)', fontSize: 16 }}>+</button>
        </div>
        <div style={{ flex: 1, padding: 12, display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto' }}>
          {files.map(f => (
            <div key={f.id} onClick={() => {
              setActiveFileId(f.id)
              if (!openTabs.includes(f.id)) setOpenTabs([...openTabs, f.id])
            }} style={{
              padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12,
              background: activeFileId === f.id ? 'var(--gold-light)' : 'transparent',
              color: activeFileId === f.id ? 'var(--gold)' : 'var(--t2)',
              border: `1px solid ${activeFileId === f.id ? 'var(--b1)' : 'transparent'}`,
              fontFamily: 'var(--ff-mono)', display: 'flex', alignItems: 'center', gap: 8
            }}>
              <span>{f.lang === 'python' ? '🐍' : f.lang === 'javascript' ? '⚡' : '🎨'}</span>
              <span>{f.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── EDITOR CENTER PANEL ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: '1px solid var(--b1)' }}>
        
        {/* Tabs Bar */}
        <div style={{ height: 40, background: 'var(--bg1)', borderBottom: '1px solid var(--b1)', display: 'flex', overflowX: 'auto', flexShrink: 0 }}>
          {openTabs.map(tabId => {
            const file = files.find(f => f.id === tabId)
            if (!file) return null
            const isActive = activeFileId === tabId
            return (
              <div key={tabId} style={{
                padding: '0 16px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                background: isActive ? 'var(--bg)' : 'var(--bg1)', fontSize: 12,
                color: isActive ? 'var(--gold)' : 'var(--t3)',
                borderRight: '1px solid var(--b1)', fontFamily: 'var(--ff-mono)', borderBottom: isActive ? '2px solid var(--gold)' : 'none'
              }} onClick={() => setActiveFileId(tabId)}>
                <span>{file.name}</span>
                <span onClick={(e) => {
                  e.stopPropagation()
                  setOpenTabs(openTabs.filter(t => t !== tabId))
                  if (activeFileId === tabId && openTabs.length > 1) {
                    setActiveFileId(openTabs.find(t => t !== tabId))
                  }
                }} style={{ opacity: 0.5, fontSize: 10 }}>×</span>
              </div>
            )
          })}
        </div>

        {/* Editing Area */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', background: 'var(--bg)', position: 'relative' }}>
          {isDiffMode ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 20, fontFamily: 'var(--ff-mono)', fontSize: 13, overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--b1)', paddingBottom: 8, marginBottom: 12 }}>
                <span style={{ color: 'var(--red)' }}>- Removed line</span>
                <span style={{ color: 'var(--green)' }}>+ Added line (Refactored)</span>
                <button onClick={() => setIsDiffMode(false)} style={{ background: 'var(--gold)', color: '#000', border: 'none', padding: '4px 8px', borderRadius: 4, fontSize: 11 }}>Exit Diff</button>
              </div>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                <span style={{ color: 'var(--t3)' }}>1: // Refactored code structure</span>{'\n'}
                <span style={{ color: 'var(--red)', background: 'rgba(255,71,87,0.1)' }}>- def greet(name):{'\n'}-     print(f"Hello, " + name)</span>{'\n'}
                <span style={{ color: 'var(--green)', background: 'rgba(0,230,118,0.1)' }}>{"+ def greet(name: str) -> None:"}{'\n'}{"+     print(f\"Hello, {name}! Ready to code.\")"}</span>
              </div>
            </div>
          ) : (
            <textarea
              value={activeFile?.content || ''}
              onChange={e => updateFileContent(e.target.value)}
              style={{
                flex: 1, border: 'none', background: 'var(--bg)', outline: 'none', resize: 'none',
                fontFamily: 'var(--ff-mono)', fontSize: 13, color: 'var(--t1)', padding: 20,
                lineHeight: 1.6
              }}
            />
          )}
        </div>

        {/* Console Terminal */}
        <div style={{ height: 160, background: 'var(--bg1)', borderTop: '1px solid var(--b1)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '8px 20px', borderBottom: '1px solid var(--b1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg2)', flexShrink: 0 }}>
            <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Execution Logs</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setTerminalLogs([])} style={{ border: '1px solid var(--b1)', background: 'none', color: 'var(--t2)', fontSize: 10, padding: '3px 8px', borderRadius: 4 }}>Clear</button>
              <button onClick={runCode} className="gold-glow-btn" style={{ border: 'none', fontSize: 10, padding: '3px 12px', borderRadius: 4 }}>RUN SCRIPT</button>
            </div>
          </div>
          <div style={{ flex: 1, padding: '12px 20px', overflowY: 'auto', fontFamily: 'var(--ff-mono)', fontSize: 11, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {terminalLogs.map((log, i) => (
              <div key={i} style={{ color: log.type === 'error' ? 'var(--red)' : log.type === 'success' ? 'var(--green)' : 'var(--t2)' }}>
                {log.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── AI ASSIST DRAWER PANEL ── */}
      <div style={{ width: 260, background: 'var(--bg1)', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, paddingBottom: 16, borderBottom: '1px solid var(--b1)' }}>
          <AvatarFace size={90}/>
          <div style={{ fontFamily: 'var(--ff-display)', fontSize: 15, fontWeight: 700, color: 'var(--gold)' }}>AI Assist Terminal</div>
          <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 9, color: 'var(--t3)' }}>Reacts dynamically to terminal runtimes</div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <button onClick={() => handleAiAction('explain')} style={assistBtn}>Explain Code</button>
          <button onClick={() => handleAiAction('fix')} style={assistBtn}>Fix Bugs</button>
          <button onClick={() => handleAiAction('refactor')} style={assistBtn}>Refactor</button>
          <button onClick={() => handleAiAction('generate')} style={assistBtn}>Booster Gen</button>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden' }}>
          <textarea
            value={aiInput} onChange={e => setAiInput(e.target.value)}
            placeholder="Ask agent about the code..."
            style={{ width: '100%', height: 60, background: 'var(--bg2)', border: '1px solid var(--b1)', borderRadius: 8, fontSize: 11, resize: 'none' }}
          />
          <div style={{
            flex: 1, background: 'var(--bg2)', border: '1px solid var(--b1)', borderRadius: 8, padding: 12,
            fontSize: 11, color: 'var(--t2)', overflowY: 'auto', lineHeight: 1.4, whiteSpace: 'pre-wrap'
          }}>
            {aiResponse || "No current recommendations. Select a script action or ask a custom question."}
          </div>
        </div>
      </div>
    </div>
  )
}

const assistBtn = {
  flex: '1 1 45%', background: 'var(--bg2)', border: '1px solid var(--b1)', borderRadius: 6,
  padding: '6px 4px', fontSize: 10, fontFamily: 'var(--ff-display)', fontWeight: 700, color: 'var(--t1)', cursor: 'pointer'
}
