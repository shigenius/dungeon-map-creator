import React from 'react'
import { Box, Typography, Fab, Tooltip, CircularProgress } from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../store'
import { openCreateTemplateDialog } from '../store/editorSlice'
import MapEditor2D from './MapEditor2D'
import { lazy, Suspense } from 'react'

// 3Dエディタを動的インポートでコード分割
const MapEditor3D = lazy(() => import('./MapEditor3D'))

const MainCanvas: React.FC = () => {
  const dispatch = useDispatch()
  const { viewMode, selectionMode, selectionStart, selectionEnd, selectionConfirmed, selectedTool, selectedLayer } = useSelector((state: RootState) => state.editor)
  const dungeon = useSelector((state: RootState) => state.map.dungeon)

  // 範囲選択が完了している（範囲が選択されている）かどうかを判定
  // 1x1の範囲でも有効な選択として扱う
  const isRangeSelected = selectionMode && selectionStart && selectionEnd && selectionConfirmed

  const handleCreateTemplate = () => {
    dispatch(openCreateTemplateDialog())
  }

  if (!dungeon) {
    return (
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
        role="main"
        aria-label="メインコンテンツエリア"
      >
        <Typography 
          variant="h6" 
          color="text.secondary"
          role="status"
          aria-live="polite"
        >
          プロジェクトを作成してください
        </Typography>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        bgcolor: 'background.default',
      }}
      role="main"
      aria-label="ダンジョンマップエディター"
      aria-describedby="canvas-description"
    >
      {/* スクリーンリーダー用の説明 */}
      <Box
        id="canvas-description"
        sx={{
          position: 'absolute',
          left: '-10000px',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
        }}
      >
        現在のツール: {selectedTool}、レイヤー: {selectedLayer}、プロジェクト: {dungeon.name}。キーボードショートカットでツールやレイヤーを切り替えできます。
      </Box>
      {viewMode === '2d' ? (
        <MapEditor2D />
      ) : (
        <Suspense fallback={
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <CircularProgress />
            <Typography variant="body2" color="text.secondary">
              3Dエンジンを読み込み中...
            </Typography>
          </Box>
        }>
          <MapEditor3D />
        </Suspense>
      )}
      
      {/* 範囲選択完了時のテンプレート作成ボタン */}
      {isRangeSelected && (
        <>
          <Tooltip title="選択範囲からテンプレートを作成 (Enterキー)" placement="left">
            <Fab
              color="primary"
              onClick={handleCreateTemplate}
              sx={{
                position: 'absolute',
                bottom: 24,
                right: 24,
                zIndex: 1000,
              }}
              aria-label="選択範囲からテンプレートを作成"
              aria-describedby="template-create-help"
              aria-keyshortcuts="Enter"
            >
              <AddIcon aria-hidden="true" />
            </Fab>
          </Tooltip>
          <Box
            id="template-create-help"
            sx={{
              position: 'absolute',
              left: '-10000px',
              width: '1px',
              height: '1px',
              overflow: 'hidden',
            }}
          >
            範囲選択が完了しました。Enterキーまたはこのボタンでテンプレートを作成できます。
          </Box>
        </>
      )}
    </Box>
  )
}

export default MainCanvas