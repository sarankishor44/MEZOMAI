import { supabase, isSupabaseConfigured, getSupabaseSession, getSupabaseUser } from './supabase'

const SECRET_FIELDS = [
  ['apiKey', 'anthropic'],
  ['openAiKey', 'openai'],
  ['geminiKey', 'gemini'],
  ['elevenLabsKey', 'elevenlabs'],
  ['dailyKey', 'daily'],
]

const profileToUser = (profile = {}, authUser = {}) => ({
  id: profile.id || authUser.id,
  uuid: profile.id || authUser.id,
  username: profile.username || authUser.user_metadata?.username || authUser.email?.split('@')[0] || 'Operator',
  email: profile.email || authUser.email,
  avatar_name: profile.avatar_name || 'ARIA',
  avatar_style: profile.avatar_style || 'gold',
  avatar_gender: profile.avatar_gender || 'female',
  personality: profile.personality || 'friendly',
  system_prompt: profile.system_prompt,
  voice_name: profile.voice_name || 'Rachel',
  voice_speed: profile.voice_speed || 1,
  voice_pitch: profile.voice_pitch || 1,
  model: profile.model || 'claude-3-5-sonnet-20241022',
  active_provider: profile.active_provider || 'anthropic',
})

const userToProfile = (userId, email, settings = {}) => ({
  id: userId,
  email,
  username: settings.username,
  avatar_name: settings.avatarName,
  avatar_style: settings.avatarStyle,
  avatar_gender: settings.avatarGender,
  personality: settings.personality,
  system_prompt: settings.systemPrompt,
  voice_name: settings.voiceName,
  voice_speed: settings.voiceSpeed,
  voice_pitch: settings.voicePitch,
  model: settings.model,
  active_provider: settings.activeProvider,
  updated_at: new Date().toISOString(),
})

const normalizeSession = (row) => ({
  ...row,
  id: row.id,
  uuid: row.id,
})

const normalizeMessage = (row) => ({
  ...row,
  id: row.id,
  uuid: row.id,
})

const normalizeCodeFile = (row) => ({
  ...row,
  id: row.id,
  uuid: row.id,
  filename: row.filename,
  name: row.filename,
  language: row.language,
  lang: row.language,
})

async function requireSignedInUser() {
  if (!isSupabaseConfigured || !supabase) throw new Error('Supabase is not configured.')
  const user = await getSupabaseUser()
  if (!user) throw new Error('Supabase user is not signed in.')
  return user
}

export async function supabaseLogin(email, password) {
  if (!isSupabaseConfigured || !supabase) throw new Error('Supabase is not configured.')
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  const profile = await getSupabaseProfile(data.user)
  return {
    token: `supabase:${data.session.access_token}`,
    user: profileToUser(profile, data.user),
  }
}

export async function supabaseRegister({ email, password, username }) {
  if (!isSupabaseConfigured || !supabase) throw new Error('Supabase is not configured.')
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } },
  })
  if (error) throw error
  if (data.user && data.session) {
    await upsertSupabaseProfile({
      username: username || data.user.email?.split('@')[0],
      avatarName: 'ARIA',
      avatarStyle: 'gold',
      avatarGender: 'female',
      personality: 'friendly',
      model: 'claude-3-5-sonnet-20241022',
      activeProvider: 'anthropic',
    })
  }
  const sessionToken = data.session?.access_token ? `supabase:${data.session.access_token}` : null
  return {
    token: sessionToken,
    user: profileToUser(await getSupabaseProfile(data.user), data.user),
  }
}

export async function hydrateSupabaseAuth() {
  const session = await getSupabaseSession()
  if (!session?.user) return null
  const profile = await getSupabaseProfile(session.user)
  return {
    token: `supabase:${session.access_token}`,
    user: profileToUser(profile, session.user),
  }
}

export async function signOutSupabase() {
  if (!supabase) return
  await supabase.auth.signOut()
}

export async function getSupabaseProfile(authUser) {
  if (!authUser || !supabase) return null
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .maybeSingle()
  if (error) throw error
  if (data) return data

  const fallbackProfile = {
    id: authUser.id,
    email: authUser.email,
    username: authUser.user_metadata?.username || authUser.email?.split('@')[0],
    avatar_name: 'ARIA',
    avatar_style: 'gold',
    avatar_gender: 'female',
    personality: 'friendly',
    model: 'claude-3-5-sonnet-20241022',
    active_provider: 'anthropic',
  }
  const { data: created, error: createError } = await supabase
    .from('profiles')
    .insert(fallbackProfile)
    .select()
    .single()
  if (createError) throw createError
  return created
}

