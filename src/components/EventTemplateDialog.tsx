import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  TextField,
  Tabs,
  Tab,
  Chip,
  InputAdornment,
  IconButton,
  Tooltip,
} from '@mui/material'
import {
  Search as SearchIcon,
  Clear as ClearIcon,
} from '@mui/icons-material'
import { 
  EVENT_TEMPLATES, 
  EventTemplate, 
  TEMPLATE_CATEGORIES,
  getTemplatesByCategory,
  searchTemplates
} from '../data/eventTemplates'

interface EventTemplateDialogProps {
  open: boolean
  onClose: () => void
  onSelectTemplate: (template: EventTemplate) => void
}

const EventTemplateDialog: React.FC<EventTemplateDialogProps> = ({
  open,
  onClose,
  onSelectTemplate
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('treasure')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<EventTemplate | null>(null)

  // フィルタリングされたテンプレート
  const filteredTemplates = searchQuery.trim() 
    ? searchTemplates(searchQuery)
    : getTemplatesByCategory(selectedCategory as any)

  const handleTemplateSelect = (template: EventTemplate) => {
    setSelectedTemplate(template)
  }

  const handleConfirm = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate)
      onClose()
      setSelectedTemplate(null)
      setSearchQuery('')
    }
  }

  const handleClose = () => {
    onClose()
    setSelectedTemplate(null)
    setSearchQuery('')
  }

  const handleSearchClear = () => {
    setSearchQuery('')
  }

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: '80vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">イベントテンプレート選択</Typography>
          <Typography variant="body2" color="text.secondary">
            事前定義されたテンプレートからイベントを作成
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* 検索バー */}
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            placeholder="テンプレートを検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={handleSearchClear}>
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* カテゴリタブ */}
        {!searchQuery && (
          <Box sx={{ mb: 2 }}>
            <Tabs
              value={selectedCategory}
              onChange={(_, newValue) => setSelectedCategory(newValue)}
              variant="scrollable"
              scrollButtons="auto"
            >
              {TEMPLATE_CATEGORIES.map((category) => (
                <Tab
                  key={category.key}
                  value={category.key}
                  icon={<span style={{ fontSize: '16px' }}>{category.icon}</span>}
                  label={category.name}
                  iconPosition="start"
                />
              ))}
            </Tabs>
          </Box>
        )}

        {/* 検索時のヒント */}
        {searchQuery && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              「{searchQuery}」の検索結果: {filteredTemplates.length}件
            </Typography>
          </Box>
        )}

        {/* テンプレート一覧 */}
        <Box sx={{ height: '50vh', overflowY: 'auto' }}>
          <Grid container spacing={2}>
            {filteredTemplates.map((template) => (
              <Grid item xs={12} sm={6} md={4} key={template.id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    border: selectedTemplate?.id === template.id ? 2 : 1,
                    borderColor: selectedTemplate?.id === template.id ? 'primary.main' : 'divider',
                    '&:hover': {
                      borderColor: 'primary.main',
                      boxShadow: 2,
                    },
                  }}
                  onClick={() => handleTemplateSelect(template)}
                >
                  <CardContent sx={{ pb: 1 }}>
                    {/* アイコンとタイトル */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography sx={{ fontSize: '24px', mr: 1 }}>
                        {template.previewIcon}
                      </Typography>
                      <Typography variant="h6" component="h3" sx={{ flexGrow: 1 }}>
                        {template.name}
                      </Typography>
                    </Box>

                    {/* 説明 */}
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {template.description}
                    </Typography>

                    {/* カテゴリチップ */}
                    <Box sx={{ mb: 1 }}>
                      <Chip
                        size="small"
                        label={TEMPLATE_CATEGORIES.find(c => c.key === template.category)?.name}
                        color="primary"
                        variant="outlined"
                      />
                    </Box>

                    {/* タグ */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {template.tags.slice(0, 3).map((tag) => (
                        <Chip
                          key={tag}
                          size="small"
                          label={tag}
                          variant="outlined"
                          sx={{ fontSize: '10px', height: '20px' }}
                        />
                      ))}
                      {template.tags.length > 3 && (
                        <Chip
                          size="small"
                          label={`+${template.tags.length - 3}`}
                          variant="outlined"
                          sx={{ fontSize: '10px', height: '20px' }}
                        />
                      )}
                    </Box>
                  </CardContent>

                  <CardActions sx={{ pt: 0, px: 2, pb: 2 }}>
                    <Button 
                      size="small" 
                      variant={selectedTemplate?.id === template.id ? 'contained' : 'outlined'}
                      fullWidth
                    >
                      {selectedTemplate?.id === template.id ? '選択中' : '選択'}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* 結果が見つからない場合 */}
          {filteredTemplates.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                {searchQuery 
                  ? `「${searchQuery}」に一致するテンプレートが見つかりませんでした`
                  : 'このカテゴリにはテンプレートがありません'
                }
              </Typography>
              {searchQuery && (
                <Button 
                  variant="outlined" 
                  onClick={handleSearchClear}
                  sx={{ mt: 2 }}
                >
                  検索をクリア
                </Button>
              )}
            </Box>
          )}
        </Box>

        {/* 選択されたテンプレートの詳細 */}
        {selectedTemplate && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle1" gutterBottom>
              📋 テンプレート詳細
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  <strong>名前:</strong> {selectedTemplate.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>カテゴリ:</strong> {TEMPLATE_CATEGORIES.find(c => c.key === selectedTemplate.category)?.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>説明:</strong> {selectedTemplate.description}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  <strong>イベントタイプ:</strong> {selectedTemplate.presetEvent.type}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>トリガー:</strong> {selectedTemplate.presetEvent.trigger?.type}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>アクション数:</strong> {selectedTemplate.presetEvent.actions?.length || 0}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          キャンセル
        </Button>
        <Button 
          onClick={handleConfirm} 
          variant="contained"
          disabled={!selectedTemplate}
        >
          このテンプレートを使用
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default EventTemplateDialog