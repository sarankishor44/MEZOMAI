from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import subprocess
import tempfile
import os
import sys
import time

router = APIRouter()

class CodeRunRequest(BaseModel):
    code: str
    language: str  # python | javascript

@router.post("/run")
async def run_code(req: CodeRunRequest):
    if req.language.lower() not in ["python", "javascript", "js"]:
        raise HTTPException(status_code=400, detail="Unsupported language. Use python or javascript.")

    suffix = ".py" if req.language.lower() == "python" else ".js"
    
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(req.code.encode('utf-8'))
        tmp_path = tmp.name

    started = time.perf_counter()
    try:
        if req.language.lower() == "python":
            cmd = [sys.executable, tmp_path]
        else:
            cmd = ["node", tmp_path]

        # Execute code in shell, timeout in 5 seconds
        process = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=5.0
        )
        
        return {
            "stdout": process.stdout,
            "stderr": process.stderr,
            "exit_code": process.returncode,
            "duration_ms": round((time.perf_counter() - started) * 1000),
        }

    except subprocess.TimeoutExpired:
        return {
            "stdout": "",
            "stderr": "Execution Error: Subprocess timed out after 5.0 seconds.",
            "exit_code": -1,
            "duration_ms": round((time.perf_counter() - started) * 1000),
        }
    except Exception as e:
        return {
            "stdout": "",
            "stderr": f"System Error executing code: {type(e).__name__}",
            "exit_code": -1,
            "duration_ms": round((time.perf_counter() - started) * 1000),
        }
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
