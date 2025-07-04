import { DungeonEvent, EventAction, EventTrigger } from '../types/map'

export interface EventValidationError {
  field: string
  message: string
  severity: 'error' | 'warning' | 'info'
  suggestion?: string
}

export interface EventValidationResult {
  isValid: boolean
  errors: EventValidationError[]
  warnings: EventValidationError[]
  info: EventValidationError[]
}

export const validateEvent = (event: DungeonEvent | null): EventValidationResult => {
  const errors: EventValidationError[] = []
  const warnings: EventValidationError[] = []
  const info: EventValidationError[] = []

  if (!event) {
    errors.push({
      field: 'event',
      message: 'イベントデータが存在しません',
      severity: 'error'
    })
    return { isValid: false, errors, warnings, info }
  }

  // 必須フィールドの検証
  validateRequiredFields(event, errors)
  
  // 名前の検証
  validateEventName(event, errors, warnings)
  
  // 位置の検証
  validatePosition(event, errors, warnings)
  
  // 外観の検証
  validateAppearance(event, warnings, info)
  
  // トリガーの検証
  validateTrigger(event.trigger, errors, warnings)
  
  // アクションの検証
  validateActions(event.actions, errors, warnings, info)
  
  // 優先度の検証
  validatePriority(event, warnings)
  
  // フラグの検証
  validateFlags(event, warnings)
  
  // 組み合わせの検証
  validateCombinations(event, warnings, info)

  const isValid = errors.length === 0

  return { isValid, errors, warnings, info }
}

const validateRequiredFields = (event: DungeonEvent, errors: EventValidationError[]) => {
  if (!event.id || event.id.trim() === '') {
    errors.push({
      field: 'id',
      message: 'イベントIDが必要です',
      severity: 'error'
    })
  }

  if (!event.name || event.name.trim() === '') {
    errors.push({
      field: 'name',
      message: 'イベント名が必要です',
      severity: 'error',
      suggestion: '分かりやすい名前を付けてください（例: 宝箱、セーブポイント）'
    })
  }

  if (!event.type) {
    errors.push({
      field: 'type',
      message: 'イベントタイプが必要です',
      severity: 'error'
    })
  }
}

