import { configureStore } from '@reduxjs/toolkit'
import mapReducer from './mapSlice'
import editorReducer from './editorSlice'

export const store = configureStore({
  reducer: {
    map: mapReducer,
    editor: editorReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // パフォーマンス最適化: 大きな状態でのSerializableCheckを緩和
      serializableCheck: {
        // 履歴データのシリアライゼーションチェックをスキップ
        ignoredPaths: [
          'map.history',          // 履歴データ（大きいオブジェクト）
          'map.dungeon.floors',   // フロアデータ（大きい配列）
        ],
        // 特定のアクションでのチェックをスキップ
        ignoredActions: [
          'map/updateCell',       // 頻繁なセル更新
          'map/updateCells',      // 一括セル更新
          'map/addToHistory',     // 履歴追加
          'map/undo',             // 履歴操作
          'map/redo',             // 履歴操作
        ],
        // チェックの闾値を緩和（デフォルト: 32ms）
        warnAfter: 128,
      },
      // 不変性チェックも緩和（大きな状態でのパフォーマンス向上）
      immutableCheck: {
        warnAfter: 128,
        ignoredPaths: [
          'map.history',
          'map.dungeon.floors',
        ],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch