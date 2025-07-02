import React, { useEffect, useRef } from 'react'
import {
  Box,
  Typography,
  Tab,
  Tabs,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Chip,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  ButtonGroup,
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
  ViewModule as TemplateIcon,
  Settings as SettingsIcon,
  Add as AddIcon,
  RotateRight as RotateIcon,
  SelectAll as SelectIcon,
} from '@mui/icons-material'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../store'
import {
  setSelectedTemplate,
  setTemplateCategory,
  loadTemplates,
  rotateTemplate,
  startSelection,
} from '../store/editorSlice'
import { placeTemplate } from '../store/mapSlice'
import { Template, TemplateCategory } from '../types/map'
import { presetTemplates, getCategoryDisplayName } from '../data/presetTemplates'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div hidden={value !== index} style={{ height: '100%' }}>
      {value === index && <Box sx={{ height: '100%' }}>{children}</Box>}
    </div>
  )
}

const RightPanel: React.FC = () => {
  const dispatch = useDispatch()
  const { templates, selectedTemplate, templateCategory, templateRotation, currentFloor } = useSelector(
    (state: RootState) => state.editor
  )
  const dungeon = useSelector((state: RootState) => state.map.dungeon)

  const [tabValue, setTabValue] = React.useState(0)

  // プリセットテンプレートをロード
  useEffect(() => {
    dispatch(loadTemplates(presetTemplates))
  }, [dispatch])

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handleCategoryChange = (category: TemplateCategory) => {
    dispatch(setTemplateCategory(category))
  }

  const handleTemplateSelect = (template: Template) => {
    // 既に選択されているテンプレートを再度クリックした場合は選択解除
    if (selectedTemplate && selectedTemplate.id === template.id) {
      dispatch(setSelectedTemplate(null))
    } else {
      dispatch(setSelectedTemplate(template))
    }
  }

  const handlePlaceTemplate = () => {
    if (!selectedTemplate) return
    
    // テンプレート配置モードを有効にする（マップ上でクリックして配置）
    console.log(`テンプレート「${selectedTemplate.name}」の配置モードを開始しました`)
  }

  const handleCreateTemplate = () => {
    dispatch(startSelection())
  }

  const categories: TemplateCategory[] = ['room', 'corridor', 'junction', 'trap', 'puzzle', 'decoration', 'fullmap', 'custom']

  const filteredTemplates = templates.filter(
    template => template.category === templateCategory
  )

  // テンプレートサムネイル描画コンポーネント
  const TemplateThumbnail: React.FC<{ template: Template; width: number; height: number }> = ({ template, width, height }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // キャンバスサイズを設定
      canvas.width = width
      canvas.height = height

      // 背景をクリア
      ctx.fillStyle = '#1a1a1a'
      ctx.fillRect(0, 0, width, height)

      // テンプレートサイズ
      const templateWidth = template.size.width
      const templateHeight = template.size.height
      
      // セルサイズを計算（パディングを考慮）
      const padding = 4
      const cellSize = Math.min(
        (width - padding * 2) / templateWidth,
        (height - padding * 2) / templateHeight
      )

      // 描画開始位置を中央に調整
      const startX = (width - templateWidth * cellSize) / 2
      const startY = (height - templateHeight * cellSize) / 2

      // 各セルを描画
      for (let y = 0; y < templateHeight; y++) {
        for (let x = 0; x < templateWidth; x++) {
          const cell = template.cells[y][x]
          const xPos = startX + x * cellSize
          const yPos = startY + y * cellSize

          // 床の描画（サムネイル用に明度を調整）
          let floorColor = '#444'
          switch (cell.floor.type) {
            case 'normal': floorColor = '#666'; break
            case 'damage': floorColor = '#a44'; break
            case 'slippery': floorColor = '#47a'; break
            case 'pit': floorColor = '#222'; break
            case 'warp': floorColor = '#a74'; break
          }
          
          ctx.fillStyle = floorColor
          ctx.fillRect(xPos, yPos, cellSize, cellSize)

          // 壁の描画
          const drawWall = (direction: 'north' | 'east' | 'south' | 'west', wall: any) => {
            if (!wall) return
            
            let strokeColor = '#fff'
            let lineWidth = Math.max(1, cellSize / 8)

            switch (wall.type) {
              case 'normal': strokeColor = '#ffffff'; break
              case 'door': strokeColor = '#D2691E'; break
              case 'locked_door': strokeColor = '#FFD700'; break
              case 'hidden_door': strokeColor = '#999999'; break
              case 'breakable': strokeColor = '#FF8C42'; break
              case 'oneway': strokeColor = '#40E0D0'; break
              case 'invisible': strokeColor = '#777777'; break
              case 'event': strokeColor = '#FF69B4'; break
            }

            ctx.strokeStyle = strokeColor
            ctx.lineWidth = lineWidth

            ctx.beginPath()
            switch (direction) {
              case 'north':
                ctx.moveTo(xPos, yPos)
                ctx.lineTo(xPos + cellSize, yPos)
                break
              case 'east':
                ctx.moveTo(xPos + cellSize, yPos)
                ctx.lineTo(xPos + cellSize, yPos + cellSize)
                break
              case 'south':
                ctx.moveTo(xPos, yPos + cellSize)
                ctx.lineTo(xPos + cellSize, yPos + cellSize)
                break
              case 'west':
                ctx.moveTo(xPos, yPos)
                ctx.lineTo(xPos, yPos + cellSize)
                break
            }
            ctx.stroke()
          }

          drawWall('north', cell.walls.north)
          drawWall('east', cell.walls.east)
          drawWall('south', cell.walls.south)
          drawWall('west', cell.walls.west)

          // イベントの描画（小さなドット）
          if (cell.events.length > 0 && cellSize > 3) {
            ctx.fillStyle = '#ffdd44'
            ctx.beginPath()
            ctx.arc(xPos + cellSize * 0.75, yPos + cellSize * 0.25, Math.max(1.5, cellSize / 6), 0, Math.PI * 2)
            ctx.fill()
          }

          // 装飾の描画（小さなドット）
          if (cell.decorations.length > 0 && cellSize > 3) {
            ctx.fillStyle = '#aaaaaa'
            ctx.beginPath()
            ctx.arc(xPos + cellSize * 0.25, yPos + cellSize * 0.75, Math.max(1, cellSize / 8), 0, Math.PI * 2)
            ctx.fill()
          }
        }
      }

      // 外枠
      ctx.strokeStyle = '#666'
      ctx.lineWidth = 1
      ctx.strokeRect(startX - 1, startY - 1, templateWidth * cellSize + 2, templateHeight * cellSize + 2)

    }, [template, width, height])

    return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', imageRendering: 'pixelated' }} />
  }

  return (
    <Box
      sx={{
        width: 320,
        height: '100%',
        bgcolor: 'background.paper',
        borderLeft: 1,
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth">
          <Tab 
            icon={<TemplateIcon />} 
            label="テンプレート" 
            sx={{ minHeight: 48 }}
          />
          <Tab 
            icon={<SettingsIcon />} 
            label="プロパティ" 
            sx={{ minHeight: 48 }}
          />
        </Tabs>
      </Box>

      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {/* テンプレートタブ */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* カテゴリ選択 */}
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2">
                  カテゴリ
                </Typography>
                <Button
                  size="small"
                  startIcon={<SelectIcon />}
                  onClick={handleCreateTemplate}
                  disabled={!dungeon}
                  sx={{ fontSize: '0.7rem' }}
                >
                  テンプレート作成
                </Button>
              </Box>
              <ButtonGroup size="small" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={templateCategory === category ? 'contained' : 'outlined'}
                    onClick={() => handleCategoryChange(category)}
                    size="small"
                    sx={{ fontSize: '0.75rem', minWidth: 'auto', px: 1 }}
                  >
                    {getCategoryDisplayName(category)}
                  </Button>
                ))}
              </ButtonGroup>
            </Box>

            {/* テンプレート一覧 */}
            <Box sx={{ flex: 1, overflowY: 'auto', p: 1 }}>
              <Grid container spacing={1}>
                {filteredTemplates.map((template) => (
                  <Grid item xs={12} key={template.id}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        border: selectedTemplate?.id === template.id ? 2 : 1,
                        borderColor: selectedTemplate?.id === template.id 
                          ? 'primary.main' 
                          : 'divider',
                        '&:hover': {
                          boxShadow: 2,
                        },
                      }}
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <Box sx={{ display: 'flex' }}>
                        <Box
                          sx={{
                            width: 80,
                            height: 60,
                            border: 1,
                            borderColor: 'divider',
                            borderRadius: 1,
                            overflow: 'hidden',
                            flexShrink: 0,
                            position: 'relative',
                          }}
                        >
                          <TemplateThumbnail 
                            template={template} 
                            width={80} 
                            height={60} 
                          />
                          {/* サイズ表示をオーバーレイ */}
                          <Box
                            sx={{
                              position: 'absolute',
                              bottom: 0,
                              right: 0,
                              bgcolor: 'rgba(0, 0, 0, 0.7)',
                              color: 'white',
                              px: 0.5,
                              py: 0.25,
                              fontSize: '0.6rem',
                              lineHeight: 1,
                            }}
                          >
                            {template.size.width}×{template.size.height}
                          </Box>
                        </Box>
                        <CardContent sx={{ flex: 1, p: 1, '&:last-child': { pb: 1 } }}>
                          <Typography variant="body2" fontWeight="bold" gutterBottom>
                            {template.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" gutterBottom>
                            {template.description}
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                            {template.tags.slice(0, 2).map((tag) => (
                              <Chip
                                key={tag}
                                label={tag}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.6rem', height: 16 }}
                              />
                            ))}
                          </Box>
                        </CardContent>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {filteredTemplates.length === 0 && (
                <Box sx={{ textAlign: 'center', mt: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    このカテゴリにはテンプレートがありません
                  </Typography>
                </Box>
              )}
            </Box>

            {/* 選択されたテンプレートの詳細 */}
            {selectedTemplate && (
              <Box sx={{ borderTop: 1, borderColor: 'divider', p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  選択中: {selectedTemplate.name}
                </Typography>
                
                {/* 回転コントロール */}
                {!selectedTemplate.isFullMap && (
                  <>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Typography variant="body2">回転:</Typography>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<RotateIcon />}
                        onClick={() => {
                          console.log('回転ボタンクリック - 現在の角度:', templateRotation)
                          dispatch(rotateTemplate())
                        }}
                      >
                        {templateRotation}°
                      </Button>
                      <Typography variant="caption" color="text.secondary">
                        Q/R/クリック
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        現在の回転角度: {templateRotation}° | Q=左回転 R=右回転
                      </Typography>
                    </Box>
                  </>
                )}
                
                {selectedTemplate.isFullMap ? (
                  <>
                    <Button
                      variant="contained"
                      color="warning"
                      startIcon={<AddIcon />}
                      fullWidth
                      disabled={!dungeon}
                      size="small"
                      onClick={() => {
                        if (selectedTemplate && dungeon) {
                          const confirmed = window.confirm('マップ全体が置き換えられます。現在のマップは失われますが、よろしいですか？')
                          if (confirmed) {
                            console.log(`マップ全体テンプレート「${selectedTemplate.name}」を適用します`)
                            dispatch(placeTemplate({
                              template: selectedTemplate,
                              floorIndex: currentFloor,
                              rotation: templateRotation
                            }))
                            // マップ全体置き換え後はテンプレート選択を解除
                            dispatch(setSelectedTemplate(null))
                          }
                        }
                      }}
                    >
                      マップ全体を置き換え
                    </Button>
                    <Typography variant="caption" sx={{ mt: 1, display: 'block', textAlign: 'center', color: 'warning.main' }}>
                      注意: 現在のマップが完全に置き換えられます
                    </Typography>
                  </>
                ) : (
                  <>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      fullWidth
                      disabled={!dungeon}
                      size="small"
                      onClick={handlePlaceTemplate}
                    >
                      クリックで配置
                    </Button>
                    <Typography variant="caption" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
                      マップ上の任意の位置をクリックして配置
                    </Typography>
                  </>
                )}
              </Box>
            )}
          </Box>
        </TabPanel>

        {/* プロパティタブ */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 2 }}>
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle2">セルプロパティ</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary">
                  セルを選択してプロパティを編集
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle2">イベントプロパティ</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary">
                  イベントの詳細設定（開発中）
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle2">マップ設定</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary">
                  マップ全体の設定（開発中）
                </Typography>
              </AccordionDetails>
            </Accordion>
          </Box>
        </TabPanel>
      </Box>
    </Box>
  )
}

export default RightPanel