import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react'
import { Box } from '@mui/material'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../store'
import { updateCell, updateCells, placeTemplate, addDecorationToCell } from '../store/mapSlice'
import { setCapturedCellData, setHoveredCellInfo, clearHoveredCellInfo, setHoveredCellPosition, clearHoveredCellPosition, setHoveredWallInfo, clearHoveredWallInfo, setTemplatePreviewPosition, setSelectionStart, setSelectionEnd, confirmSelection, setViewCenter, openEventEditDialog } from '../store/editorSlice'
import { rotateTemplate as rotateTemplateUtil } from '../utils/templateUtils'
import { Position, WallType, DecorationType, Decoration, EventType } from '../types/map'


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

// 床タイプごとのハイライト色を取得する関数
const getFloorHighlightColor = (floorType: string, isShiftPressed: boolean) => {
  if (isShiftPressed) {
    return { fill: 'rgba(255, 100, 100, 0.4)', stroke: '#ff6464' } // 削除モード（赤）
  }
  
  switch (floorType) {
    case 'normal': return { fill: 'rgba(100, 150, 255, 0.3)', stroke: '#6496ff' } // 青
    case 'damage': return { fill: 'rgba(255, 100, 100, 0.3)', stroke: '#ff6464' } // 赤
    case 'slippery': return { fill: 'rgba(100, 255, 255, 0.3)', stroke: '#64ffff' } // シアン
    case 'pit': return { fill: 'rgba(100, 100, 100, 0.3)', stroke: '#646464' } // グレー
    case 'warp': return { fill: 'rgba(255, 100, 255, 0.3)', stroke: '#ff64ff' } // マゼンタ
    default: return { fill: 'rgba(100, 150, 255, 0.3)', stroke: '#6496ff' } // デフォルト青
  }
}

