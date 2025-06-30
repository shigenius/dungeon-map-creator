import React from 'react'
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
  FormatColorFill as FillIcon,
  Colorize as EyedropperIcon,
  CropFree as SelectIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Grid3x3 as GridIcon,
} from '@mui/icons-material'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../store'
import { setSelectedTool, setZoom, toggleGrid } from '../store/editorSlice'
import { undo, redo } from '../store/mapSlice'
import { DrawingTool } from '../types/map'

const ToolBar: React.FC = () => {
  const dispatch = useDispatch()
  const { selectedTool, zoom, gridVisible } = useSelector((state: RootState) => state.editor)
  const dungeon = useSelector((state: RootState) => state.map.dungeon)

  const handleToolChange = (_: React.MouseEvent<HTMLElement>, newTool: DrawingTool | null) => {
    if (newTool) {
      dispatch(setSelectedTool(newTool))
    }
  }

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

  const handleToggleGrid = () => {
    dispatch(toggleGrid())
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
        value={selectedTool}
        exclusive
        onChange={handleToolChange}
        size="small"
        disabled={!dungeon}
      >
        <ToggleButton value="pen">
          <Tooltip title="ペンツール (1)">
            <PenIcon />
          </Tooltip>
        </ToggleButton>
        <ToggleButton value="rectangle">
          <Tooltip title="矩形ツール (2)">
            <RectangleIcon />
          </Tooltip>
        </ToggleButton>
        <ToggleButton value="fill">
          <Tooltip title="塗りつぶしツール (3)">
            <FillIcon />
          </Tooltip>
        </ToggleButton>
        <ToggleButton value="eyedropper">
          <Tooltip title="スポイトツール (4)">
            <EyedropperIcon />
          </Tooltip>
        </ToggleButton>
        <ToggleButton value="select">
          <Tooltip title="選択ツール (5)">
            <SelectIcon />
          </Tooltip>
        </ToggleButton>
      </ToggleButtonGroup>

      <Divider orientation="vertical" flexItem />

      {/* 編集操作 */}
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Tooltip title="元に戻す (Ctrl+Z)">
          <span>
            <IconButton size="small" onClick={handleUndo} disabled={!dungeon}>
              <UndoIcon />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="やり直し (Ctrl+Y)">
          <span>
            <IconButton size="small" onClick={handleRedo} disabled={!dungeon}>
              <RedoIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      <Divider orientation="vertical" flexItem />

      {/* 表示操作 */}
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <Tooltip title="ズームイン">
          <span>
            <IconButton size="small" onClick={handleZoomIn} disabled={!dungeon}>
              <ZoomInIcon />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="ズームアウト">
          <span>
            <IconButton size="small" onClick={handleZoomOut} disabled={!dungeon}>
              <ZoomOutIcon />
            </IconButton>
          </span>
        </Tooltip>
        <Box sx={{ minWidth: 50, textAlign: 'center', fontSize: '0.875rem' }}>
          {Math.round(zoom * 100)}%
        </Box>
        <Tooltip title="グリッド表示切替">
          <span>
            <IconButton 
              size="small" 
              onClick={handleToggleGrid} 
              disabled={!dungeon}
              color={gridVisible ? 'primary' : 'default'}
            >
              <GridIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    </Toolbar>
  )
}

export default ToolBar