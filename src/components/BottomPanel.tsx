import React from 'react'
import {
  Box,
  Paper,
  Typography,
  Chip,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material'
import {
  Map as MapIcon,
} from '@mui/icons-material'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../store'
import { toggleMinimap } from '../store/editorSlice'

const BottomPanel: React.FC = () => {
  const dispatch = useDispatch()
  const { zoom, selectedTool, selectedLayer, viewMode, minimapVisible } = useSelector((state: RootState) => state.editor)
  const dungeon = useSelector((state: RootState) => state.map.dungeon)

  return (
    <Paper
      elevation={0}
      sx={{
        height: 32,
        display: 'flex',
        alignItems: 'center',
        px: 2,
        bgcolor: 'background.paper',
        borderTop: 1,
        borderColor: 'divider',
        gap: 2,
      }}
    >
      <Typography variant="body2" color="text.secondary">
        座標: マウス位置に応じて更新
      </Typography>
      
      <Divider orientation="vertical" flexItem />
      
      <Typography variant="body2" color="text.secondary">
        ズーム: {Math.round(zoom * 100)}%
      </Typography>
      
      <Divider orientation="vertical" flexItem />
      
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Chip 
          label={`ツール: ${selectedTool}`} 
          size="small" 
          variant="outlined"
          disabled={!dungeon}
        />
        <Chip 
          label={`レイヤー: ${selectedLayer}`} 
          size="small" 
          variant="outlined"
          disabled={!dungeon}
        />
        <Chip 
          label={`表示: ${viewMode}`} 
          size="small" 
          variant="outlined"
          disabled={!dungeon}
        />
      </Box>
      
      <Divider orientation="vertical" flexItem />
      
      <Tooltip title={minimapVisible ? 'ミニマップを非表示' : 'ミニマップを表示'}>
        <IconButton
          size="small"
          onClick={() => dispatch(toggleMinimap())}
          disabled={!dungeon}
          sx={{ 
            color: minimapVisible ? 'primary.main' : 'text.secondary',
            '&:hover': {
              color: 'primary.main'
            }
          }}
        >
          <MapIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      
      <Box sx={{ ml: 'auto' }}>
        <Typography variant="body2" color="text.secondary">
          検証結果: 準備完了
        </Typography>
      </Box>
    </Paper>
  )
}

export default BottomPanel