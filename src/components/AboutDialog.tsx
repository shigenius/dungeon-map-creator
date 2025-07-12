import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Link,
  Divider,
} from '@mui/material'
import { GitHub, Twitter } from '@mui/icons-material'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../store'
import { closeAboutDialog } from '../store/editorSlice'

const AboutDialog: React.FC = () => {
  const dispatch = useDispatch()
  const isOpen = useSelector((state: RootState) => state.editor.showAboutDialog)

  const handleClose = () => {
    dispatch(closeAboutDialog())
  }

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'background.paper',
          backgroundImage: 'none',
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        3D ダンジョンマップクリエイターについて
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            3D Dungeon Map Creator
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            バージョン 1.0.0
          </Typography>
          <Typography variant="body1" paragraph>
            3D RPGゲーム用のダンジョンマップを作成・編集するためのWebアプリケーションです。
            直感的な操作でマップを作成し、3Dプレビューで確認することができます。
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            主な機能
          </Typography>
          <Typography variant="body2" component="ul" sx={{ pl: 2, m: 0 }}>
            <li>グリッドベースの2Dマップエディター</li>
            <li>レイヤーシステム（床、壁、イベント、装飾）</li>
            <li>テンプレートシステム</li>
            <li>3Dプレビュー機能</li>
            <li>JSON形式でのデータ保存</li>
            <li>豊富なキーボードショートカット</li>
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            技術仕様
          </Typography>
          <Typography variant="body2" component="ul" sx={{ pl: 2, m: 0 }}>
            <li>React 18 + TypeScript</li>
            <li>Redux Toolkit (状態管理)</li>
            <li>Material-UI (UIフレームワーク)</li>
            <li>Three.js (3Dレンダリング)</li>
            <li>HTML5 Canvas (2D描画)</li>
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            作者・連絡先
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 1 }}>
            <GitHub fontSize="small" />
            <Link
              href="https://github.com/shigenius"
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
            >
              GitHub: shigenius
            </Link>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Twitter fontSize="small" />
            <Link
              href="https://x.com/shigeniust"
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
            >
              Twitter: @shigeniust
            </Link>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box>
          <Typography variant="h6" gutterBottom>
            免責事項・注意事項
          </Typography>
          <Typography variant="body2" paragraph color="text.secondary">
            本アプリケーションは現状のまま提供されており、使用により生じた損害について一切の責任を負いません。
            データの損失やバックアップについては、利用者の責任において行ってください。
          </Typography>
          <Typography variant="body2" color="text.secondary">
            本サービスの機能は予告なく変更される可能性があります。
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} variant="contained">
          閉じる
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AboutDialog