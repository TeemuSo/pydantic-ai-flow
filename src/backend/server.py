from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ValidationError
from typing import Optional, List, Union
import uvicorn
from pydantic_ai import Agent
import logging
import sys

# Configure logging to output to stdout with a specific format
logging.basicConfig(
    level=logging.DEBUG,  # Set to DEBUG for more verbose output
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Test log
logger.info("Server starting up...")

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class APICredentials(BaseModel):
    """API credentials for different LLM providers"""
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    google_api_key: Optional[str] = None

class AgentConfig(BaseModel):
    """Configuration for a single agent node"""
    label: str
    model_provider: str
    model_name: str
    temperature: float
    max_tokens: int
    system_prompts: List[str]
    response_tokens_limit: int
    request_limit: int
    total_tokens_limit: int

class AgentResponse(BaseModel):
    """Structured response from an agent"""
    content: str = Field(..., description="The response content")
    metadata: dict = Field(default_factory=dict, description="Additional metadata about the response")

class AgentError(BaseModel):
    """Error response from an agent"""
    error_message: str = Field(..., description="Description of what went wrong")
    error_type: str = Field(..., description="Type of error that occurred")

AgentResult = Union[AgentResponse, AgentError]

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
        # Log the incoming request data
        logger.info("Received agent run request")
        logger.debug(f"Request config: {request.config}")
        logger.debug(f"Request prompt: {request.prompt}")
        
        # Get the appropriate API key based on the model provider
        api_key = None
        model = None
        
        if request.config.model_provider == 'openai':
            from pydantic_ai.models.openai import OpenAIModel
            api_key = request.credentials.openai_api_key
            if not api_key:
                raise HTTPException(status_code=400, detail="Missing OpenAI API key")
            model = OpenAIModel(request.config.model_name, api_key=api_key)
        elif request.config.model_provider == 'anthropic':
            from pydantic_ai.models.anthropic import AnthropicModel
            api_key = request.credentials.anthropic_api_key
            if not api_key:
                raise HTTPException(status_code=400, detail="Missing Anthropic API key")
            model = AnthropicModel(request.config.model_name, api_key=api_key)
        elif request.config.model_provider == 'google-gla':
            from pydantic_ai.models.gemini import GeminiModel
            api_key = request.credentials.google_api_key
            if not api_key:
                raise HTTPException(status_code=400, detail="Missing Google API key")
            model = GeminiModel(request.config.model_name, api_key=api_key)
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported model provider: {request.config.model_provider}"
            )
            
        # Create agent with structured result type
        agent = Agent(
            model,
            system_prompt=request.config.system_prompts[0] if request.config.system_prompts else "",
            result_type=AgentResult,  # type: ignore
        )
        
        logger.info(f"Created agent with model {request.config.model_provider}:{request.config.model_name}")
        
        # Run the agent with model settings
        result = await agent.run(
            request.prompt,
            model_settings={
                "temperature": request.config.temperature,
                "max_tokens": request.config.max_tokens,
                "response_tokens_limit": request.config.response_tokens_limit,
                "request_limit": request.config.request_limit,
                "total_tokens_limit": request.config.total_tokens_limit
            }
        )
        
        logger.info("Agent run completed")
        
        # Handle different result types
        if isinstance(result.data, AgentResponse):
            response = AgentRunResponse(
                result=result.data.content,
                usage=result.usage().__dict__ if result.usage() else None
            )
            logger.info("Returning successful response")
            return response
        else:
            response = AgentRunResponse(
                result="Error: " + result.data.error_message,
                error=result.data.error_type,
                usage=result.usage().__dict__ if result.usage() else None
            )
            logger.warning(f"Returning error response: {response.error}")
            return response
        
    except ValidationError as e:
        error_msg = f"Validation error: {e.json()}"
        logger.error(error_msg)
        raise HTTPException(status_code=422, detail=e.errors())
    except Exception as e:
        error_msg = f"Error running agent: {str(e)}"
        logger.error(error_msg, exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    logger.info("Starting server...")
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="debug"
    ) 