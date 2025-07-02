import React from 'react'
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
  Settings as PropertiesIcon,
  GridView as TemplateIcon,
  Event as EventIcon,
  Info as InfoIcon,
} from '@mui/icons-material'
import { useSelector } from 'react-redux'
import { RootState } from '../store'
import EventEditor from './EventEditor'

const RightPanel: React.FC = () => {
  const dungeon = useSelector((state: RootState) => state.map.dungeon)
  const { selectedLayer, hoveredCellInfo } = useSelector((state: RootState) => state.editor)
  
  // 壁タイプの日本語名を取得する関数
  const getWallTypeName = (wallType: string) => {
    switch (wallType) {
      case 'normal': return '通常壁'
      case 'door': return '扉'
      case 'locked_door': return '鍵付き扉'
      case 'hidden_door': return '隠し扉'
      case 'breakable': return '壊せる壁'
      case 'oneway': return '一方通行'
      case 'invisible': return '透明壁'
      case 'event': return 'イベント壁'
      default: return wallType
    }
  }
  
  // 床タイプの日本語名を取得する関数
  const getFloorTypeName = (floorType: string) => {
    switch (floorType) {
      case 'normal': return '通常床'
      case 'damage': return 'ダメージ床'
      case 'slippery': return '滑りやすい床'
      case 'pit': return '落とし穴'
      case 'warp': return 'ワープポイント'
      default: return floorType
    }
  }

  return (
    <Box
      sx={{
        width: 320,
        bgcolor: 'background.paper',
        borderLeft: 1,
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
        {/* ホバー情報表示 */}
        {hoveredCellInfo && (
          <>
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <InfoIcon sx={{ mr: 1 }} />
                <Typography>セル情報</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {/* 位置情報 */}
                  <Typography variant="body2">
                    <strong>位置:</strong> ({hoveredCellInfo.position.x}, {hoveredCellInfo.position.y})
                  </Typography>
                  
                  {/* 床情報 */}
                  <Typography variant="body2">
                    <strong>床:</strong> {getFloorTypeName(hoveredCellInfo.floor.type)}
                    {hoveredCellInfo.floor.passable ? ' (通行可)' : ' (通行不可)'}
                  </Typography>
                  
                  {/* 壁情報 */}
                  <Typography variant="body2">
                    <strong>壁:</strong>
                  </Typography>
                  <Box sx={{ ml: 2, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography variant="caption">
                      北: {hoveredCellInfo.walls.north ? getWallTypeName(hoveredCellInfo.walls.north.type) : 'なし'}
                    </Typography>
                    <Typography variant="caption">
                      東: {hoveredCellInfo.walls.east ? getWallTypeName(hoveredCellInfo.walls.east.type) : 'なし'}
                    </Typography>
                    <Typography variant="caption">
                      南: {hoveredCellInfo.walls.south ? getWallTypeName(hoveredCellInfo.walls.south.type) : 'なし'}
                    </Typography>
                    <Typography variant="caption">
                      西: {hoveredCellInfo.walls.west ? getWallTypeName(hoveredCellInfo.walls.west.type) : 'なし'}
                    </Typography>
                  </Box>
                  
                  {/* イベント情報 */}
                  {hoveredCellInfo.events.length > 0 && (
                    <>
                      <Typography variant="body2">
                        <strong>イベント:</strong> {hoveredCellInfo.events.length}件
                      </Typography>
                      <Box sx={{ ml: 2 }}>
                        {hoveredCellInfo.events.map((event, index) => (
                          <Typography key={index} variant="caption" display="block">
                            ・ {event.name} ({event.type})
                          </Typography>
                        ))}
                      </Box>
                    </>
                  )}
                  
                  {/* 装飾情報 */}
                  {hoveredCellInfo.decorations.length > 0 && (
                    <>
                      <Typography variant="body2">
                        <strong>装飾:</strong> {hoveredCellInfo.decorations.length}件
                      </Typography>
                      <Box sx={{ ml: 2 }}>
                        {hoveredCellInfo.decorations.map((decoration, index) => (
                          <Typography key={index} variant="caption" display="block">
                            ・ {decoration.name} ({decoration.type})
                          </Typography>
                        ))}
                      </Box>
                    </>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>
            
            <Divider />
          </>
        )}
        
        {/* プロパティ編集 */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <PropertiesIcon sx={{ mr: 1 }} />
            <Typography>プロパティ</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="text.secondary">
              {dungeon ? '選択したオブジェクトのプロパティが表示されます' : 'プロジェクトを作成してください'}
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Divider />

        {/* イベント編集 */}
        {selectedLayer === 'events' && (
          <>
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <EventIcon sx={{ mr: 1 }} />
                <Typography>イベント編集</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                <EventEditor />
              </AccordionDetails>
            </Accordion>
            
            <Divider />
          </>
        )}

        {/* テンプレート */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <TemplateIcon sx={{ mr: 1 }} />
            <Typography>テンプレート</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="text.secondary">
              {dungeon ? 'テンプレートが表示されます' : 'プロジェクトを作成してください'}
            </Typography>
          </AccordionDetails>
        </Accordion>
      </Box>
    </Box>
  )
}

export default RightPanel