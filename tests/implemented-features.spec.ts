import { test, expect } from '@playwright/test';

test.describe('実装済み機能のブラウザテスト', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('アプリケーション起動と基本UI要素', async ({ page }) => {
    // ページタイトルの確認
    await expect(page).toHaveTitle(/3D ダンジョンマップクリエイター/);
    
    // メインヘッダーの確認
    await expect(page.locator('h6')).toContainText('3D ダンジョンマップクリエイター');
    
    // 新規プロジェクト作成ダイアログが表示されていることを確認
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('h2')).toContainText('新規プロジェクト作成');
  });

  test('プロジェクト作成フロー', async ({ page }) => {
    // ダンジョン名の変更
    const dungeonNameInput = page.locator('input[value="新しいダンジョン"]');
    await expect(dungeonNameInput).toBeVisible();
    await dungeonNameInput.fill('テストダンジョン');
    
    // 作成者名の入力
    const authorInput = page.locator('input[placeholder="名前を入力（任意）"]');
    await authorInput.fill('テストユーザー');
    
    // プロジェクト作成
    await page.click('button:has-text("作成")');
    
    // ダイアログが閉じて、プロジェクト名が表示されることを確認
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    await expect(page.locator('text=テストダンジョン')).toBeVisible();
  });

  test('ツールバーの機能', async ({ page }) => {
    // プロジェクト作成
    await page.click('button:has-text("作成")');
    
    // ツールボタンが表示されていることを確認
    const tools = ['pen', 'rectangle', 'fill', 'eyedropper', 'select'];
    for (const tool of tools) {
      await expect(page.locator(`[role="group"] button[value="${tool}"]`)).toBeVisible();
    }
    
    // デフォルトでペンツールが選択されていることを確認
    await expect(page.locator('[role="group"] button[value="pen"]')).toHaveAttribute('aria-pressed', 'true');
    
    // ツールの切り替え
    await page.click('[role="group"] button[value="fill"]');
    await expect(page.locator('[role="group"] button[value="fill"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[role="group"] button[value="pen"]')).toHaveAttribute('aria-pressed', 'false');
  });

  test('レイヤー管理パネル', async ({ page }) => {
    // プロジェクト作成
    await page.click('button:has-text("作成")');
    
    // レイヤーリストの確認
    await expect(page.locator('text=レイヤー管理')).toBeVisible();
    await expect(page.locator('text=床レイヤー')).toBeVisible();
    await expect(page.locator('text=壁レイヤー')).toBeVisible();
    await expect(page.locator('text=イベントレイヤー')).toBeVisible();
    await expect(page.locator('text=装飾レイヤー')).toBeVisible();
    
    // 床レイヤーがデフォルトで選択されていることを確認
    const floorLayerButton = page.locator('text=床レイヤー').locator('xpath=ancestor::button');
    await expect(floorLayerButton).toHaveAttribute('aria-selected', 'true');
  });

  test('キャンバス表示', async ({ page }) => {
    // プロジェクト作成
    await page.click('button:has-text("作成")');
    
    // キャンバス要素が表示されていることを確認
    await expect(page.locator('canvas')).toBeVisible();
    
    // ステータスバーの確認
    await expect(page.locator('text=ズーム: 100%')).toBeVisible();
    await expect(page.locator('text=ツール: pen')).toBeVisible();
    await expect(page.locator('text=レイヤー: floor')).toBeVisible();
  });

  test('ズーム機能', async ({ page }) => {
    // プロジェクト作成
    await page.click('button:has-text("作成")');
    
    // ズームイン
    await page.click('button[title*="ズームイン"], button[aria-label*="ズームイン"]');
    
    // ズーム値が変更されたことを確認（正確な値は計算に依存するため、100%以外であることを確認）
    const zoomText = await page.locator('text=/ズーム: \\d+%/').textContent();
    expect(zoomText).not.toBe('ズーム: 100%');
  });

  test('メニューバーの機能', async ({ page }) => {
    // プロジェクト作成
    await page.click('button:has-text("作成")');
    
    // ファイルメニューを開く
    await page.click('button:has-text("ファイル")');
    await expect(page.locator('li:has-text("JSONエクスポート")')).toBeVisible();
    
    // メニューを閉じる
    await page.click('body');
    
    // 編集メニューを開く
    await page.click('button:has-text("編集")');
    await expect(page.locator('li:has-text("元に戻す")')).toBeVisible();
    await expect(page.locator('li:has-text("やり直し")')).toBeVisible();
  });

  test('キーボードショートカット - ツール切り替え', async ({ page }) => {
    // プロジェクト作成
    await page.click('button:has-text("作成")');
    
    // キーボードでツールを切り替え
    await page.keyboard.press('3'); // 塗りつぶしツール
    await expect(page.locator('[role="group"] button[value="fill"]')).toHaveAttribute('aria-pressed', 'true');
    
    await page.keyboard.press('1'); // ペンツール
    await expect(page.locator('[role="group"] button[value="pen"]')).toHaveAttribute('aria-pressed', 'true');
    
    // ステータスバーでツール変更が反映されることを確認
    await expect(page.locator('text=ツール: pen')).toBeVisible();
  });

  test('基本的なマップ編集操作', async ({ page }) => {
    // プロジェクト作成（小さめのマップで）
    await page.click('button:has-text("作成")');
    
    // キャンバスでクリック操作（床の編集）
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    
    // キャンバスの中央付近をクリック
    await canvas.click({ position: { x: 100, y: 100 } });
    
    // 壁レイヤーに切り替え
    await page.click('text=壁レイヤー');
    await expect(page.locator('text=レイヤー: walls')).toBeVisible();
    
    // 壁の配置
    await canvas.click({ position: { x: 150, y: 150 } });
  });

  test('JSONエクスポート機能', async ({ page }) => {
    // プロジェクト作成
    await page.click('button:has-text("作成")');
    
    // ダウンロード待機の設定
    const downloadPromise = page.waitForEvent('download');
    
    // ファイルメニューからJSONエクスポートを実行
    await page.click('button:has-text("ファイル")');
    await page.click('li:has-text("JSONエクスポート")');
    
    // ダウンロードが開始されることを確認
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.json$/);
  });
});