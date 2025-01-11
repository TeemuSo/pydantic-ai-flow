# Pydantic AI Flow - Visual Workflow Builder

A drag-and-drop interface for building agentic workflows using Pydantic LLM components. This tool allows you to visually create and connect different AI components to build complex workflows.

## Features

- **Visual Node Editor**: 
  - Drag-and-drop interface built with React Flow
  - Persistent workspace - nodes and connections are saved automatically
  - Real-time configuration updates
  - Collapsible configuration panels for cleaner workspace
  - Improved visual design with better spacing and layout

- **Agent Configuration**:
  - Multiple model providers support (OpenAI, Anthropic, Google)
  - Streamlined model selection with combined provider/model dropdown
  - Basic and advanced settings separation for better UX
  - Temperature and token limit controls
  - Multiple system prompts support with improved UI
  - Custom output structure definition using Pydantic models
  - Field selection for inter-agent communication
  - Tooltips and visual feedback for better usability

- **Multi-Agent Workflows**:
  - Chain multiple agents together
  - Pass structured data between agents
  - Configure which output fields to pass to next agent
  - Sequential execution of agent chain
  - Full conversation history maintained through the chain
  - Enhanced visual indicators for data flow between agents
  - Improved hover-to-view detailed data passing information
  - Persistent field selection between runs

- **Data Flow Visualization**:
  - Enhanced input data visualization with detailed field values
  - Improved visual indicators for data passing between agents
  - Clear visual selection of fields to pass forward
  - Real-time preview of selected field values
  - Automatic persistence of selected fields
  - Visual confirmation of data passing between agents
  - Collapsible sections for better workspace organization

- **Structured Outputs**:
  - Define custom output structures using Pydantic models
  - Support for various data types (string, int, float, bool, lists)
  - Field descriptions for better documentation
  - Real-time validation of structured outputs
  - Visual output field selection
  - Preview of field values before passing
  - Selective field passing between agents

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
   - Configure each agent's settings by clicking the gear icon:
     - Basic settings:
       - Agent name
       - Model selection (combined provider/model dropdown)
       - System prompts
     - Advanced settings (optional):
       - Temperature and token limits
       - Output structure configuration
       - Field selection for data passing

3. **Configuring Output Structures**:
   - In advanced settings, define the structure name (e.g., "UserProfile")
   - Add fields with types (string, int, float, bool, etc.)
   - Add optional field descriptions
   - Select which fields to pass to next agent
   - Preview structured output in a collapsible panel

4. **Running the Workflow**:
   - Click the play button on any agent node
   - Enter your message in the dialog
   - View results in the collapsible output panel
   - See structured outputs and raw responses
   - Selected fields are automatically passed to next agent

5. **Managing Data Flow Between Agents**:
   - Input data is clearly visible at the top of each agent node
   - Hover over input data to see detailed field values
   - Select output fields in the advanced settings panel
   - Preview selected fields before passing to next agent
   - Field selections persist between runs
   - Collapsible panels keep the workspace clean

6. **Generating Python Code**:
   - Click "Generate Python Code" button
   - Download the generated Python script
   - The script includes:
     - All Pydantic models
     - Agent configurations
     - Flow execution logic
     - Can be run independently of the UI

7. **Managing the Workspace**:
   - All changes are automatically saved
   - Workspace persists between sessions
   - Clear workspace by removing all nodes

## Development

- Uses TypeScript for type safety and improved type definitions
- Material-UI components with enhanced styling and animations
- React Flow handles graph visualization with custom node designs
- Custom node types with collapsible configuration panels
- Persistent storage using localStorage for all settings
- FastAPI backend for agent execution
- Pydantic models for structured data
- Improved state management for data flow between agents
- Enhanced error handling and user feedback
- Optimized rendering with React hooks

## Future Enhancements

- [ ] Support for parallel agent execution
- [ ] Branching and merging flows
- [ ] Advanced error handling and recovery
- [ ] Flow testing and debugging tools
- [ ] Import/Export workflow configurations
- [ ] Real-time collaboration features
- [ ] Custom tool integration
- [ ] Flow versioning and history
- [ ] Drag-and-drop system prompt templates
- [ ] Advanced output structure templates
- [ ] Visual flow validation and debugging
- [ ] Enhanced data visualization for complex outputs 