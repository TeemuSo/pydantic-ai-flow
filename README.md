# Pydantic AI Flow - Visual Workflow Builder

A drag-and-drop interface for building agentic workflows using Pydantic LLM components. This tool allows you to visually create and connect different AI components to build complex workflows.

## Features

- **Visual Node Editor**: Drag-and-drop interface built with React Flow
- **Component Types**:
  - Agent Nodes: Represent AI agents that can perform tasks
  - Tool Nodes: Represent tools or functions that agents can use
  - Result Nodes: Represent output or completion states

## Project Structure

```
@tools/
├── public/              # Static files
│   └── index.html      # HTML template
├── src/                # Source code
│   ├── components/     # React components
│   │   ├── nodes/     # Custom node components
│   │   │   ├── AgentNode.tsx
│   │   │   ├── ToolNode.tsx
│   │   │   └── ResultNode.tsx
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

1. **Adding Nodes**: Drag components from the sidebar onto the canvas
2. **Connecting Nodes**: Click and drag from one node's handle to another to create connections
3. **Moving Nodes**: Click and drag nodes to reposition them
4. **Deleting**: Select nodes or edges and press delete/backspace

## Development

- The project uses TypeScript for type safety
- Components are built using Material-UI for consistent styling
- React Flow handles the graph visualization and interactions
- Custom node types are defined in the `components/nodes` directory

## Future Enhancements

- [ ] Save/Load workflow configurations
- [ ] Export workflows to Python code
- [ ] Custom node configuration panels
- [ ] Validation of workflow connections
- [ ] Integration with Pydantic model definitions 