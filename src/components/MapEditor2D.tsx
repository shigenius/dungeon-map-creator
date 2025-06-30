import React, { useRef, useEffect, useCallback } from 'react'
import { Box } from '@mui/material'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../store'
import { updateCell } from '../store/mapSlice'
import { Position } from '../types/map'

const MapEditor2D: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dispatch = useDispatch()
  
  const dungeon = useSelector((state: RootState) => state.map.dungeon)
  const editorState = useSelector((state: RootState) => state.editor)
  const { currentFloor, selectedTool, selectedLayer, zoom, gridVisible } = editorState

  const cellSize = 32 * zoom
  const floor = dungeon?.floors[currentFloor]

  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
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

        // 通行不可の場合は「X」マークを表示
        if (!cell.floor.passable) {
          ctx.strokeStyle = '#f00'
          ctx.lineWidth = Math.max(1, cellSize / 20)
          ctx.beginPath()
          const margin = cellSize * 0.2
          ctx.moveTo(xPos + margin, yPos + margin)
          ctx.lineTo(xPos + cellSize - margin, yPos + cellSize - margin)
          ctx.moveTo(xPos + cellSize - margin, yPos + margin)
          ctx.lineTo(xPos + margin, yPos + cellSize - margin)
          ctx.stroke()
          ctx.lineWidth = 1
        }

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
    console.log('🐛 redraw: キャンバス再描画開始', {
      hasCanvas: !!canvasRef.current,
      hasFloor: !!floor,
      cellSize,
      layerVisibility: editorState.layerVisibility
    })

    const canvas = canvasRef.current
    if (!canvas || !floor) {
      console.log('🐛 redraw: canvas or floor is null - 描画中止')
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      console.log('🐛 redraw: context取得失敗')
      return
    }

    // キャンバスサイズを設定
    canvas.width = floor.width * cellSize
    canvas.height = floor.height * cellSize

    console.log('🐛 redraw: キャンバスサイズ設定', {
      width: canvas.width,
      height: canvas.height,
      floorSize: { width: floor.width, height: floor.height }
    })

    // 背景をクリア
    ctx.fillStyle = '#222'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // レイヤーの表示状態に応じて描画
    const { layerVisibility } = editorState
    
    if (layerVisibility.floor) {
      console.log('🐛 redraw: 床レイヤー描画')
      drawFloor(ctx)
    }
    if (layerVisibility.walls) {
      console.log('🐛 redraw: 壁レイヤー描画')
      drawWalls(ctx)
    }
    if (layerVisibility.events) {
      console.log('🐛 redraw: イベントレイヤー描画')
      drawEvents(ctx)
    }
    
    console.log('🐛 redraw: グリッド描画')
    drawGrid(ctx)
    
    console.log('🐛 redraw: 描画完了')
  }, [floor, cellSize, drawFloor, drawWalls, drawEvents, drawGrid, editorState])

  const getCellPosition = useCallback((event: React.MouseEvent): Position | null => {
    const canvas = canvasRef.current
    if (!canvas || !floor) {
      console.log('🐛 getCellPosition: canvas or floor is null', { canvas: !!canvas, floor: !!floor })
      return null
    }

    const rect = canvas.getBoundingClientRect()
    const rawX = event.clientX - rect.left
    const rawY = event.clientY - rect.top
    const x = Math.floor(rawX / cellSize)
    const y = Math.floor(rawY / cellSize)

    console.log('🐛 getCellPosition: 座標変換', {
      rawX, rawY,
      cellSize,
      calculatedX: x, calculatedY: y,
      floorSize: { width: floor.width, height: floor.height }
    })

    if (x >= 0 && x < floor.width && y >= 0 && y < floor.height) {
      console.log('🐛 getCellPosition: 有効な座標', { x, y })
      return { x, y }
    }

    console.log('🐛 getCellPosition: 無効な座標', { x, y, bounds: { width: floor.width, height: floor.height } })
    return null
  }, [cellSize, floor])

  const handleCanvasClick = useCallback((event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    
    console.log('🐛 handleCanvasClick: イベント発火', {
      selectedTool,
      selectedLayer,
      currentFloor,
      eventType: event.type,
      button: event.button
    })

    const position = getCellPosition(event)
    if (!position || !floor) {
      console.log('🐛 handleCanvasClick: position or floor is null', { position, floor: !!floor })
      return
    }

    const currentCell = floor.cells[position.y][position.x]
    console.log('🐛 handleCanvasClick: 現在のセル状態', {
      position,
      currentCell: {
        floor: currentCell.floor,
        walls: currentCell.walls,
        eventsCount: currentCell.events.length
      }
    })

    if (selectedLayer === 'floor') {
      if (selectedTool === 'pen') {
        // 床の編集：通行可否の切り替え
        const newPassable = !currentCell.floor.passable
        console.log('🐛 床編集（pen）: 通行可否切り替え', {
          oldPassable: currentCell.floor.passable,
          newPassable,
          position,
          currentFloor
        })

        const updatePayload = {
          floorIndex: currentFloor,
          position,
          cell: {
            floor: {
              ...currentCell.floor,
              passable: newPassable,
            }
          }
        }

        console.log('🐛 Redux dispatch: updateCell', updatePayload)
        dispatch(updateCell(updatePayload))
      } else if (selectedTool === 'fill') {
        // 塗りつぶしツール：同じタイプの床を一括変更
        const targetPassable = currentCell.floor.passable
        const newPassable = !targetPassable
        console.log('🐛 床編集（fill）: 塗りつぶし開始', {
          targetPassable,
          newPassable,
          floorSize: { width: floor.width, height: floor.height }
        })
        
        let updatedCount = 0
        // 連結したセルを探してまとめて変更（簡単な実装）
        for (let y = 0; y < floor.height; y++) {
          for (let x = 0; x < floor.width; x++) {
            const cell = floor.cells[y][x]
            if (cell.floor.passable === targetPassable) {
              updatedCount++
              dispatch(updateCell({
                floorIndex: currentFloor,
                position: { x, y },
                cell: {
                  floor: {
                    ...cell.floor,
                    passable: newPassable,
                  }
                }
              }))
            }
          }
        }
        console.log('🐛 床編集（fill）: 更新完了', { updatedCount })
      }
    } else if (selectedLayer === 'walls') {
      if (selectedTool === 'pen') {
        // 壁の編集：全方向の壁の切り替え
        const hasWall = currentCell.walls.north !== null
        const wall = hasWall ? null : {
          type: 'normal' as const,
          transparent: false,
        }

        console.log('🐛 壁編集（pen）: 壁の切り替え', {
          hasWall,
          wall,
          position,
          currentWalls: currentCell.walls
        })

        const updatePayload = {
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
        }

        console.log('🐛 Redux dispatch: updateCell (walls)', updatePayload)
        dispatch(updateCell(updatePayload))
      }
    } else if (selectedLayer === 'events') {
      if (selectedTool === 'pen') {
        // イベントの追加/削除
        const hasEvent = currentCell.events.length > 0
        const newEvents = hasEvent ? [] : [{
          id: crypto.randomUUID(),
          type: 'treasure' as const,
          name: '宝箱',
          position: position,
          appearance: {
            visible: true,
          },
          trigger: {
            type: 'interact' as const,
          },
          actions: [],
          flags: {},
          enabled: true,
        }]

        console.log('🐛 イベント編集（pen）: イベントの切り替え', {
          hasEvent,
          eventsCount: currentCell.events.length,
          newEventsCount: newEvents.length,
          position
        })

        const updatePayload = {
          floorIndex: currentFloor,
          position,
          cell: {
            events: newEvents,
          }
        }

        console.log('🐛 Redux dispatch: updateCell (events)', updatePayload)
        dispatch(updateCell(updatePayload))
      }
    }
  }, [getCellPosition, floor, selectedLayer, selectedTool, dispatch, currentFloor])

  useEffect(() => {
    console.log('🐛 useEffect: redraw依存関係が変更されました')
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
        overflow: 'visible',
        cursor: selectedTool === 'pen' ? 'crosshair' : 'default',
        position: 'relative',
        userSelect: 'none',
      }}
    >
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        onPointerDown={(e) => {
          console.log('🐛 Pointer down:', e.button, e.clientX, e.clientY)
          e.currentTarget.setPointerCapture(e.pointerId)
        }}
        onPointerUp={(e) => console.log('🐛 Pointer up:', e.button, e.clientX, e.clientY)}
        onMouseDown={(e) => console.log('🐛 Mouse down:', e.button, e.clientX, e.clientY)}
        onMouseUp={(e) => console.log('🐛 Mouse up:', e.button, e.clientX, e.clientY)}
        style={{
          display: 'block',
          imageRendering: 'pixelated',
          pointerEvents: 'auto',
          touchAction: 'none',
          width: floor ? `${floor.width * cellSize}px` : 'auto',
          height: floor ? `${floor.height * cellSize}px` : 'auto',
          border: '1px solid #666',
        }}
      />
    </Box>
  )
}

export default MapEditor2D