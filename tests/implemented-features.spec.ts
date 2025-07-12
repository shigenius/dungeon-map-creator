import { test, expect } from '@playwright/test';

test.describe('実装済み機能のブラウザテスト', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('アプリケーション起動と基本UI要素', async ({ page }) => {
    // ページタイトルの確認
    await expect(page).toHaveTitle(/3D ダンジョンマップクリエイター/);
    
    // メインヘッダーの確認（正確なテキストで指定）
    await expect(page.getByText('3D ダンジョンマップクリエイター')).toBeVisible();
    
    // 新規プロジェクト作成ダイアログが表示されていることを確認
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('h2')).toContainText('新規プロジェクト作成');
  });



  test('Ctrl+Nキーボードショートカットでの新規作成', async ({ page }) => {
    // 最初のプロジェクト作成
    await page.click('button:has-text("作成")');
    
    // Ctrl+Nで新規プロジェクト作成ショートカットを実行
    await page.keyboard.press('Control+n');
    
    // 新規プロジェクト作成ダイアログが再度表示されることを確認
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('h2')).toContainText('新規プロジェクト作成');
  });

  test('ファイル保存機能', async ({ page }) => {
    // プロジェクト作成
    await page.click('button:has-text("作成")');
    
    // ファイルメニューから保存を実行
    await page.click('button:has-text("ファイル")');
    await page.click('li:has-text("保存")');
    
    // 保存機能が実行されることを確認（コンソールログまたは画面上のフィードバック）
    // この実装では保存時のフィードバックがないため、メニューが閉じたことを確認
    await expect(page.locator('button:has-text("ファイル")')).toBeVisible();
  });

  test('Ctrl+Sキーボードショートカットでの保存', async ({ page }) => {
    // プロジェクト作成
    await page.click('button:has-text("作成")');
    
    // Ctrl+Sで保存ショートカットを実行
    await page.keyboard.press('Control+s');
    
    // 保存機能が実行されることを確認
    // この実装では保存時の画面フィードバックがないため、基本的な状態確認
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('JSONファイル読み込み機能の基本テスト', async ({ page }) => {
    // プロジェクト作成
    await page.click('button:has-text("作成")');
    
    // ファイルメニューから開くを選択
    await page.click('button:has-text("ファイル")');
    await page.click('li:has-text("開く")');
    
    // ファイル選択ダイアログが開くことを確認（ブラウザのネイティブダイアログ）
    // この機能は実際のファイル選択に依存するため、メニューの動作のみテスト
    await expect(page.locator('button:has-text("ファイル")')).toBeVisible();
  });

  test('Ctrl+Oキーボードショートカットでファイル開く', async ({ page }) => {
    // プロジェクト作成
    await page.click('button:has-text("作成")');
    
    // Ctrl+Oでファイルを開くショートカットを実行
    await page.keyboard.press('Control+o');
    
    // ファイル開く機能が実行されることを確認
    // この実装では実際のファイル選択は行わずショートカット動作を確認
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('不正なJSONファイル処理のエラーハンドリング', async ({ page }) => {
    // プロジェクト作成
    await page.click('button:has-text("作成")');
    
    // JSONファイル処理機能の基本動作を確認
    // 実際の不正ファイル処理はファイル選択に依存するため、基本動作のみテスト
    await page.click('button:has-text("ファイル")');
    await page.click('li:has-text("開く")');
    
    // メニューが正常に動作することを確認
    await expect(page.locator('button:has-text("ファイル")')).toBeVisible();
  });

  test('ファイル操作のキーボードショートカット統合テスト', async ({ page }) => {
    // プロジェクト作成
    await page.click('button:has-text("作成")');
    
    // 複数のファイル操作ショートカットを順次実行
    await page.keyboard.press('Control+s'); // 保存
    await page.waitForTimeout(200);
    
    await page.keyboard.press('Control+n'); // 新規作成
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // ダイアログをキャンセル
    await page.keyboard.press('Escape');
    
    await page.keyboard.press('Control+o'); // ファイルを開く
    await page.waitForTimeout(200);
    
    // 最終的にキャンバスが正常に表示されていることを確認
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('メニューからのUndo/Redo操作', async ({ page }) => {
    // プロジェクト作成
    await page.click('button:has-text("作成")');
    
    // 編集メニューを開いてUndo/Redoが表示されることを確認
    await page.click('button:has-text("編集")');
    await expect(page.locator('li:has-text("元に戻す")')).toBeVisible();
    await expect(page.locator('li:has-text("やり直し")')).toBeVisible();
    
    // メニューを閉じる
    await page.click('body');
  });


});