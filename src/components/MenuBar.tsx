import React from 'react'
import {
  AppBar,
  Toolbar,
  Typography,
  Menu,
  MenuItem,
  Button,
  Box,
} from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../store'
import { undo, redo, loadDungeon } from '../store/mapSlice'
import { setViewMode, openNewProjectDialog } from '../store/editorSlice'
import { downloadDungeonAsJSON, openDungeonFromFile } from '../utils/fileUtils'

const MenuBar: React.FC = () => {
  const dispatch = useDispatch()
  const dungeon = useSelector((state: RootState) => state.map.dungeon)
  const [fileMenuAnchor, setFileMenuAnchor] = React.useState<null | HTMLElement>(null)
  const [editMenuAnchor, setEditMenuAnchor] = React.useState<null | HTMLElement>(null)
  const [viewMenuAnchor, setViewMenuAnchor] = React.useState<null | HTMLElement>(null)

  const handleFileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setFileMenuAnchor(event.currentTarget)
  }

  const handleEditMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setEditMenuAnchor(event.currentTarget)
  }

  const handleViewMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setViewMenuAnchor(event.currentTarget)
  }

  const handleMenuClose = () => {
    setFileMenuAnchor(null)
    setEditMenuAnchor(null)
    setViewMenuAnchor(null)
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

  const handleSave = () => {
    if (dungeon) {
      downloadDungeonAsJSON(dungeon)
    }
    handleMenuClose()
  }

  const handleOpen = () => {
    openDungeonFromFile(
      (dungeonData) => {
        dispatch(loadDungeon(dungeonData))
        console.log('ファイルから読み込んだデータ:', dungeonData)
      },
      (error) => {
        console.error('ファイルの読み込みに失敗しました:', error)
      }
    )
    handleMenuClose()
  }

  return (
    <AppBar position="static" sx={{ zIndex: 1201 }}>
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
          <Button color="inherit" disabled>
            ツール
          </Button>
          <Button color="inherit" disabled>
            ヘルプ
          </Button>
        </Box>

        {dungeon && (
          <Typography variant="body2" sx={{ ml: 'auto' }}>
            {dungeon.name}
          </Typography>
        )}
      </Toolbar>

      {/* ファイルメニュー */}
      <Menu
        anchorEl={fileMenuAnchor}
        open={Boolean(fileMenuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleNewProject}>新規作成</MenuItem>
        <MenuItem onClick={handleOpen}>開く</MenuItem>
        <MenuItem onClick={handleSave} disabled={!dungeon}>保存</MenuItem>
        <MenuItem onClick={handleExportJSON} disabled={!dungeon}>JSONエクスポート</MenuItem>
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
    </AppBar>
  )
}

export default MenuBar