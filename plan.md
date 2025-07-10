# ダンジョンマップクリエイター リファクタリング・パフォーマンス改善計画

## 📊 技術分析サマリー

### 全体的な品質評価
- **コード品質**: 8/10（高品質、構造化良好）
- **セキュリティ**: 7/10（基本対策済み、軽微な脆弱性あり）
- **アクセシビリティ**: 9/10（WCAG 2.1 AA準拠レベル）
- **テスト品質**: 4/10（179/328テストが失敗 - **緊急対応必要**）
- **パフォーマンス**: 6/10（基本最適化済み、改善余地あり）

### 重要な発見事項
- ✅ **強み**: アクセシビリティが優秀（AccessibilityAnnouncer実装済み）
- ✅ **強み**: TypeScript 100%使用、モダンな依存関係
- 🚨 **緊急**: テスト失敗率55%（179/328テスト）
- ⚠️ **警告**: メモリ使用量最大2.5GB（100×100マップ+履歴50ステップ）
- ⚠️ **警告**: esbuild脆弱性（中程度）

## 🚨 緊急度別改善計画

### 【緊急度：最高】即座に対応が必要

#### 0. テスト安定化（最優先）
**現状：** 179/328テストが失敗（55%失敗率） - CI/CD破綻状態

**緊急対応計画：**
```typescript
// src/setupTests.ts - モック強化
global.structuredClone = global.structuredClone || ((obj) => JSON.parse(JSON.stringify(obj)));

// Canvas APIモック
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  getImageData: jest.fn(() => ({ data: new Array(4) })),
  putImageData: jest.fn(),
  createImageData: jest.fn(() => ({ data: new Array(4) })),
  setTransform: jest.fn(),
  drawImage: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  scale: jest.fn(),
  rotate: jest.fn(),
  translate: jest.fn(),
}));
```

**期限：** 3日以内

#### 1. セキュリティ脆弱性の修正
**現状：** esbuild <=0.24.2 に中程度の脆弱性

**緊急対応：**
```bash
npm audit fix --force
npm update esbuild@latest
```

**期限：** 1日以内

#### 2. メモリ使用量の緊急最適化
**現状：** 履歴管理で最大2.5GB使用（100×100マップ）

**緊急対応：**
```typescript
// src/store/mapSlice.ts - 履歴上限を緊急削減
const HISTORY_LIMIT = 10; // 50から10に削減（メモリ使用量80%削減）

// 差分ベース履歴管理の実装
const addToHistory = (state: MapState, newDungeon: Dungeon) => {
  const diff = calculateDiff(state.history[state.historyIndex], newDungeon);
  state.history = state.history.slice(0, state.historyIndex + 1);
  state.history.push(diff);
  
  if (state.history.length > HISTORY_LIMIT) {
    state.history.shift();
  }
};
```

**期限：** 3日以内

### 【緊急度：高】即座に対応が必要

#### 3. MapEditor2D.tsx の分割（最優先）
**現状：** 2,911行の巨大コンポーネント - 保守性・パフォーマンスに深刻な影響

**分割計画：**
```typescript
// 現在: MapEditor2D.tsx (2,911行)
// ↓
// 分割後:
src/components/mapEditor/
├── MapEditor2D.tsx (300行以下)      // メインコンポーネント
├── CanvasRenderer.tsx (400行)       // 描画専用
├── EventHandler.tsx (300行)         // イベント処理
├── ToolManager.tsx (200行)          // ツール管理
├── TemplateManager.tsx (250行)      // テンプレート管理
├── CoordinateSystem.tsx (150行)     // 座標計算
└── hooks/
    ├── useCanvasDrawing.ts (200行)  // 描画ロジック
    ├── useMouseEvents.ts (150行)    // マウスイベント
    └── useKeyboardEvents.ts (100行) // キーボードイベント
```

**具体的な分割方針：**
- **CanvasRenderer**: 行200-600の描画関数を分離
- **EventHandler**: 行800-1200のイベントハンドラーを分離
- **ToolManager**: ツール固有のロジックを分離
- **TemplateManager**: 行1500-2000のテンプレート処理を分離

