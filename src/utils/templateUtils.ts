import { Template, TemplateCell } from '../types/map'

// テンプレートを90度時計回りに回転させる関数
export const rotateTemplate90 = (template: Template): Template => {
  const { width, height } = template.size
  
  // console.log(`90度回転開始: 元サイズ ${width}x${height}`)
  // console.log('元のテンプレートの最初のセル:', template.cells[0][0])
  
  // 回転後のサイズ（幅と高さが入れ替わる）
  const newWidth = height
  const newHeight = width
  
  // console.log(`回転後サイズ: ${newWidth}x${newHeight}`)
  
  const newCells: TemplateCell[][] = Array(newHeight).fill(null).map(() => 
    Array(newWidth).fill(null).map(() => ({
      floor: { type: 'normal' as const, passable: true },
      walls: { north: null, east: null, south: null, west: null },
      events: [],
      decorations: []
    }))
  )
  
  // 元のセルを新しい位置にコピー
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // 90度時計回りの座標変換: (x, y) → (height-1-y, x)
      const newX = height - 1 - y
      const newY = x
      
      // console.log(`座標変換: (${x}, ${y}) → (${newX}, ${newY})`)
      
      const originalCell = template.cells[y][x]
      
      // 壁の回転（90度時計回り）
      // 北→東、東→南、南→西、西→北
      const rotatedWalls = {
        north: originalCell.walls.west,
        east: originalCell.walls.north,
        south: originalCell.walls.east,
        west: originalCell.walls.south,
      }
      
      newCells[newY][newX] = {
        ...originalCell,
        walls: rotatedWalls
      }
    }
  }
  
  // console.log('回転後のテンプレートの最初のセル:', newCells[0][0])
  // console.log(`90度回転完了`)
  
  return {
    ...template,
    size: { width: newWidth, height: newHeight },
    cells: newCells
  }
}

// テンプレートを指定角度回転させる関数
export const rotateTemplate = (template: Template, rotation: 0 | 90 | 180 | 270): Template => {
  // console.log(`rotateTemplate呼び出し: ${template.name}, 角度: ${rotation}°`)
  if (rotation === 0) {
    // console.log(`回転なし、元のテンプレートを返却`)
    return template
  }
  
  let rotatedTemplate = { ...template }
  
  const rotations = rotation / 90
  // console.log(`${rotations}回90度回転を実行`)
  for (let i = 0; i < rotations; i++) {
    // console.log(`${i + 1}回目の90度回転`)
    rotatedTemplate = rotateTemplate90(rotatedTemplate)
  }
  
  // console.log(`回転完了: ${template.size.width}x${template.size.height} → ${rotatedTemplate.size.width}x${rotatedTemplate.size.height}`)
  return rotatedTemplate
}

// テンプレートの回転プレビュー用にサイズを計算
export const getRotatedSize = (originalSize: { width: number; height: number }, rotation: 0 | 90 | 180 | 270) => {
  if (rotation === 90 || rotation === 270) {
    return { width: originalSize.height, height: originalSize.width }
  }
  return originalSize
}

// 回転角度の表示名を取得
export const getRotationDisplayName = (rotation: 0 | 90 | 180 | 270): string => {
  const names = {
    0: '0°',
    90: '90°',
    180: '180°',
    270: '270°'
  }
  return names[rotation]
}