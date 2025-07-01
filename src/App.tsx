import { useEffect } from 'react'
import { Box } from '@mui/material'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from './store'
import { undo, redo, loadDungeon } from './store/mapSlice'
import { setSelectedTool, setSelectedLayer, toggleGrid, setZoom, openNewProjectDialog } from './store/editorSlice'
import { downloadDungeonAsJSON, openDungeonFromFile } from './utils/fileUtils'
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
  const { zoom, selectedLayer, showNewProjectDialog } = useSelector((state: RootState) => state.editor)

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
            // 保存機能
            if (dungeon) {
              downloadDungeonAsJSON(dungeon)
            }
            break
          case 'g':
            event.preventDefault()
            dispatch(toggleGrid())
            break
          case 'n':
            if (!event.shiftKey) {
              event.preventDefault()
              dispatch(openNewProjectDialog())
            }
            break
          case 'o':
            event.preventDefault()
            // ファイルを開く
            openDungeonFromFile(
              (dungeonData) => {
                dispatch(loadDungeon(dungeonData))
                console.log('ファイルから読み込んだデータ:', dungeonData)
              },
              (error) => {
                console.error('ファイルの読み込みに失敗しました:', error)
              }
            )
            break
          case '=':
          case '+':
            event.preventDefault()
            dispatch(setZoom(Math.min(zoom * 1.2, 4.0)))
            break
          case '-':
            event.preventDefault()
            dispatch(setZoom(Math.max(zoom / 1.2, 0.1)))
            break
          case '0':
            event.preventDefault()
            dispatch(setZoom(1.0))
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
          case '6':
            event.preventDefault()
            dispatch(setSelectedTool('eraser'))
            break
          case 'f':
            event.preventDefault()
            dispatch(setSelectedLayer('floor'))
            break
          case 'w':
            event.preventDefault()
            dispatch(setSelectedLayer('walls'))
            break
          case 'e':
            event.preventDefault()
            dispatch(setSelectedLayer('events'))
            break
          case 'd':
            event.preventDefault()
            dispatch(setSelectedLayer('decorations'))
            break
          case 'Tab':
            event.preventDefault()
            // レイヤー循環切り替え
            const layers = ['floor', 'walls', 'events', 'decorations'] as const
            const currentIndex = layers.indexOf(selectedLayer)
            const nextIndex = (currentIndex + 1) % layers.length
            dispatch(setSelectedLayer(layers[nextIndex]))
            break
          case ' ':
            event.preventDefault()
            // スペースキーでグリッド切り替え
            dispatch(toggleGrid())
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [dispatch, dungeon, zoom, selectedLayer])

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
      
      {(!dungeon || showNewProjectDialog) && <NewProjectDialog />}
    </Box>
  )
}

export default App