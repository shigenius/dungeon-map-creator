import React from 'react'
import { Box } from '@mui/material'
import { useSelector } from 'react-redux'
import { RootState } from './store'
import MenuBar from './components/MenuBar'
import ToolBar from './components/ToolBar'
import LeftPanel from './components/LeftPanel'
import RightPanel from './components/RightPanel'
import MainCanvas from './components/MainCanvas'
import BottomPanel from './components/BottomPanel'
import NewProjectDialog from './components/NewProjectDialog'

function App() {
  const dungeon = useSelector((state: RootState) => state.map.dungeon)

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