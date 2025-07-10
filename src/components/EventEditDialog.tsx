import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  FormControlLabel,
  Switch,
  Box,
  Typography,
  Tabs,
  Tab,
  Grid,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Divider,
  List,
  ListItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Slider,
  Alert,
  AlertTitle,
} from '@mui/material'
import {
  Close as CloseIcon,
  Event as EventIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  ContentCopy as TemplateIcon,
} from '@mui/icons-material'
import { DungeonEvent, EventType, TriggerType, ActionType, EventAction, EventPosition, EventPlacementType, Direction } from '../types/map'
import EventTemplateDialog from './EventTemplateDialog'
import { EventTemplate } from '../data/eventTemplates'
import { useSelector } from 'react-redux'
import { RootState } from '../store'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  )
}

interface EventEditDialogProps {
  open: boolean
  event: DungeonEvent | null
  onClose: () => void
  onSave: (event: DungeonEvent) => void
  onDelete?: (eventId: string) => void
}

const EventEditDialog: React.FC<EventEditDialogProps> = ({
  open,
  event,
  onClose,
  onSave,
  onDelete
}) => {
  const [tabValue, setTabValue] = useState(0)
  const [editingEvent, setEditingEvent] = useState<DungeonEvent | null>(null)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [idError, setIdError] = useState<string>('')
  
  // Redux から全フロア情報を取得
  const { dungeon } = useSelector((state: RootState) => state.map)

  // ID重複チェック関数
  const checkIdDuplicate = (newId: string): string => {
    if (!dungeon || !newId.trim()) return ''
    
    // 現在編集中のイベントのIDと同じ場合は重複でない
    if (event && event.id === newId) return ''
    
    // 全フロアの全イベントをチェック
    for (const floor of dungeon.floors) {
      for (const row of floor.cells) {
        for (const cell of row) {
          for (const existingEvent of cell.events) {
            if (existingEvent.id === newId) {
              return `ID "${newId}" は既に使用されています`
            }
          }
        }
      }
    }
    
    // フロアIDとの重複もチェック
    for (const floor of dungeon.floors) {
      if (floor.id === newId) {
        return `ID "${newId}" はフロアIDとして使用されています`
      }
    }
    
    return ''
  }

  // ID更新ハンドラー
  const handleIdChange = (newId: string) => {
    // 常に入力値を更新
    updateEvent('id', newId)
    // エラーチェックは入力値とは独立して行う
    const error = checkIdDuplicate(newId)
    setIdError(error)
  }

  useEffect(() => {
    // console.log('EventEditDialog useEffect実行:', { 
    //   eventProp: event?.id || 'null', 
    //   eventName: event?.name || 'null',
    //   open 
    // })
    
    if (event) {
      // console.log('EventEditDialog: 既存イベント編集モード', { eventId: event.id, eventName: event.name })
      setEditingEvent({ ...event })
    } else if (open) {
      // ダイアログが開いている場合のみ新規イベントを作成
      const newId = crypto.randomUUID()
      // console.log('EventEditDialog: 新規イベント作成モード、新しいID生成:', newId)
      setEditingEvent({
        id: newId,
        type: 'treasure',
        name: '新しいイベント',
        description: '',
        position: { x: 0, y: 0, placement: 'floor' },
        appearance: {
          visible: true,
          color: '#ffd700',
          icon: '⭐',
          direction: 'none'
        },
        trigger: {
          type: 'interact',
          repeatPolicy: { type: 'once' }
        },
        actions: [],
        properties: {},
        flags: {},
        enabled: true,
        priority: 1,
        metadata: {
          created: new Date().toISOString(),
          modified: new Date().toISOString()
        }
      })
    } else {
      // ダイアログが閉じている場合はeditingEventをクリア
      // console.log('EventEditDialog: ダイアログが閉じているため、editingEventをクリア')
      setEditingEvent(null)
    }
  }, [event, open])


  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handleSave = () => {
    console.log('EventEditDialog handleSave実行:', {
      hasEditingEvent: !!editingEvent,
      editingEventId: editingEvent?.id,
      editingEventName: editingEvent?.name
    })
    
    if (editingEvent) {
      // ID重複チェック
      const error = checkIdDuplicate(editingEvent.id)
      if (error) {
        setIdError(error)
        return
      }
      
      const updatedEvent = {
        ...editingEvent,
        metadata: {
          ...editingEvent.metadata,
          modified: new Date().toISOString()
        }
      }
      console.log('EventEditDialog handleSave: onSave呼び出し前', {
        eventId: updatedEvent.id,
        eventName: updatedEvent.name
      })
      onSave(updatedEvent)
      onClose()
    }
  }

  const handleDelete = () => {
    if (editingEvent && onDelete) {
      onDelete(editingEvent.id)
      onClose()
    }
  }

  const updateEvent = (field: string, value: any) => {
    if (editingEvent) {
      setEditingEvent({ ...editingEvent, [field]: value })
    }
  }

  const updateAppearance = (field: string, value: any) => {
    if (editingEvent) {
      setEditingEvent({
        ...editingEvent,
        appearance: { ...editingEvent.appearance, [field]: value }
      })
    }
  }

  const updateTrigger = (field: string, value: any) => {
    if (editingEvent) {
      setEditingEvent({
        ...editingEvent,
        trigger: { ...editingEvent.trigger, [field]: value }
      })
    }
  }

  const addAction = () => {
    if (editingEvent) {
      const newAction: EventAction = {
        id: crypto.randomUUID(),
        type: 'message',
        params: { text: 'メッセージを入力してください' }
      }
      setEditingEvent({
        ...editingEvent,
        actions: [...editingEvent.actions, newAction]
      })
    }
  }

  const updateAction = (index: number, field: string, value: any) => {
    if (editingEvent) {
      const newActions = [...editingEvent.actions]
      newActions[index] = { ...newActions[index], [field]: value }
      setEditingEvent({ ...editingEvent, actions: newActions })
    }
  }

  const removeAction = (index: number) => {
    if (editingEvent) {
      const newActions = editingEvent.actions.filter((_, i) => i !== index)
      setEditingEvent({ ...editingEvent, actions: newActions })
    }
  }

  const handleTemplateSelect = (template: EventTemplate) => {
    if (editingEvent && template.presetEvent) {
      const now = new Date().toISOString()
      const templateEvent = template.presetEvent
      
      // テンプレートから新しいイベントデータを作成
      const newEvent: DungeonEvent = {
        ...editingEvent, // 現在のIDと位置は保持
        type: templateEvent.type || editingEvent.type,
        name: templateEvent.name || editingEvent.name,
        description: templateEvent.description || editingEvent.description,
        appearance: {
          ...editingEvent.appearance,
          ...templateEvent.appearance
        },
        trigger: templateEvent.trigger || editingEvent.trigger,
        actions: templateEvent.actions ? [...templateEvent.actions] : editingEvent.actions,
        enabled: templateEvent.enabled !== undefined ? templateEvent.enabled : editingEvent.enabled,
        priority: templateEvent.priority !== undefined ? templateEvent.priority : editingEvent.priority,
        flags: templateEvent.flags || editingEvent.flags,
        metadata: {
          ...editingEvent.metadata,
          modified: now,
          version: (editingEvent.metadata.version || 0) + 1
        }
      }
      
      setEditingEvent(newEvent)
      setShowTemplateDialog(false)
    }
  }

  const getEventTypeLabel = (type: EventType) => {
    const labels: Record<EventType, string> = {
      treasure: '宝箱',
      npc: 'NPC',
      stairs: '階段',
      enemy: '敵',
      save: 'セーブポイント',
      heal: '回復ポイント',
      switch: 'スイッチ',
      sign: '看板',
      harvest: '採取ポイント',
      custom: 'カスタム'
    }
    return labels[type] || type
  }

  const getTriggerTypeLabel = (type: TriggerType) => {
    const labels: Record<TriggerType, string> = {
      auto: '自動実行',
      interact: '調べる',
      contact: '接触',
      item: 'アイテム使用',
      step: '踏む',
      time: '時間経過',
      flag: 'フラグ条件',
      random: 'ランダム',
      battle: '戦闘後',
      combo: '複合条件',
      custom: 'カスタム'
    }
    return labels[type] || type
  }

  const getActionTypeLabel = (type: ActionType) => {
    const labels: Record<ActionType, string> = {
      message: 'メッセージ表示',
      treasure: '宝箱開封',
      battle: '戦闘開始',
      move: '移動',
      warp: 'ワープ',
      heal: '回復',
      damage: 'ダメージ',
      item: 'アイテム取得/使用',
      flag: 'フラグ操作',
      shop: 'ショップ開始',
      save: 'セーブ',
      sound: '効果音',
      cutscene: 'カットシーン',
      conditional: '条件分岐',
      loop: 'ループ',
      custom: 'カスタムアクション'
    }
    return labels[type] || type
  }


  if (!editingEvent) return null

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { minHeight: '80vh', maxHeight: '90vh' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <EventIcon />
        イベント編集: {editingEvent.name}
        <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<TemplateIcon />}
            onClick={() => setShowTemplateDialog(true)}
          >
            テンプレート
          </Button>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ px: 0 }}>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
          <Tab label="基本設定" />
          <Tab label="外観" />
          <Tab label="トリガー" />
          <Tab label="アクション" />
          <Tab label="詳細設定" />
        </Tabs>


        <Box sx={{ px: 3 }}>
          {/* 基本設定タブ */}
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="イベント名"
                  value={editingEvent.name}
                  onChange={(e) => updateEvent('name', e.target.value)}
                  margin="normal"
                  required
                />
                <TextField
                  fullWidth
                  label="イベントID"
                  value={editingEvent.id}
                  onChange={(e) => handleIdChange(e.target.value)}
                  margin="normal"
                  error={!!idError}
                  helperText={idError || 'ユニークなIDを設定してください'}
                  required
                />
                <TextField
                  fullWidth
                  label="説明"
                  value={editingEvent.description || ''}
                  onChange={(e) => updateEvent('description', e.target.value)}
                  margin="normal"
                  multiline
                  rows={3}
                />
                <FormControl fullWidth margin="normal">
                  <InputLabel>イベントタイプ</InputLabel>
                  <Select
                    value={editingEvent.type}
                    onChange={(e) => updateEvent('type', e.target.value)}
                    label="イベントタイプ"
                  >
                    {(['treasure', 'npc', 'stairs', 'enemy', 'save', 'heal', 'switch', 'sign', 'harvest', 'custom'] as EventType[]).map((type) => (
                      <MenuItem key={type} value={type}>
                        {getEventTypeLabel(type)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                  位置
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <TextField
                    label="X座標"
                    type="number"
                    value={editingEvent.position.x}
                    onChange={(e) => updateEvent('position', { ...editingEvent.position, x: parseInt(e.target.value) })}
                    size="small"
                  />
                  <TextField
                    label="Y座標"
                    type="number"
                    value={editingEvent.position.y}
                    onChange={(e) => updateEvent('position', { ...editingEvent.position, y: parseInt(e.target.value) })}
                    size="small"
                  />
                </Box>
                
                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel>配置タイプ</InputLabel>
                  <Select
                    value={editingEvent.position.placement}
                    onChange={(e) => updateEvent('position', { 
                      ...editingEvent.position, 
                      placement: e.target.value as EventPlacementType,
                      wallDirection: e.target.value === 'wall' ? 'north' : undefined
                    })}
                    label="配置タイプ"
                  >
                    <MenuItem value="floor">床に配置</MenuItem>
                    <MenuItem value="wall">壁に配置</MenuItem>
                    <MenuItem value="center">セル中央に配置</MenuItem>
                  </Select>
                </FormControl>
                
                {editingEvent.position.placement === 'wall' && (
                  <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                    <InputLabel>壁の方向</InputLabel>
                    <Select
                      value={editingEvent.position.wallDirection || 'north'}
                      onChange={(e) => updateEvent('position', { 
                        ...editingEvent.position, 
                        wallDirection: e.target.value as Direction
                      })}
                      label="壁の方向"
                    >
                      <MenuItem value="north">北壁</MenuItem>
                      <MenuItem value="east">東壁</MenuItem>
                      <MenuItem value="south">南壁</MenuItem>
                      <MenuItem value="west">西壁</MenuItem>
                    </Select>
                  </FormControl>
                )}
                
                <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>
                  優先度
                </Typography>
                <Slider
                  value={editingEvent.priority}
                  onChange={(_, value) => updateEvent('priority', value)}
                  min={1}
                  max={10}
                  marks
                  valueLabelDisplay="auto"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={editingEvent.enabled}
                      onChange={(e) => updateEvent('enabled', e.target.checked)}
                    />
                  }
                  label="有効"
                  sx={{ mt: 2 }}
                />
              </Grid>
            </Grid>
          </TabPanel>

          {/* 外観タブ */}
          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={editingEvent.appearance.visible}
                      onChange={(e) => updateAppearance('visible', e.target.checked)}
                    />
                  }
                  label="表示"
                />
                
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="body2">色:</Typography>
                  <input
                    type="color"
                    value={editingEvent.appearance.color || '#ffd700'}
                    onChange={(e) => updateAppearance('color', e.target.value)}
                    style={{ width: 50, height: 30 }}
                  />
                  <Box
                    sx={{
                      width: 30,
                      height: 30,
                      bgcolor: editingEvent.appearance.color || '#ffd700',
                      border: '1px solid #ccc',
                      borderRadius: 1
                    }}
                  />
                </Box>

                <TextField
                  fullWidth
                  label="アイコン"
                  value={editingEvent.appearance.icon || ''}
                  onChange={(e) => updateAppearance('icon', e.target.value)}
                  margin="normal"
                  helperText="絵文字または短い文字を入力（例: 💰, 👤, ⚔️, ⭐）"
                />
                
                {/* イベントの向き設定（center配置のときのみ表示） */}
                {editingEvent.position.placement === 'center' && (
                  <FormControl fullWidth margin="normal">
                    <InputLabel>向き</InputLabel>
                    <Select
                      value={editingEvent.appearance.direction || 'none'}
                      onChange={(e) => updateAppearance('direction', e.target.value)}
                      label="向き"
                    >
                      <MenuItem value="none">方向なし</MenuItem>
                      <MenuItem value="north">北</MenuItem>
                      <MenuItem value="east">東</MenuItem>
                      <MenuItem value="south">南</MenuItem>
                      <MenuItem value="west">西</MenuItem>
                    </Select>
                  </FormControl>
                )}
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.100' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    プレビュー
                  </Typography>
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      bgcolor: editingEvent.appearance.icon ? 'transparent' : editingEvent.appearance.color || '#ffd700',
                      border: editingEvent.appearance.icon ? 'none' : `2px solid ${editingEvent.appearance.color || '#ffd700'}`,
                      borderRadius: '50%',
                      mx: 'auto',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: editingEvent.appearance.visible ? 1 : 0.3,
                      fontSize: editingEvent.appearance.icon ? '24px' : '16px'
                    }}
                  >
                    {editingEvent.appearance.visible ? (
                      editingEvent.appearance.icon || '●'
                    ) : (
                      <VisibilityOffIcon />
                    )}
                  </Box>
                  <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                    {editingEvent.name}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* 外観カスタムプロパティ */}
            <Accordion sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>外観カスタムプロパティ</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  外観表示に関する追加のカスタムプロパティを設定できます
                </Typography>
                
                {/* 外観カスタムプロパティ編集UI */}
                {Object.entries(editingEvent.appearance.properties || {}).map(([key, value], index) => (
                  <Box key={`appearance-property-${index}`} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                    <TextField
                      label="キー"
                      value={key}
                      onChange={(e) => {
                        const newProperties = { ...editingEvent.appearance.properties }
                        delete newProperties[key]
                        newProperties[e.target.value] = value
                        updateAppearance('properties', newProperties)
                      }}
                      size="small"
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      label="値"
                      value={typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      onChange={(e) => {
                        let parsedValue: any = e.target.value
                        // 数値判定
                        if (!isNaN(Number(e.target.value)) && e.target.value.trim() !== '') {
                          parsedValue = Number(e.target.value)
                        }
                        // JSON判定
                        else if (e.target.value.startsWith('{') || e.target.value.startsWith('[')) {
                          try {
                            parsedValue = JSON.parse(e.target.value)
                          } catch {
                            // JSON解析失敗時は文字列として扱う
                          }
                        }
                        // boolean判定
                        else if (e.target.value === 'true') {
                          parsedValue = true
                        } else if (e.target.value === 'false') {
                          parsedValue = false
                        }
                        
                        const newProperties = { ...editingEvent.appearance.properties }
                        newProperties[key] = parsedValue
                        updateAppearance('properties', newProperties)
                      }}
                      size="small"
                      sx={{ flex: 2 }}
                    />
                    <Button
                      size="small"
                      onClick={() => {
                        const newProperties = { ...editingEvent.appearance.properties }
                        delete newProperties[key]
                        updateAppearance('properties', newProperties)
                      }}
                      color="error"
                      sx={{ minWidth: 'auto', px: 1 }}
                    >
                      ×
                    </Button>
                  </Box>
                ))}
                
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => {
                    const newProperties = { ...editingEvent.appearance.properties }
                    let newKey = 'newAppearanceProperty'
                    let counter = 1
                    while (newKey in newProperties) {
                      newKey = `newAppearanceProperty${counter}`
                      counter++
                    }
                    newProperties[newKey] = ''
                    updateAppearance('properties', newProperties)
                  }}
                  size="small"
                  variant="outlined"
                  fullWidth
                >
                  外観プロパティを追加
                </Button>
              </AccordionDetails>
            </Accordion>
          </TabPanel>

          {/* トリガータブ */}
          <TabPanel value={tabValue} index={2}>
            <FormControl fullWidth margin="normal">
              <InputLabel>トリガータイプ</InputLabel>
              <Select
                value={editingEvent.trigger.type}
                onChange={(e) => updateTrigger('type', e.target.value)}
                label="トリガータイプ"
              >
                {(['auto', 'interact', 'contact', 'item', 'step', 'time', 'flag', 'random', 'battle', 'combo', 'custom'] as TriggerType[]).map((type) => (
                  <MenuItem key={type} value={type}>
                    {getTriggerTypeLabel(type)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* カスタムトリガータイプ用の入力フィールド */}
            {editingEvent.trigger.type === 'custom' && (
              <Box sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label="カスタムトリガータイプ名"
                  value={editingEvent.trigger.customTypeName || ''}
                  onChange={(e) => updateTrigger('customTypeName', e.target.value)}
                  margin="normal"
                  placeholder="例: プレイヤー接近, 時刻指定, 特定アイテム所持"
                />
                <TextField
                  fullWidth
                  label="カスタムトリガーの説明"
                  value={editingEvent.trigger.customDescription || ''}
                  onChange={(e) => updateTrigger('customDescription', e.target.value)}
                  margin="normal"
                  multiline
                  rows={2}
                  placeholder="このトリガーの動作や条件を詳しく説明してください"
                />
              </Box>
            )}

            <Accordion sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>実行回数設定</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <FormControl fullWidth margin="normal">
                  <InputLabel>実行ポリシー</InputLabel>
                  <Select
                    value={editingEvent.trigger.repeatPolicy.type}
                    onChange={(e) => updateTrigger('repeatPolicy', { 
                      ...editingEvent.trigger.repeatPolicy, 
                      type: e.target.value 
                    })}
                    label="実行ポリシー"
                  >
                    <MenuItem value="once">一度のみ</MenuItem>
                    <MenuItem value="always">常に実行</MenuItem>
                    <MenuItem value="daily">日次</MenuItem>
                    <MenuItem value="count">回数制限</MenuItem>
                    <MenuItem value="custom">カスタム</MenuItem>
                  </Select>
                </FormControl>
                
                {editingEvent.trigger.repeatPolicy.type === 'count' && (
                  <TextField
                    fullWidth
                    label="最大実行回数"
                    type="number"
                    value={editingEvent.trigger.repeatPolicy.maxCount || 1}
                    onChange={(e) => updateTrigger('repeatPolicy', {
                      ...editingEvent.trigger.repeatPolicy,
                      maxCount: parseInt(e.target.value)
                    })}
                    margin="normal"
                  />
                )}
                
                {editingEvent.trigger.repeatPolicy.type === 'custom' && (
                  <Box sx={{ mt: 1 }}>
                    <TextField
                      fullWidth
                      label="カスタム実行ポリシー名"
                      value={editingEvent.trigger.repeatPolicy.customPolicyName || ''}
                      onChange={(e) => updateTrigger('repeatPolicy', {
                        ...editingEvent.trigger.repeatPolicy,
                        customPolicyName: e.target.value
                      })}
                      margin="normal"
                      placeholder="例: 毎時0分, プレイヤーレベル10以上時のみ, 特定フラグ設定時"
                    />
                    <TextField
                      fullWidth
                      label="カスタム実行ポリシーの説明"
                      value={editingEvent.trigger.repeatPolicy.customPolicyDescription || ''}
                      onChange={(e) => updateTrigger('repeatPolicy', {
                        ...editingEvent.trigger.repeatPolicy,
                        customPolicyDescription: e.target.value
                      })}
                      margin="normal"
                      multiline
                      rows={2}
                      placeholder="この実行ポリシーの条件や動作を詳しく説明してください"
                    />
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>

            {/* トリガーカスタムプロパティ */}
            <Accordion sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>トリガーカスタムプロパティ</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  トリガー固有のカスタムプロパティを設定できます
                </Typography>
                
                {/* トリガーカスタムプロパティ編集UI */}
                {Object.entries(editingEvent.trigger.properties || {}).map(([key, value], index) => (
                  <Box key={`trigger-property-${index}`} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                    <TextField
                      label="キー"
                      value={key}
                      onChange={(e) => {
                        const newProperties = { ...editingEvent.trigger.properties }
                        delete newProperties[key]
                        newProperties[e.target.value] = value
                        updateTrigger('properties', newProperties)
                      }}
                      size="small"
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      label="値"
                      value={typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      onChange={(e) => {
                        let parsedValue: any = e.target.value
                        // 数値判定
                        if (!isNaN(Number(e.target.value)) && e.target.value.trim() !== '') {
                          parsedValue = Number(e.target.value)
                        }
                        // JSON判定
                        else if (e.target.value.startsWith('{') || e.target.value.startsWith('[')) {
                          try {
                            parsedValue = JSON.parse(e.target.value)
                          } catch {
                            // JSON解析失敗時は文字列として扱う
                          }
                        }
                        // boolean判定
                        else if (e.target.value === 'true') {
                          parsedValue = true
                        } else if (e.target.value === 'false') {
                          parsedValue = false
                        }
                        
                        const newProperties = { ...editingEvent.trigger.properties }
                        newProperties[key] = parsedValue
                        updateTrigger('properties', newProperties)
                      }}
                      size="small"
                      sx={{ flex: 2 }}
                    />
                    <Button
                      size="small"
                      onClick={() => {
                        const newProperties = { ...editingEvent.trigger.properties }
                        delete newProperties[key]
                        updateTrigger('properties', newProperties)
                      }}
                      color="error"
                      sx={{ minWidth: 'auto', px: 1 }}
                    >
                      ×
                    </Button>
                  </Box>
                ))}
                
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => {
                    const newProperties = { ...editingEvent.trigger.properties }
                    let newKey = 'newTriggerProperty'
                    let counter = 1
                    while (newKey in newProperties) {
                      newKey = `newTriggerProperty${counter}`
                      counter++
                    }
                    newProperties[newKey] = ''
                    updateTrigger('properties', newProperties)
                  }}
                  size="small"
                  variant="outlined"
                  fullWidth
                >
                  トリガープロパティを追加
                </Button>
              </AccordionDetails>
            </Accordion>

            {/* 実行ポリシーカスタムプロパティ */}
            <Accordion sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>実行ポリシーカスタムプロパティ</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  実行ポリシー固有のカスタムプロパティを設定できます
                </Typography>
                
                {/* 実行ポリシーカスタムプロパティ編集UI */}
                {Object.entries(editingEvent.trigger.repeatPolicy.properties || {}).map(([key, value], index) => (
                  <Box key={`policy-property-${index}`} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                    <TextField
                      label="キー"
                      value={key}
                      onChange={(e) => {
                        const newProperties = { ...editingEvent.trigger.repeatPolicy.properties }
                        delete newProperties[key]
                        newProperties[e.target.value] = value
                        updateTrigger('repeatPolicy', {
                          ...editingEvent.trigger.repeatPolicy,
                          properties: newProperties
                        })
                      }}
                      size="small"
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      label="値"
                      value={typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      onChange={(e) => {
                        let parsedValue: any = e.target.value
                        // 数値判定
                        if (!isNaN(Number(e.target.value)) && e.target.value.trim() !== '') {
                          parsedValue = Number(e.target.value)
                        }
                        // JSON判定
                        else if (e.target.value.startsWith('{') || e.target.value.startsWith('[')) {
                          try {
                            parsedValue = JSON.parse(e.target.value)
                          } catch {
                            // JSON解析失敗時は文字列として扱う
                          }
                        }
                        // boolean判定
                        else if (e.target.value === 'true') {
                          parsedValue = true
                        } else if (e.target.value === 'false') {
                          parsedValue = false
                        }
                        
                        const newProperties = { ...editingEvent.trigger.repeatPolicy.properties }
                        newProperties[key] = parsedValue
                        updateTrigger('repeatPolicy', {
                          ...editingEvent.trigger.repeatPolicy,
                          properties: newProperties
                        })
                      }}
                      size="small"
                      sx={{ flex: 2 }}
                    />
                    <Button
                      size="small"
                      onClick={() => {
                        const newProperties = { ...editingEvent.trigger.repeatPolicy.properties }
                        delete newProperties[key]
                        updateTrigger('repeatPolicy', {
                          ...editingEvent.trigger.repeatPolicy,
                          properties: newProperties
                        })
                      }}
                      color="error"
                      sx={{ minWidth: 'auto', px: 1 }}
                    >
                      ×
                    </Button>
                  </Box>
                ))}
                
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => {
                    const newProperties = { ...editingEvent.trigger.repeatPolicy.properties }
                    let newKey = 'newPolicyProperty'
                    let counter = 1
                    while (newKey in newProperties) {
                      newKey = `newPolicyProperty${counter}`
                      counter++
                    }
                    newProperties[newKey] = ''
                    updateTrigger('repeatPolicy', {
                      ...editingEvent.trigger.repeatPolicy,
                      properties: newProperties
                    })
                  }}
                  size="small"
                  variant="outlined"
                  fullWidth
                >
                  実行ポリシープロパティを追加
                </Button>
              </AccordionDetails>
            </Accordion>
          </TabPanel>

          {/* アクションタブ */}
          <TabPanel value={tabValue} index={3}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">アクション一覧</Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={addAction}
                variant="outlined"
                size="small"
              >
                アクション追加
              </Button>
            </Box>

            <List>
              {editingEvent.actions.map((action, index) => (
                <ListItem key={action.id} sx={{ border: 1, borderColor: 'divider', mb: 1, borderRadius: 1 }}>
                  <Box sx={{ width: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                      <Typography variant="subtitle2">#{index + 1}</Typography>
                      <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>アクションタイプ</InputLabel>
                        <Select
                          value={action.type}
                          onChange={(e) => updateAction(index, 'type', e.target.value)}
                          label="アクションタイプ"
                        >
                          {(['message', 'treasure', 'battle', 'move', 'warp', 'heal', 'damage', 'item', 'flag', 'shop', 'save', 'sound', 'cutscene', 'conditional', 'loop', 'custom'] as ActionType[]).map((type) => (
                            <MenuItem key={type} value={type}>
                              {getActionTypeLabel(type)}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <IconButton 
                        size="small" 
                        onClick={() => removeAction(index)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>

                    {/* アクション固有のパラメータ */}
                    {action.type === 'message' && (
                      <TextField
                        fullWidth
                        label="メッセージ"
                        value={action.params.text || ''}
                        onChange={(e) => updateAction(index, 'params', { ...action.params, text: e.target.value })}
                        size="small"
                        multiline
                        rows={2}
                      />
                    )}

                    {action.type === 'heal' && (
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                          label="回復量"
                          type="number"
                          value={action.params.amount || 0}
                          onChange={(e) => updateAction(index, 'params', { ...action.params, amount: parseInt(e.target.value) })}
                          size="small"
                        />
                        <FormControl size="small" sx={{ minWidth: 100 }}>
                          <InputLabel>タイプ</InputLabel>
                          <Select
                            value={action.params.healType || 'hp'}
                            onChange={(e) => updateAction(index, 'params', { ...action.params, healType: e.target.value })}
                            label="タイプ"
                          >
                            <MenuItem value="hp">HP</MenuItem>
                            <MenuItem value="mp">MP</MenuItem>
                            <MenuItem value="both">両方</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>
                    )}

                    {action.type === 'warp' && (
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                          label="X座標"
                          type="number"
                          value={action.params.x || 0}
                          onChange={(e) => updateAction(index, 'params', { ...action.params, x: parseInt(e.target.value) })}
                          size="small"
                        />
                        <TextField
                          label="Y座標"
                          type="number"
                          value={action.params.y || 0}
                          onChange={(e) => updateAction(index, 'params', { ...action.params, y: parseInt(e.target.value) })}
                          size="small"
                        />
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                          <InputLabel>フロア</InputLabel>
                          <Select
                            value={action.params.targetFloor ?? ''}
                            onChange={(e) => updateAction(index, 'params', { ...action.params, targetFloor: Number(e.target.value) })}
                            label="フロア"
                          >
                            {dungeon?.floors.map((floor, floorIndex) => (
                              <MenuItem key={floor.id} value={floorIndex}>
                                {floor.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Box>
                    )}

                    {/* アクションカスタムプロパティ */}
                    <Accordion sx={{ mt: 1 }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 36 }}>
                        <Typography variant="body2">アクションカスタムプロパティ</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          このアクション固有のカスタムプロパティを設定できます
                        </Typography>
                        
                        {Object.entries(action.properties || {}).map(([key, value], propIndex) => (
                          <Box key={`action-${index}-property-${propIndex}`} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                            <TextField
                              label="キー"
                              value={key}
                              onChange={(e) => {
                                const newProperties = { ...action.properties }
                                delete newProperties[key]
                                newProperties[e.target.value] = value
                                updateAction(index, 'properties', newProperties)
                              }}
                              size="small"
                              sx={{ flex: 1 }}
                            />
                            <TextField
                              label="値"
                              value={typeof value === 'object' ? JSON.stringify(value) : String(value)}
                              onChange={(e) => {
                                let parsedValue: any = e.target.value
                                // 数値判定
                                if (!isNaN(Number(e.target.value)) && e.target.value.trim() !== '') {
                                  parsedValue = Number(e.target.value)
                                }
                                // JSON判定
                                else if (e.target.value.startsWith('{') || e.target.value.startsWith('[')) {
                                  try {
                                    parsedValue = JSON.parse(e.target.value)
                                  } catch {
                                    // JSON解析失敗時は文字列として扱う
                                  }
                                }
                                // boolean判定
                                else if (e.target.value === 'true') {
                                  parsedValue = true
                                } else if (e.target.value === 'false') {
                                  parsedValue = false
                                }
                                
                                const newProperties = { ...action.properties }
                                newProperties[key] = parsedValue
                                updateAction(index, 'properties', newProperties)
                              }}
                              size="small"
                              sx={{ flex: 2 }}
                            />
                            <Button
                              size="small"
                              onClick={() => {
                                const newProperties = { ...action.properties }
                                delete newProperties[key]
                                updateAction(index, 'properties', newProperties)
                              }}
                              color="error"
                              sx={{ minWidth: 'auto', px: 1 }}
                            >
                              ×
                            </Button>
                          </Box>
                        ))}
                        
                        <Button
                          startIcon={<AddIcon />}
                          onClick={() => {
                            const newProperties = { ...action.properties }
                            let newKey = 'newActionProperty'
                            let counter = 1
                            while (newKey in newProperties) {
                              newKey = `newActionProperty${counter}`
                              counter++
                            }
                            newProperties[newKey] = ''
                            updateAction(index, 'properties', newProperties)
                          }}
                          size="small"
                          variant="outlined"
                          fullWidth
                        >
                          アクションプロパティを追加
                        </Button>
                      </AccordionDetails>
                    </Accordion>
                  </Box>
                </ListItem>
              ))}
            </List>
            
            {editingEvent.actions.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                <Typography>
                  アクションが設定されていません。<br />
                  「アクション追加」ボタンでアクションを追加してください。
                </Typography>
              </Box>
            )}
          </TabPanel>

          {/* 詳細設定タブ */}
          <TabPanel value={tabValue} index={4}>
            <Typography variant="h6" gutterBottom>
              カスタムプロパティ
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              このイベントで使用するカスタムプロパティ（キー・バリュー）を設定できます。
            </Typography>
            
            {/* カスタムプロパティ編集UI */}
            <Box sx={{ mb: 2 }}>
              {Object.entries(editingEvent.properties || {}).map(([key, value], index) => (
                <Box key={`property-${index}`} sx={{ display: 'flex', gap: 2, mb: 1, alignItems: 'center' }}>
                  <TextField
                    label="キー"
                    value={key}
                    onChange={(e) => {
                      const newProperties = { ...editingEvent.properties }
                      delete newProperties[key]
                      newProperties[e.target.value] = value
                      updateEvent('properties', newProperties)
                    }}
                    size="small"
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    label="値"
                    value={typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    onChange={(e) => {
                      let parsedValue: any = e.target.value
                      // 数値かどうか判定
                      if (!isNaN(Number(e.target.value)) && e.target.value.trim() !== '') {
                        parsedValue = Number(e.target.value)
                      }
                      // JSON文字列かどうか判定
                      else if (e.target.value.startsWith('{') || e.target.value.startsWith('[')) {
                        try {
                          parsedValue = JSON.parse(e.target.value)
                        } catch {
                          // JSON解析失敗時は文字列として扱う
                        }
                      }
                      // boolean値の判定
                      else if (e.target.value === 'true') {
                        parsedValue = true
                      } else if (e.target.value === 'false') {
                        parsedValue = false
                      }
                      
                      const newProperties = { ...editingEvent.properties }
                      newProperties[key] = parsedValue
                      updateEvent('properties', newProperties)
                    }}
                    size="small"
                    sx={{ flex: 2 }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => {
                      const newProperties = { ...editingEvent.properties }
                      delete newProperties[key]
                      updateEvent('properties', newProperties)
                    }}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
              
              <Button
                startIcon={<AddIcon />}
                onClick={() => {
                  const newProperties = { ...editingEvent.properties }
                  let newKey = 'newProperty'
                  let counter = 1
                  while (newKey in newProperties) {
                    newKey = `newProperty${counter}`
                    counter++
                  }
                  newProperties[newKey] = ''
                  updateEvent('properties', newProperties)
                }}
                size="small"
                variant="outlined"
              >
                プロパティを追加
              </Button>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" gutterBottom>
              メタデータ
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="作成日時"
                  value={new Date(editingEvent.metadata.created).toLocaleString()}
                  InputProps={{ readOnly: true }}
                  size="small"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="更新日時"
                  value={new Date(editingEvent.metadata.modified).toLocaleString()}
                  InputProps={{ readOnly: true }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="作成者"
                  value={editingEvent.metadata.author || ''}
                  onChange={(e) => updateEvent('metadata', { 
                    ...editingEvent.metadata, 
                    author: e.target.value 
                  })}
                  size="small"
                />
              </Grid>
            </Grid>
          </TabPanel>
        </Box>
      </DialogContent>

      <DialogActions>
        {onDelete && event && (
          <Button onClick={handleDelete} color="error">
            削除
          </Button>
        )}
        <Button onClick={onClose}>キャンセル</Button>
        <Button 
          onClick={handleSave} 
          variant="contained"
          disabled={!editingEvent.name.trim() || !!idError}
        >
          保存
        </Button>
      </DialogActions>

      {/* イベントテンプレートダイアログ */}
      <EventTemplateDialog
        open={showTemplateDialog}
        onClose={() => setShowTemplateDialog(false)}
        onSelectTemplate={handleTemplateSelect}
      />
    </Dialog>
  )
}

export default EventEditDialog