import React, { useCallback } from 'react'
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
  GridOn as FloorIcon,
  ViewWeek as WallIcon,
  Event,
  Palette,
  Grid3x3 as GridIcon,
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
  openAboutDialog,
  toggleGrid,
  setCustomFloorTypes,
  setCustomWallTypes,
  setCustomDecorationTypes
} from '../store/editorSlice'
import { downloadDungeonAsJSON, openDungeonFromFile } from '../utils/fileUtils'
import { Layer } from '../types/map'

const MenuBar: React.FC = () => {
  const dispatch = useDispatch()
  const dungeon = useSelector((state: RootState) => state.map.dungeon)
  const selectedLayer = useSelector((state: RootState) => state.editor.selectedLayer)
  const layerVisibility = useSelector((state: RootState) => state.editor.layerVisibility)
  const gridVisible = useSelector((state: RootState) => state.editor.gridVisible)
  const customFloorTypes = useSelector((state: RootState) => state.editor.customFloorTypes)
  const customWallTypes = useSelector((state: RootState) => state.editor.customWallTypes)
  const customDecorationTypes = useSelector((state: RootState) => state.editor.customDecorationTypes)
  const [fileMenuAnchor, setFileMenuAnchor] = React.useState<null | HTMLElement>(null)
  const [editMenuAnchor, setEditMenuAnchor] = React.useState<null | HTMLElement>(null)
  const [viewMenuAnchor, setViewMenuAnchor] = React.useState<null | HTMLElement>(null)
  const [helpMenuAnchor, setHelpMenuAnchor] = React.useState<null | HTMLElement>(null)

  // キーボードナビゲーション用のハンドラー
  const handleMenuKeyDown = useCallback((event: React.KeyboardEvent, menuType: string) => {
    switch (event.key) {
      case 'ArrowRight':
        // 次のメニューに移動
        event.preventDefault()
        closeAllMenus()
        const nextMenu = getNextMenu(menuType)
        if (nextMenu) {
          const nextButton = document.querySelector(`[aria-label="${nextMenu}メニュー"]`) as HTMLElement
          nextButton?.focus()
        }
        break
      case 'ArrowLeft':
        // 前のメニューに移動
        event.preventDefault()
        closeAllMenus()
        const prevMenu = getPrevMenu(menuType)
        if (prevMenu) {
          const prevButton = document.querySelector(`[aria-label="${prevMenu}メニュー"]`) as HTMLElement
          prevButton?.focus()
        }
        break
      case 'Escape':
        // メニューを閉じる
        event.preventDefault()
        closeAllMenus()
        break
    }
  }, [])

  const closeAllMenus = () => {
    setFileMenuAnchor(null)
    setEditMenuAnchor(null)
    setViewMenuAnchor(null)
    setHelpMenuAnchor(null)
  }

  const getNextMenu = (current: string): string | null => {
    const menus = ['ファイル', '編集', '表示', 'ヘルプ']
    const currentIndex = menus.indexOf(current)
    return currentIndex < menus.length - 1 ? menus[currentIndex + 1] : menus[0]
  }

  const getPrevMenu = (current: string): string | null => {
    const menus = ['ファイル', '編集', '表示', 'ヘルプ']
    const currentIndex = menus.indexOf(current)
    return currentIndex > 0 ? menus[currentIndex - 1] : menus[menus.length - 1]
  }

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
      downloadDungeonAsJSON(dungeon, customFloorTypes, customWallTypes, customDecorationTypes)
    }
    handleMenuClose()
  }

  const handleSwitchView = (mode: '2d' | '3d') => {
    dispatch(setViewMode(mode))
    handleMenuClose()
  }

  const handleNewProject = () => {
    dispatch(openNewProjectDialog({}))
    handleMenuClose()
  }


  const handleOpen = () => {
    console.log('ファイルを開くメニューがクリックされました')
    openDungeonFromFile(
      (dungeonData, customFloorTypes, customWallTypes, customDecorationTypes) => {
        console.log('ファイルから読み込んだデータ:', dungeonData)
        console.log('カスタム床タイプ:', customFloorTypes)
        console.log('カスタム壁タイプ:', customWallTypes)
        console.log('カスタム装飾タイプ:', customDecorationTypes)
        
        dispatch(loadDungeon(dungeonData))
        
        // カスタムタイプをエディタに設定
        if (customFloorTypes) {
          dispatch(setCustomFloorTypes(customFloorTypes))
        }
        if (customWallTypes) {
          dispatch(setCustomWallTypes(customWallTypes))
        }
        if (customDecorationTypes) {
          dispatch(setCustomDecorationTypes(customDecorationTypes))
        }
        
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

  const handleAbout = () => {
    dispatch(openAboutDialog())
    handleMenuClose()
  }

  const getLayerIcon = (layer: Layer) => {
    switch (layer) {
      case 'floor':
        return <FloorIcon />
      case 'walls':
        return <WallIcon />
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
        
        <Box sx={{ display: 'flex', gap: 1 }} role="menubar" aria-label="メインメニューバー">
          <Button 
            color="inherit" 
            onClick={handleFileMenuOpen}
            onKeyDown={(e) => handleMenuKeyDown(e, 'ファイル')}
            aria-label="ファイルメニュー"
            aria-haspopup="true"
            aria-expanded={Boolean(fileMenuAnchor)}
            aria-controls={fileMenuAnchor ? 'file-menu' : undefined}
          >
            ファイル
          </Button>
          <Button 
            color="inherit" 
            onClick={handleEditMenuOpen} 
            disabled={!dungeon}
            onKeyDown={(e) => handleMenuKeyDown(e, '編集')}
            aria-label="編集メニュー"
            aria-haspopup="true"
            aria-expanded={Boolean(editMenuAnchor)}
            aria-controls={editMenuAnchor ? 'edit-menu' : undefined}
          >
            編集
          </Button>
          <Button 
            color="inherit" 
            onClick={handleViewMenuOpen}
            disabled={!dungeon}
            onKeyDown={(e) => handleMenuKeyDown(e, '表示')}
            aria-label="表示メニュー"
            aria-haspopup="true"
            aria-expanded={Boolean(viewMenuAnchor)}
            aria-controls={viewMenuAnchor ? 'view-menu' : undefined}
          >
            表示
          </Button>
          <Button 
            color="inherit" 
            onClick={handleHelpMenuOpen}
            onKeyDown={(e) => handleMenuKeyDown(e, 'ヘルプ')}
            aria-label="ヘルプメニュー"
            aria-haspopup="true"
            aria-expanded={Boolean(helpMenuAnchor)}
            aria-controls={helpMenuAnchor ? 'help-menu' : undefined}
          >
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
              role="radiogroup"
              aria-label="編集レイヤー選択"
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
                  role="radio"
                  aria-checked={selectedLayer === layer}
                  aria-label={`${getLayerLabel(layer)}レイヤーを選択`}
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
        <MenuItem 
          onClick={handleUndo}
          role="menuitem"
          aria-label="元に戻す (Ctrl+Z)"
        >
          元に戻す (Ctrl+Z)
        </MenuItem>
        <MenuItem 
          onClick={handleRedo}
          role="menuitem"
          aria-label="やり直し (Ctrl+Y)"
        >
          やり直し (Ctrl+Y)
        </MenuItem>
        <MenuItem onClick={handleMenuClose} disabled>コピー (Ctrl+C)</MenuItem>
        <MenuItem onClick={handleMenuClose} disabled>ペースト (Ctrl+V)</MenuItem>
      </Menu>

      {/* 表示メニュー */}
      <Menu
        id="view-menu"
        anchorEl={viewMenuAnchor}
        open={Boolean(viewMenuAnchor)}
        onClose={handleMenuClose}
        MenuListProps={{
          'aria-labelledby': 'view-menu-button',
          role: 'menu',
        }}
      >
        <MenuItem 
          onClick={() => handleSwitchView('2d')}
          role="menuitem"
          aria-label="2D編集モードに切り替え"
        >
          2D編集モード
        </MenuItem>
        <MenuItem 
          onClick={() => handleSwitchView('3d')}
          role="menuitem"
          aria-label="3Dプレビューモードに切り替え"
        >
          3Dプレビューモード
        </MenuItem>
      </Menu>

      {/* ヘルプメニュー */}
      <Menu
        id="help-menu"
        anchorEl={helpMenuAnchor}
        open={Boolean(helpMenuAnchor)}
        onClose={handleMenuClose}
        MenuListProps={{
          'aria-labelledby': 'help-menu-button',
          role: 'menu',
        }}
      >
        <MenuItem onClick={() => {
          dispatch(openHelpDialog())
          handleMenuClose()
        }}>
          操作方法・ヘルプ
        </MenuItem>
        <MenuItem onClick={handleAbout}>
          アバウト
        </MenuItem>
      </Menu>
    </AppBar>
  )
}

export default MenuBar