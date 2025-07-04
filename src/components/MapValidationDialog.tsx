import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Collapse,
  Alert,
  AlertTitle,
} from '@mui/material'
import {
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  Assessment as AssessmentIcon,
  Speed as PerformanceIcon,
  Accessibility as AccessibilityIcon,
  Balance as BalanceIcon,
  Settings as SettingsIcon,
  Psychology as DesignIcon,
} from '@mui/icons-material'
import { MapValidationResult, MapValidationIssue, validateMap, getValidationSummary, getValidationLevel } from '../utils/mapValidation'
import { Dungeon } from '../types/map'

interface MapValidationDialogProps {
  open: boolean
  onClose: () => void
  dungeon: Dungeon | null
}

const MapValidationDialog: React.FC<MapValidationDialogProps> = ({
  open,
  onClose,
  dungeon
}) => {
  const [validationResult, setValidationResult] = React.useState<MapValidationResult | null>(null)
  const [expandedCategory, setExpandedCategory] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (open && dungeon) {
      const result = validateMap(dungeon)
      setValidationResult(result)
    }
  }, [open, dungeon])

  const handleCategoryToggle = (category: string) => {
    setExpandedCategory(expandedCategory === category ? null : category)
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'accessibility': return <AccessibilityIcon />
      case 'balance': return <BalanceIcon />
      case 'consistency': return <SettingsIcon />
      case 'performance': return <PerformanceIcon />
      case 'design': return <DesignIcon />
      default: return <InfoIcon />
    }
  }

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'accessibility': return 'アクセシビリティ'
      case 'balance': return 'バランス'
      case 'consistency': return '整合性'
      case 'performance': return 'パフォーマンス'
      case 'design': return 'デザイン'
      default: return category
    }
  }

  const getIssueIcon = (type: 'error' | 'warning' | 'info') => {
    switch (type) {
      case 'error': return <ErrorIcon color="error" />
      case 'warning': return <WarningIcon color="warning" />
      case 'info': return <InfoIcon color="info" />
    }
  }

  const getIssueColor = (type: 'error' | 'warning' | 'info') => {
    switch (type) {
      case 'error': return 'error.main'
      case 'warning': return 'warning.main'
      case 'info': return 'info.main'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'success.main'
    if (score >= 70) return 'info.main'
    if (score >= 50) return 'warning.main'
    return 'error.main'
  }

  const getScoreLabel = (score: number) => {
    const level = getValidationLevel(score)
    switch (level) {
      case 'excellent': return '優秀'
      case 'good': return '良好'
      case 'needs-improvement': return '改善要'
      case 'poor': return '要修正'
    }
  }

  if (!validationResult) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>マップ検証</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <Typography>検証中...</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>閉じる</Button>
        </DialogActions>
      </Dialog>
    )
  }

  const { score, issues, stats, isValid } = validationResult

  // カテゴリ別にイシューを分類
  const issuesByCategory = issues.reduce((acc, issue) => {
    if (!acc[issue.category]) {
      acc[issue.category] = []
    }
    acc[issue.category].push(issue)
    return acc
  }, {} as Record<string, MapValidationIssue[]>)

  const categories = Object.keys(issuesByCategory)
  const errorCount = issues.filter(issue => issue.type === 'error').length
  const warningCount = issues.filter(issue => issue.type === 'warning').length
  const infoCount = issues.filter(issue => issue.type === 'info').length

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: { height: '80vh' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AssessmentIcon />
        マップ検証結果
        <Box sx={{ ml: 'auto' }}>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ px: 0 }}>
        {/* スコア表示 */}
        <Box sx={{ px: 3, pb: 2 }}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" sx={{ color: getScoreColor(score), fontWeight: 'bold' }}>
                      {score}
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                      / 100点
                    </Typography>
                    <Chip
                      label={getScoreLabel(score)}
                      color={score >= 70 ? 'success' : score >= 50 ? 'warning' : 'error'}
                      variant="outlined"
                      sx={{ mt: 1 }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={8}>
                  <Typography variant="h6" gutterBottom>
                    検証サマリー
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    {errorCount > 0 && (
                      <Chip
                        icon={<ErrorIcon />}
                        label={`エラー: ${errorCount}件`}
                        color="error"
                        variant="outlined"
                        size="small"
                      />
                    )}
                    {warningCount > 0 && (
                      <Chip
                        icon={<WarningIcon />}
                        label={`警告: ${warningCount}件`}
                        color="warning"
                        variant="outlined"
                        size="small"
                      />
                    )}
                    {infoCount > 0 && (
                      <Chip
                        icon={<InfoIcon />}
                        label={`情報: ${infoCount}件`}
                        color="info"
                        variant="outlined"
                        size="small"
                      />
                    )}
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={score}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: 'grey.200',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: getScoreColor(score),
                        borderRadius: 4,
                      },
                    }}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {getValidationSummary(validationResult)}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* 統計情報 */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                マップ統計
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="text.secondary">
                    総セル数
                  </Typography>
                  <Typography variant="h6">
                    {stats.totalCells.toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="text.secondary">
                    通行可能
                  </Typography>
                  <Typography variant="h6">
                    {stats.passableCells.toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="text.secondary">
                    イベント数
                  </Typography>
                  <Typography variant="h6">
                    {stats.eventCount.toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="text.secondary">
                    装飾数
                  </Typography>
                  <Typography variant="h6">
                    {stats.decorationCount.toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>

        {/* イシュー一覧 */}
        <Box sx={{ px: 3, maxHeight: '40vh', overflow: 'auto' }}>
          {issues.length === 0 ? (
            <Alert severity="success" icon={<CheckCircleIcon />}>
              <AlertTitle>問題ありません！</AlertTitle>
              マップは全ての検証項目をクリアしています。素晴らしいマップですね！
            </Alert>
          ) : (
            <>
              <Typography variant="h6" gutterBottom>
                検出された問題 ({issues.length}件)
              </Typography>
              {categories.map((category) => {
                const categoryIssues = issuesByCategory[category]
                const categoryErrors = categoryIssues.filter(issue => issue.type === 'error').length
                const categoryWarnings = categoryIssues.filter(issue => issue.type === 'warning').length
                const categoryInfos = categoryIssues.filter(issue => issue.type === 'info').length

                return (
                  <Accordion 
                    key={category}
                    expanded={expandedCategory === category}
                    onChange={() => handleCategoryToggle(category)}
                    sx={{ mb: 1 }}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                        {getCategoryIcon(category)}
                        <Typography variant="subtitle1">
                          {getCategoryName(category)}
                        </Typography>
                        <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                          {categoryErrors > 0 && (
                            <Chip label={categoryErrors} size="small" color="error" />
                          )}
                          {categoryWarnings > 0 && (
                            <Chip label={categoryWarnings} size="small" color="warning" />
                          )}
                          {categoryInfos > 0 && (
                            <Chip label={categoryInfos} size="small" color="info" />
                          )}
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List dense>
                        {categoryIssues
                          .sort((a, b) => b.severity - a.severity) // 重要度順にソート
                          .map((issue, index) => (
                          <ListItem key={`${issue.id}-${index}`} sx={{ px: 0 }}>
                            <ListItemIcon sx={{ minWidth: 32 }}>
                              {getIssueIcon(issue.type)}
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Typography variant="body2" fontWeight="medium">
                                  {issue.title}
                                </Typography>
                              }
                              secondary={
                                <Box>
                                  <Typography variant="body2" color="text.secondary">
                                    {issue.description}
                                  </Typography>
                                  {issue.location && (
                                    <Typography variant="caption" color="text.secondary">
                                      場所: フロア{issue.location.floorIndex + 1}
                                      {issue.location.position && 
                                        ` (${issue.location.position.x}, ${issue.location.position.y})`
                                      }
                                    </Typography>
                                  )}
                                  {issue.suggestion && (
                                    <Typography 
                                      variant="body2" 
                                      sx={{ 
                                        color: 'primary.main', 
                                        mt: 0.5,
                                        fontStyle: 'italic'
                                      }}
                                    >
                                      💡 {issue.suggestion}
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                            <Box sx={{ ml: 1 }}>
                              <Chip
                                label={`重要度: ${issue.severity}`}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem' }}
                              />
                            </Box>
                          </ListItem>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                )
              })}
            </>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="contained">
          閉じる
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default MapValidationDialog