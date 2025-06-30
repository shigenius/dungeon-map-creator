import React from 'react'
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Checkbox,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
  Layers as LayersIcon,
  ViewList as ObjectListIcon,
  Terrain as FloorIcon,
  CropSquare as WallIcon,
  Event as EventIcon,
  Palette as DecorationIcon,
} from '@mui/icons-material'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../store'
import { setSelectedLayer, toggleLayerVisibility } from '../store/editorSlice'
import { Layer } from '../types/map'

const LeftPanel: React.FC = () => {
  const dispatch = useDispatch()
  const { selectedLayer, layerVisibility } = useSelector((state: RootState) => state.editor)
  const dungeon = useSelector((state: RootState) => state.map.dungeon)

  const layers: Array<{ key: Layer; name: string; icon: React.ReactNode }> = [
    { key: 'floor', name: '床レイヤー', icon: <FloorIcon /> },
    { key: 'walls', name: '壁レイヤー', icon: <WallIcon /> },
    { key: 'events', name: 'イベントレイヤー', icon: <EventIcon /> },
    { key: 'decorations', name: '装飾レイヤー', icon: <DecorationIcon /> },
  ]

  const handleLayerSelect = (layer: Layer) => {
    dispatch(setSelectedLayer(layer))
  }

  const handleLayerVisibilityToggle = (layer: Layer) => {
    dispatch(toggleLayerVisibility(layer))
  }

  return (
    <Box
      sx={{
        width: 280,
        bgcolor: 'background.paper',
        borderRight: 1,
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* レイヤー管理 */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <LayersIcon sx={{ mr: 1 }} />
          <Typography>レイヤー管理</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 0 }}>
          <List dense>
            {layers.map((layer) => (
              <ListItem key={layer.key} disablePadding>
                <ListItemButton
                  selected={selectedLayer === layer.key}
                  onClick={() => handleLayerSelect(layer.key)}
                  disabled={!dungeon}
                  sx={{ pl: 2 }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <Checkbox
                      edge="start"
                      checked={layerVisibility[layer.key]}
                      onChange={() => handleLayerVisibilityToggle(layer.key)}
                      size="small"
                      disabled={!dungeon}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </ListItemIcon>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    {layer.icon}
                  </ListItemIcon>
                  <ListItemText primary={layer.name} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </AccordionDetails>
      </Accordion>

      <Divider />

      {/* オブジェクトリスト */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <ObjectListIcon sx={{ mr: 1 }} />
          <Typography>オブジェクトリスト</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" color="text.secondary">
            {dungeon ? 'オブジェクトが表示されます' : 'プロジェクトを作成してください'}
          </Typography>
        </AccordionDetails>
      </Accordion>
    </Box>
  )
}

export default LeftPanel