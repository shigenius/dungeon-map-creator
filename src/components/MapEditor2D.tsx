import React, { useRef, useEffect, useCallback } from 'react'
import { Box } from '@mui/material'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../store'
import { updateCell } from '../store/mapSlice'
import { Cell, Position, FloorType } from '../types/map'

const MapEditor2D: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dispatch = useDispatch()
  
  const dungeon = useSelector((state: RootState) => state.map.dungeon)
  const { currentFloor, selectedTool, selectedLayer, zoom, gridVisible } = useSelector((state: RootState) => state.editor)

  const cellSize = 32 * zoom
  const floor = dungeon?.floors[currentFloor]

  const drawGrid = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (!gridVisible || !floor) return

    ctx.strokeStyle = '#333'
    ctx.lineWidth = 1

    // 縦線
    for (let x = 0; x <= floor.width; x++) {
      const xPos = x * cellSize
      ctx.beginPath()
      ctx.moveTo(xPos, 0)
      ctx.lineTo(xPos, floor.height * cellSize)
      ctx.stroke()
    }

    // 横線
    for (let y = 0; y <= floor.height; y++) {
      const yPos = y * cellSize
      ctx.beginPath()
      ctx.moveTo(0, yPos)
      ctx.lineTo(floor.width * cellSize, yPos)
      ctx.stroke()
    }
  }, [gridVisible, floor, cellSize])

  const drawFloor = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!floor) return

    for (let y = 0; y < floor.height; y++) {
      for (let x = 0; x < floor.width; x++) {
        const cell = floor.cells[y][x]
        const xPos = x * cellSize
        const yPos = y * cellSize

        // 床の描画
        let floorColor = '#444'
        switch (cell.floor.type) {
          case 'normal':
            floorColor = cell.floor.passable ? '#666' : '#333'
            break
          case 'damage':
            floorColor = '#800'
            break
          case 'slippery':
            floorColor = '#048'
            break
          case 'pit':
            floorColor = '#000'
            break
          case 'warp':
            floorColor = '#840'
            break
          default:
            floorColor = '#666'
        }

        ctx.fillStyle = floorColor
        ctx.fillRect(xPos, yPos, cellSize, cellSize)

        // 床タイプのテキスト表示（ズームが大きい時のみ）
        if (cellSize > 24) {
          ctx.fillStyle = '#fff'
          ctx.font = `${Math.min(cellSize / 4, 12)}px Arial`
          ctx.textAlign = 'center'
          ctx.fillText(
            cell.floor.type === 'normal' ? '床' : cell.floor.type,
            xPos + cellSize / 2,
            yPos + cellSize / 2 + 4
          )
        }
      }
    }
  }, [floor, cellSize])

  const drawWalls = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!floor) return

    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2

    for (let y = 0; y < floor.height; y++) {
      for (let x = 0; x < floor.width; x++) {
        const cell = floor.cells[y][x]
        const xPos = x * cellSize
        const yPos = y * cellSize

        // 北の壁
        if (cell.walls.north) {
          ctx.beginPath()
          ctx.moveTo(xPos, yPos)
          ctx.lineTo(xPos + cellSize, yPos)
          ctx.stroke()
        }

        // 東の壁
        if (cell.walls.east) {
          ctx.beginPath()
          ctx.moveTo(xPos + cellSize, yPos)
          ctx.lineTo(xPos + cellSize, yPos + cellSize)
          ctx.stroke()
        }

        // 南の壁
        if (cell.walls.south) {
          ctx.beginPath()
          ctx.moveTo(xPos, yPos + cellSize)
          ctx.lineTo(xPos + cellSize, yPos + cellSize)
          ctx.stroke()
        }

        // 西の壁
        if (cell.walls.west) {
          ctx.beginPath()
          ctx.moveTo(xPos, yPos)
          ctx.lineTo(xPos, yPos + cellSize)
          ctx.stroke()
        }
      }
    }
  }, [floor, cellSize])

  const drawEvents = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!floor) return

    for (let y = 0; y < floor.height; y++) {
      for (let x = 0; x < floor.width; x++) {
        const cell = floor.cells[y][x]
        if (cell.events.length > 0) {
          const xPos = x * cellSize + cellSize / 4
          const yPos = y * cellSize + cellSize / 4
          const size = cellSize / 2

          // イベントを小さな円で表示
          ctx.fillStyle = '#ff0'
          ctx.beginPath()
          ctx.arc(xPos + size / 2, yPos + size / 2, size / 3, 0, Math.PI * 2)
          ctx.fill()

          // イベント数を表示
          if (cellSize > 16) {
            ctx.fillStyle = '#000'
            ctx.font = `${Math.min(cellSize / 6, 10)}px Arial`
            ctx.textAlign = 'center'
            ctx.fillText(
              cell.events.length.toString(),
              xPos + size / 2,
              yPos + size / 2 + 3
            )
          }
        }
      }
    }
  }, [floor, cellSize])

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !floor) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // キャンバスサイズを設定
    canvas.width = floor.width * cellSize
    canvas.height = floor.height * cellSize

    // 背景をクリア
    ctx.fillStyle = '#222'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // レイヤーに応じて描画
    drawFloor(ctx)
    drawWalls(ctx)
    drawEvents(ctx)
    drawGrid(ctx, canvas.width, canvas.height)
  }, [floor, cellSize, drawFloor, drawWalls, drawEvents, drawGrid])

  const getCellPosition = useCallback((event: React.MouseEvent): Position | null => {
    const canvas = canvasRef.current
    if (!canvas || !floor) return null

    const rect = canvas.getBoundingClientRect()
    const x = Math.floor((event.clientX - rect.left) / cellSize)
    const y = Math.floor((event.clientY - rect.top) / cellSize)

    if (x >= 0 && x < floor.width && y >= 0 && y < floor.height) {
      return { x, y }
    }

    return null
  }, [cellSize, floor])

  const handleCanvasClick = useCallback((event: React.MouseEvent) => {
    const position = getCellPosition(event)
    if (!position || !floor) return

    const currentCell = floor.cells[position.y][position.x]

    if (selectedLayer === 'floor' && selectedTool === 'pen') {
      // 床の編集（簡単な例：通常床と通行不可床の切り替え）
      const newFloorType: FloorType = currentCell.floor.passable ? 'normal' : 'normal'
      const newPassable = !currentCell.floor.passable

      dispatch(updateCell({
        floorIndex: currentFloor,
        position,
        cell: {
          floor: {
            ...currentCell.floor,
            type: newFloorType,
            passable: newPassable,
          }
        }
      }))
    } else if (selectedLayer === 'walls' && selectedTool === 'pen') {
      // 壁の編集（簡単な例：全方向の壁の切り替え）
      const hasWall = currentCell.walls.north !== null
      const wall = hasWall ? null : {
        type: 'normal' as const,
        transparent: false,
      }

      dispatch(updateCell({
        floorIndex: currentFloor,
        position,
        cell: {
          walls: {
            north: wall,
            east: wall,
            south: wall,
            west: wall,
          }
        }
      }))
    }
  }, [getCellPosition, floor, selectedLayer, selectedTool, dispatch, currentFloor])

  useEffect(() => {
    redraw()
  }, [redraw])

  if (!floor) {
    return <Box>フロアデータが見つかりません</Box>
  }

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        overflow: 'auto',
        cursor: selectedTool === 'pen' ? 'crosshair' : 'default',
      }}
    >
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        style={{
          display: 'block',
          imageRendering: 'pixelated',
        }}
      />
    </Box>
  )
}

export default MapEditor2D