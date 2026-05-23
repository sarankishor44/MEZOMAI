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
    ) -> str:
        provider = (provider or "anthropic").lower()
        if provider == "openai":
            return await self._openai_completion(system_prompt, prompt, model, openai_key)
        if provider == "gemini":
            return await self._gemini_completion(system_prompt, prompt, model, gemini_key)
        return await self._anthropic_completion(system_prompt, prompt, model, api_key)

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
        if not key:
            raise ValueError("OpenAI API key is missing.")
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
                json={
                    "model": model or "gpt-4o-mini",
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
        gemini_model = model or "gemini-1.5-flash"
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
