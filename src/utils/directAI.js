// Direct browser-side AI calls — used as fallback when Python backend is unreachable (e.g. CORS)
import axios from 'axios'
import { activeProvider, providerKey, providerModel, PROVIDER_DEFAULT_MODELS } from './aiConfig'

// Returns true when the error is a network/CORS block (no response from server)
export const isNetworkError = (error) =>
  !error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error')

// Direct Gemini call from the browser
const callGemini = async (systemPrompt, prompt, model, apiKey) => {
  const geminiModel = model || PROVIDER_DEFAULT_MODELS.gemini
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`
  const { data } = await axios.post(url, {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: 1200 },
  })
  return data.candidates[0].content.parts[0].text
}

// Direct OpenAI-compatible call from the browser
const callOpenAICompatible = async (baseUrl, apiKey, systemPrompt, prompt, model, extraHeaders = {}) => {
  const { data } = await axios.post(
    baseUrl,
    {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1200,
    },
    { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', ...extraHeaders } }
  )
  return data.choices[0].message.content
}

// Main direct-call dispatcher — mirrors the Python backend's logic
export const callAIDirectly = async (systemPrompt, prompt, settings) => {
  const provider = activeProvider(settings)
  const apiKey = providerKey(settings)
  const model = providerModel(settings)

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
        'https://api.deepseek.com/chat/completions',
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

    case 'anthropic': {
      // Anthropic doesn't have browser CORS support, give helpful message
      throw new Error('Anthropic (Claude) requires the Python backend. Please use Gemini, DeepSeek, Groq, Mistral, or OpenAI while the backend CORS issue is being resolved.')
    }

    default:
      throw new Error(`Unknown provider: ${provider}`)
  }
}
