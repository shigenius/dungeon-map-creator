import { useEffect, lazy, Suspense } from 'react'
import { Box, CircularProgress } from '@mui/material'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from './store'
import { undo, redo, loadDungeon, addEventToCell, updateEventInCell, removeEventFromCell } from './store/mapSlice'
import { setSelectedTool, setSelectedLayer, toggleGrid, setZoom, openNewProjectDialog, setShiftPressed, closeEventEditDialog, rotateTemplate, rotateTemplateLeft, closeHelpDialog, clearSelection, setCustomFloorTypes, setCustomWallTypes, setCustomDecorationTypes } from './store/editorSlice'
import { downloadDungeonAsJSON, openDungeonFromFile } from './utils/fileUtils'
import MenuBar from './components/MenuBar'
import ToolBar from './components/ToolBar'
import LeftPanel from './components/LeftPanel'
import RightPanel from './components/RightPanel'
import BottomPanel from './components/BottomPanel'
import AccessibilityAnnouncer from './components/AccessibilityAnnouncer'

// コード分割: 大きなコンポーネントを遅延読み込み
const MainCanvas = lazy(() => import('./components/MainCanvas'))
const NewProjectDialog = lazy(() => import('./components/NewProjectDialog'))
const CustomTypeDialog = lazy(() => import('./components/CustomTypeDialog'))
const EventEditDialog = lazy(() => import('./components/EventEditDialog'))
const CreateTemplateDialog = lazy(() => import('./components/CreateTemplateDialog'))
const HelpDialog = lazy(() => import('./components/HelpDialog'))
const AboutDialog = lazy(() => import('./components/AboutDialog'))

// サスペンス用のローディングコンポーネント
const LoadingSpinner = () => (
  <Box 
    display="flex" 
    justifyContent="center" 
    alignItems="center" 
    height="100px"
  >
    <CircularProgress size={24} />
  </Box>
)

