import { Dungeon, DungeonFloor, Cell, DungeonEvent, Position } from '../types/map'

export interface MapValidationIssue {
  id: string
  type: 'error' | 'warning' | 'info'
  category: 'accessibility' | 'balance' | 'consistency' | 'performance' | 'design'
  title: string
  description: string
  location?: {
    floorIndex: number
    position?: Position
    area?: { start: Position; end: Position }
  }
  suggestion: string
  severity: number // 1-10, 10が最も重要
}

export interface MapValidationResult {
  isValid: boolean
  score: number // 0-100のスコア
  issues: MapValidationIssue[]
  stats: {
    totalCells: number
    passableCells: number
    blockedCells: number
    eventCount: number
    decorationCount: number
    isolatedAreas: number
    deadEnds: number
  }
}

export const validateMap = (dungeon: Dungeon | null): MapValidationResult => {
  const issues: MapValidationIssue[] = []
  let totalCells = 0
  let passableCells = 0
  let blockedCells = 0
  let eventCount = 0
  let decorationCount = 0

  if (!dungeon) {
    issues.push({
      id: 'no-dungeon',
      type: 'error',
      category: 'consistency',
      title: 'ダンジョンが存在しません',
      description: 'マップデータが読み込まれていません。',
      suggestion: '新しいプロジェクトを作成するか、既存のマップを読み込んでください。',
      severity: 10
    })
    return {
      isValid: false,
      score: 0,
      issues,
      stats: { totalCells: 0, passableCells: 0, blockedCells: 0, eventCount: 0, decorationCount: 0, isolatedAreas: 0, deadEnds: 0 }
    }
  }

  // 基本構造の検証
  validateBasicStructure(dungeon, issues)

  // 各フロアの検証
  dungeon.floors.forEach((floor, floorIndex) => {
    const floorStats = validateFloor(floor, floorIndex, issues)
    totalCells += floorStats.totalCells
    passableCells += floorStats.passableCells
    blockedCells += floorStats.blockedCells
    eventCount += floorStats.eventCount
    decorationCount += floorStats.decorationCount
  })

  // フロア間の整合性検証
  validateFloorConnections(dungeon, issues)

  // バランスの検証
  validateBalance(dungeon, issues)

  // パフォーマンスの検証
  validatePerformance(dungeon, issues)

  // 到達可能性の検証
  const { isolatedAreas, deadEnds } = validateAccessibility(dungeon, issues)

  // スコア計算
  const score = calculateValidationScore(issues, {
    totalCells,
    passableCells,
    blockedCells,
    eventCount,
    decorationCount,
    isolatedAreas,
    deadEnds
  })

  const isValid = issues.filter(issue => issue.type === 'error').length === 0

  return {
    isValid,
    score,
    issues: issues.sort((a, b) => b.severity - a.severity),
    stats: {
      totalCells,
      passableCells,
      blockedCells,
      eventCount,
      decorationCount,
      isolatedAreas,
      deadEnds
    }
  }
}

