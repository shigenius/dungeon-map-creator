# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

重要ルール

- 必ず日本語で回答してください。
- タスクが終わるごとに適切に分割されたコミットを行うこと
- コミットの前にテストをすべて実行し、すべて通過することを確認すること
- t-wadaのTDDに従う
- テストは単体テスト、統合テスト、E2Eテストをそれぞれ適切なバランスで実装すること
- E2Eテストでplaywrightを実行する際はレポートが自動で開かないように `npx playwright test --reporter=list` を用いること
- これらのルールはタスクが完了するたびに画面出力すること

テストの実行

- npm run test:unit - 単体テスト実行（vitest）
- npm run test:coverage - カバレッジ付き単体テスト
- npm run test:e2e - E2Eテスト実行（playwright）
- npm run test:all - 全テスト実行

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
   - `mapSlice`: Manages dungeon data, cell modifications, undo/redo history (50 steps)
   - `editorSlice`: Manages UI state (tools, layers, zoom, view modes, hover information)

2. **Component Structure**:
   - `App.tsx`: Main application with comprehensive keyboard shortcuts and layout
   - `MainCanvas.tsx`: Central component managing 2D/3D view mode switching
   - `MapEditor2D.tsx`: Core canvas-based map editing with detailed tool implementations
   - Panel components: MenuBar, ToolBar, LeftPanel, RightPanel, BottomPanel
   - `NewProjectDialog.tsx`: Project creation workflow with size validation

3. **Data Flow**:
   - User interactions → Redux actions → State updates → Canvas redraw
   - Keyboard shortcuts (App level) → Direct Redux dispatch
   - Hover events → editorSlice → Real-time UI updates
   - Batch operations → `updateCells` action → Performance optimization

4. **Map Structure**: Complex hierarchical data model:
   - Dungeon → Floors → Cells → (Floor properties/Wall configurations/Events/Decorations)
   - Each cell supports detailed properties, multiple event types, and custom flags

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
- Grid-based 2D map editing with HTML5 Canvas and precise coordinate calculation
- Multiple drawing tools: pen, rectangle, fill, eyedropper, select with Shift-key modifiers
- Multi-layer system: floor, walls, events, decorations with visibility toggles
- Real-time canvas redrawing with zoom (10%-400%) and grid toggle
- Undo/Redo system with 50-step history using deep cloning
- Batch cell updates for performance optimization
- Advanced hover system with cell content preview and highlighting

### ✅ User Interface
- Material-UI dark theme with responsive Flexbox layout
- Comprehensive keyboard shortcuts (20+ combinations including layer switching)
- Project creation dialog with configurable map size (5×5 to 100×100)
- Panel-based layout with accordion components for floor/wall type management
- Real-time cell information display with hover highlighting
- 2D/3D view mode switching (3D prepared)
- Template creation dialog with category selection and description
- Streamlined tool selection (removed separate select tool, integrated into template creation)

### ✅ Data Management
- JSON import/export functionality with fileUtils integration
- Redux state persistence with two main slices (mapSlice, editorSlice)
- Complex hierarchical data model: Dungeon → Floors → Cells → Properties
- Structured cell editing with detailed floor types (8) and wall configurations
- Event system data structures supporting 10+ trigger types and 12+ action types
- User-created template system with range selection and persistent storage

### ✅ Template System
- Comprehensive template management with preset and user-created templates
- Category-based organization (room, corridor, junction, trap, puzzle, decoration, fullmap, custom)
- Template placement tool with real-time preview and rotation (0°, 90°, 180°, 270°)
- Range selection mode for creating templates from existing map areas
- Full map templates that replace entire dungeon layouts
- Template creation dialog with name, description, and category selection
- Template rotation utilities with proper wall orientation handling

### ✅ Event System
- Event placement with type-based templates (treasure, NPC, stairs, enemy, save, heal, switch, sign, harvest, custom)
- Event editing dialog with comprehensive property management (triggers, actions, appearance)
- Event appearance system with color and icon support
- Event position management with numerical coordinate editing
- Event management panel with list of existing events and quick access
- Event display on map with proper color/icon visualization

### ✅ Decoration System
- Decoration placement system with multiple decoration types
- Decoration appearance management with color and icon support
- Visual decoration display on map canvas

### 🚧 Pending Implementation
- Three.js 3D preview system
- Advanced event system with complex triggers and conditional logic
- Map validation and balance checking
- Multi-floor management interface

### 🚧 Current TODOs (Rate Limited Session)
- イベント管理のアイコンをマップ表示と同じに統一 (medium priority)
- イベント選択時にマップ上の対応イベントをハイライト (medium priority)
- イベント管理で重複した古いアコーディオンを削除 (low priority)
- 3Dプレビューシステムの基本実装 (high priority)
- イベント編集ダイアログの詳細機能実装 (medium priority)
- マップ検証機能の実装 (medium priority)
- マルチフロア管理機能の実装 (high priority)
- ミニマップ表示機能の実装 (low priority)

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

### Tool Selection
- **1**: Pen tool
- **2**: Rectangle tool
- **3**: Fill tool
- **4**: Eyedropper tool
- **5**: Eraser tool

### Layer Management
- **F**: Floor layer
- **W**: Walls layer
- **E**: Events layer
- **D**: Decorations layer
- **Tab**: Cycle through layers

### View Controls
- **Ctrl+G** / **Space**: Toggle grid display
- **Ctrl++ / Ctrl+=**: Zoom in
- **Ctrl+-**: Zoom out
- **Ctrl+0**: Reset zoom to 100%
- **Ctrl+1**: Switch to 2D view mode
- **Ctrl+2**: Switch to 3D view mode (prepared)

### Edit Operations
- **Ctrl+Z**: Undo
- **Ctrl+Y** / **Ctrl+Shift+Z**: Redo
- **Ctrl+S**: Save (prepared, shows console log)
- **Ctrl+N**: New project (prepared, shows console log)
- **Ctrl+O**: Open file (prepared, shows console log)

### Template Operations
- **Q**: Rotate template left (90° counter-clockwise)
- **R**: Rotate template right (90° clockwise)
- **Enter**: Confirm range selection and open template creation dialog

Note: Shortcuts are disabled during text input and when no project is loaded.