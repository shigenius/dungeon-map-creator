import { test, expect } from '@playwright/test';

test.describe('ダンジョンマップクリエイター 基本機能', () => {
  test('アプリケーションが正常に起動する', async ({ page }) => {
    await page.goto('/');

    // タイトルの確認
    await expect(page).toHaveTitle(/3D ダンジョンマップクリエイター/);
    
    // メインヘッダーの確認
    await expect(page.locator('h6')).toContainText('3D ダンジョンマップクリエイター');
  });

  test('新規プロジェクト作成ダイアログが表示される', async ({ page }) => {
    await page.goto('/');

    // 新規プロジェクト作成ダイアログの確認
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('h2')).toContainText('新規プロジェクト作成');
    
    // フォーム要素の確認
    await expect(page.locator('input[label="ダンジョン名"]')).toBeVisible();
    await expect(page.locator('input[label="作成者"]')).toBeVisible();
  });

  test('新規プロジェクトを作成できる', async ({ page }) => {
    await page.goto('/');

    // プロジェクト名を入力
    await page.fill('input[value="新しいダンジョン"]', 'テストダンジョン');
    await page.fill('input[placeholder="名前を入力（任意）"]', 'テストユーザー');

    // 作成ボタンをクリック
    await page.click('button:has-text("作成")');

    // ダイアログが閉じて、メインのUIが表示されることを確認
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    await expect(page.locator('text=テストダンジョン')).toBeVisible();
  });

  test('メニューバーの基本機能', async ({ page }) => {
    await page.goto('/');
    
    // プロジェクト作成
    await page.click('button:has-text("作成")');
    
    // メニューバーの項目を確認
    await expect(page.locator('button:has-text("ファイル")')).toBeVisible();
    await expect(page.locator('button:has-text("編集")')).toBeVisible();
    await expect(page.locator('button:has-text("表示")')).toBeVisible();
    
    // ファイルメニューを開く
    await page.click('button:has-text("ファイル")');
    await expect(page.locator('li:has-text("新規作成")')).toBeVisible();
    await expect(page.locator('li:has-text("JSONエクスポート")')).toBeVisible();
  });

  test('ツールバーの操作', async ({ page }) => {
    await page.goto('/');
    
    // プロジェクト作成
    await page.click('button:has-text("作成")');
    
    // ツールバーのツールを確認
    const tools = ['pen', 'rectangle', 'fill', 'eyedropper', 'select'];
    
    for (const tool of tools) {
      await expect(page.locator(`button[value="${tool}"]`)).toBeVisible();
    }
    
    // ツールを切り替える
    await page.click('button[value="rectangle"]');
    await expect(page.locator('button[value="rectangle"]')).toHaveAttribute('aria-pressed', 'true');
  });

  test('レイヤー管理パネル', async ({ page }) => {
    await page.goto('/');
    
    // プロジェクト作成
    await page.click('button:has-text("作成")');
    
    // レイヤーパネルの確認
    await expect(page.locator('text=レイヤー管理')).toBeVisible();
    await expect(page.locator('text=床レイヤー')).toBeVisible();
    await expect(page.locator('text=壁レイヤー')).toBeVisible();
    await expect(page.locator('text=イベントレイヤー')).toBeVisible();
    await expect(page.locator('text=装飾レイヤー')).toBeVisible();
  });

  test('2Dマップエディタの基本表示', async ({ page }) => {
    await page.goto('/');
    
    // プロジェクト作成
    await page.click('button:has-text("作成")');
    
    // キャンバスが表示されることを確認
    await expect(page.locator('canvas')).toBeVisible();
    
    // ステータスバーの確認
    await expect(page.locator('text=ズーム: 100%')).toBeVisible();
    await expect(page.locator('text=ツール: pen')).toBeVisible();
  });
});