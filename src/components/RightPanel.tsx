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
} from '@mui/icons-material'
import { useSelector } from 'react-redux'
import { RootState } from '../store'
import EventEditor from './EventEditor'

const RightPanel: React.FC = () => {
  const dungeon = useSelector((state: RootState) => state.map.dungeon)
  const { selectedLayer } = useSelector((state: RootState) => state.editor)

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