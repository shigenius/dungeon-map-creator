# 🚀 ダンジョンマップクリエイター - デプロイガイド

このガイドでは、完成したダンジョンマップエディターを様々なプラットフォームにデプロイする方法を説明します。

## 📋 デプロイ前チェックリスト

### ✅ 必須確認事項
```bash
# 1. プロダクションビルドが成功することを確認
npm run build

# 2. ビルド結果をローカルでプレビュー
npm run preview

# 3. テストが通ることを確認（任意）
npm run test:unit

# 4. Lintエラーがないことを確認
npm run lint
```

### 📦 ビルド成果物
- **`dist/`フォルダ**: 静的ファイル一式
- **サイズ**: 約1.5MB（gzip圧縮後: 393KB）
- **対応ブラウザ**: モダンブラウザ（ES2020+）

---

## 🌐 推奨デプロイ方法

### 1. 🟢 **Vercel** (推奨) - 最も簡単

#### 特徴
- ✅ 無料プラン利用可能
- ✅ 自動CI/CD
- ✅ カスタムドメイン対応
- ✅ Edge Functions対応

#### デプロイ手順

**方法A: GitHubから自動デプロイ**
```bash
# 1. GitHubにプッシュ
git push origin master

# 2. Vercelサイトでプロジェクトインポート
# https://vercel.com/new
# → GitHubリポジトリを選択
# → Build Command: npm run build
# → Output Directory: dist
# → 自動デプロイ開始
```

**方法B: Vercel CLIを使用**
```bash
# 1. Vercel CLIインストール
npm install -g vercel

# 2. ログイン
vercel login

# 3. プロジェクトデプロイ
vercel

# 4. プロダクションデプロイ
vercel --prod
```

#### 設定ファイル作成
```json
# vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

### 2. 🟦 **Netlify** - Git連携が強力

#### 特徴
- ✅ 無料プラン利用可能
- ✅ フォーム処理対応
- ✅ Edge Functions
- ✅ A/Bテスト機能

#### デプロイ手順

**方法A: ドラッグ&ドロップ**
```bash
# 1. ビルド実行
npm run build

# 2. Netlifyサイトで dist フォルダをドラッグ&ドロップ
# https://app.netlify.com/drop
```

**方法B: Git連携**
```bash
# 1. GitHubにプッシュ
git push origin master

# 2. Netlifyで新しいサイト作成
# → GitHubリポジトリを選択
# → Build command: npm run build
# → Publish directory: dist
```

#### 設定ファイル作成
```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

### 3. 🟣 **GitHub Pages** - 無料、シンプル

#### 特徴
- ✅ 完全無料
- ✅ GitHub統合
- ✅ カスタムドメイン対応

#### デプロイ手順

**GitHub Actionsを使用**
```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ master ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build
      run: npm run build
    
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
```

**手動デプロイ**
```bash
# 1. gh-pages ブランチ用ツールインストール
npm install --save-dev gh-pages

# 2. package.json にスクリプト追加
{
  "scripts": {
    "deploy": "npm run build && gh-pages -d dist"
  }
}

# 3. デプロイ実行
npm run deploy
```

---

### 4. 🟠 **Firebase Hosting** - Googleの高性能CDN

#### 特徴
- ✅ 高性能CDN
- ✅ 無料枠豊富
- ✅ Firebase統合

#### デプロイ手順
```bash
# 1. Firebase CLIインストール
npm install -g firebase-tools

# 2. Firebaseログイン
firebase login

# 3. プロジェクト初期化
firebase init hosting

# 4. firebase.json 設定
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}

# 5. ビルド & デプロイ
npm run build
firebase deploy
```

---

### 5. 🔵 **Azure Static Web Apps** - Microsoft Azure

#### 特徴
- ✅ 無料プラン
- ✅ API統合
- ✅ 認証機能

#### デプロイ手順
```bash
# 1. Azure CLIインストール
# https://docs.microsoft.com/cli/azure/install-azure-cli

# 2. ログイン
az login

# 3. Static Web Appを作成（Azure Portal経由推奨）

# 4. GitHub Actionsが自動生成される
```

---

## 🐳 Docker デプロイ

### Dockerコンテナ化

