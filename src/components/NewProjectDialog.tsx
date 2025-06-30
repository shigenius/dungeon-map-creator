import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  Slider,
  Typography,
  Box,
} from '@mui/material'
import { useDispatch } from 'react-redux'
import { createNewDungeon } from '../store/mapSlice'

const NewProjectDialog: React.FC = () => {
  const dispatch = useDispatch()
  const [open, setOpen] = useState(true)
  const [dungeonName, setDungeonName] = useState('新しいダンジョン')
  const [author, setAuthor] = useState('')
  const [width, setWidth] = useState(20)
  const [height, setHeight] = useState(20)

  const handleCreate = () => {
    dispatch(createNewDungeon({
      name: dungeonName,
      author: author || '名無し',
      width,
      height,
    }))
    setOpen(false)
  }

  const handleCancel = () => {
    setOpen(false)
  }

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown
    >
      <DialogTitle>新規プロジェクト作成</DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="ダンジョン名"
              value={dungeonName}
              onChange={(e) => setDungeonName(e.target.value)}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="作成者"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="名前を入力（任意）"
            />
          </Grid>
          <Grid item xs={6}>
            <Typography gutterBottom>
              幅: {width} マス
            </Typography>
            <Slider
              value={width}
              onChange={(_, value) => setWidth(value as number)}
              min={5}
              max={100}
              step={1}
              marks={[
                { value: 5, label: '5' },
                { value: 20, label: '20' },
                { value: 50, label: '50' },
                { value: 100, label: '100' },
              ]}
            />
          </Grid>
          <Grid item xs={6}>
            <Typography gutterBottom>
              高さ: {height} マス
            </Typography>
            <Slider
              value={height}
              onChange={(_, value) => setHeight(value as number)}
              min={5}
              max={100}
              step={1}
              marks={[
                { value: 5, label: '5' },
                { value: 20, label: '20' },
                { value: 50, label: '50' },
                { value: 100, label: '100' },
              ]}
            />
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                マップサイズ: {width} × {height} = {width * height} セル
              </Typography>
              <Typography variant="body2" color="text.secondary">
                推奨サイズ: 小さなダンジョンは10×10、中規模は20×20、大規模は50×50
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>キャンセル</Button>
        <Button 
          onClick={handleCreate} 
          variant="contained"
          disabled={!dungeonName.trim()}
        >
          作成
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default NewProjectDialog