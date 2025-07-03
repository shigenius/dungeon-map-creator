import React from 'react'
import { Box, Typography, Button, Fab, Tooltip } from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../store'
import { openCreateTemplateDialog } from '../store/editorSlice'
import MapEditor2D from './MapEditor2D'
import MapEditor3D from './MapEditor3D'

const MainCanvas: React.FC = () => {
  const dispatch = useDispatch()
  const { viewMode, selectionMode, selectionStart, selectionEnd, selectionConfirmed } = useSelector((state: RootState) => state.editor)
  const dungeon = useSelector((state: RootState) => state.map.dungeon)

  // 範囲選択が完了している（範囲が選択されている）かどうかを判定
  const isRangeSelected = selectionMode && selectionStart && selectionEnd && 
    (selectionStart.x !== selectionEnd.x || selectionStart.y !== selectionEnd.y) && selectionConfirmed

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
      >
        <Typography variant="h6" color="text.secondary">
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
    >
      {viewMode === '2d' && <MapEditor2D />}
      {(viewMode === '3d' || viewMode === 'preview') && <MapEditor3D />}
      
      {/* 範囲選択完了時のテンプレート作成ボタン */}
      {isRangeSelected && (
        <Tooltip title="選択範囲からテンプレートを作成" placement="left">
          <Fab
            color="primary"
            onClick={handleCreateTemplate}
            sx={{
              position: 'absolute',
              bottom: 24,
              right: 24,
              zIndex: 1000,
            }}
          >
            <AddIcon />
          </Fab>
        </Tooltip>
      )}
    </Box>
  )
}

export default MainCanvas