function App() {
  const dispatch = useDispatch()
  const dungeon = useSelector((state: RootState) => state.map.dungeon)
  const { zoom, selectedLayer, showNewProjectDialog, showEventEditDialog, editingEvent, selectedTool, selectedTemplate, selectionMode, showHelpDialog, currentFloor, customFloorTypes, customWallTypes, customDecorationTypes } = useSelector((state: RootState) => state.editor)

  // ダンジョンが存在しない場合に新規プロジェクトダイアログを表示
  useEffect(() => {
    if (!dungeon && !showNewProjectDialog) {
      dispatch(openNewProjectDialog({ isInitial: true }))
    }
  }, [dungeon, showNewProjectDialog, dispatch])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // デバッグ用：全てのキーイベントを一時的にログ出力（テスト用）
      // console.log('キーイベント受信（全て）:', {
      //   key: event.key,
      //   code: event.code,
      //   keyCode: event.keyCode,
      //   which: event.which,
      //   target: (event.target as HTMLElement).tagName,
      //   targetId: (event.target as HTMLElement).id,
      //   targetClass: (event.target as HTMLElement).className,
      //   activeElement: document.activeElement?.tagName,
      //   activeElementId: document.activeElement?.id,
      //   activeElementClass: document.activeElement?.className,
      //   isComposing: event.isComposing,
      //   isTrusted: event.isTrusted,
      //   bubbles: event.bubbles,
      //   cancelable: event.cancelable,
      //   defaultPrevented: event.defaultPrevented
      // })
      
      // Shiftキーの状態を追跡
      if (event.key === 'Shift') {
        dispatch(setShiftPressed(true))
      }

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
              downloadDungeonAsJSON(dungeon, customFloorTypes, customWallTypes, customDecorationTypes)
            }
            break
          case 'g':
            event.preventDefault()
            dispatch(toggleGrid())
            break
          case 'n':
            if (!event.shiftKey) {
              event.preventDefault()
              dispatch(openNewProjectDialog({}))
            }
            break
          case 'o':
            event.preventDefault()
            // ファイルを開く
            openDungeonFromFile(
              (dungeonData, customFloorTypes, customWallTypes, customDecorationTypes) => {
                dispatch(loadDungeon(dungeonData))
                if (customFloorTypes) dispatch(setCustomFloorTypes(customFloorTypes))
                if (customWallTypes) dispatch(setCustomWallTypes(customWallTypes))
                if (customDecorationTypes) dispatch(setCustomDecorationTypes(customDecorationTypes))
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
          case 'q':
          case 'Q':
            // Qキーでテンプレート左回転
            if (selectedTool === 'template' && selectedTemplate && !selectedTemplate.isFullMap) {
              event.preventDefault()
              dispatch(rotateTemplateLeft())
            }
            break
          case 'r':
          case 'R':
            // Rキーでテンプレート右回転
            if (selectedTool === 'template' && selectedTemplate && !selectedTemplate.isFullMap) {
              event.preventDefault()
              dispatch(rotateTemplate())
            }
            break
          case 'Escape':
            // ESCキーで範囲選択をキャンセル
            if (selectionMode) {
              event.preventDefault()
              dispatch(clearSelection())
            }
            break
        }
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      // Shiftキーの状態を追跡
      if (event.key === 'Shift') {
        dispatch(setShiftPressed(false))
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
    }
  }, [dispatch, dungeon, zoom, selectedLayer, selectedTool, selectedTemplate, selectionMode])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <MenuBar />
      <ToolBar />
      
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <LeftPanel />
        
        <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <Suspense fallback={<LoadingSpinner />}>
            <MainCanvas />
          </Suspense>
          <BottomPanel />
        </Box>
        
        <RightPanel />
      </Box>
      
      <Suspense fallback={<LoadingSpinner />}>
        {showNewProjectDialog && <NewProjectDialog />}
        <CustomTypeDialog />
        <CreateTemplateDialog />
        <HelpDialog 
          open={showHelpDialog}
          onClose={() => dispatch(closeHelpDialog())}
        />
        <AboutDialog />

        {/* マップ検証ダイアログ */}
        <EventEditDialog 
        open={showEventEditDialog}
        event={editingEvent}
        onClose={() => dispatch(closeEventEditDialog())}
        onSave={(event) => {
          // 元のイベントがApp.tsxで管理されているeditingEventとして存在するかで判定
          // ID変更時も考慮して、元の位置にあるイベントを検索
          const originalEvent = editingEvent
          let isExistingEvent = false
          
          if (originalEvent && dungeon?.floors[currentFloor]?.cells) {
            // 元の位置で元のIDを持つイベントが存在するかチェック
            const originalCell = dungeon.floors[currentFloor].cells[originalEvent.position.y]?.[originalEvent.position.x]
            isExistingEvent = originalCell?.events.some(e => e.id === originalEvent.id) || false
          }
          
          console.log('EventEditDialog onSave:', {
            hasOriginalEvent: !!originalEvent,
            originalEventId: originalEvent?.id,
            originalPosition: originalEvent?.position,
            isExistingEvent,
            saveEventId: event.id,
            saveEventName: event.name,
            savePosition: event.position
          })
          
          if (isExistingEvent && originalEvent) {
            // 既存イベントの更新
            console.log('既存イベント更新実行')
            dispatch(updateEventInCell({
              oldX: originalEvent.position.x,
              oldY: originalEvent.position.y,
              newX: event.position.x,
              newY: event.position.y,
              event,
              originalEventId: originalEvent.id, // 元のIDを渡す
              floorIndex: currentFloor
            }))
          } else {
            // 新しいイベントの追加
            console.log('新規イベント追加実行')
            dispatch(addEventToCell({
              x: event.position.x,
              y: event.position.y,
              event,
              floorIndex: currentFloor
            }))
          }
        }}
        onDelete={(eventId) => {
          if (editingEvent) {
            dispatch(removeEventFromCell({
              x: editingEvent.position.x,
              y: editingEvent.position.y,
              eventId,
              floorIndex: currentFloor
            }))
          }
        }}
      />
      </Suspense>
      
      {/* アクセシビリティアナウンサー */}
      <AccessibilityAnnouncer />
    </Box>
  )
}

export default App