import React, { useEffect } from 'react'
import { Box } from '@mui/material'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from './store'
import { undo, redo } from './store/mapSlice'
import { setSelectedTool } from './store/editorSlice'
import MenuBar from './components/MenuBar'
import ToolBar from './components/ToolBar'
import LeftPanel from './components/LeftPanel'
import RightPanel from './components/RightPanel'
import MainCanvas from './components/MainCanvas'
import BottomPanel from './components/BottomPanel'
import NewProjectDialog from './components/NewProjectDialog'

function App() {
  const dispatch = useDispatch()
  const dungeon = useSelector((state: RootState) => state.map.dungeon)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // ダイアログが開いている時はショートカットを無効化
      if (!dungeon) return

      // テキスト入力中はショートカットを無効化
      const target = event.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 'z':
            event.preventDefault()
            if (event.shiftKey) {
              dispatch(redo())
            } else {
              dispatch(undo())
            }
            break
          case 'y':
            event.preventDefault()
            dispatch(redo())
            break
          case 's':
            event.preventDefault()
            // 保存機能（将来実装）
            console.log('保存ショートカット')
            break
        }
      } else {
        // ツール切り替えショートカット
        switch (event.key) {
          case '1':
            event.preventDefault()
            dispatch(setSelectedTool('pen'))
            break
          case '2':
            event.preventDefault()
            dispatch(setSelectedTool('rectangle'))
            break
          case '3':
            event.preventDefault()
            dispatch(setSelectedTool('fill'))
            break
          case '4':
            event.preventDefault()
            dispatch(setSelectedTool('eyedropper'))
            break
          case '5':
            event.preventDefault()
            dispatch(setSelectedTool('select'))
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [dispatch, dungeon])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <MenuBar />
      <ToolBar />
      
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <LeftPanel />
        
        <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <MainCanvas />
          <BottomPanel />
        </Box>
        
        <RightPanel />
      </Box>
      
      {!dungeon && <NewProjectDialog />}
    </Box>
  )
}

export default App