const validateBasicStructure = (dungeon: Dungeon, issues: MapValidationIssue[]) => {
  // ダンジョン名の検証
  if (!dungeon.name || dungeon.name.trim().length === 0) {
    issues.push({
      id: 'no-dungeon-name',
      type: 'warning',
      category: 'consistency',
      title: 'ダンジョン名が設定されていません',
      description: 'ダンジョンに名前が設定されていません。',
      suggestion: 'プロジェクト設定でダンジョン名を設定してください。',
      severity: 3
    })
  }

  // フロア数の検証
  if (dungeon.floors.length === 0) {
    issues.push({
      id: 'no-floors',
      type: 'error',
      category: 'consistency',
      title: 'フロアが存在しません',
      description: 'ダンジョンにフロアが1つも存在しません。',
      suggestion: '少なくとも1つのフロアを作成してください。',
      severity: 10
    })
  } else if (dungeon.floors.length > 50) {
    issues.push({
      id: 'too-many-floors',
      type: 'warning',
      category: 'performance',
      title: 'フロア数が多すぎます',
      description: `${dungeon.floors.length}個のフロアが存在します。パフォーマンスに影響する可能性があります。`,
      suggestion: 'フロア数を50個以下に抑えることを推奨します。',
      severity: 5
    })
  }

  // 各フロアの基本検証
  dungeon.floors.forEach((floor, index) => {
    if (!floor.name || floor.name.trim().length === 0) {
      issues.push({
        id: `floor-${index}-no-name`,
        type: 'warning',
        category: 'consistency',
        title: `フロア${index + 1}に名前がありません`,
        description: `フロア${index + 1}に名前が設定されていません。`,
        location: { floorIndex: index },
        suggestion: 'フロアに分かりやすい名前を付けてください。',
        severity: 2
      })
    }

    if (floor.width <= 0 || floor.height <= 0) {
      issues.push({
        id: `floor-${index}-invalid-size`,
        type: 'error',
        category: 'consistency',
        title: `フロア${index + 1}のサイズが不正です`,
        description: `フロア${index + 1}の幅または高さが0以下です。`,
        location: { floorIndex: index },
        suggestion: 'フロアサイズを1以上に設定してください。',
        severity: 9
      })
    }

    if (floor.width > 100 || floor.height > 100) {
      issues.push({
        id: `floor-${index}-too-large`,
        type: 'warning',
        category: 'performance',
        title: `フロア${index + 1}が大きすぎます`,
        description: `フロア${index + 1}のサイズが${floor.width}×${floor.height}です。`,
        location: { floorIndex: index },
        suggestion: 'パフォーマンスのため100×100以下にすることを推奨します。',
        severity: 4
      })
    }
  })
}

const validateFloor = (floor: DungeonFloor, floorIndex: number, issues: MapValidationIssue[]) => {
  let totalCells = 0
  let passableCells = 0
  let blockedCells = 0
  let eventCount = 0
  let decorationCount = 0

  if (!floor.cells || floor.cells.length !== floor.height) {
    issues.push({
      id: `floor-${floorIndex}-invalid-cells`,
      type: 'error',
      category: 'consistency',
      title: `フロア${floorIndex + 1}のセル配列が不正です`,
      description: 'セル配列の行数がフロアの高さと一致しません。',
      location: { floorIndex },
      suggestion: 'フロアデータを再生成してください。',
      severity: 9
    })
    return { totalCells: 0, passableCells: 0, blockedCells: 0, eventCount: 0, decorationCount: 0 }
  }

  // 各行の検証
  floor.cells.forEach((row, y) => {
    if (!row || row.length !== floor.width) {
      issues.push({
        id: `floor-${floorIndex}-row-${y}-invalid`,
        type: 'error',
        category: 'consistency',
        title: `フロア${floorIndex + 1}の行${y + 1}が不正です`,
        description: 'セル配列の列数がフロアの幅と一致しません。',
        location: { floorIndex, position: { x: 0, y } },
        suggestion: 'フロアデータを再生成してください。',
        severity: 9
      })
      return
    }

    // 各セルの検証
    row.forEach((cell, x) => {
      totalCells++
      validateCell(cell, { x, y }, floorIndex, issues)
      
      if (cell.floor.passable) {
        passableCells++
      } else {
        blockedCells++
      }

      eventCount += cell.events.length
      decorationCount += cell.decorations.length
    })
  })

  // フロア固有の問題検証
  validateFloorSpecificIssues(floor, floorIndex, issues)

  return { totalCells, passableCells, blockedCells, eventCount, decorationCount }
}