export async function upsertSupabaseProfile(settings = {}) {
  const user = await requireSignedInUser()
  const profile = userToProfile(user.id, user.email, settings)
  const { data, error } = await supabase
    .from('profiles')
    .upsert(profile, { onConflict: 'id' })
    .select()
    .single()
  if (error) throw error
  return profileToUser(data, user)
}

export async function loadSupabaseSettings() {
  const user = await requireSignedInUser()
  const profile = await getSupabaseProfile(user)
  const { data: secrets, error } = await supabase
    .from('user_api_keys')
    .select('provider, secret_value')
    .eq('user_id', user.id)
  if (error) throw error

  const settings = {
    avatarName: profile.avatar_name,
    avatarStyle: profile.avatar_style,
    avatarGender: profile.avatar_gender,
    personality: profile.personality,
    systemPrompt: profile.system_prompt,
    voiceName: profile.voice_name,
    voiceSpeed: Number(profile.voice_speed || 1),
    voicePitch: Number(profile.voice_pitch || 1),
    model: profile.model,
    activeProvider: profile.active_provider,
  }

  SECRET_FIELDS.forEach(([field, provider]) => {
    settings[field] = secrets.find(secret => secret.provider === provider)?.secret_value || ''
  })

  return settings
}

export async function saveSupabaseSettings(settings = {}) {
  const user = await requireSignedInUser()
  const profile = await upsertSupabaseProfile(settings)
  const rows = SECRET_FIELDS
    .filter(([field]) => settings[field])
    .map(([field, provider]) => ({
      user_id: user.id,
      provider,
      secret_value: settings[field],
      key_hint: `${settings[field].slice(0, 6)}...${settings[field].slice(-4)}`,
      updated_at: new Date().toISOString(),
    }))

  if (rows.length) {
    const { error } = await supabase
      .from('user_api_keys')
      .upsert(rows, { onConflict: 'user_id,provider' })
    if (error) throw error
  }

  return profile
}

export async function listSupabaseChatSessions() {
  const user = await requireSignedInUser()
  const { data, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data.map(normalizeSession)
}

export async function createSupabaseChatSession({ title, personality }) {
  const user = await requireSignedInUser()
  const { data, error } = await supabase
    .from('chat_sessions')
    .insert({ user_id: user.id, title, personality, is_active: true })
    .select()
    .single()
  if (error) throw error
  return normalizeSession(data)
}

export async function loadSupabaseMessages(sessionId) {
  await requireSignedInUser()
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data.map(normalizeMessage)
}

export async function saveSupabaseMessage(sessionId, message) {
  const user = await requireSignedInUser()
  const { data, error } = await supabase
    .from('messages')
    .insert({
      session_id: sessionId,
      user_id: user.id,
      role: message.role,
      content: message.content,
      token_count: Math.ceil((message.content || '').length / 4),
    })
    .select()
    .single()
  if (error) throw error
  await supabase
    .from('chat_sessions')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', sessionId)
  return normalizeMessage(data)
}

export async function listSupabaseCodeFiles() {
  const user = await requireSignedInUser()
  const { data, error } = await supabase
    .from('code_files')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data.map(normalizeCodeFile)
}

export async function createSupabaseCodeFile(file) {
  const user = await requireSignedInUser()
  const { data, error } = await supabase
    .from('code_files')
    .insert({
      user_id: user.id,
      filename: file.filename || file.name,
      language: file.language || file.lang || 'python',
      content: file.content || '',
      folder_path: file.folder_path || 'workspace',
    })
    .select()
    .single()
  if (error) throw error
  return normalizeCodeFile(data)
}

export async function saveSupabaseCodeFile(file, patch = {}) {
  const next = { ...file, ...patch }
  const { data, error } = await supabase
    .from('code_files')
    .update({
      filename: next.filename || next.name,
      language: next.language || next.lang,
      content: next.content,
      folder_path: next.folder_path || 'workspace',
      updated_at: new Date().toISOString(),
    })
    .eq('id', file.uuid || file.id)
    .select()
    .single()
  if (error) throw error
  return normalizeCodeFile(data)
}
