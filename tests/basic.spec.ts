import { test, expect } from '@playwright/test';

test.describe('ダンジョンマップクリエイター 基本機能', () => {
  test('アプリケーションが正常に起動する', async ({ page }) => {
    await page.goto('/');

    // タイトルの確認
    await expect(page).toHaveTitle(/3D ダンジョンマップクリエイター/);
    
    // メインヘッダーの確認（AppBarのヘッダーテキスト）
    await expect(page.getByText('3D ダンジョンマップクリエイター')).toBeVisible();
  });

  test('新規プロジェクト作成ダイアログが表示される', async ({ page }) => {
    await page.goto('/');

    // 新規プロジェクト作成ダイアログの確認
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('h2')).toContainText('新規プロジェクト作成');
    
    // フォーム要素の確認 - MUIのTextField用のセレクタ
    await expect(page.locator('input[placeholder="新しいダンジョン"]')).toBeVisible();
    await expect(page.locator('input[placeholder="名前を入力（任意）"]')).toBeVisible();
  });


  test('メニューバーの基本機能', async ({ page }) => {
    await page.goto('/');
    
    // プロジェクト作成
    await page.locator('[role="dialog"] button:has-text("作成")').click();
    
    // メニューバーの項目を確認
    await expect(page.locator('button:has-text("ファイル")')).toBeVisible();
    await expect(page.locator('button:has-text("編集")')).toBeVisible();
    await expect(page.locator('button:has-text("表示")')).toBeVisible();
    
    // ファイルメニューを開く
    await page.click('button:has-text("ファイル")');
    await expect(page.locator('li:has-text("新規作成")')).toBeVisible();
    await expect(page.locator('li:has-text("保存")')).toBeVisible();
    await expect(page.locator('li:has-text("開く")')).toBeVisible();
  });



});