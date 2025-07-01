import React, { useState } from 'react'
import {
  Box,
  Typography,
  Button,
  Select,
  MenuItem,
  TextField,
  FormControl,
  InputLabel,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  Divider,
} from '@mui/material'
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  PlayArrow as PlayIcon,
} from '@mui/icons-material'
import { useSelector } from 'react-redux'
import { RootState } from '../store'
import { DungeonEvent, EventType, TriggerType, ActionType, EventAction } from '../types/map'

const EventEditor: React.FC = () => {
  const dungeon = useSelector((state: RootState) => state.map.dungeon)
  const { currentFloor } = useSelector((state: RootState) => state.editor)
  
  const [selectedEvent, setSelectedEvent] = useState<DungeonEvent | null>(null)
  const [eventDialogOpen, setEventDialogOpen] = useState(false)
  const [actionDialogOpen, setActionDialogOpen] = useState(false)
  const [editingAction, setEditingAction] = useState<EventAction | null>(null)
  
  // 現在のフロアの全イベントを取得
  const currentFloorData = dungeon?.floors[currentFloor]
  const allEvents: DungeonEvent[] = []
  
  if (currentFloorData) {
    for (let y = 0; y < currentFloorData.height; y++) {
      for (let x = 0; x < currentFloorData.width; x++) {
        allEvents.push(...currentFloorData.cells[y][x].events)
      }
    }
  }

  const eventTypes: Array<{ value: EventType; label: string }> = [
    { value: 'treasure', label: '宝箱' },
    { value: 'npc', label: 'NPC' },
    { value: 'stairs', label: '階段' },
    { value: 'enemy', label: '敵シンボル' },
    { value: 'save', label: 'セーブポイント' },
    { value: 'heal', label: '回復ポイント' },
    { value: 'switch', label: 'スイッチ' },
    { value: 'sign', label: '看板' },
    { value: 'harvest', label: '採取ポイント' },
    { value: 'custom', label: 'カスタム' },
  ]

  const triggerTypes: Array<{ value: TriggerType; label: string; description: string }> = [
    { value: 'auto', label: '自動実行', description: 'マップ読み込み時に自動実行' },
    { value: 'interact', label: '調べる', description: 'プレイヤーが調べたときに実行' },
    { value: 'contact', label: '接触', description: 'プレイヤーが触れたときに実行' },
    { value: 'step', label: '踏む', description: 'プレイヤーが踏んだときに実行' },
    { value: 'item', label: 'アイテム使用', description: '特定アイテム使用時に実行' },
    { value: 'time', label: '時間経過', description: '一定時間経過後に実行' },
    { value: 'flag', label: 'フラグ条件', description: '特定フラグが条件を満たすと実行' },
    { value: 'random', label: 'ランダム', description: '確率的に実行' },
    { value: 'battle', label: '戦闘後', description: '戦闘終了後に実行' },
    { value: 'combo', label: '複合条件', description: '複数条件の組み合わせで実行' },
  ]

  const actionTypes: Array<{ value: ActionType; label: string; description: string }> = [
    { value: 'message', label: 'メッセージ', description: 'メッセージを表示' },
    { value: 'treasure', label: '宝箱開封', description: 'アイテムや経験値を取得' },
    { value: 'battle', label: '戦闘開始', description: '敵との戦闘を開始' },
    { value: 'warp', label: 'ワープ', description: '別の場所に移動' },
    { value: 'heal', label: '回復', description: 'HPやMPを回復' },
    { value: 'damage', label: 'ダメージ', description: 'ダメージを与える' },
    { value: 'item', label: 'アイテム操作', description: 'アイテムの取得・削除' },
    { value: 'flag', label: 'フラグ操作', description: 'ゲームフラグの操作' },
    { value: 'shop', label: 'ショップ', description: 'ショップを開始' },
    { value: 'save', label: 'セーブ', description: 'ゲームをセーブ' },
    { value: 'sound', label: '効果音', description: '効果音を再生' },
    { value: 'cutscene', label: 'カットシーン', description: 'カットシーンを再生' },
    { value: 'conditional', label: '条件分岐', description: '条件に応じて分岐' },
    { value: 'custom', label: 'カスタム', description: 'カスタムアクション' },
  ]

  const handleCreateEvent = () => {
    setSelectedEvent(null)
    setEventDialogOpen(true)
  }

  const handleEditEvent = (event: DungeonEvent) => {
    setSelectedEvent(event)
    setEventDialogOpen(true)
  }

  const handleCreateAction = () => {
    setEditingAction(null)
    setActionDialogOpen(true)
  }

  const handleEditAction = (action: EventAction) => {
    setEditingAction(action)
    setActionDialogOpen(true)
  }

  const EventCreateDialog = () => (
    <Dialog open={eventDialogOpen} onClose={() => setEventDialogOpen(false)} maxWidth="md" fullWidth>
      <DialogTitle>
        {selectedEvent ? 'イベント編集' : '新規イベント作成'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="イベント名"
            defaultValue={selectedEvent?.name || ''}
            fullWidth
          />
          
          <TextField
            label="説明"
            defaultValue={selectedEvent?.description || ''}
            multiline
            rows={2}
            fullWidth
          />
          
          <FormControl fullWidth>
            <InputLabel>イベントタイプ</InputLabel>
            <Select defaultValue={selectedEvent?.type || 'treasure'}>
              {eventTypes.map(type => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl fullWidth>
            <InputLabel>トリガータイプ</InputLabel>
            <Select defaultValue={selectedEvent?.trigger.type || 'interact'}>
              {triggerTypes.map(trigger => (
                <MenuItem key={trigger.value} value={trigger.value}>
                  <Box>
                    <Typography variant="body1">{trigger.label}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {trigger.description}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              表示設定
            </Typography>
            <FormControlLabel
              control={<Switch defaultChecked={selectedEvent?.appearance.visible ?? true} />}
              label="マップ上に表示"
            />
          </Box>
          
          <TextField
            label="優先度"
            type="number"
            defaultValue={selectedEvent?.priority || 1}
            fullWidth
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setEventDialogOpen(false)}>キャンセル</Button>
        <Button variant="contained" onClick={() => setEventDialogOpen(false)}>
          {selectedEvent ? '更新' : '作成'}
        </Button>
      </DialogActions>
    </Dialog>
  )

  const ActionEditDialog = () => (
    <Dialog open={actionDialogOpen} onClose={() => setActionDialogOpen(false)} maxWidth="md" fullWidth>
      <DialogTitle>
        {editingAction ? 'アクション編集' : '新規アクション作成'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <FormControl fullWidth>
            <InputLabel>アクションタイプ</InputLabel>
            <Select defaultValue={editingAction?.type || 'message'}>
              {actionTypes.map(action => (
                <MenuItem key={action.value} value={action.value}>
                  <Box>
                    <Typography variant="body1">{action.label}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {action.description}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            label="パラメータ (JSON)"
            defaultValue={JSON.stringify(editingAction?.params || {}, null, 2)}
            multiline
            rows={6}
            fullWidth
            helperText="アクションのパラメータをJSON形式で入力してください"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setActionDialogOpen(false)}>キャンセル</Button>
        <Button variant="contained" onClick={() => setActionDialogOpen(false)}>
          {editingAction ? '更新' : '作成'}
        </Button>
      </DialogActions>
    </Dialog>
  )

  if (!dungeon) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          プロジェクトを作成してください
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* イベント一覧 */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle2">
            イベント一覧 ({allEvents.length})
          </Typography>
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={handleCreateEvent}
          >
            新規作成
          </Button>
        </Box>
        
        <List dense>
          {allEvents.map((event) => (
            <ListItem key={event.id} divider>
              <ListItemText
                primary={event.name}
                secondary={
                  <Box>
                    <Typography variant="caption" display="block">
                      {eventTypes.find(t => t.value === event.type)?.label} - 
                      {triggerTypes.find(t => t.value === event.trigger.type)?.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      位置: ({event.position.x}, {event.position.y})
                    </Typography>
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                <IconButton size="small" onClick={() => handleEditEvent(event)}>
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" color="error">
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
          {allEvents.length === 0 && (
            <ListItem>
              <ListItemText
                primary="イベントがありません"
                secondary="新規作成ボタンでイベントを追加してください"
              />
            </ListItem>
          )}
        </List>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* 選択されたイベントの詳細 */}
      {selectedEvent && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            イベント詳細: {selectedEvent.name}
          </Typography>
          
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="body2">アクション ({selectedEvent.actions.length})</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption">アクションチェーン</Typography>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleCreateAction}
                >
                  追加
                </Button>
              </Box>
              
              <List dense>
                {selectedEvent.actions.map((action, index) => (
                  <ListItem key={action.id}>
                    <ListItemText
                      primary={actionTypes.find(t => t.value === action.type)?.label}
                      secondary={`${index + 1}. ${action.type}`}
                    />
                    <ListItemSecondaryAction>
                      <IconButton size="small" onClick={() => handleEditAction(action)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
          
          <Box sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              startIcon={<PlayIcon />}
              fullWidth
              size="small"
            >
              イベントテスト実行
            </Button>
          </Box>
        </Box>
      )}

      {/* ダイアログ */}
      <EventCreateDialog />
      <ActionEditDialog />
    </Box>
  )
}

export default EventEditor