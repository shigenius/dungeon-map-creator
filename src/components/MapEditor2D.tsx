import React, { useRef, useEffect, useCallback, useState } from 'react'
import { Box } from '@mui/material'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../store'
import { updateCell, updateCells } from '../store/mapSlice'
import { setCapturedCellData } from '../store/editorSlice'
import { Position, WallType } from '../types/map'

// 床タイプに応じた通行可否を決定する関数
const getPassableForFloorType = (floorType: string) => {
  switch (floorType) {
    case 'normal': return true
    case 'damage': return true  
    case 'slippery': return true
    case 'pit': return false
    case 'warp': return true
    default: return true
  }
}

// 壁タイプに応じた透明性を決定する関数
const getTransparentForWallType = (wallType: string) => {
  switch (wallType) {
    case 'normal': return false
    case 'door': return false
    case 'locked_door': return false
    case 'hidden_door': return false
    case 'breakable': return false
    case 'oneway': return false
    case 'invisible': return true
    case 'event': return false
    default: return false
  }
}

// 壁タイプごとの視覚的スタイルを取得する関数
const getWallStyle = (wallType: WallType) => {
  switch (wallType) {
    case 'normal': return { color: '#fff', lineWidth: 2, pattern: 'solid' }
    case 'door': return { color: '#8B4513', lineWidth: 3, pattern: 'solid' }
    case 'locked_door': return { color: '#FFD700', lineWidth: 3, pattern: 'solid' }
    case 'hidden_door': return { color: '#888', lineWidth: 1, pattern: 'dashed' }
    case 'breakable': return { color: '#FF6B35', lineWidth: 2, pattern: 'dashed' }
    case 'oneway': return { color: '#00CED1', lineWidth: 3, pattern: 'solid' }
    case 'invisible': return { color: '#666', lineWidth: 1, pattern: 'dotted' }
    case 'event': return { color: '#FF1493', lineWidth: 2, pattern: 'dotted' }
    default: return { color: '#fff', lineWidth: 2, pattern: 'solid' }
  }
}

// 線のパターンを設定する関数
const setLinePattern = (ctx: CanvasRenderingContext2D, pattern: string) => {
  switch (pattern) {
    case 'solid': ctx.setLineDash([]); break
    case 'dashed': ctx.setLineDash([5, 5]); break
    case 'dotted': ctx.setLineDash([2, 3]); break
    default: ctx.setLineDash([])
  }
}

// 境界線座標からセル座標に変換する関数
const convertBoundaryToCell = (boundaryX: number, boundaryY: number, cellSize: number) => {
  // 境界線座標を正確なセル座標に変換
  // 垂直境界線：境界線が完全にセル境界上にある場合は右側のセルを選択
  // 水平境界線：境界線が完全にセル境界上にある場合は下側のセルを選択
  
  const exactCellX = boundaryX / cellSize
  const exactCellY = boundaryY / cellSize
  
  // 境界線が完全にグリッド線上にある場合の処理
  const isOnVerticalBoundary = exactCellX === Math.floor(exactCellX) && exactCellX > 0
  const isOnHorizontalBoundary = exactCellY === Math.floor(exactCellY) && exactCellY > 0
  
  let cellX, cellY
  
  if (isOnVerticalBoundary) {
    // 垂直境界線上：左側のセルを選択してeast壁に配置
    cellX = Math.floor(exactCellX) - 1
  } else {
    cellX = Math.floor(exactCellX)
  }
  
  if (isOnHorizontalBoundary) {
    // 水平境界線上：上側のセルを選択してsouth壁に配置
    cellY = Math.floor(exactCellY) - 1
  } else {
    cellY = Math.floor(exactCellY)
  }
  
  return { x: cellX, y: cellY }
}

// 床タイプのドラッグ描画関数：開始点から終了点までの直線上のセルの床タイプを変更
const generateFloorsAlongLine = (start: Position, end: Position, selectedFloorType: string, resetMode: boolean = false) => {
  const updates: Array<{ position: Position; cell: Partial<{ floor: any }> }> = []
  
  // 開始点と終了点が同じ場合は、単一セルの操作として扱う
  if (start.x === end.x && start.y === end.y) {
    const newFloorData = resetMode ? 
      { type: 'normal' as const, passable: true } : 
      { type: selectedFloorType as any, passable: getPassableForFloorType(selectedFloorType) }
    
    updates.push({
      position: start,
      cell: { floor: newFloorData }
    })
    return updates
  }
  
  // Bresenhamのアルゴリズムで直線上のセルを取得
  const dx = Math.abs(end.x - start.x)
  const dy = Math.abs(end.y - start.y)
  const sx = start.x < end.x ? 1 : -1
  const sy = start.y < end.y ? 1 : -1
  let err = dx - dy
  
  let x = start.x
  let y = start.y
  
  while (true) {
    // 範囲チェック
    if (x >= 0 && y >= 0) {
      const newFloorData = resetMode ? 
        { type: 'normal' as const, passable: true } : 
        { type: selectedFloorType as any, passable: getPassableForFloorType(selectedFloorType) }
      
      updates.push({
        position: { x, y },
        cell: { floor: newFloorData }
      })
    }
    
    // 終点に到達したら終了
    if (x === end.x && y === end.y) break
    
    const e2 = 2 * err
    if (e2 > -dy) {
      err -= dy
      x += sx
    }
    if (e2 < dx) {
      err += dx
      y += sy
    }
  }
  
  return updates
}