#### 2. LeftPanel.tsx の分割
**現状：** 1,544行 - 責任過多

**分割計画：**
```typescript
src/components/panels/
├── LeftPanel.tsx (200行以下)        // メインパネル
├── LayerPanel.tsx (150行)           // レイヤー管理
├── FloorTypePanel.tsx (300行)       // 床タイプ管理
├── WallTypePanel.tsx (300行)        // 壁タイプ管理
├── EventManagementPanel.tsx (400行) // イベント管理
└── CustomTypePanel.tsx (300行)      // カスタムタイプ管理
```

#### 4. Canvas描画パフォーマンス緊急最適化
**現状：** 全体再描画による性能劣化、差分描画未実装

**緊急対応：**
```typescript
// src/components/MapEditor2D.tsx - 差分描画実装
const useOptimizedCanvasDrawing = (canvasRef: RefObject<HTMLCanvasElement>) => {
  const lastDrawnState = useRef<Map<string, Cell>>(new Map());
  
  const drawCellOptimized = useCallback((ctx: CanvasRenderingContext2D, cell: Cell, x: number, y: number) => {
    const cellKey = `${x}-${y}`;
    const lastState = lastDrawnState.current.get(cellKey);
    
    // 差分検出
    if (lastState && deepEqual(lastState, cell)) {
      return; // 変更なし、描画スキップ
    }
    
    // 変更がある場合のみ描画
    drawCell(ctx, cell, x, y);
    lastDrawnState.current.set(cellKey, { ...cell });
  }, []);
  
  return { drawCellOptimized };
};

// ビューポート最適化（表示領域のみ描画）
const getVisibleCells = useMemo(() => {
  const startX = Math.floor(viewport.x / cellSize);
  const endX = Math.ceil((viewport.x + viewport.width) / cellSize);
  const startY = Math.floor(viewport.y / cellSize);
  const endY = Math.ceil((viewport.y + viewport.height) / cellSize);
  
  return { startX, endX, startY, endY };
}, [viewport, cellSize]);
```

**期限：** 5日以内

#### 5. エラーハンドリングの強化
**現状：** エラー境界未実装、ユーザー向けエラー表示不足

**緊急対応：**
```typescript
// src/components/ErrorBoundary.tsx - 新規作成
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // 構造化ログ
    const errorLog = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    // エラー報告（将来的にリモートログサービスに送信）
    localStorage.setItem('lastError', JSON.stringify(errorLog));
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>申し訳ございません。予期しないエラーが発生しました。</h2>
          <p>ページを再読み込みしてください。問題が解決しない場合は、サポートにお問い合わせください。</p>
          <button onClick={() => window.location.reload()}>
            ページを再読み込み
          </button>
          <details style={{ marginTop: '20px', textAlign: 'left' }}>
            <summary>エラー詳細（開発者向け）</summary>
            <pre>{this.state.error?.stack}</pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

// App.tsxでの使用
<ErrorBoundary>
  <Router>
    <Routes>...</Routes>
  </Router>
</ErrorBoundary>
```

**期限：** 2日以内

#### 6. パフォーマンス緊急対応

**メモ化の追加：**
```typescript
// 緊急対応箇所
const MapEditor2D = React.memo(() => {
  const currentFloor = useMemo(() => 
    getCurrentFloor(dungeon, currentFloorIndex), 
    [dungeon, currentFloorIndex]
  );
  
  const cellRenderer = useCallback((cell, x, y) => {
    // 描画ロジック
  }, [zoom, selectedLayer]);
});
```

**useEffect最適化：**
```typescript
// 現在: 10個以上のuseEffect
// ↓ 統合・最適化
useEffect(() => {
  // 関連する副作用をまとめる
}, [optimizedDependencies]);
```

### 【緊急度：中】計画的に対応

#### 4. EventEditDialog.tsx の改善
**現状：** 1,395行の複雑なダイアログ

