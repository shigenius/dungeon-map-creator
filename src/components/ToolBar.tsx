import React, { useRef, useCallback } from 'react'
import {
  Toolbar,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
  IconButton,
  Tooltip,
  Box,
} from '@mui/material'
import {
  Edit as PenIcon,
  CropSquare as RectangleIcon,
  Delete as EraserIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
} from '@mui/icons-material'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../store'
import { setSelectedTool, setZoom, setSelectedTemplate } from '../store/editorSlice'
import { undo, redo } from '../store/mapSlice'
import { DrawingTool } from '../types/map'

const ToolBar: React.FC = () => {
  const dispatch = useDispatch()
  const { selectedTool, zoom } = useSelector((state: RootState) => state.editor)
  const dungeon = useSelector((state: RootState) => state.map.dungeon)

  const toolButtonGroupRef = useRef<HTMLDivElement>(null)

  const handleToolChange = (_: React.MouseEvent<HTMLElement>, newTool: DrawingTool | null) => {
    if (newTool) {
      dispatch(setSelectedTool(newTool))
      // テンプレート以外のツールが選択された場合はテンプレート選択を解除
      if (newTool !== 'template') {
        dispatch(setSelectedTemplate(null))
      }
    }
  }

  const handleToolKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!dungeon) return
    
    const tools: DrawingTool[] = ['pen', 'rectangle', 'eraser']
    const currentIndex = tools.indexOf(selectedTool)
    
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault()
        const nextIndex = currentIndex === tools.length - 1 ? 0 : currentIndex + 1
        dispatch(setSelectedTool(tools[nextIndex]))
        break
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault()
        const prevIndex = currentIndex === 0 ? tools.length - 1 : currentIndex - 1
        dispatch(setSelectedTool(tools[prevIndex]))
        break
      case 'Home':
        event.preventDefault()
        dispatch(setSelectedTool(tools[0]))
        break
      case 'End':
        event.preventDefault()
        dispatch(setSelectedTool(tools[tools.length - 1]))
        break
    }
  }, [selectedTool, dispatch, dungeon])

  const handleUndo = () => {
    dispatch(undo())
  }

  const handleRedo = () => {
    dispatch(redo())
  }

  const handleZoomIn = () => {
    dispatch(setZoom(zoom * 1.2))
  }

  const handleZoomOut = () => {
    dispatch(setZoom(zoom / 1.2))
  }


  return (
    <Toolbar
      variant="dense"
      sx={{
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
        gap: 2,
      }}
    >
      {/* 描画ツール */}
      <ToggleButtonGroup
        ref={toolButtonGroupRef}
        value={selectedTool}
        exclusive
        onChange={handleToolChange}
        size="small"
        disabled={!dungeon}
        role="toolbar"
        aria-label="描画ツール選択"
        onKeyDown={handleToolKeyDown}
      >
        <ToggleButton 
          value="pen"
          aria-label="ペンツール"
          aria-describedby="pen-tool-description"
          aria-pressed={selectedTool === 'pen'}
        >
          <Tooltip title="ペンツール (1) - 矢印キーで移動">
            <PenIcon aria-hidden="true" />
          </Tooltip>
        </ToggleButton>
        <ToggleButton 
          value="rectangle"
          aria-label="矩形ツール"
          aria-describedby="rectangle-tool-description"
          aria-pressed={selectedTool === 'rectangle'}
        >
          <Tooltip title="矩形ツール (2) - 矢印キーで移動">
            <RectangleIcon aria-hidden="true" />
          </Tooltip>
        </ToggleButton>
        <ToggleButton 
          value="eraser"
          aria-label="消しゴムツール"
          aria-describedby="eraser-tool-description"
          aria-pressed={selectedTool === 'eraser'}
        >
          <Tooltip title="消しゴムツール (3) - 壁やイベントを消去。矢印キーで移動">
            <EraserIcon aria-hidden="true" />
          </Tooltip>
        </ToggleButton>
      </ToggleButtonGroup>

      <Divider orientation="vertical" flexItem />

      {/* 編集操作 */}
      <Box sx={{ display: 'flex', gap: 1 }} role="group" aria-label="編集操作">
        <Tooltip title="元に戻す (Ctrl+Z)">
          <span>
            <IconButton 
              size="small" 
              onClick={handleUndo} 
              disabled={!dungeon}
              aria-label="元に戻す"
              aria-keyshortcuts="Ctrl+Z"
            >
              <UndoIcon aria-hidden="true" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="やり直し (Ctrl+Y)">
          <span>
            <IconButton 
              size="small" 
              onClick={handleRedo} 
              disabled={!dungeon}
              aria-label="やり直し"
              aria-keyshortcuts="Ctrl+Y"
            >
              <RedoIcon aria-hidden="true" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      <Divider orientation="vertical" flexItem />

      {/* 表示操作 */}
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }} role="group" aria-label="表示操作">
        <Tooltip title="ズームイン (Ctrl++)">
          <span>
            <IconButton 
              size="small" 
              onClick={handleZoomIn} 
              disabled={!dungeon}
              aria-label="ズームイン"
              aria-keyshortcuts="Ctrl++"
            >
              <ZoomInIcon aria-hidden="true" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="ズームアウト (Ctrl+-)">
          <span>
            <IconButton 
              size="small" 
              onClick={handleZoomOut} 
              disabled={!dungeon}
              aria-label="ズームアウト"
              aria-keyshortcuts="Ctrl+-"
            >
              <ZoomOutIcon aria-hidden="true" />
            </IconButton>
          </span>
        </Tooltip>
        <Box 
          sx={{ minWidth: 50, textAlign: 'center', fontSize: '0.875rem' }}
          role="status"
          aria-label={`現在のズーム倍率: ${Math.round(zoom * 100)}パーセント`}
        >
          {Math.round(zoom * 100)}%
        </Box>
      </Box>
    </Toolbar>
  )
}

export default ToolBar