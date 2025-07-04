import React, { useRef, useEffect, useState } from 'react'
import {
  Box,
  Paper,
  IconButton,
  Tooltip,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material'
import {
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  CenterFocusStrong as CenterIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../store'
import { setZoom, setViewCenter, setMinimapVisible } from '../store/editorSlice'
import { Cell, DungeonFloor } from '../types/map'

interface MinimapProps {
  width?: number
  height?: number
  onCellClick?: (x: number, y: number) => void
}

const Minimap: React.FC<MinimapProps> = ({
  width = 200,
  height = 200,
  onCellClick
}) => {
  const dispatch = useDispatch()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { 
    dungeon, 
    currentFloor,
    viewCenter,
    zoom,
    layerVisibility,
    hoveredCellPosition,
    minimapVisible 
  } = useSelector((state: RootState) => ({
    dungeon: state.map.dungeon,
    currentFloor: state.editor.currentFloor,
    viewCenter: state.editor.viewCenter || { x: 0, y: 0 },
    zoom: state.editor.zoom,
    layerVisibility: state.editor.layerVisibility,
    hoveredCellPosition: state.editor.hoveredCellPosition,
    minimapVisible: state.editor.minimapVisible
  }))

  const [minimapZoom, setMinimapZoom] = useState(1)
  const [displayMode, setDisplayMode] = useState<'overview' | 'detail'>('overview')

  useEffect(() => {
    if (!dungeon || !minimapVisible) return
    
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const floor = dungeon.floors[currentFloor]
    if (!floor) return

    drawMinimap(ctx, floor, canvas.width, canvas.height)
  }, [dungeon, currentFloor, minimapVisible, minimapZoom, displayMode, layerVisibility, hoveredCellPosition])

  const drawMinimap = (ctx: CanvasRenderingContext2D, floor: DungeonFloor, canvasWidth: number, canvasHeight: number) => {
    // キャンバスをクリア
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    const mapWidth = floor.width
    const mapHeight = floor.height
    
    // セルサイズを計算（パディングを考慮）
    const padding = 10
    const availableWidth = canvasWidth - padding * 2
    const availableHeight = canvasHeight - padding * 2
    
    const cellSize = Math.min(
      availableWidth / mapWidth,
      availableHeight / mapHeight
    ) * minimapZoom

    // 描画開始位置を中央に調整
    const startX = (canvasWidth - mapWidth * cellSize) / 2
    const startY = (canvasHeight - mapHeight * cellSize) / 2

    // 各セルを描画
    for (let y = 0; y < mapHeight; y++) {
      for (let x = 0; x < mapWidth; x++) {
        const cell = floor.cells[y][x]
        const xPos = startX + x * cellSize
        const yPos = startY + y * cellSize

        drawMinimapCell(ctx, cell, xPos, yPos, cellSize, x, y)
      }
    }

    // ビューポート表示
    drawViewport(ctx, startX, startY, cellSize, mapWidth, mapHeight)

    // ホバー位置のハイライト
    if (hoveredCellPosition) {
      drawHoverHighlight(ctx, startX, startY, cellSize, hoveredCellPosition.x, hoveredCellPosition.y)
    }

    // 外枠
    ctx.strokeStyle = '#666'
    ctx.lineWidth = 1
    ctx.strokeRect(startX - 1, startY - 1, mapWidth * cellSize + 2, mapHeight * cellSize + 2)
  }

  const drawMinimapCell = (
    ctx: CanvasRenderingContext2D, 
    cell: Cell, 
    x: number, 
    y: number, 
    size: number,
    cellX: number,
    cellY: number
  ) => {
    // 床の描画
    if (layerVisibility.floor) {
      let floorColor = '#333'
      if (cell.floor.passable) {
        switch (cell.floor.type) {
          case 'normal': floorColor = '#666'; break
          case 'damage': floorColor = '#844'; break
          case 'slippery': floorColor = '#468'; break
          case 'pit': floorColor = '#000'; break
          case 'warp': floorColor = '#864'; break
          default: floorColor = '#666'; break
        }
      } else {
        floorColor = '#222'
      }
      
      ctx.fillStyle = floorColor
      ctx.fillRect(x, y, size, size)
    }

    // 壁の描画（概要モードでは簡略化）
    if (layerVisibility.walls && size > 2) {
      ctx.strokeStyle = '#aaa'
      ctx.lineWidth = Math.max(0.5, size / 16)

      // 各方向の壁を描画
      if (cell.walls.north) {
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x + size, y)
        ctx.stroke()
      }
      if (cell.walls.east) {
        ctx.beginPath()
        ctx.moveTo(x + size, y)
        ctx.lineTo(x + size, y + size)
        ctx.stroke()
      }
      if (cell.walls.south) {
        ctx.beginPath()
        ctx.moveTo(x, y + size)
        ctx.lineTo(x + size, y + size)
        ctx.stroke()
      }
      if (cell.walls.west) {
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x, y + size)
        ctx.stroke()
      }
    }

    // イベントの描画
    if (layerVisibility.events && cell.events.length > 0 && size > 3) {
      const eventSize = Math.max(2, size / 4)
      ctx.fillStyle = '#ffd700'
      ctx.beginPath()
      ctx.arc(x + size * 0.75, y + size * 0.25, eventSize, 0, Math.PI * 2)
      ctx.fill()
    }

    // 装飾の描画
    if (layerVisibility.decorations && cell.decorations.length > 0 && size > 3) {
      const decorationSize = Math.max(1, size / 6)
      ctx.fillStyle = '#aaa'
      ctx.beginPath()
      ctx.arc(x + size * 0.25, y + size * 0.75, decorationSize, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  const drawViewport = (
    ctx: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    cellSize: number,
    mapWidth: number,
    mapHeight: number
  ) => {
    // 現在のビューポートを表示（概算）
    const viewportWidth = Math.min(20, mapWidth) // 仮の値
    const viewportHeight = Math.min(15, mapHeight) // 仮の値
    
    const viewportX = Math.max(0, Math.min(mapWidth - viewportWidth, viewCenter.x - viewportWidth / 2))
    const viewportY = Math.max(0, Math.min(mapHeight - viewportHeight, viewCenter.y - viewportHeight / 2))
    
    ctx.strokeStyle = '#4fc3f7'
    ctx.lineWidth = 2
    ctx.setLineDash([3, 3])
    ctx.strokeRect(
      startX + viewportX * cellSize,
      startY + viewportY * cellSize,
      viewportWidth * cellSize,
      viewportHeight * cellSize
    )
    ctx.setLineDash([])
  }

  const drawHoverHighlight = (
    ctx: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    cellSize: number,
    hoverX: number,
    hoverY: number
  ) => {
    ctx.strokeStyle = '#ff9800'
    ctx.lineWidth = 2
    ctx.strokeRect(
      startX + hoverX * cellSize,
      startY + hoverY * cellSize,
      cellSize,
      cellSize
    )
  }

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dungeon || !onCellClick) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const clickX = event.clientX - rect.left
    const clickY = event.clientY - rect.top

    const floor = dungeon.floors[currentFloor]
    if (!floor) return

    // セル座標を計算
    const mapWidth = floor.width
    const mapHeight = floor.height
    const padding = 10
    const availableWidth = canvas.width - padding * 2
    const availableHeight = canvas.height - padding * 2
    
    const cellSize = Math.min(
      availableWidth / mapWidth,
      availableHeight / mapHeight
    ) * minimapZoom

    const startX = (canvas.width - mapWidth * cellSize) / 2
    const startY = (canvas.height - mapHeight * cellSize) / 2

    const cellX = Math.floor((clickX - startX) / cellSize)
    const cellY = Math.floor((clickY - startY) / cellSize)

    if (cellX >= 0 && cellX < mapWidth && cellY >= 0 && cellY < mapHeight) {
      onCellClick(cellX, cellY)
    }
  }

  const handleZoomIn = () => {
    setMinimapZoom(prev => Math.min(3, prev * 1.2))
  }

  const handleZoomOut = () => {
    setMinimapZoom(prev => Math.max(0.3, prev / 1.2))
  }

  const handleCenter = () => {
    if (dungeon) {
      const floor = dungeon.floors[currentFloor]
      if (floor) {
        dispatch(setViewCenter({ x: floor.width / 2, y: floor.height / 2 }))
      }
    }
  }

  if (!minimapVisible) {
    return (
      <Paper 
        sx={{ 
          position: 'absolute',
          top: 16,
          right: 16,
          p: 1,
          zIndex: 1000,
          backgroundColor: 'rgba(0, 0, 0, 0.8)'
        }}
      >
        <IconButton 
          size="small" 
          onClick={() => dispatch(setMinimapVisible(true))}
          sx={{ color: 'white' }}
        >
          <VisibilityIcon />
        </IconButton>
      </Paper>
    )
  }

  return (
    <Paper 
      sx={{ 
        position: 'absolute',
        top: 16,
        right: 16,
        p: 1,
        zIndex: 1000,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        border: '1px solid #444'
      }}
    >
      {/* ヘッダー */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold' }}>
          ミニマップ
        </Typography>
        <IconButton 
          size="small" 
          onClick={() => dispatch(setMinimapVisible(false))}
          sx={{ color: 'white' }}
        >
          <VisibilityOffIcon />
        </IconButton>
      </Box>

      {/* モード切り替え */}
      <Box sx={{ mb: 1 }}>
        <ToggleButtonGroup
          value={displayMode}
          exclusive
          onChange={(_, value) => value && setDisplayMode(value)}
          size="small"
          sx={{ 
            '& .MuiToggleButton-root': { 
              color: 'white', 
              fontSize: '0.7rem',
              px: 1,
              py: 0.5
            } 
          }}
        >
          <ToggleButton value="overview">全体</ToggleButton>
          <ToggleButton value="detail">詳細</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* キャンバス */}
      <Box sx={{ position: 'relative', mb: 1 }}>
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onClick={handleCanvasClick}
          style={{
            cursor: onCellClick ? 'pointer' : 'default',
            border: '1px solid #666',
            borderRadius: '4px'
          }}
        />
      </Box>

      {/* コントロール */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="ズームイン">
            <IconButton size="small" onClick={handleZoomIn} sx={{ color: 'white' }}>
              <ZoomInIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="ズームアウト">
            <IconButton size="small" onClick={handleZoomOut} sx={{ color: 'white' }}>
              <ZoomOutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="中央に移動">
            <IconButton size="small" onClick={handleCenter} sx={{ color: 'white' }}>
              <CenterIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <Typography variant="caption" sx={{ color: '#aaa' }}>
          {Math.round(minimapZoom * 100)}%
        </Typography>
      </Box>

      {/* フロア情報 */}
      {dungeon && (
        <Typography variant="caption" sx={{ color: '#aaa', display: 'block', mt: 0.5 }}>
          フロア {currentFloor + 1}: {dungeon.floors[currentFloor]?.name || '無名'}
        </Typography>
      )}
    </Paper>
  )
}

export default Minimap