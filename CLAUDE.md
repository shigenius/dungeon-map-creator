# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

必ず日本語で回答してください。
t-wadaのTDDに従う

## Project Overview

This is a 3D Dungeon RPG mapping tool - a fully implemented web-based map editor for creating and managing dungeon maps for 3D RPGs. The application features a sophisticated 2D grid-based editor with real-time editing capabilities and is designed for 3D preview functionality.

## Technology Stack

- **Frontend**: React 18+ with TypeScript and Vite as build tool
- **State Management**: Redux Toolkit with structured slices
- **UI Framework**: Material-UI (MUI) with dark theme
- **3D Rendering**: Three.js (prepared, basic implementation pending)
- **Testing**: Playwright E2E testing
- **Data Format**: JSON with complex nested structures

## Architecture Overview

The application is built with a component-based React architecture:

1. **State Management**: Redux Toolkit with two main slices:
   - `mapSlice`: Manages dungeon data, cell modifications, and undo/redo history
   - `editorSlice`: Manages UI state (selected tools, layers, zoom, view modes)

2. **Component Structure**:
   - `App.tsx`: Main application with keyboard shortcuts and layout
   - `MapEditor2D.tsx`: Core canvas-based map editing with tool logic
   - Panel components: MenuBar, ToolBar, LeftPanel, RightPanel, BottomPanel
   - `NewProjectDialog.tsx`: Initial project creation workflow

3. **Data Flow**: 
   - User interactions → Redux actions → State updates → Canvas redraw
   - Keyboard shortcuts managed at App level
   - Layer visibility controls affect rendering logic

4. **Map Structure**: Hierarchical data model with Dungeon → Floors → Cells → (Floor/Walls/Events)

## Key Data Structures

### Cell Structure
Each map cell contains:
- Position coordinates (x, y)
- Floor properties (type, texture, passability)
- Wall data for all 4 directions (north, east, south, west)
- Events array
- Decorations array
- Custom properties

### Event System
Events support:
- Multiple trigger types (auto, interact, contact, item use, etc.)
- Complex action chains with conditional branching
- 8+ event types (treasure, NPC, stairs, enemies, etc.)
- Flag-based state management

## Development Commands

### Core Development
```bash
npm install          # Install dependencies
npm run dev         # Start development server (http://localhost:3000)
npm run build       # Build for production (includes TypeScript check)
npm run preview     # Preview production build
npm run lint        # Run ESLint with TypeScript rules
```

### Testing (Playwright)
```bash
npm run test        # Run Playwright E2E tests
npm run test:ui     # Run Playwright with UI mode
```

### Common Development Workflow
```bash
npm run dev         # Start dev server in background
# Make changes to src/ files
npm run build       # Verify TypeScript compilation
npm run test        # Run browser tests
```

## Implemented Features

### ✅ Core Map Editor
- Grid-based 2D map editing with HTML5 Canvas
- Multiple drawing tools: pen, rectangle, fill, eyedropper, select
- Multi-layer system: floor, walls, events, decorations with visibility toggles
- Real-time canvas redrawing with zoom (10%-400%)
- Undo/Redo system with 50-step history

### ✅ User Interface
- Material-UI dark theme with responsive layout
- Keyboard shortcuts (Ctrl+Z/Y, 1-5 for tools, Ctrl+S)
- Project creation dialog with configurable map size (5×5 to 100×100)
- Panel-based layout: MenuBar, ToolBar, LeftPanel, RightPanel, BottomPanel

### ✅ Data Management
- JSON export functionality
- Redux state persistence with structured data model
- Cell-based editing with floor passability and wall placement

### 🚧 Pending Implementation
- Three.js 3D preview system
- Advanced event system with complex triggers
- Template management system
- Map validation and balance checking

## Performance Constraints

- Maximum map size: 100×100×10 floors
- Maximum events per floor: 1000
- Maximum file size: 50MB
- Single floor editing at a time

## File Structure Expectations

The project should be organized with:
- Frontend React components for the map editor UI
- Three.js components for 3D rendering
- Redux store for state management
- Rails API endpoints for data persistence
- JSON Schema definitions for validation
- Template system for reusable components

## UI Architecture

The interface consists of:
- Menu bar (file operations, edit, view, tools, help)
- Toolbar (quick tool access)
- Left panel (layers, object list)
- Main canvas (map editing area)
- Right panel (properties, templates)
- Bottom panel (coordinates, zoom, validation results)

## Implemented Keyboard Shortcuts

- **Ctrl+Z**: Undo
- **Ctrl+Y** / **Ctrl+Shift+Z**: Redo  
- **1**: Pen tool
- **2**: Rectangle tool
- **3**: Fill tool
- **4**: Eyedropper tool
- **5**: Select tool
- **Ctrl+S**: Save (prepared, shows console log)

Note: Shortcuts are disabled during text input and when no project is loaded.