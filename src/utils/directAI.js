// Direct browser-side AI calls — used as fallback when Python backend is unreachable (e.g. CORS)
import axios from 'axios'
import { activeProvider, providerKey, providerModel, PROVIDER_DEFAULT_MODELS } from './aiConfig'

// Returns true when the error is a network/CORS block (no response from server)
export const isNetworkError = (error) =>
  !error.response &&
  (error.code === 'ERR_NETWORK' || error.code === 'ERR_FAILED' || error.message === 'Network Error')

// ─── Gemini (Google Generative AI) ────────────────────────────────────────────
const callGemini = async (systemPrompt, prompt, model, apiKey) => {
  const geminiModel = model || PROVIDER_DEFAULT_MODELS.gemini
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`
  const { data } = await axios.post(url, {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: 1500 },
  })
  return data.candidates[0].content.parts[0].text
}

// ─── Anthropic (Claude) — now supports browser CORS with opt-in header ────────
const callAnthropic = async (systemPrompt, prompt, model, apiKey) => {
  const { data } = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model: model || PROVIDER_DEFAULT_MODELS.anthropic,
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    },
    {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true', // Opt-in browser CORS header
        'content-type': 'application/json',
      },
    }
  )
  return data.content[0].text
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

// ─── Main dispatcher ──────────────────────────────────────────────────────────
export const callAIDirectly = async (systemPrompt, prompt, settings) => {
  const provider = activeProvider(settings)
  const apiKey = providerKey(settings)
  const model = providerModel(settings)

  if (!apiKey) {
    throw new Error(`No API key for "${provider}". Go to Settings → API Keys and add your key.`)
  }

  switch (provider) {
    case 'gemma':
      return callGemini(systemPrompt, prompt, model, apiKey)

    case 'gemini':
      return callGemini(systemPrompt, prompt, model, apiKey)

    case 'anthropic':
      return callAnthropic(systemPrompt, prompt, model, apiKey)

    case 'openai':
      return callOpenAICompatible(
        'https://api.openai.com/v1/chat/completions',
        apiKey, systemPrompt, prompt, model
      )

    case 'deepseek':
      return callOpenAICompatible(
        'https://api.deepseek.com/v1/chat/completions',
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
        { 'HTTP-Referer': 'https://mezomai.vercel.app', 'X-Title': 'MEZOMAI' }
      )

    default:
      throw new Error(`Unknown AI provider: "${provider}". Check Settings → Active Provider.`)
  }
}