**改善計画：**
```typescript
src/components/eventEdit/
├── EventEditDialog.tsx (200行)      // メインダイアログ
├── BasicSettingsTab.tsx (250行)     // 基本設定タブ
├── AppearanceTab.tsx (200行)        // 外観タブ
├── TriggerTab.tsx (300行)           // トリガータブ
├── ActionTab.tsx (400行)            // アクションタブ
└── AdvancedTab.tsx (200行)          // 詳細設定タブ
```

#### 5. CustomTypeDialog.tsx の改善
**現状：** 1,233行

**改善計画：**
```typescript
src/components/customType/
├── CustomTypeDialog.tsx (150行)     // メインダイアログ
├── FloorTypeEditor.tsx (300行)      // 床タイプ編集
├── WallTypeEditor.tsx (300行)       // 壁タイプ編集
├── DecorationTypeEditor.tsx (250行) // 装飾タイプ編集
└── PropertyEditor.tsx (200行)       // プロパティ編集
```

#### 6. Redux状態管理の最適化

**セレクター最適化：**
```typescript
// src/store/selectors.ts (新規作成)
export const selectCurrentFloor = createSelector(
  [(state) => state.map.dungeon, (state) => state.map.currentFloor],
  (dungeon, currentFloor) => dungeon?.floors[currentFloor]
);

export const selectVisibleCells = createSelector(
  [selectCurrentFloor, (state) => state.editor.zoom, (state) => state.editor.viewport],
  (floor, zoom, viewport) => calculateVisibleCells(floor, zoom, viewport)
);
```

**不要な再レンダリング防止：**
```typescript
// RTK Query導入検討
import { createApi } from '@reduxjs/toolkit/query/react';

// または既存のsliceを最適化
const mapSlice = createSlice({
  // immer使用の最適化
  reducers: {
    updateCellsBatch: (state, action) => {
      // バッチ更新で性能向上
    }
  }
});
```

### 【緊急度：低】長期的改善

#### 7. 型安全性の向上

**any型の削除：**
```typescript
// 現在の問題
properties: Record<string, any>  // ❌

// 改善案
properties: {
  [key: string]: string | number | boolean | object
}  // ✅

// さらに良い案
properties: EventProperties  // ✅ 具体的な型定義
```

**型定義の分割：**
```typescript
// types/map.ts (370行) を分割
src/types/
├── dungeon.ts      // ダンジョン関連
├── events.ts       // イベント関連
├── cells.ts        // セル関連
├── templates.ts    // テンプレート関連
└── common.ts       // 共通型
```

#### 8. バンドルサイズ最適化

**コード分割：**
```typescript
// 動的インポート
const MapEditor3D = lazy(() => import('./components/MapEditor3D'));
const EventEditDialog = lazy(() => import('./components/EventEditDialog'));

// チャンク分割設定（vite.config.ts）
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'editor-core': ['./src/components/MapEditor2D'],
        'editor-3d': ['./src/components/MapEditor3D'],
        'dialogs': ['./src/components/EventEditDialog', './src/components/CustomTypeDialog']
      }
    }
  }
}
```

#### 9. カスタムHooks化

**共通ロジックの抽出：**
```typescript
// src/hooks/
├── useEventManagement.ts    // イベント管理ロジック
├── useTemplateHandling.ts   // テンプレート処理
├── useCanvasInteraction.ts  // キャンバス操作
├── useKeyboardShortcuts.ts  // キーボードショートカット
└── useUndoRedo.ts          // Undo/Redo機能
```

## 📊 期待される改善効果

### パフォーマンス改善
- **初期読み込み時間**: 30-40%短縮
- **操作レスポンス**: 50-60%向上
- **メモリ使用量**: 20-30%削減
- **バンドルサイズ**: 25-35%削減

### 開発効率向上
- **コンポーネント再利用性**: 大幅向上
- **テスト容易性**: 2-3倍向上
- **バグ修正時間**: 50%短縮
- **新機能開発速度**: 30-40%向上

### 保守性向上
- **コード可読性**: 大幅向上
- **型安全性**: 90%以上の型カバレッジ
- **テスト可能性**: 完全テスト可能
- **ドキュメント化**: 自動生成対応