// 壁タイプごとのハイライト色を取得する関数
const getWallHighlightColor = (wallType: string, isShiftPressed: boolean) => {
  if (isShiftPressed) {
    return { fill: 'rgba(255, 100, 100, 0.4)', stroke: '#ff6464' } // 削除モード（赤）
  }
  
  switch (wallType) {
    case 'normal': return { fill: 'rgba(255, 200, 100, 0.4)', stroke: '#ffc864' } // オレンジ
    case 'door': return { fill: 'rgba(139, 69, 19, 0.4)', stroke: '#8b4513' } // 茶色
    case 'locked_door': return { fill: 'rgba(255, 215, 0, 0.4)', stroke: '#ffd700' } // 金色
    case 'hidden_door': return { fill: 'rgba(136, 136, 136, 0.4)', stroke: '#888888' } // グレー
    case 'breakable': return { fill: 'rgba(255, 107, 53, 0.4)', stroke: '#ff6b35' } // オレンジ赤
    case 'oneway': return { fill: 'rgba(0, 206, 209, 0.4)', stroke: '#00ced1' } // ターコイズ
    case 'invisible': return { fill: 'rgba(102, 102, 102, 0.4)', stroke: '#666666' } // 暗いグレー
    case 'event': return { fill: 'rgba(255, 20, 147, 0.4)', stroke: '#ff1493' } // ピンク
    default: return { fill: 'rgba(255, 200, 100, 0.4)', stroke: '#ffc864' } // デフォルトオレンジ
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

// 装飾タイプごとの色を取得する関数
const getDecorationColor = (decorationType: DecorationType) => {
  switch (decorationType) {
    case 'furniture': return '#8b4513'
    case 'statue': return '#a0a0a0'
    case 'plant': return '#228b22'
    case 'torch': return '#ff6347'
    case 'pillar': return '#d2b48c'
    case 'rug': return '#dc143c'
    case 'painting': return '#4169e1'
    case 'crystal': return '#9370db'
    case 'rubble': return '#696969'
    default: return '#8b4513'
  }
}

// 装飾タイプごとのアイコンを取得する関数
const getDecorationIcon = (decorationType: DecorationType) => {
  switch (decorationType) {
    case 'furniture': return '🪑'
    case 'statue': return '🗿'
    case 'plant': return '🌿'
    case 'torch': return '🔥'
    case 'pillar': return '🏛️'
    case 'rug': return '🧿'
    case 'painting': return '🖼️'
    case 'crystal': return '💎'
    case 'rubble': return '🪨'
    default: return '🪑'
  }
}

// 境界線座標からセル座標に変換する関数
const convertBoundaryToCell = (boundaryX: number, boundaryY: number, cellSize: number) => {
  // セルサイズを整数に丸めて正確な計算を保証
  const roundedCellSize = Math.round(cellSize)
  
  // 境界線座標を正確なセル座標に変換
  // 垂直境界線：境界線が完全にセル境界上にある場合は右側のセルを選択
  // 水平境界線：境界線が完全にセル境界上にある場合は下側のセルを選択
  
  const exactCellX = boundaryX / roundedCellSize
  const exactCellY = boundaryY / roundedCellSize
  
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
  // セルサイズを整数に丸めて正確な計算を保証
  const roundedCellSize = Math.round(cellSize)
  
  // セル内の相対位置
  const relativeX = (mouseX - cellX * roundedCellSize) / roundedCellSize
  const relativeY = (mouseY - cellY * roundedCellSize) / roundedCellSize
  
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
  // セルサイズを整数に丸めて正確な計算を保証
  const roundedCellSize = Math.round(cellSize)
  
  // セルの境界座標を計算
  const cellLeft = cellX * roundedCellSize
  const cellRight = (cellX + 1) * roundedCellSize
  const cellTop = cellY * roundedCellSize
  const cellBottom = (cellY + 1) * roundedCellSize
  
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
  // セルサイズを整数に丸めて正確な計算を保証
  const roundedCellSize = Math.round(cellSize)
  
  // すべての可能な境界線との距離を計算
  const cellX = Math.floor(mouseX / roundedCellSize)
  const cellY = Math.floor(mouseY / roundedCellSize)
  
  // 各境界線の座標を整数で計算
  const boundaries = [
    // 垂直境界線
    { x: Math.round(cellX * roundedCellSize), y: mouseY, type: 'vertical' as const, dist: Math.abs(mouseX - cellX * roundedCellSize) },
    { x: Math.round((cellX + 1) * roundedCellSize), y: mouseY, type: 'vertical' as const, dist: Math.abs(mouseX - (cellX + 1) * roundedCellSize) },
    // 水平境界線
    { x: mouseX, y: Math.round(cellY * roundedCellSize), type: 'horizontal' as const, dist: Math.abs(mouseY - cellY * roundedCellSize) },
    { x: mouseX, y: Math.round((cellY + 1) * roundedCellSize), type: 'horizontal' as const, dist: Math.abs(mouseY - (cellY + 1) * roundedCellSize) }
  ]
  
  // 最も近い境界線を選択
  const closest = boundaries.reduce((min, current) => 
    current.dist < min.dist ? current : min
  )
  
  return {
    x: Math.round(closest.x),
    y: Math.round(closest.y),
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
  
  
  // ドラッグ描画用の状態管理
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<Position | null>(null)
  const [dragEnd, setDragEnd] = useState<Position | null>(null)
  // 世界樹の迷宮スタイル用：実際のピクセル座標での開始・終了位置
  const [dragStartPixel, setDragStartPixel] = useState<{ x: number; y: number } | null>(null)
  const [dragEndPixel, setDragEndPixel] = useState<{ x: number; y: number } | null>(null)
  // ドラッグ開始点（マウス座標）
  const [dragStartMouse, setDragStartMouse] = useState<{ x: number; y: number } | null>(null)
  // 実際にドラッグが開始されたかどうかのフラグ
  const [isActuallyDragging, setIsActuallyDragging] = useState(false)
  
  const dungeon = useSelector((state: RootState) => state.map.dungeon)
  const editorState = useSelector((state: RootState) => state.editor)
  const { currentFloor, selectedTool, selectedLayer, selectedFloorType, selectedWallType, selectedDecorationType, selectedEventType, capturedCellData, hoveredCellPosition, hoveredWallInfo, isShiftPressed, zoom, gridVisible, selectedTemplate, templatePreviewPosition, templateRotation, selectionMode, selectionStart, selectionEnd, selectionConfirmed, selectedEventId, highlightedEventId } = editorState

  // セルサイズを整数に丸めて座標のズレを防ぐ（useMemoで最適化）
  const cellSize = useMemo(() => Math.round(32 * zoom), [zoom])
  const floor = dungeon?.floors[currentFloor]

  // マウス位置から最も近い壁を検出する関数
  const getClosestWallFromMouse = useCallback((event: React.MouseEvent): { position: Position; direction: 'north' | 'east' | 'south' | 'west' } | null => {
    const canvas = canvasRef.current
    if (!canvas || !floor) return null

    const rect = canvas.getBoundingClientRect()
    const mouseX = event.clientX - rect.left
    const mouseY = event.clientY - rect.top
    
    // セル位置を取得
    const roundedCellSize = Math.round(cellSize)
    const cellX = Math.floor(mouseX / roundedCellSize)
    const cellY = Math.floor(mouseY / roundedCellSize)

    if (cellX < 0 || cellX >= floor.width || cellY < 0 || cellY >= floor.height) {
      return null
    }

    // セル内の相対位置
    const relativeX = (mouseX - cellX * roundedCellSize) / roundedCellSize
    const relativeY = (mouseY - cellY * roundedCellSize) / roundedCellSize

    // セルの中心からの距離
    const centerX = 0.5
    const centerY = 0.5
    const dx = relativeX - centerX
    const dy = relativeY - centerY

    // どの辺に最も近いかを判定
    let direction: 'north' | 'east' | 'south' | 'west'
    if (Math.abs(dx) > Math.abs(dy)) {
      direction = dx > 0 ? 'east' : 'west'
    } else {
      direction = dy > 0 ? 'south' : 'north'
    }

    return { position: { x: cellX, y: cellY }, direction }
  }, [cellSize, floor])

  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!gridVisible || !floor) return

    // アンチエイリアシングを無効化してシャープな線を描画
    ctx.imageSmoothingEnabled = false
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 1

    // 縦線 - 各線の位置を個別に計算してピクセル整合性を保つ
    for (let x = 0; x <= floor.width; x++) {
      // 累積誤差を避けるため、各線の位置を独立して計算し、ピクセル境界に合わせる
      const xPos = Math.round(x * cellSize) + 0.5
      ctx.beginPath()
      ctx.moveTo(xPos, 0)
      ctx.lineTo(xPos, floor.height * cellSize)
      ctx.stroke()
    }

    // 横線 - 各線の位置を個別に計算してピクセル整合性を保つ
    for (let y = 0; y <= floor.height; y++) {
      // 累積誤差を避けるため、各線の位置を独立して計算し、ピクセル境界に合わせる
      const yPos = Math.round(y * cellSize) + 0.5
      ctx.beginPath()
      ctx.moveTo(0, yPos)
      ctx.lineTo(floor.width * cellSize, yPos)
      ctx.stroke()
    }
    
    // アンチエイリアシングを元に戻す
    ctx.imageSmoothingEnabled = true
  }, [gridVisible, floor, cellSize])

  const drawFloor = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!floor) return

    for (let y = 0; y < floor.height; y++) {
      for (let x = 0; x < floor.width; x++) {
        const cell = floor.cells[y][x]
        // 座標を整数に丸めて正確な配置を保証
        const xPos = Math.round(x * cellSize)
        const yPos = Math.round(y * cellSize)

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
        // 床を整数座標とサイズで描画
        ctx.fillRect(xPos, yPos, Math.round(cellSize), Math.round(cellSize))

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

    // 壁描画時はアンチエイリアシングを無効化してシャープな線を描画
    ctx.imageSmoothingEnabled = false

    for (let y = 0; y < floor.height; y++) {
      for (let x = 0; x < floor.width; x++) {
        const cell = floor.cells[y][x]
        // 座標を整数に丸めて正確な配置を保証
        const xPos = Math.round(x * cellSize)
        const yPos = Math.round(y * cellSize)
        const roundedCellSize = Math.round(cellSize)

        // 北の壁
        if (cell.walls.north) {
          const style = getWallStyle(cell.walls.north.type)
          ctx.strokeStyle = style.color
          ctx.lineWidth = 2 // 線の太さを統一
          setLinePattern(ctx, style.pattern)
          
          ctx.beginPath()
          // 0.5ピクセル補正でシャープな線を描画
          ctx.moveTo(xPos + 0.5, yPos + 0.5)
          ctx.lineTo(xPos + roundedCellSize + 0.5, yPos + 0.5)
          ctx.stroke()
        }

        // 東の壁
        if (cell.walls.east) {
          const style = getWallStyle(cell.walls.east.type)
          ctx.strokeStyle = style.color
          ctx.lineWidth = 2 // 線の太さを統一
          setLinePattern(ctx, style.pattern)
          
          ctx.beginPath()
          // 0.5ピクセル補正でシャープな線を描画
          ctx.moveTo(xPos + roundedCellSize + 0.5, yPos + 0.5)
          ctx.lineTo(xPos + roundedCellSize + 0.5, yPos + roundedCellSize + 0.5)
          ctx.stroke()
        }

        // 南の壁
        if (cell.walls.south) {
          const style = getWallStyle(cell.walls.south.type)
          ctx.strokeStyle = style.color
          ctx.lineWidth = 2 // 線の太さを統一
          setLinePattern(ctx, style.pattern)
          
          ctx.beginPath()
          // 0.5ピクセル補正でシャープな線を描画
          ctx.moveTo(xPos + 0.5, yPos + roundedCellSize + 0.5)
          ctx.lineTo(xPos + roundedCellSize + 0.5, yPos + roundedCellSize + 0.5)
          ctx.stroke()
        }

        // 西の壁
        if (cell.walls.west) {
          const style = getWallStyle(cell.walls.west.type)
          ctx.strokeStyle = style.color
          ctx.lineWidth = 2 // 線の太さを統一
          setLinePattern(ctx, style.pattern)
          
          ctx.beginPath()
          // 0.5ピクセル補正でシャープな線を描画
          ctx.moveTo(xPos + 0.5, yPos + 0.5)
          ctx.lineTo(xPos + 0.5, yPos + roundedCellSize + 0.5)
          ctx.stroke()
        }
      }
    }
    
    // 線のパターンをリセット
    ctx.setLineDash([])
    // アンチエイリアシングを元に戻す
    ctx.imageSmoothingEnabled = true
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
          cell.events.forEach((event, index) => {
            if (!event.appearance.visible) return

            const xPos = x * cellSize + cellSize / 4
            const yPos = y * cellSize + cellSize / 4
            const size = cellSize / 2

            // イベントのアイコンまたは色つき円を表示
            if (cellSize > 16) {
              // アイコンがあるかどうかを厳密にチェック（空文字列、空白、null、undefinedを除外）
              const hasValidIcon = event.appearance.icon && 
                                   typeof event.appearance.icon === 'string' && 
                                   event.appearance.icon.trim().length > 0
              
              // デバッグログ出力（コメントアウト - ホバー時に大量ログが流れるため）
              // if (x === 0 && y === 0) {
              //   console.log('イベント描画デバッグ:', {
              //     eventId: event.id,
              //     eventName: event.name,
              //     iconValue: event.appearance.icon,
              //     iconType: typeof event.appearance.icon,
              //     iconTrimmed: event.appearance.icon?.trim(),
              //     hasValidIcon,
              //     color: event.appearance.color
              //   })
              // }
              
              if (hasValidIcon) {
                // アイコンがある場合：アイコンのみ表示（色付き円は表示しない）
                ctx.fillStyle = '#fff'
                ctx.font = `${Math.min(cellSize / 3, 16)}px Arial`
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'
                ctx.fillText(
                  event.appearance.icon || '🔸',
                  xPos + size / 2,
                  yPos + size / 2
                )
              } else {
                // アイコンがない場合：色つきの○のみ表示
                ctx.fillStyle = event.appearance.color || '#ffd700'
                ctx.beginPath()
                ctx.arc(xPos + size / 2, yPos + size / 2, size / 4, 0, Math.PI * 2)
                ctx.fill()
                
                // 外枠
                ctx.strokeStyle = '#fff'
                ctx.lineWidth = 1
                ctx.beginPath()
                ctx.arc(xPos + size / 2, yPos + size / 2, size / 4, 0, Math.PI * 2)
                ctx.stroke()
              }
            }

            // 複数のイベントがある場合は番号を表示
            if (cell.events.length > 1 && cellSize > 20) {
              ctx.fillStyle = '#fff'
              ctx.font = `${Math.min(cellSize / 8, 8)}px Arial`
              ctx.textAlign = 'center'
              ctx.fillText(
                (index + 1).toString(),
                xPos + size - 4,
                yPos + 8
              )
            }

            // 選択されたイベントをハイライト表示
            if (selectedEventId === event.id) {
              ctx.strokeStyle = '#00ff00'  // 明るい緑色
              ctx.lineWidth = 4
              ctx.setLineDash([5, 5])  // 点線でハイライト
              ctx.beginPath()
              ctx.arc(xPos + size / 2, yPos + size / 2, size / 2.5, 0, Math.PI * 2)
              ctx.stroke()
              ctx.setLineDash([])  // 点線をリセット
            }

            // ホバーされたイベントをハイライト表示
            if (highlightedEventId === event.id) {
              ctx.strokeStyle = '#ffaa00'  // オレンジ色
              ctx.lineWidth = 3
              ctx.setLineDash([3, 3])  // 短い点線でハイライト
              ctx.beginPath()
              ctx.arc(xPos + size / 2, yPos + size / 2, size / 2.2, 0, Math.PI * 2)
              ctx.stroke()
              ctx.setLineDash([])  // 点線をリセット
            }
          })
        }
      }
    }
  }, [floor, cellSize, selectedEventId, highlightedEventId])

  const drawDecorations = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!floor) return

    for (let y = 0; y < floor.height; y++) {
      for (let x = 0; x < floor.width; x++) {
        const cell = floor.cells[y][x]
        if (cell.decorations.length > 0) {
          cell.decorations.forEach((decoration, index) => {
            if (!decoration.appearance.visible) return

            const xPos = x * cellSize + cellSize / 8
            const yPos = y * cellSize + cellSize / 8
            const size = cellSize * 0.75

            // 装飾の背景円を描画
            ctx.fillStyle = decoration.appearance.color + '30'
            ctx.beginPath()
            ctx.arc(xPos + size / 2, yPos + size / 2, size / 3, 0, Math.PI * 2)
            ctx.fill()

            // 装飾の外枠
            ctx.strokeStyle = decoration.appearance.color
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.arc(xPos + size / 2, yPos + size / 2, size / 3, 0, Math.PI * 2)
            ctx.stroke()

            // 装飾のアイコンまたはテキスト表示
            if (cellSize > 16) {
              ctx.fillStyle = decoration.appearance.color
              ctx.font = `${Math.min(cellSize / 3, 16)}px Arial`
              ctx.textAlign = 'center'
              ctx.fillText(
                decoration.appearance.icon || decoration.type.charAt(0).toUpperCase(),
                xPos + size / 2,
                yPos + size / 2 + Math.min(cellSize / 6, 6)
              )
            }

            // 複数の装飾がある場合は番号を表示
            if (cell.decorations.length > 1 && cellSize > 20) {
              ctx.fillStyle = '#fff'
              ctx.font = `${Math.min(cellSize / 8, 8)}px Arial`
              ctx.textAlign = 'center'
              ctx.fillText(
                (index + 1).toString(),
                xPos + size - 4,
                yPos + 8
              )
            }
          })
        }
      }
    }
  }, [floor, cellSize])

  const drawTemplatePreview = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!selectedTemplate || selectedTool !== 'template') return
    
    // マップ全体テンプレートの場合は全体をプレビュー
    if (selectedTemplate.isFullMap) {
      const template = selectedTemplate
      
      // マップ全体にオーバーレイを描画
      ctx.fillStyle = 'rgba(255, 165, 0, 0.3)'
      ctx.fillRect(0, 0, floor!.width * cellSize, floor!.height * cellSize)
      
      // 外框を描画
      ctx.strokeStyle = '#ff8800'
      ctx.lineWidth = 4
      ctx.setLineDash([8, 8])
      ctx.strokeRect(0, 0, floor!.width * cellSize, floor!.height * cellSize)
      ctx.setLineDash([])
      
      // 中央にテキストを表示
      ctx.fillStyle = '#ff8800'
      ctx.font = 'bold 16px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(
        `マップ全体テンプレート: ${template.name}`,
        (floor!.width * cellSize) / 2,
        (floor!.height * cellSize) / 2
      )
      
      return
    }
    
    // 通常テンプレートのプレビュー
    if (!templatePreviewPosition) return

    const { x: startX, y: startY } = templatePreviewPosition
    // console.log(`テンプレートプレビュー描画: ${selectedTemplate.name}, 回転: ${templateRotation}°`)
    // テンプレートを回転させてプレビュー
    const template = rotateTemplateUtil(selectedTemplate, templateRotation)
    // console.log(`回転後サイズ: ${template.size.width}x${template.size.height}`)

    // テンプレートのサイズをチェック
    if (startX + template.size.width > floor!.width || startY + template.size.height > floor!.height) {
      // マップの範囲外の場合は赤で警告表示
      ctx.fillStyle = 'rgba(255, 0, 0, 0.3)'
      ctx.strokeStyle = '#ff0000'
      ctx.lineWidth = 2
      ctx.setLineDash([4, 4])
      ctx.fillRect(
        startX * cellSize,
        startY * cellSize,
        template.size.width * cellSize,
        template.size.height * cellSize
      )
      ctx.strokeRect(
        startX * cellSize,
        startY * cellSize,
        template.size.width * cellSize,
        template.size.height * cellSize
      )
      ctx.setLineDash([])
      return
    }

    // テンプレートのプレビューを描画
    ctx.globalAlpha = 0.7
    
    for (let ty = 0; ty < template.size.height; ty++) {
      for (let tx = 0; tx < template.size.width; tx++) {
        const templateCell = template.cells[ty][tx]
        const worldX = startX + tx
        const worldY = startY + ty
        
        if (worldX >= floor!.width || worldY >= floor!.height) continue
        
        const xPos = worldX * cellSize
        const yPos = worldY * cellSize
        
        // 床のプレビュー（半透明で色分け）
        let floorColor = '#666'
        switch (templateCell.floor.type) {
          case 'normal': floorColor = 'rgba(136, 136, 136, 0.8)'; break
          case 'damage': floorColor = 'rgba(204, 68, 68, 0.8)'; break
          case 'slippery': floorColor = 'rgba(68, 136, 204, 0.8)'; break
          case 'pit': floorColor = 'rgba(34, 34, 34, 0.8)'; break
          case 'warp': floorColor = 'rgba(204, 136, 68, 0.8)'; break
        }
        
        ctx.fillStyle = floorColor
        ctx.fillRect(xPos, yPos, cellSize, cellSize)
        
        // 床タイプのテキスト表示（セルが十分大きい場合）
        if (cellSize > 24) {
          ctx.fillStyle = '#fff'
          ctx.font = `bold ${Math.min(cellSize / 6, 10)}px Arial`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          
          let floorTypeText = ''
          switch (templateCell.floor.type) {
            case 'normal': floorTypeText = '床'; break
            case 'damage': floorTypeText = 'ダメ'; break
            case 'slippery': floorTypeText = '滑'; break
            case 'pit': floorTypeText = '穴'; break
            case 'warp': floorTypeText = 'ワープ'; break
          }
          
          // 文字の背景（読みやすさのため）
          const textWidth = ctx.measureText(floorTypeText).width
          const textHeight = Math.min(cellSize / 6, 10)
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
          ctx.fillRect(
            xPos + cellSize/2 - textWidth/2 - 2,
            yPos + cellSize/2 - textHeight/2 - 1,
            textWidth + 4,
            textHeight + 2
          )
          
          ctx.fillStyle = '#fff'
          ctx.fillText(floorTypeText, xPos + cellSize/2, yPos + cellSize/2)
        }
        
        // 壁のプレビュー（タイプ別に色分けと厚さを変更）
        const drawWall = (direction: 'north' | 'east' | 'south' | 'west', wall: any) => {
          if (!wall) return
          
          // 壁タイプに応じた色とスタイル
          let strokeColor = '#fff'
          let lineWidth = 3
          let lineDash: number[] = []
          
          switch (wall.type) {
            case 'normal':
              strokeColor = '#ffffff'
              lineWidth = 4
              break
            case 'door':
              strokeColor = '#8B4513'
              lineWidth = 5
              break
            case 'locked_door':
              strokeColor = '#FFD700'
              lineWidth = 5
              break
            case 'hidden_door':
              strokeColor = '#888888'
              lineWidth = 2
              lineDash = [4, 4]
              break
            case 'breakable':
              strokeColor = '#FF6B35'
              lineWidth = 3
              lineDash = [6, 3]
              break
            case 'oneway':
              strokeColor = '#00CED1'
              lineWidth = 4
              break
            case 'invisible':
              strokeColor = '#666666'
              lineWidth = 1
              lineDash = [2, 6]
              break
            case 'event':
              strokeColor = '#FF1493'
              lineWidth = 3
              lineDash = [3, 3]
              break
          }
          
          ctx.strokeStyle = strokeColor
          ctx.lineWidth = lineWidth
          ctx.setLineDash(lineDash)
          
          ctx.beginPath()
          switch (direction) {
            case 'north':
              ctx.moveTo(xPos, yPos)
              ctx.lineTo(xPos + cellSize, yPos)
              break
            case 'east':
              ctx.moveTo(xPos + cellSize, yPos)
              ctx.lineTo(xPos + cellSize, yPos + cellSize)
              break
            case 'south':
              ctx.moveTo(xPos, yPos + cellSize)
              ctx.lineTo(xPos + cellSize, yPos + cellSize)
              break
            case 'west':
              ctx.moveTo(xPos, yPos)
              ctx.lineTo(xPos, yPos + cellSize)
              break
          }
          ctx.stroke()
          ctx.setLineDash([]) // リセット
        }
        
        drawWall('north', templateCell.walls.north)
        drawWall('east', templateCell.walls.east)
        drawWall('south', templateCell.walls.south)
        drawWall('west', templateCell.walls.west)
        
        // イベントのプレビュー（より詳細に）
        if (templateCell.events.length > 0) {
          const event = templateCell.events[0] // 最初のイベントを表示
          
          // イベントタイプに応じた色とアイコン
          let eventColor = '#ffd700'
          let eventIcon = '?'
          
          switch (event.type) {
            case 'treasure':
              eventColor = '#ffd700'
              eventIcon = '宝'
              break
            case 'enemy':
              eventColor = '#ff4444'
              eventIcon = '敵'
              break
            case 'npc':
              eventColor = '#44ff44'
              eventIcon = '人'
              break
            case 'stairs':
              eventColor = '#888888'
              eventIcon = '階'
              break
            case 'heal':
              eventColor = '#44ffff'
              eventIcon = '回'
              break
            case 'save':
              eventColor = '#44aaff'
              eventIcon = 'S'
              break
            case 'sign':
              eventColor = '#aaaaaa'
              eventIcon = '看'
              break
            case 'switch':
              eventColor = '#ffaa44'
              eventIcon = 'ス'
              break
            case 'harvest':
              eventColor = '#44ff44'
              eventIcon = '採'
              break
          }
          
          // イベントの背景円
          ctx.fillStyle = eventColor + '99' // 半透明
          ctx.beginPath()
          ctx.arc(xPos + cellSize * 0.75, yPos + cellSize * 0.25, cellSize / 8, 0, Math.PI * 2)
          ctx.fill()
          
          // イベントの枠線
          ctx.strokeStyle = eventColor
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.arc(xPos + cellSize * 0.75, yPos + cellSize * 0.25, cellSize / 8, 0, Math.PI * 2)
          ctx.stroke()
          
          // イベントアイコン
          if (cellSize > 16) {
            ctx.fillStyle = '#000'
            ctx.font = `bold ${Math.min(cellSize / 8, 8)}px Arial`
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(eventIcon, xPos + cellSize * 0.75, yPos + cellSize * 0.25)
          }
          
          // 複数イベントがある場合の数字表示
          if (templateCell.events.length > 1 && cellSize > 20) {
            ctx.fillStyle = '#fff'
            ctx.font = `bold ${Math.min(cellSize / 12, 6)}px Arial`
            ctx.textAlign = 'center'
            ctx.fillText(
              templateCell.events.length.toString(),
              xPos + cellSize * 0.9,
              yPos + cellSize * 0.1
            )
          }
        }
        
        // 装飾のプレビュー
        if (templateCell.decorations.length > 0) {
          const decoration = templateCell.decorations[0]
          
          // 装飾タイプに応じた色とアイコン
          let decorationColor = decoration.appearance.color || '#888888'
          let decorationIcon = decoration.appearance.icon || decoration.type.charAt(0).toUpperCase()
          
          // 装飾の背景
          ctx.fillStyle = decorationColor + '66' // 半透明
          ctx.beginPath()
          ctx.arc(xPos + cellSize * 0.25, yPos + cellSize * 0.75, cellSize / 10, 0, Math.PI * 2)
          ctx.fill()
          
          // 装飾の枠線
          ctx.strokeStyle = decorationColor
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.arc(xPos + cellSize * 0.25, yPos + cellSize * 0.75, cellSize / 10, 0, Math.PI * 2)
          ctx.stroke()
          
          // 装飾アイコン
          if (cellSize > 16) {
            ctx.fillStyle = '#000'
            ctx.font = `${Math.min(cellSize / 12, 6)}px Arial`
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(decorationIcon, xPos + cellSize * 0.25, yPos + cellSize * 0.75)
          }
        }
      }
    }
    
    // テンプレートの外框を描画（より目立つように）
    ctx.strokeStyle = '#00ff88'
    ctx.lineWidth = 4
    ctx.setLineDash([10, 5])
    ctx.strokeRect(
      startX * cellSize - 2,
      startY * cellSize - 2,
      template.size.width * cellSize + 4,
      template.size.height * cellSize + 4
    )
    ctx.setLineDash([])
    
    // テンプレート情報の表示
    const templateWidth = template.size.width * cellSize
    
    // テンプレート名とサイズの背景
    ctx.fillStyle = 'rgba(0, 255, 136, 0.9)'
    ctx.fillRect(
      startX * cellSize,
      startY * cellSize - 20,
      Math.max(templateWidth, 120),
      18
    )
    
    // テンプレート名とサイズのテキスト
    ctx.fillStyle = '#000'
    ctx.font = 'bold 12px Arial'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(
      `${template.name} (${template.size.width}×${template.size.height}) ${templateRotation}°`,
      startX * cellSize + 4,
      startY * cellSize - 11
    )
    
    ctx.globalAlpha = 1
  }, [selectedTemplate, templatePreviewPosition, selectedTool, cellSize, floor, templateRotation])

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


  const drawSelection = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!selectionMode || !selectionStart || !selectionEnd) return

    const minX = Math.min(selectionStart.x, selectionEnd.x)
    const maxX = Math.max(selectionStart.x, selectionEnd.x)
    const minY = Math.min(selectionStart.y, selectionEnd.y)
    const maxY = Math.max(selectionStart.y, selectionEnd.y)

    // 確定状態に応じて色とスタイルを変更
    if (selectionConfirmed) {
      // 確定後：緑色の実線
      ctx.fillStyle = 'rgba(0, 255, 0, 0.3)'
      ctx.strokeStyle = '#00ff00'
      ctx.setLineDash([])
    } else {
      // 確定前：青色の破線
      ctx.fillStyle = 'rgba(0, 150, 255, 0.2)'
      ctx.strokeStyle = '#0096ff'
      ctx.setLineDash([5, 5])
    }

    // 選択範囲の背景を描画
    ctx.fillRect(
      minX * cellSize,
      minY * cellSize,
      (maxX - minX + 1) * cellSize,
      (maxY - minY + 1) * cellSize
    )

    // 選択範囲の枠線を描画
    ctx.lineWidth = 2
    ctx.strokeRect(
      minX * cellSize,
      minY * cellSize,
      (maxX - minX + 1) * cellSize,
      (maxY - minY + 1) * cellSize
    )
    ctx.setLineDash([])
    ctx.lineWidth = 1

    // 選択範囲の情報を表示
    const width = maxX - minX + 1
    const height = maxY - minY + 1
    ctx.fillStyle = '#0096ff'
    ctx.font = 'bold 14px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(
      `${width}×${height}`,
      (minX + maxX + 1) * cellSize / 2,
      (minY + maxY + 1) * cellSize / 2
    )
  }, [selectionMode, selectionStart, selectionEnd, selectionConfirmed, cellSize])

  const drawHoveredCell = useCallback((ctx: CanvasRenderingContext2D) => {
    // ペンツールで床または壁レイヤーが選択されている場合のみハイライト表示
    if (selectedTool !== 'pen') return

    // 床レイヤーのハイライト
    if (selectedLayer === 'floor' && hoveredCellPosition) {
      const { x, y } = hoveredCellPosition
      const xPos = x * cellSize
      const yPos = y * cellSize

      // 床タイプに応じた色を取得
      const colors = getFloorHighlightColor(selectedFloorType, isShiftPressed)
      
      // ハイライト色を設定（半透明）
      ctx.fillStyle = colors.fill
      ctx.fillRect(xPos, yPos, cellSize, cellSize)

      // 枠線を描画
      ctx.strokeStyle = colors.stroke
      ctx.lineWidth = 2
      ctx.setLineDash([3, 3])
      ctx.strokeRect(xPos, yPos, cellSize, cellSize)
      ctx.setLineDash([])
      ctx.lineWidth = 1
    }

    // 壁レイヤーのハイライト
    if (selectedLayer === 'walls' && hoveredWallInfo) {
      const { position, direction } = hoveredWallInfo
      const { x, y } = position
      const baseX = x * cellSize
      const baseY = y * cellSize

      // 壁タイプに応じた色を取得
      const colors = getWallHighlightColor(selectedWallType, isShiftPressed)
      
      ctx.fillStyle = colors.fill
      ctx.strokeStyle = colors.stroke
      ctx.lineWidth = 3

      // 方向に応じて壁をハイライト
      const wallThickness = 6
      switch (direction) {
        case 'north':
          ctx.fillRect(baseX, baseY - wallThickness/2, cellSize, wallThickness)
          ctx.strokeRect(baseX, baseY - wallThickness/2, cellSize, wallThickness)
          break
        case 'east':
          ctx.fillRect(baseX + cellSize - wallThickness/2, baseY, wallThickness, cellSize)
          ctx.strokeRect(baseX + cellSize - wallThickness/2, baseY, wallThickness, cellSize)
          break
        case 'south':
          ctx.fillRect(baseX, baseY + cellSize - wallThickness/2, cellSize, wallThickness)
          ctx.strokeRect(baseX, baseY + cellSize - wallThickness/2, cellSize, wallThickness)
          break
        case 'west':
          ctx.fillRect(baseX - wallThickness/2, baseY, wallThickness, cellSize)
          ctx.strokeRect(baseX - wallThickness/2, baseY, wallThickness, cellSize)
          break
      }
      
      ctx.lineWidth = 1
    }
  }, [selectedTool, selectedLayer, hoveredCellPosition, hoveredWallInfo, selectedFloorType, selectedWallType, isShiftPressed, cellSize])

  const redraw = useCallback(() => {
    try {
      const canvas = canvasRef.current
      if (!canvas || !floor) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // キャンバスサイズが変更された場合のみサイズを設定
      const newWidth = floor.width * cellSize
      const newHeight = floor.height * cellSize
      if (canvas.width !== newWidth || canvas.height !== newHeight) {
        canvas.width = newWidth
        canvas.height = newHeight
      }

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
      if (layerVisibility.decorations) {
        drawDecorations(ctx)
      }
      
      // 矩形プレビューを描画
      drawRectanglePreview(ctx)
      
      // テンプレートプレビューを描画
      drawTemplatePreview(ctx)
      
      // ドラッグプレビューを描画
      drawDragPreview(ctx)
      
      // 選択されたセルを描画
      
      // ホバー中のセルをハイライト
      drawHoveredCell(ctx)
      
      // 範囲選択を描画
      drawSelection(ctx)
      
      drawGrid(ctx)
    } catch (error) {
      console.error('MapEditor2D redraw error:', error)
    }
  }, [floor, cellSize, drawFloor, drawWalls, drawEvents, drawDecorations, drawGrid, drawRectanglePreview, drawTemplatePreview, drawDragPreview, drawHoveredCell, drawSelection, editorState])

  const getCellPosition = useCallback((event: React.MouseEvent): Position | null => {
    const canvas = canvasRef.current
    if (!canvas || !floor) return null

    const rect = canvas.getBoundingClientRect()
    const rawX = event.clientX - rect.left
    const rawY = event.clientY - rect.top
    // セルサイズを整数に丸めて正確な座標変換を保証
    const roundedCellSize = Math.round(cellSize)
    const x = Math.floor(rawX / roundedCellSize)
    const y = Math.floor(rawY / roundedCellSize)

    if (x >= 0 && x < floor.width && y >= 0 && y < floor.height) {
      return { x, y }
    }

    return null
  }, [cellSize, floor])

  // セルの実際の壁情報を取得する関数（隣接セルの壁も考慮）
  const getActualWallInfo = useCallback((position: Position) => {
    if (!floor) return { north: null, east: null, south: null, west: null }
    
    const currentCell = floor.cells[position.y][position.x]
    const { x, y } = position
    
    // 各方向の壁を取得（隣接セルの壁も考慮）
    const walls = {
      // 北の壁：現在のセルの北の壁 または 上のセルの南の壁
      north: currentCell.walls.north || 
             (y > 0 ? floor.cells[y - 1][x]?.walls.south : null),
      
      // 東の壁：現在のセルの東の壁
      east: currentCell.walls.east,
      
      // 南の壁：現在のセルの南の壁
      south: currentCell.walls.south,
      
      // 西の壁：現在のセルの西の壁 または 左のセルの東の壁
      west: currentCell.walls.west ||
            (x > 0 ? floor.cells[y][x - 1]?.walls.east : null)
    }
    
    return walls
  }, [floor])

  // ホバー情報更新処理（パフォーマンス改善のため分離）
  const updateHoverInfo = useCallback((position: Position, event?: React.MouseEvent) => {
    if (!floor) return
    
    const currentCell = floor.cells[position.y][position.x]
    const actualWalls = getActualWallInfo(position)
    
    // ホバー情報を構築
    const hoveredInfo = {
      position,
      floor: {
        type: currentCell.floor.type,
        passable: currentCell.floor.passable
      },
      walls: actualWalls,
      events: currentCell.events.map(event => ({
        name: event.name,
        type: event.type
      })),
      decorations: currentCell.decorations?.map(decoration => ({
        name: decoration.name || '無名の装飾',
        type: decoration.type || 'unknown'
      })) || []
    }
    
    // デバッグ情報をコンソールに出力（開発モードのみ）
    // console.log('Hovered Cell Debug:', {
    //   position,
    //   actualCellData: currentCell,
    //   displayedInfo: hoveredInfo
    // })
    
    dispatch(setHoveredCellInfo(hoveredInfo))
    
    // ペンツールで床または壁レイヤーの場合、ハイライト用の位置も更新
    if (selectedTool === 'pen') {
      if (selectedLayer === 'floor') {
        dispatch(setHoveredCellPosition(position))
        dispatch(clearHoveredWallInfo())
      } else if (selectedLayer === 'walls' && event) {
        // 壁レイヤーの場合は最も近い壁を検出
        const wallInfo = getClosestWallFromMouse(event)
        if (wallInfo) {
          dispatch(setHoveredWallInfo(wallInfo))
          dispatch(clearHoveredCellPosition())
        }
      }
    }
    
    // テンプレートツールのプレビュー位置更新
    if (selectedTool === 'template' && selectedTemplate && !selectedTemplate.isFullMap) {
      dispatch(setTemplatePreviewPosition(position))
    }
  }, [floor, dispatch, selectedTool, selectedLayer, getActualWallInfo, getClosestWallFromMouse, selectedTemplate])



  // マウスがキャンバスから離れた時にホバー情報をクリア
  const handleCanvasMouseLeave = useCallback(() => {
    dispatch(clearHoveredCellInfo())
    dispatch(clearHoveredCellPosition())
    dispatch(clearHoveredWallInfo())
    dispatch(setTemplatePreviewPosition(null))
  }, [dispatch])

  const handleCanvasClick = useCallback((event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()

    const position = getCellPosition(event)
    if (!position || !floor) return

    console.log('=== CanvasClick Debug ===')
    console.log('選択レイヤー:', selectedLayer)
    console.log('選択ツール:', selectedTool)
    console.log('クリック位置:', position)
    console.log('isDragging:', isDragging)
    console.log('isActuallyDragging:', isActuallyDragging)

    const currentCell = floor.cells[position.y][position.x]
    console.log('現在のセルのイベント数:', currentCell.events.length)

    // ドラッグ操作中、または壁レイヤーのペンツール（handleMouseUpで処理済み）、または床レイヤーのペンツール（handleMouseUpで処理済み）はクリック処理をスキップ
    if (isDragging || isActuallyDragging || (selectedLayer === 'walls' && selectedTool === 'pen') || (selectedLayer === 'floor' && selectedTool === 'pen')) {
      console.log('クリック処理をスキップ - 理由:', {
        isDragging,
        isActuallyDragging,
        wallsPen: selectedLayer === 'walls' && selectedTool === 'pen',
        floorPen: selectedLayer === 'floor' && selectedTool === 'pen'
      })
      return
    }

    // テンプレートツールの処理
    if (selectedTool === 'template' && selectedTemplate) {
      // マップ全体テンプレートの場合はボタンからのみ配置可能
      if (selectedTemplate.isFullMap) {
        return
      }
      
      // 通常のテンプレートは指定位置に配置
      // 最新のtemplateRotationを直接editorStateから取得
      const currentTemplateRotation = editorState.templateRotation
      console.log('テンプレート配置前の状態:', {
        templateName: selectedTemplate.name,
        templateId: selectedTemplate.id,
        position,
        templateRotation,
        currentTemplateRotation,
        editorStateTemplateRotation: editorState.templateRotation,
        selectedTemplateAddress: selectedTemplate
      })
      dispatch(placeTemplate({
        template: selectedTemplate,
        position,
        floorIndex: currentFloor,
        rotation: currentTemplateRotation
      }))
      console.log('placeTemplateアクション送信完了')
      
      // テンプレート配置後はプレビュー位置のみクリア（連続配置のため）
      dispatch(setTemplatePreviewPosition(null))
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
      } else if (selectedLayer === 'decorations') {
        // 装飾を消去
        dispatch(updateCell({
          floorIndex: currentFloor,
          position,
          cell: { decorations: [] }
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
                } else if (selectedLayer === 'decorations') {
                  // 装飾を消去
                  updates.push({
                    position: cellPosition,
                    cell: { decorations: [] }
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
                } else if (selectedLayer === 'events' && selectedEventType) {
                  // 既存のイベントに新しいイベントを追加（上書きしない）
                  const newEvent = createEventByType(selectedEventType, cellPosition)
                  const newEvents = [...cell.events, newEvent]
                  updates.push({
                    position: cellPosition,
                    cell: { events: newEvents }
                  })
                } else if (selectedLayer === 'decorations') {
                  const hasDecoration = cell.decorations.length > 0
                  const newDecorations = hasDecoration ? [] : [{
                    id: crypto.randomUUID(),
                    type: selectedDecorationType,
                    name: `${getDecorationIcon(selectedDecorationType)} ${selectedDecorationType}`,
                    position: cellPosition,
                    appearance: {
                      visible: true,
                      color: getDecorationColor(selectedDecorationType),
                      icon: getDecorationIcon(selectedDecorationType),
                      layer: 0,
                      rotation: 0,
                      scale: 1.0
                    },
                    properties: {},
                    interactable: false
                  }]
                  updates.push({
                    position: cellPosition,
                    cell: { decorations: newDecorations }
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
        if (isShiftPressed) {
          // Shift押下時は最後のイベントのみ削除（全削除ではない）
          if (currentCell.events.length > 0) {
            const newEvents = currentCell.events.slice(0, -1)  // 最後の要素を削除
            dispatch(updateCell({
              floorIndex: currentFloor,
              position,
              cell: { events: newEvents }
            }))
          }
        } else if (selectedEventType) {
          // 新しいイベントを追加
          const newEvent = createEventByType(selectedEventType, position)
          console.log('新しいイベント作成:', newEvent.id, newEvent.name)
          console.log('現在のセルのイベント:', currentCell.events.map(e => `${e.id} (${e.name})`))
          const newEvents = [...currentCell.events, newEvent]
          console.log('新しい配列:', newEvents.map(e => `${e.id} (${e.name})`))
          dispatch(updateCell({
            floorIndex: currentFloor,
            position,
            cell: { events: newEvents }
          }))
        } else {
          // 何も選択されていない場合は新規イベント作成ダイアログを開く
          const newEvent = createEventByType('treasure', position) // デフォルトで宝箱タイプを作成
          dispatch(openEventEditDialog(newEvent))
        }
      }
    } else if (selectedLayer === 'decorations') {
      if (selectedTool === 'pen') {
        // 装飾の追加/削除
        if (isShiftPressed) {
          // Shift押下時は削除
          dispatch(updateCell({
            floorIndex: currentFloor,
            position,
            cell: { decorations: [] }
          }))
        } else {
          // 新しい装飾を追加
          const newDecoration: Decoration = {
            id: crypto.randomUUID(),
            type: selectedDecorationType,
            name: getDecorationName(selectedDecorationType),
            position: { x: position.x, y: position.y },
            appearance: {
              visible: true,
              color: getDecorationColor(selectedDecorationType),
              icon: getDecorationIcon(selectedDecorationType),
              layer: 1
            },
            properties: {}
          }
          dispatch(addDecorationToCell({
            x: position.x,
            y: position.y,
            decoration: newDecoration,
            floorIndex: currentFloor
          }))
        }
      }
    }
  }, [selectedLayer, selectedTool, selectedFloorType, selectedWallType, selectedDecorationType, selectedEventType, isShiftPressed, currentFloor, capturedCellData, dispatch, floor, getCellPosition, selectedTemplate, templateRotation, editorState, isDragging, isActuallyDragging, rectangleStart, isDrawingRectangle])

  // イベントタイプに基づいてイベントを作成するヘルパー関数
  const createEventByType = useCallback((eventType: EventType, position: Position) => {
    const eventConfigs = {
      treasure: { name: '宝箱', description: 'アイテムを入手できる宝箱', color: '#ffd700', icon: '💰' },
      npc: { name: 'NPC', description: '話しかけられるキャラクター', color: '#40e0d0', icon: '👤' },
      stairs: { name: '階段', description: '他の階への移動', color: '#888888', icon: '🪜' },
      enemy: { name: '敵', description: 'シンボルエンカウント', color: '#ff4444', icon: '👹' },
      save: { name: 'セーブポイント', description: 'ゲームデータを保存', color: '#44aaff', icon: '💾' },
      heal: { name: '回復ポイント', description: 'HP・MPを回復', color: '#44ffaa', icon: '❤️' },
      switch: { name: 'スイッチ', description: '扉や仕掛けを操作', color: '#ffaa44', icon: '🔘' },
      sign: { name: '看板', description: 'メッセージを表示', color: '#aaaaaa', icon: '📋' },
      harvest: { name: '採取ポイント', description: 'アイテムを採取', color: '#44ff44', icon: '🌾' },
    }

    const config = eventConfigs[eventType as keyof typeof eventConfigs] || eventConfigs.treasure
    
    // 現在のフロアの既存イベントから同じタイプのイベント数をカウント
    let eventCount = 0
    if (floor) {
      for (let y = 0; y < floor.height; y++) {
        for (let x = 0; x < floor.width; x++) {
          const cell = floor.cells[y][x]
          eventCount += cell.events.filter(event => event.type === eventType).length
        }
      }
    }
    
    // 同じタイプのイベントが既に存在する場合はインデックスを追加
    const baseName = config.name
    const eventName = eventCount > 0 ? `${baseName} ${eventCount + 1}` : baseName
    
    const generatedId = crypto.randomUUID()
    console.log('createEventByType: 新しいID生成 =', generatedId, 'イベント名:', eventName)

    return {
      id: generatedId,
      type: eventType,
      name: eventName,
      description: config.description,
      position: position,
      appearance: {
        visible: true,
        color: config.color,
        icon: config.icon
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
        type: eventType as any,
        params: {
          items: [{ id: 'gold', count: 100 }],
          message: config.description
        }
      }],
      flags: {},
      enabled: true,
      priority: 1,
      metadata: {
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        version: 1
      },
      conditions: []
    }
  }, [floor])

  // 装飾名を取得するヘルパー関数
  const getDecorationName = useCallback((decorationType: string) => {
    const decorationNames = {
      furniture: '家具',
      statue: '彫像',
      plant: '植物',
      torch: '松明',
      pillar: '柱',
      rug: '絨毯',
      painting: '絵画',
      crystal: 'クリスタル',
      rubble: '瓦礫'
    }
    return decorationNames[decorationType as keyof typeof decorationNames] || '装飾'
  }, [])


  const handleCanvasMouseMove = useCallback((event: React.MouseEvent) => {
    // 範囲選択モードでのマウスムーブ処理
    if (selectionMode && selectionStart) {
      const position = getCellPosition(event)
      if (position) {
        dispatch(setSelectionEnd(position))
      }
      return
    }
    
    // ホバー情報の更新（ドラッグ中でない場合のみ）
    if (!isDragging && !isActuallyDragging) {
      const position = getCellPosition(event)
      if (position && floor) {
        // セル情報を更新
        updateHoverInfo(position, event)
      } else {
        dispatch(clearHoveredCellInfo())
        dispatch(clearHoveredCellPosition())
        dispatch(clearHoveredWallInfo())
      }
    }

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
  }, [selectionMode, selectionStart, selectionConfirmed, dispatch, selectedTool, isDrawingRectangle, rectangleStart, getCellPosition, isDragging, dragStart, selectedLayer, dragStartMouse, isActuallyDragging, cellSize, floor, updateHoverInfo, getClosestWallFromMouse])

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    // 範囲選択モードの処理
    if (selectionMode) {
      const position = getCellPosition(event)
      if (!position) return
      
      if (!selectionStart) {
        // 1回目のクリック：開始点を設定
        dispatch(setSelectionStart(position))
        dispatch(setSelectionEnd(position))
      } else {
        // 2回目のクリック：終了点を設定して確定
        dispatch(setSelectionEnd(position))
        dispatch(confirmSelection())
      }
      return
    }
    
    if (selectedLayer === 'walls' && selectedTool === 'pen') {
      const canvas = canvasRef.current
      if (!canvas) return
      
      const rect = canvas.getBoundingClientRect()
      const mouseX = event.clientX - rect.left
      const mouseY = event.clientY - rect.top
      
      // マウス座標を保存してドラッグ開始準備
      setDragStartMouse({ x: mouseX, y: mouseY })
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
      setIsActuallyDragging(false)
      
      // 床ドラッグはセル単位でスナップ
      setDragStart(position)
      setDragEnd(position)
    }
  }, [selectionMode, selectionStart, dispatch, getCellPosition, selectedLayer, selectedTool, cellSize])

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

    // 装飾レイヤーのペンツールの処理
    if (dragStartMouse && dragStart && selectedLayer === 'decorations' && selectedTool === 'pen') {
      if (!isActuallyDragging) {
        // クリック処理として装飾を配置
        if (dragStart && floor) {
          if (isShiftPressed) {
            // Shift+クリックで装飾を削除
            dispatch(updateCell({
              floorIndex: currentFloor,
              position: dragStart,
              cell: { decorations: [] }
            }))
          } else {
            // 新しい装飾を作成
            const newDecoration: Decoration = {
              id: crypto.randomUUID(),
              type: selectedDecorationType,
              name: `${getDecorationIcon(selectedDecorationType)} ${selectedDecorationType}`,
              position: { x: dragStart.x, y: dragStart.y },
              appearance: {
                visible: true,
                color: getDecorationColor(selectedDecorationType),
                icon: getDecorationIcon(selectedDecorationType),
                layer: 0,
                rotation: 0,
                scale: 1.0
              },
              properties: {},
              interactable: false
            }

            dispatch(addDecorationToCell({
              x: dragStart.x,
              y: dragStart.y,
              decoration: newDecoration,
              floorIndex: currentFloor
            }))
          }
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
  }, [isDragging, isActuallyDragging, dragStart, dragEnd, dragStartMouse, selectedLayer, selectedTool, selectedWallType, selectedFloorType, dispatch, currentFloor, getCellPosition, floor, cellSize, capturedCellData])

  useEffect(() => {
    redraw()
  }, [redraw])


  if (!floor) {
    return (
      <Box sx={{ padding: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'white' }}>
        <div>
          <h3>フロアデータが見つかりません</h3>
          <p>ダンジョン: {dungeon ? 'あり' : 'なし'}</p>
          <p>現在のフロア: {currentFloor}</p>
          <p>フロア数: {dungeon?.floors?.length || 0}</p>
        </div>
      </Box>
    )
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
                selectedTool === 'template' ? 'copy' : 'default',
        position: 'relative',
        userSelect: 'none',
      }}
    >
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMouseMove}
        onMouseLeave={handleCanvasMouseLeave}
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