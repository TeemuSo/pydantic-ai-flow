from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ValidationError, create_model
from typing import Optional, List, Union, Dict, Any
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

class OutputField(BaseModel):
    name: str
    type: str
    description: Optional[str] = None

class OutputStructure(BaseModel):
    name: str
    fields: List[OutputField]

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
    total_tokens_limit: int
    output_structure: Optional[OutputStructure] = None
    selected_output_fields: Optional[List[str]] = None

class AgentResponse(BaseModel):
    """Structured response from an agent"""
    content: str = Field(..., description="The response content")
    structured_output: Optional[Dict[str, Any]] = None
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
    structured_output: Optional[Dict[str, Any]] = None
    usage: Optional[dict] = None
    error: Optional[str] = None

def create_output_model(output_structure: OutputStructure):
    """Dynamically create a Pydantic model from output structure"""
    field_types = {
        'str': str,
        'int': int,
        'float': float,
        'bool': bool,
        'list[str]': List[str],
        'dict': Dict[str, Any],
    }
    
    fields = {
        field.name: (
            field_types.get(field.type, Any),
            Field(..., description=field.description or "")
        )
        for field in output_structure.fields
    }
    
    return create_model(output_structure.name, **fields)

@app.post("/api/run-agent", response_model=AgentRunResponse)
async def run_agent(request: AgentRunRequest) -> AgentRunResponse:
    try:
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

        # Create dynamic output model if output structure is provided
        result_type = None
        if request.config.output_structure:
            result_type = create_output_model(request.config.output_structure)
            logger.info(f"Created dynamic output model: {result_type}")
            
        # Create agent with structured result type
        agent = Agent(
            model,
            system_prompt=request.config.system_prompts[0] if request.config.system_prompts else "",
            result_type=result_type or str,
        )
        
        logger.info(f"Created agent with model {request.config.model_provider}:{request.config.model_name}")
        
        # Run the agent with model settings
        result = await agent.run(
            request.prompt,
            model_settings={
                "temperature": request.config.temperature,
                "max_tokens": request.config.max_tokens,
                "response_tokens_limit": request.config.response_tokens_limit,
                "total_tokens_limit": request.config.total_tokens_limit
            }
        )
        
        logger.info("Agent run completed")
        
        # Handle different result types
        if isinstance(result.data, str):
            response = AgentRunResponse(
                result=result.data,
                usage=result.usage().__dict__ if result.usage() else None
            )
        elif hasattr(result.data, '__dict__'):  # Structured output
            response = AgentRunResponse(
                result=str(result.data),  # String representation
                structured_output=result.data.__dict__,  # Structured data
                usage=result.usage().__dict__ if result.usage() else None
            )
        else:
            response = AgentRunResponse(
                result="Error: Unexpected result type",
                error="UnexpectedResultType",
                usage=result.usage().__dict__ if result.usage() else None
            )
            
        logger.info("Returning successful response")
        return response
        
    except ValidationError as e:
        error_msg = f"Validation error: {e.json()}"
        logger.error(error_msg)
        raise HTTPException(status_code=422, detail=e.errors())
    except Exception as e:
        error_msg = f"Error running agent: {str(e)}"
        logger.error(error_msg, exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

class FlowNode(BaseModel):
    id: str
    type: str
    config: AgentConfig
    position: Dict[str, float]

class FlowEdge(BaseModel):
    id: str
    source: str
    target: str

class GenerateCodeRequest(BaseModel):
    nodes: List[FlowNode]
    edges: List[FlowEdge]

def generate_python_code(nodes: List[FlowNode], edges: List[FlowEdge]) -> str:
    code = [
        "from typing import Optional, List, Dict, Any, Union",
        "from pydantic import BaseModel, Field",
        "from pydantic_ai import Agent",
        "from pydantic_ai.models.openai import OpenAIModel",
        "from pydantic_ai.models.anthropic import AnthropicModel",
        "from pydantic_ai.models.gemini import GeminiModel",
        "",
        "# Output Models",
    ]
    
    # Generate Pydantic models for each agent's output structure
    for node in nodes:
        if node.config.output_structure:
            fields = []
            for field in node.config.output_structure.fields:
                field_str = f"    {field.name}: {field.type}"
                if field.description:
                    field_str += f' = Field(description="{field.description}")'
                fields.append(field_str)
                
            code.extend([
                f"class {node.config.output_structure.name}(BaseModel):",
                *fields,
                ""
            ])
    
    # Generate the main flow execution code
    code.extend([
        "def run_flow(prompt: str, credentials: dict) -> List[Dict[str, Any]]:",
        "    results = []",
        "",
    ])
    
    # Create a dictionary of node IDs to their output variables
    node_outputs = {}
    
    # Process nodes in order based on edges
    processed_nodes = set()
    nodes_by_id = {node.id: node for node in nodes}
    
    def get_input_nodes(node_id: str) -> List[str]:
        return [edge.source for edge in edges if edge.target == node_id]
    
    while len(processed_nodes) < len(nodes):
        for node in nodes:
            if node.id in processed_nodes:
                continue
                
            input_nodes = get_input_nodes(node.id)
            if not all(n in processed_nodes for n in input_nodes):
                continue
            
            var_name = f"result_{node.id}"
            node_outputs[node.id] = var_name
            
            # Get model setup code
            model_setup = {
                'openai': 'OpenAIModel',
                'anthropic': 'AnthropicModel',
                'google-gla': 'GeminiModel'
            }[node.config.model_provider]
            
            # Get input construction
            input_construction = "prompt"
            if input_nodes:
                selected_fields = []
                for input_id in input_nodes:
                    input_node = nodes_by_id[input_id]
                    if input_node.config.selectedOutputFields:
                        for field in input_node.config.selectedOutputFields:
                            selected_fields.append(f"{node_outputs[input_id]}.{field}")
                if selected_fields:
                    input_construction = f"prompt + '\\n\\nContext: ' + ' '.join([str(x) for x in [{', '.join(selected_fields)}]])"
            
            # Generate agent code
            result_type = "str"
            if node.config.output_structure:
                result_type = node.config.output_structure.name
            
            code.extend([
                f"    # {node.config.label}",
                f"    model = {model_setup}(",
                f"        '{node.config.model_name}',",
                f"        api_key=credentials['{node.config.model_provider}_api_key']",
                "    )",
                "",
                f"    agent = Agent(",
                "        model,",
                f"        system_prompt='{node.config.systemPrompts[0] if node.config.systemPrompts else ''}',",
                f"        result_type={result_type}",
                "    )",
                "",
                f"    {var_name} = agent.run_sync(",
                f"        {input_construction},",
                "        model_settings={",
                f"            'temperature': {node.config.temperature},",
                f"            'max_tokens': {node.config.maxTokens},",
                f"            'response_tokens_limit': {node.config.responseTokensLimit},",
                f"            'total_tokens_limit': {node.config.totalTokensLimit}",
                "        }",
                "    ).data",
                "",
                f"    results.append({{",
                f"        'node_id': '{node.id}',",
                f"        'result': {var_name}",
                "    })",
                ""
            ])
            
            processed_nodes.add(node.id)
    
    code.extend([
        "    return results",
        "",
        "if __name__ == '__main__':",
        "    # Example usage",
        "    credentials = {",
        "        'openai_api_key': 'your-openai-key',",
        "        'anthropic_api_key': 'your-anthropic-key',",
        "        'google_api_key': 'your-google-key'",
        "    }",
        "    results = run_flow('Your prompt here', credentials)",
        "    for result in results:",
        "        print(f\"Node {result['node_id']} output:\")",
        "        print(result['result'])",
        ""
    ])
    
    return "\n".join(code)

@app.post("/api/generate-code")
async def generate_code(request: GenerateCodeRequest) -> Dict[str, str]:
    try:
        code = generate_python_code(request.nodes, request.edges)
        return {"code": code}
    except Exception as e:
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