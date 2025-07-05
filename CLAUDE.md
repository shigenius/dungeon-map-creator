# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

重要ルール

- 必ず日本語で回答してください。
- タスクが終わるごとに適切に分割されたコミットを行うこと
- コミットの前にテストをすべて実行し、すべて通過することを確認すること
- すべての開発段階においてt-wadaのTDDに従う
- テストは単体テスト、統合テスト、E2Eテストをそれぞれ適切なバランスで実装すること
- E2Eテストでplaywrightを実行する際はレポートが自動で開かないように `npx playwright test --reporter=list` を用いること
- これらのルールはタスクが完了するたびに画面出力すること
- **TODO管理の永続化**: 開発TODOはCLAUDE.mdにチェックリスト形式で記録し、完了時に更新すること
  - 完全に不要となったTODOはtodo_history.mdに移動すること

テストの実行

- npm run test:unit - 単体テスト実行（vitest）
- npm run test:coverage - カバレッジ付き単体テスト
- npm run test:e2e - E2Eテスト実行（playwright）
- npm run test:all - 全テスト実行

## Claude Code品質保証フロー

### 基本原則
- **ユーザーに動作確認させない**: Claude Codeが責任を持って品質を保証する
- **デグレ絶対禁止**: 既存機能の破壊は許されない
- **エラー隠蔽禁止**: 問題は必ず報告し、修復完了まで次の作業を行わない
- **テスト優先**: 失敗しているテストがある状態では新機能開発を行わない

### MCP Playwright活用ガイド（最重要ツール）

#### 利用可能な機能
- `mcp__playwright__browser_navigate` - ページ移動・初期ロード
- `mcp__playwright__browser_console_messages` - コンソールエラー・ログ確認（重要）
- `mcp__playwright__browser_snapshot` - ページ状態のスクリーンショット取得（トークン消費が激しいためできる限り使わない）
- `mcp__playwright__browser_click` - 要素クリック
- `mcp__playwright__browser_type` - テキスト入力
- `mcp__playwright__browser_evaluate` - JavaScript実行
- `mcp__playwright__browser_close` - ブラウザ終了

#### 重要な活用場面
- JavaScriptエラーの検出
- コンポーネント変更後の動作確認
- インポート文修正後の確認
- 新機能実装後の確認
- ユーザーにボールを返す前の最終確認

#### このプロジェクト特有の操作手順

**1. 基本確認フロー（毎回必須）**
```playwright
# 1. ページ読み込み
mcp__playwright__browser_navigate http://localhost:5173

# 2. 初期読み込みエラーチェック
mcp__playwright__browser_console_messages  # エラーの有無を確認

# 3. 白画面チェック（重要）
# - 白画面の場合は即座にコンソールエラーをチェック
# - React/TypeScriptのビルドエラーが原因の可能性が高い
```

**2. 新規プロジェクト作成フロー確認**
```playwright
# プロジェクト作成ボタンクリック
mcp__playwright__browser_click 'text=新規プロジェクト'

# エラーチェック
mcp__playwright__browser_console_messages

# ダイアログでの入力
mcp__playwright__browser_type 'input[placeholder*="プロジェクト名"]' 'テストプロジェクト'

# 作成実行
mcp__playwright__browser_click 'text=作成'

# 最終確認
mcp__playwright__browser_console_messages
```

**3. 主要機能動作確認**
```playwright
# ツール切り替え確認
mcp__playwright__browser_click '[data-testid="tool-pen"]'
mcp__playwright__browser_console_messages

mcp__playwright__browser_click '[data-testid="tool-rectangle"]'
mcp__playwright__browser_console_messages

# レイヤー切り替え確認
mcp__playwright__browser_click 'text=壁'
mcp__playwright__browser_console_messages

mcp__playwright__browser_click 'text=イベント'
mcp__playwright__browser_console_messages

# キャンバス操作確認（基本的なクリック）
mcp__playwright__browser_click 'canvas'
mcp__playwright__browser_console_messages
```