#### Dockerfile作成
```dockerfile
# Dockerfile
# マルチステージビルド
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Nginx で静的ファイル配信
FROM nginx:alpine

# カスタムnginx設定
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### nginx設定
```nginx
# nginx.conf
server {
    listen 80;
    server_name localhost;

    root /usr/share/nginx/html;
    index index.html;

    # SPA対応 - 全てのルートをindex.htmlに転送
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静的ファイルのキャッシュ設定
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # gzip圧縮
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

#### Docker操作
```bash
# 1. イメージビルド
docker build -t dungeon-map-creator .

# 2. ローカル実行
docker run -p 8080:80 dungeon-map-creator

# 3. Docker Hubにプッシュ
docker tag dungeon-map-creator your-username/dungeon-map-creator
docker push your-username/dungeon-map-creator
```

---

## ☁️ クラウドプラットフォーム詳細

### AWS S3 + CloudFront

#### 手順
```bash
# 1. S3バケット作成
aws s3 mb s3://your-bucket-name

# 2. ビルド & アップロード
npm run build
aws s3 sync dist/ s3://your-bucket-name --delete

# 3. 静的ウェブサイト設定
aws s3 website s3://your-bucket-name --index-document index.html --error-document index.html

# 4. CloudFront設定（推奨）
# AWS Console で CloudFront Distribution を作成
```

### Google Cloud Storage

#### 手順
```bash
# 1. バケット作成
gsutil mb gs://your-bucket-name

# 2. ビルド & アップロード
npm run build
gsutil -m rsync -r -d dist/ gs://your-bucket-name

# 3. 公開設定
gsutil web set -m index.html -e index.html gs://your-bucket-name
```

---

## 🔧 プロダクション最適化

### パフォーマンス改善設定

#### Vite設定最適化
```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // チャンクサイズ警告の調整
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // 手動チャンク分割
        manualChunks: {
          'vendor': ['react', 'react-dom', '@mui/material'],
          'three': ['three', '@react-three/fiber'],
          'redux': ['@reduxjs/toolkit', 'react-redux']
        }
      }
    },
    // 本番環境でのソースマップ
    sourcemap: false,
    // 圧縮設定
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
})
```

#### 環境変数設定
```bash
# .env.production
VITE_APP_ENV=production
VITE_APP_VERSION=1.0.0
VITE_APP_BUILD_DATE=2025-01-06
```

---

## 📊 デプロイ後の確認事項

### 基本動作確認
```bash
# 1. ページ読み込み確認
curl -I https://your-domain.com

# 2. 重要ファイルの確認
curl -I https://your-domain.com/assets/index-[hash].js
curl -I https://your-domain.com/assets/index-[hash].css

# 3. SPA ルーティング確認
curl -I https://your-domain.com/some-path
```

### パフォーマンス確認
1. **Google PageSpeed Insights**
   - https://pagespeed.web.dev/
   - 目標: 90+ スコア

2. **Lighthouse** (Chrome DevTools)
   - Performance: 90+
   - Accessibility: 95+
   - Best Practices: 95+
   - SEO: 90+

3. **WebPageTest**
   - https://www.webpagetest.org/
   - First Contentful Paint < 2s

---

## 🎯 推奨デプロイ戦略

### 本格運用推奨構成

**1. メイン推奨: Vercel**
- 理由: 最も簡単、高性能、無料枠豊富
- 用途: 個人プロジェクト、プロトタイプ、小規模運用

**2. エンタープライズ推奨: AWS/Azure**
- 理由: 高い可用性、セキュリティ、スケーラビリティ
- 用途: 大規模運用、企業利用

**3. 開発・テスト推奨: Netlify**
- 理由: プレビューデプロイ、A/Bテスト
- 用途: 開発環境、ステージング環境

### CI/CD パイプライン例

#### GitHub Actions完全版
```yaml
# .github/workflows/deploy-production.yml
name: Production Deploy

on:
  push:
    branches: [ master ]
    tags: [ 'v*' ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - run: npm ci
    - run: npm run lint
    - run: npm run build
    - run: npm run test:unit

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/master'
    
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - run: npm ci
    - run: npm run build
    
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        vercel-args: '--prod'
```

---

## 🛡️ セキュリティ考慮事項

### 基本セキュリティ設定

#### セキュリティヘッダー（nginx例）
```nginx
# セキュリティヘッダー追加
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:;" always;
```

#### 環境変数の管理
```bash
# 本番環境では機密情報を環境変数で管理
# デプロイプラットフォームの設定画面で設定

# 例: Vercel環境変数設定
# Dashboard → Project → Settings → Environment Variables
```

---

## 📞 サポート・トラブルシューティング

### よくある問題

**1. SPA ルーティング問題**
```bash
# 症状: リロード時に404エラー
# 解決: サーバー設定でフォールバックを設定
# 全てのルートを index.html に転送
```

**2. 大きなバンドルサイズ警告**
```bash
# 症状: バンドルサイズが大きい
# 解決: コード分割を実装
npm run build -- --analyze  # バンドル分析
```

**3. 環境変数が読み込まれない**
```bash
# 症状: 環境変数が undefined
# 解決: VITE_ プレフィックスを確認
# VITE_APP_NAME=value  # ✅ 正しい
# APP_NAME=value       # ❌ 読み込まれない
```

### デバッグ用コマンド
```bash
# ビルド詳細確認
npm run build -- --mode production --logLevel info

# バンドル分析
npx vite-bundle-analyzer dist

# ローカルプレビュー
npm run preview -- --port 4173 --host
```

---

## 🎉 デプロイ完了

デプロイが完了したら、本格的なダンジョンマップエディターをユーザーに提供できます！

### 次のステップ
1. **ユーザーフィードバック収集**
2. **アナリティクス設定**
3. **パフォーマンス監視**
4. **継続的改善**

このガイドに従って、安全で高性能なデプロイを実現してください。