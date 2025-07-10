import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Divider,
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
  Keyboard as KeyboardIcon,
  Mouse as MouseIcon,
  TouchApp as TouchIcon,
} from '@mui/icons-material'

interface HelpDialogProps {
  open: boolean
  onClose: () => void
}

const HelpDialog: React.FC<HelpDialogProps> = ({ open, onClose }) => {
  const keyShortcuts = [
    {
      category: 'ツール選択',
      shortcuts: [
        { key: '1', description: 'ペンツール' },
        { key: '2', description: '矩形ツール' },
        { key: '3', description: '消しゴムツール' },
      ]
    },
    {
      category: 'レイヤー管理',
      shortcuts: [
        { key: 'F', description: '床レイヤー' },
        { key: 'W', description: '壁レイヤー' },
        { key: 'E', description: 'イベントレイヤー' },
        { key: 'D', description: '装飾レイヤー' },
        { key: 'Tab', description: 'レイヤー順次切り替え' },
      ]
    },
    {
      category: 'ビュー操作',
      shortcuts: [
        { key: 'Ctrl+G', description: 'グリッド表示切り替え' },
        { key: 'Space', description: 'グリッド表示切り替え' },
        { key: 'Ctrl++ / Ctrl+=', description: 'ズームイン' },
        { key: 'Ctrl+-', description: 'ズームアウト' },
        { key: 'Ctrl+0', description: 'ズームリセット(100%)' },
        { key: 'Ctrl+1', description: '2Dビューモード' },
        { key: 'Ctrl+2', description: '3Dビューモード (準備中)' },
      ]
    },
    {
      category: '編集操作',
      shortcuts: [
        { key: 'Ctrl+Z', description: '元に戻す' },
        { key: 'Ctrl+Y', description: 'やり直し' },
        { key: 'Ctrl+Shift+Z', description: 'やり直し' },
        { key: 'Ctrl+S', description: '保存' },
        { key: 'Ctrl+N', description: '新規プロジェクト' },
        { key: 'Ctrl+O', description: 'ファイルを開く' },
      ]
    },
    {
      category: 'テンプレート操作',
      shortcuts: [
        { key: 'Q', description: 'テンプレート左回転 (90°反時計回り)' },
        { key: 'R', description: 'テンプレート右回転 (90°時計回り)' },
        { key: 'Enter', description: '範囲選択確定・テンプレート作成ダイアログ' },
      ]
    },
  ]

  const mouseOperations = [
    {
      category: '基本操作',
      operations: [
        { action: '左クリック', description: '選択したツールでの描画・配置' },
        { action: 'Shift+左クリック', description: '削除モード（床・壁・イベントの削除）' },
        { action: 'ドラッグ', description: 'ペンツールでの連続描画' },
        { action: '右クリック (準備中)', description: 'コンテキストメニュー' },
      ]
    },
    {
      category: 'テンプレート操作',
      operations: [
        { action: 'テンプレート選択', description: 'RightPanelでテンプレートをクリック' },
        { action: 'テンプレート配置', description: 'マップ上の任意の位置をクリック' },
        { action: 'テンプレート作成開始', description: 'RightPanelの「テンプレート作成」ボタン' },
        { action: '範囲選択', description: 'ドラッグで範囲を選択' },
      ]
    },
    {
      category: '範囲選択・テンプレート作成',
      operations: [
        { action: '範囲選択開始', description: '「テンプレート作成」ボタンクリック' },
        { action: '選択範囲調整', description: 'マウス移動で範囲を調整' },
        { action: '範囲確定', description: 'Enterキーでテンプレート作成ダイアログ表示' },
        { action: 'テンプレート作成', description: '名前・説明・カテゴリを入力して作成' },
      ]
    },
  ]

  const tips = [
    'Shiftキーを押しながらクリックすると削除モードになります',
    'スポイトツールで既存のセルの設定をコピーできます',
    'テンプレートは回転して配置できます（Q/Rキー）',
    'ユーザー作成テンプレートは「カスタム」カテゴリに保存されます',
    'マップ全体テンプレートは現在のマップを完全に置き換えます',
    '最大50ステップまでの操作履歴が保存されます',
    'ズームは10%〜400%まで調整可能です',
    'グリッドはSpaceキーまたはCtrl+Gで切り替えできます',
  ]

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <KeyboardIcon />
        操作方法・ヘルプ
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" gutterBottom>
            3Dダンジョンマップエディターの操作方法をご案内します。
            効率的にマップを作成するために、キーボードショートカットをご活用ください。
          </Typography>
        </Box>

        {/* キーボードショートカット */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <KeyboardIcon fontSize="small" />
            キーボードショートカット
          </Typography>
          
          {keyShortcuts.map((section, index) => (
            <Accordion key={index} defaultExpanded={index === 0}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" fontWeight="bold">
                  {section.category}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 1, alignItems: 'center' }}>
                  {section.shortcuts.map((shortcut, i) => (
                    <React.Fragment key={i}>
                      <Chip 
                        label={shortcut.key} 
                        size="small" 
                        variant="outlined"
                        sx={{ fontFamily: 'monospace', minWidth: 'auto' }}
                      />
                      <Typography variant="body2">{shortcut.description}</Typography>
                    </React.Fragment>
                  ))}
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* マウス操作 */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <MouseIcon fontSize="small" />
            マウス操作
          </Typography>
          
          {mouseOperations.map((section, index) => (
            <Accordion key={index} defaultExpanded={index === 0}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" fontWeight="bold">
                  {section.category}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 1, alignItems: 'center' }}>
                  {section.operations.map((operation, i) => (
                    <React.Fragment key={i}>
                      <Chip 
                        label={operation.action} 
                        size="small" 
                        variant="outlined"
                        color="secondary"
                        sx={{ fontFamily: 'monospace', minWidth: 'auto' }}
                      />
                      <Typography variant="body2">{operation.description}</Typography>
                    </React.Fragment>
                  ))}
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* 使用のコツ */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <TouchIcon fontSize="small" />
            使用のコツ
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {tips.map((tip, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 'bold', minWidth: '20px' }}>
                  •
                </Typography>
                <Typography variant="body2">{tip}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <Box sx={{ mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            注意: ショートカットはテキスト入力中やプロジェクトが未読み込みの場合は無効です。
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained">
          閉じる
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default HelpDialog