**4. 特定機能の動作確認**
```playwright
# テンプレート機能
mcp__playwright__browser_click 'text=テンプレート'
mcp__playwright__browser_console_messages

# 3D表示切り替え
mcp__playwright__browser_click 'text=3D'
mcp__playwright__browser_console_messages

# ファイル操作
mcp__playwright__browser_click 'text=ファイル'
mcp__playwright__browser_console_messages
```

**5. エラー発生時の詳細確認**
```playwright
# エラーが発生した場合の詳細確認
mcp__playwright__browser_evaluate 'console.error.toString()'

# React DevToolsがある場合の状態確認
mcp__playwright__browser_evaluate 'window.__REACT_DEVTOOLS_GLOBAL_HOOK__'

# Redux状態確認
mcp__playwright__browser_evaluate 'window.__REDUX_DEVTOOLS_EXTENSION__'
```

**6. 重要な確認ポイント**
- **白画面**: 即座にコンソールエラー確認（インポートエラーの可能性）
- **ボタンクリック無反応**: Redux状態管理のエラーかイベントハンドラー問題
- **キャンバス描画問題**: Canvas APIエラーまたはRedux状態の問題
- **ダイアログ表示問題**: Material-UIコンポーネントのエラー
- **3D表示問題**: Three.jsライブラリまたはWebGLエラー

**7. 問題の種類別対応**
```playwright
# TypeScriptエラー（白画面）
# → まずnpm run buildでエラー確認

# React Hydrationエラー
# → console_messagesでHydration関連ログ確認

# Redux状態管理エラー
# → ボタンクリック後にconsole_messagesで状態関連エラー確認

# Canvas描画エラー
# → キャンバスクリック後にconsole_messagesでCanvas関連エラー確認
```

### 必須開発フロー

#### 1. 作業開始時の状況確認
```bash
# 現在の状況を必ず確認
npm run build                    # TypeScriptエラーの有無
npm run test:unit               # 単体テストの状況
```
```playwright
mcp__playwright__browser_navigate → console_messages  # 現在のアプリケーション状態
```

#### 2. コード変更時の必須チェック（順序厳守）
```bash
# 1. TypeScriptエラーチェック
npm run build

# 2. 単体テストチェック（失敗があれば必ず修復）
npm run test:unit
```
```playwright
# 3. ブラウザ動作確認（最重要）
mcp__playwright__browser_navigate http://localhost:5173
mcp__playwright__browser_console_messages  # エラーがないか確認

# 4. 基本機能動作確認
mcp__playwright__browser_click [新規作成ボタン]
mcp__playwright__browser_console_messages  # エラーがないか確認
```

#### 3. デグレ防止のためのテスト戦略

**失敗テスト処理ルール**
- 失敗しているテストがある状態では**絶対に新機能開発を行わない**
- テスト修復を最優先で実行
- 修復不可能な場合はユーザーに報告

**テスト実装ルール**
- 新機能実装時は対応するテストを必ず作成
- 既存機能変更時は関連テストを更新
- E2Eテストで主要ユーザーフローを保護

**継続的品質保証**
```bash
# 毎回実行必須
npm run test:unit               # 全単体テストパス確認
npm run test:e2e               # 主要フロー動作確認
```

#### 4. コミット前の必須確認（全て✓であることを確認）

```bash
# ビルド成功
npm run build                   # ✓ TypeScriptエラーなし

# テスト全パス
npm run test:unit              # ✓ 単体テスト全パス
npm run test:e2e               # ✓ E2Eテスト全パス（主要フロー）

# Lint成功
npm run lint                   # ✓ Lintエラーなし
```

```playwright
# ブラウザ最終確認
mcp__playwright__browser_navigate http://localhost:5173
mcp__playwright__browser_console_messages  # ✓ コンソールエラーなし

# 基本機能確認
[プロジェクト作成 → ツール切り替え → 基本操作] # ✓ 正常動作
```

#### 5. ユーザーへの報告形式