## 🗓️ 実装スケジュール（詳細分析反映版）

### 🚨 フェーズ0（1週間）: 緊急安定化 - **必須前提作業**
**Day 1**: セキュリティ修正
- esbuild脆弱性修正: `npm audit fix --force`
- 依存関係更新とセキュリティスキャン

**Day 2-3**: テスト安定化（**最優先**）
- structuredCloneポリフィルの実装
- Canvas APIモックの強化
- 179個の失敗テストを50個以下に削減（目標：成功率70%以上）

**Day 4-5**: メモリ緊急最適化
- 履歴上限を50→10に削減（メモリ使用量80%削減）
- 差分ベース履歴管理の基本実装

**Day 6-7**: エラーハンドリング強化
- ErrorBoundaryの実装
- 基本的なエラー回復メカニズム

### 📈 フェーズ1（2週間）: パフォーマンス最適化
**Week 1**: Canvas描画最適化
- Day 1-3: 差分描画システムの実装
- Day 4-5: ビューポート最適化（表示領域のみ描画）
- Day 6-7: メモ化とuseEffect最適化

**Week 2**: コンポーネント最適化
- Day 8-10: MapEditor2D.tsx の責任分散（Canvas部分のみ分離）
- Day 11-12: LeftPanel.tsx のイベント管理部分分離
- Day 13-14: パフォーマンステストと調整

### 🏗️ フェーズ2（2週間）: 構造改善
**Week 3**: 大型コンポーネント分割
- Day 15-17: MapEditor2D.tsx の本格分割
  - CanvasRenderer分離
  - EventHandler分離
- Day 18-19: LeftPanel.tsx の分割継続
- Day 20-21: 統合テストと調整

**Week 4**: ダイアログ改善
- Day 22-24: EventEditDialog.tsx のタブ別分割
- Day 25-26: CustomTypeDialog.tsx の分割
- Day 27-28: UI/UX改善と最適化

### 🎯 フェーズ3（1週間）: 長期改善
**Day 29-31**: 型安全性とコード品質
- any型の削除
- 型定義の分割
- バンドル最適化

**Day 32-35**: 最終調整
- カスタムHooksの実装
- ドキュメント更新
- 総合テスト

## 📊 マイルストーン別成功指標

### フェーズ0完了時（1週間後）
- [ ] テスト成功率: 70%以上（現在45%）
- [ ] セキュリティ脆弱性: 0件（現在2件）
- [ ] メモリ使用量: 500MB以下（現在最大2.5GB）
- [ ] エラー境界: 100%カバレッジ

### フェーズ1完了時（3週間後）
- [ ] 初期描画時間: 30%短縮
- [ ] 操作レスポンス: 50%向上
- [ ] Canvas描画: 差分描画実装
- [ ] MapEditor2D.tsx: 2000行以下

### フェーズ2完了時（5週間後）
- [ ] 1000行以上コンポーネント: 2個以下（現在4個）
- [ ] バンドルサイズ: 400KB以下（現在566KB）
- [ ] テストカバレッジ: 80%以上
- [ ] 型カバレッジ: 95%以上

### フェーズ3完了時（6週間後）
- [ ] 全技術的負債解消
- [ ] 新機能開発速度: 40%向上
- [ ] バグ修正時間: 60%短縮
- [ ] コードレビュー時間: 50%短縮

## ✅ 成功指標

### 技術指標
- [ ] 1000行以上のコンポーネントを0個に
- [ ] バンドルサイズを500KB未満に
- [ ] 初期読み込みを3秒以内に
- [ ] 型カバレッジを90%以上に
- [ ] テストカバレッジを80%以上に

### 開発効率指標
- [ ] 新機能開発時間を30%短縮
- [ ] バグ修正時間を50%短縮
- [ ] コードレビュー時間を40%短縮
- [ ] テスト作成時間を60%短縮

## 🎯 次のアクション（優先度順）

### 🚨 【TODAY】即座に実行必須（システム安定性のため）

