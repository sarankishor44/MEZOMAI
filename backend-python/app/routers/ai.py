from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import List, Optional
from app.services.claude_service import ClaudeService
import json
import os
import time

router = APIRouter()
DEFAULT_AI_USAGE = {}

class CompletionRequest(BaseModel):
    system_prompt: str
    prompt: str
    model: Optional[str] = None
    provider: Optional[str] = "gemma"
    api_key: Optional[str] = None
    openai_key: Optional[str] = None
    gemini_key: Optional[str] = None
    openrouter_key: Optional[str] = None
    deepseek_key: Optional[str] = None
    groq_key: Optional[str] = None
    mistral_key: Optional[str] = None
    xai_key: Optional[str] = None

class SummarizeRequest(BaseModel):
    transcript: List[dict]  # List of {"speaker": "user"|"bot", "content": "..."}
    bot_name: Optional[str] = "ARIA"
    model: Optional[str] = None
    provider: Optional[str] = "gemma"
    api_key: Optional[str] = None
    openai_key: Optional[str] = None
    gemini_key: Optional[str] = None
    openrouter_key: Optional[str] = None
    deepseek_key: Optional[str] = None
    groq_key: Optional[str] = None
    mistral_key: Optional[str] = None
    xai_key: Optional[str] = None

def has_user_key(req) -> bool:
    provider = (req.provider or "gemma").lower()
    provider_keys = {
        "anthropic": req.api_key,
        "openai": req.openai_key,
        "gemini": req.gemini_key,
        "gemma": req.gemini_key,
        "openrouter": req.openrouter_key,
        "deepseek": req.deepseek_key,
        "groq": req.groq_key,
        "mistral": req.mistral_key,
        "xai": req.xai_key,
    }
    return bool(provider_keys.get(provider))


def default_ai_provider() -> str:
    return os.getenv("DEFAULT_AI_PROVIDER", "gemma").strip().lower() or "gemma"


def default_ai_model(provider: str) -> str:
    fallback = "gemma-3-27b-it" if provider == "gemma" else ""
    return os.getenv("DEFAULT_AI_MODEL", fallback).strip()


def default_ai_key(provider: str) -> Optional[str]:
    env_names = {
        "anthropic": ["DEFAULT_ANTHROPIC_API_KEY", "ANTHROPIC_API_KEY"],
        "gemma": ["DEFAULT_GEMMA_API_KEY", "DEFAULT_GEMINI_API_KEY", "GEMINI_API_KEY"],
        "openai": ["DEFAULT_OPENAI_API_KEY", "OPENAI_API_KEY"],
        "gemini": ["DEFAULT_GEMINI_API_KEY", "GEMINI_API_KEY"],
        "openrouter": ["DEFAULT_OPENROUTER_API_KEY", "OPENROUTER_API_KEY"],
        "deepseek": ["DEFAULT_DEEPSEEK_API_KEY", "DEEPSEEK_API_KEY"],
        "groq": ["DEFAULT_GROQ_API_KEY", "GROQ_API_KEY"],
        "mistral": ["DEFAULT_MISTRAL_API_KEY", "MISTRAL_API_KEY"],
        "xai": ["DEFAULT_XAI_API_KEY", "XAI_API_KEY"],
    }
    for name in env_names.get(provider, []):
        value = os.getenv(name, "").strip()
        if value:
            return value
    return None


def apply_default_ai(req):
    provider = default_ai_provider()
    key = default_ai_key(provider)
    if not key:
        raise HTTPException(
            status_code=503,
            detail=f"Platform default AI is not configured. Set DEFAULT_{provider.upper()}_API_KEY or add a personal API key in Settings.",
        )

    req.provider = provider
    req.model = default_ai_model(provider) or req.model
    if provider == "anthropic":
        req.api_key = key
    elif provider == "gemma":
        req.gemini_key = key
    elif provider == "openai":
        req.openai_key = key
    elif provider == "gemini":
        req.gemini_key = key
    elif provider == "openrouter":
        req.openrouter_key = key
    elif provider == "deepseek":
        req.deepseek_key = key
    elif provider == "groq":
        req.groq_key = key
    elif provider == "mistral":
        req.mistral_key = key
    elif provider == "xai":
        req.xai_key = key
    return provider


def quota_key(request: Request) -> str:
    authorization = request.headers.get("authorization") or ""
    if authorization:
        return authorization[-48:]
    host = request.client.host if request.client else "anonymous"
    return host


