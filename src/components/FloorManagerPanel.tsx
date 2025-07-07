import React, { useState } from 'react'
import {
  Box,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemSecondaryAction,
  Menu,
  MenuItem,
  ListItemIcon,
  Chip,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  MoreVert as MoreVertIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../store'
import { addFloor, removeFloor, renameFloor, duplicateFloor, updateFloorProperties } from '../store/mapSlice'
import { setCurrentFloor } from '../store/editorSlice'

const FloorManagerPanel: React.FC = () => {
  const dispatch = useDispatch()
  const { currentFloor } = useSelector((state: RootState) => state.editor)
  const dungeon = useSelector((state: RootState) => state.map.dungeon)
  
  // ダイアログ状態
  const [showAddFloorDialog, setShowAddFloorDialog] = useState(false)
  const [showRenameDialog, setShowRenameDialog] = useState(false)
  const [showPropertiesDialog, setShowPropertiesDialog] = useState(false)
  const [floorName, setFloorName] = useState('')
  const [floorId, setFloorId] = useState('')
  const [floorWidth, setFloorWidth] = useState(20)
  const [floorHeight, setFloorHeight] = useState(20)
  const [editingFloorIndex, setEditingFloorIndex] = useState<number | null>(null)
  const [idError, setIdError] = useState<string>('')
  
  // メニュー状態
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const [selectedFloorIndex, setSelectedFloorIndex] = useState<number | null>(null)

  // ID重複チェック関数
  const checkIdDuplicate = (newId: string, excludeFloorIndex?: number): string => {
    if (!dungeon || !newId.trim()) return ''
    
    // フロアIDの重複をチェック
    for (let i = 0; i < dungeon.floors.length; i++) {
      if (i === excludeFloorIndex) continue // 編集中のフロア自身は除外
      if (dungeon.floors[i].id === newId) {
        return `ID "${newId}" は既にフロアIDとして使用されています`
      }
    }
    
    // イベントIDとの重複もチェック
    for (const floor of dungeon.floors) {
      for (const row of floor.cells) {
        for (const cell of row) {
          for (const event of cell.events) {
            if (event.id === newId) {
              return `ID "${newId}" はイベントIDとして使用されています`
            }
          }
        }
      }
    }
    
    return ''
  }

  // ID更新ハンドラー
  const handleIdChange = (newId: string) => {
    // 常に入力値を更新
    setFloorId(newId)
    // エラーチェックは入力値とは独立して行う
    const error = checkIdDuplicate(newId, editingFloorIndex || undefined)
    setIdError(error)
  }

  const handleFloorSelect = (floorIndex: number) => {
    dispatch(setCurrentFloor(floorIndex))
  }

  const handleAddFloor = () => {
    if (floorName.trim()) {
      dispatch(addFloor({
        name: floorName.trim(),
        width: floorWidth,
        height: floorHeight
      }))
      setShowAddFloorDialog(false)
      setFloorName('')
      setFloorWidth(20)
      setFloorHeight(20)
    }
  }

  const handleRenameFloor = () => {
    if (editingFloorIndex !== null && floorName.trim() && !idError) {
      // ID重複チェック
      const error = checkIdDuplicate(floorId, editingFloorIndex)
      if (error) {
        setIdError(error)
        return
      }

      dispatch(renameFloor({
        floorIndex: editingFloorIndex,
        newName: floorName.trim(),
        newId: floorId.trim()
      }))
      setShowRenameDialog(false)
      setFloorName('')
      setFloorId('')
      setEditingFloorIndex(null)
      setIdError('')
    }
  }

  const handleDeleteFloor = (floorIndex: number) => {
    if (dungeon && dungeon.floors.length > 1) {
      dispatch(removeFloor(floorIndex))
      // 削除されたフロアが現在のフロアの場合、最初のフロアに切り替え
      if (currentFloor >= floorIndex) {
        dispatch(setCurrentFloor(Math.max(0, currentFloor - 1)))
      }
    }
    handleMenuClose()
  }

  const handleDuplicateFloor = (floorIndex: number) => {
    if (dungeon) {
      const originalName = dungeon.floors[floorIndex]?.name || 'フロア'
      dispatch(duplicateFloor({
        sourceFloorIndex: floorIndex,
        newName: `${originalName} (コピー)`
      }))
    }
    handleMenuClose()
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, floorIndex: number) => {
    event.stopPropagation()
    setMenuAnchor(event.currentTarget)
    setSelectedFloorIndex(floorIndex)
  }

  const handleMenuClose = () => {
    setMenuAnchor(null)
    setSelectedFloorIndex(null)
  }

  const openRenameDialog = (floorIndex: number) => {
    const floor = dungeon?.floors[floorIndex]
    if (floor) {
      setEditingFloorIndex(floorIndex)
      setFloorName(floor.name)
      setFloorId(floor.id)
      setIdError('')
      setShowRenameDialog(true)
    }
    handleMenuClose()
  }

  const openPropertiesDialog = (floorIndex: number) => {
    setEditingFloorIndex(floorIndex)
    setShowPropertiesDialog(true)
    handleMenuClose()
  }

  if (!dungeon) {
    return null
  }

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="subtitle1" fontWeight="bold">
          フロア管理
        </Typography>
        <Tooltip title="新しいフロアを追加">
          <IconButton size="small" onClick={() => setShowAddFloorDialog(true)}>
            <AddIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <List dense>
        {dungeon.floors.map((floor, index) => (
          <ListItem key={floor.id} disablePadding>
            <ListItemButton
              selected={currentFloor === index}
              onClick={() => handleFloorSelect(index)}
              sx={{ pr: 6 }}
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">
                      (ID:{floor.id.slice(0, 8)}) {floor.name}
                    </Typography>
                    {currentFloor === index && (
                      <Chip label="編集中" size="small" color="primary" />
                    )}
                  </Box>
                }
                secondary={`${floor.width}×${floor.height}`}
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  size="small"
                  onClick={(e) => handleMenuOpen(e, index)}
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* フロア追加ダイアログ */}
      <Dialog open={showAddFloorDialog} onClose={() => setShowAddFloorDialog(false)}>
        <DialogTitle>新しいフロアを追加</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="フロア名"
            fullWidth
            variant="outlined"
            value={floorName}
            onChange={(e) => setFloorName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              margin="dense"
              label="幅"
              type="number"
              variant="outlined"
              value={floorWidth}
              onChange={(e) => setFloorWidth(Math.max(5, Math.min(100, parseInt(e.target.value) || 20)))}
              inputProps={{ min: 5, max: 100 }}
            />
            <TextField
              margin="dense"
              label="高さ"
              type="number"
              variant="outlined"
              value={floorHeight}
              onChange={(e) => setFloorHeight(Math.max(5, Math.min(100, parseInt(e.target.value) || 20)))}
              inputProps={{ min: 5, max: 100 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddFloorDialog(false)}>キャンセル</Button>
          <Button onClick={handleAddFloor} variant="contained" disabled={!floorName.trim()}>
            追加
          </Button>
        </DialogActions>
      </Dialog>

      {/* フロア名変更ダイアログ */}
      <Dialog open={showRenameDialog} onClose={() => setShowRenameDialog(false)}>
        <DialogTitle>フロア情報を変更</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="新しいフロア名"
            fullWidth
            variant="outlined"
            value={floorName}
            onChange={(e) => setFloorName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="フロアID"
            fullWidth
            variant="outlined"
            value={floorId}
            onChange={(e) => handleIdChange(e.target.value)}
            error={!!idError}
            helperText={idError || 'ユニークなIDを設定してください'}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRenameDialog(false)}>キャンセル</Button>
          <Button onClick={handleRenameFloor} variant="contained" disabled={!floorName.trim() || !!idError}>
            変更
          </Button>
        </DialogActions>
      </Dialog>

      {/* フロアプロパティ編集ダイアログ */}
      <Dialog open={showPropertiesDialog} onClose={() => setShowPropertiesDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>フロアプロパティ編集</DialogTitle>
        <DialogContent>
          {editingFloorIndex !== null && dungeon?.floors[editingFloorIndex] && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Typography variant="body2" color="text.secondary" paragraph>
                フロア「{dungeon.floors[editingFloorIndex].name}」のカスタムプロパティを設定できます
              </Typography>
              
              {/* フロアカスタムプロパティ編集UI */}
              {Object.entries(dungeon.floors[editingFloorIndex].properties || {}).map(([key, value], index) => (
                <Box key={`floor-property-${index}`} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                  <TextField
                    label="キー"
                    value={key}
                    onChange={(e) => {
                      const newProperties = { ...dungeon.floors[editingFloorIndex].properties }
                      delete newProperties[key]
                      newProperties[e.target.value] = value
                      dispatch(updateFloorProperties({ floorIndex: editingFloorIndex, properties: newProperties }))
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
                      
                      const newProperties = { ...dungeon.floors[editingFloorIndex].properties }
                      newProperties[key] = parsedValue
                      dispatch(updateFloorProperties({ floorIndex: editingFloorIndex, properties: newProperties }))
                    }}
                    size="small"
                    sx={{ flex: 2 }}
                  />
                  <Button
                    size="small"
                    onClick={() => {
                      const newProperties = { ...dungeon.floors[editingFloorIndex].properties }
                      delete newProperties[key]
                      dispatch(updateFloorProperties({ floorIndex: editingFloorIndex, properties: newProperties }))
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
                  const newProperties = { ...dungeon.floors[editingFloorIndex].properties }
                  let newKey = 'newProperty'
                  let counter = 1
                  while (newKey in newProperties) {
                    newKey = `newProperty${counter}`
                    counter++
                  }
                  newProperties[newKey] = ''
                  dispatch(updateFloorProperties({ floorIndex: editingFloorIndex, properties: newProperties }))
                }}
                size="small"
                variant="outlined"
                fullWidth
              >
                プロパティを追加
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPropertiesDialog(false)}>閉じる</Button>
        </DialogActions>
      </Dialog>

      {/* フロアメニュー */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => selectedFloorIndex !== null && openRenameDialog(selectedFloorIndex)}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>名前を変更</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => selectedFloorIndex !== null && openPropertiesDialog(selectedFloorIndex)}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>プロパティ編集</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => selectedFloorIndex !== null && handleDuplicateFloor(selectedFloorIndex)}>
          <ListItemIcon>
            <CopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>複製</ListItemText>
        </MenuItem>
        <MenuItem 
          onClick={() => selectedFloorIndex !== null && handleDeleteFloor(selectedFloorIndex)}
          disabled={dungeon.floors.length <= 1}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" sx={{ color: 'error.main' }} />
          </ListItemIcon>
          <ListItemText>削除</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  )
}

export default FloorManagerPanel