import { configureStore } from '@reduxjs/toolkit'
import mapReducer from './mapSlice'
import editorReducer from './editorSlice'

/**
 * テスト専用ストア設定
 * パフォーマンスを重視し、SerializableCheckを無効化
 */
export const createTestStore = (preloadedState?: any) => configureStore({
  reducer: {
    map: mapReducer,
    editor: editorReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // テスト環境ではSerializableCheckを完全に無効化
      serializableCheck: false,
      // ImmutableCheckも無効化
      immutableCheck: false,
    }),
  preloadedState,
})

export type TestStore = ReturnType<typeof createTestStore>