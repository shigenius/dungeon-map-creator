import { DungeonEvent, EventAction, EventTrigger } from '../types/map'

export interface GameState {
  flags: Record<string, any>
  inventory: Array<{
    id: string
    name: string
    count: number
  }>
  playerLevel: number
  playerPosition: { x: number; y: number; floor: number }
  time: number
  eventHistory: Array<{
    eventId: string
    timestamp: number
    result: 'success' | 'failed' | 'cancelled'
  }>
}

export interface EventContext {
  gameState: GameState
  currentEvent: DungeonEvent
  triggerData?: Record<string, any>
}

export class EventEngine {
  private gameState: GameState
  // private _eventExecutionStack: Array<{
  //   event: DungeonEvent
  //   actionIndex: number
  //   context: EventContext
  // }> = []

  constructor(initialGameState: GameState) {
    this.gameState = { ...initialGameState }
  }

  // トリガー条件をチェック
  checkTriggerConditions(trigger: EventTrigger, _context: EventContext): boolean {
    if (!trigger.conditions || trigger.conditions.length === 0) {
      return true
    }

    return trigger.conditions.every(condition => {
      switch (condition.type) {
        case 'flag':
          return this.checkFlagCondition(condition.key || '', condition.operator, condition.value)
        case 'item':
          return this.checkItemCondition(condition.key || '', condition.operator, condition.value)
        case 'level':
          return this.checkLevelCondition(condition.operator, condition.value)
        case 'time':
          return this.checkTimeCondition(condition.operator, condition.value)
        case 'random':
          return Math.random() < (condition.probability || 0.5)
        case 'custom':
          return this.checkCustomCondition(condition.key!, condition.value)
        default:
          return false
      }
    })
  }

  // フラグ条件チェック
  private checkFlagCondition(key: string, operator: string, value: any): boolean {
    const flagValue = this.gameState.flags[key]
    
    switch (operator) {
      case '==': return flagValue === value
      case '!=': return flagValue !== value
      case '>': return flagValue > value
      case '<': return flagValue < value
      case '>=': return flagValue >= value
      case '<=': return flagValue <= value
      case 'has': return flagValue !== undefined && flagValue !== null
      case 'not_has': return flagValue === undefined || flagValue === null
      default: return false
    }
  }

  // アイテム条件チェック
  private checkItemCondition(itemId: string, operator: string, count: number): boolean {
    const item = this.gameState.inventory.find(i => i.id === itemId)
    const itemCount = item ? item.count : 0
    
    switch (operator) {
      case '==': return itemCount === count
      case '!=': return itemCount !== count
      case '>': return itemCount > count
      case '<': return itemCount < count
      case '>=': return itemCount >= count
      case '<=': return itemCount <= count
      case 'has': return itemCount > 0
      case 'not_has': return itemCount === 0
      default: return false
    }
  }

  // レベル条件チェック
  private checkLevelCondition(operator: string, level: number): boolean {
    switch (operator) {
      case '==': return this.gameState.playerLevel === level
      case '!=': return this.gameState.playerLevel !== level
      case '>': return this.gameState.playerLevel > level
      case '<': return this.gameState.playerLevel < level
      case '>=': return this.gameState.playerLevel >= level
      case '<=': return this.gameState.playerLevel <= level
      default: return false
    }
  }

  // 時間条件チェック
  private checkTimeCondition(operator: string, time: number): boolean {
    switch (operator) {
      case '==': return this.gameState.time === time
      case '!=': return this.gameState.time !== time
      case '>': return this.gameState.time > time
      case '<': return this.gameState.time < time
      case '>=': return this.gameState.time >= time
      case '<=': return this.gameState.time <= time
      default: return false
    }
  }

  // カスタム条件チェック（拡張可能）
  private checkCustomCondition(key: string, value: any): boolean {
    // カスタムロジックを実装
    console.log(`カスタム条件チェック: ${key} = ${value}`)
    return true
  }