**動作確認完了時**
```
✅ 動作確認完了
- ビルド: 成功
- テスト: 全パス (XXX/XXX)
- ブラウザ: エラーなし
- 基本機能: 正常動作
```

**問題発見時**
```
❌ 問題発見
- 種類: [TypeScriptエラー/テスト失敗/ブラウザエラー]
- 詳細: [具体的な問題内容]
- 対応: [修復方針]
- 状況: 修復完了まで次の作業を停止
```

### トラブルシューティング

#### Playwrightエラー時
```bash
pkill -f playwright            # プロセス強制終了
# 再度ナビゲート
```

#### テスト修復の優先順位
1. TypeScriptエラー（ビルド失敗）
2. 単体テスト失敗
3. E2Eテスト失敗
4. Lintエラー

### 禁止事項
- エラーがある状態でのコミット
- テスト失敗を無視した新機能開発
- ユーザーへのエラー状況の隠蔽
- 動作確認なしでの「完了」報告
- Playwrightを使わない動作確認

### 白画面問題の対処法（経験則）

#### 問題特定手順
1. **段階的コンポーネント切り分け**: 簡単なテストコンポーネントから段階的に機能を追加
2. **個別コンポーネントテスト**: 問題のあるコンポーネントを特定するまで1つずつ無効化
3. **エラーハンドリング追加**: try-catchとログ出力で具体的な問題箇所を特定
4. **型安全性の確保**: TypeScript設定を一時的に緩めて根本問題を特定

#### よくある原因と解決法
- **インポートパスエラー**: 相対パス（../App）の間違い → 正しいパス修正
- **型定義エラー**: Redux状態の型不整合 → 型注釈追加・修正
- **依存関係エラー**: Three.jsなどの外部ライブラリパス → 最新パスに更新
- **ランタイム関数エラー**: 未定義関数の呼び出し → ヘルパー関数の実装
- **複雑なCanvas処理**: 無限ループや例外 → エラーハンドリングと段階的簡素化

### バックグラウンド実行問題の解決法

#### 問題
`npm run dev &` 実行後にClaude Codeが無限待機状態になる

#### 解決手法
```bash
# ❌ 間違った方法: バックグラウンド実行で待機
npm run dev &

# ✅ 正しい方法1: プロセス確認
ps aux | grep -E "(vite|npm)" | grep -v grep

# ✅ 正しい方法2: サーバー応答確認
curl -s -w "%{http_code}" http://localhost:3001 | tail -1

# ✅ 正しい方法3: タイムアウト付き確認
curl -s --max-time 5 http://localhost:3001 > /dev/null && echo "サーバー応答OK"
```

#### 開発サーバー管理ルール
- バックグラウンド実行は避ける（Claude Codeが待機状態になる）
- 既存プロセス確認を優先する
- サーバー応答確認でタイムアウトを設定
- 必要に応じてプロセス終了: `pkill -f vite`

### TODO管理

#### TODO管理ルール
- 開発TODOは必ずCLAUDE.mdに記録する
- チェックリスト形式で管理: `- [ ]` (未完了) / `- [x]` (完了)
- 優先度を明記: (高優先度)/(中優先度)/(低優先度)
- 完了時は必ずチェックボックスを更新
- 新規TODO追加時はこのセクションに追記

#### 現在のTODO

**白画面問題修復 (完了)**
- [x] TypeScriptビルドエラーを修復（テストファイルのインポートパス、型定義、Three.jsパス等）
- [x] mapSliceのaddToHistoryHelper関数を実装
- [x] 環境オブジェクトのaudioプロパティを追加
- [x] テンプレート作成のDate型エラーを修正
- [x] MainCanvasコンポーネントの問題を特定・修復
- [x] MapEditor2Dの複雑なCanvas処理でのエラーハンドリングを追加
- [x] アプリケーション全体が正常に動作することを確認

