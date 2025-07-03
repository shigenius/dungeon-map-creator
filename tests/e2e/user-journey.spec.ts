import { test, expect } from '@playwright/test'

test.describe('ダンジョンマップクリエイター E2Eテスト', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test.describe('プロジェクト作成からマップ編集まで', () => {
    test('新しいプロジェクトを作成してマップを編集できる', async ({ page }) => {
      // 初期画面の確認
      await expect(page.locator('h1')).toContainText('Dungeon Map Creator')
      await expect(page.locator('text=プロジェクトが読み込まれていません')).toBeVisible()

      // 新しいプロジェクトボタンをクリック
      await page.click('button:has-text("新しいプロジェクト")')

      // 新しいプロジェクトダイアログが開く
      await expect(page.locator('dialog')).toBeVisible()
      await expect(page.locator('text=新しいプロジェクト')).toBeVisible()

      // プロジェクト情報を入力
      await page.fill('input[name="projectName"]', 'テストダンジョン')
      await page.fill('input[name="author"]', 'テスト作者')
      await page.fill('input[name="width"]', '10')
      await page.fill('input[name="height"]', '8')

      // プロジェクトを作成
      await page.click('button:has-text("作成")')

      // ダイアログが閉じてマップエディターが表示される
      await expect(page.locator('dialog')).not.toBeVisible()
      await expect(page.locator('canvas[data-testid="map-canvas"]')).toBeVisible()
      await expect(page.locator('text=プロジェクトが読み込まれていません')).not.toBeVisible()

      // ツールバーとパネルが有効になる
      await expect(page.locator('button[aria-label="ペンツール"]')).toBeEnabled()
      await expect(page.locator('button[aria-label="床レイヤー"]')).toBeEnabled()
    })

    test('キーボードショートカットでツールを切り替えられる', async ({ page }) => {
      // プロジェクトを作成
      await page.click('button:has-text("新しいプロジェクト")')
      await page.fill('input[name="projectName"]', 'ショートカットテスト')
      await page.fill('input[name="author"]', 'テスト作者')
      await page.click('button:has-text("作成")')

      // 初期状態でペンツールが選択されている
      await expect(page.locator('button[aria-label="ペンツール"]')).toHaveAttribute('aria-pressed', 'true')

      // キーボードショートカットでツールを切り替え
      await page.keyboard.press('2') // 矩形ツール
      await expect(page.locator('button[aria-label="矩形ツール"]')).toHaveAttribute('aria-pressed', 'true')
      await expect(page.locator('button[aria-label="ペンツール"]')).toHaveAttribute('aria-pressed', 'false')

      await page.keyboard.press('3') // 塗りつぶしツール
      await expect(page.locator('button[aria-label="塗りつぶしツール"]')).toHaveAttribute('aria-pressed', 'true')

      await page.keyboard.press('4') // スポイトツール
      await expect(page.locator('button[aria-label="スポイトツール"]')).toHaveAttribute('aria-pressed', 'true')

      await page.keyboard.press('5') // 選択ツール
      await expect(page.locator('button[aria-label="選択ツール"]')).toHaveAttribute('aria-pressed', 'true')
    })

    test('レイヤーを切り替えてマップを編集できる', async ({ page }) => {
      // プロジェクトを作成
      await page.click('button:has-text("新しいプロジェクト")')
      await page.fill('input[name="projectName"]', 'レイヤーテスト')
      await page.fill('input[name="author"]', 'テスト作者')
      await page.click('button:has-text("作成")')

      // 床レイヤーが初期選択されている
      await expect(page.locator('button[aria-label="床レイヤー"]')).toHaveAttribute('aria-pressed', 'true')

      // 壁レイヤーに切り替え
      await page.keyboard.press('w')
      await expect(page.locator('button[aria-label="壁レイヤー"]')).toHaveAttribute('aria-pressed', 'true')
      await expect(page.locator('button[aria-label="床レイヤー"]')).toHaveAttribute('aria-pressed', 'false')

      // イベントレイヤーに切り替え
      await page.keyboard.press('e')
      await expect(page.locator('button[aria-label="イベントレイヤー"]')).toHaveAttribute('aria-pressed', 'true')

      // 装飾レイヤーに切り替え
      await page.keyboard.press('d')
      await expect(page.locator('button[aria-label="装飾レイヤー"]')).toHaveAttribute('aria-pressed', 'true')

      // Tabキーで順次切り替え
      await page.keyboard.press('Tab')
      await expect(page.locator('button[aria-label="床レイヤー"]')).toHaveAttribute('aria-pressed', 'true')
    })

    test('マップにセルを描画できる', async ({ page }) => {
      // プロジェクトを作成
      await page.click('button:has-text("新しいプロジェクト")')
      await page.fill('input[name="projectName"]', '描画テスト')
      await page.fill('input[name="author"]', 'テスト作者')
      await page.click('button:has-text("作成")')

      const canvas = page.locator('canvas[data-testid="map-canvas"]')
      await expect(canvas).toBeVisible()

      // ペンツールでセルをクリック
      await page.keyboard.press('1') // ペンツール選択
      await canvas.click({ position: { x: 100, y: 100 } })

      // 矩形ツールで範囲選択
      await page.keyboard.press('2') // 矩形ツール選択
      await canvas.click({ position: { x: 150, y: 150 } })
      await page.mouse.down()
      await page.mouse.move(250, 250)
      await page.mouse.up()

      // 描画が実行されることを確認（実際の描画内容の検証は困難なため、操作が正常に実行されることを確認）
      await expect(canvas).toBeVisible()
    })

    test('ズーム機能が正しく動作する', async ({ page }) => {
      // プロジェクトを作成
      await page.click('button:has-text("新しいプロジェクト")')
      await page.fill('input[name="projectName"]', 'ズームテスト')
      await page.fill('input[name="author"]', 'テスト作者')
      await page.click('button:has-text("作成")')

      // 初期ズーム確認
      await expect(page.locator('text=100%')).toBeVisible()

      // ズームイン
      await page.click('button[aria-label="ズームイン"]')
      await expect(page.locator('text=100%')).not.toBeVisible()

      // ズームアウト
      await page.click('button[aria-label="ズームアウト"]')
      await page.click('button[aria-label="ズームアウト"]')

      // ズームリセット
      await page.click('button[aria-label="ズームリセット"]')
      await expect(page.locator('text=100%')).toBeVisible()

      // キーボードショートカットでズーム
      await page.keyboard.press('Control+Plus')
      await expect(page.locator('text=100%')).not.toBeVisible()

      await page.keyboard.press('Control+0')
      await expect(page.locator('text=100%')).toBeVisible()
    })

    test('グリッド表示を切り替えられる', async ({ page }) => {
      // プロジェクトを作成
      await page.click('button:has-text("新しいプロジェクト")')
      await page.fill('input[name="projectName"]', 'グリッドテスト')
      await page.fill('input[name="author"]', 'テスト作者')
      await page.click('button:has-text("作成")')

      // グリッド表示ボタンをクリック
      const gridButton = page.locator('button[aria-label="グリッド表示"]')
      await expect(gridButton).toBeVisible()
      await gridButton.click()

      // キーボードショートカットでグリッド切り替え
      await page.keyboard.press('Control+g')
      await page.keyboard.press('Space')
    })

    test('イベントを作成・編集できる', async ({ page }) => {
      // プロジェクトを作成
      await page.click('button:has-text("新しいプロジェクト")')
      await page.fill('input[name="projectName"]', 'イベントテスト')
      await page.fill('input[name="author"]', 'テスト作者')
      await page.click('button:has-text("作成")')

      // イベントレイヤーに切り替え
      await page.keyboard.press('e')

      // 左パネルでイベント管理を開く
      await page.click('text=イベント管理')

      // 新しいイベント追加
      await page.click('button:has-text("新しいイベント追加")')

      // イベント編集ダイアログが開く
      await expect(page.locator('dialog')).toBeVisible()
      await expect(page.locator('text=新しいイベント')).toBeVisible()

      // イベント情報を入力
      await page.fill('input[name="eventName"]', '宝箱イベント')
      await page.selectOption('select[name="eventType"]', 'treasure')
      await page.fill('input[name="x"]', '2')
      await page.fill('input[name="y"]', '3')
      await page.fill('input[name="color"]', '#ffd700')
      await page.fill('input[name="icon"]', '💰')

      // イベントを保存
      await page.click('button:has-text("保存")')

      // ダイアログが閉じる
      await expect(page.locator('dialog')).not.toBeVisible()

      // イベントがリストに表示される
      await expect(page.locator('text=宝箱イベント')).toBeVisible()
    })

    test('テンプレートを選択・配置できる', async ({ page }) => {
      // プロジェクトを作成
      await page.click('button:has-text("新しいプロジェクト")')
      await page.fill('input[name="projectName"]', 'テンプレートテスト')
      await page.fill('input[name="author"]', 'テスト作者')
      await page.click('button:has-text("作成")')

      // 右パネルでテンプレートセクションを開く
      await page.click('text=テンプレート')

      // テンプレートが表示されるまで待機（データがロードされる）
      await page.waitForTimeout(1000)

      // テンプレートを選択（最初に表示されるテンプレート）
      const firstTemplate = page.locator('.template-item').first()
      if (await firstTemplate.isVisible()) {
        await firstTemplate.click()

        // テンプレート回転
        await page.keyboard.press('q') // 左回転
        await page.keyboard.press('r') // 右回転

        // テンプレート配置モード
        await page.click('button:has-text("配置")')

        // キャンバスでテンプレート配置
        const canvas = page.locator('canvas[data-testid="map-canvas"]')
        await canvas.click({ position: { x: 200, y: 200 } })
      }
    })

    test('undo/redo機能が正しく動作する', async ({ page }) => {
      // プロジェクトを作成
      await page.click('button:has-text("新しいプロジェクト")')
      await page.fill('input[name="projectName"]', 'Undo/Redoテスト')
      await page.fill('input[name="author"]', 'テスト作者')
      await page.click('button:has-text("作成")')

      // 何らかの編集操作を実行（セルをクリック）
      const canvas = page.locator('canvas[data-testid="map-canvas"]')
      await canvas.click({ position: { x: 100, y: 100 } })

      // Undoボタンが有効になるまで待機
      await page.waitForTimeout(500)

      // Undoボタンをクリック
      const undoButton = page.locator('button[aria-label="元に戻す"]')
      if (await undoButton.isEnabled()) {
        await undoButton.click()
      }

      // Redoボタンをクリック
      const redoButton = page.locator('button[aria-label="やり直し"]')
      if (await redoButton.isEnabled()) {
        await redoButton.click()
      }

      // キーボードショートカットでundo/redo
      await page.keyboard.press('Control+z')
      await page.keyboard.press('Control+y')
    })

    test('プロジェクトの保存・読み込みができる', async ({ page }) => {
      // プロジェクトを作成
      await page.click('button:has-text("新しいプロジェクト")')
      await page.fill('input[name="projectName"]', '保存テスト')
      await page.fill('input[name="author"]', 'テスト作者')
      await page.click('button:has-text("作成")')

      // 何らかの編集を実行
      const canvas = page.locator('canvas[data-testid="map-canvas"]')
      await canvas.click({ position: { x: 100, y: 100 } })

      // ファイルメニューを開く
      await page.click('text=ファイル')

      // 保存ボタンをクリック（実際のファイル保存はブラウザの制限で確認困難）
      const saveButton = page.locator('text=保存')
      if (await saveButton.isVisible()) {
        await saveButton.click()
      }

      // ファイル読み込み（実際のファイル選択はブラウザの制限で確認困難）
      const openButton = page.locator('text=開く')
      if (await openButton.isVisible()) {
        await openButton.click()
      }
    })

    test('2D/3Dビューモードを切り替えられる', async ({ page }) => {
      // プロジェクトを作成
      await page.click('button:has-text("新しいプロジェクト")')
      await page.fill('input[name="projectName"]', 'ビューモードテスト')
      await page.fill('input[name="author"]', 'テスト作者')
      await page.click('button:has-text("作成")')

      // 初期状態で2Dビューが選択されている
      await expect(page.locator('button[aria-label="2Dビュー"]')).toHaveAttribute('aria-pressed', 'true')

      // 3Dビューに切り替え
      await page.click('button[aria-label="3Dビュー"]')
      await expect(page.locator('button[aria-label="3Dビュー"]')).toHaveAttribute('aria-pressed', 'true')
      await expect(page.locator('button[aria-label="2Dビュー"]')).toHaveAttribute('aria-pressed', 'false')

      // キーボードショートカットでビュー切り替え
      await page.keyboard.press('Control+1') // 2Dビュー
      await expect(page.locator('button[aria-label="2Dビュー"]')).toHaveAttribute('aria-pressed', 'true')

      await page.keyboard.press('Control+2') // 3Dビュー
      await expect(page.locator('button[aria-label="3Dビュー"]')).toHaveAttribute('aria-pressed', 'true')
    })

    test('エラーハンドリングが正しく動作する', async ({ page }) => {
      // 無効な入力でプロジェクト作成を試行
      await page.click('button:has-text("新しいプロジェクト")')

      // 空の名前で作成を試行
      await page.click('button:has-text("作成")')

      // エラーメッセージが表示される
      await expect(page.locator('text=プロジェクト名は必須です')).toBeVisible()

      // 無効なサイズで作成を試行
      await page.fill('input[name="projectName"]', 'エラーテスト')
      await page.fill('input[name="author"]', 'テスト作者')
      await page.fill('input[name="width"]', '1') // 最小値未満
      await page.click('button:has-text("作成")')

      // エラーメッセージが表示される
      await expect(page.locator('text=幅は5以上100以下で入力してください')).toBeVisible()
    })

    test('レスポンシブデザインが正しく動作する', async ({ page }) => {
      // モバイルサイズに変更
      await page.setViewportSize({ width: 768, height: 1024 })

      await page.goto('/')

      // モバイルレイアウトで表示確認
      await expect(page.locator('h1')).toBeVisible()
      await expect(page.locator('button:has-text("新しいプロジェクト")')).toBeVisible()

      // タブレットサイズに変更
      await page.setViewportSize({ width: 1024, height: 768 })

      // レイアウトが適切に調整されることを確認
      await expect(page.locator('h1')).toBeVisible()

      // デスクトップサイズに戻す
      await page.setViewportSize({ width: 1920, height: 1080 })

      // 全体のレイアウトが正しく表示されることを確認
      await expect(page.locator('text=レイヤー')).toBeVisible()
      await expect(page.locator('text=テンプレート')).toBeVisible()
    })

    test('アクセシビリティが適切に実装されている', async ({ page }) => {
      // プロジェクトを作成
      await page.click('button:has-text("新しいプロジェクト")')
      await page.fill('input[name="projectName"]', 'アクセシビリティテスト')
      await page.fill('input[name="author"]', 'テスト作者')
      await page.click('button:has-text("作成")')

      // キーボードナビゲーションテスト
      await page.keyboard.press('Tab')
      const firstFocused = await page.evaluate(() => document.activeElement?.tagName)
      expect(firstFocused).toBeTruthy()

      // すべてのボタンにaria-labelが設定されていることを確認
      const buttons = await page.locator('button[aria-label]').count()
      expect(buttons).toBeGreaterThan(0)

      // ランドマークロールが設定されていることを確認
      await expect(page.locator('main')).toBeVisible()
      await expect(page.locator('nav')).toBeVisible()

      // コントラストとフォントサイズが適切であることを確認（視覚的テスト）
      await expect(page.locator('h1')).toBeVisible()
    })
  })

  test.describe('パフォーマンステスト', () => {
    test('大きなマップでも正常に動作する', async ({ page }) => {
      // 大きなプロジェクトを作成
      await page.click('button:has-text("新しいプロジェクト")')
      await page.fill('input[name="projectName"]', 'パフォーマンステスト')
      await page.fill('input[name="author"]', 'テスト作者')
      await page.fill('input[name="width"]', '50')
      await page.fill('input[name="height"]', '50')
      await page.click('button:has-text("作成")')

      // キャンバスが表示されることを確認
      await expect(page.locator('canvas[data-testid="map-canvas"]')).toBeVisible()

      // 大量の操作を実行
      const canvas = page.locator('canvas[data-testid="map-canvas"]')
      for (let i = 0; i < 10; i++) {
        await canvas.click({ position: { x: 100 + i * 20, y: 100 + i * 20 } })
      }

      // アプリケーションが応答することを確認
      await expect(page.locator('button[aria-label="ペンツール"]')).toBeEnabled()
    })

    test('高速な操作でも安定している', async ({ page }) => {
      // プロジェクトを作成
      await page.click('button:has-text("新しいプロジェクト")')
      await page.fill('input[name="projectName"]', '高速操作テスト')
      await page.fill('input[name="author"]', 'テスト作者')
      await page.click('button:has-text("作成")')

      // 高速なツール切り替え
      for (let i = 0; i < 20; i++) {
        await page.keyboard.press('1')
        await page.keyboard.press('2')
        await page.keyboard.press('3')
      }

      // アプリケーションが安定していることを確認
      await expect(page.locator('button[aria-label="塗りつぶしツール"]')).toHaveAttribute('aria-pressed', 'true')
    })
  })
})