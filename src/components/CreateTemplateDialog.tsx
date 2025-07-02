import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  SelectChangeEvent
} from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../store'
import { closeCreateTemplateDialog, addTemplate } from '../store/editorSlice'
import { createTemplateFromSelection } from '../store/mapSlice'
import { TemplateCategory } from '../types/map'
import { getCategoryDisplayName } from '../data/presetTemplates'

const CreateTemplateDialog: React.FC = () => {
  const dispatch = useDispatch()
  const { showCreateTemplateDialog, selectionStart, selectionEnd, currentFloor } = useSelector(
    (state: RootState) => state.editor
  )
  const dungeon = useSelector((state: RootState) => state.map.dungeon)

  const [templateName, setTemplateName] = useState('')
  const [templateDescription, setTemplateDescription] = useState('')
  const [templateCategory, setTemplateCategory] = useState<TemplateCategory>('custom')

  const handleClose = () => {
    dispatch(closeCreateTemplateDialog())
    setTemplateName('')
    setTemplateDescription('')
    setTemplateCategory('custom')
  }

  const handleCreate = () => {
    if (!templateName.trim() || !selectionStart || !selectionEnd || !dungeon) return

    // 選択範囲の計算
    const minX = Math.min(selectionStart.x, selectionEnd.x)
    const maxX = Math.max(selectionStart.x, selectionEnd.x)
    const minY = Math.min(selectionStart.y, selectionEnd.y)
    const maxY = Math.max(selectionStart.y, selectionEnd.y)
    
    const width = maxX - minX + 1
    const height = maxY - minY + 1

    // テンプレート作成
    dispatch(createTemplateFromSelection({
      floorIndex: currentFloor,
      startPos: selectionStart,
      endPos: selectionEnd,
      templateName: templateName.trim(),
      templateDescription: templateDescription.trim(),
      templateCategory
    }))

    // 選択範囲から実際のセルデータを抽出
    const floor = dungeon.floors[currentFloor]
    const templateCells = []
    
    for (let y = 0; y < height; y++) {
      const row = []
      for (let x = 0; x < width; x++) {
        const sourceCell = floor.cells[minY + y]?.[minX + x]
        if (sourceCell) {
          row.push({
            floor: { ...sourceCell.floor },
            walls: {
              north: sourceCell.walls.north ? { ...sourceCell.walls.north } : null,
              east: sourceCell.walls.east ? { ...sourceCell.walls.east } : null,
              south: sourceCell.walls.south ? { ...sourceCell.walls.south } : null,
              west: sourceCell.walls.west ? { ...sourceCell.walls.west } : null,
            },
            events: [...sourceCell.events],
            decorations: [...sourceCell.decorations]
          })
        } else {
          // デフォルトセル
          row.push({
            floor: { type: 'normal' as const, passable: true },
            walls: { north: null, east: null, south: null, west: null },
            events: [],
            decorations: []
          })
        }
      }
      templateCells.push(row)
    }

    // 新しいテンプレートをエディタのテンプレートリストに追加
    const newTemplate = {
      id: crypto.randomUUID(),
      name: templateName.trim(),
      description: templateDescription.trim() || `${width}×${height}のユーザー作成テンプレート`,
      category: templateCategory,
      size: { width, height },
      cells: templateCells,
      tags: ['ユーザー作成'],
      author: dungeon.author,
      createdAt: new Date(),
      isCustom: true,
      isFullMap: false,
      isBuiltIn: false
    }

    dispatch(addTemplate(newTemplate))
    handleClose()
  }

  const handleCategoryChange = (event: SelectChangeEvent<TemplateCategory>) => {
    setTemplateCategory(event.target.value as TemplateCategory)
  }

  const getSelectionInfo = () => {
    if (!selectionStart || !selectionEnd) return null
    
    const minX = Math.min(selectionStart.x, selectionEnd.x)
    const maxX = Math.max(selectionStart.x, selectionEnd.x)
    const minY = Math.min(selectionStart.y, selectionEnd.y)
    const maxY = Math.max(selectionStart.y, selectionEnd.y)
    
    const width = maxX - minX + 1
    const height = maxY - minY + 1
    
    return { width, height, area: width * height }
  }

  const selectionInfo = getSelectionInfo()

  return (
    <Dialog
      open={showCreateTemplateDialog}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>テンプレートを作成</DialogTitle>
      <DialogContent>
        {selectionInfo && (
          <Alert severity="info" sx={{ mb: 2 }}>
            選択範囲: {selectionInfo.width}×{selectionInfo.height} ({selectionInfo.area}セル)
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="テンプレート名"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            required
            fullWidth
            placeholder="例: マイルーム、廊下パターン1"
          />

          <TextField
            label="説明（オプション）"
            value={templateDescription}
            onChange={(e) => setTemplateDescription(e.target.value)}
            multiline
            rows={3}
            fullWidth
            placeholder="このテンプレートの用途や特徴を記述してください"
          />

          <FormControl fullWidth>
            <InputLabel>カテゴリ</InputLabel>
            <Select
              value={templateCategory}
              onChange={handleCategoryChange}
              label="カテゴリ"
            >
              <MenuItem value="custom">カスタム</MenuItem>
              <MenuItem value="room">部屋</MenuItem>
              <MenuItem value="corridor">廊下</MenuItem>
              <MenuItem value="junction">接続部</MenuItem>
              <MenuItem value="trap">トラップ</MenuItem>
              <MenuItem value="puzzle">パズル</MenuItem>
              <MenuItem value="decoration">装飾</MenuItem>
            </Select>
          </FormControl>

          <Typography variant="body2" color="text.secondary">
            選択した範囲のセル（床、壁、イベント、装飾）がテンプレートとして保存されます。
            作成したテンプレートは右パネルの「{getCategoryDisplayName(templateCategory)}」カテゴリに表示されます。
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>
          キャンセル
        </Button>
        <Button
          onClick={handleCreate}
          variant="contained"
          disabled={!templateName.trim() || !selectionStart || !selectionEnd}
        >
          作成
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CreateTemplateDialog