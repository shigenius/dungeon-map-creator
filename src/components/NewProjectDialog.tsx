import React, { useState, useRef, useEffect } from 'react'
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
  Tabs,
  Tab,
  Card,
  CardContent,
  CardActions,
  Chip,
  Divider,
} from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import { createNewDungeon, loadDungeon } from '../store/mapSlice'
import { closeNewProjectDialog } from '../store/editorSlice'
import { RootState } from '../store'
import { getSampleDungeonsList, sampleDungeons } from '../data/sampleDungeons'

const NewProjectDialog: React.FC = () => {
  const dispatch = useDispatch()
  const dungeon = useSelector((state: RootState) => state.map.dungeon)
  const { showNewProjectDialog, isInitialProjectDialog } = useSelector((state: RootState) => state.editor)
  
  // 既存プロジェクトがある場合は、確認のためフィールドをリセット
  const [dungeonName, setDungeonName] = useState(dungeon ? '' : '新しいダンジョン')
  const [author, setAuthor] = useState('')
  const [width, setWidth] = useState(20)
  const [height, setHeight] = useState(20)
  const [currentTab, setCurrentTab] = useState(0)
  
  const sampleDungeonsList = getSampleDungeonsList()
  const dialogRef = useRef<HTMLDivElement>(null)
  const firstInputRef = useRef<HTMLInputElement>(null)

  const open = !dungeon || showNewProjectDialog

  // ダイアログが開いた時にフィールドをリセット
  useEffect(() => {
    if (showNewProjectDialog && dungeon) {
      setDungeonName('')
      setAuthor('')
      setWidth(20)
      setHeight(20)
    }
  }, [showNewProjectDialog, dungeon])

  // フォーカス管理
  useEffect(() => {
    if (open && currentTab === 0) {
      // 短いディレイでフォーカスを設定（Dialogの描画完了後）
      const timer = setTimeout(() => {
        firstInputRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [open, currentTab])

  // キーボードナビゲーション
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape' && !isInitialProjectDialog) {
      handleCancel()
    }
  }

  const handleCreate = () => {
    dispatch(createNewDungeon({
      name: dungeonName || '新しいダンジョン',
      author: author || '名無し',
      width,
      height,
    }))
    dispatch(closeNewProjectDialog())
  }

  const handleCancel = () => {
    if (!isInitialProjectDialog) {
      dispatch(closeNewProjectDialog())
    }
  }

  const handleSampleSelect = (sampleId: string) => {
    const sampleDungeon = sampleDungeons[sampleId]
    if (sampleDungeon) {
      dispatch(loadDungeon(sampleDungeon))
      dispatch(closeNewProjectDialog())
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'success'
      case 'medium': return 'warning'
      case 'hard': return 'error'
      default: return 'default'
    }
  }

  return (
    <Dialog
      ref={dialogRef}
      open={open}
      onClose={isInitialProjectDialog ? undefined : handleCancel}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown={isInitialProjectDialog}
      onKeyDown={handleKeyDown}
      aria-labelledby="new-project-dialog-title"
      aria-describedby="new-project-dialog-description"
    >
      <DialogTitle id="new-project-dialog-title">新規プロジェクト作成</DialogTitle>
      <DialogContent id="new-project-dialog-description">
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs 
            value={currentTab} 
            onChange={(_, newValue) => setCurrentTab(newValue)}
            aria-label="プロジェクト作成方法の選択"
          >
            <Tab label="空のプロジェクト" aria-controls="tabpanel-0" />
            <Tab label="サンプルから選択" aria-controls="tabpanel-1" />
          </Tabs>
        </Box>

        {currentTab === 0 && (
          <div role="tabpanel" id="tabpanel-0" aria-labelledby="tab-0">
          <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              ref={firstInputRef}
              fullWidth
              label="ダンジョン名"
              value={dungeonName}
              onChange={(e) => setDungeonName(e.target.value)}
              placeholder="新しいダンジョン"
              required
              aria-describedby="dungeon-name-help"
              inputProps={{
                'aria-label': 'ダンジョン名を入力してください',
                maxLength: 50
              }}
            />
            <Typography 
              id="dungeon-name-help" 
              variant="caption" 
              color="text.secondary"
              sx={{ mt: 0.5, display: 'block' }}
            >
              最大50文字まで入力できます
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="作成者"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="名前を入力（任意）"
              aria-describedby="author-help"
              inputProps={{
                'aria-label': '作成者名を入力してください（任意）',
                maxLength: 30
              }}
            />
            <Typography 
              id="author-help" 
              variant="caption" 
              color="text.secondary"
              sx={{ mt: 0.5, display: 'block' }}
            >
              最大30文字まで。未入力の場合は「名無し」になります
            </Typography>
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
              aria-label="マップの幅"
              aria-describedby="width-help"
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${value}マス`}
            />
            <Typography 
              id="width-help" 
              variant="caption" 
              color="text.secondary"
            >
              矢印キーまたはホームエンドキーで調整できます
            </Typography>
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
              aria-label="マップの高さ"
              aria-describedby="height-help"
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${value}マス`}
            />
            <Typography 
              id="height-help" 
              variant="caption" 
              color="text.secondary"
            >
              矢印キーまたはホームエンドキーで調整できます
            </Typography>
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
          </div>
        )}

        {currentTab === 1 && (
          <div role="tabpanel" id="tabpanel-1" aria-labelledby="tab-1">
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              以下のサンプルダンジョンから選択してプロジェクトを開始できます
            </Typography>
            <Grid container spacing={2}>
              {sampleDungeonsList.map((sample) => (
                <Grid item xs={12} key={sample.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="h6" component="h3">
                          {sample.name}
                        </Typography>
                        <Chip
                          label={sample.difficulty}
                          color={getDifficultyColor(sample.difficulty) as any}
                          size="small"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {sample.description}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                        <Chip label={`${sample.floors}階`} size="small" variant="outlined" />
                        <Chip label={sample.size} size="small" variant="outlined" />
                        {sample.tags.map((tag) => (
                          <Chip key={tag} label={tag} size="small" variant="outlined" />
                        ))}
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        作成者: {sample.author}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleSampleSelect(sample.id)}
                        aria-label={`${sample.name}サンプルを選択`}
                        aria-describedby={`sample-${sample.id}-description`}
                      >
                        このサンプルを使用
                      </Button>
                      <Typography 
                        id={`sample-${sample.id}-description`} 
                        variant="caption" 
                        sx={{ display: 'none' }}
                      >
                        {sample.description}
                      </Typography>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
          </div>
        )}
      </DialogContent>
      <DialogActions>
        {!isInitialProjectDialog && (
          <Button 
            onClick={handleCancel}
            aria-label="プロジェクト作成をキャンセル"
          >
            キャンセル
          </Button>
        )}
        {currentTab === 0 && (
          <Button 
            onClick={handleCreate} 
            variant="contained"
            disabled={!dungeonName.trim()}
            aria-label="新しいダンジョンプロジェクトを作成"
            aria-describedby="create-button-help"
          >
            作成
          </Button>
        )}
        {currentTab === 0 && (
          <Typography 
            id="create-button-help" 
            variant="caption" 
            sx={{ display: 'none' }}
          >
            Enterキーでも作成できます
          </Typography>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default NewProjectDialog