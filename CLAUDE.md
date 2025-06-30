# CLAUDE.md
必ず日本語で回答してください。
This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a 3D Dungeon RPG mapping tool - a web-based map editor for creating and managing dungeon maps for 3D RPGs. The project is designed to be comprehensive with both 2D editing capabilities and real-time 3D preview functionality.

## Technology Stack

- **Frontend**: React 18+ with Vite as build tool
- **Backend**: Rails 8+
- **State Management**: Redux Toolkit
- **3D Rendering**: Three.js for real-time 3D previews
- **UI Components**: Material-UI
- **Data Format**: JSON with JSON Schema Draft 7 validation
- **Languages**: JavaScript/TypeScript (frontend), Ruby (backend)

## Architecture Overview

The application follows a layered architecture:

1. **Map Editor Layer**: Grid-based editing with multiple drawing tools (pen, rectangle, fill, eyedropper)
2. **Layer System**: Separate layers for floor, walls, events, and decorations
3. **Event System**: Complex event handling with triggers, conditions, and actions
4. **3D Preview System**: Real-time 3D rendering of the 2D map data
5. **Template System**: Reusable room and event templates
6. **Validation System**: Map structure validation and balance checking
7. **Export System**: Multiple format support (JSON, PNG, Markdown)

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

Since this is a new project, the following commands will likely be needed once the project is set up:

### Frontend (React + Vite)
```bash
npm install          # Install dependencies
npm run dev         # Start development server
npm run build       # Build for production
npm run preview     # Preview production build
npm run lint        # Run ESLint
npm run test        # Run tests
```

### Backend (Rails)
```bash
bundle install      # Install Ruby gems
rails server        # Start Rails server
rails db:migrate    # Run database migrations
rails db:seed       # Seed database
rails test          # Run tests
```

## Key Features to Implement

1. **Grid-based Map Editor** with multiple drawing tools
2. **Multi-layer System** (floor, walls, events, decorations)
3. **Real-time 3D Preview** using Three.js
4. **Event System** with triggers and actions
5. **Template Management** for rooms and events
6. **Map Validation** (reachability, balance checking)
7. **Import/Export** (JSON, PNG, Markdown formats)
8. **Version Control** with edit history (up to 50 versions)

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

## Key Shortcuts

- Ctrl+S: Save
- Ctrl+Z/Y: Undo/Redo
- Ctrl+C/V: Copy/Paste
- Space: Hand tool
- 1-9: Tool switching
- F5: Preview mode
- Tab: Toggle 3D view