// Direct browser-side AI calls — used as fallback when Python backend is unreachable (e.g. CORS)
import axios from 'axios'
import { activeProvider, providerKey, providerModel, PROVIDER_DEFAULT_MODELS } from './aiConfig'

// Returns true when the error is a network/CORS block (no response from server)
export const isNetworkError = (error) =>
  !error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || error.code === 'ERR_FAILED')

// ─── Gemini (Google Generative AI) ────────────────────────────────────────────
const callGemini = async (systemPrompt, prompt, model, apiKey) => {
  const geminiModel = model || PROVIDER_DEFAULT_MODELS.gemini
  // Use v1 endpoint for stable models; v1beta for experimental
  const apiVersion = geminiModel.includes('exp') || geminiModel.includes('preview') ? 'v1beta' : 'v1beta'
  const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${geminiModel}:generateContent?key=${apiKey}`
  const { data } = await axios.post(url, {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: 1500 },
  })
  return data.candidates[0].content.parts[0].text
}

// ─── OpenAI-compatible (OpenAI, DeepSeek, Groq, Mistral, xAI, OpenRouter) ────
const callOpenAICompatible = async (baseUrl, apiKey, systemPrompt, prompt, model, extraHeaders = {}) => {
  const { data } = await axios.post(
    baseUrl,
    {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1500,
    },
    { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', ...extraHeaders } }
  )
  return data.choices[0].message.content
}

// ─── Anthropic (Claude) — SDK required, no direct browser CORS support ─────────
const callAnthropic = async (systemPrompt, prompt, model, apiKey) => {
  // Anthropic blocks browser requests with CORS — must use Python backend
  // This path should not normally be reached (backend handles Anthropic)
  throw new Error(
    'Claude (Anthropic) cannot be called directly from the browser.\n' +
    'Please switch to Gemini, DeepSeek, or Groq in Settings → Active Provider,\n' +
    'or wait for the Python backend CORS fix to deploy on Vercel.'
  )
}

// ─── Main dispatcher ──────────────────────────────────────────────────────────
export const callAIDirectly = async (systemPrompt, prompt, settings) => {
  const provider = activeProvider(settings)
  const apiKey = providerKey(settings)
  const model = providerModel(settings)

  if (!apiKey) {
    throw new Error(`No API key found for ${provider}. Go to Settings → API Keys and add your ${provider} key.`)
  }

  switch (provider) {
    case 'gemini':
      return callGemini(systemPrompt, prompt, model, apiKey)

    case 'openai':
      return callOpenAICompatible(
        'https://api.openai.com/v1/chat/completions',
        apiKey, systemPrompt, prompt, model
      )

    case 'deepseek':
      return callOpenAICompatible(
        'https://api.deepseek.com/v1/chat/completions',  // v1 path preferred
        apiKey, systemPrompt, prompt, model
      )

    case 'groq':
      return callOpenAICompatible(
        'https://api.groq.com/openai/v1/chat/completions',
        apiKey, systemPrompt, prompt, model
      )

    case 'mistral':
      return callOpenAICompatible(
        'https://api.mistral.ai/v1/chat/completions',
        apiKey, systemPrompt, prompt, model
      )

    case 'xai':
      return callOpenAICompatible(
        'https://api.x.ai/v1/chat/completions',
        apiKey, systemPrompt, prompt, model
      )

    case 'openrouter':
      return callOpenAICompatible(
        'https://openrouter.ai/api/v1/chat/completions',
        apiKey, systemPrompt, prompt, model,
        {
          'HTTP-Referer': 'https://mezomai.vercel.app',
          'X-Title': 'MEZOMAI',
        }
      )

    case 'anthropic':
      return callAnthropic(systemPrompt, prompt, model, apiKey)

    default:
      throw new Error(`Unknown AI provider: "${provider}". Check Settings → Active Provider.`)
  }
}