**品質向上・テスト関連 (高優先度)**
- [ ] MapEditor2Dの最適化（複雑なCanvas描画ロジックの改善）
- [ ] カバレッジツールの依存関係を追加し、テスト環境を修復
- [ ] 失敗している単体テストを修復（RightPanelコンポーネントのundefinedエラー等）
- [ ] E2Eテスト環境の修復（Playwrightサーバー起動問題の解決）
- [ ] コアコンポーネントの単体テストを実装（MapEditor2D, LeftPanel, RightPanel等）
- [ ] Redux sliceの単体テストを実装（mapSlice, editorSlice）
- [ ] ユーティリティ関数のテストを実装（templateUtils, eventValidation, mapValidation等）
- [ ] テストカバレッジを80%以上に向上

**パフォーマンス最適化 (高優先度)**
- [ ] パフォーマンス問題を特定・分析（Canvas描画、Redux状態更新、メモリ使用量等）
- [ ] Canvas描画の最適化（差分更新、オフスクリーン描画等）
- [ ] Redux状態管理の最適化（不要な再レンダリング防止、セレクターの最適化）

**リファクタリング (中優先度)**
- [ ] 大きなコンポーネントを機能別に分割（MapEditor2D, LeftPanel等）
- [ ] 重複コードの統合とユーティリティ関数の抽出
- [ ] コンポーネントの最適化（React.memo、useMemo、useCallback等）

**技術改善 (低優先度)**
- [ ] TypeScript型定義の改善と型安全性の向上

**機能改善**
- [x] サンプルダンジョンプロジェクトのインポート機能 (高優先度)
  - [x] 複数階層を持つ実際のダンジョン形式のサンプルプロジェクトを作成
  - [x] 新規プロジェクト作成モーダルにサンプルインポートボタンを追加
  - [x] サンプルプロジェクトのJSONデータを準備（壁、床、イベント、装飾を含む）
  - [x] インポート機能の実装（プロジェクト作成と同時にサンプルデータを読み込み）
  - [x] MCP Playwrightでの動作確認（サンプルプロジェクト作成・表示・編集）
- [x] マルチフロア管理機能の実装
  - [ ] MCP Playwrightでの動作確認（フロア追加・削除・切り替え・名前変更）
  - [ ] 単体テスト充実化（FloorManagerPanel.tsx、mapSliceのfloor操作）
  - [ ] E2Eテスト実装（マルチフロア操作フロー）
- [x] イベントテンプレートシステムの実装
  - [ ] MCP Playwrightでの動作確認（テンプレート選択・適用・カテゴリ切り替え）
  - [ ] 単体テスト充実化（EventTemplateDialog.tsx、eventTemplates.ts）
  - [ ] E2Eテスト実装（イベントテンプレート作成・適用フロー）
- [x] リアルタイムイベント検証システムの実装
  - [ ] MCP Playwrightでの動作確認（検証メッセージ表示・リアルタイム更新）
  - [ ] 単体テスト充実化（eventValidation.ts、検証ロジック）
  - [ ] E2Eテスト実装（イベント検証UI操作フロー）
- [x] 包括的マップ検証機能の実装
  - [ ] MCP Playwrightでの動作確認（検証ダイアログ・スコア表示・カテゴリ別結果）
  - [ ] 単体テスト充実化（mapValidation.ts、MapValidationDialog.tsx）
  - [ ] E2Eテスト実装（マップ検証実行・結果確認フロー）
- [x] ミニマップ表示機能の実装
  - [ ] MCP Playwrightでの動作確認（ミニマップ表示切り替え・ズーム・クリック移動）
  - [ ] 単体テスト充実化（Minimap.tsx、描画ロジック）
  - [ ] E2Eテスト実装（ミニマップ操作フロー）
- [x] 3Dプレビューシステムの基本実装
  - [ ] MCP Playwrightでの動作確認（3D表示切り替え・カメラ操作・レンダリング）
  - [ ] 単体テスト充実化（MapEditor3D.tsx、Three.js統合）
  - [ ] E2Eテスト実装（3D表示・操作フロー）

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