from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from .models import AgentConfig, APICredentials
from .agents import create_agent_from_config

app = FastAPI()

class AgentRunRequest(BaseModel):
    """Request model for running an agent"""
    config: AgentConfig
    credentials: APICredentials
    prompt: str

class AgentRunResponse(BaseModel):
    """Response model for agent execution"""
    result: str
    usage: Optional[dict] = None
    error: Optional[str] = None

@app.post("/api/run-agent", response_model=AgentRunResponse)
async def run_agent(request: AgentRunRequest) -> AgentRunResponse:
    try:
        # Create agent from config
        agent = create_agent_from_config(request.config)
        
        # Run the agent
        result = await agent.run(
            request.prompt,
            deps=request.credentials,
            model_settings={
                "temperature": request.config.temperature,
                "max_tokens": request.config.max_tokens
            }
        )
        
        # Return response
        return AgentRunResponse(
            result=result.data,
            usage=result.usage().__dict__ if result.usage() else None
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 