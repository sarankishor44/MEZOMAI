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
  anthropic: 'claude-3-5-sonnet-20241022',
  openai: 'gpt-4o-mini',
  gemini: 'gemini-2.0-flash',
  openrouter: 'openai/gpt-4o-mini',
  deepseek: 'deepseek-chat',
  groq: 'llama-3.1-8b-instant',
  mistral: 'mistral-small-latest',
  xai: 'grok-2-latest',
}

const PROVIDER_MODEL_PREFIXES = {
  anthropic: ['claude'],
  openai: ['gpt', 'o1', 'o3', 'o4'],
  gemini: ['gemini'],
  openrouter: ['openai/', 'anthropic/', 'google/', 'meta-llama/', 'mistralai/', 'deepseek/'],
  deepseek: ['deepseek'],
  groq: ['llama', 'mixtral', 'gemma', 'qwen'],
  mistral: ['mistral', 'ministral', 'codestral'],
  xai: ['grok'],
}

export const activeProvider = (settings = {}) => (settings.activeProvider || 'anthropic').toLowerCase()

export const providerKey = (settings = {}) => {
  const provider = activeProvider(settings)
  return (settings[PROVIDER_KEY_FIELDS[provider]] || '').trim()
}

export const providerModel = (settings = {}) => {
  const provider = activeProvider(settings)
  const model = settings.model || ''
  const prefixes = PROVIDER_MODEL_PREFIXES[provider]
  if (!model || !prefixes?.some(prefix => model.toLowerCase().startsWith(prefix))) {
    return PROVIDER_DEFAULT_MODELS[provider] || PROVIDER_DEFAULT_MODELS.anthropic
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

export const aiErrorMessage = (error) => (
  error?.response?.data?.detail ||
  error?.response?.data?.error ||
  error?.message ||
  'AI request failed.'
)
