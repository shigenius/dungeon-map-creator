import React, { useState } from 'react'
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
  Chip,
  IconButton,
  Divider,
} from '@mui/material'
import {
  Close as CloseIcon,
  Palette as PaletteIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../store'
import {
  closeCustomTypeDialog,
  addCustomFloorType,
  addCustomWallType,
  updateCustomFloorType,
  updateCustomWallType,
  addCustomDecorationType,
  updateCustomDecorationType,
} from '../store/editorSlice'
import { CustomFloorType, CustomWallType, CustomDecorationType } from '../types/map'

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

const CustomTypeDialog: React.FC = () => {
  const dispatch = useDispatch()
  const { showCustomTypeDialog, customTypeDialogMode, customTypeDialogType, editingCustomType, customFloorTypes, customWallTypes, customDecorationTypes } = useSelector(
    (state: RootState) => state.editor
  )

  const [tabValue, setTabValue] = useState(0)
  const [isEditMode, setIsEditMode] = useState(false)
  
  // 床タイプのフォーム状態
  const [floorForm, setFloorForm] = useState({
    id: '',
    name: '',
    description: '',
    color: '#666666',
    passable: true,
    properties: {} as Record<string, any>,
    effects: [] as Array<{
      type: 'damage' | 'heal' | 'teleport' | 'transform' | 'custom'
      value?: number
      targetX?: number
      targetY?: number
      targetFloor?: string
      script?: string
      properties?: Record<string, any>
    }>
  })

  // 壁タイプのフォーム状態
  const [wallForm, setWallForm] = useState({
    id: '',
    name: '',
    description: '',
    color: '#ffffff',
    transparent: false,
    passable: false,
    properties: {} as Record<string, any>,
    behavior: {
      type: 'custom' as 'door' | 'switch' | 'breakable' | 'teleport' | 'custom',
      requiresKey: '',
      durability: 1,
      script: '',
      targetX: 0,
      targetY: 0,
      targetFloor: '',
      properties: {} as Record<string, any>
    }
  })

  // 装飾タイプのフォーム状態
  const [decorationForm, setDecorationForm] = useState({
    id: '',
    name: '',
    description: '',
    color: '#00ff00',
    icon: '🪑',
    interactable: false,
    layer: 1,
    properties: {} as Record<string, any>,
    script: ''
  })

  const [newPropertyKey, setNewPropertyKey] = useState('')
  const [newPropertyValue, setNewPropertyValue] = useState('')
  
  // ID編集のエラー状態
  const [floorIdError, setFloorIdError] = useState('')
  const [wallIdError, setWallIdError] = useState('')
  const [decorationIdError, setDecorationIdError] = useState('')

  // ID重複チェック関数
  const checkFloorIdDuplicate = (newId: string) => {
    if (!newId.trim()) {
      return 'IDは必須です'
    }
    
    // 現在編集中のアイテムのIDは除外
    const originalId = isEditMode && editingCustomType ? (editingCustomType as CustomFloorType).id : null
    if (originalId === newId) {
      return ''
    }
    
    // カスタム床タイプとの重複チェック
    const duplicateFloor = customFloorTypes.find(floor => floor.id === newId)
    if (duplicateFloor) {
      return 'このIDは既に床タイプで使用されています'
    }
    
    // カスタム壁タイプとの重複チェック
    const duplicateWall = customWallTypes.find(wall => wall.id === newId)
    if (duplicateWall) {
      return 'このIDは既に壁タイプで使用されています'
    }
    
    // カスタム装飾タイプとの重複チェック
    const duplicateDecoration = customDecorationTypes.find(decoration => decoration.id === newId)
    if (duplicateDecoration) {
      return 'このIDは既に装飾タイプで使用されています'
    }
    
    return ''
  }

  const checkWallIdDuplicate = (newId: string) => {
    if (!newId.trim()) {
      return 'IDは必須です'
    }
    
    // 現在編集中のアイテムのIDは除外
    const originalId = isEditMode && editingCustomType ? (editingCustomType as CustomWallType).id : null
    if (originalId === newId) {
      return ''
    }
    
    // カスタム壁タイプとの重複チェック
    const duplicateWall = customWallTypes.find(wall => wall.id === newId)
    if (duplicateWall) {
      return 'このIDは既に壁タイプで使用されています'
    }
    
    // カスタム床タイプとの重複チェック
    const duplicateFloor = customFloorTypes.find(floor => floor.id === newId)
    if (duplicateFloor) {
      return 'このIDは既に床タイプで使用されています'
    }
    
    // カスタム装飾タイプとの重複チェック
    const duplicateDecoration = customDecorationTypes.find(decoration => decoration.id === newId)
    if (duplicateDecoration) {
      return 'このIDは既に装飾タイプで使用されています'
    }
    
    return ''
  }

  const checkDecorationIdDuplicate = (newId: string) => {
    if (!newId.trim()) {
      return 'IDは必須です'
    }
    
    // 現在編集中のアイテムのIDは除外
    const originalId = isEditMode && editingCustomType ? (editingCustomType as CustomDecorationType).id : null
    if (originalId === newId) {
      return ''
    }
    
    // カスタム装飾タイプとの重複チェック
    const duplicateDecoration = customDecorationTypes.find(decoration => decoration.id === newId)
    if (duplicateDecoration) {
      return 'このIDは既に装飾タイプで使用されています'
    }
    
    // カスタム床タイプとの重複チェック
    const duplicateFloor = customFloorTypes.find(floor => floor.id === newId)
    if (duplicateFloor) {
      return 'このIDは既に床タイプで使用されています'
    }
    
    // カスタム壁タイプとの重複チェック
    const duplicateWall = customWallTypes.find(wall => wall.id === newId)
    if (duplicateWall) {
      return 'このIDは既に壁タイプで使用されています'
    }
    
    return ''
  }

  // 編集モード時の初期化とタブ設定
  React.useEffect(() => {
    if (showCustomTypeDialog) {
      // ダイアログが開かれた時にタブを適切に設定
      if (customTypeDialogMode === 'wall') {
        setTabValue(1)
      } else if (customTypeDialogMode === 'decoration') {
        setTabValue(2)
      } else {
        setTabValue(0)
      }
    }
    
    if (editingCustomType && showCustomTypeDialog) {
      setIsEditMode(true)
      if (customTypeDialogMode === 'floor') {
        const floorType = editingCustomType as CustomFloorType
        setFloorForm({
          id: floorType.id,
          name: floorType.name,
          description: floorType.description || '',
          color: floorType.color,
          passable: floorType.passable,
          properties: floorType.properties || {},
          effects: (floorType.effects || []).map(effect => ({
            ...effect,
            properties: effect.properties || {}
          }))
        })
      } else if (customTypeDialogMode === 'wall') {
        const wallType = editingCustomType as CustomWallType
        setWallForm({
          id: wallType.id,
          name: wallType.name,
          description: wallType.description || '',
          color: wallType.color,
          transparent: wallType.transparent,
          passable: wallType.passable,
          properties: wallType.properties || {},
          behavior: {
            type: wallType.behavior?.type || 'custom',
            requiresKey: wallType.behavior?.requiresKey || '',
            durability: wallType.behavior?.durability || 1,
            script: wallType.behavior?.script || '',
            targetX: wallType.behavior?.targetX || 0,
            targetY: wallType.behavior?.targetY || 0,
            targetFloor: wallType.behavior?.targetFloor || '',
            properties: wallType.behavior?.properties || {}
          }
        })
      } else if (customTypeDialogMode === 'decoration') {
        const decorationType = editingCustomType as CustomDecorationType
        setDecorationForm({
          id: decorationType.id,
          name: decorationType.name,
          description: decorationType.description || '',
          color: decorationType.color,
          icon: decorationType.icon,
          interactable: decorationType.interactable,
          layer: decorationType.layer,
          properties: decorationType.properties || {},
          script: decorationType.script || ''
        })
      }
    } else {
      setIsEditMode(false)
      // 新規作成時はUUIDを自動生成
      if (showCustomTypeDialog) {
        const newId = crypto.randomUUID()
        if (customTypeDialogMode === 'floor') {
          setFloorForm(prev => ({ ...prev, id: newId }))
        } else if (customTypeDialogMode === 'wall') {
          setWallForm(prev => ({ ...prev, id: newId }))
        } else if (customTypeDialogMode === 'decoration') {
          setDecorationForm(prev => ({ ...prev, id: newId }))
        }
      }
    }
  }, [editingCustomType, showCustomTypeDialog, customTypeDialogMode])

  const handleDuplicate = () => {
    if (customTypeDialogType === 'view') {
      // 複製時は新しいIDを生成
      const newId = crypto.randomUUID()
      
      if (customTypeDialogMode === 'floor') {
        const duplicatedFloorType = {
          ...floorForm,
          id: newId,
          name: `${floorForm.name} のコピー`
        }
        dispatch(addCustomFloorType(duplicatedFloorType))
      } else if (customTypeDialogMode === 'wall') {
        const duplicatedWallType = {
          ...wallForm,
          id: newId,
          name: `${wallForm.name} のコピー`
        }
        dispatch(addCustomWallType(duplicatedWallType))
      } else if (customTypeDialogMode === 'decoration') {
        const duplicatedDecorationType = {
          ...decorationForm,
          id: newId,
          name: `${decorationForm.name} のコピー`
        }
        dispatch(addCustomDecorationType(duplicatedDecorationType))
      }
      
      handleClose()
    }
  }

  const handleClose = () => {
    dispatch(closeCustomTypeDialog())
    // フォームをリセット
    setFloorForm({
      id: '',
      name: '',
      description: '',
      color: '#666666',
      passable: true,
      properties: {},
      effects: []
    })
    setWallForm({
      id: '',
      name: '',
      description: '',
      color: '#ffffff',
      transparent: false,
      passable: false,
      properties: {},
      behavior: {
        type: 'custom',
        requiresKey: '',
        durability: 1,
        script: '',
        targetX: 0,
        targetY: 0,
        targetFloor: '',
        properties: {}
      }
    })
    setDecorationForm({
      id: '',
      name: '',
      description: '',
      color: '#00ff00',
      icon: '🪑',
      interactable: false,
      layer: 1,
      properties: {},
      script: ''
    })
    setTabValue(0)
    setIsEditMode(false)
  }

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handleAddProperty = (typeMode: 'floor' | 'wall' | 'decoration') => {
    if (!newPropertyKey.trim()) return
    
    if (typeMode === 'floor') {
      setFloorForm({
        ...floorForm,
        properties: {
          ...floorForm.properties,
          [newPropertyKey]: newPropertyValue || ''
        }
      })
    } else if (typeMode === 'wall') {
      setWallForm({
        ...wallForm,
        properties: {
          ...wallForm.properties,
          [newPropertyKey]: newPropertyValue || ''
        }
      })
    } else if (typeMode === 'decoration') {
      setDecorationForm({
        ...decorationForm,
        properties: {
          ...decorationForm.properties,
          [newPropertyKey]: newPropertyValue || ''
        }
      })
    }
    
    setNewPropertyKey('')
    setNewPropertyValue('')
  }

  const handleRemoveProperty = (key: string, typeMode: 'floor' | 'wall' | 'decoration') => {
    if (typeMode === 'floor') {
      const newProperties = { ...floorForm.properties }
      delete newProperties[key]
      setFloorForm({ ...floorForm, properties: newProperties })
    } else if (typeMode === 'wall') {
      const newProperties = { ...wallForm.properties }
      delete newProperties[key]
      setWallForm({ ...wallForm, properties: newProperties })
    } else if (typeMode === 'decoration') {
      const newProperties = { ...decorationForm.properties }
      delete newProperties[key]
      setDecorationForm({ ...decorationForm, properties: newProperties })
    }
  }

  const handleAddEffect = () => {
    setFloorForm({
      ...floorForm,
      effects: [...floorForm.effects, { type: 'custom', properties: {} }]
    })
  }

  const handleRemoveEffect = (index: number) => {
    const newEffects = floorForm.effects.filter((_, i) => i !== index)
    setFloorForm({ ...floorForm, effects: newEffects })
  }

  const handleUpdateEffect = (index: number, field: string, value: any) => {
    const newEffects = [...floorForm.effects]
    newEffects[index] = { ...newEffects[index], [field]: value }
    setFloorForm({ ...floorForm, effects: newEffects })
  }

  const handleAddEffectProperty = (effectIndex: number, key: string, value: any) => {
    if (!key.trim()) return
    
    const newEffects = [...floorForm.effects]
    newEffects[effectIndex] = {
      ...newEffects[effectIndex],
      properties: {
        ...newEffects[effectIndex].properties,
        [key]: value
      }
    }
    setFloorForm({ ...floorForm, effects: newEffects })
  }

  const handleRemoveEffectProperty = (effectIndex: number, key: string) => {
    const newEffects = [...floorForm.effects]
    const newProperties = { ...newEffects[effectIndex].properties }
    delete newProperties[key]
    newEffects[effectIndex] = {
      ...newEffects[effectIndex],
      properties: newProperties
    }
    setFloorForm({ ...floorForm, effects: newEffects })
  }

  const handleAddWallBehaviorProperty = (key: string, value: any) => {
    if (!key.trim()) return
    
    setWallForm({
      ...wallForm,
      behavior: {
        ...wallForm.behavior,
        properties: {
          ...wallForm.behavior.properties,
          [key]: value
        }
      }
    })
  }

  const handleRemoveWallBehaviorProperty = (key: string) => {
    const newProperties = { ...wallForm.behavior.properties }
    delete newProperties[key]
    setWallForm({
      ...wallForm,
      behavior: {
        ...wallForm.behavior,
        properties: newProperties
      }
    })
  }

  const handleSave = () => {
    if (customTypeDialogMode === 'floor') {
      if (!floorForm.name.trim()) return
      
      const customFloorType: CustomFloorType = {
        id: floorForm.id || crypto.randomUUID(),
        name: floorForm.name,
        description: floorForm.description,
        color: floorForm.color,
        passable: floorForm.passable,
        properties: floorForm.properties,
        effects: floorForm.effects.length > 0 ? floorForm.effects : undefined
      }
      
      if (isEditMode) {
        dispatch(updateCustomFloorType(customFloorType))
      } else {
        dispatch(addCustomFloorType(customFloorType))
      }
    } else if (customTypeDialogMode === 'wall') {
      if (!wallForm.name.trim()) return
      
      const customWallType: CustomWallType = {
        id: wallForm.id || crypto.randomUUID(),
        name: wallForm.name,
        description: wallForm.description,
        color: wallForm.color,
        transparent: wallForm.transparent,
        passable: wallForm.passable,
        properties: wallForm.properties,
        behavior: wallForm.behavior
      }
      
      if (isEditMode) {
        dispatch(updateCustomWallType(customWallType))
      } else {
        dispatch(addCustomWallType(customWallType))
      }
    } else if (customTypeDialogMode === 'decoration') {
      if (!decorationForm.name.trim()) return
      
      const customDecorationType: CustomDecorationType = {
        id: decorationForm.id || crypto.randomUUID(),
        name: decorationForm.name,
        description: decorationForm.description,
        color: decorationForm.color,
        icon: decorationForm.icon,
        interactable: decorationForm.interactable,
        layer: decorationForm.layer,
        properties: decorationForm.properties,
        script: decorationForm.script
      }
      
      if (isEditMode) {
        dispatch(updateCustomDecorationType(customDecorationType))
      } else {
        dispatch(addCustomDecorationType(customDecorationType))
      }
    }
    
    handleClose()
  }

  return (
    <Dialog
      open={showCustomTypeDialog}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '70vh' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <PaletteIcon />
        {customTypeDialogType === 'view' ? 'タイプ表示' : isEditMode ? 'カスタムタイプ編集' : 'カスタムタイプ作成'}
        <Box sx={{ ml: 'auto' }}>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab 
            label="床タイプ" 
            disabled={customTypeDialogMode !== 'floor'} 
            sx={{ display: customTypeDialogMode === 'floor' ? 'flex' : 'none' }}
          />
          <Tab 
            label="壁タイプ" 
            disabled={customTypeDialogMode !== 'wall'} 
            sx={{ display: customTypeDialogMode === 'wall' ? 'flex' : 'none' }}
          />
          <Tab 
            label="装飾タイプ" 
            disabled={customTypeDialogMode !== 'decoration'} 
            sx={{ display: customTypeDialogMode === 'decoration' ? 'flex' : 'none' }}
          />
        </Tabs>

        {/* 床タイプフォーム */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="ID"
                value={floorForm.id}
                onChange={(e) => {
                  setFloorForm({ ...floorForm, id: e.target.value })
                  const error = checkFloorIdDuplicate(e.target.value)
                  setFloorIdError(error)
                }}
                margin="normal"
                required
                error={!!floorIdError}
                helperText={floorIdError || 'カスタム床タイプの一意識別子'}
                placeholder={isEditMode ? '現在のID' : '例: my_custom_floor'}
              />
              <TextField
                fullWidth
                label="名前"
                value={floorForm.name}
                onChange={(e) => setFloorForm({ ...floorForm, name: e.target.value })}
                margin="normal"
                required
                InputProps={{ readOnly: customTypeDialogType === 'view' }}
              />
              <TextField
                fullWidth
                label="説明"
                value={floorForm.description}
                onChange={(e) => setFloorForm({ ...floorForm, description: e.target.value })}
                margin="normal"
                multiline
                rows={2}
                InputProps={{ readOnly: customTypeDialogType === 'view' }}
              />
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2">色:</Typography>
                <input
                  type="color"
                  value={floorForm.color}
                  onChange={(e) => setFloorForm({ ...floorForm, color: e.target.value })}
                  style={{ width: 50, height: 30 }}
                  disabled={customTypeDialogType === 'view'}
                />
                <Box
                  sx={{
                    width: 30,
                    height: 30,
                    bgcolor: floorForm.color,
                    border: '1px solid #ccc',
                    borderRadius: 1
                  }}
                />
              </Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={floorForm.passable}
                    onChange={(e) => setFloorForm({ ...floorForm, passable: e.target.checked })}
                    disabled={customTypeDialogType === 'view'}
                  />
                }
                label="通行可能"
                sx={{ mt: 2 }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                エフェクト
              </Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddEffect}
                size="small"
                sx={{ mb: 1 }}
                disabled={customTypeDialogType === 'view'}
              >
                エフェクト追加
              </Button>
              
              {floorForm.effects.map((effect, index) => (
                <Box key={index} sx={{ border: 1, borderColor: 'divider', p: 2, mb: 1, borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <InputLabel>タイプ</InputLabel>
                      <Select
                        value={effect.type}
                        onChange={(e) => handleUpdateEffect(index, 'type', e.target.value)}
                        label="タイプ"
                        disabled={customTypeDialogType === 'view'}
                      >
                        <MenuItem value="damage">ダメージ</MenuItem>
                        <MenuItem value="heal">回復</MenuItem>
                        <MenuItem value="teleport">テレポート</MenuItem>
                        <MenuItem value="transform">変換</MenuItem>
                        <MenuItem value="custom">カスタム</MenuItem>
                      </Select>
                    </FormControl>
                    <IconButton 
                      size="small" 
                      onClick={() => handleRemoveEffect(index)}
                      color="error"
                      disabled={customTypeDialogType === 'view'}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                  
                  {(effect.type === 'damage' || effect.type === 'heal') && (
                    <TextField
                      size="small"
                      label="値"
                      type="number"
                      value={effect.value || ''}
                      onChange={(e) => handleUpdateEffect(index, 'value', parseInt(e.target.value))}
                      sx={{ mb: 1 }}
                    />
                  )}
                  
                  {effect.type === 'teleport' && (
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <TextField
                        size="small"
                        label="X座標"
                        type="number"
                        value={effect.targetX || ''}
                        onChange={(e) => handleUpdateEffect(index, 'targetX', parseInt(e.target.value))}
                      />
                      <TextField
                        size="small"
                        label="Y座標"
                        type="number"
                        value={effect.targetY || ''}
                        onChange={(e) => handleUpdateEffect(index, 'targetY', parseInt(e.target.value))}
                      />
                      <TextField
                        size="small"
                        label="フロアID"
                        value={effect.targetFloor || ''}
                        onChange={(e) => handleUpdateEffect(index, 'targetFloor', e.target.value)}
                      />
                    </Box>
                  )}
                  
                  {effect.type === 'custom' && (
                    <TextField
                      fullWidth
                      size="small"
                      label="スクリプト"
                      value={effect.script || ''}
                      onChange={(e) => handleUpdateEffect(index, 'script', e.target.value)}
                      multiline
                      rows={2}
                    />
                  )}
                  
                  {/* カスタムプロパティセクション */}
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      カスタムプロパティ
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                      <TextField
                        size="small"
                        label="キー"
                        value={newPropertyKey}
                        onChange={(e) => setNewPropertyKey(e.target.value)}
                        sx={{ flex: 1 }}
                      />
                      <TextField
                        size="small"
                        label="値"
                        value={newPropertyValue}
                        onChange={(e) => setNewPropertyValue(e.target.value)}
                        sx={{ flex: 1 }}
                      />
                      <Button
                        size="small"
                        onClick={() => {
                          handleAddEffectProperty(index, newPropertyKey, newPropertyValue)
                          setNewPropertyKey('')
                          setNewPropertyValue('')
                        }}
                        disabled={!newPropertyKey.trim()}
                      >
                        追加
                      </Button>
                    </Box>
                    {Object.entries(effect.properties || {}).map(([key, value]) => (
                      <Chip
                        key={key}
                        label={`${key}: ${value}`}
                        onDelete={() => handleRemoveEffectProperty(index, key)}
                        size="small"
                        sx={{ mr: 1, mb: 1 }}
                      />
                    ))}
                  </Box>
                </Box>
              ))}
            </Grid>
          </Grid>
        </TabPanel>

        {/* 壁タイプフォーム */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="ID"
                value={wallForm.id}
                onChange={(e) => {
                  setWallForm({ ...wallForm, id: e.target.value })
                  const error = checkWallIdDuplicate(e.target.value)
                  setWallIdError(error)
                }}
                margin="normal"
                required
                error={!!wallIdError}
                helperText={wallIdError || 'カスタム壁タイプの一意識別子'}
                placeholder={isEditMode ? '現在のID' : '例: my_custom_wall'}
              />
              <TextField
                fullWidth
                label="名前"
                value={wallForm.name}
                onChange={(e) => setWallForm({ ...wallForm, name: e.target.value })}
                margin="normal"
                required
                InputProps={{ readOnly: customTypeDialogType === 'view' }}
              />
              <TextField
                fullWidth
                label="説明"
                value={wallForm.description}
                onChange={(e) => setWallForm({ ...wallForm, description: e.target.value })}
                margin="normal"
                multiline
                rows={2}
                InputProps={{ readOnly: customTypeDialogType === 'view' }}
              />
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2">色:</Typography>
                <input
                  type="color"
                  value={wallForm.color}
                  onChange={(e) => setWallForm({ ...wallForm, color: e.target.value })}
                  style={{ width: 50, height: 30 }}
                  disabled={customTypeDialogType === 'view'}
                />
                <Box
                  sx={{
                    width: 30,
                    height: 30,
                    bgcolor: wallForm.color,
                    border: '1px solid #ccc',
                    borderRadius: 1
                  }}
                />
              </Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={wallForm.transparent}
                    onChange={(e) => setWallForm({ ...wallForm, transparent: e.target.checked })}
                    disabled={customTypeDialogType === 'view'}
                  />
                }
                label="透明"
                sx={{ mt: 2, display: 'block' }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={wallForm.passable}
                    onChange={(e) => setWallForm({ ...wallForm, passable: e.target.checked })}
                    disabled={customTypeDialogType === 'view'}
                  />
                }
                label="通行可能"
                sx={{ display: 'block' }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                動作設定
              </Typography>
              <FormControl fullWidth margin="normal">
                <InputLabel>動作タイプ</InputLabel>
                <Select
                  value={wallForm.behavior.type}
                  onChange={(e) => setWallForm({
                    ...wallForm,
                    behavior: { ...wallForm.behavior, type: e.target.value as any }
                  })}
                  label="動作タイプ"
                  disabled={customTypeDialogType === 'view'}
                >
                  <MenuItem value="door">扉</MenuItem>
                  <MenuItem value="switch">スイッチ</MenuItem>
                  <MenuItem value="breakable">破壊可能</MenuItem>
                  <MenuItem value="teleport">テレポート</MenuItem>
                  <MenuItem value="custom">カスタム</MenuItem>
                </Select>
              </FormControl>

              {wallForm.behavior.type === 'door' && (
                <TextField
                  fullWidth
                  label="必要なキー"
                  value={wallForm.behavior.requiresKey}
                  onChange={(e) => setWallForm({
                    ...wallForm,
                    behavior: { ...wallForm.behavior, requiresKey: e.target.value }
                  })}
                  margin="normal"
                  InputProps={{ readOnly: customTypeDialogType === 'view' }}
                />
              )}

              {wallForm.behavior.type === 'breakable' && (
                <TextField
                  fullWidth
                  label="耐久度"
                  type="number"
                  value={wallForm.behavior.durability}
                  onChange={(e) => setWallForm({
                    ...wallForm,
                    behavior: { ...wallForm.behavior, durability: parseInt(e.target.value) }
                  })}
                  margin="normal"
                  InputProps={{ readOnly: customTypeDialogType === 'view' }}
                />
              )}

              {wallForm.behavior.type === 'teleport' && (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                  <TextField
                    size="small"
                    label="X座標"
                    type="number"
                    value={wallForm.behavior.targetX || ''}
                    onChange={(e) => setWallForm({
                      ...wallForm,
                      behavior: { ...wallForm.behavior, targetX: parseInt(e.target.value) }
                    })}
                    InputProps={{ readOnly: customTypeDialogType === 'view' }}
                  />
                  <TextField
                    size="small"
                    label="Y座標"
                    type="number"
                    value={wallForm.behavior.targetY || ''}
                    onChange={(e) => setWallForm({
                      ...wallForm,
                      behavior: { ...wallForm.behavior, targetY: parseInt(e.target.value) }
                    })}
                    InputProps={{ readOnly: customTypeDialogType === 'view' }}
                  />
                  <TextField
                    size="small"
                    label="フロアID"
                    value={wallForm.behavior.targetFloor || ''}
                    onChange={(e) => setWallForm({
                      ...wallForm,
                      behavior: { ...wallForm.behavior, targetFloor: e.target.value }
                    })}
                    InputProps={{ readOnly: customTypeDialogType === 'view' }}
                  />
                </Box>
              )}

              {wallForm.behavior.type === 'custom' && (
                <TextField
                  fullWidth
                  label="スクリプト"
                  value={wallForm.behavior.script}
                  onChange={(e) => setWallForm({
                    ...wallForm,
                    behavior: { ...wallForm.behavior, script: e.target.value }
                  })}
                  margin="normal"
                  multiline
                  rows={3}
                  InputProps={{ readOnly: customTypeDialogType === 'view' }}
                />
              )}

              {/* 動作設定のカスタムプロパティ */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  動作カスタムプロパティ
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <TextField
                    size="small"
                    label="キー"
                    value={newPropertyKey}
                    onChange={(e) => setNewPropertyKey(e.target.value)}
                    sx={{ flex: 1 }}
                    InputProps={{ readOnly: customTypeDialogType === 'view' }}
                  />
                  <TextField
                    size="small"
                    label="値"
                    value={newPropertyValue}
                    onChange={(e) => setNewPropertyValue(e.target.value)}
                    sx={{ flex: 1 }}
                    InputProps={{ readOnly: customTypeDialogType === 'view' }}
                  />
                  <Button
                    size="small"
                    onClick={() => {
                      handleAddWallBehaviorProperty(newPropertyKey, newPropertyValue)
                      setNewPropertyKey('')
                      setNewPropertyValue('')
                    }}
                    disabled={!newPropertyKey.trim() || customTypeDialogType === 'view'}
                  >
                    追加
                  </Button>
                </Box>
                {Object.entries(wallForm.behavior.properties || {}).map(([key, value]) => (
                  <Chip
                    key={key}
                    label={`${key}: ${value}`}
                    onDelete={customTypeDialogType === 'view' ? undefined : () => handleRemoveWallBehaviorProperty(key)}
                    size="small"
                    sx={{ mr: 1, mb: 1 }}
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        </TabPanel>

        {/* 装飾タイプフォーム */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="ID"
                value={decorationForm.id}
                onChange={(e) => {
                  setDecorationForm({ ...decorationForm, id: e.target.value })
                  const error = checkDecorationIdDuplicate(e.target.value)
                  setDecorationIdError(error)
                }}
                margin="normal"
                required
                error={!!decorationIdError}
                helperText={decorationIdError || 'カスタム装飾タイプの一意識別子'}
                placeholder={isEditMode ? '現在のID' : '例: my_custom_decoration'}
                InputProps={{ readOnly: customTypeDialogType === 'view' }}
              />
              <TextField
                fullWidth
                label="名前"
                value={decorationForm.name}
                onChange={(e) => setDecorationForm({ ...decorationForm, name: e.target.value })}
                margin="normal"
                required
                InputProps={{ readOnly: customTypeDialogType === 'view' }}
              />
              <TextField
                fullWidth
                label="説明"
                value={decorationForm.description}
                onChange={(e) => setDecorationForm({ ...decorationForm, description: e.target.value })}
                margin="normal"
                multiline
                rows={2}
                InputProps={{ readOnly: customTypeDialogType === 'view' }}
              />
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2">色:</Typography>
                <input
                  type="color"
                  value={decorationForm.color}
                  onChange={(e) => setDecorationForm({ ...decorationForm, color: e.target.value })}
                  style={{ width: 50, height: 30 }}
                  disabled={customTypeDialogType === 'view'}
                />
                <Box
                  sx={{
                    width: 30,
                    height: 30,
                    bgcolor: decorationForm.color,
                    border: '1px solid #ccc',
                    borderRadius: 1
                  }}
                />
              </Box>
              <TextField
                fullWidth
                label="アイコン"
                value={decorationForm.icon}
                onChange={(e) => setDecorationForm({ ...decorationForm, icon: e.target.value })}
                margin="normal"
                placeholder="例: 🪑"
                InputProps={{ readOnly: customTypeDialogType === 'view' }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={decorationForm.interactable}
                    onChange={(e) => setDecorationForm({ ...decorationForm, interactable: e.target.checked })}
                    disabled={customTypeDialogType === 'view'}
                  />
                }
                label="相互作用可能"
                sx={{ mt: 2, display: 'block' }}
              />
              <TextField
                fullWidth
                label="レイヤー"
                type="number"
                value={decorationForm.layer}
                onChange={(e) => setDecorationForm({ ...decorationForm, layer: parseInt(e.target.value) })}
                margin="normal"
                helperText="0: 最背面, 1: 中間, 2: 前面"
                InputProps={{ 
                  readOnly: customTypeDialogType === 'view',
                  inputProps: { min: 0, max: 2 }
                }}
              />
              <TextField
                fullWidth
                label="スクリプト"
                value={decorationForm.script}
                onChange={(e) => setDecorationForm({ ...decorationForm, script: e.target.value })}
                margin="normal"
                multiline
                rows={3}
                placeholder="相互作用時に実行されるスクリプト"
                InputProps={{ readOnly: customTypeDialogType === 'view' }}
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* カスタムプロパティ */}
        <Divider sx={{ my: 3 }} />
        <Typography variant="subtitle2" gutterBottom>
          カスタムプロパティ
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField
            size="small"
            label="キー"
            value={newPropertyKey}
            onChange={(e) => setNewPropertyKey(e.target.value)}
            InputProps={{ readOnly: customTypeDialogType === 'view' }}
          />
          <TextField
            size="small"
            label="値"
            value={newPropertyValue}
            onChange={(e) => setNewPropertyValue(e.target.value)}
            InputProps={{ readOnly: customTypeDialogType === 'view' }}
          />
          <Button
            variant="outlined"
            onClick={() => handleAddProperty(customTypeDialogMode === 'floor' ? 'floor' : customTypeDialogMode === 'wall' ? 'wall' : 'decoration')}
            disabled={!newPropertyKey.trim() || customTypeDialogType === 'view'}
          >
            追加
          </Button>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {Object.entries(
            customTypeDialogMode === 'floor' ? floorForm.properties : 
            customTypeDialogMode === 'wall' ? wallForm.properties : 
            decorationForm.properties
          ).map(([key, value]) => (
            <Chip
              key={key}
              label={`${key}: ${value}`}
              onDelete={customTypeDialogType === 'view' ? undefined : () => handleRemoveProperty(key, customTypeDialogMode === 'floor' ? 'floor' : customTypeDialogMode === 'wall' ? 'wall' : 'decoration')}
              size="small"
            />
          ))}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          {customTypeDialogType === 'view' ? '閉じる' : 'キャンセル'}
        </Button>
        {customTypeDialogType === 'view' ? (
          <Button 
            onClick={handleDuplicate} 
            variant="contained"
            color="primary"
          >
            複製
          </Button>
        ) : (
          <Button 
            onClick={handleSave} 
            variant="contained"
            disabled={
              customTypeDialogMode === 'floor' ? (!floorForm.name.trim() || !!floorIdError) : 
              customTypeDialogMode === 'wall' ? (!wallForm.name.trim() || !!wallIdError) :
              customTypeDialogMode === 'decoration' ? (!decorationForm.name.trim() || !!decorationIdError) : true
            }
          >
            {isEditMode ? '更新' : '作成'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default CustomTypeDialog