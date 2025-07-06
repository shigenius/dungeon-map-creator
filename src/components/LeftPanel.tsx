import React, { useState, useCallback, useRef, useEffect } from 'react'
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  Button,
  Menu,
  MenuItem,
  ListItemSecondaryAction,
  TextField,
  Chip,
  Stack,
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
  Terrain as FloorIcon,
  CropSquare as WallIcon,
  Event as EventIcon,
  Palette as DecorationIcon,
  Colorize as EyedropperIcon,
  Clear as ClearIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  MoreVert as MoreVertIcon,
  ViewModule as TemplateIcon,
  Search as SearchIcon,
} from '@mui/icons-material'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../store'
import { setSelectedFloorType, setSelectedFloorPassable, setSelectedWallType, setSelectedDecorationType, setSelectedEventType, clearCapturedCellData, toggleFloorTypeAccordion, toggleWallTypeAccordion, toggleEventTypeAccordion, toggleDecorationTypeAccordion, openCustomTypeDialog, openEventEditDialog, setSelectedTemplate, setSelectedTool, setSelectedEventId, setHighlightedEventId } from '../store/editorSlice'
import { removeEventFromCell, addEventToCell } from '../store/mapSlice'
import { Layer, FloorType, WallType, DecorationType, EventType } from '../types/map'
import FloorManagerPanel from './FloorManagerPanel'
import EventTemplateDialog from './EventTemplateDialog'
import { EventTemplate } from '../data/eventTemplates'

