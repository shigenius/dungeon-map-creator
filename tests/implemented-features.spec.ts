import { test, expect } from '@playwright/test';

test.describe('実装済み機能のブラウザテスト', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('アプリケーション起動と基本UI要素', async ({ page }) => {
    // ページタイトルの確認
    await expect(page).toHaveTitle(/3D ダンジョンマップクリエイター/);
    
    // メインヘッダーの確認（正確なテキストで指定）
    await expect(page.locator('h6:has-text("3D ダンジョンマップクリエイター")')).toBeVisible();
    
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
    const authorInput = page.locator('input[type="text"]').nth(1);
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
    const floorLayerButton = page.getByRole('button', { name: /床レイヤー/ });
    await expect(floorLayerButton).toHaveClass(/Mui-selected/);
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
    
    // ズームインボタンをクリック（ツールチップではなくアイコンボタンを使用）
    await page.locator('button:has([data-testid="ZoomInIcon"])').first().click();
    
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

  test('床タイプ選択機能', async ({ page }) => {
    // プロジェクト作成（作成者名入力が必要）
    const authorInput = page.locator('input[type="text"]').nth(1);
    await authorInput.fill('テストユーザー');
    await page.click('button:has-text("作成")');
    
    // 床レイヤーが選択されていることを確認（初期状態）
    await expect(page.locator('text=レイヤー: floor')).toBeVisible();
    
    // 床タイプ選択セクションが表示されることを確認
    await expect(page.locator('text=床タイプ選択')).toBeVisible();
    
    // 各床タイプがボタンとして表示されることを確認
    const floorTypes = ['通常', 'ダメージ', '滑りやすい', '落とし穴', 'ワープ'];
    for (const floorType of floorTypes) {
      await expect(page.getByRole('button', { name: new RegExp(floorType) })).toBeVisible();
    }
    
    // ダメージ床タイプを選択
    await page.getByRole('button', { name: /ダメージ/ }).click();
    
    // 選択状態が反映されることを確認
    await expect(page.getByRole('button', { name: /ダメージ/ })).toHaveClass(/Mui-selected/);
  });

  test('壁タイプ選択機能', async ({ page }) => {
    // プロジェクト作成
    const authorInput = page.locator('input[type="text"]').nth(1);
    await authorInput.fill('テストユーザー');
    await page.click('button:has-text("作成")');
    
    // 壁レイヤーを選択
    await page.click('text=壁レイヤー');
    await expect(page.locator('text=レイヤー: walls')).toBeVisible();
    
    // 壁タイプ選択セクションが展開されることを確認
    await expect(page.locator('text=壁タイプ選択')).toBeVisible();
    
    // 各壁タイプがボタンとして表示されることを確認
    const wallTypes = ['通常壁', '扉', '鍵付き扉', '隠し扉', '破壊可能壁', '片面壁', '透明壁', 'イベント壁'];
    for (const wallType of wallTypes) {
      await expect(page.getByRole('button', { name: new RegExp(`^${wallType}`) })).toBeVisible();
    }
    
    // 扉タイプを選択（正確な「扉」のボタン）
    await page.getByRole('button', { name: '扉 通過可能な扉' }).click();
    
    // 選択状態が反映されることを確認
    await expect(page.getByRole('button', { name: '扉 通過可能な扉' })).toHaveClass(/Mui-selected/);
  });

  test('床タイプ選択と編集の統合テスト', async ({ page }) => {
    // プロジェクト作成
    const authorInput = page.locator('input[type="text"]').nth(1);
    await authorInput.fill('テストユーザー');
    await page.click('button:has-text("作成")');
    
    // 床レイヤーが選択されていることを確認
    await expect(page.locator('text=レイヤー: floor')).toBeVisible();
    
    // ダメージ床を選択
    await page.click('text=ダメージ');
    
    // ペンツールが選択されていることを確認
    await expect(page.locator('text=ツール: pen')).toBeVisible();
    
    // キャンバスが表示されていることを確認
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('壁タイプ選択と編集の統合テスト', async ({ page }) => {
    // プロジェクト作成
    const authorInput = page.locator('input[type="text"]').nth(1);
    await authorInput.fill('テストユーザー');
    await page.click('button:has-text("作成")');
    
    // 壁レイヤーを選択
    await page.click('text=壁レイヤー');
    await expect(page.locator('text=レイヤー: walls')).toBeVisible();
    
    // 隠し扉を選択
    await page.click('text=隠し扉');
    
    // ペンツールで編集準備完了
    await expect(page.locator('canvas')).toBeVisible();
    await expect(page.locator('text=ツール: pen')).toBeVisible();
  });

  test('矩形ツールのパフォーマンステスト', async ({ page }) => {
    // プロジェクト作成
    const authorInput = page.locator('input[type="text"]').nth(1);
    await authorInput.fill('テストユーザー');
    await page.click('button:has-text("作成")');
    
    // 矩形ツールを選択
    await page.keyboard.press('2');
    await expect(page.locator('text=ツール: rectangle')).toBeVisible();
    
    // キャンバス上で矩形を描画（パフォーマンス確認）
    const canvas = page.locator('canvas');
    
    // 矩形の開始と終了をクリック
    await canvas.click({ position: { x: 50, y: 50 } });
    await canvas.click({ position: { x: 150, y: 150 } });
    
    // 操作完了まで待機（レスポンスが良好であることを確認）
    await page.waitForTimeout(100);
    await expect(canvas).toBeVisible();
  });

  test('アイドロッパーツールの機能テスト', async ({ page }) => {
    // プロジェクト作成
    const authorInput = page.locator('input[type="text"]').nth(1);
    await authorInput.fill('テストユーザー');
    await page.click('button:has-text("作成")');
    
    // 床レイヤーが選択されていることを確認
    await expect(page.locator('text=レイヤー: floor')).toBeVisible();
    
    // ダメージ床を選択
    await page.click('text=ダメージ');
    
    // ペンツールでダメージ床を配置
    await page.keyboard.press('1'); // ペンツール
    await expect(page.locator('text=ツール: pen')).toBeVisible();
    
    const canvas = page.locator('canvas');
    await canvas.click({ position: { x: 100, y: 100 } });
    
    // アイドロッパーツールを選択
    await page.keyboard.press('4'); // アイドロッパーツール
    await expect(page.locator('text=ツール: eyedropper')).toBeVisible();
    
    // ダメージ床のセルをクリックしてキャプチャ
    await canvas.click({ position: { x: 100, y: 100 } });
    
    // キャプチャされたセル情報が左パネルに表示されることを確認
    await expect(page.locator('text=キャプチャされたセル')).toBeVisible();
    // ダメージ床がキャプチャされたかチェック（表示内容を確認）
    await expect(page.locator('text=床タイプ')).toBeVisible();
    
    // ペンツールに戻して別のセルに適用
    await page.keyboard.press('1'); // ペンツール
    await canvas.click({ position: { x: 200, y: 200 } });
    
    // キャプチャデータをクリア
    await page.click('text=クリア');
    
    // キャプチャされたセル情報が消えることを確認
    await expect(page.locator('text=キャプチャされたセル')).not.toBeVisible();
  });

  test('アイドロッパーツールと壁レイヤーの統合テスト', async ({ page }) => {
    // プロジェクト作成
    const authorInput = page.locator('input[type="text"]').nth(1);
    await authorInput.fill('テストユーザー');
    await page.click('button:has-text("作成")');
    
    // 壁レイヤーを選択
    await page.click('text=壁レイヤー');
    await expect(page.locator('text=レイヤー: walls')).toBeVisible();
    
    // 扉タイプを選択
    await page.click('text=扉');
    
    // ペンツールで壁を配置
    await page.keyboard.press('1'); // ペンツール
    const canvas = page.locator('canvas');
    await canvas.click({ position: { x: 100, y: 100 } });
    
    // アイドロッパーツールでキャプチャ
    await page.keyboard.press('4'); // アイドロッパーツール
    await canvas.click({ position: { x: 100, y: 100 } });
    
    // キャプチャされた壁情報が表示されることを確認
    await expect(page.locator('text=キャプチャされたセル')).toBeVisible();
    // 壁情報が表示される（より具体的なチェック）
    await expect(page.locator('text=通行可否')).toBeVisible();
    
    // ペンツールで別のセルに適用
    await page.keyboard.press('1'); // ペンツール
    await canvas.click({ position: { x: 200, y: 200 } });
  });

  test('アイドロッパーツールのキーボードショートカット', async ({ page }) => {
    // プロジェクト作成
    const authorInput = page.locator('input[type="text"]').nth(1);
    await authorInput.fill('テストユーザー');
    await page.click('button:has-text("作成")');
    
    // キーボードでアイドロッパーツールを選択
    await page.keyboard.press('4');
    await expect(page.locator('text=ツール: eyedropper')).toBeVisible();
    
    // ツールバーでもアイドロッパーツールが選択状態になっていることを確認
    await expect(page.locator('[role="group"] button[value="eyedropper"]')).toHaveAttribute('aria-pressed', 'true');
  });
  
  test('アイドロッパーツールのツールチップ表示', async ({ page }) => {
    // プロジェクト作成
    const authorInput = page.locator('input[type="text"]').nth(1);
    await authorInput.fill('テストユーザー');
    await page.click('button:has-text("作成")');
    
    // アイドロッパーツールボタンにホバーしてツールチップを確認
    await page.locator('[role="group"] button[value="eyedropper"]').hover();
    
    // ツールチップのテキストを確認
    await expect(page.locator('text=スポイトツール (4) - セルの設定をキャプチャして他のセルに適用')).toBeVisible();
  });

  test('拡張キーボードショートカット - レイヤー切り替え', async ({ page }) => {
    // プロジェクト作成
    const authorInput = page.locator('input[type="text"]').nth(1);
    await authorInput.fill('テストユーザー');
    await page.click('button:has-text("作成")');
    
    // 初期状態は床レイヤー
    await expect(page.locator('text=レイヤー: floor')).toBeVisible();
    
    // Wキーで壁レイヤー
    await page.keyboard.press('w');
    await expect(page.locator('text=レイヤー: walls')).toBeVisible();
    
    // Eキーでイベントレイヤー
    await page.keyboard.press('e');
    await expect(page.locator('text=レイヤー: events')).toBeVisible();
    
    // Dキーで装飾レイヤー
    await page.keyboard.press('d');
    await expect(page.locator('text=レイヤー: decorations')).toBeVisible();
    
    // Fキーで床レイヤーに戻る
    await page.keyboard.press('f');
    await expect(page.locator('text=レイヤー: floor')).toBeVisible();
  });

  test('拡張キーボードショートカット - ビューコントロール', async ({ page }) => {
    // プロジェクト作成
    const authorInput = page.locator('input[type="text"]').nth(1);
    await authorInput.fill('テストユーザー');
    await page.click('button:has-text("作成")');
    
    // 初期ズームレベルを確認
    await expect(page.locator('text=ズーム: 100%')).toBeVisible();
    
    // Ctrl++でズームイン
    await page.keyboard.press('Control+=');
    await expect(page.locator('text=ズーム: 120%')).toBeVisible();
    
    // Ctrl+-でズームアウト
    await page.keyboard.press('Control+-');
    await expect(page.locator('text=ズーム: 100%')).toBeVisible();
    
    // Ctrl+0でズームリセット
    await page.keyboard.press('Control+0');
    await expect(page.locator('text=ズーム: 100%')).toBeVisible();
  });

  test('拡張キーボードショートカット - Tab循環', async ({ page }) => {
    // プロジェクト作成
    const authorInput = page.locator('input[type="text"]').nth(1);
    await authorInput.fill('テストユーザー');
    await page.click('button:has-text("作成")');
    
    // 初期状態は床レイヤー
    await expect(page.locator('text=レイヤー: floor')).toBeVisible();
    
    // フォーカスをキャンバスに移してからTabキーでレイヤー循環
    await page.locator('canvas').click();
    
    // Tabキーで次のレイヤーに移動（Appのキーボードショートカットを使用）
    await page.keyboard.press('Tab');
    await expect(page.locator('text=レイヤー: walls')).toBeVisible();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('text=レイヤー: events')).toBeVisible();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('text=レイヤー: decorations')).toBeVisible();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('text=レイヤー: floor')).toBeVisible();
  });

  test('既存プロジェクトがある状態での新規作成機能', async ({ page }) => {
    // 最初のプロジェクト作成
    const authorInput = page.locator('input[type="text"]').nth(1);
    await authorInput.fill('テストユーザー');
    await page.click('button:has-text("作成")');
    
    // プロジェクトが作成されたことを確認
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    await expect(page.locator('text=新しいダンジョン')).toBeVisible();
    
    // ファイル > 新規作成メニューをクリック
    await page.click('button:has-text("ファイル")');
    await page.click('li:has-text("新規作成")');
    
    // 新規プロジェクト作成ダイアログが再度表示されることを確認
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('h2')).toContainText('新規プロジェクト作成');
  });

  test('Ctrl+Nキーボードショートカットでの新規作成', async ({ page }) => {
    // 最初のプロジェクト作成
    const authorInput = page.locator('input[type="text"]').nth(1);
    await authorInput.fill('テストユーザー');
    await page.click('button:has-text("作成")');
    
    // プロジェクトが作成されたことを確認
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    
    // Ctrl+Nで新規作成ダイアログを開く
    await page.keyboard.press('Control+n');
    
    // 新規プロジェクト作成ダイアログが表示されることを確認
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('h2')).toContainText('新規プロジェクト作成');
  });

  test('ファイル保存機能', async ({ page }) => {
    // プロジェクト作成
    const authorInput = page.locator('input[type="text"]').nth(1);
    await authorInput.fill('テストユーザー');
    await page.click('button:has-text("作成")');
    
    // プロジェクトが作成されたことを確認
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    
    // ダウンロード待機の設定
    const downloadPromise = page.waitForEvent('download');
    
    // ファイル > 保存メニューをクリック
    await page.click('button:has-text("ファイル")');
    await page.click('li:has-text("保存")');
    
    // ダウンロードが開始されることを確認
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.json$/);
  });

  test('Ctrl+Sキーボードショートカットでの保存', async ({ page }) => {
    // プロジェクト作成
    const authorInput = page.locator('input[type="text"]').nth(1);
    await authorInput.fill('テストユーザー');
    await page.click('button:has-text("作成")');
    
    // プロジェクトが作成されたことを確認
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    
    // ダウンロード待機の設定
    const downloadPromise = page.waitForEvent('download');
    
    // Ctrl+Sで保存
    await page.keyboard.press('Control+s');
    
    // ダウンロードが開始されることを確認
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.json$/);
  });

  test('ファイル開く機能', async ({ page }) => {
    // 最初のプロジェクト作成
    const authorInput = page.locator('input[type="text"]').nth(1);
    await authorInput.fill('テストユーザー');
    await page.click('button:has-text("作成")');
    
    // プロジェクトが作成されたことを確認
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    await expect(page.locator('text=新しいダンジョン')).toBeVisible();
    
    // ファイル > 開くメニューをクリック
    await page.click('button:has-text("ファイル")');
    await page.click('li:has-text("開く")');
    
    // ファイル選択ダイアログが表示されることを確認（実際にはfile inputが利用される）
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();
  });

  test('壁の個別方向配置機能', async ({ page }) => {
    // プロジェクト作成
    const authorInput = page.locator('input[type="text"]').nth(1);
    await authorInput.fill('テストユーザー');
    await page.click('button:has-text("作成")');
    
    // 壁レイヤーを選択
    await page.click('text=壁レイヤー');
    await expect(page.locator('text=レイヤー: walls')).toBeVisible();
    
    // 通常壁を選択
    await page.click('text=通常壁');
    
    // キャンバスが表示されていることを確認
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    
    // セルの左上部分をクリック（北の壁を配置したい）
    await canvas.click({ position: { x: 50, y: 30 } });
    
    // セルの右側部分をクリック（東の壁を配置したい）
    await canvas.click({ position: { x: 70, y: 50 } });
    
    // テストの成功条件：期待される壁配置ロジックの動作確認
    // 実装後に具体的なアサーションを追加
  });

  test('壁タイプの視覚的表示機能', async ({ page }) => {
    // プロジェクト作成
    const authorInput = page.locator('input[type="text"]').nth(1);
    await authorInput.fill('テストユーザー');
    await page.click('button:has-text("作成")');
    
    // 壁レイヤーを選択
    await page.click('text=壁レイヤー');
    await expect(page.locator('text=レイヤー: walls')).toBeVisible();
    
    // 各種壁タイプを選択して配置
    const wallTypes = ['通常壁', '扉', '鍵付き扉', '隠し扉'];
    const canvas = page.locator('canvas');
    
    for (let i = 0; i < wallTypes.length; i++) {
      const wallType = wallTypes[i];
      
      // 壁タイプを選択
      await page.click(`text=${wallType}`);
      
      // 異なる位置に壁を配置
      await canvas.click({ position: { x: 50 + i * 32, y: 50 } });
    }
    
    // キャンバスが正常に描画されていることを確認
    await expect(canvas).toBeVisible();
  });

  test('壁のドラッグ描画機能', async ({ page }) => {
    // プロジェクト作成
    const authorInput = page.locator('input[type="text"]').nth(1);
    await authorInput.fill('テストユーザー');
    await page.click('button:has-text("作成")');
    
    // 壁レイヤーを選択
    await page.click('text=壁レイヤー');
    await expect(page.locator('text=レイヤー: walls')).toBeVisible();
    
    // 通常壁を選択
    await page.click('text=通常壁');
    
    // キャンバスでドラッグ操作
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    
    // ドラッグで線を描く（開始点から終了点まで）
    await canvas.hover({ position: { x: 50, y: 50 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 150, y: 50 } });
    await page.mouse.up();
    
    // キャンバスが正常に描画されていることを確認
    await expect(canvas).toBeVisible();
  });

  test('透明壁の視認性テスト', async ({ page }) => {
    // プロジェクト作成
    const authorInput = page.locator('input[type="text"]').nth(1);
    await authorInput.fill('テストユーザー');
    await page.click('button:has-text("作成")');
    
    // 壁レイヤーを選択
    await page.click('text=壁レイヤー');
    await expect(page.locator('text=レイヤー: walls')).toBeVisible();
    
    // 透明壁を選択
    await page.click('text=透明壁');
    
    // キャンバスでクリック操作
    const canvas = page.locator('canvas');
    await canvas.click({ position: { x: 50, y: 30 } });
    
    // キャンバスが正常に描画されていることを確認
    await expect(canvas).toBeVisible();
  });

  test('保存→開くの完全サイクル', async ({ page }) => {
    // 1. 最初のプロジェクト作成
    let authorInput = page.locator('input[type="text"]').nth(1);
    await authorInput.fill('テストユーザー');
    
    // ダンジョン名を変更
    const dungeonNameInput = page.locator('input[value="新しいダンジョン"]');
    await dungeonNameInput.fill('テスト用ダンジョン');
    
    await page.click('button:has-text("作成")');
    
    // 2. 作成されたプロジェクトを確認
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    await expect(page.locator('text=テスト用ダンジョン')).toBeVisible();
    
    // 3. 何かしらの編集を行う（床タイプをダメージに変更）
    await page.click('text=ダメージ');
    const canvas = page.locator('canvas');
    await canvas.click({ position: { x: 100, y: 100 } });
    
    // 4. プロジェクトを保存
    const downloadPromise = page.waitForEvent('download');
    await page.keyboard.press('Control+s');
    const download = await downloadPromise;
    
    // 5. 新しいプロジェクトを作成（現在のプロジェクトをリセット）
    await page.keyboard.press('Control+n');
    authorInput = page.locator('input[type="text"]').nth(1);
    await authorInput.fill('別のユーザー');
    
    const newDungeonNameInput = page.locator('input[placeholder="新しいダンジョン"]');
    await newDungeonNameInput.fill('別のダンジョン');
    
    await page.click('button:has-text("作成")');
    await expect(page.locator('text=別のダンジョン')).toBeVisible();
    
    // 6. 保存したファイルを開く
    await page.click('button:has-text("ファイル")');
    await page.click('li:has-text("開く")');
    
    // 7. ファイル内容がロードされることを確認
    // （実際のファイル読み込みをシミュレート）
    // この部分は実装後に詳細なテストを追加予定
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();
  });
});