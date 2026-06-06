export const PROVIDER_KEY_FIELDS = {
  gemma: 'geminiKey',
  anthropic: 'apiKey',
  openai: 'openAiKey',
  gemini: 'geminiKey',
  openrouter: 'openRouterKey',
  deepseek: 'deepSeekKey',
  groq: 'groqKey',
  mistral: 'mistralKey',
  xai: 'xAiKey',
}

export const PROVIDER_DEFAULT_MODELS = {
  gemma: 'gemma-3-27b-it',
  anthropic: 'claude-sonnet-4-6',
  openai: 'gpt-4o-mini',
  gemini: 'gemini-2.5-flash',
  openrouter: 'openai/gpt-4o-mini',
  deepseek: 'deepseek-v4-flash',
  groq: 'llama-3.3-70b-versatile',
  mistral: 'mistral-small-4',
  xai: 'grok-4.3',
}

// ── Platform default: Google Gemma (free, no key required) ──────────────────
export const PLATFORM_DEFAULT_AI = {
  provider: 'gemma',
  model: 'gemma-3-27b-it',
  label: 'Google Gemma 3 27B',
  description: 'Free platform AI — no API key required',
  dailyRequestLimit: 25,
  windowHours: 24,
}

const PROVIDER_MODEL_PREFIXES = {
  gemma: ['gemma'],
  anthropic: ['claude'],
  openai: ['gpt', 'o1', 'o3', 'o4', 'chatgpt'],
  gemini: ['gemini'],
  openrouter: ['openai/', 'anthropic/', 'google/', 'meta-llama/', 'mistralai/', 'deepseek/', 'x-ai/', 'qwen/'],
  deepseek: ['deepseek'],
  groq: ['llama', 'mixtral', 'gemma', 'qwen', 'whisper', 'distil'],
  mistral: ['mistral', 'ministral', 'codestral', 'open-', 'devstral'],
  xai: ['grok'],
}

export const activeProvider = (settings = {}) => (settings.activeProvider || 'gemma').toLowerCase()

export const providerKey = (settings = {}, provider = activeProvider(settings)) => {
  return (settings[PROVIDER_KEY_FIELDS[provider]] || '').trim()
}

export const providerModel = (settings = {}, provider = activeProvider(settings)) => {
  const model = settings.model || ''
  if (provider === 'gemini' && model.toLowerCase().startsWith('gemini-1.5')) {
    return PROVIDER_DEFAULT_MODELS.gemini
  }
  const prefixes = PROVIDER_MODEL_PREFIXES[provider]
  if (!model || !prefixes?.some(prefix => model.toLowerCase().startsWith(prefix))) {
    return PROVIDER_DEFAULT_MODELS[provider] || PROVIDER_DEFAULT_MODELS.gemini
  }
  return model
}

export const hasProviderKey = (settings = {}) => Boolean(providerKey(settings))

export const isUsingDefaultGemma = (settings = {}) => !hasProviderKey(settings)

export const aiRequestConfig = (settings = {}) => {
  const usingOwnKey = hasProviderKey(settings)
  const config = {
    model: usingOwnKey ? providerModel(settings) : PLATFORM_DEFAULT_AI.model,
    provider: usingOwnKey ? activeProvider(settings) : PLATFORM_DEFAULT_AI.provider,
  }
  if (!usingOwnKey) return config
  return {
    ...config,
    api_key: activeProvider(settings) === 'anthropic' ? settings.apiKey || undefined : undefined,
    openai_key: activeProvider(settings) === 'openai' ? settings.openAiKey || undefined : undefined,
    gemini_key: ['gemini', 'gemma'].includes(activeProvider(settings)) ? settings.geminiKey || undefined : undefined,
    openrouter_key: activeProvider(settings) === 'openrouter' ? settings.openRouterKey || undefined : undefined,
    deepseek_key: activeProvider(settings) === 'deepseek' ? settings.deepSeekKey || undefined : undefined,
    groq_key: activeProvider(settings) === 'groq' ? settings.groqKey || undefined : undefined,
    mistral_key: activeProvider(settings) === 'mistral' ? settings.mistralKey || undefined : undefined,
    xai_key: activeProvider(settings) === 'xai' ? settings.xAiKey || undefined : undefined,
  }
}

export const aiModeLabel = (settings = {}) => (
  hasProviderKey(settings)
    ? `${activeProvider(settings)} / ${providerModel(settings)}`
    : `${PLATFORM_DEFAULT_AI.label} (platform default)`
)

export const aiErrorMessage = (error) => {
  const data = error?.response?.data
  if (data) {
    if (typeof data.detail === 'string') return data.detail
    if (typeof data.error === 'string') return data.error
    if (data.error?.message) return data.error.message
    if (typeof data.message === 'string') return data.message
  }
  return error?.message || 'AI request failed.'
}