// 世界樹の迷宮スタイルの壁配置関数：ドラッグした線自体が壁になる
const generateWallsAlongLine = (start: Position, end: Position, selectedWallType: WallType, deleteMode: boolean = false, floor?: any) => {
  const updates: Array<{ position: Position; cell: Partial<{ walls: any }> }> = []
  
  // 開始点と終了点が同じ場合は、単一セルのクリック操作として扱う
  if (start.x === end.x && start.y === end.y) {
    return []
  }
  
  // 水平線の場合（左右にドラッグ）→ 水平壁を配置/削除
  if (start.y === end.y) {
    const minX = Math.min(start.x, end.x)
    const maxX = Math.max(start.x, end.x)
    
    // 各セルの間に水平壁を配置/削除
    for (let x = minX; x <= maxX; x++) {
      // 範囲チェック
      if (!floor || start.y < 0 || start.y >= floor.height || x < 0 || x >= floor.width) continue
      
      // 既存の壁情報を保持
      const currentCell = floor.cells[start.y][x]
      const existingWalls = {
        north: currentCell.walls.north,
        east: currentCell.walls.east,
        south: currentCell.walls.south,
        west: currentCell.walls.west,
      }
      
      // 特定の壁のみを更新
      existingWalls.south = deleteMode ? null : { type: selectedWallType, transparent: getTransparentForWallType(selectedWallType) }
      
      updates.push({
        position: { x, y: start.y },
        cell: {
          walls: existingWalls
        }
      })
    }
  }
  // 垂直線の場合（上下にドラッグ）→ 垂直壁を配置/削除
  else if (start.x === end.x) {
    const minY = Math.min(start.y, end.y)
    const maxY = Math.max(start.y, end.y)
    
    // 各セルの間に垂直壁を配置/削除
    for (let y = minY; y <= maxY; y++) {
      // 範囲チェック
      if (!floor || y < 0 || y >= floor.height || start.x < 0 || start.x >= floor.width) continue
      
      // 既存の壁情報を保持
      const currentCell = floor.cells[y][start.x]
      const existingWalls = {
        north: currentCell.walls.north,
        east: currentCell.walls.east,
        south: currentCell.walls.south,
        west: currentCell.walls.west,
      }
      
      // 特定の壁のみを更新
      existingWalls.east = deleteMode ? null : { type: selectedWallType, transparent: getTransparentForWallType(selectedWallType) }
      
      updates.push({
        position: { x: start.x, y },
        cell: {
          walls: existingWalls
        }
      })
    }
  }
  // 斜線の場合は対応しない（世界樹の迷宮では直線のみ）
  
  return updates
}

// クリック位置から最も近い壁方向を判定する関数
const getWallDirectionFromClick = (
  mouseX: number, 
  mouseY: number, 
  cellX: number, 
  cellY: number, 
  cellSize: number
): 'north' | 'east' | 'south' | 'west' => {
  // セル内の相対位置
  const relativeX = (mouseX - cellX * cellSize) / cellSize
  const relativeY = (mouseY - cellY * cellSize) / cellSize
  
  // セル中心からの距離を計算
  const centerX = 0.5
  const centerY = 0.5
  const dx = relativeX - centerX
  const dy = relativeY - centerY
  
  // どの辺に最も近いかを判定
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? 'east' : 'west'
  } else {
    return dy > 0 ? 'south' : 'north'
  }
}

// 境界線座標から壁方向を判定する関数
const getWallDirectionFromBoundary = (
  boundaryX: number,
  boundaryY: number,
  cellX: number,
  cellY: number,
  cellSize: number
): 'north' | 'east' | 'south' | 'west' => {
  // セルの境界座標を計算
  const cellLeft = cellX * cellSize
  const cellRight = (cellX + 1) * cellSize
  const cellTop = cellY * cellSize
  const cellBottom = (cellY + 1) * cellSize
  
  // 境界線がセルのどの辺にあるかを判定
  const tolerance = 1 // ピクセル単位の許容誤差
  
  if (Math.abs(boundaryX - cellLeft) <= tolerance) {
    return 'west'
  } else if (Math.abs(boundaryX - cellRight) <= tolerance) {
    return 'east'
  } else if (Math.abs(boundaryY - cellTop) <= tolerance) {
    return 'north'
  } else if (Math.abs(boundaryY - cellBottom) <= tolerance) {
    return 'south'
  }
  
  // フォールバック：最も近い境界線
  const distToLeft = Math.abs(boundaryX - cellLeft)
  const distToRight = Math.abs(boundaryX - cellRight)
  const distToTop = Math.abs(boundaryY - cellTop)
  const distToBottom = Math.abs(boundaryY - cellBottom)
  
  const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom)
  
  if (minDist === distToLeft) return 'west'
  if (minDist === distToRight) return 'east'
  if (minDist === distToTop) return 'north'
  return 'south'
}

// マウス位置から最も適切な壁境界線上の座標を取得する関数（世界樹の迷宮スタイル）
const getWallBoundaryPosition = (
  mouseX: number,
  mouseY: number,
  cellSize: number
): { x: number; y: number; snapType: 'horizontal' | 'vertical' } => {
  // すべての可能な境界線との距離を計算
  const cellX = Math.floor(mouseX / cellSize)
  const cellY = Math.floor(mouseY / cellSize)
  
  // 各境界線の座標を計算
  const boundaries = [
    // 垂直境界線
    { x: cellX * cellSize, y: mouseY, type: 'vertical' as const, dist: Math.abs(mouseX - cellX * cellSize) },
    { x: (cellX + 1) * cellSize, y: mouseY, type: 'vertical' as const, dist: Math.abs(mouseX - (cellX + 1) * cellSize) },
    // 水平境界線
    { x: mouseX, y: cellY * cellSize, type: 'horizontal' as const, dist: Math.abs(mouseY - cellY * cellSize) },
    { x: mouseX, y: (cellY + 1) * cellSize, type: 'horizontal' as const, dist: Math.abs(mouseY - (cellY + 1) * cellSize) }
  ]
  
  // 最も近い境界線を選択
  const closest = boundaries.reduce((min, current) => 
    current.dist < min.dist ? current : min
  )
  
  return {
    x: closest.x,
    y: closest.y,
    snapType: closest.type
  }
}