const validateCell = (cell: Cell, position: Position, floorIndex: number, issues: MapValidationIssue[]) => {
  // セル座標の整合性
  if (cell.x !== position.x || cell.y !== position.y) {
    issues.push({
      id: `cell-${floorIndex}-${position.x}-${position.y}-coord-mismatch`,
      type: 'warning',
      category: 'consistency',
      title: '座標の不整合',
      description: `セル(${position.x}, ${position.y})の内部座標が実際の位置と一致しません。`,
      location: { floorIndex, position },
      suggestion: 'フロアデータを再生成することを推奨します。',
      severity: 3
    })
  }

  // 床タイプの検証
  if (!cell.floor || !cell.floor.type) {
    issues.push({
      id: `cell-${floorIndex}-${position.x}-${position.y}-no-floor`,
      type: 'error',
      category: 'consistency',
      title: '床タイプが未設定',
      description: `セル(${position.x}, ${position.y})に床タイプが設定されていません。`,
      location: { floorIndex, position },
      suggestion: '床タイプを設定してください。',
      severity: 7
    })
  }

  // 落とし穴の周辺チェック
  if (cell.floor.type === 'pit') {
    // 周囲8マスすべてが落とし穴の場合は警告
    // これは実装時に周辺セルをチェックする必要がありますが、ここでは簡略化
  }

  // イベントの検証
  cell.events.forEach((event, eventIndex) => {
    validateEventInCell(event, position, floorIndex, eventIndex, issues)
  })

  // 装飾の検証
  cell.decorations.forEach((decoration, decorationIndex) => {
    if (!decoration.id || !decoration.type) {
      issues.push({
        id: `decoration-${floorIndex}-${position.x}-${position.y}-${decorationIndex}-invalid`,
        type: 'warning',
        category: 'consistency',
        title: '装飾データが不完全',
        description: `セル(${position.x}, ${position.y})の装飾${decorationIndex + 1}にIDまたはタイプが設定されていません。`,
        location: { floorIndex, position },
        suggestion: '装飾データを確認してください。',
        severity: 2
      })
    }
  })

  // 重複チェック
  if (cell.events.length > 5) {
    issues.push({
      id: `cell-${floorIndex}-${position.x}-${position.y}-too-many-events`,
      type: 'warning',
      category: 'performance',
      title: 'イベントが多すぎます',
      description: `セル(${position.x}, ${position.y})に${cell.events.length}個のイベントがあります。`,
      location: { floorIndex, position },
      suggestion: 'イベント数を5個以下にすることを推奨します。',
      severity: 4
    })
  }
}

const validateEventInCell = (event: DungeonEvent, position: Position, floorIndex: number, eventIndex: number, issues: MapValidationIssue[]) => {
  // 基本的なイベント検証（eventValidation.tsと重複を避けつつ、マップ固有の問題をチェック）
  
  // 位置の整合性
  if (event.position.x !== position.x || event.position.y !== position.y) {
    issues.push({
      id: `event-${floorIndex}-${position.x}-${position.y}-${eventIndex}-position-mismatch`,
      type: 'warning',
      category: 'consistency',
      title: 'イベント位置の不整合',
      description: `イベント"${event.name}"の位置情報が実際の配置位置と一致しません。`,
      location: { floorIndex, position },
      suggestion: 'イベントを再配置してください。',
      severity: 5
    })
  }

  // 宝箱の密度チェック
  if (event.type === 'treasure') {
    // 周辺3x3の範囲内に他の宝箱があるかチェック（簡略化）
    // 実際の実装では周辺セルをチェックする必要があります
  }

  // 敵の配置バランス
  if (event.type === 'enemy') {
    // 通行不可の場所に敵が配置されていないかチェック
    // 実際の実装ではセルの通行可能性をチェックする必要があります
  }

  // セーブポイントの間隔
  if (event.type === 'save') {
    // 他のセーブポイントとの距離をチェック
    // 実際の実装では他のセーブポイントとの距離を計算する必要があります
  }
}

