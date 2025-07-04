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
  Chip,
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
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
} from '@mui/icons-material'
import { DungeonEvent, EventType, TriggerType, ActionType, EventAction } from '../types/map'
import EventTemplateDialog from './EventTemplateDialog'
import { EventTemplate } from '../data/eventTemplates'
import { validateEvent, EventValidationResult, getValidationSummary } from '../utils/eventValidation'

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
  const [validationResult, setValidationResult] = useState<EventValidationResult | null>(null)
  const [showValidation, setShowValidation] = useState(true)

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
        position: { x: 0, y: 0 },
        appearance: {
          visible: true,
          color: '#ffd700',
          icon: '⭐'
        },
        trigger: {
          type: 'interact',
          repeatPolicy: { type: 'once' }
        },
        actions: [],
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

  // リアルタイムバリデーション
  useEffect(() => {
    if (editingEvent) {
      const result = validateEvent(editingEvent)
      setValidationResult(result)
    } else {
      setValidationResult(null)
    }
  }, [editingEvent])

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
      combo: '複合条件'
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

  // バリデーション結果表示コンポーネント
  const ValidationSummary: React.FC = () => {
    if (!validationResult || !showValidation) return null

    const { errors, warnings, info, isValid } = validationResult
    const hasIssues = errors.length > 0 || warnings.length > 0 || info.length > 0

    if (!hasIssues) {
      return (
        <Box sx={{ p: 2 }}>
          <Alert severity="success" icon={<CheckCircleIcon />}>
            <AlertTitle>バリデーション結果</AlertTitle>
            問題ありません。イベントは正常に設定されています。
          </Alert>
        </Box>
      )
    }

    return (
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="subtitle2">バリデーション結果</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              size="small"
              icon={<CheckCircleIcon />}
              label={getValidationSummary(validationResult)}
              color={isValid ? 'success' : errors.length > 0 ? 'error' : 'warning'}
              variant="outlined"
            />
          </Box>
        </Box>

        {errors.length > 0 && (
          <Alert severity="error" sx={{ mb: 1 }}>
            <AlertTitle>エラー ({errors.length}件)</AlertTitle>
            <List dense>
              {errors.map((error, index) => (
                <ListItem key={index} sx={{ py: 0 }}>
                  <Typography variant="body2">
                    <strong>{error.field}:</strong> {error.message}
                    {error.suggestion && (
                      <Box component="span" sx={{ display: 'block', color: 'text.secondary', mt: 0.5 }}>
                        💡 {error.suggestion}
                      </Box>
                    )}
                  </Typography>
                </ListItem>
              ))}
            </List>
          </Alert>
        )}

        {warnings.length > 0 && (
          <Alert severity="warning" sx={{ mb: 1 }}>
            <AlertTitle>警告 ({warnings.length}件)</AlertTitle>
            <List dense>
              {warnings.map((warning, index) => (
                <ListItem key={index} sx={{ py: 0 }}>
                  <Typography variant="body2">
                    <strong>{warning.field}:</strong> {warning.message}
                    {warning.suggestion && (
                      <Box component="span" sx={{ display: 'block', color: 'text.secondary', mt: 0.5 }}>
                        💡 {warning.suggestion}
                      </Box>
                    )}
                  </Typography>
                </ListItem>
              ))}
            </List>
          </Alert>
        )}

        {info.length > 0 && (
          <Alert severity="info" sx={{ mb: 1 }}>
            <AlertTitle>情報 ({info.length}件)</AlertTitle>
            <List dense>
              {info.map((item, index) => (
                <ListItem key={index} sx={{ py: 0 }}>
                  <Typography variant="body2">
                    <strong>{item.field}:</strong> {item.message}
                    {item.suggestion && (
                      <Box component="span" sx={{ display: 'block', color: 'text.secondary', mt: 0.5 }}>
                        💡 {item.suggestion}
                      </Box>
                    )}
                  </Typography>
                </ListItem>
              ))}
            </List>
          </Alert>
        )}
      </Box>
    )
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

        {/* バリデーション結果表示 */}
        <ValidationSummary />

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
                {(['auto', 'interact', 'contact', 'item', 'step', 'time', 'flag', 'random', 'battle', 'combo'] as TriggerType[]).map((type) => (
                  <MenuItem key={type} value={type}>
                    {getTriggerTypeLabel(type)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

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
                        <TextField
                          label="フロア"
                          type="number"
                          value={action.params.floor || 0}
                          onChange={(e) => updateAction(index, 'params', { ...action.params, floor: parseInt(e.target.value) })}
                          size="small"
                        />
                      </Box>
                    )}
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
              イベントフラグ
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              このイベントで使用するカスタムフラグを設定できます。
            </Typography>
            
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
          disabled={!editingEvent.name.trim()}
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