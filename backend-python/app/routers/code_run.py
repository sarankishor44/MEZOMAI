from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import subprocess
import tempfile
import os

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

    try:
        if req.language.lower() == "python":
            cmd = ["python", tmp_path]
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
            "exit_code": process.returncode
        }

    except subprocess.TimeoutExpired:
        return {
            "stdout": "",
            "stderr": "Execution Error: Subprocess timed out after 5.0 seconds.",
            "exit_code": -1
        }
    except Exception as e:
        return {
            "stdout": "",
            "stderr": "System Error executing code.",
            "exit_code": -1
        }
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