const validateEventName = (event: DungeonEvent, errors: EventValidationError[], warnings: EventValidationError[]) => {
  if (event.name) {
    if (event.name.length > 50) {
      warnings.push({
        field: 'name',
        message: 'イベント名が長すぎます（50文字以下推奨）',
        severity: 'warning',
        suggestion: 'より短い名前に変更することを検討してください'
      })
    }

    if (event.name.length < 2) {
      warnings.push({
        field: 'name',
        message: 'イベント名が短すぎます',
        severity: 'warning',
        suggestion: 'より分かりやすい名前を付けてください'
      })
    }

    // 特殊文字の検証
    if (/[<>"|\\]/.test(event.name)) {
      warnings.push({
        field: 'name',
        message: 'イベント名に使用できない文字が含まれています',
        severity: 'warning',
        suggestion: '< > " | \\ などの文字は避けてください'
      })
    }
  }
}

const validatePosition = (event: DungeonEvent, errors: EventValidationError[], warnings: EventValidationError[]) => {
  if (!event.position) {
    errors.push({
      field: 'position',
      message: 'イベントの位置が設定されていません',
      severity: 'error'
    })
    return
  }

  const { x, y } = event.position

  if (typeof x !== 'number' || typeof y !== 'number') {
    errors.push({
      field: 'position',
      message: '位置の座標が正しくありません',
      severity: 'error'
    })
    return
  }

  if (x < 0 || y < 0) {
    errors.push({
      field: 'position',
      message: '位置の座標は0以上である必要があります',
      severity: 'error'
    })
  }

  if (x > 100 || y > 100) {
    warnings.push({
      field: 'position',
      message: '位置が通常のマップサイズを超えています',
      severity: 'warning',
      suggestion: 'マップサイズ内の座標に設定してください'
    })
  }
}

const validateAppearance = (event: DungeonEvent, warnings: EventValidationError[], info: EventValidationError[]) => {
  if (!event.appearance) {
    warnings.push({
      field: 'appearance',
      message: '外観設定がありません',
      severity: 'warning',
      suggestion: 'アイコンや色を設定すると視認性が向上します'
    })
    return
  }

  const { color, icon, visible } = event.appearance

  if (visible && !color && !icon) {
    info.push({
      field: 'appearance',
      message: '色またはアイコンを設定することを推奨します',
      severity: 'info',
      suggestion: 'イベントを識別しやすくなります'
    })
  }

  if (color && !/^#[0-9A-Fa-f]{6}$/.test(color)) {
    warnings.push({
      field: 'appearance.color',
      message: '色の形式が正しくありません',
      severity: 'warning',
      suggestion: '#RRGGBB形式で入力してください（例: #ff0000）'
    })
  }

  if (icon && icon.length > 10) {
    warnings.push({
      field: 'appearance.icon',
      message: 'アイコンが長すぎます',
      severity: 'warning',
      suggestion: '絵文字1文字または短いテキストを使用してください'
    })
  }
}

const validateTrigger = (trigger: EventTrigger, errors: EventValidationError[], warnings: EventValidationError[]) => {
  if (!trigger) {
    errors.push({
      field: 'trigger',
      message: 'トリガー設定が必要です',
      severity: 'error'
    })
    return
  }

  if (!trigger.type) {
    errors.push({
      field: 'trigger.type',
      message: 'トリガータイプが必要です',
      severity: 'error'
    })
  }

  // リピートポリシーの検証
  if (!trigger.repeatPolicy) {
    warnings.push({
      field: 'trigger.repeatPolicy',
      message: 'リピートポリシーが設定されていません',
      severity: 'warning',
      suggestion: '実行回数を制限するか設定してください'
    })
  } else {
    if (trigger.repeatPolicy.type === 'count' && (!trigger.repeatPolicy.maxCount || trigger.repeatPolicy.maxCount <= 0)) {
      errors.push({
        field: 'trigger.repeatPolicy.maxCount',
        message: '回数制限が正しく設定されていません',
        severity: 'error',
        suggestion: '1以上の数値を設定してください'
      })
    }
  }

  // 条件の検証
  if (trigger.conditions && trigger.conditions.length > 0) {
    trigger.conditions.forEach((condition, index) => {
      if (!condition.type) {
        errors.push({
          field: `trigger.conditions[${index}].type`,
          message: `条件${index + 1}のタイプが設定されていません`,
          severity: 'error'
        })
      }

      if (condition.type === 'flag' && !condition.flagName) {
        errors.push({
          field: `trigger.conditions[${index}].flagName`,
          message: `条件${index + 1}のフラグ名が設定されていません`,
          severity: 'error'
        })
      }
    })
  }
}

const validateActions = (actions: EventAction[], errors: EventValidationError[], warnings: EventValidationError[], info: EventValidationError[]) => {
  if (!actions || actions.length === 0) {
    warnings.push({
      field: 'actions',
      message: 'アクションが設定されていません',
      severity: 'warning',
      suggestion: '少なくとも1つのアクションを追加してください'
    })
    return
  }

  if (actions.length > 20) {
    warnings.push({
      field: 'actions',
      message: 'アクションが多すぎます',
      severity: 'warning',
      suggestion: 'パフォーマンスのため20個以下にすることを推奨します'
    })
  }

  actions.forEach((action, index) => {
    validateSingleAction(action, index, errors, warnings, info)
  })

  // アクションの組み合わせ検証
  validateActionCombinations(actions, warnings, info)
}

const validateSingleAction = (action: EventAction, index: number, errors: EventValidationError[], warnings: EventValidationError[], info: EventValidationError[]) => {
  if (!action.id) {
    errors.push({
      field: `actions[${index}].id`,
      message: `アクション${index + 1}のIDが必要です`,
      severity: 'error'
    })
  }

  if (!action.type) {
    errors.push({
      field: `actions[${index}].type`,
      message: `アクション${index + 1}のタイプが必要です`,
      severity: 'error'
    })
    return
  }

  // アクションタイプ別の検証
  switch (action.type) {
    case 'message':
      if (!action.params?.text || action.params.text.trim() === '') {
        errors.push({
          field: `actions[${index}].params.text`,
          message: `メッセージアクション${index + 1}のテキストが必要です`,
          severity: 'error'
        })
      } else if (action.params.text.length > 500) {
        warnings.push({
          field: `actions[${index}].params.text`,
          message: `メッセージアクション${index + 1}のテキストが長すぎます`,
          severity: 'warning',
          suggestion: '500文字以下にすることを推奨します'
        })
      }
      break

    case 'warp':
      if (typeof action.params?.x !== 'number' || typeof action.params?.y !== 'number') {
        errors.push({
          field: `actions[${index}].params`,
          message: `ワープアクション${index + 1}の座標が正しくありません`,
          severity: 'error'
        })
      }
      break

    case 'item':
      if (!action.params?.itemId) {
        errors.push({
          field: `actions[${index}].params.itemId`,
          message: `アイテムアクション${index + 1}のアイテムIDが必要です`,
          severity: 'error'
        })
      }
      if (!action.params?.count || action.params.count <= 0) {
        errors.push({
          field: `actions[${index}].params.count`,
          message: `アイテムアクション${index + 1}の個数が正しくありません`,
          severity: 'error'
        })
      }
      break

    case 'flag':
      if (!action.params?.flagName) {
        errors.push({
          field: `actions[${index}].params.flagName`,
          message: `フラグアクション${index + 1}のフラグ名が必要です`,
          severity: 'error'
        })
      }
      break

    case 'battle':
      if (!action.params?.enemyId) {
        warnings.push({
          field: `actions[${index}].params.enemyId`,
          message: `戦闘アクション${index + 1}の敵IDが設定されていません`,
          severity: 'warning'
        })
      }
      break

    case 'conditional':
      if (!action.params?.conditions || action.params.conditions.length === 0) {
        errors.push({
          field: `actions[${index}].params.conditions`,
          message: `条件分岐アクション${index + 1}の条件が設定されていません`,
          severity: 'error'
        })
      }
      break
  }
}

const validateActionCombinations = (actions: EventAction[], warnings: EventValidationError[], info: EventValidationError[]) => {
  const actionTypes = actions.map(action => action.type)

  // 重複する戦闘アクション
  const battleActions = actionTypes.filter(type => type === 'battle')
  if (battleActions.length > 1) {
    warnings.push({
      field: 'actions',
      message: '複数の戦闘アクションが設定されています',
      severity: 'warning',
      suggestion: '通常は1つの戦闘アクションで十分です'
    })
  }

  // セーブアクションの位置
  const saveActionIndex = actionTypes.indexOf('save')
  if (saveActionIndex >= 0 && saveActionIndex < actions.length - 1) {
    info.push({
      field: 'actions',
      message: 'セーブアクションの後に他のアクションがあります',
      severity: 'info',
      suggestion: 'セーブアクションは通常最後に配置します'
    })
  }

  // メッセージの連続
  let consecutiveMessages = 0
  let maxConsecutiveMessages = 0
  actionTypes.forEach(type => {
    if (type === 'message') {
      consecutiveMessages++
      maxConsecutiveMessages = Math.max(maxConsecutiveMessages, consecutiveMessages)
    } else {
      consecutiveMessages = 0
    }
  })

  if (maxConsecutiveMessages > 3) {
    info.push({
      field: 'actions',
      message: 'メッセージアクションが連続しています',
      severity: 'info',
      suggestion: '長いメッセージは1つのアクションにまとめることを検討してください'
    })
  }
}

const validatePriority = (event: DungeonEvent, warnings: EventValidationError[]) => {
  if (typeof event.priority !== 'number') {
    warnings.push({
      field: 'priority',
      message: '優先度が数値ではありません',
      severity: 'warning',
      suggestion: '1-10の範囲で設定してください'
    })
  } else if (event.priority < 1 || event.priority > 10) {
    warnings.push({
      field: 'priority',
      message: '優先度が推奨範囲外です',
      severity: 'warning',
      suggestion: '1-10の範囲で設定することを推奨します'
    })
  }
}

const validateFlags = (event: DungeonEvent, warnings: EventValidationError[]) => {
  if (event.flags && typeof event.flags === 'object') {
    const flagCount = Object.keys(event.flags).length
    if (flagCount > 50) {
      warnings.push({
        field: 'flags',
        message: 'フラグが多すぎます',
        severity: 'warning',
        suggestion: 'パフォーマンスのため50個以下にすることを推奨します'
      })
    }

    // フラグ名の検証
    Object.keys(event.flags).forEach(flagName => {
      if (flagName.length > 100) {
        warnings.push({
          field: 'flags',
          message: `フラグ名 "${flagName}" が長すぎます`,
          severity: 'warning',
          suggestion: '100文字以下にしてください'
        })
      }

      if (!/^[a-zA-Z0-9_-]+$/.test(flagName)) {
        warnings.push({
          field: 'flags',
          message: `フラグ名 "${flagName}" に使用できない文字が含まれています`,
          severity: 'warning',
          suggestion: '英数字、アンダースコア、ハイフンのみ使用してください'
        })
      }
    })
  }
}

const validateCombinations = (event: DungeonEvent, warnings: EventValidationError[], info: EventValidationError[]) => {
  // イベントタイプとトリガーの組み合わせ
  if (event.type === 'treasure' && event.trigger.type !== 'interact') {
    info.push({
      field: 'combination',
      message: '宝箱イベントには通常「調べる」トリガーを使用します',
      severity: 'info'
    })
  }

  if (event.type === 'enemy' && !['contact', 'interact', 'step'].includes(event.trigger.type)) {
    info.push({
      field: 'combination',
      message: '敵イベントには通常「接触」「調べる」「踏む」トリガーを使用します',
      severity: 'info'
    })
  }

  if (event.type === 'stairs' && event.trigger.type !== 'interact') {
    info.push({
      field: 'combination',
      message: '階段イベントには通常「調べる」トリガーを使用します',
      severity: 'info'
    })
  }

  // 自動実行トリガーでの注意
  if (event.trigger.type === 'auto' && event.trigger.repeatPolicy?.type === 'always') {
    warnings.push({
      field: 'combination',
      message: '自動実行で常に実行する設定は注意が必要です',
      severity: 'warning',
      suggestion: '無限ループを避けるため条件を設定してください'
    })
  }

  // 外観設定とイベントタイプの組み合わせ
  if (event.appearance?.visible === false && event.trigger.type === 'interact') {
    warnings.push({
      field: 'combination',
      message: '非表示イベントに「調べる」トリガーが設定されています',
      severity: 'warning',
      suggestion: 'プレイヤーが見つけられない可能性があります'
    })
  }
}

export const getValidationSummary = (result: EventValidationResult): string => {
  const { errors, warnings, info } = result
  
  if (errors.length === 0 && warnings.length === 0 && info.length === 0) {
    return '✅ 問題ありません'
  }

  const parts = []
  if (errors.length > 0) {
    parts.push(`❌ エラー: ${errors.length}件`)
  }
  if (warnings.length > 0) {
    parts.push(`⚠️ 警告: ${warnings.length}件`)
  }
  if (info.length > 0) {
    parts.push(`ℹ️ 情報: ${info.length}件`)
  }

  return parts.join(', ')
}