const MapEditor2D: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dispatch = useDispatch()
  
  // 矩形ツール用の状態管理
  const [rectangleStart, setRectangleStart] = useState<Position | null>(null)
  const [rectangleEnd, setRectangleEnd] = useState<Position | null>(null)
  const [isDrawingRectangle, setIsDrawingRectangle] = useState(false)
  
  // 選択ツール用の状態管理
  const [selectedCell, setSelectedCell] = useState<Position | null>(null)
  
  // ドラッグ描画用の状態管理
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<Position | null>(null)
  const [dragEnd, setDragEnd] = useState<Position | null>(null)
  // 世界樹の迷宮スタイル用：実際のピクセル座標での開始・終了位置
  const [dragStartPixel, setDragStartPixel] = useState<{ x: number; y: number } | null>(null)
  const [dragEndPixel, setDragEndPixel] = useState<{ x: number; y: number } | null>(null)
  // Shiftキーによる削除モード
  const [isShiftPressed, setIsShiftPressed] = useState(false)
  // ドラッグ開始点（マウス座標）
  const [dragStartMouse, setDragStartMouse] = useState<{ x: number; y: number } | null>(null)
  // 実際にドラッグが開始されたかどうかのフラグ
  const [isActuallyDragging, setIsActuallyDragging] = useState(false)
  
  const dungeon = useSelector((state: RootState) => state.map.dungeon)
  const editorState = useSelector((state: RootState) => state.editor)
  const { currentFloor, selectedTool, selectedLayer, selectedFloorType, selectedWallType, capturedCellData, zoom, gridVisible } = editorState

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

    for (let y = 0; y < floor.height; y++) {
      for (let x = 0; x < floor.width; x++) {
        const cell = floor.cells[y][x]
        const xPos = x * cellSize
        const yPos = y * cellSize

        // 北の壁
        if (cell.walls.north) {
          const style = getWallStyle(cell.walls.north.type)
          ctx.strokeStyle = style.color
          ctx.lineWidth = style.lineWidth
          setLinePattern(ctx, style.pattern)
          
          ctx.beginPath()
          ctx.moveTo(xPos, yPos)
          ctx.lineTo(xPos + cellSize, yPos)
          ctx.stroke()
        }

        // 東の壁
        if (cell.walls.east) {
          const style = getWallStyle(cell.walls.east.type)
          ctx.strokeStyle = style.color
          ctx.lineWidth = style.lineWidth
          setLinePattern(ctx, style.pattern)
          
          ctx.beginPath()
          ctx.moveTo(xPos + cellSize, yPos)
          ctx.lineTo(xPos + cellSize, yPos + cellSize)
          ctx.stroke()
        }

        // 南の壁
        if (cell.walls.south) {
          const style = getWallStyle(cell.walls.south.type)
          ctx.strokeStyle = style.color
          ctx.lineWidth = style.lineWidth
          setLinePattern(ctx, style.pattern)
          
          ctx.beginPath()
          ctx.moveTo(xPos, yPos + cellSize)
          ctx.lineTo(xPos + cellSize, yPos + cellSize)
          ctx.stroke()
        }

        // 西の壁
        if (cell.walls.west) {
          const style = getWallStyle(cell.walls.west.type)
          ctx.strokeStyle = style.color
          ctx.lineWidth = style.lineWidth
          setLinePattern(ctx, style.pattern)
          
          ctx.beginPath()
          ctx.moveTo(xPos, yPos)
          ctx.lineTo(xPos, yPos + cellSize)
          ctx.stroke()
        }
      }
    }
    
    // 線のパターンをリセット
    ctx.setLineDash([])
  }, [floor, cellSize])

  const drawDragPreview = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!isDragging || !dragStart || !dragEnd) return

    // 壁レイヤーでのドラッグプレビュー
    if (selectedLayer === 'walls' && dragStartPixel && dragEndPixel) {
      // スナップポイントを強調表示（開始点と終了点）
      ctx.fillStyle = '#ff0000' // 赤色
      const snapPointSize = 6
      
      // 開始点のスナップポイント
      ctx.fillRect(
        dragStartPixel.x - snapPointSize / 2,
        dragStartPixel.y - snapPointSize / 2,
        snapPointSize,
        snapPointSize
      )
      
      // 終了点のスナップポイント
      ctx.fillRect(
        dragEndPixel.x - snapPointSize / 2,
        dragEndPixel.y - snapPointSize / 2,
        snapPointSize,
        snapPointSize
      )
      
      // デバッグ情報：境界線座標とセル座標を表示
      ctx.fillStyle = '#ffffff'
      ctx.font = '12px Arial'
      ctx.fillText(`境界線: ${dragStartPixel.x}, ${dragStartPixel.y}`, dragStartPixel.x + 10, dragStartPixel.y - 10)
      ctx.fillText(`セル: ${dragStart?.x}, ${dragStart?.y}`, dragStartPixel.x + 10, dragStartPixel.y + 5)
      if (dragEnd && (dragEnd.x !== dragStart?.x || dragEnd.y !== dragStart?.y)) {
        ctx.fillText(`→ セル: ${dragEnd.x}, ${dragEnd.y}`, dragEndPixel.x + 10, dragEndPixel.y + 5)
      }

      // ドラッグ線を描画（境界線から境界線へ）
      ctx.strokeStyle = '#ffff00' // 黄色の補助線
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5]) // 破線
      
      ctx.beginPath()
      ctx.moveTo(dragStartPixel.x, dragStartPixel.y)
      ctx.lineTo(dragEndPixel.x, dragEndPixel.y)
      ctx.stroke()
      
      // 実際に配置される壁のプレビューを描画
      const previewUpdates = generateWallsAlongLine(dragStart, dragEnd, selectedWallType, isShiftPressed, floor)
      
      // 削除モードと配置モードで色を変える
      ctx.strokeStyle = isShiftPressed ? '#ff6666' : '#66ff66' // 削除=赤、配置=緑
      ctx.lineWidth = 3
      ctx.setLineDash([3, 3])
      
      for (const update of previewUpdates) {
        const { position, cell } = update
        const xPos = position.x * cellSize
        const yPos = position.y * cellSize
        
        if (cell.walls?.north) {
          ctx.beginPath()
          ctx.moveTo(xPos, yPos)
          ctx.lineTo(xPos + cellSize, yPos)
          ctx.stroke()
        }
        if (cell.walls?.east) {
          ctx.beginPath()
          ctx.moveTo(xPos + cellSize, yPos)
          ctx.lineTo(xPos + cellSize, yPos + cellSize)
          ctx.stroke()
        }
        if (cell.walls?.south) {
          ctx.beginPath()
          ctx.moveTo(xPos, yPos + cellSize)
          ctx.lineTo(xPos + cellSize, yPos + cellSize)
          ctx.stroke()
        }
        if (cell.walls?.west) {
          ctx.beginPath()
          ctx.moveTo(xPos, yPos)
          ctx.lineTo(xPos, yPos + cellSize)
          ctx.stroke()
        }
      }
    }

    // 床レイヤーでのドラッグプレビュー
    if (selectedLayer === 'floor') {
      // ドラッグ線を描画（セル中央から中央へ）
      ctx.strokeStyle = isShiftPressed ? '#ff8888' : '#88ff88'  // Shiftキーで薄い赤、通常は薄い緑
      ctx.lineWidth = 3
      ctx.setLineDash([8, 4])  // 破線
      ctx.beginPath()
      ctx.moveTo(
        dragStart.x * cellSize + cellSize / 2,
        dragStart.y * cellSize + cellSize / 2
      )
      ctx.lineTo(
        dragEnd.x * cellSize + cellSize / 2,
        dragEnd.y * cellSize + cellSize / 2
      )
      ctx.stroke()
      
      // 実際に変更される床のプレビューを描画
      const previewUpdates = generateFloorsAlongLine(dragStart, dragEnd, selectedFloorType, isShiftPressed)
      
      // 各セルの境界線を描画
      ctx.strokeStyle = isShiftPressed ? '#ff4444' : '#44ff44' // 削除=赤、配置=緑
      ctx.lineWidth = 2
      ctx.setLineDash([4, 4])
      
      for (const update of previewUpdates) {
        const { position } = update
        const xPos = position.x * cellSize
        const yPos = position.y * cellSize
        
        // セルの境界線を描画
        ctx.strokeRect(xPos + 2, yPos + 2, cellSize - 4, cellSize - 4)
        
        // セル中央に床タイプの色を表示
        if (cellSize > 16) {
          const floorType = isShiftPressed ? 'normal' : selectedFloorType
          let previewColor = '#666'
          
          switch (floorType) {
            case 'normal': previewColor = '#888'; break
            case 'damage': previewColor = '#c44'; break
            case 'slippery': previewColor = '#48c'; break
            case 'pit': previewColor = '#222'; break
            case 'warp': previewColor = '#c84'; break
          }
          
          ctx.fillStyle = previewColor
          ctx.globalAlpha = 0.7
          const margin = cellSize * 0.25
          ctx.fillRect(
            xPos + margin,
            yPos + margin,
            cellSize - margin * 2,
            cellSize - margin * 2
          )
          ctx.globalAlpha = 1
        }
      }
    }
    
    // 線のパターンをリセット
    ctx.setLineDash([])
  }, [isDragging, dragStartPixel, dragEndPixel, dragStart, dragEnd, selectedLayer, selectedWallType, selectedFloorType, isShiftPressed, cellSize])

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

  const drawRectanglePreview = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!isDrawingRectangle || !rectangleStart || !rectangleEnd) return

    const startX = Math.min(rectangleStart.x, rectangleEnd.x)
    const startY = Math.min(rectangleStart.y, rectangleEnd.y)
    const endX = Math.max(rectangleStart.x, rectangleEnd.x)
    const endY = Math.max(rectangleStart.y, rectangleEnd.y)

    // 矩形の枠線を描画
    ctx.strokeStyle = '#ffff00'  // 黄色
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])  // 破線
    ctx.strokeRect(
      startX * cellSize,
      startY * cellSize,
      (endX - startX + 1) * cellSize,
      (endY - startY + 1) * cellSize
    )
    ctx.setLineDash([])  // 破線を元に戻す
    ctx.lineWidth = 1
  }, [isDrawingRectangle, rectangleStart, rectangleEnd, cellSize])

  const drawSelectedCell = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!selectedCell) return

    // 選択されたセルの枠線を描画
    ctx.strokeStyle = '#00ff00'  // 緑色
    ctx.lineWidth = 3
    ctx.strokeRect(
      selectedCell.x * cellSize,
      selectedCell.y * cellSize,
      cellSize,
      cellSize
    )
    ctx.lineWidth = 1
  }, [selectedCell, cellSize])

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

    // レイヤーの表示状態に応じて描画
    const { layerVisibility } = editorState
    
    if (layerVisibility.floor) {
      drawFloor(ctx)
    }
    if (layerVisibility.walls) {
      drawWalls(ctx)
    }
    if (layerVisibility.events) {
      drawEvents(ctx)
    }
    
    // 矩形プレビューを描画
    drawRectanglePreview(ctx)
    
    // ドラッグプレビューを描画
    drawDragPreview(ctx)
    
    // 選択されたセルを描画
    drawSelectedCell(ctx)
    
    drawGrid(ctx)
  }, [floor, cellSize, drawFloor, drawWalls, drawEvents, drawGrid, drawRectanglePreview, drawDragPreview, drawSelectedCell, editorState])

  const getCellPosition = useCallback((event: React.MouseEvent): Position | null => {
    const canvas = canvasRef.current
    if (!canvas || !floor) return null

    const rect = canvas.getBoundingClientRect()
    const rawX = event.clientX - rect.left
    const rawY = event.clientY - rect.top
    const x = Math.floor(rawX / cellSize)
    const y = Math.floor(rawY / cellSize)

    if (x >= 0 && x < floor.width && y >= 0 && y < floor.height) {
      return { x, y }
    }

    return null
  }, [cellSize, floor])

  const handleCanvasClick = useCallback((event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()

    const position = getCellPosition(event)
    if (!position || !floor) return

    const currentCell = floor.cells[position.y][position.x]

    // ドラッグ操作中、または壁レイヤーのペンツール（handleMouseUpで処理済み）、または床レイヤーのペンツール（handleMouseUpで処理済み）はクリック処理をスキップ
    if (isDragging || isActuallyDragging || (selectedLayer === 'walls' && selectedTool === 'pen') || (selectedLayer === 'floor' && selectedTool === 'pen')) {
      return
    }

    // アイドロッパーツールの処理
    if (selectedTool === 'eyedropper') {
      const capturedData = {
        floor: {
          type: currentCell.floor.type,
          passable: currentCell.floor.passable
        },
        walls: {
          north: currentCell.walls.north,
          east: currentCell.walls.east,
          south: currentCell.walls.south,
          west: currentCell.walls.west
        },
        hasEvents: currentCell.events.length > 0
      }
      
      dispatch(setCapturedCellData(capturedData))
      console.log('セル状態をキャプチャしました:', capturedData)
      return
    }

    // 選択ツールの処理
    if (selectedTool === 'select') {
      setSelectedCell(position)
      return
    }

    // 消しゴムツールの処理
    if (selectedTool === 'eraser') {
      if (selectedLayer === 'walls') {
        // 壁を消去：クリックした位置の最も近い壁を削除
        const canvas = canvasRef.current!
        const rect = canvas.getBoundingClientRect()
        const mouseX = event.clientX - rect.left
        const mouseY = event.clientY - rect.top
        
        const wallDirection = getWallDirectionFromClick(
          mouseX, mouseY, position.x, position.y, cellSize
        )
        
        // 現在のセルの壁状態をコピー
        const walls = {
          north: currentCell.walls.north,
          east: currentCell.walls.east,
          south: currentCell.walls.south,
          west: currentCell.walls.west,
        }
        
        // 判定した方向の壁を削除
        walls[wallDirection] = null
        
        dispatch(updateCell({
          floorIndex: currentFloor,
          position,
          cell: { walls }
        }))
      } else if (selectedLayer === 'events') {
        // イベントを消去
        dispatch(updateCell({
          floorIndex: currentFloor,
          position,
          cell: { events: [] }
        }))
      } else if (selectedLayer === 'floor') {
        // 床を通常床にリセット
        dispatch(updateCell({
          floorIndex: currentFloor,
          position,
          cell: {
            floor: {
              type: 'normal',
              passable: true
            }
          }
        }))
      }
      return
    }

    // 矩形ツールの処理
    if (selectedTool === 'rectangle') {
      if (!isDrawingRectangle) {
        // 最初のクリック：開始点を設定
        setRectangleStart(position)
        setRectangleEnd(position)
        setIsDrawingRectangle(true)
      } else {
        // 二回目のクリック：終了点を設定して矩形を描画
        
        if (rectangleStart) {
          const startX = Math.min(rectangleStart.x, position.x)
          const startY = Math.min(rectangleStart.y, position.y)
          const endX = Math.max(rectangleStart.x, position.x)
          const endY = Math.max(rectangleStart.y, position.y)
          
          // 矩形範囲内の全セルの更新データを準備
          const updates = []
          for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
              const cellPosition = { x, y }
              const cell = floor.cells[y][x]
              
              // Shift+矩形ツールの場合は削除モード
              if (event.shiftKey) {
                if (selectedLayer === 'floor') {
                  // 床を通常床にリセット
                  updates.push({
                    position: cellPosition,
                    cell: {
                      floor: {
                        type: 'normal' as const,
                        passable: true
                      }
                    }
                  })
                } else if (selectedLayer === 'walls') {
                  // 全ての壁を削除
                  updates.push({
                    position: cellPosition,
                    cell: {
                      walls: {
                        north: null,
                        east: null,
                        south: null,
                        west: null,
                      }
                    }
                  })
                } else if (selectedLayer === 'events') {
                  // イベントを消去
                  updates.push({
                    position: cellPosition,
                    cell: { events: [] }
                  })
                }
              } else {
                // 通常の矩形描画ツール
                if (selectedLayer === 'floor') {
                  let newFloorData
                  if (capturedCellData) {
                    newFloorData = {
                      type: capturedCellData.floor.type,
                      passable: capturedCellData.floor.passable
                    }
                  } else {
                    newFloorData = {
                      type: selectedFloorType,
                      passable: getPassableForFloorType(selectedFloorType)
                    }
                  }
                  updates.push({
                    position: cellPosition,
                    cell: { floor: newFloorData }
                  })
                } else if (selectedLayer === 'walls') {
                  let walls
                  if (capturedCellData) {
                    walls = {
                      north: capturedCellData.walls.north,
                      east: capturedCellData.walls.east,
                      south: capturedCellData.walls.south,
                      west: capturedCellData.walls.west,
                    }
                  } else {
                    const hasWall = cell.walls.north !== null
                    const wall = hasWall ? null : {
                      type: selectedWallType,
                      transparent: getTransparentForWallType(selectedWallType),
                    }
                    walls = {
                      north: wall,
                      east: wall,
                      south: wall,
                      west: wall,
                    }
                  }
                  updates.push({
                    position: cellPosition,
                    cell: {
                      walls
                    }
                  })
                } else if (selectedLayer === 'events') {
                  const hasEvent = cell.events.length > 0
                  const newEvents = hasEvent ? [] : [{
                    id: crypto.randomUUID(),
                    type: 'treasure' as const,
                    name: '宝箱',
                    description: '基本的な宝箱',
                    position: cellPosition,
                    appearance: {
                      visible: true,
                      color: '#ffd700',
                      icon: 'treasure'
                    },
                    trigger: {
                      type: 'interact' as const,
                      conditions: [],
                      repeatPolicy: {
                        type: 'once' as const
                      }
                    },
                    actions: [{
                      id: crypto.randomUUID(),
                      type: 'treasure' as const,
                      params: {
                        items: [{ id: 'gold', count: 100 }],
                        message: '金貨を100枚見つけた！'
                      }
                    }],
                    flags: {},
                    enabled: true,
                    priority: 1,
                    metadata: {
                      created: new Date().toISOString(),
                      modified: new Date().toISOString(),
                      version: 1
                    }
                  }]
                  updates.push({
                    position: cellPosition,
                    cell: { events: newEvents }
                  })
                }
              }
            }
          }
          
          // バッチで更新を実行
          if (updates.length > 0) {
            dispatch(updateCells({
              floorIndex: currentFloor,
              updates
            }))
          }
        }
        
        // 矩形描画完了後、状態をリセット
        setRectangleStart(null)
        setRectangleEnd(null)
        setIsDrawingRectangle(false)
      }
      return
    }

    if (selectedLayer === 'floor') {
      if (selectedTool === 'pen') {
        // 床の編集：キャプチャされたデータがあればそれを使用、なければ選択された床タイプを適用
        let newFloorData
        if (capturedCellData) {
          newFloorData = {
            type: capturedCellData.floor.type,
            passable: capturedCellData.floor.passable
          }
        } else {
          newFloorData = {
            type: selectedFloorType,
            passable: getPassableForFloorType(selectedFloorType)
          }
        }

        dispatch(updateCell({
          floorIndex: currentFloor,
          position,
          cell: {
            floor: newFloorData
          }
        }))
      } else if (selectedTool === 'fill') {
        // 塗りつぶしツール：同じタイプの床を一括変更
        const targetPassable = currentCell.floor.passable
        const targetType = currentCell.floor.type
        
        // キャプチャされたデータがあればそれを使用、なければ選択された床タイプを適用
        let newFloorDataForFill
        if (capturedCellData) {
          newFloorDataForFill = {
            type: capturedCellData.floor.type,
            passable: capturedCellData.floor.passable
          }
        } else {
          newFloorDataForFill = {
            type: selectedFloorType,
            passable: getPassableForFloorType(selectedFloorType)
          }
        }
        
        // 同じタイプ・通行可否のセルを全て検索してバッチ更新データを準備
        const updates = []
        for (let y = 0; y < floor.height; y++) {
          for (let x = 0; x < floor.width; x++) {
            const cell = floor.cells[y][x]
            if (cell.floor.passable === targetPassable && cell.floor.type === targetType) {
              const newFloorData = newFloorDataForFill
              updates.push({
                position: { x, y },
                cell: { floor: newFloorData }
              })
            }
          }
        }
        
        // バッチで更新を実行
        if (updates.length > 0) {
          dispatch(updateCells({
            floorIndex: currentFloor,
            updates
          }))
        }
      }
    } else if (selectedLayer === 'walls') {
      if (selectedTool === 'pen') {
        // 壁の編集：キャプチャされたデータがあればそれを使用、なければ選択された壁タイプを適用
        let walls
        if (capturedCellData) {
          walls = {
            north: capturedCellData.walls.north,
            east: capturedCellData.walls.east,
            south: capturedCellData.walls.south,
            west: capturedCellData.walls.west,
          }
        } else {
          // クリック位置から壁方向を判定
          const canvas = canvasRef.current!
          const rect = canvas.getBoundingClientRect()
          const mouseX = event.clientX - rect.left
          const mouseY = event.clientY - rect.top
          
          const wallDirection = getWallDirectionFromClick(
            mouseX, mouseY, position.x, position.y, cellSize
          )
          
          // 現在のセルの壁状態をコピー
          walls = {
            north: currentCell.walls.north,
            east: currentCell.walls.east,
            south: currentCell.walls.south,
            west: currentCell.walls.west,
          }
          
          // Shiftキーが押されている場合は削除、そうでなければ追加
          if (event.shiftKey) {
            // Shiftキーが押されている場合は強制的に削除
            walls[wallDirection] = null
          } else {
            // 通常クリックは常に壁を追加
            walls[wallDirection] = {
              type: selectedWallType,
              transparent: getTransparentForWallType(selectedWallType),
            }
          }
        }

        dispatch(updateCell({
          floorIndex: currentFloor,
          position,
          cell: {
            walls
          }
        }))
      }
    } else if (selectedLayer === 'events') {
      if (selectedTool === 'pen') {
        // イベントの追加/削除
        const hasEvent = currentCell.events.length > 0
        const newEvents = hasEvent ? [] : [{
          id: crypto.randomUUID(),
          type: 'treasure' as const,
          name: '宝箱',
          description: '基本的な宝箱',
          position: position,
          appearance: {
            visible: true,
            color: '#ffd700',
            icon: 'treasure'
          },
          trigger: {
            type: 'interact' as const,
            conditions: [],
            repeatPolicy: {
              type: 'once' as const
            }
          },
          actions: [{
            id: crypto.randomUUID(),
            type: 'treasure' as const,
            params: {
              items: [{ id: 'gold', count: 100 }],
              message: '金貨を100枚見つけた！'
            }
          }],
          flags: {},
          enabled: true,
          priority: 1,
          metadata: {
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            version: 1
          }
        }]

        dispatch(updateCell({
          floorIndex: currentFloor,
          position,
          cell: {
            events: newEvents,
          }
        }))
      }
    }
  }, [getCellPosition, floor, selectedLayer, selectedTool, selectedFloorType, selectedWallType, dispatch, currentFloor, isDrawingRectangle, rectangleStart, isDragging, capturedCellData])

  const handleCanvasMouseMove = useCallback((event: React.MouseEvent) => {
    if (selectedTool === 'rectangle' && isDrawingRectangle && rectangleStart) {
      const position = getCellPosition(event)
      if (position) {
        setRectangleEnd(position)
      }
    }
    
    // 壁ドラッグの処理
    if (dragStartMouse && dragStart && selectedLayer === 'walls' && selectedTool === 'pen') {
      const canvas = canvasRef.current
      if (!canvas) return
      
      const rect = canvas.getBoundingClientRect()
      const mouseX = event.clientX - rect.left
      const mouseY = event.clientY - rect.top
      
      // ドラッグ距離を計算
      const dragDistance = Math.sqrt(
        Math.pow(mouseX - dragStartMouse.x, 2) + 
        Math.pow(mouseY - dragStartMouse.y, 2)
      )
      
      // 閾値（5ピクセル）を超えた場合のみドラッグ開始
      const DRAG_THRESHOLD = 5
      if (dragDistance > DRAG_THRESHOLD && !isActuallyDragging) {
        setIsActuallyDragging(true)
        setIsDragging(true)
      }
      
      // 実際にドラッグ中の場合のみ更新
      if (isActuallyDragging) {
        // 境界線にスナップ
        const boundaryPos = getWallBoundaryPosition(mouseX, mouseY, cellSize)
        
        // 境界線座標からセル座標を直接計算
        const endCell = convertBoundaryToCell(boundaryPos.x, boundaryPos.y, cellSize)
        setDragEnd(endCell)
        setDragEndPixel(boundaryPos)
      }
    }
    
    // 床ドラッグの処理
    if (dragStartMouse && dragStart && selectedLayer === 'floor' && selectedTool === 'pen') {
      const canvas = canvasRef.current
      if (!canvas) return
      
      const rect = canvas.getBoundingClientRect()
      const mouseX = event.clientX - rect.left
      const mouseY = event.clientY - rect.top
      
      // ドラッグ距離を計算
      const dragDistance = Math.sqrt(
        Math.pow(mouseX - dragStartMouse.x, 2) + 
        Math.pow(mouseY - dragStartMouse.y, 2)
      )
      
      // 閾値（5ピクセル）を超えた場合のみドラッグ開始
      const DRAG_THRESHOLD = 5
      if (dragDistance > DRAG_THRESHOLD && !isActuallyDragging) {
        setIsActuallyDragging(true)
        setIsDragging(true)
      }
      
      // 実際にドラッグ中の場合のみ更新
      if (isActuallyDragging) {
        // 床ドラッグはセル単位でスナップ
        const position = getCellPosition(event)
        if (position) {
          setDragEnd(position)
        }
      }
    }
  }, [selectedTool, isDrawingRectangle, rectangleStart, getCellPosition, isDragging, dragStart, selectedLayer, dragStartMouse, isActuallyDragging, cellSize])

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (selectedLayer === 'walls' && selectedTool === 'pen') {
      const canvas = canvasRef.current
      if (!canvas) return
      
      const rect = canvas.getBoundingClientRect()
      const mouseX = event.clientX - rect.left
      const mouseY = event.clientY - rect.top
      
      // マウス座標を保存してドラッグ開始準備
      setDragStartMouse({ x: mouseX, y: mouseY })
      setIsShiftPressed(event.shiftKey)
      setIsActuallyDragging(false)
      
      // 世界樹の迷宮スタイル：最も近い壁境界線にスナップ
      const boundaryPos = getWallBoundaryPosition(mouseX, mouseY, cellSize)
      
      // 境界線座標からセル座標を直接計算
      const startCell = convertBoundaryToCell(boundaryPos.x, boundaryPos.y, cellSize)
      setDragStart(startCell)
      setDragEnd(startCell)
      setDragStartPixel(boundaryPos)
      setDragEndPixel(boundaryPos)
    } else if (selectedLayer === 'floor' && selectedTool === 'pen') {
      // 床ドラッグの処理
      const position = getCellPosition(event)
      if (!position) return
      
      // マウス座標を保存してドラッグ開始準備
      const canvas = canvasRef.current
      if (!canvas) return
      
      const rect = canvas.getBoundingClientRect()
      const mouseX = event.clientX - rect.left
      const mouseY = event.clientY - rect.top
      
      setDragStartMouse({ x: mouseX, y: mouseY })
      setIsShiftPressed(event.shiftKey)
      setIsActuallyDragging(false)
      
      // 床ドラッグはセル単位でスナップ
      setDragStart(position)
      setDragEnd(position)
    }
  }, [selectedLayer, selectedTool, getCellPosition, cellSize])

  const handleMouseUp = useCallback((_event: React.MouseEvent) => {
    // 壁レイヤーのペンツールの処理
    if (dragStartMouse && dragStart && selectedLayer === 'walls' && selectedTool === 'pen') {
      if (isActuallyDragging && isDragging && dragEnd) {
        // 実際にドラッグが行われた場合：壁を描画
        const wallUpdates = generateWallsAlongLine(dragStart, dragEnd, selectedWallType, isShiftPressed, floor)
        if (wallUpdates.length > 0) {
          dispatch(updateCells({
            floorIndex: currentFloor,
            updates: wallUpdates
          }))
        }
      } else {
        // ドラッグしなかった場合：クリック処理として壁の切り替え
        if (dragStart && floor && dragStartPixel) {
          const currentCell = floor.cells[dragStart.y][dragStart.x]
          
          // 境界線座標から壁方向を判定
          const wallDirection = getWallDirectionFromBoundary(dragStartPixel.x, dragStartPixel.y, dragStart.x, dragStart.y, cellSize)
          
          // 現在のセルの壁状態をコピー
          const walls = {
            north: currentCell.walls.north,
            east: currentCell.walls.east,
            south: currentCell.walls.south,
            west: currentCell.walls.west,
          }
          
          // Shiftキーが押されている場合は削除、そうでなければ追加
          if (isShiftPressed) {
            // Shiftキーが押されている場合は強制的に削除
            walls[wallDirection] = null
          } else {
            // 通常クリックは常に壁を追加
            walls[wallDirection] = {
              type: selectedWallType,
              transparent: getTransparentForWallType(selectedWallType),
            }
          }

          dispatch(updateCell({
            floorIndex: currentFloor,
            position: dragStart,
            cell: { walls }
          }))
        }
      }
    }
    
    // 床レイヤーのペンツールの処理
    if (dragStartMouse && dragStart && selectedLayer === 'floor' && selectedTool === 'pen') {
      if (isActuallyDragging && isDragging && dragEnd) {
        // 実際にドラッグが行われた場合：床を描画
        const floorUpdates = generateFloorsAlongLine(dragStart, dragEnd, selectedFloorType, isShiftPressed)
        if (floorUpdates.length > 0) {
          dispatch(updateCells({
            floorIndex: currentFloor,
            updates: floorUpdates
          }))
        }
      } else {
        // ドラッグしなかった場合：クリック処理として床の変更
        if (dragStart && floor) {
          // 床の編集：キャプチャされたデータがあればそれを使用、なければ選択された床タイプを適用
          let newFloorData
          if (capturedCellData) {
            newFloorData = {
              type: capturedCellData.floor.type,
              passable: capturedCellData.floor.passable
            }
          } else if (isShiftPressed) {
            // Shiftキーで通常床にリセット
            newFloorData = {
              type: 'normal' as const,
              passable: true
            }
          } else {
            newFloorData = {
              type: selectedFloorType,
              passable: getPassableForFloorType(selectedFloorType)
            }
          }

          dispatch(updateCell({
            floorIndex: currentFloor,
            position: dragStart,
            cell: { floor: newFloorData }
          }))
        }
      }
    }
    
    // 状態をリセット
    setIsDragging(false)
    setIsActuallyDragging(false)
    setDragStart(null)
    setDragEnd(null)
    setDragStartPixel(null)
    setDragEndPixel(null)
    setDragStartMouse(null)
    setIsShiftPressed(false)
  }, [isDragging, isActuallyDragging, dragStart, dragEnd, dragStartMouse, selectedLayer, selectedTool, selectedWallType, selectedFloorType, isShiftPressed, dispatch, currentFloor, getCellPosition, floor, cellSize, capturedCellData])

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
        overflow: 'visible',
        cursor: selectedTool === 'pen' ? 'crosshair' : 
                selectedTool === 'rectangle' ? 'cell' : 
                selectedTool === 'eyedropper' ? 'grab' : 
                selectedTool === 'select' ? 'pointer' : 'default',
        position: 'relative',
        userSelect: 'none',
      }}
    >
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
        }}
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