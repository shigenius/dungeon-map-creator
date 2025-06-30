import { test, expect } from '@playwright/test';

test.describe('ダンジョンマップクリエイター 最小限のテスト', () => {
  test('アプリケーションが起動し、ページタイトルが正しい', async ({ page }) => {
    await page.goto('/');
    
    // ページタイトルの確認
    await expect(page).toHaveTitle(/3D ダンジョンマップクリエイター/);
  });

  test('新規プロジェクト作成ダイアログが開いている', async ({ page }) => {
    await page.goto('/');
    
    // ダイアログが表示されていることを確認
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    
    // ダイアログのタイトルを確認
    await expect(page.locator('h2')).toContainText('新規プロジェクト作成');
  });

  test('プロジェクト作成フォームの基本要素', async ({ page }) => {
    await page.goto('/');
    
    // ダンジョン名入力フィールド
    const dungeonNameInput = page.locator('input[value="新しいダンジョン"]');
    await expect(dungeonNameInput).toBeVisible();
    
    // 作成者入力フィールド
    const authorInput = page.locator('input[placeholder="名前を入力（任意）"]');
    await expect(authorInput).toBeVisible();
    
    // 作成ボタン
    const createButton = page.locator('button:has-text("作成")');
    await expect(createButton).toBeVisible();
    await expect(createButton).toBeEnabled();
  });
});