  // イベント実行
  async executeEvent(event: DungeonEvent, triggerData?: Record<string, any>): Promise<'success' | 'failed' | 'cancelled'> {
    const context: EventContext = {
      gameState: this.gameState,
      currentEvent: event,
      triggerData
    }

    // トリガー条件チェック
    if (!this.checkTriggerConditions(event.trigger, context)) {
      return 'failed'
    }

    // リピートポリシーチェック
    if (!this.checkRepeatPolicy(event)) {
      return 'cancelled'
    }

    try {
      // アクションチェーン実行
      const result = await this.executeActionChain(event.actions, context)
      
      // イベント履歴に記録
      this.gameState.eventHistory.push({
        eventId: event.id,
        timestamp: Date.now(),
        result
      })

      return result
    } catch (error) {
      console.error('イベント実行エラー:', error)
      return 'failed'
    }
  }

  // リピートポリシーチェック
  private checkRepeatPolicy(event: DungeonEvent): boolean {
    const { type, maxCount } = event.trigger.repeatPolicy
    const executionCount = this.gameState.eventHistory.filter(h => h.eventId === event.id).length

    switch (type) {
      case 'once':
        return executionCount === 0
      case 'always':
        return true
      case 'count':
        return maxCount ? executionCount < maxCount : true
      case 'daily':
        // 日付ベースのチェック（簡単な実装）
        const today = new Date().toDateString()
        const todayExecutions = this.gameState.eventHistory.filter(h => 
          h.eventId === event.id && 
          new Date(h.timestamp).toDateString() === today
        )
        return todayExecutions.length === 0
      default:
        return true
    }
  }

  // アクションチェーン実行
  private async executeActionChain(actions: EventAction[], context: EventContext): Promise<'success' | 'failed' | 'cancelled'> {
    let currentActionId: string | undefined = actions[0]?.id
    
    while (currentActionId) {
      const action = actions.find(a => a.id === currentActionId)
      if (!action) break

      // アクション条件チェック
      if (action.conditions && !this.checkActionConditions(action, context)) {
        currentActionId = action.nextActionId
        continue
      }

      // アクション実行
      const result = await this.executeAction(action, context)
      if (result === 'failed' || result === 'cancelled') {
        return result
      }

      // 次のアクション決定
      if (action.branchActions && action.branchActions.length > 0) {
        // 条件分岐
        const branch = action.branchActions.find(b => this.checkBranchCondition(b.conditionId, context))
        currentActionId = branch ? branch.actionId : action.nextActionId
      } else {
        currentActionId = action.nextActionId
      }
    }

    return 'success'
  }

  // アクション条件チェック
  private checkActionConditions(action: EventAction, _context: EventContext): boolean {
    if (!action.conditions || action.conditions.length === 0) {
      return true
    }

    return action.conditions.every(condition => {
      switch (condition.type) {
        case 'flag':
          return this.checkFlagCondition(condition.key || '', condition.operator, condition.value)
        case 'item':
          return this.checkItemCondition(condition.key || '', condition.operator, condition.value)
        case 'level':
          return this.checkLevelCondition(condition.operator, condition.value)
        case 'random':
          return Math.random() < (condition.probability || 0.5)
        default:
          return false
      }
    })
  }

  // 分岐条件チェック
  private checkBranchCondition(_conditionId: string, _context: EventContext): boolean {
    // 分岐条件の具体的な実装
    return true
  }

  // 個別アクション実行
  private async executeAction(action: EventAction, _context: EventContext): Promise<'success' | 'failed' | 'cancelled'> {
    console.log(`アクション実行: ${action.type}`, action.params)

    switch (action.type) {
      case 'message':
        return this.executeMessageAction(action.params)
      case 'treasure':
        return this.executeTreasureAction(action.params)
      case 'flag':
        return this.executeFlagAction(action.params)
      case 'item':
        return this.executeItemAction(action.params)
      case 'heal':
        return this.executeHealAction(action.params)
      case 'damage':
        return this.executeDamageAction(action.params)
      case 'warp':
        return this.executeWarpAction(action.params)
      case 'battle':
        return this.executeBattleAction(action.params)
      case 'save':
        return this.executeSaveAction(action.params)
      case 'sound':
        return this.executeSoundAction(action.params)
      default:
        console.warn(`未実装のアクションタイプ: ${action.type}`)
        return 'success'
    }
  }

