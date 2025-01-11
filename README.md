# Pydantic AI Flow - Visual Workflow Builder

A drag-and-drop interface for building agentic workflows using Pydantic LLM components. This tool allows you to visually create and connect different AI components to build complex workflows.

## Features

- **Visual Node Editor**: 
  - Drag-and-drop interface built with React Flow
  - Persistent workspace - nodes and connections are saved automatically
  - Real-time configuration updates

- **Agent Configuration**:
  - Multiple model providers support (OpenAI, Anthropic, Google)
  - Pre-configured default settings for quick setup
  - Temperature and token limit controls
  - Multiple system prompts support
  - Usage limits configuration
  - Custom output structure definition using Pydantic models
  - Field selection for inter-agent communication

- **Multi-Agent Workflows**:
  - Chain multiple agents together
  - Pass structured data between agents
  - Configure which output fields to pass to next agent
  - Sequential execution of agent chain
  - Full conversation history maintained through the chain

- **Structured Outputs**:
  - Define custom output structures using Pydantic models
  - Support for various data types (string, int, float, bool, lists)
  - Field descriptions for better documentation
  - Real-time validation of structured outputs
  - Visual output field selection

- **Code Generation**:
  - Export flows as runnable Python code
  - Generated code includes:
    - All Pydantic models for output structures
    - Complete agent configurations
    - Flow execution logic
    - Field selection and data passing between agents

- **API Key Management**:
  - Secure storage of API keys in browser's localStorage
  - Support for multiple providers (OpenAI, Anthropic, Google)
  - Easy-to-use configuration interface

- **Persistence**:
  - Auto-save feature for workflow configurations
  - Persistent storage of:
    - Node positions and connections
    - Agent configurations
    - API keys
    - Output structures
    - Selected output fields
  - Clear storage when removing all nodes

## Project Structure

```
@tools/
├── public/              # Static files
│   └── index.html      # HTML template
├── src/                # Source code
│   ├── components/     # React components
│   │   ├── nodes/     # Custom node components
│   │   │   ├── AgentNode.tsx    # Agent configuration component
│   │   │   ├── ToolNode.tsx     # Tool definition component
│   │   │   └── ResultNode.tsx   # Result handling component
│   │   ├── Flow.tsx            # Main flow canvas
│   │   ├── InputPanel.tsx      # Message input component
│   │   ├── ResultsPanel.tsx    # Results display component
│   │   ├── APIKeyConfig.tsx    # API key management
│   │   └── Sidebar.tsx         # Component sidebar
│   ├── types/         # TypeScript type definitions
│   ├── App.tsx        # Root component
│   └── index.tsx      # Entry point
├── package.json       # Dependencies and scripts
└── tsconfig.json     # TypeScript configuration
```

## Technology Stack

- React with TypeScript
- Material-UI (MUI) for UI components
- React Flow for graph visualization
- FastAPI backend for agent execution
- Pydantic AI for LLM interactions
- LocalStorage for persistence

## Getting Started

1. Install dependencies:
   ```bash
   cd @tools
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Start the backend server:
   ```bash
   cd src/backend
   pip install -r requirements.txt
   python server.py
   ```

4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Usage

1. **Setting up API Keys**:
   - Click the settings icon in the top right
   - Enter your API keys for desired providers
   - Keys are automatically saved for future sessions

2. **Creating a Workflow**:
   - Drag agent nodes from the sidebar onto the canvas
   - Connect nodes by dragging between connection points
   - Configure each agent's settings:
     - Model provider and version
     - Temperature and token limits
     - System prompts
     - Output structure and fields

3. **Configuring Output Structures**:
   - Define the structure name (e.g., "UserProfile")
   - Add fields with types (string, int, float, bool, etc.)
   - Add optional field descriptions
   - Select which fields to pass to next agent

4. **Running the Workflow**:
   - Type your message in the input panel
   - Click send or press Enter
   - View results in the results panel
   - See structured outputs and raw responses
   - Selected fields are automatically passed to next agent

5. **Generating Python Code**:
   - Click "Generate Python Code" button
   - Download the generated Python script
   - The script includes:
     - All Pydantic models
     - Agent configurations
     - Flow execution logic
     - Can be run independently of the UI

6. **Managing the Workspace**:
   - All changes are automatically saved
   - Workspace persists between sessions
   - Clear workspace by removing all nodes

## Development

- Uses TypeScript for type safety
- Material-UI components for consistent styling
- React Flow handles graph visualization
- Custom node types in `components/nodes`
- Persistent storage using localStorage
- FastAPI backend for agent execution
- Pydantic models for structured data

## Future Enhancements

- [ ] Support for parallel agent execution
- [ ] Branching and merging flows
- [ ] Advanced error handling and recovery
- [ ] Flow testing and debugging tools
- [ ] Import/Export workflow configurations
- [ ] Real-time collaboration features
- [ ] Custom tool integration
- [ ] Flow versioning and history 