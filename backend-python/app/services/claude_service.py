import os
from anthropic import AsyncAnthropic

class ClaudeService:
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        
    def _get_client(self, override_key: str = None):
        key = override_key or self.api_key
        if not key:
            raise ValueError("Anthropic API Key is missing. Configure it in settings.")
        return AsyncAnthropic(api_key=key)

    async def generate_completion(self, system_prompt: str, prompt: str, model: str, api_key: str = None) -> str:
        client = self._get_client(api_key)
        response = await client.messages.create(
            model=model or "claude-3-5-sonnet-20241022",
            max_tokens=2000,
            system=system_prompt,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        return response.content[0].text

    async def generate_stream(self, system_prompt: str, messages: list, model: str, api_key: str = None):
        client = self._get_client(api_key)
        # Format messages for Anthropic SDK
        formatted_messages = []
        for msg in messages:
            formatted_messages.append({
                "role": "user" if msg["role"] == "user" else "assistant",
                "content": msg["content"]
            })

        async with client.messages.stream(
            model=model or "claude-3-5-sonnet-20241022",
            max_tokens=2000,
            system=system_prompt,
            messages=formatted_messages
        ) as stream:
            async for event in stream:
                if event.type == "content_block_delta":
                    yield event.delta.text