  // メッセージアクション
  private async executeMessageAction(params: Record<string, any>): Promise<'success' | 'failed' | 'cancelled'> {
    const { text, title } = params
    console.log(`メッセージ: ${title || 'システム'}: ${text}`)
    // 実際のゲームではUIにメッセージを表示
    return 'success'
  }

  // 宝箱アクション
  private async executeTreasureAction(params: Record<string, any>): Promise<'success' | 'failed' | 'cancelled'> {
    const { items, gold, experience } = params
    console.log(`宝箱から取得: アイテム=${JSON.stringify(items)}, ゴールド=${gold}, 経験値=${experience}`)
    
    // アイテム追加
    if (items && Array.isArray(items)) {
      items.forEach(item => this.addItem(item.id, item.count || 1))
    }
    
    return 'success'
  }

  // フラグアクション
  private async executeFlagAction(params: Record<string, any>): Promise<'success' | 'failed' | 'cancelled'> {
    const { operation, key, value } = params
    
    switch (operation) {
      case 'set':
        this.gameState.flags[key] = value
        break
      case 'add':
        this.gameState.flags[key] = (this.gameState.flags[key] || 0) + value
        break
      case 'delete':
        delete this.gameState.flags[key]
        break
    }
    
    console.log(`フラグ操作: ${operation} ${key} = ${value}`)
    return 'success'
  }

  // アイテムアクション
  private async executeItemAction(params: Record<string, any>): Promise<'success' | 'failed' | 'cancelled'> {
    const { operation, itemId, count } = params
    
    switch (operation) {
      case 'add':
        this.addItem(itemId, count || 1)
        break
      case 'remove':
        this.removeItem(itemId, count || 1)
        break
    }
    
    console.log(`アイテム操作: ${operation} ${itemId} x${count}`)
    return 'success'
  }

  // その他のアクション実装（簡略化）
  private async executeHealAction(params: Record<string, any>): Promise<'success' | 'failed' | 'cancelled'> {
    console.log(`回復アクション: ${JSON.stringify(params)}`)
    return 'success'
  }

  private async executeDamageAction(params: Record<string, any>): Promise<'success' | 'failed' | 'cancelled'> {
    console.log(`ダメージアクション: ${JSON.stringify(params)}`)
    return 'success'
  }

  private async executeWarpAction(params: Record<string, any>): Promise<'success' | 'failed' | 'cancelled'> {
    console.log(`ワープアクション: ${JSON.stringify(params)}`)
    return 'success'
  }

  private async executeBattleAction(params: Record<string, any>): Promise<'success' | 'failed' | 'cancelled'> {
    console.log(`戦闘アクション: ${JSON.stringify(params)}`)
    return 'success'
  }

  private async executeSaveAction(params: Record<string, any>): Promise<'success' | 'failed' | 'cancelled'> {
    console.log(`セーブアクション: ${JSON.stringify(params)}`)
    return 'success'
  }

  private async executeSoundAction(params: Record<string, any>): Promise<'success' | 'failed' | 'cancelled'> {
    console.log(`サウンドアクション: ${JSON.stringify(params)}`)
    return 'success'
  }

  // ユーティリティメソッド
  private addItem(itemId: string, count: number): void {
    const existingItem = this.gameState.inventory.find(i => i.id === itemId)
    if (existingItem) {
      existingItem.count += count
    } else {
      this.gameState.inventory.push({
        id: itemId,
        name: `Item ${itemId}`,
        count
      })
    }
  }

  private removeItem(itemId: string, count: number): void {
    const item = this.gameState.inventory.find(i => i.id === itemId)
    if (item) {
      item.count = Math.max(0, item.count - count)
      if (item.count === 0) {
        this.gameState.inventory = this.gameState.inventory.filter(i => i.id !== itemId)
      }
    }
  }

  // ゲーム状態取得
  getGameState(): GameState {
    return { ...this.gameState }
  }

  // ゲーム状態更新
  updateGameState(newState: Partial<GameState>): void {
    this.gameState = { ...this.gameState, ...newState }
  }
}