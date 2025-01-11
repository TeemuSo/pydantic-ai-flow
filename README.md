# Pydantic AI Flow - Visual Workflow Builder

A drag-and-drop interface for building agentic workflows using Pydantic LLM components. This tool allows you to visually create and connect different AI components to build complex workflows.

## Features

- **Visual Node Editor**: Drag-and-drop interface built with React Flow
- **Component Types**:
  - Agent Nodes: Represent AI agents that can perform tasks
    - Configurable model settings (OpenAI, Anthropic, Google)
    - Temperature and token limit controls
    - Multiple system prompts support
    - Usage limits configuration
  - Tool Nodes: Represent tools or functions that agents can use
  - Result Nodes: Represent output or completion states
- **Interactive UI**:
  - Dedicated drag handles for better node manipulation
  - Real-time configuration updates
  - Type-safe implementation

## Project Structure

```
@tools/
├── public/              # Static files
│   └── index.html      # HTML template
├── src/                # Source code
│   ├── components/     # React components
│   │   ├── nodes/     # Custom node components
│   │   │   ├── AgentNode.tsx   # Agent configuration component
│   │   │   ├── ToolNode.tsx    # Tool definition component
│   │   │   └── ResultNode.tsx  # Result handling component
│   │   ├── Flow.tsx   # Main flow canvas
│   │   └── Sidebar.tsx # Component sidebar
│   ├── App.tsx        # Root component
│   └── index.tsx      # Entry point
├── package.json       # Dependencies and scripts
└── tsconfig.json     # TypeScript configuration
```

## Technology Stack

- React
- TypeScript
- Material-UI (MUI)
- React Flow
- Emotion (for styling)

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

3. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Usage

1. **Adding Nodes**: 
   - Drag components from the sidebar onto the canvas
   - Each node type has specific configuration options

2. **Configuring Agent Nodes**:
   - Select model provider (OpenAI, Anthropic, Google)
   - Choose specific model version
   - Adjust temperature (0-2) and token limits
   - Add/remove system prompts
   - Set usage limits for responses and requests
   - Configure optional dependency and result types

3. **Moving Nodes**: 
   - Use the dedicated drag handle at the top of each node
   - Click and drag nodes to reposition them

4. **Connecting Nodes**: 
   - Click and drag from one node's handle to another to create connections

5. **Deleting**: 
   - Select nodes or edges and press delete/backspace

## Development

- The project uses TypeScript for type safety
- Components are built using Material-UI for consistent styling
- React Flow handles the graph visualization and interactions
- Custom node types are defined in the `components/nodes` directory
- Type-safe implementations for all configurations

## Future Enhancements

- [ ] Save/Load workflow configurations
- [ ] Export workflows to Python code
- [ ] Validation of workflow connections
- [ ] Integration with Pydantic model definitions
- [ ] Advanced model configuration options
- [ ] Custom tool configuration interface
- [ ] Workflow testing and debugging tools 