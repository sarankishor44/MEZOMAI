# 🤖 AI Character Platform

 HEAD
A full **real-time AI character platform** — animated avatar, live chat, code IDE, video meetings, and analytics. Bring your own API keys, everything else is **free**.

> A full real-time AI character platform — animated avatar, live chat, code IDE, video meetings, and analytics. Bring your own API keys, everything else is free.

![AI Character Platform](https://pollinations.ai/p/futuristic%20dark%20AI%20character%20platform%20dashboard%20with%20animated%20avatar?width=1200&height=400&nologo=true)

---
8362782 (your message)

## ✨ Features

| Feature | Description |
|---|---|
| 🧍 **Animated Avatar** | SVG face with lip-sync, blinking, emotions, glow ring |
| 💬 **AI Chat** | Real-time Claude streaming, voice in/out, memory |
| 💻 **Code IDE** | File tree, editor, AI assist, terminal, run JS/Python |
| 🎥 **Video Meetings** | Daily.co rooms, avatar as video participant, transcript |
| ⚡ **Quick Join Bar** | Paste any Zoom/Meet/Teams link → instant bot setup |
| 📊 **Analytics** | Sessions, token usage, cost estimate, meeting history |
| 🔑 **Settings** | Manage API keys, voice, personality, avatar config |

---

<<<<<<< HEAD
## 🧩 Full Components — Every Piece of the Project

## 📊 Big Picture — All Layers

```text
AI CHARACTER PLATFORM
│
├── 🖥️  FRONTEND          (React + Vite)
├── 🐘  BACKEND PHP       (Laravel — REST API + Auth)
├── 🐍  BACKEND PYTHON    (FastAPI — AI + WebSockets)
├── 🗄️  DATABASE          (MySQL — all data)
├── 🔴  CACHE             (Redis — sessions + realtime)
└── 🐳  DEVOPS            (Docker + Compose)
```

---

## 🖥️ Frontend — React Components

### Layout System

```text
Sidebar.jsx                 Fixed left nav, always visible
├── SidebarLogo.jsx         App name + version
├── SidebarAvatar.jsx       Mini avatar + username
│   ├── AvatarMini.jsx      Small SVG face
│   └── StatusDot.jsx       Colored live status dot
├── SidebarNav.jsx          Navigation links
│   └── NavItem.jsx         Single link with icon + label
├── SidebarCredits.jsx      Token usage meter
│   └── UsageMeter.jsx      Progress bar + numbers
└── StatusBadge.jsx         idle/listening/thinking/talking

PageShell.jsx               Right side content wrapper
├── PageHeader.jsx          Title + breadcrumb + actions
└── PageContent.jsx         Scrollable main area
```

### Dashboard Components

```text
DashboardPage.jsx
│
├── QuickJoinBar.jsx         ⚡ Paste meeting link → join
│   ├── LinkInput.jsx        URL text field
│   ├── PlatformBadge.jsx    Zoom/Meet/Teams icon + name
│   ├── QuickJoinButton.jsx  → navigates to meetings page
│   └── RecentLinks.jsx      Last 5 links from localStorage
│       └── RecentLinkChip.jsx  Clickable past link pill
│
├── AvatarHero.jsx           Large center avatar
│   ├── AvatarFace.jsx       Full SVG face
│   │   ├── AvatarEyes.jsx   Blinking, emotion, tracking
│   │   ├── AvatarMouth.jsx  Lip-sync states
│   │   ├── AvatarBrows.jsx  Eyebrow emotion expressions
│   │   └── AvatarGlow.jsx   Colored ring by state
│   ├── AvatarName.jsx       Character name display
│   └── AvatarStateLabel.jsx idle/listening/thinking/talking
│
├── StatsBar.jsx             4 stat cards in a row
│   └── StatCard.jsx × 4
│       ├── StatIcon.jsx
│       ├── StatValue.jsx
│       └── StatLabel.jsx
│
├── SkillCards.jsx           Grid of capability cards
│   └── SkillCard.jsx × 6
│       ├── SkillIcon.jsx
│       ├── SkillTitle.jsx
│       ├── SkillDesc.jsx
│       └── SkillStatus.jsx  active/inactive badge
│
├── ActivityFeed.jsx         Recent interactions list
│   ├── ActivityHeader.jsx
│   └── ActivityItem.jsx × N
│       ├── ActivityIcon.jsx
│       ├── ActivityText.jsx
│       └── ActivityTime.jsx
│
└── QuickActions.jsx         CTA buttons row
    ├── StartChatButton.jsx
    └── StartMeetingButton.jsx
```

### Chat Components

```text
ChatPage.jsx
│
├── ChatAvatarPanel.jsx      Right panel — avatar reacts
│   ├── AvatarMedium.jsx     Medium sized avatar
│   ├── PersonalitySelector.jsx  Friendly/Dev/Coach/Pro
│   │   └── PersonalityOption.jsx
│   ├── MemoryToggle.jsx     ON/OFF for chat memory
│   ├── VoiceToggle.jsx      ON/OFF for voice output
│   └── ClearHistoryBtn.jsx
│
├── MessageList.jsx          Scrollable chat history
│   ├── MessageBubble.jsx    Single message (user or agent)
│   │   ├── BubbleAvatar.jsx Small icon left of message
│   │   ├── BubbleContent.jsx Text or rich content
│   │   │   ├── TextContent.jsx  Plain text message
│   │   │   ├── CodeBlock.jsx    Syntax highlighted code
│   │   │   └── ImageContent.jsx Uploaded image preview
│   │   ├── BubbleTime.jsx   Timestamp
│   │   └── BubbleCopy.jsx   Copy button on hover
│   ├── TypingIndicator.jsx  Animated dots (streaming)
│   └── DateDivider.jsx      Date separator between messages
│
├── StreamingText.jsx        Token-by-token text renderer
│
└── ChatInputBar.jsx         Bottom input area
    ├── MicButton.jsx        Hold → SpeechRecognition
    │   ├── MicIcon.jsx
    │   └── MicWaveform.jsx  Animated while listening
    ├── MessageInput.jsx     Textarea (auto-resize)
    ├── AttachButton.jsx     Image upload for vision
    │   └── ImagePreview.jsx Thumbnail before send
    └── SendButton.jsx       Submit message
```

### Code IDE Components

```text
CodePage.jsx
│
├── FileTree.jsx             Left panel — file browser
│   ├── FileTreeHeader.jsx   Title + new file/folder btns
│   ├── FileTreeFolder.jsx   Collapsible folder
│   └── FileTreeItem.jsx     Single file row
│       ├── FileIcon.jsx     Type-based icon
│       ├── FileName.jsx     Editable on double-click
│       └── FileActions.jsx  Rename / delete on hover
│
├── EditorArea.jsx           Center — main editor
│   ├── EditorTabs.jsx       Open file tabs bar
│   │   └── EditorTab.jsx    Single tab + close btn
│   │       └── UnsavedDot.jsx  -  if unsaved changes
│   ├── CodeEditor.jsx       Main text editing area
│   │   ├── LineNumbers.jsx  Left gutter numbers
│   │   ├── EditorTextarea.jsx  Actual input
│   │   └── SyntaxHighlight.jsx  Colored keywords overlay
│   └── DiffView.jsx         AI change comparison
│       ├── DiffHeader.jsx   Before / After labels
│       ├── DiffOldLine.jsx  Red — removed lines
│       └── DiffNewLine.jsx  Green — added lines
│
├── AIAssistPanel.jsx        Right panel — AI helper
│   ├── AIAssistHeader.jsx
│   ├── AIAssistInput.jsx    Ask agent about code
│   ├── AIAssistResponse.jsx Agent's answer
│   └── AIActionButtons.jsx
│       ├── FixButton.jsx
│       ├── ExplainButton.jsx
│       ├── RefactorButton.jsx
│       └── GenerateButton.jsx
│
└── Terminal.jsx             Bottom panel — output
    ├── TerminalHeader.jsx   Title + controls
    ├── TerminalOutput.jsx   Command history + results
    │   ├── TerminalLine.jsx  Single output line
    │   ├── ErrorLine.jsx    Red error lines
    │   └── SuccessLine.jsx  Green success lines
    ├── TerminalInput.jsx    $ command input
    └── TerminalActions.jsx
        ├── RunButton.jsx    Execute current file
        ├── ClearButton.jsx
        └── AskAIButton.jsx  Send output to AI
```

### Meetings Components

```text
MeetingsPage.jsx
│
├── ── STATE A: CONFIGURE ──────────────────────────
│
├── MeetConfig.jsx           Setup before joining
│   ├── LinkInput.jsx        Paste meeting URL
│   ├── PlatformDetector.jsx Auto-detect + show badge
│   │   └── PlatformBadge.jsx  🟢 Google Meet etc
│   ├── BotNameInput.jsx
│   ├── PersonalityDropdown.jsx
│   ├── VoiceDropdown.jsx    Browser voice selector
│   ├── SystemPromptInput.jsx  Custom bot instructions
│   └── JoinButton.jsx       Start room → state B
│
├── RecentMeetings.jsx       Past meetings list
│   └── RecentMeetingRow.jsx
│       ├── MeetingDate.jsx
│       ├── MeetingDuration.jsx
│       ├── MeetingPlatform.jsx
│       └── ViewNotesBtn.jsx
│
├── ── STATE B: IN CALL ────────────────────────────
│
├── MeetingHeader.jsx        Live indicator + timer
│   ├── LiveDot.jsx          Pulsing red dot
│   ├── CallTimer.jsx        00:12:34 counter
│   └── RoomLinkCopy.jsx     Copy shareable link
│
├── VideoGrid.jsx            Participant video tiles
│   ├── UserVideoTile.jsx    User webcam feed
│   │   └── VideoElement.jsx  <video> tag
│   └── AvatarVideoTile.jsx  AI avatar as participant
│       ├── AvatarCanvas.jsx  Canvas → video stream
│       └── SpeakingIndicator.jsx  Green ring when talking
│
├── TranscriptPanel.jsx      Live conversation log
│   ├── TranscriptHeader.jsx
│   └── TranscriptLine.jsx × N
│       ├── SpeakerLabel.jsx  You / ARIA
│       ├── TranscriptText.jsx
│       └── TranscriptTime.jsx
│
├── MeetingControls.jsx      Bottom action bar
│   ├── MuteButton.jsx       Toggle mic
│   ├── CamButton.jsx        Toggle webcam
│   ├── TasksButton.jsx      Open tasks panel
│   ├── NotesButton.jsx      Open notes panel
│   └── LeaveButton.jsx      End call → state C
│
├── TasksPanel.jsx           Slide-in tasks sidebar
│   ├── TaskInput.jsx        Ask agent to do something
│   └── TaskItem.jsx × N     Task + status
│
├── ── STATE C: POST CALL ──────────────────────────
│
└── PostCallSummary.jsx      After meeting ends
    ├── SummaryHeader.jsx    Duration + date
    ├── MeetingNotes.jsx     Claude-generated notes
    │   ├── SummarySection.jsx
    │   ├── KeyPointsList.jsx
    │   └── ActionItemsList.jsx
    │       └── ActionItem.jsx  Checkbox + text
    ├── DownloadNotesBtn.jsx  Save as .txt
    └── NewMeetingBtn.jsx    Back to configure
```

### Analytics Components

```text
AnalyticsPage.jsx
│
├── AnalyticsHeader.jsx      Title + date range selector
│   └── DateRangePicker.jsx  7d / 30d / 90d / all
│
├── SessionsChart.jsx        Sessions over time
│   └── recharts LineChart
│
├── UsageRow.jsx             Two charts side by side
│   ├── TokenUsageChart.jsx  Bar chart per conversation
│   └── CostEstimate.jsx     $ cost breakdown
│       ├── CostTotal.jsx
│       └── CostBreakdown.jsx  input/output tokens
│
├── ResourceBars.jsx         Quota progress bars
│   └── ResourceBar.jsx × N
│       ├── ResourceLabel.jsx
│       ├── ResourceProgress.jsx  Colored bar
│       └── ResourceNumbers.jsx   used / total
│
└── MeetingHistory.jsx       Full meetings table
    ├── MeetingTableHeader.jsx
    └── MeetingHistoryRow.jsx × N
        ├── MeetingDate.jsx
        ├── MeetingDuration.jsx
        ├── MeetingMessages.jsx
        ├── MeetingPlatform.jsx
        └── MeetingNotesBtn.jsx
```

### Settings Components

```text
SettingsPage.jsx
│
├── APIKeySection.jsx        API key management
│   └── APIKeyInput.jsx      Single key field
│       ├── KeyLabel.jsx     Provider name + logo
│       ├── KeyField.jsx     Masked input (- - - - )
│       ├── ShowHideBtn.jsx  👁 toggle visibility
│       └── TestKeyBtn.jsx   Live connection test
│           └── TestResult.jsx  ✅ / ❌ + message
│
├── ModelSection.jsx         AI model config
│   ├── ModelSelector.jsx    Dropdown of Claude models
│   └── ModelInfo.jsx        Speed/cost info per model
│
├── VoiceSection.jsx         Voice settings
│   ├── VoiceSelector.jsx    Browser voice dropdown
│   ├── SpeedSlider.jsx      0.5x → 2.0x
│   ├── PitchSlider.jsx      0.5 → 2.0
│   └── TestVoiceBtn.jsx     Speak sample phrase
│
├── AvatarSection.jsx        Avatar customization
│   ├── NameInput.jsx        Character name
│   ├── StylePicker.jsx      Cyan / Purple / Coral dots
│   ├── AvatarPreview.jsx    Live preview of avatar
│   └── GenerateImageBtn.jsx  Pollinations.ai gen
│
├── PersonalitySection.jsx   System prompt
│   ├── SystemPromptEditor.jsx  Large textarea
│   └── PersonalityPresets.jsx  Quick preset buttons
│
└── DataSection.jsx          Data management
    ├── ExportDataBtn.jsx    Download all as JSON
    ├── ClearHistoryBtn.jsx  Wipe chat history
    └── ResetAppBtn.jsx      Full reset with confirm
```

---

## 🐘 PHP Backend — Laravel Components

### Controllers

```text
AuthController.php
├── register()         POST /auth/register
├── login()            POST /auth/login
├── logout()           POST /auth/logout
├── me()               GET  /auth/me
└── refresh()          POST /auth/refresh

ChatController.php
├── index()            GET  /chat/sessions
├── store()            POST /chat/sessions
├── show()             GET  /chat/sessions/{id}
├── destroy()          DELETE /chat/sessions/{id}
├── messages()         GET  /chat/sessions/{id}/messages
└── sendMessage()      POST /chat/sessions/{id}/message

CodeController.php
├── index()            GET  /code/files
├── store()            POST /code/files
├── show()             GET  /code/files/{id}
├── update()           PUT  /code/files/{id}
├── destroy()          DELETE /code/files/{id}
└── run()              POST /code/run

MeetingController.php
├── createRoom()       POST /meetings/rooms
├── getRoom()          GET  /meetings/rooms/{id}
├── endRoom()          DELETE /meetings/rooms/{id}
├── history()          GET  /meetings/history
├── getNotes()         GET  /meetings/{id}/notes
├── generateNotes()    POST /meetings/{id}/notes
└── getTranscript()    GET  /meetings/{id}/transcript

AnalyticsController.php
├── overview()         GET /analytics/overview
├── sessions()         GET /analytics/sessions
├── tokens()           GET /analytics/tokens
├── cost()             GET /analytics/cost
└── meetings()         GET /analytics/meetings

SettingsController.php
├── index()            GET  /settings
├── update()           PUT  /settings
├── saveApiKey()       POST /settings/apikey
├── deleteApiKey()     DELETE /settings/apikey
└── testApiKey()       POST /settings/test-key

FileController.php
├── upload()           POST /files/upload
├── download()         GET  /files/{id}
└── destroy()          DELETE /files/{id}
```

### Models

```text
User.php              ↔ users table
├── hasMany ChatSession
├── hasMany Meeting
├── hasMany CodeFile
├── hasOne ApiKey
└── hasOne Analytics

ChatSession.php       ↔ chat_sessions table
├── belongsTo User
└── hasMany Message

Message.php           ↔ messages table
├── belongsTo ChatSession
└── belongsTo User

Meeting.php           ↔ meetings table
├── belongsTo User
├── hasMany Transcript
└── hasOne MeetingNote

CodeFile.php          ↔ code_files table
├── belongsTo User
└── hasMany CodeVersion

ApiKey.php            ↔ api_keys table
└── belongsTo User

Analytics.php         ↔ analytics table
└── belongsTo User
```

### Services

```text
AuthService.php
├── generateJWT()
├── verifyJWT()
├── hashPassword()
└── checkPassword()

EncryptionService.php
├── encryptApiKey()     AES-256 encrypt before DB
└── decryptApiKey()     Decrypt for use

AnalyticsService.php
├── trackSession()
├── trackTokens()
├── trackVoiceMinutes()
└── generateReport()

FileService.php
├── storeFile()
├── getFile()
└── deleteFile()
```

### Middleware

```text
AuthMiddleware.php       Verify JWT on every request
RateLimitMiddleware.php   Max requests per user/min
LoggingMiddleware.php     Log all API requests
CORSMiddleware.php       Allow frontend origin
```

---

## 🐍 Python Backend — FastAPI Components

### Routers

```text
ai.py                   /ai/*
├── POST /ai/chat       Proxy to Claude, stream back
├── POST /ai/complete   Single completion (no stream)
├── POST /ai/vision     Image + text to Claude
└── POST /ai/notes      Generate meeting notes

code_run.py             /run/*
├── POST /run/js        Execute JavaScript (Node sandbox)
└── POST /run/python    Execute Python (subprocess sandbox)
```

### WebSockets

```text
chat_ws.py              /ws/chat/{session_id}
├── on_connect()        Auth check, load history
├── on_message()        Receive user message
│   ├── call Claude API (streaming)
│   └── emit tokens back one by one
└── on_disconnect()     Save session, cleanup

meeting_ws.py           /ws/meeting/{room_id}
├── on_connect()        Join room, announce presence
├── on_transcript()     Receive transcript line
│   ├── send to Claude
│   └── emit audio response trigger
├── on_signal()         WebRTC peer signaling
│   ├── offer
│   ├── answer
│   └── ice_candidate
└── on_disconnect()     Leave room, cleanup

code_ws.py              /ws/code/{file_id}
├── on_connect()        Load file, join collab room
├── on_change()         Receive code change
│   └── broadcast to others in same file
└── on_disconnect()     Save file, cleanup
```

### Services

```text
claude_service.py
├── stream_chat()       Async generator — stream tokens
├── complete()          Single response
├── vision()            Image + text
└── generate_notes()    Meeting transcript → notes

code_sandbox.py
├── run_python()        subprocess with timeout + limits
└── run_javascript()    Node.js child process

notes_service.py
├── format_transcript()  Clean up raw transcript
├── generate_summary()   Claude summary
└── extract_actions()    Pull action items

token_counter.py
├── count_tokens()      Estimate from text length
└── estimate_cost()     Tokens × model price rates

websocket_manager.py
├── ConnectionPool      Track all active WS connections
├── broadcast()         Send to all in a room
└── send_personal()     Send to one connection
```

---

## 🗄️ MySQL Database — All Tables

**DATABASE: `ai_character_platform`**

```text
users                    Who uses the app
├── id, uuid, username, email
├── password_hash
├── avatar_name, avatar_style, avatar_image
├── system_prompt, personality
├── voice_name, voice_speed, voice_pitch
└── model, is_active, timestamps

api_keys                 Encrypted Anthropic keys
├── id, user_id
├── provider (anthropic only)
├── encrypted_key, key_hint
└── is_valid, last_tested_at, timestamps

chat_sessions            Groups of messages
├── id, uuid, user_id
├── title, personality
├── message_count, token_count
└── is_active, started_at, ended_at

messages                 Individual chat messages
├── id, uuid, session_id, user_id
├── role (user/assistant)
├── content (TEXT)
├── has_image, image_path
├── token_count, emotion
└── timestamps

meetings                 Video call records
├── id, uuid, user_id
├── room_id, platform
├── bot_name, bot_personality
├── status (scheduled/active/ended)
├── started_at, ended_at, duration_seconds
└── timestamps

transcripts              Meeting conversation lines
├── id, meeting_id
├── speaker (user/bot)
├── content (TEXT)
└── spoken_at

meeting_notes            Claude-generated notes
├── id, meeting_id
├── summary (TEXT)
├── key_points (JSON)
├── action_items (JSON)
└── generated_at

code_files               User's code files
├── id, uuid, user_id
├── filename, language
├── content (LONGTEXT)
├── folder_path
└── timestamps

code_versions            File history / diff
├── id, file_id
├── content (LONGTEXT)
├── change_summary
└── created_at

code_runs                Execution history
├── id, file_id, user_id
├── language, input_code
├── output, error
├── duration_ms, exit_code
└── executed_at

analytics                Per-user usage tracking
├── id, user_id, date
├── sessions_count
├── messages_count
├── tokens_input, tokens_output
├── estimated_cost_usd
├── voice_chars_used
├── meetings_count, meeting_minutes
└── updated_at
```

---

## 🔴 Redis — Cache Structure

```text
session:{jwt_token}         Active user session (TTL 24h)
user:{user_id}:settings     Cached settings (TTL 1h)
room:{room_id}:users        Who's in a meeting room
room:{room_id}:transcript   Live transcript buffer
ratelimit:{user_id}:{min}   Request count per minute
ws:{connection_id}          WebSocket metadata
```

---

## 🐳 Docker — All Services

**`docker-compose.yml`**

```text
frontend          React + Vite dev server     :5173
php               Laravel + Apache           :8000
python            FastAPI + Uvicorn          :8001
mysql             MySQL 8.0                  :3306
redis             Redis 7                    :6379
phpmyadmin        DB admin UI                :8080
```

---

## 🔄 Full Request Flow Examples

### Chat Message

```text
User types → React ChatInputBar
→ WebSocket /ws/chat/{id}  (Python FastAPI)
→ claude_service.stream_chat()
→ Anthropic API (user's key from MySQL, decrypted)
→ tokens stream back through WebSocket
→ React renders token by token
→ PHP REST: POST /chat/sessions/{id}/message
→ MySQL saves full message
→ analytics updated
```

### Meeting Start

```text
User clicks Join → React MeetingsPage
→ PHP: POST /meetings/rooms  →  MySQL creates record
→ Python /ws/meeting/{id}  →  WebRTC signaling starts
→ getUserMedia()  →  webcam + mic
→ AvatarCanvas.captureStream()  →  avatar video track
→ PeerJS connects peers
→ SpeechRecognition  →  Python WS  →  Claude  →  SpeechSynthesis
→ Transcript lines  →  PHP: saves to transcripts table
→ Call ends  →  Python: generate_notes()  →  Claude
→ PHP: saves to meeting_notes table
```

### Code Run

```text
User clicks Run → React Terminal
→ PHP: POST /code/run  →  forwards to Python
→ Python code_sandbox.run_python()
→ subprocess with 10s timeout + memory limit
→ output/error returned
→ React Terminal renders result
→ MySQL saves to code_runs table
```

---

## 📦 Dependencies List

### PHP (`composer.json`)
- laravel/laravel — Framework
- laravel/sanctum — JWT auth
- doctrine/dbal — DB migrations
- predis/predis — Redis client

### Python (`requirements.txt`)
- fastapi — Web framework
- uvicorn — ASGI server
- anthropic — Claude SDK
- websockets — WebSocket support
- sqlalchemy — DB ORM
- pymysql — MySQL driver
- redis — Redis client
- python-jose — JWT handling
- passlib — Password hashing
- python-multipart — File uploads
- httpx — Async HTTP client

### Frontend (`package.json`)
- react — UI framework
- vite — Build tool
- recharts — Charts
- lucide-react — Icons
- zustand — State management
- tailwindcss — Styling

---

## ✅ Complete Component Count

| Layer | Files | Purpose |
|---|---:|---|
| React Frontend | ~65 components | UI, pages, interactions |
| PHP Laravel | ~20 files | REST API, auth, data |
| Python FastAPI | ~15 files | AI, WebSockets, code run |
| MySQL | ~10 tables | All persistent data |
| Redis | 6 key types | Cache, sessions, realtime |
| Docker | 6 services | Local dev environment |
| **Total** | **~116 files** | Complete platform |

---

## 🔑 API Keys Required
=======
## 🔑 API Keys Required (Bring Your Own)
>>>>>>> 8362782 (your message)

You need **3 API keys**. All have generous free tiers — no credit card needed to start.

### 1. 🧠 Anthropic (Claude) — AI Brain
<<<<<<< HEAD
- Get it: [platform.anthropic.com](https://platform.anthropic.com/)
- Format: `sk-ant-api03-...`
- Free tier: $5 credit on signup
- Powers: all chat, code help, meeting conversation, emotion detection, meeting notes

### 2. 🗣️ ElevenLabs — Real Voice Output
- Get it: [elevenlabs.io](https://elevenlabs.io/)
- Format: `sk_...`
- Free tier: 10,000 characters/month
- Powers: character speaks with a real human-quality voice

### 3. 🎥 Daily.co — Video Rooms
- Get it: [daily.co/developers](https://daily.co/developers)
- Format: `abc123xyz...`
- Free tier: 10,000 minutes/month
- Powers: real WebRTC video room, avatar appears as video participant
=======
- **Get it:** [platform.anthropic.com](https://platform.anthropic.com)
- **Format:** `sk-ant-api03-...`
- **Free tier:** $5 credit on signup
- **Powers:** All chat, code help, meeting conversation, emotion detection, meeting notes

### 2. 🗣️ ElevenLabs — Real Voice Output
- **Get it:** [elevenlabs.io](https://elevenlabs.io)
- **Format:** `sk_...`
- **Free tier:** 10,000 characters/month
- **Powers:** Character speaks with a real human-quality voice

### 3. 🎥 Daily.co — Video Rooms
- **Get it:** [daily.co/developers](https://daily.co/developers)
- **Format:** `abc123xyz...`
- **Free tier:** 10,000 minutes/month
- **Powers:** Real WebRTC video room, avatar appears as video participant
>>>>>>> 8362782 (your message)

---

## 🆓 Everything Else is Free

| Feature | Technology | Cost |
|---|---|---|
<<<<<<< HEAD
| 🎤 Voice input (STT) | Web Speech API (browser native) | $0 |
| 😊 Avatar face | SVG animated, built-in | $0 |
| 🖼️ Avatar image gen | Pollinations.ai (no key needed) | $0 |
| 💾 Chat memory | localStorage (browser native) | $0 |
| 🐍 Run Python | Pyodide (browser WASM) | $0 |
| ⚡ Run JavaScript | eval() sandbox | $0 |
| 📝 Meeting notes | Claude generates them | $0 |
| 📊 Analytics | Tracked locally | $0 |
| 🌐 Hosting | Vercel / GitHub Pages | $0 |
=======
| 🎤 Voice input (STT) | Web Speech API (browser native) | **$0** |
| 😊 Avatar face | SVG animated, built-in | **$0** |
| 🖼️ Avatar image gen | Pollinations.ai (no key needed) | **$0** |
| 💾 Chat memory | localStorage (browser native) | **$0** |
| 🐍 Run Python | Pyodide (browser WASM) | **$0** |
| ⚡ Run JavaScript | eval() sandbox | **$0** |
| 📝 Meeting notes | Claude generates them | **$0** |
| 📊 Analytics | Tracked locally | **$0** |
| 🌐 Hosting | Vercel / GitHub Pages | **$0** |
>>>>>>> 8362782 (your message)

---

## 🚀 Quick Start

### 1. Clone the repo
```bash
git clone https://github.com/yourusername/ai-character-platform.git
cd ai-character-platform
```

### 2. Install dependencies
```bash
npm install
```

### 3. Add your API keys
<<<<<<< HEAD
Go to **Settings** page in the app and paste your keys. They are stored only in your browser's `localStorage` — never sent to any server.
=======
Go to **Settings** page in the app and paste your keys. They are stored only in your browser's localStorage — never sent to any server.
>>>>>>> 8362782 (your message)

Or create a `.env` file (optional, for pre-loading keys):
```env
VITE_ANTHROPIC_KEY=sk-ant-api03-...
VITE_ELEVENLABS_KEY=sk_...
VITE_DAILY_KEY=abc123xyz...
```

### 4. Run locally
```bash
npm run dev
```

### 5. Open in browser
<<<<<<< HEAD
```text
=======
```
>>>>>>> 8362782 (your message)
http://localhost:5173
```

---

<<<<<<< HEAD
## 🎨 Design System

### Colors
=======
## 📁 Project Structure

```
ai-character-platform/
├── src/
│   ├── App.jsx                    # Root, global state, page router
│   ├── index.css                  # Global styles, CSS variables
│   │
│   ├── state/
│   │   ├── useAppStore.js         # Global state (Zustand)
│   │   ├── useSettings.js         # API keys, model, voice config
│   │   ├── useSession.js          # Session tracking, analytics
│   │   └── useMemory.js           # Chat memory via localStorage
│   │
│   ├── hooks/
│   │   ├── useClaudeChat.js       # Anthropic API streaming
│   │   ├── useElevenLabs.js       # TTS voice output
│   │   ├── useSpeechRecognition.js# Web Speech API (free STT)
│   │   ├── useDaily.js            # Daily.co room management
│   │   ├── useAvatarState.js      # Avatar emotion/state machine
│   │   ├── useCodeRunner.js       # JS eval + Pyodide runner
│   │   └── useMeetingDetect.js    # Detect Zoom/Meet/Teams from URL
│   │
│   ├── api/
│   │   ├── claude.js              # Claude API calls + streaming
│   │   ├── elevenlabs.js          # ElevenLabs TTS
│   │   ├── daily.js               # Daily.co room create/join
│   │   └── pollinations.js        # Free avatar image generation
│   │
│   ├── components/
│   │   ├── layout/                # Sidebar, nav, shell
│   │   ├── avatar/                # SVG face, lip-sync, glow, canvas
│   │   ├── dashboard/             # Quick join bar, stats, skills, feed
│   │   ├── chat/                  # Messages, mic, voice, personality
│   │   ├── code/                  # Editor, file tree, terminal, AI assist
│   │   ├── meetings/              # Video grid, transcript, controls
│   │   ├── analytics/             # Charts, usage, history
│   │   └── settings/              # API keys, model, voice, avatar
│   │
│   └── utils/
│       ├── detectMeetingPlatform.js
│       ├── tokenCounter.js
│       ├── streamResponse.js
│       ├── audioVisualizer.js
│       └── syntaxColors.js
│
├── public/
├── .env.example
├── package.json
└── README.md
```

---

## 📄 Pages

### 🏠 Dashboard
- Large animated avatar (breathing, blinking, emotion states)
- ⚡ **Quick Join Bar** — paste any meeting link for instant bot setup
- Stats: total sessions, messages sent, tokens used, voice minutes
- Skill cards showing all agent capabilities
- Recent activity feed
- Quick action buttons

### 💬 Chat
- Real-time streaming responses from Claude
- Hold mic button → speak → avatar listens → responds with voice
- ElevenLabs voice output (natural, human-quality)
- Avatar lip-syncs and shows emotion based on conversation
- Personality modes: Friendly / Developer / Coach / Professional
- Image upload → Claude vision analysis
- Full conversation memory (persisted across sessions)

### 💻 Code IDE
- File tree with create/rename/delete
- Multi-file tabs
- Syntax-highlighted code editor with line numbers
- AI Assist panel — ask the character to write, fix, explain, refactor
- Diff view — see exactly what the AI changed
- Terminal panel — JS runs instantly, Python via Pyodide (WASM)
- Avatar reacts to errors and successes

### 🎥 Meetings
- Paste a Zoom, Google Meet, Teams, or any link → platform auto-detected
- Configure: bot name, personality, voice, system prompt
- Daily.co room created → avatar appears as a real video participant
- Others join via shareable link — no app required
- Live transcript panel
- In-call task execution ("search that for me", "summarize this")
- Post-call: Claude generates meeting notes + action items
- Download notes as text file

### 📊 Analytics
- Sessions over time chart
- Token usage per conversation
- Estimated API cost tracker
- ElevenLabs character quota bar
- Daily.co minutes used
- Meeting history table with duration and notes

### 🔑 Settings
- Anthropic API key + test connection button
- ElevenLabs API key + voice selector + test button
- Daily.co API key + test button
- Claude model selector (claude-sonnet, claude-haiku, etc.)
- Avatar name and personality system prompt
- Avatar image (generate via Pollinations or upload custom)
- All data stored in localStorage only — never leaves your browser

---

## 🔄 How It Works

### Chat Flow
```
User speaks (mic)
    ↓
Web Speech API → transcript (free)
    ↓
Claude API → streaming response (your Anthropic key)
    ↓
ElevenLabs → audio output (your ElevenLabs key)
    ↓
Audio waveform → lip-sync → avatar mouth animates
```

### Meeting Flow
```
Paste meeting link → platform detected
    ↓
Bot configured (name, voice, personality)
    ↓
Daily.co room created (your Daily.co key)
    ↓
Avatar canvas → captureStream() → video track
    ↓
Published to room as video participant
    ↓
Others join via link → see AI avatar in video grid
    ↓
Web Speech → Claude → ElevenLabs loop (real-time)
    ↓
Call ends → Claude generates meeting notes
```

---

## 🎨 Design System

>>>>>>> 8362782 (your message)
```css
--bg-primary:    #080810   /* deep dark background */
--bg-secondary:  #0f0f1a   /* sidebar, cards */
--bg-tertiary:   #1a1a2e   /* elevated surfaces */
--accent-cyan:   #00ffe0   /* primary accent, glow */
--accent-coral:  #ff4d6d   /* secondary accent, alerts */
--accent-purple: #a78bfa   /* thinking state */
--accent-green:  #34d399   /* talking state, success */
--accent-blue:   #60a5fa   /* listening state */
--text-primary:  #f0f0ff   /* main text */
--text-secondary:#8888aa   /* muted text */
<<<<<<< HEAD
```

### Fonts
- **Headings**: `'Bebas Neue'`
- **Code/UI**: `'JetBrains Mono'`

### Avatar States

| State | Glow Color | Behavior |
|---|---|---|
| 🟣 **Idle** | Pink `#f472b6` | Breathing, slow blink |
| 🔵 **Listening** | Blue `#60a5fa` | Eyes wide, alert |
| 🟣 **Thinking** | Purple `#a78bfa` | Eyes half-closed, glow pulses |
| 🟢 **Talking** | Green `#34d399` | Mouth animates, lip-sync |
=======
--font-display:  'Bebas Neue'      /* headings */
--font-mono:     'JetBrains Mono'  /* code, UI labels */
```

### Avatar States
| State | Glow Color | Behavior |
|---|---|---|
| 🟣 Idle | Pink `#f472b6` | Breathing, slow blink |
| 🔵 Listening | Blue `#60a5fa` | Eyes wide, alert |
| 🟣 Thinking | Purple `#a78bfa` | Eyes half-closed, glow pulses |
| 🟢 Talking | Green `#34d399` | Mouth animates, lip-sync |
>>>>>>> 8362782 (your message)

---

## 🧩 Extending with Skills

Add new capabilities by creating a skill module:

<<<<<<< HEAD
```javascript
=======
```js
>>>>>>> 8362782 (your message)
// src/skills/mySkill.js
export default {
  name: 'my-skill',
  description: 'What this skill does',
  trigger: ['keywords', 'that', 'activate', 'it'],
  async execute(input, context) {
<<<<<<< HEAD
=======
    // your logic here
>>>>>>> 8362782 (your message)
    return { result: '...' }
  }
}
```

Register in `src/skills/index.js` and the agent will automatically use it when relevant.

---

## 🌐 Deployment

### Vercel (recommended, free)
```bash
npm install -g vercel
vercel deploy
```

### GitHub Pages
```bash
npm run build
# push dist/ to gh-pages branch
```

### Docker
```bash
docker build -t ai-character-platform .
docker run -p 3000:3000 ai-character-platform
```

---

## 🔮 Roadmap

- [ ] Zoom SDK integration (native Zoom join)
- [ ] Google Calendar → auto-join scheduled meetings
- [ ] Voice cloning from audio sample
- [ ] Multi-agent support (multiple characters)
- [ ] Skill marketplace
- [ ] Mobile app (React Native)
- [ ] Screen share awareness
- [ ] Real-time translation

---

## 🤝 Contributing

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/my-skill`)
3. Commit your changes (`git commit -m 'Add my skill'`)
4. Push to the branch (`git push origin feature/my-skill`)
5. Open a Pull Request

---

## 📄 License

<<<<<<< HEAD
**MIT License** — free to use, modify, and distribute.
=======
MIT License — free to use, modify, and distribute.
>>>>>>> 8362782 (your message)

---

## 🙏 Acknowledgements

<<<<<<< HEAD
- [Anthropic](https://anthropic.com/) — Claude AI
- [ElevenLabs](https://elevenlabs.io/) — Voice synthesis
- [Daily.co](https://daily.co/) — WebRTC video rooms
- [Pollinations.ai](https://pollinations.ai/) — Free image generation
- [Pyodide](https://pyodide.org/) — Python in the browser
- [Recharts](https://recharts.org/) — Charts

---

<p align="center">Built with ❤️ — AI Character Platform</p>"# MEZOMAI" 
"# MEZOMAI" 
=======
- [Anthropic](https://anthropic.com) — Claude AI
- [ElevenLabs](https://elevenlabs.io) — Voice synthesis
- [Daily.co](https://daily.co) — WebRTC video rooms
- [Pollinations.ai](https://pollinations.ai) — Free image generation
- [Pyodide](https://pyodide.org) — Python in the browser
- [Recharts](https://recharts.org) — Charts

---

<p align="center">Built with ❤️ — AI Character Platform</p>
#   v i r t u a l a p i A I 
 
 
>>>>>>> 8362782 (your message)
