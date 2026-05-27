import os
import httpx
from anthropic import AsyncAnthropic


class ClaudeService:
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")

    def _anthropic_client(self, override_key: str = None):
        key = override_key or self.api_key
        if not key:
            raise ValueError("Anthropic API key is missing.")
        return AsyncAnthropic(api_key=key)

    async def generate_completion(
        self,
        system_prompt: str,
        prompt: str,
        model: str = None,
        api_key: str = None,
        provider: str = "anthropic",
        openai_key: str = None,
        gemini_key: str = None,
        openrouter_key: str = None,
        deepseek_key: str = None,
        groq_key: str = None,
        mistral_key: str = None,
        xai_key: str = None,
    ) -> str:
        provider = (provider or "anthropic").lower()
        if provider == "openai":
            return await self._openai_completion(system_prompt, prompt, self._model_for_provider(provider, model), openai_key)
        if provider == "gemini":
            return await self._gemini_completion(system_prompt, prompt, self._model_for_provider(provider, model), gemini_key)
        if provider == "openrouter":
            return await self._openai_compatible_completion(
                "https://openrouter.ai/api/v1/chat/completions",
                openrouter_key or os.getenv("OPENROUTER_API_KEY"),
                system_prompt,
                prompt,
                self._model_for_provider(provider, model),
                {"HTTP-Referer": os.getenv("APP_URL", "https://mezomai.vercel.app"), "X-Title": "MEZOMAI"},
            )
        if provider == "deepseek":
            return await self._openai_compatible_completion(
                "https://api.deepseek.com/v1/chat/completions",
                deepseek_key or os.getenv("DEEPSEEK_API_KEY"),
                system_prompt,
                prompt,
                self._model_for_provider(provider, model),
            )
        if provider == "groq":
            return await self._openai_compatible_completion(
                "https://api.groq.com/openai/v1/chat/completions",
                groq_key or os.getenv("GROQ_API_KEY"),
                system_prompt,
                prompt,
                self._model_for_provider(provider, model),
            )
        if provider == "mistral":
            return await self._openai_compatible_completion(
                "https://api.mistral.ai/v1/chat/completions",
                mistral_key or os.getenv("MISTRAL_API_KEY"),
                system_prompt,
                prompt,
                self._model_for_provider(provider, model),
            )
        if provider == "xai":
            return await self._openai_compatible_completion(
                "https://api.x.ai/v1/chat/completions",
                xai_key or os.getenv("XAI_API_KEY"),
                system_prompt,
                prompt,
                self._model_for_provider(provider, model),
            )
        return await self._anthropic_completion(system_prompt, prompt, self._model_for_provider("anthropic", model), api_key)

    def _model_for_provider(self, provider: str, model: str = None) -> str:
        provider = (provider or "anthropic").lower()
        defaults = {
            "anthropic": "claude-3-5-sonnet-20241022",
            "openai": "gpt-4o-mini",
            "gemini": "gemini-2.0-flash",
            "openrouter": "openai/gpt-4o-mini",
            "deepseek": "deepseek-chat",
            "groq": "llama-3.1-8b-instant",
            "mistral": "mistral-small-latest",
            "xai": "grok-2-latest",
        }
        if not model:
            return defaults.get(provider, defaults["anthropic"])
        lower_model = model.lower()
        provider_prefixes = {
            "anthropic": ("claude",),
            "openai": ("gpt", "o1", "o3", "o4"),
            "gemini": ("gemini",),
            "openrouter": ("openai/", "anthropic/", "google/", "meta-llama/", "mistralai/", "deepseek/", "x-ai/"),
            "deepseek": ("deepseek",),
            "groq": ("llama", "mixtral", "gemma", "qwen", "whisper", "distil"),
            "mistral": ("mistral", "ministral", "codestral", "open-"),
            "xai": ("grok",),
        }
        prefixes = provider_prefixes.get(provider)
        if prefixes and not lower_model.startswith(prefixes):
            return defaults.get(provider, defaults["anthropic"])
        return model

    async def _anthropic_completion(self, system_prompt: str, prompt: str, model: str = None, api_key: str = None) -> str:
        client = self._anthropic_client(api_key)
        response = await client.messages.create(
            model=model or "claude-3-5-sonnet-20241022",
            max_tokens=2000,
            system=system_prompt,
            messages=[{"role": "user", "content": prompt}],
        )
        return response.content[0].text

    async def _openai_completion(self, system_prompt: str, prompt: str, model: str = None, api_key: str = None) -> str:
        key = api_key or os.getenv("OPENAI_API_KEY")
        return await self._openai_compatible_completion(
            "https://api.openai.com/v1/chat/completions",
            key,
            system_prompt,
            prompt,
            model or "gpt-4o-mini",
        )

    async def _openai_compatible_completion(
        self,
        url: str,
        api_key: str,
        system_prompt: str,
        prompt: str,
        model: str,
        extra_headers: dict = None,
    ) -> str:
        if not api_key:
            raise ValueError("AI provider API key is missing.")
        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
        if extra_headers:
            headers.update(extra_headers)
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                url,
                headers=headers,
                json={
                    "model": model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": prompt},
                    ],
                    "max_tokens": 1200,
                },
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]

    async def _gemini_completion(self, system_prompt: str, prompt: str, model: str = None, api_key: str = None) -> str:
        key = api_key or os.getenv("GEMINI_API_KEY")
        if not key:
            raise ValueError("Gemini API key is missing.")
        gemini_model = model or "gemini-2.0-flash"
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{gemini_model}:generateContent?key={key}",
                json={
                    "systemInstruction": {"parts": [{"text": system_prompt}]},
                    "contents": [{"role": "user", "parts": [{"text": prompt}]}],
                    "generationConfig": {"maxOutputTokens": 1200},
                },
            )
            response.raise_for_status()
            data = response.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]
