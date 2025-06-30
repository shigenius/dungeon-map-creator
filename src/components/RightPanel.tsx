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
} from '@mui/icons-material'
import { useSelector } from 'react-redux'
import { RootState } from '../store'

const RightPanel: React.FC = () => {
  const dungeon = useSelector((state: RootState) => state.map.dungeon)

  return (
    <Box
      sx={{
        width: 280,
        bgcolor: 'background.paper',
        borderLeft: 1,
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
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
  )
}

export default RightPanel