#### 1. セキュリティ脆弱性の修正（30分）
```bash
# 今すぐ実行
npm audit fix --force
npm update esbuild@latest
npm audit --audit-level moderate
```

#### 2. テスト環境の安定化（2時間）
```bash
# src/setupTests.ts に追加
cat >> src/setupTests.ts << 'EOF'
// structuredClone ポリフィル
global.structuredClone = global.structuredClone || ((obj) => JSON.parse(JSON.stringify(obj)));

// Canvas API モック強化
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  getImageData: jest.fn(() => ({ data: new Array(4) })),
  putImageData: jest.fn(),
  createImageData: jest.fn(() => ({ data: new Array(4) })),
  setTransform: jest.fn(),
  drawImage: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  scale: jest.fn(),
  rotate: jest.fn(),
  translate: jest.fn(),
}));
EOF

# テスト実行確認
npm run test:unit
```

#### 3. メモリ使用量の緊急削減（1時間）
```typescript
// src/store/mapSlice.ts - HISTORY_LIMIT を変更
const HISTORY_LIMIT = 10; // 50 から 10 に変更
```

### 📊 【THIS WEEK】フェーズ0完了目標

#### 4. ErrorBoundary実装（半日）
```bash
# 新しいコンポーネント作成
touch src/components/ErrorBoundary.tsx
# 前述のErrorBoundaryコードを実装
```

#### 5. パフォーマンス計測ベースライン（半日）
```bash
# パフォーマンス計測ツール導入
npm install --save-dev @bundle-analyzer/cli lighthouse-ci
npm run build
npx bundle-analyzer dist

# 計測スクリプト追加（package.json）
npm run analyze:bundle
npm run lighthouse:ci
```

#### 6. Canvas描画最適化プロトタイプ（1日）
```typescript
// src/hooks/useOptimizedCanvas.ts 作成
// 差分描画の基本実装
```

### 🔧 【NEXT WEEK】フェーズ1開始準備

#### 7. MapEditor2D分析とリファクタリング計画（1日）
- 2,911行の詳細分析
- 責任分散の設計
- 分割優先度の決定

#### 8. Redux最適化（2日）
- セレクターの最適化
- 不要な再レンダリングの特定
- メモ化の戦略策定

#### 9. テストカバレッジ改善（継続）
- 現在45%→70%への向上計画
- 179個の失敗テスト修正戦略

### 📈 成功の測定方法

#### 即座に確認可能な指標
```bash
# 1. テスト成功率
npm run test:unit | grep -E "(PASS|FAIL)"

# 2. バンドルサイズ
npm run build && ls -lah dist/assets/

# 3. メモリ使用量（開発者ツールで確認）
# 大きなマップ作成→履歴操作→メモリ確認

# 4. セキュリティ
npm audit --audit-level moderate
```

#### 週次確認指標
- **テスト成功率**: 毎金曜日計測
- **パフォーマンス**: 毎週Lighthouse測定
- **バンドルサイズ**: 毎ビルド後自動測定
- **メモリ使用量**: 手動テスト（100×100マップ）

### 🎯 最初の1週間のマイルストーン

**Day 1 完了目標:**
- [ ] セキュリティ脆弱性 0件
- [ ] npm audit clean状態

**Day 3 完了目標:**
- [ ] テスト成功率 60%以上
- [ ] structuredClone問題解決

**Day 5 完了目標:**
- [ ] メモリ使用量 1GB以下
- [ ] ErrorBoundary実装完了

**Week 1 完了目標:**
- [ ] テスト成功率 70%以上
- [ ] パフォーマンスベースライン確立
- [ ] Canvas最適化プロトタイプ完成

### 🚀 緊急時の連絡・エスカレーション

**テスト失敗率が80%を超えた場合:**
→ 全開発停止、テスト修正に専念

**メモリ使用量が5GBを超えた場合:**
→ 履歴機能の一時無効化検討

**セキュリティ脆弱性が高レベルで発見された場合:**
→ 即座に依存関係更新とパッチ適用

**この計画により、6週間で技術的負債を解消し、持続可能で高品質なアプリケーションを実現します。**