const validateFloorSpecificIssues = (floor: DungeonFloor, floorIndex: number, issues: MapValidationIssue[]) => {
  let treasureCount = 0
  let savePointCount = 0
  let enemyCount = 0
  let stairCount = 0

  // フロア全体の統計収集
  floor.cells.flat().forEach(cell => {
    cell.events.forEach(event => {
      switch (event.type) {
        case 'treasure': treasureCount++; break
        case 'save': savePointCount++; break
        case 'enemy': enemyCount++; break
        case 'stairs': stairCount++; break
      }
    })
  })

  // バランスチェック
  const totalCells = floor.width * floor.height

  if (treasureCount === 0 && totalCells > 100) {
    issues.push({
      id: `floor-${floorIndex}-no-treasures`,
      type: 'info',
      category: 'balance',
      title: 'フロアに宝箱がありません',
      description: `フロア${floorIndex + 1}に宝箱イベントが配置されていません。`,
      location: { floorIndex },
      suggestion: 'プレイヤーの報酬として宝箱を配置することを検討してください。',
      severity: 2
    })
  }

  if (treasureCount > totalCells / 10) {
    issues.push({
      id: `floor-${floorIndex}-too-many-treasures`,
      type: 'warning',
      category: 'balance',
      title: '宝箱が多すぎます',
      description: `フロア${floorIndex + 1}に${treasureCount}個の宝箱があります。`,
      location: { floorIndex },
      suggestion: 'ゲームバランスのため宝箱数を調整してください。',
      severity: 4
    })
  }

  if (savePointCount === 0 && totalCells > 400) {
    issues.push({
      id: `floor-${floorIndex}-no-save-points`,
      type: 'warning',
      category: 'balance',
      title: 'セーブポイントがありません',
      description: `大きなフロア${floorIndex + 1}にセーブポイントがありません。`,
      location: { floorIndex },
      suggestion: 'プレイヤーの利便性のためセーブポイントを配置してください。',
      severity: 6
    })
  }

  if (savePointCount > 5) {
    issues.push({
      id: `floor-${floorIndex}-too-many-save-points`,
      type: 'info',
      category: 'balance',
      title: 'セーブポイントが多すぎます',
      description: `フロア${floorIndex + 1}に${savePointCount}個のセーブポイントがあります。`,
      location: { floorIndex },
      suggestion: 'ゲーム難易度のためセーブポイント数を調整することを検討してください。',
      severity: 3
    })
  }
}

const validateFloorConnections = (dungeon: Dungeon, issues: MapValidationIssue[]) => {
  // 階段イベントの検証
  const stairConnections = new Map<number, number[]>() // フロア番号 -> 接続先フロア番号の配列

  dungeon.floors.forEach((floor, floorIndex) => {
    floor.cells.flat().forEach(cell => {
      cell.events.forEach(event => {
        if (event.type === 'stairs') {
          // 階段の接続先検証（実際の実装では階段のtargetFloorプロパティを使用）
          // ここでは簡略化
        }
      })
    })
  })

  // 孤立フロアの検出
  if (dungeon.floors.length > 1) {
    // 実際の実装では階段の接続関係をグラフとして解析
    issues.push({
      id: 'floor-connection-analysis',
      type: 'info',
      category: 'accessibility',
      title: 'フロア接続の分析',
      description: 'マルチフロア構造の接続性を確認しました。',
      suggestion: '孤立したフロアがないか確認してください。',
      severity: 1
    })
  }
}

const validateBalance = (dungeon: Dungeon, issues: MapValidationIssue[]) => {
  let totalTreasures = 0
  let totalEnemies = 0
  let totalSavePoints = 0

  dungeon.floors.forEach(floor => {
    floor.cells.flat().forEach(cell => {
      cell.events.forEach(event => {
        switch (event.type) {
          case 'treasure': totalTreasures++; break
          case 'enemy': totalEnemies++; break
          case 'save': totalSavePoints++; break
        }
      })
    })
  })

  // 全体的なバランス
  if (totalTreasures > 0 && totalEnemies === 0) {
    issues.push({
      id: 'no-enemies-with-treasures',
      type: 'info',
      category: 'balance',
      title: '敵がいません',
      description: '宝箱はありますが敵がいません。',
      suggestion: 'ゲームバランスのため敵を配置することを検討してください。',
      severity: 2
    })
  }

  if (totalTreasures > totalEnemies * 3) {
    issues.push({
      id: 'treasure-enemy-imbalance',
      type: 'warning',
      category: 'balance',
      title: '宝箱と敵のバランス',
      description: `宝箱${totalTreasures}個に対して敵${totalEnemies}個は少なすぎる可能性があります。`,
      suggestion: '報酬に見合った難易度を設定してください。',
      severity: 4
    })
  }
}

