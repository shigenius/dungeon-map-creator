import React from 'react'
import {
  Box,
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
  Colorize as EyedropperIcon,
  Clear as ClearIcon,
} from '@mui/icons-material'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../store'
import { setSelectedLayer, toggleLayerVisibility, setSelectedFloorType, setSelectedWallType, clearCapturedCellData, toggleFloorTypeAccordion, toggleWallTypeAccordion } from '../store/editorSlice'
import { Layer, FloorType, WallType } from '../types/map'

const LeftPanel: React.FC = () => {
  const dispatch = useDispatch()
  const { selectedLayer, layerVisibility, selectedFloorType, selectedWallType, capturedCellData, accordionStates } = useSelector((state: RootState) => state.editor)
  const dungeon = useSelector((state: RootState) => state.map.dungeon)

  const layers: Array<{ key: Layer; name: string; icon: React.ReactNode }> = [
    { key: 'floor', name: '床レイヤー', icon: <FloorIcon /> },
    { key: 'walls', name: '壁レイヤー', icon: <WallIcon /> },
    { key: 'events', name: 'イベントレイヤー', icon: <EventIcon /> },
    { key: 'decorations', name: '装飾レイヤー', icon: <DecorationIcon /> },
  ]

  const floorTypes: Array<{ key: FloorType; name: string; color: string; description: string }> = [
    { key: 'normal', name: '通常', color: '#666', description: '通常の床' },
    { key: 'damage', name: 'ダメージ', color: '#800', description: 'ダメージを与える床' },
    { key: 'slippery', name: '滑りやすい', color: '#048', description: '滑りやすい床' },
    { key: 'pit', name: '落とし穴', color: '#000', description: '通行不可の穴' },
    { key: 'warp', name: 'ワープ', color: '#840', description: 'ワープポイント' },
  ]

  const wallTypes: Array<{ key: WallType; name: string; color: string; description: string }> = [
    { key: 'normal', name: '通常壁', color: '#fff', description: '標準的な壁' },
    { key: 'door', name: '扉', color: '#a52a2a', description: '通過可能な扉' },
    { key: 'locked_door', name: '鍵付き扉', color: '#daa520', description: '鍵が必要な扉' },
    { key: 'hidden_door', name: '隠し扉', color: '#696969', description: '隠された通路' },
    { key: 'breakable', name: '破壊可能壁', color: '#8b4513', description: '破壊できる壁' },
    { key: 'oneway', name: '片面壁', color: '#4169e1', description: '一方通行の壁' },
    { key: 'invisible', name: '透明壁', color: '#e0e0e0', description: '見えない壁' },
    { key: 'event', name: 'イベント壁', color: '#ff69b4', description: 'イベント付き壁' },
  ]

  const handleLayerSelect = (layer: Layer) => {
    dispatch(setSelectedLayer(layer))
  }

  const handleLayerVisibilityToggle = (layer: Layer) => {
    dispatch(toggleLayerVisibility(layer))
  }

  const handleFloorTypeSelect = (floorType: FloorType) => {
    dispatch(setSelectedFloorType(floorType))
  }

  const handleWallTypeSelect = (wallType: WallType) => {
    dispatch(setSelectedWallType(wallType))
  }
  
  const handleClearCapturedData = () => {
    dispatch(clearCapturedCellData())
  }

  const handleFloorTypeAccordionToggle = () => {
    dispatch(toggleFloorTypeAccordion())
  }

  const handleWallTypeAccordionToggle = () => {
    dispatch(toggleWallTypeAccordion())
  }

  return (
    <Box
      sx={{
        width: 280,
        height: '100%',
        bgcolor: 'background.paper',
        borderRight: 1,
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
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

      {/* 床タイプ選択 */}
      <Accordion expanded={accordionStates.floorTypeAccordion} onChange={handleFloorTypeAccordionToggle}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <FloorIcon sx={{ mr: 1 }} />
          <Typography>床タイプ選択</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 0 }}>
          <List dense>
            {floorTypes.map((floorType) => (
              <ListItem key={floorType.key} disablePadding>
                <ListItemButton
                  selected={selectedFloorType === floorType.key}
                  onClick={() => handleFloorTypeSelect(floorType.key)}
                  disabled={!dungeon || selectedLayer !== 'floor'}
                  sx={{ pl: 2 }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        bgcolor: floorType.color,
                        border: '1px solid #ccc',
                        borderRadius: '2px',
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText 
                    primary={floorType.name}
                    secondary={floorType.description}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </AccordionDetails>
      </Accordion>

      <Divider />

      {/* 壁タイプ選択 */}
      <Accordion expanded={accordionStates.wallTypeAccordion} onChange={handleWallTypeAccordionToggle}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <WallIcon sx={{ mr: 1 }} />
          <Typography>壁タイプ選択</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 0 }}>
          <List dense>
            {wallTypes.map((wallType) => (
              <ListItem key={wallType.key} disablePadding>
                <ListItemButton
                  selected={selectedWallType === wallType.key}
                  onClick={() => handleWallTypeSelect(wallType.key)}
                  disabled={!dungeon || selectedLayer !== 'walls'}
                  sx={{ pl: 2 }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        bgcolor: wallType.color,
                        border: '1px solid #ccc',
                        borderRadius: '2px',
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText 
                    primary={wallType.name}
                    secondary={wallType.description}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </AccordionDetails>
      </Accordion>

      <Divider />

      {/* キャプチャされたセル情報 */}
      {capturedCellData && (
        <>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <EyedropperIcon sx={{ mr: 1 }} />
              <Typography>キャプチャされたセル</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 2 }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  床タイプ
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      bgcolor: floorTypes.find(f => f.key === capturedCellData.floor.type)?.color || '#666',
                      border: '1px solid #ccc',
                      borderRadius: '2px',
                      mr: 1,
                    }}
                  />
                  <Typography variant="body2">
                    {floorTypes.find(f => f.key === capturedCellData.floor.type)?.name || '不明'}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  通行可否: {capturedCellData.floor.passable ? '可能' : '不可'}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  壁情報
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {capturedCellData.walls.north ? '壁あり' : '壁なし'}
                </Typography>
                {capturedCellData.walls.north && (
                  <Typography variant="body2">
                    タイプ: {wallTypes.find(w => w.key === capturedCellData.walls.north?.type)?.name || '不明'}
                  </Typography>
                )}
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  イベント
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {capturedCellData.hasEvents ? 'イベントあり' : 'イベントなし'}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Box
                  component="button"
                  onClick={handleClearCapturedData}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 2,
                    py: 1,
                    bgcolor: 'action.hover',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'action.selected',
                    },
                  }}
                >
                  <ClearIcon fontSize="small" />
                  <Typography variant="body2">クリア</Typography>
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>
          
          <Divider />
        </>
      )}

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
    </Box>
  )
}

export default LeftPanel