const LeftPanel: React.FC = () => {
  const dispatch = useDispatch()
  const { selectedLayer, selectedFloorType, selectedFloorPassable, selectedWallType, selectedDecorationType, selectedEventType, capturedCellData, accordionStates, customFloorTypes, customWallTypes, currentFloor } = useSelector((state: RootState) => state.editor)
  const dungeon = useSelector((state: RootState) => state.map.dungeon)

  // イベント操作メニューの状態管理
  const [eventMenuAnchor, setEventMenuAnchor] = useState<null | HTMLElement>(null)
  const [selectedEventForMenu, setSelectedEventForMenu] = useState<any>(null)
  const [showEventTemplateDialog, setShowEventTemplateDialog] = useState(false)
  
  // イベント検索・フィルタの状態管理
  const [eventSearchQuery, setEventSearchQuery] = useState('')
  const [eventTypeFilter, setEventTypeFilter] = useState('all')
  
  // ホバー最適化のためのref
  const hoverTimeoutRef = useRef<number | null>(null)

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [])

  const layers: Array<{ key: Layer; name: string; icon: React.ReactNode }> = [
    { key: 'floor', name: '床レイヤー', icon: <FloorIcon /> },
    { key: 'walls', name: '壁レイヤー', icon: <WallIcon /> },
    { key: 'events', name: 'イベントレイヤー', icon: <EventIcon /> },
    { key: 'decorations', name: '装飾レイヤー', icon: <DecorationIcon /> },
  ]

  const floorTypes: Array<{ key: FloorType | 'normal_impassable'; name: string; color: string; description: string; passable?: boolean }> = [
    { key: 'normal', name: '通常', color: '#666', description: '通常の床', passable: true },
    { key: 'normal_impassable', name: '通常床（通行不可）', color: '#333', description: '通常の床だが通行不可', passable: false },
    { key: 'damage', name: 'ダメージ', color: '#800', description: 'ダメージを与える床' },
    { key: 'slippery', name: '滑りやすい', color: '#048', description: '滑りやすい床' },
    { key: 'pit', name: '落とし穴', color: '#000', description: '通行不可の穴' },
    { key: 'warp', name: 'ワープ', color: '#840', description: 'ワープポイント' },
  ]

  const wallTypes: Array<{ key: WallType; name: string; color: string; description: string }> = [
    { key: 'normal', name: '通常壁', color: '#fff', description: '標準的な壁' },
    { key: 'door', name: '扉', color: '#a52a2a', description: '通過可能な扉' },
    { key: 'locked_door', name: '鍵付き扉', color: '#daa520', description: '鍵が必要な扉' },
    { key: 'hidden_door', name: '隠し扉', color: '#696969', description: '隠された通路' },
    { key: 'breakable', name: '破壊可能壁', color: '#8b4513', description: '破壊できる壁' },
    { key: 'oneway', name: '片面壁', color: '#4169e1', description: '一方通行の壁' },
    { key: 'invisible', name: '透明壁', color: '#e0e0e0', description: '見えない壁' },
    { key: 'event', name: 'イベント壁', color: '#ff69b4', description: 'イベント付き壁' },
  ]

  const decorationTypes: Array<{ key: DecorationType; name: string; color: string; description: string; icon: string }> = [
    { key: 'furniture', name: '家具', color: '#8b4513', description: 'テーブル、椅子、棚など', icon: '🪑' },
    { key: 'statue', name: '彫像', color: '#a0a0a0', description: '石像や装飾品', icon: '🗿' },
    { key: 'plant', name: '植物', color: '#228b22', description: '観葉植物や花', icon: '🌿' },
    { key: 'torch', name: '松明', color: '#ff6347', description: '照明用の松明', icon: '🔥' },
    { key: 'pillar', name: '柱', color: '#d2b48c', description: '支柱や装飾柱', icon: '🏛️' },
    { key: 'rug', name: '絨毯', color: '#dc143c', description: '床に敷く絨毯', icon: '🧿' },
    { key: 'painting', name: '絵画', color: '#4169e1', description: '壁に掛ける絵', icon: '🖼️' },
    { key: 'crystal', name: 'クリスタル', color: '#9370db', description: '魔法のクリスタル', icon: '💎' },
    { key: 'rubble', name: '瓦礫', color: '#696969', description: '石くずや破片', icon: '🪨' },
  ]

  const eventTypes: Array<{ key: EventType; name: string; color: string; description: string; icon: string }> = [
    { key: 'treasure', name: '宝箱', color: '#ffd700', description: 'アイテムや金を入手', icon: '💰' },
    { key: 'npc', name: 'NPC', color: '#40e0d0', description: '会話や情報提供', icon: '👤' },
    { key: 'stairs', name: '階段', color: '#888888', description: '他の階への移動', icon: '🪜' },
    { key: 'enemy', name: '敵', color: '#ff4444', description: 'シンボルエンカウント', icon: '👹' },
    { key: 'save', name: 'セーブ', color: '#44aaff', description: 'セーブポイント', icon: '💾' },
    { key: 'heal', name: '回復', color: '#44ffaa', description: 'HP・MP回復', icon: '❤️' },
    { key: 'switch', name: 'スイッチ', color: '#ffaa44', description: '扉や仕掛けの操作', icon: '🔘' },
    { key: 'sign', name: '看板', color: '#aaaaaa', description: 'メッセージ表示', icon: '📋' },
    { key: 'harvest', name: '採取', color: '#44ff44', description: 'アイテム採取地点', icon: '🌾' },
  ]


  const handleFloorTypeSelect = (floorType: FloorType | 'normal_impassable' | string) => {
    console.log('床タイプ選択:', floorType)
    
    // normal_impassableの場合は通常床として扱い、通行不可に設定
    if (floorType === 'normal_impassable') {
      console.log('通常床（通行不可）を選択')
      dispatch(setSelectedFloorType('normal'))
      dispatch(setSelectedFloorPassable(false))
    } else {
      // カスタム床タイプかどうかを確認
      const customFloorType = customFloorTypes.find(custom => custom.id === floorType)
      if (customFloorType) {
        console.log('カスタム床タイプを選択:', customFloorType)
        dispatch(setSelectedFloorType(customFloorType.id as any))
        dispatch(setSelectedFloorPassable(customFloorType.passable))
      } else {
        // 通常の床タイプの場合
        const passable = floorType === 'pit' ? false : true
        console.log('基本床タイプを選択:', { type: floorType, passable })
        dispatch(setSelectedFloorType(floorType as FloorType))
        dispatch(setSelectedFloorPassable(passable))
      }
    }
    // テンプレート選択を解除し、ペンツールに切り替え
    dispatch(setSelectedTemplate(null))
    dispatch(setSelectedTool('pen'))
  }

  const handleWallTypeSelect = (wallType: WallType) => {
    dispatch(setSelectedWallType(wallType))
    // テンプレート選択を解除し、ペンツールに切り替え
    dispatch(setSelectedTemplate(null))
    dispatch(setSelectedTool('pen'))
  }
  
  const handleClearCapturedData = () => {
    dispatch(clearCapturedCellData())
  }

  const handleFloorTypeAccordionToggle = () => {
    dispatch(toggleFloorTypeAccordion())
  }

  const handleWallTypeAccordionToggle = () => {
    dispatch(toggleWallTypeAccordion())
  }

  const handleEventTypeAccordionToggle = () => {
    dispatch(toggleEventTypeAccordion())
  }

  const handleDecorationTypeAccordionToggle = () => {
    dispatch(toggleDecorationTypeAccordion())
  }

  const handleAddCustomFloorType = () => {
    dispatch(openCustomTypeDialog('floor'))
  }

  const handleAddCustomWallType = () => {
    dispatch(openCustomTypeDialog('wall'))
  }

  const handleDecorationTypeSelect = (decorationType: DecorationType) => {
    dispatch(setSelectedDecorationType(decorationType))
    // テンプレート選択を解除し、ペンツールに切り替え
    dispatch(setSelectedTemplate(null))
    dispatch(setSelectedTool('pen'))
  }

  const handleEventTypeSelect = (eventType: EventType) => {
    // 既に選択されているイベントタイプを再度クリックした場合は選択解除
    if (selectedEventType === eventType) {
      // 選択を解除（nullにする）
      dispatch(setSelectedEventType(null))
    } else {
      dispatch(setSelectedEventType(eventType))
    }
    // テンプレート選択を解除し、ペンツールに切り替え
    dispatch(setSelectedTemplate(null))
    dispatch(setSelectedTool('pen'))
  }

  // イベント操作関連のハンドラー
  const handleEventMenuOpen = (event: React.MouseEvent<HTMLElement>, eventData: any) => {
    event.stopPropagation()
    setEventMenuAnchor(event.currentTarget)
    setSelectedEventForMenu(eventData)
  }

  const handleEventMenuClose = () => {
    setEventMenuAnchor(null)
    setSelectedEventForMenu(null)
  }

  const handleDeleteEvent = () => {
    if (selectedEventForMenu) {
      dispatch(removeEventFromCell({
        x: selectedEventForMenu.position.x,
        y: selectedEventForMenu.position.y,
        eventId: selectedEventForMenu.id,
        floorIndex: currentFloor
      }))
    }
    handleEventMenuClose()
  }

  const handleDuplicateEvent = () => {
    if (selectedEventForMenu) {
      const duplicatedEvent = {
        ...selectedEventForMenu,
        id: crypto.randomUUID(),
        name: `${selectedEventForMenu.name} (コピー)`,
        metadata: {
          ...selectedEventForMenu.metadata,
          created: new Date().toISOString(),
          modified: new Date().toISOString()
        }
      }
      dispatch(addEventToCell({
        x: selectedEventForMenu.position.x,
        y: selectedEventForMenu.position.y,
        event: duplicatedEvent,
        floorIndex: currentFloor
      }))
    }
    handleEventMenuClose()
  }

  const handleTemplateSelect = (template: EventTemplate) => {
    if (template.presetEvent && dungeon) {
      const now = new Date().toISOString()
      const templateEvent = template.presetEvent
      
      // テンプレートから新しいイベントを作成
      const newEvent = {
        id: crypto.randomUUID(),
        type: templateEvent.type || 'custom',
        name: templateEvent.name || 'イベント',
        description: templateEvent.description || '',
        position: { x: 0, y: 0 }, // デフォルト位置
        appearance: {
          visible: true,
          ...templateEvent.appearance
        },
        trigger: templateEvent.trigger || { type: 'interact', repeatPolicy: { type: 'once' } },
        actions: templateEvent.actions ? [...templateEvent.actions] : [],
        enabled: templateEvent.enabled !== undefined ? templateEvent.enabled : true,
        priority: templateEvent.priority !== undefined ? templateEvent.priority : 1,
        flags: templateEvent.flags || {},
        metadata: {
          created: now,
          modified: now,
          author: dungeon.author || '',
          version: 1
        }
      }
      
      // イベント編集ダイアログを開く
      dispatch(openEventEditDialog(newEvent))
      setShowEventTemplateDialog(false)
    }
  }

  // デバウンス機能付きホバーハンドラー
  const handleEventHover = useCallback((eventId: string | null) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    
    hoverTimeoutRef.current = window.setTimeout(() => {
      dispatch(setHighlightedEventId(eventId))
    }, 100) // 100ms のデバウンス
  }, [dispatch])

  const handleEventLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    dispatch(setHighlightedEventId(null))
  }, [dispatch])

  // イベントフィルタリング関数
  const filterEvents = (events: any[]) => {
    return events.filter(event => {
      // 検索クエリでフィルタ
      const searchMatch = eventSearchQuery === '' || 
        event.name.toLowerCase().includes(eventSearchQuery.toLowerCase()) ||
        (event.description && event.description.toLowerCase().includes(eventSearchQuery.toLowerCase())) ||
        event.type.toLowerCase().includes(eventSearchQuery.toLowerCase())
      
      // タイプフィルタ
      const typeMatch = eventTypeFilter === 'all' || event.type === eventTypeFilter
      
      return searchMatch && typeMatch
    })
  }

  return (
    <Box
      sx={{
        width: 280,
        height: '100%',
        bgcolor: 'background.paper',
        borderRight: 1,
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
      {/* フロア管理パネル */}
      <FloorManagerPanel />
      <Divider />

      {/* 現在のレイヤー表示 */}  
      <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
          {layers.find(layer => layer.key === selectedLayer)?.icon}
          <Box component="span" sx={{ ml: 1 }}>
            編集中: {layers.find(layer => layer.key === selectedLayer)?.name}
          </Box>
        </Typography>
      </Box>

      <Divider />

      {/* 床レイヤー関連 */}
      {selectedLayer === 'floor' && (
        <>
          <Accordion expanded={accordionStates.floorTypeAccordion} onChange={handleFloorTypeAccordionToggle}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <FloorIcon sx={{ mr: 1 }} />
              <Typography>床タイプ選択</Typography>
              <Box sx={{ ml: 'auto', mr: 1 }}>
                <Tooltip title="カスタム床タイプを追加">
                  <IconButton size="small" onClick={(e) => {
                    e.stopPropagation()
                    handleAddCustomFloorType()
                  }}>
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              <List dense>
                {floorTypes.map((floorType) => (
                  <ListItem key={floorType.key} disablePadding>
                    <ListItemButton
                      selected={
                        floorType.key === 'normal_impassable' 
                          ? selectedFloorType === 'normal' && selectedFloorPassable === false
                          : floorType.passable !== undefined 
                            ? selectedFloorType === floorType.key && selectedFloorPassable === floorType.passable
                            : selectedFloorType === floorType.key
                      }
                      onClick={() => handleFloorTypeSelect(floorType.key)}
                      disabled={!dungeon}
                      sx={{ pl: 2 }}
                    >
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <Box
                          sx={{
                            width: 16,
                            height: 16,
                            bgcolor: floorType.color,
                            border: '1px solid #ccc',
                            borderRadius: '2px',
                          }}
                        />
                      </ListItemIcon>
                      <ListItemText 
                        primary={floorType.name}
                        secondary={floorType.description}
                      />
                      {floorType.key !== 'normal' && (
                        <ListItemSecondaryAction>
                          <IconButton 
                            size="small" 
                            onClick={(e) => {
                              e.stopPropagation()
                              console.log('基本床タイプ編集:', {
                                key: floorType.key,
                                name: floorType.name,
                                passable: floorType.passable,
                                color: floorType.color
                              })
                              // TODO: 基本床タイプ編集機能を実装
                              alert(`${floorType.name}の編集機能は今後実装予定です`)
                            }}
                          >
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </ListItemSecondaryAction>
                      )}
                    </ListItemButton>
                  </ListItem>
                ))}
                
                {/* カスタム床タイプ */}
                {customFloorTypes.map((customType) => (
                  <ListItem key={customType.id} disablePadding>
                    <ListItemButton
                      selected={selectedFloorType === customType.id && selectedFloorPassable === customType.passable}
                      onClick={() => handleFloorTypeSelect(customType.id)}
                      disabled={!dungeon}
                      sx={{ pl: 2 }}
                    >
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <Box
                          sx={{
                            width: 16,
                            height: 16,
                            bgcolor: customType.color,
                            border: '1px solid #ccc',
                            borderRadius: '2px',
                          }}
                        />
                      </ListItemIcon>
                      <ListItemText 
                        primary={`${customType.name} ${customType.passable ? '(通行可)' : '(通行不可)'}`}
                        secondary={customType.description}
                      />
                      <ListItemSecondaryAction>
                        <IconButton 
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation()
                            console.log('カスタム床タイプ編集:', {
                              id: customType.id,
                              name: customType.name,
                              passable: customType.passable,
                              color: customType.color,
                              description: customType.description,
                              properties: customType.properties,
                              currentlySelected: selectedFloorType === customType.id,
                              selectedFloorPassable: selectedFloorPassable
                            })
                            // TODO: カスタム床タイプ編集機能を実装
                            alert(`${customType.name}の編集機能は今後実装予定です`)
                          }}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
          <Divider />
        </>
      )}

      {/* 壁レイヤー関連 */}
      {selectedLayer === 'walls' && (
        <>
          <Accordion expanded={accordionStates.wallTypeAccordion} onChange={handleWallTypeAccordionToggle}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <WallIcon sx={{ mr: 1 }} />
              <Typography>壁タイプ選択</Typography>
              <Box sx={{ ml: 'auto', mr: 1 }}>
                <Tooltip title="カスタム壁タイプを追加">
                  <IconButton size="small" onClick={(e) => {
                    e.stopPropagation()
                    handleAddCustomWallType()
                  }}>
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              <List dense>
                {wallTypes.map((wallType) => (
                  <ListItem key={wallType.key} disablePadding>
                    <ListItemButton
                      selected={selectedWallType === wallType.key}
                      onClick={() => handleWallTypeSelect(wallType.key)}
                      disabled={!dungeon}
                      sx={{ pl: 2 }}
                    >
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <Box
                          sx={{
                            width: 16,
                            height: 16,
                            bgcolor: wallType.color,
                            border: '1px solid #ccc',
                            borderRadius: '2px',
                          }}
                        />
                      </ListItemIcon>
                      <ListItemText 
                        primary={wallType.name}
                        secondary={wallType.description}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
                
                {/* カスタム壁タイプ */}
                {customWallTypes.map((customType) => (
                  <ListItem key={customType.id} disablePadding>
                    <ListItemButton
                      selected={selectedWallType === 'custom'}
                      onClick={() => handleWallTypeSelect('custom')}
                      disabled={!dungeon}
                      sx={{ pl: 2 }}
                    >
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <Box
                          sx={{
                            width: 16,
                            height: 16,
                            bgcolor: customType.color,
                            border: '1px solid #ccc',
                            borderRadius: '2px',
                          }}
                        />
                      </ListItemIcon>
                      <ListItemText 
                        primary={customType.name}
                        secondary={customType.description}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
          <Divider />
        </>
      )}

      {/* イベントレイヤー関連 */}
      {selectedLayer === 'events' && (
        <>
          <Accordion expanded={selectedLayer === 'events'}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <EventIcon sx={{ mr: 1 }} />
              <Typography>イベント管理</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AddIcon />}
                    sx={{ flex: 1 }}
                    onClick={() => dispatch(openEventEditDialog(null))}
                  >
                    新規作成
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<TemplateIcon />}
                    sx={{ flex: 1 }}
                    onClick={() => setShowEventTemplateDialog(true)}
                  >
                    テンプレート
                  </Button>
                </Box>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  現在の階にあるイベント一覧です
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    イベント数: {dungeon?.floors[currentFloor]?.cells?.flat().reduce((count, cell) => count + cell.events.length, 0) || 0}
                  </Typography>
                </Box>
                
                {/* イベント検索・フィルタ */}
                <Box sx={{ mb: 2 }}>
                  <TextField
                    size="small"
                    placeholder="イベント名、説明、タイプで検索..."
                    value={eventSearchQuery}
                    onChange={(e) => setEventSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                      endAdornment: eventSearchQuery && (
                        <IconButton
                          size="small"
                          onClick={() => setEventSearchQuery('')}
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      ),
                    }}
                    sx={{ width: '100%', mb: 1 }}
                  />
                  
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                    <Chip
                      label="全て"
                      size="small"
                      variant={eventTypeFilter === 'all' ? 'filled' : 'outlined'}
                      onClick={() => setEventTypeFilter('all')}
                    />
                    <Chip
                      label="階段"
                      size="small"
                      variant={eventTypeFilter === 'stairs' ? 'filled' : 'outlined'}
                      onClick={() => setEventTypeFilter('stairs')}
                    />
                    <Chip
                      label="宝箱"
                      size="small"
                      variant={eventTypeFilter === 'treasure' ? 'filled' : 'outlined'}
                      onClick={() => setEventTypeFilter('treasure')}
                    />
                    <Chip
                      label="NPC"
                      size="small"
                      variant={eventTypeFilter === 'npc' ? 'filled' : 'outlined'}
                      onClick={() => setEventTypeFilter('npc')}
                    />
                    <Chip
                      label="敵"
                      size="small"
                      variant={eventTypeFilter === 'enemy' ? 'filled' : 'outlined'}
                      onClick={() => setEventTypeFilter('enemy')}
                    />
                    <Chip
                      label="回復"
                      size="small"
                      variant={eventTypeFilter === 'heal' ? 'filled' : 'outlined'}
                      onClick={() => setEventTypeFilter('heal')}
                    />
                    <Chip
                      label="セーブ"
                      size="small"
                      variant={eventTypeFilter === 'save' ? 'filled' : 'outlined'}
                      onClick={() => setEventTypeFilter('save')}
                    />
                  </Stack>
                </Box>
                
                <List dense sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {(() => {
                    const allEvents = dungeon?.floors[currentFloor]?.cells?.flat().flatMap((cell, cellIndex) => 
                      cell.events.map((event, eventIndex) => ({ event, cellIndex, eventIndex }))
                    ) || []
                    const filteredEvents = filterEvents(allEvents.map(item => item.event))
                    
                    return allEvents.filter(item => filteredEvents.includes(item.event)).map(({ event, cellIndex, eventIndex }) => (
                      <ListItem key={`${event.id}-${cellIndex}-${eventIndex}`} disablePadding>
                        <ListItemButton 
                          onClick={() => {
                            dispatch(setSelectedEventId(event.id))
                            dispatch(openEventEditDialog(event))
                          }}
                          onMouseEnter={() => handleEventHover(event.id)}
                          onMouseLeave={handleEventLeave}
                        >
                          <ListItemIcon sx={{ minWidth: 28 }}>
                            <Box
                              sx={{
                                width: 20,
                                height: 20,
                                bgcolor: (event.appearance.icon && event.appearance.icon.trim()) ? 'transparent' : event.appearance.color || '#ffd700',
                                border: (event.appearance.icon && event.appearance.icon.trim()) ? 'none' : `1px solid ${event.appearance.color || '#ffd700'}`,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                              }}
                            >
                              {(event.appearance.icon && event.appearance.icon.trim()) ? event.appearance.icon : '●'}
                            </Box>
                          </ListItemIcon>
                          <ListItemText 
                            primary={event.name}
                            secondary={`(${event.position.x}, ${event.position.y}) ${event.type}`}
                            primaryTypographyProps={{ variant: 'body2' }}
                            secondaryTypographyProps={{ variant: 'caption' }}
                          />
                        </ListItemButton>
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={(e) => handleEventMenuOpen(e, event)}
                          >
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))
                  })()}
                </List>
                
                {(!dungeon?.floors[currentFloor]?.cells?.flat().some(cell => cell.events.length > 0)) && (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    イベントがありません
                  </Typography>
                )}
              </Box>
            </AccordionDetails>
          </Accordion>
          
          <Accordion expanded={accordionStates.eventTypeAccordion} onChange={handleEventTypeAccordionToggle}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <EventIcon sx={{ mr: 1 }} />
              <Typography>イベントテンプレート選択</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              <Typography variant="caption" sx={{ px: 2, py: 1, color: 'text.secondary', display: 'block' }}>
                選択済みのテンプレートを再度クリックで選択解除
              </Typography>
              <List dense>
                {eventTypes.map((eventType) => (
                  <ListItem key={eventType.key} disablePadding>
                    <Tooltip title={selectedEventType === eventType.key ? "クリックで選択解除" : "クリックで選択"} placement="right">
                      <ListItemButton
                        selected={selectedEventType === eventType.key}
                        onClick={() => handleEventTypeSelect(eventType.key)}
                        disabled={!dungeon}
                        sx={{ 
                          pl: 2,
                          '&.Mui-selected': {
                            backgroundColor: 'primary.main',
                            color: 'primary.contrastText',
                            '&:hover': {
                              backgroundColor: 'primary.dark',
                            }
                          }
                        }}
                      >
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <Typography sx={{ fontSize: '16px' }}>
                          {eventType.icon}
                        </Typography>
                      </ListItemIcon>
                        <ListItemText 
                          primary={eventType.name}
                          secondary={eventType.description}
                        />
                      </ListItemButton>
                    </Tooltip>
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
          
          <Divider />
        </>
      )}

      {/* 装飾レイヤー関連 */}
      {selectedLayer === 'decorations' && (
        <>
          <Accordion expanded={accordionStates.decorationTypeAccordion} onChange={handleDecorationTypeAccordionToggle}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <DecorationIcon sx={{ mr: 1 }} />
              <Typography>装飾タイプ選択</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              <List dense>
                {decorationTypes.map((decorationType) => (
                  <ListItem key={decorationType.key} disablePadding>
                    <ListItemButton
                      selected={selectedDecorationType === decorationType.key}
                      onClick={() => handleDecorationTypeSelect(decorationType.key)}
                      disabled={!dungeon}
                      sx={{ pl: 2 }}
                    >
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <Typography sx={{ fontSize: '16px' }}>
                          {decorationType.icon}
                        </Typography>
                      </ListItemIcon>
                      <ListItemText 
                        primary={decorationType.name}
                        secondary={decorationType.description}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
          
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <DecorationIcon sx={{ mr: 1 }} />
              <Typography>装飾管理</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  現在の階にある装飾一覧です
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    装飾数: {dungeon?.floors[currentFloor]?.cells?.flat().reduce((count, cell) => count + cell.decorations.length, 0) || 0}
                  </Typography>
                </Box>
                
                <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
                  {dungeon?.floors[currentFloor]?.cells?.flat().map(cell => 
                    cell.decorations.map(decoration => (
                      <ListItem key={decoration.id} disablePadding>
                        <ListItemButton>
                          <ListItemIcon sx={{ minWidth: 28 }}>
                            <Typography sx={{ fontSize: '12px' }}>
                              {decoration.appearance.icon}
                            </Typography>
                          </ListItemIcon>
                          <ListItemText 
                            primary={decoration.name}
                            secondary={`(${cell.x}, ${cell.y}) ${decoration.type}`}
                            primaryTypographyProps={{ variant: 'body2' }}
                            secondaryTypographyProps={{ variant: 'caption' }}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))
                  ) || []}
                </List>
                
                {(!dungeon?.floors[currentFloor]?.cells?.flat().some(cell => cell.decorations.length > 0)) && (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    装飾がありません
                  </Typography>
                )}
              </Box>
            </AccordionDetails>
          </Accordion>
          <Divider />
        </>
      )}

      {/* キャプチャされたセル情報（全レイヤー共通） */}
      {capturedCellData && (
        <>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <EyedropperIcon sx={{ mr: 1 }} />
              <Typography>キャプチャされたセル</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 2 }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  床タイプ
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      bgcolor: floorTypes.find(f => f.key === capturedCellData.floor.type)?.color || '#666',
                      border: '1px solid #ccc',
                      borderRadius: '2px',
                      mr: 1,
                    }}
                  />
                  <Typography variant="body2">
                    {floorTypes.find(f => f.key === capturedCellData.floor.type)?.name || '不明'}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  通行可否: {capturedCellData.floor.passable ? '可能' : '不可'}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  壁情報
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {capturedCellData.walls.north ? '壁あり' : '壁なし'}
                </Typography>
                {capturedCellData.walls.north && (
                  <Typography variant="body2">
                    タイプ: {wallTypes.find(w => w.key === capturedCellData.walls.north?.type)?.name || '不明'}
                  </Typography>
                )}
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  イベント
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {capturedCellData.hasEvents ? 'イベントあり' : 'イベントなし'}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Box
                  component="button"
                  onClick={handleClearCapturedData}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 2,
                    py: 1,
                    bgcolor: 'action.hover',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'action.selected',
                    },
                  }}
                >
                  <ClearIcon fontSize="small" />
                  <Typography variant="body2">クリア</Typography>
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>
          
          <Divider />
        </>
      )}

      </Box>

      {/* イベント操作メニュー */}
      <Menu
        anchorEl={eventMenuAnchor}
        open={Boolean(eventMenuAnchor)}
        onClose={handleEventMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <MenuItem onClick={() => {
          if (selectedEventForMenu) {
            dispatch(openEventEditDialog(selectedEventForMenu))
          }
          handleEventMenuClose()
        }}>
          <ListItemIcon>
            <EventIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>編集</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDuplicateEvent}>
          <ListItemIcon>
            <CopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>複製</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDeleteEvent} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" sx={{ color: 'error.main' }} />
          </ListItemIcon>
          <ListItemText>削除</ListItemText>
        </MenuItem>
      </Menu>

      {/* イベントテンプレートダイアログ */}
      <EventTemplateDialog
        open={showEventTemplateDialog}
        onClose={() => setShowEventTemplateDialog(false)}
        onSelectTemplate={handleTemplateSelect}
      />
    </Box>
  )
}

export default LeftPanel