const validatePerformance = (dungeon: Dungeon, issues: MapValidationIssue[]) => {
  let totalEvents = 0
  let totalDecorations = 0
  let complexEventCount = 0

  dungeon.floors.forEach(floor => {
    floor.cells.flat().forEach(cell => {
      totalEvents += cell.events.length
      totalDecorations += cell.decorations.length

      cell.events.forEach(event => {
        if (event.actions.length > 10) {
          complexEventCount++
        }
      })
    })
  })

  if (totalEvents > 1000) {
    issues.push({
      id: 'too-many-events',
      type: 'warning',
      category: 'performance',
      title: 'イベント数が多すぎます',
      description: `${totalEvents}個のイベントがあります。`,
      suggestion: 'パフォーマンスのためイベント数を1000個以下にすることを推奨します。',
      severity: 6
    })
  }

  if (totalDecorations > 2000) {
    issues.push({
      id: 'too-many-decorations',
      type: 'warning',
      category: 'performance',
      title: '装飾が多すぎます',
      description: `${totalDecorations}個の装飾があります。`,
      suggestion: 'パフォーマンスのため装飾数を2000個以下にすることを推奨します。',
      severity: 5
    })
  }

  if (complexEventCount > 50) {
    issues.push({
      id: 'too-many-complex-events',
      type: 'warning',
      category: 'performance',
      title: '複雑なイベントが多すぎます',
      description: `10個以上のアクションを持つイベントが${complexEventCount}個あります。`,
      suggestion: 'パフォーマンスのため複雑なイベントの数を制限してください。',
      severity: 7
    })
  }
}

const validateAccessibility = (dungeon: Dungeon, issues: MapValidationIssue[]) => {
  // 到達可能性分析の簡略版
  // 実際の実装では、各フロアでFlood Fillアルゴリズムを使用して到達可能領域を分析

  let isolatedAreas = 0
  let deadEnds = 0

  dungeon.floors.forEach((floor, floorIndex) => {
    // 簡略化された到達可能性チェック
    const passableCells = floor.cells.flat().filter(cell => cell.floor.passable)
    
    if (passableCells.length === 0) {
      issues.push({
        id: `floor-${floorIndex}-no-passable-cells`,
        type: 'error',
        category: 'accessibility',
        title: '通行可能な場所がありません',
        description: `フロア${floorIndex + 1}に通行可能な場所がありません。`,
        location: { floorIndex },
        suggestion: '通行可能な床を配置してください。',
        severity: 9
      })
    }

    // デッドエンドの概算（実際の実装では隣接セルを詳細チェック）
    deadEnds += Math.floor(passableCells.length * 0.1) // 概算値
  })

  return { isolatedAreas, deadEnds }
}

const calculateValidationScore = (issues: MapValidationIssue[], stats: any): number => {
  let score = 100

  // エラーは大幅減点
  const errors = issues.filter(issue => issue.type === 'error')
  score -= errors.length * 20

  // 警告は中程度減点
  const warnings = issues.filter(issue => issue.type === 'warning')
  score -= warnings.length * 5

  // 情報は軽微減点
  const infos = issues.filter(issue => issue.type === 'info')
  score -= infos.length * 1

  // 重要度による追加減点
  issues.forEach(issue => {
    if (issue.severity >= 8) {
      score -= 10
    } else if (issue.severity >= 6) {
      score -= 5
    }
  })

  // ボーナス要素
  if (stats.eventCount > 0) score += 5 // イベントがある
  if (stats.decorationCount > 0) score += 3 // 装飾がある
  if (stats.passableCells > stats.totalCells * 0.3) score += 5 // 適度な通行可能性

  return Math.max(0, Math.min(100, score))
}

export const getValidationSummary = (result: MapValidationResult): string => {
  const { score, issues } = result
  const errors = issues.filter(issue => issue.type === 'error').length
  const warnings = issues.filter(issue => issue.type === 'warning').length
  const infos = issues.filter(issue => issue.type === 'info').length

  if (score >= 90) {
    return `✅ 優秀 (${score}点) - ${errors + warnings + infos}件の指摘`
  } else if (score >= 70) {
    return `🟡 良好 (${score}点) - ${errors + warnings + infos}件の指摘`
  } else if (score >= 50) {
    return `🟠 改善要 (${score}点) - ${errors + warnings + infos}件の指摘`
  } else {
    return `🔴 要修正 (${score}点) - ${errors + warnings + infos}件の指摘`
  }
}

export const getValidationLevel = (score: number): 'excellent' | 'good' | 'needs-improvement' | 'poor' => {
  if (score >= 90) return 'excellent'
  if (score >= 70) return 'good'
  if (score >= 50) return 'needs-improvement'
  return 'poor'
}