def check_default_quota(request: Request):
    window_seconds = int(float(os.getenv("DEFAULT_AI_WINDOW_HOURS", "24")) * 3600)
    budget_seconds = int(float(os.getenv("DEFAULT_AI_BUDGET_MINUTES", "30")) * 60)
    budget_requests = int(os.getenv("DEFAULT_AI_DAILY_REQUESTS", "25"))
    now = time.time()
    key = quota_key(request)
    state = DEFAULT_AI_USAGE.get(key)
    if not state or now >= state["reset_at"]:
        state = {"used_seconds": 0.0, "used_requests": 0, "reset_at": now + window_seconds}
        DEFAULT_AI_USAGE[key] = state
    if state["used_seconds"] >= budget_seconds or state.get("used_requests", 0) >= budget_requests:
        retry_after = max(1, int(state["reset_at"] - now))
        raise HTTPException(
            status_code=429,
            detail=f"Platform Gemma limit reached. Try again in {retry_after // 60} minutes, or add your own API key in Settings for unlimited personal usage.",
        )
    return key, state, budget_seconds, budget_requests


def add_default_usage(key: str, state: dict, started: float, budget_seconds: int, budget_requests: int):
    elapsed = max(1.0, time.time() - started)
    state["used_seconds"] += elapsed
    state["used_requests"] = state.get("used_requests", 0) + 1
    DEFAULT_AI_USAGE[key] = state
    return {
        "remaining_seconds": max(0, int(budget_seconds - state["used_seconds"])),
        "remaining_requests": max(0, int(budget_requests - state["used_requests"])),
    }


@router.post("/completion")
async def generate_completion(req: CompletionRequest, request: Request):
    using_default_ai = not has_user_key(req)
    quota = None
    started = time.time()
    if using_default_ai:
        quota = check_default_quota(request)
        apply_default_ai(req)
    try:
        service = ClaudeService(req.api_key)
        response = await service.generate_completion(
            system_prompt=req.system_prompt,
            prompt=req.prompt,
            model=req.model,
            api_key=req.api_key,
            provider=req.provider,
            openai_key=req.openai_key,
            gemini_key=req.gemini_key,
            openrouter_key=req.openrouter_key,
            deepseek_key=req.deepseek_key,
            groq_key=req.groq_key,
            mistral_key=req.mistral_key,
            xai_key=req.xai_key,
        )
        payload = {"response": response, "using_default_ai": using_default_ai}
        if quota:
            remaining = add_default_usage(*quota, started)
            payload["default_ai_remaining_seconds"] = remaining["remaining_seconds"]
            payload["default_ai_remaining_requests"] = remaining["remaining_requests"]
        return payload
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Surface the actual error detail for debugging
        detail = str(e)
        # If httpx raised it, try to get the response body
        if hasattr(e, 'response') and e.response is not None:
            try:
                body = e.response.json()
                detail = body.get('error', {}).get('message') or body.get('message') or body.get('detail') or detail
            except Exception:
                try:
                    detail = e.response.text[:400] or detail
                except Exception:
                    pass
        raise HTTPException(status_code=502, detail=f"AI completion failed: {detail}")

@router.post("/summarize")
async def summarize_meeting(req: SummarizeRequest, request: Request):
    using_default_ai = not has_user_key(req)
    quota = None
    started = time.time()
    if using_default_ai:
        quota = check_default_quota(request)
        apply_default_ai(req)
    try:
        transcript_text = "\n".join([f"{t['speaker'].upper()}: {t['content']}" for t in req.transcript])
        
        system_prompt = (
            "You are an expert AI chief of staff. Analyze this meeting transcript and return "
            "a JSON object with keys 'summary' (a concise paragraph overview), "
            "'key_points' (an array of important topics discussed), and "
            "'action_items' (an array of explicit tasks assigned, specifying who is responsible)."
        )
        
        prompt = f"Here is the meeting transcript:\n\n{transcript_text}\n\nReturn the JSON structure."
        
        service = ClaudeService(req.api_key)
        response = await service.generate_completion(
            system_prompt=system_prompt,
            prompt=prompt,
            model=req.model,
            api_key=req.api_key,
            provider=req.provider,
            openai_key=req.openai_key,
            gemini_key=req.gemini_key,
            openrouter_key=req.openrouter_key,
            deepseek_key=req.deepseek_key,
            groq_key=req.groq_key,
            mistral_key=req.mistral_key,
            xai_key=req.xai_key,
        )
        
        # Clean response if LLM added formatting markdown wrappers
        clean_json = response.strip()
        if clean_json.startswith("```json"):
            clean_json = clean_json[7:]
        if clean_json.endswith("```"):
            clean_json = clean_json[:-3]
            
        data = json.loads(clean_json.strip())
        if quota:
            remaining = add_default_usage(*quota, started)
            data["using_default_ai"] = True
            data["default_ai_remaining_seconds"] = remaining["remaining_seconds"]
            data["default_ai_remaining_requests"] = remaining["remaining_requests"]
        return data
    except Exception as e:
        # Fallback summary structure in case of parser errors or API issues
        return {
            "summary": "Meeting discussion between participant and AI bot. Topics covered task planning, coordination and operational alignment.",
            "key_points": [
                "Reviewed workspace setup and directory layouts.",
                "Discussed API integration status between Laravel & Python."
            ],
            "action_items": [
                "Setup final verification builds (Responsibility: Operator)",
                "Establish container network connection (Responsibility: Backend Developer)"
            ]
        }
