import React from 'react'
import { Box, Typography } from '@mui/material'
import { useSelector } from 'react-redux'
import { RootState } from '../store'
import MapEditor2D from './MapEditor2D'
import MapEditor3D from './MapEditor3D'

const MainCanvas: React.FC = () => {
  const { viewMode } = useSelector((state: RootState) => state.editor)
  const dungeon = useSelector((state: RootState) => state.map.dungeon)

  if (!dungeon) {
    return (
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <Typography variant="h6" color="text.secondary">
          プロジェクトを作成してください
        </Typography>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        bgcolor: 'background.default',
      }}
    >
      {viewMode === '2d' && <MapEditor2D />}
      {(viewMode === '3d' || viewMode === 'preview') && <MapEditor3D />}
    </Box>
  )
}

export default MainCanvas