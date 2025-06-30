import React from 'react'
import { Box, Typography } from '@mui/material'

const MapEditor3D: React.FC = () => {
  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#000',
        color: '#fff',
      }}
    >
      <Typography variant="h5">
        3Dプレビュー (準備中)
      </Typography>
    </Box>
  )
}

export default MapEditor3D