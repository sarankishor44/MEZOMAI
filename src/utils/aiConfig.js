export const PROVIDER_KEY_FIELDS = {
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
  anthropic: 'claude-sonnet-4-6',
  openai: 'gpt-4o-mini',
  gemini: 'gemini-2.5-flash',
  openrouter: 'openai/gpt-4o-mini',
  deepseek: 'deepseek-v4-flash',
  groq: 'llama-3.3-70b-versatile',
  mistral: 'mistral-small-4',
  xai: 'grok-4.3',
}

const PROVIDER_MODEL_PREFIXES = {
  anthropic: ['claude'],
  openai: ['gpt', 'o1', 'o3', 'o4', 'chatgpt'],
  gemini: ['gemini'],
  openrouter: ['openai/', 'anthropic/', 'google/', 'meta-llama/', 'mistralai/', 'deepseek/', 'x-ai/', 'qwen/'],
  deepseek: ['deepseek'],
  groq: ['llama', 'mixtral', 'gemma', 'qwen', 'whisper', 'distil'],
  mistral: ['mistral', 'ministral', 'codestral', 'open-', 'devstral'],
  xai: ['grok'],
}

export const activeProvider = (settings = {}) => (settings.activeProvider || 'gemini').toLowerCase()

export const providerKey = (settings = {}) => {
  const provider = activeProvider(settings)
  return (settings[PROVIDER_KEY_FIELDS[provider]] || '').trim()
}

export const providerModel = (settings = {}) => {
  const provider = activeProvider(settings)
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

export const aiRequestConfig = (settings = {}) => ({
  model: providerModel(settings),
  provider: activeProvider(settings),
  api_key: settings.apiKey || undefined,
  openai_key: settings.openAiKey || undefined,
  gemini_key: settings.geminiKey || undefined,
  openrouter_key: settings.openRouterKey || undefined,
  deepseek_key: settings.deepSeekKey || undefined,
  groq_key: settings.groqKey || undefined,
  mistral_key: settings.mistralKey || undefined,
  xai_key: settings.xAiKey || undefined,
})

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
