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
} from '../store/editorSlice'
import { CustomFloorType, CustomWallType } from '../types/map'

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
  const { showCustomTypeDialog, customTypeDialogMode } = useSelector(
    (state: RootState) => state.editor
  )

  const [tabValue, setTabValue] = useState(0)
  
  // 床タイプのフォーム状態
  const [floorForm, setFloorForm] = useState({
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
      targetFloor?: number
      script?: string
    }>
  })

  // 壁タイプのフォーム状態
  const [wallForm, setWallForm] = useState({
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
      script: ''
    }
  })

  const [newPropertyKey, setNewPropertyKey] = useState('')
  const [newPropertyValue, setNewPropertyValue] = useState('')

  const handleClose = () => {
    dispatch(closeCustomTypeDialog())
    // フォームをリセット
    setFloorForm({
      name: '',
      description: '',
      color: '#666666',
      passable: true,
      properties: {},
      effects: []
    })
    setWallForm({
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
        script: ''
      }
    })
    setTabValue(0)
  }

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handleAddProperty = (isFloor: boolean) => {
    if (!newPropertyKey.trim()) return
    
    if (isFloor) {
      setFloorForm({
        ...floorForm,
        properties: {
          ...floorForm.properties,
          [newPropertyKey]: newPropertyValue || ''
        }
      })
    } else {
      setWallForm({
        ...wallForm,
        properties: {
          ...wallForm.properties,
          [newPropertyKey]: newPropertyValue || ''
        }
      })
    }
    
    setNewPropertyKey('')
    setNewPropertyValue('')
  }

  const handleRemoveProperty = (key: string, isFloor: boolean) => {
    if (isFloor) {
      const newProperties = { ...floorForm.properties }
      delete newProperties[key]
      setFloorForm({ ...floorForm, properties: newProperties })
    } else {
      const newProperties = { ...wallForm.properties }
      delete newProperties[key]
      setWallForm({ ...wallForm, properties: newProperties })
    }
  }

  const handleAddEffect = () => {
    setFloorForm({
      ...floorForm,
      effects: [...floorForm.effects, { type: 'custom' }]
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

  const handleSave = () => {
    if (customTypeDialogMode === 'floor') {
      if (!floorForm.name.trim()) return
      
      const customFloorType: CustomFloorType = {
        id: crypto.randomUUID(),
        name: floorForm.name,
        description: floorForm.description,
        color: floorForm.color,
        passable: floorForm.passable,
        properties: floorForm.properties,
        effects: floorForm.effects.length > 0 ? floorForm.effects : undefined
      }
      
      dispatch(addCustomFloorType(customFloorType))
    } else if (customTypeDialogMode === 'wall') {
      if (!wallForm.name.trim()) return
      
      const customWallType: CustomWallType = {
        id: crypto.randomUUID(),
        name: wallForm.name,
        description: wallForm.description,
        color: wallForm.color,
        transparent: wallForm.transparent,
        passable: wallForm.passable,
        properties: wallForm.properties,
        behavior: wallForm.behavior
      }
      
      dispatch(addCustomWallType(customWallType))
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
        カスタムタイプ作成
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
        </Tabs>

        {/* 床タイプフォーム */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="名前"
                value={floorForm.name}
                onChange={(e) => setFloorForm({ ...floorForm, name: e.target.value })}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="説明"
                value={floorForm.description}
                onChange={(e) => setFloorForm({ ...floorForm, description: e.target.value })}
                margin="normal"
                multiline
                rows={2}
              />
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2">色:</Typography>
                <input
                  type="color"
                  value={floorForm.color}
                  onChange={(e) => setFloorForm({ ...floorForm, color: e.target.value })}
                  style={{ width: 50, height: 30 }}
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
                    <Box sx={{ display: 'flex', gap: 1 }}>
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
                label="名前"
                value={wallForm.name}
                onChange={(e) => setWallForm({ ...wallForm, name: e.target.value })}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="説明"
                value={wallForm.description}
                onChange={(e) => setWallForm({ ...wallForm, description: e.target.value })}
                margin="normal"
                multiline
                rows={2}
              />
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2">色:</Typography>
                <input
                  type="color"
                  value={wallForm.color}
                  onChange={(e) => setWallForm({ ...wallForm, color: e.target.value })}
                  style={{ width: 50, height: 30 }}
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
                />
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
                />
              )}
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
          />
          <TextField
            size="small"
            label="値"
            value={newPropertyValue}
            onChange={(e) => setNewPropertyValue(e.target.value)}
          />
          <Button
            variant="outlined"
            onClick={() => handleAddProperty(customTypeDialogMode === 'floor')}
            disabled={!newPropertyKey.trim()}
          >
            追加
          </Button>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {Object.entries(
            customTypeDialogMode === 'floor' ? floorForm.properties : wallForm.properties
          ).map(([key, value]) => (
            <Chip
              key={key}
              label={`${key}: ${value}`}
              onDelete={() => handleRemoveProperty(key, customTypeDialogMode === 'floor')}
              size="small"
            />
          ))}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>キャンセル</Button>
        <Button 
          onClick={handleSave} 
          variant="contained"
          disabled={
            customTypeDialogMode === 'floor' ? !floorForm.name.trim() : 
            customTypeDialogMode === 'wall' ? !wallForm.name.trim() : true
          }
        >
          作成
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CustomTypeDialog