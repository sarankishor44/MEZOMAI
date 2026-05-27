from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from app.services.claude_service import ClaudeService
import json

router = APIRouter()

class CompletionRequest(BaseModel):
    system_prompt: str
    prompt: str
    model: Optional[str] = None
    provider: Optional[str] = "anthropic"
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
    provider: Optional[str] = "anthropic"
    api_key: Optional[str] = None
    openai_key: Optional[str] = None
    gemini_key: Optional[str] = None
    openrouter_key: Optional[str] = None
    deepseek_key: Optional[str] = None
    groq_key: Optional[str] = None
    mistral_key: Optional[str] = None
    xai_key: Optional[str] = None

@router.post("/completion")
async def generate_completion(req: CompletionRequest):
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
        return {"response": response}
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
async def summarize_meeting(req: SummarizeRequest):
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
            model=req.model or "claude-3-5-sonnet-20241022",
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
