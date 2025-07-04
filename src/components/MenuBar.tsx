import React from 'react'
import {
  AppBar,
  Toolbar,
  Typography,
  Menu,
  MenuItem,
  Button,
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
} from '@mui/material'
import {
  Visibility,
  VisibilityOff,
  Layers,
  Home,
  CropSquare as Wall,
  Event,
  Palette,
  Grid3x3 as GridIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../store'
import { undo, redo, loadDungeon } from '../store/mapSlice'
import { 
  setViewMode, 
  openNewProjectDialog, 
  setSelectedLayer, 
  toggleLayerVisibility,
  openHelpDialog,
  toggleGrid,
  openMapValidationDialog
} from '../store/editorSlice'
import { downloadDungeonAsJSON, openDungeonFromFile } from '../utils/fileUtils'
import { Layer } from '../types/map'

const MenuBar: React.FC = () => {
  const dispatch = useDispatch()
  const dungeon = useSelector((state: RootState) => state.map.dungeon)
  const selectedLayer = useSelector((state: RootState) => state.editor.selectedLayer)
  const layerVisibility = useSelector((state: RootState) => state.editor.layerVisibility)
  const gridVisible = useSelector((state: RootState) => state.editor.gridVisible)
  const [fileMenuAnchor, setFileMenuAnchor] = React.useState<null | HTMLElement>(null)
  const [editMenuAnchor, setEditMenuAnchor] = React.useState<null | HTMLElement>(null)
  const [viewMenuAnchor, setViewMenuAnchor] = React.useState<null | HTMLElement>(null)
  const [helpMenuAnchor, setHelpMenuAnchor] = React.useState<null | HTMLElement>(null)

  const handleFileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setFileMenuAnchor(event.currentTarget)
  }

  const handleEditMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setEditMenuAnchor(event.currentTarget)
  }

  const handleViewMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setViewMenuAnchor(event.currentTarget)
  }

  const handleHelpMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setHelpMenuAnchor(event.currentTarget)
  }

  const handleMenuClose = () => {
    setFileMenuAnchor(null)
    setEditMenuAnchor(null)
    setViewMenuAnchor(null)
    setHelpMenuAnchor(null)
  }

  const handleUndo = () => {
    dispatch(undo())
    handleMenuClose()
  }

  const handleRedo = () => {
    dispatch(redo())
    handleMenuClose()
  }

  const handleExportJSON = () => {
    if (dungeon) {
      downloadDungeonAsJSON(dungeon)
    }
    handleMenuClose()
  }

  const handleSwitchView = (mode: '2d' | '3d' | 'preview') => {
    dispatch(setViewMode(mode))
    handleMenuClose()
  }

  const handleNewProject = () => {
    dispatch(openNewProjectDialog())
    handleMenuClose()
  }


  const handleOpen = () => {
    console.log('ファイルを開くメニューがクリックされました')
    openDungeonFromFile(
      (dungeonData) => {
        console.log('ファイルから読み込んだデータ:', dungeonData)
        dispatch(loadDungeon(dungeonData))
        console.log('Redux storeにデータを読み込み完了')
      },
      (error) => {
        console.error('ファイルの読み込みに失敗しました:', error)
      }
    )
    handleMenuClose()
  }

  const handleLayerChange = (layer: Layer) => {
    dispatch(setSelectedLayer(layer))
  }

  const handleLayerVisibilityToggle = (layer: Layer) => {
    dispatch(toggleLayerVisibility(layer))
  }

  const handleToggleGrid = () => {
    dispatch(toggleGrid())
  }

  const getLayerIcon = (layer: Layer) => {
    switch (layer) {
      case 'floor':
        return <Home />
      case 'walls':
        return <Wall />
      case 'events':
        return <Event />
      case 'decorations':
        return <Palette />
      default:
        return <Layers />
    }
  }

  const getLayerLabel = (layer: Layer) => {
    switch (layer) {
      case 'floor':
        return '床'
      case 'walls':
        return '壁'
      case 'events':
        return 'イベント'
      case 'decorations':
        return '装飾'
      default:
        return ''
    }
  }

  return (
    <AppBar position="static" sx={{ zIndex: 1201 }}>
      {/* 第一段：メインメニュー */}
      <Toolbar variant="dense">
        <Typography variant="h6" component="div" sx={{ mr: 2 }}>
          3D ダンジョンマップクリエイター
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button color="inherit" onClick={handleFileMenuOpen}>
            ファイル
          </Button>
          <Button color="inherit" onClick={handleEditMenuOpen} disabled={!dungeon}>
            編集
          </Button>
          <Button color="inherit" onClick={handleViewMenuOpen} disabled={!dungeon}>
            表示
          </Button>
          <Button 
            color="inherit" 
            startIcon={<AssessmentIcon />}
            onClick={() => {
              dispatch(openMapValidationDialog())
              handleMenuClose()
            }}
            disabled={!dungeon}
          >
            マップ検証
          </Button>
          <Button color="inherit" onClick={handleHelpMenuOpen}>
            ヘルプ
          </Button>
        </Box>

        {dungeon && (
          <Typography variant="body2" sx={{ ml: 'auto' }}>
            {dungeon.name}
          </Typography>
        )}
      </Toolbar>

      {/* 第二段：レイヤー管理 */}
      {dungeon && (
        <>
          <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.12)' }} />
          <Toolbar variant="dense" sx={{ minHeight: 48, gap: 2 }}>
            <Typography variant="body2" sx={{ mr: 1 }}>
              編集レイヤー:
            </Typography>
            
            <ToggleButtonGroup
              value={selectedLayer}
              exclusive
              onChange={(_, value) => value && handleLayerChange(value)}
              size="small"
              sx={{ mr: 3 }}
            >
              {(['floor', 'walls', 'events', 'decorations'] as Layer[]).map((layer) => (
                <ToggleButton
                  key={layer}
                  value={layer}
                  sx={{ 
                    px: 2, 
                    py: 0.5,
                    color: 'inherit',
                    '&.Mui-selected': {
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      color: 'inherit',
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.3)',
                      }
                    }
                  }}
                >
                  {getLayerIcon(layer)}
                  <Box component="span" sx={{ ml: 1 }}>
                    {getLayerLabel(layer)}
                  </Box>
                </ToggleButton>
              ))}
            </ToggleButtonGroup>

            <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255, 255, 255, 0.12)' }} />
            
            <Typography variant="body2" sx={{ ml: 2, mr: 1 }}>
              表示/非表示:
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              {(['floor', 'walls', 'events', 'decorations'] as Layer[]).map((layer) => (
                <Button
                  key={layer}
                  size="small"
                  startIcon={layerVisibility[layer] ? <Visibility /> : <VisibilityOff />}
                  onClick={() => handleLayerVisibilityToggle(layer)}
                  sx={{ 
                    color: layerVisibility[layer] ? 'inherit' : 'rgba(255, 255, 255, 0.5)',
                    minWidth: 'auto',
                    px: 1,
                    py: 0.5
                  }}
                >
                  {getLayerLabel(layer)}
                </Button>
              ))}
              
              <Divider orientation="vertical" flexItem sx={{ mx: 1, borderColor: 'rgba(255, 255, 255, 0.12)' }} />
              
              <Button
                size="small"
                startIcon={<GridIcon />}
                onClick={handleToggleGrid}
                sx={{ 
                  color: gridVisible ? 'inherit' : 'rgba(255, 255, 255, 0.5)',
                  minWidth: 'auto',
                  px: 1,
                  py: 0.5
                }}
              >
                グリッド
              </Button>
            </Box>
          </Toolbar>
        </>
      )}

      {/* ファイルメニュー */}
      <Menu
        anchorEl={fileMenuAnchor}
        open={Boolean(fileMenuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleNewProject}>新規作成</MenuItem>
        <MenuItem onClick={handleOpen}>開く</MenuItem>
        <MenuItem onClick={handleExportJSON} disabled={!dungeon}>保存</MenuItem>
      </Menu>

      {/* 編集メニュー */}
      <Menu
        anchorEl={editMenuAnchor}
        open={Boolean(editMenuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleUndo}>元に戻す (Ctrl+Z)</MenuItem>
        <MenuItem onClick={handleRedo}>やり直し (Ctrl+Y)</MenuItem>
        <MenuItem onClick={handleMenuClose} disabled>コピー (Ctrl+C)</MenuItem>
        <MenuItem onClick={handleMenuClose} disabled>ペースト (Ctrl+V)</MenuItem>
      </Menu>

      {/* 表示メニュー */}
      <Menu
        anchorEl={viewMenuAnchor}
        open={Boolean(viewMenuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleSwitchView('2d')}>2D編集モード</MenuItem>
        <MenuItem onClick={() => handleSwitchView('3d')}>3D編集モード</MenuItem>
        <MenuItem onClick={() => handleSwitchView('preview')}>プレビューモード</MenuItem>
      </Menu>

      {/* ヘルプメニュー */}
      <Menu
        anchorEl={helpMenuAnchor}
        open={Boolean(helpMenuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          dispatch(openHelpDialog())
          handleMenuClose()
        }}>
          操作方法・ヘルプ
        </MenuItem>
        <MenuItem onClick={handleMenuClose} disabled>
          アバウト
        </MenuItem>
      </Menu>
    </AppBar>
  )
}

export default MenuBar