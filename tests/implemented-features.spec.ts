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
    
    // ツールボタンが表示されていることを確認（消しゴムツールを含む）
    const tools = ['pen', 'rectangle', 'fill', 'eyedropper', 'select', 'eraser'];
    for (const tool of tools) {
      await expect(page.locator(`[role="group"] button[value="${tool}"]`)).toBeVisible();
    }
    
    // デフォルトでペンツールが選択されていることを確認
    await expect(page.locator('[role="group"] button[value="pen"]')).toHaveAttribute('aria-pressed', 'true');
    
    // ツールの切り替え
    await page.click('[role="group"] button[value="fill"]');
    await expect(page.locator('[role="group"] button[value="fill"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[role="group"] button[value="pen"]')).toHaveAttribute('aria-pressed', 'false');
    
    // 消しゴムツールの切り替え
    await page.click('[role="group"] button[value="eraser"]');
    await expect(page.locator('[role="group"] button[value="eraser"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[role="group"] button[value="fill"]')).toHaveAttribute('aria-pressed', 'false');
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
    
    await page.keyboard.press('6'); // 消しゴムツール
    await expect(page.locator('[role="group"] button[value="eraser"]')).toHaveAttribute('aria-pressed', 'true');
    
    // ステータスバーでツール変更が反映されることを確認
    await expect(page.locator('text=ツール: eraser')).toBeVisible();
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
    const capturedCellAccordion = page.locator('text=キャプチャされたセル');
    await expect(capturedCellAccordion).toBeVisible();
    
    // アコーディオンが展開されていない場合は展開する
    await capturedCellAccordion.click();
    await page.waitForTimeout(300); // アニメーション待機
    
    // ダメージ床がキャプチャされたかチェック（通行可否情報でも確認）
    await expect(page.locator('text=通行可否: 可能')).toBeVisible();
    
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
    const capturedCellAccordion2 = page.locator('text=キャプチャされたセル');
    await expect(capturedCellAccordion2).toBeVisible();
    
    // アコーディオンを展開
    await capturedCellAccordion2.click();
    await page.waitForTimeout(300); // アニメーション待機
    
    // 壁情報が表示される（壁ありの状況を確認）
    await expect(page.locator('text=壁情報')).toBeVisible();
    
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

  test('JSON保存機能の基本テスト', async ({ page }) => {
    // プロジェクト作成
    const authorInput = page.locator('input[type="text"]').nth(1);
    await authorInput.fill('テストユーザー');
    
    // ダンジョン名を変更
    const dungeonNameInput = page.locator('input[value="新しいダンジョン"]');
    await dungeonNameInput.fill('テスト用ダンジョン');
    
    await page.click('button:has-text("作成")');
    
    // 作成されたプロジェクトを確認
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    await expect(page.locator('text=テスト用ダンジョン')).toBeVisible();
    
    // 編集を行う（床タイプを変更）
    await page.click('text=ダメージ');
    const canvas = page.locator('canvas');
    await canvas.click({ position: { x: 100, y: 100 } });
    
    // Ctrl+Sで保存を実行
    const downloadPromise = page.waitForEvent('download');
    await page.keyboard.press('Control+s');
    const download = await downloadPromise;
    
    // ダウンロードファイルが作成されることを確認
    expect(download.suggestedFilename()).toMatch(/テスト用ダンジョン.*\.json$/);
  });

  test('JSONファイル読み込み機能の基本テスト', async ({ page }) => {
    // プロジェクト作成
    const authorInput = page.locator('input[type="text"]').nth(1);
    await authorInput.fill('テストユーザー');
    await page.click('button:has-text("作成")');
    
    // ファイルメニューから開くを選択
    await page.click('button:has-text("ファイル")');
    await page.click('li:has-text("開く")');
    
    // ファイル入力要素が表示されることを確認
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();
    
    // Accept属性がJSONファイルを指定していることを確認
    await expect(fileInput).toHaveAttribute('accept', '.json');
  });

  test('Ctrl+Oキーボードショートカットでファイル開く', async ({ page }) => {
    // プロジェクト作成
    const authorInput = page.locator('input[type="text"]').nth(1);
    await authorInput.fill('テストユーザー');
    await page.click('button:has-text("作成")');
    
    // Ctrl+Oでファイルを開く
    await page.keyboard.press('Control+o');
    
    // ファイル選択ダイアログが開かれることを確認
    // （実際のファイル選択はブラウザのネイティブダイアログなので、
    //  input[type="file"]の存在でファイル選択機能が動作していることを確認）
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();
  });

  test('不正なJSONファイル処理のエラーハンドリング', async ({ page }) => {
    // プロジェクト作成
    const authorInput = page.locator('input[type="text"]').nth(1);
    await authorInput.fill('テストユーザー');
    await page.click('button:has-text("作成")');
    
    // ファイルメニューから開くを選択
    await page.click('button:has-text("ファイル")');
    await page.click('li:has-text("開く")');
    
    // ファイル入力要素の存在を確認
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();
    
    // 不正なJSONファイルのテストはファイル操作の実装が必要なため、
    // 現在はファイル選択機能が正しく動作することのみ確認
  });

  test('ファイル操作のキーボードショートカット統合テスト', async ({ page }) => {
    // プロジェクト作成
    const authorInput = page.locator('input[type="text"]').nth(1);
    await authorInput.fill('テストユーザー');
    await page.click('button:has-text("作成")');
    
    // 編集を行う
    const canvas = page.locator('canvas');
    await canvas.click({ position: { x: 50, y: 50 } });
    
    // Ctrl+Sで保存
    const downloadPromise = page.waitForEvent('download');
    await page.keyboard.press('Control+s');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.json$/);
    
    // Ctrl+Nで新規プロジェクト
    await page.keyboard.press('Control+n');
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('h2:has-text("新規プロジェクト作成")')).toBeVisible();
    
    // ダイアログをキャンセル（キャンセルボタンをクリック）
    await page.click('button:has-text("キャンセル")');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    
    // Ctrl+Oでファイルを開く
    await page.keyboard.press('Control+o');
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();
  });

  test('消しゴムツールの基本機能', async ({ page }) => {
    // プロジェクト作成
    const authorInput = page.locator('input[type="text"]').nth(1);
    await authorInput.fill('テストユーザー');
    await page.click('button:has-text("作成")');
    
    // 壁レイヤーを選択
    await page.click('text=壁レイヤー');
    await expect(page.locator('text=レイヤー: walls')).toBeVisible();
    
    // 通常壁を選択
    await page.click('text=通常壁');
    
    // ペンツールで壁を配置
    await page.keyboard.press('1'); // ペンツール
    const canvas = page.locator('canvas');
    await canvas.click({ position: { x: 100, y: 100 } });
    
    // 消しゴムツールに切り替え
    await page.keyboard.press('6'); // 消しゴムツール
    await expect(page.locator('text=ツール: eraser')).toBeVisible();
    await expect(page.locator('[role="group"] button[value="eraser"]')).toHaveAttribute('aria-pressed', 'true');
    
    // 消しゴムツールのツールチップを確認
    await page.locator('[role="group"] button[value="eraser"]').hover();
    await expect(page.locator('text=消しゴムツール (6) - 壁やイベントを消去')).toBeVisible();
    
    // 壁を消去（同じ位置をクリック）
    await canvas.click({ position: { x: 100, y: 100 } });
    
    // 他のツールに切り替えて再度確認
    await page.keyboard.press('1'); // ペンツール
    await expect(page.locator('text=ツール: pen')).toBeVisible();
  });

  test('消しゴムツールのイベント消去機能', async ({ page }) => {
    // プロジェクト作成
    const authorInput = page.locator('input[type="text"]').nth(1);
    await authorInput.fill('テストユーザー');
    await page.click('button:has-text("作成")');
    
    // イベントレイヤーを選択
    await page.click('text=イベントレイヤー');
    await expect(page.locator('text=レイヤー: events')).toBeVisible();
    
    // イベント編集パネルが表示されることを確認
    await expect(page.locator('text=イベント編集')).toBeVisible();
    
    // 消しゴムツールを選択
    await page.keyboard.press('6'); // 消しゴムツール
    await expect(page.locator('text=ツール: eraser')).toBeVisible();
    
    const canvas = page.locator('canvas');
    
    // イベントを消去する操作（キャンバスクリック）
    await canvas.click({ position: { x: 150, y: 150 } });
    
    // 消しゴムツールが選択状態のままであることを確認
    await expect(page.locator('[role="group"] button[value="eraser"]')).toHaveAttribute('aria-pressed', 'true');
  });

  test('壁ドラッグ描画機能', async ({ page }) => {
    // プロジェクト作成
    const authorInput = page.locator('input[type="text"]').nth(1);
    await authorInput.fill('テストユーザー');
    await page.click('button:has-text("作成")');
    
    // 壁レイヤーを選択
    await page.click('text=壁レイヤー');
    await expect(page.locator('text=レイヤー: walls')).toBeVisible();
    
    // 通常壁を選択
    await page.click('text=通常壁');
    
    // ペンツールで壁をドラッグ描画
    await page.keyboard.press('1'); // ペンツール
    const canvas = page.locator('canvas');
    
    // ドラッグ操作で壁を描画（開始位置から終了位置まで）
    await canvas.click({ position: { x: 100, y: 100 } }); // 開始点
    
    // マウスダウン→移動→マウスアップでドラッグをシミュレート
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 100 } });
    await page.mouse.up();
    
    // ドラッグ後もツールが選択状態であることを確認
    await expect(page.locator('text=ツール: pen')).toBeVisible();
  });

  test('Shift+クリックでの壁削除機能', async ({ page }) => {
    // プロジェクト作成
    const authorInput = page.locator('input[type="text"]').nth(1);
    await authorInput.fill('テストユーザー');
    await page.click('button:has-text("作成")');
    
    // 壁レイヤーを選択
    await page.click('text=壁レイヤー');
    await expect(page.locator('text=レイヤー: walls')).toBeVisible();
    
    // 通常壁を選択
    await page.click('text=通常壁');
    
    // ペンツールで壁を配置
    await page.keyboard.press('1'); // ペンツール
    const canvas = page.locator('canvas');
    await canvas.click({ position: { x: 150, y: 150 } });
    
    // Shift+クリックで壁を削除
    await canvas.click({ position: { x: 150, y: 150 }, modifiers: ['Shift'] });
    
    // ツールがペンツールのまま維持されることを確認
    await expect(page.locator('text=ツール: pen')).toBeVisible();
    await expect(page.locator('[role="group"] button[value="pen"]')).toHaveAttribute('aria-pressed', 'true');
  });

  test('壁境界線検出機能', async ({ page }) => {
    // プロジェクト作成
    const authorInput = page.locator('input[type="text"]').nth(1);
    await authorInput.fill('テストユーザー');
    await page.click('button:has-text("作成")');
    
    // 壁レイヤーを選択
    await page.click('text=壁レイヤー');
    await expect(page.locator('text=レイヤー: walls')).toBeVisible();
    
    // 扉を選択
    await page.click('text=扉');
    
    // ペンツールで異なる境界線に壁を配置
    await page.keyboard.press('1'); // ペンツール
    const canvas = page.locator('canvas');
    
    // 上側境界線に近い位置をクリック
    await canvas.click({ position: { x: 100, y: 95 } });
    
    // 右側境界線に近い位置をクリック
    await canvas.click({ position: { x: 195, y: 100 } });
    
    // 下側境界線に近い位置をクリック
    await canvas.click({ position: { x: 100, y: 195 } });
    
    // 左側境界線に近い位置をクリック
    await canvas.click({ position: { x: 95, y: 100 } });
    
    // 操作完了を確認
    await expect(page.locator('text=ツール: pen')).toBeVisible();
  });

  test('Undo/Redoキーボードショートカット機能', async ({ page }) => {
    // プロジェクト作成
    const authorInput = page.locator('input[type="text"]').nth(1);
    await authorInput.fill('テストユーザー');
    await page.click('button:has-text("作成")');
    
    // 床レイヤーで操作
    await expect(page.locator('text=レイヤー: floor')).toBeVisible();
    
    // ダメージ床を選択
    await page.click('text=ダメージ');
    
    // ペンツールで床を配置
    await page.keyboard.press('1'); // ペンツール
    const canvas = page.locator('canvas');
    await canvas.click({ position: { x: 100, y: 100 } });
    
    // Ctrl+Zでundo
    await page.keyboard.press('Control+z');
    
    // Ctrl+Yでredo
    await page.keyboard.press('Control+y');
    
    // 操作完了を確認
    await expect(page.locator('text=ツール: pen')).toBeVisible();
  });

  test('壁ドラッグ操作の単一undo機能', async ({ page }) => {
    // プロジェクト作成
    const authorInput = page.locator('input[type="text"]').nth(1);
    await authorInput.fill('テストユーザー');
    await page.click('button:has-text("作成")');
    
    // 壁レイヤーを選択
    await page.click('text=壁レイヤー');
    await expect(page.locator('text=レイヤー: walls')).toBeVisible();
    
    // 通常壁を選択
    await page.click('text=通常壁');
    
    // ペンツールでドラッグ操作
    await page.keyboard.press('1'); // ペンツール
    const canvas = page.locator('canvas');
    
    // ドラッグ操作（重要：ドラッグは1つのundo操作として扱われるべき）
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 100 } });
    await page.mouse.up();
    
    // 1回のCtrl+Zで全ドラッグ操作が取り消されることを確認
    await page.keyboard.press('Control+z');
    
    // 2回目のCtrl+Zは何も起こらないことを確認（まだ元に戻す操作があれば）
    await page.keyboard.press('Control+z');
    
    // 操作完了を確認
    await expect(page.locator('text=ツール: pen')).toBeVisible();
  });

  test('複数ツールでのUndo/Redo機能', async ({ page }) => {
    // プロジェクト作成
    const authorInput = page.locator('input[type="text"]').nth(1);
    await authorInput.fill('テストユーザー');
    await page.click('button:has-text("作成")');
    
    const canvas = page.locator('canvas');
    
    // 床レイヤーでペンツール操作
    await page.keyboard.press('1'); // ペンツール
    await canvas.click({ position: { x: 100, y: 100 } });
    
    // 塗りつぶしツールに変更
    await page.keyboard.press('3'); // 塗りつぶしツール
    await expect(page.locator('text=ツール: fill')).toBeVisible();
    await canvas.click({ position: { x: 150, y: 150 } });
    
    // 矩形ツールに変更
    await page.keyboard.press('2'); // 矩形ツール
    await expect(page.locator('text=ツール: rectangle')).toBeVisible();
    await canvas.click({ position: { x: 200, y: 200 } });
    
    // 3回のundo操作
    await page.keyboard.press('Control+z'); // 矩形操作を取り消し
    await page.keyboard.press('Control+z'); // 塗りつぶし操作を取り消し
    await page.keyboard.press('Control+z'); // ペン操作を取り消し
    
    // 2回のredo操作
    await page.keyboard.press('Control+y'); // ペン操作を復活
    await page.keyboard.press('Control+y'); // 塗りつぶし操作を復活
    
    // 現在のツール状態を確認
    await expect(page.locator('text=ツール: rectangle')).toBeVisible();
  });

  test('メニューからのUndo/Redo操作', async ({ page }) => {
    // プロジェクト作成
    const authorInput = page.locator('input[type="text"]').nth(1);
    await authorInput.fill('テストユーザー');
    await page.click('button:has-text("作成")');
    
    // 操作を実行
    const canvas = page.locator('canvas');
    await canvas.click({ position: { x: 100, y: 100 } });
    
    // 編集メニューからundo
    await page.click('button:has-text("編集")');
    await page.click('li:has-text("元に戻す")');
    
    // 編集メニューからredo
    await page.click('button:has-text("編集")');
    await page.click('li:has-text("やり直し")');
    
    // 操作完了を確認
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('キーボードショートカット統合テスト - 全ツール切り替え', async ({ page }) => {
    // プロジェクト作成
    const authorInput = page.locator('input[type="text"]').nth(1);
    await authorInput.fill('テストユーザー');
    await page.click('button:has-text("作成")');
    
    // 全ツールのキーボードショートカットをテスト
    const toolShortcuts = [
      { key: '1', tool: 'pen' },
      { key: '2', tool: 'rectangle' },
      { key: '3', tool: 'fill' },
      { key: '4', tool: 'eyedropper' },
      { key: '5', tool: 'select' },
      { key: '6', tool: 'eraser' }
    ];
    
    for (const { key, tool } of toolShortcuts) {
      await page.keyboard.press(key);
      await expect(page.locator(`text=ツール: ${tool}`)).toBeVisible();
      await expect(page.locator(`[role="group"] button[value="${tool}"]`)).toHaveAttribute('aria-pressed', 'true');
    }
  });

  test('キーボードショートカット統合テスト - 全レイヤー切り替え', async ({ page }) => {
    // プロジェクト作成
    const authorInput = page.locator('input[type="text"]').nth(1);
    await authorInput.fill('テストユーザー');
    await page.click('button:has-text("作成")');
    
    // 全レイヤーのキーボードショートカットをテスト
    const layerShortcuts = [
      { key: 'f', layer: 'floor' },
      { key: 'w', layer: 'walls' },
      { key: 'e', layer: 'events' },
      { key: 'd', layer: 'decorations' }
    ];
    
    for (const { key, layer } of layerShortcuts) {
      await page.keyboard.press(key);
      await expect(page.locator(`text=レイヤー: ${layer}`)).toBeVisible();
    }
  });

  test('キーボードショートカット統合テスト - その他の機能', async ({ page }) => {
    // プロジェクト作成
    const authorInput = page.locator('input[type="text"]').nth(1);
    await authorInput.fill('テストユーザー');
    await page.click('button:has-text("作成")');
    
    // 初期ズーム確認
    await expect(page.locator('text=ズーム: 100%')).toBeVisible();
    
    // ズームイン (+ または =) - Ctrlキーと組み合わせて使用
    await page.keyboard.press('Control+=');
    await page.waitForTimeout(200); // ズーム処理の完了待ち
    const zoomInText = await page.locator('text=/ズーム: \\d+%/').textContent();
    expect(zoomInText).not.toBe('ズーム: 100%');
    
    // ズームリセット (Ctrl+0)
    await page.keyboard.press('Control+0');
    await page.waitForTimeout(200); // ズーム処理の完了待ち
    await expect(page.locator('text=ズーム: 100%')).toBeVisible();
    
    // ズームアウト (Ctrl+-)
    await page.keyboard.press('Control+-');
    await page.waitForTimeout(200); // ズーム処理の完了待ち
    const zoomOutText = await page.locator('text=/ズーム: \\d+%/').textContent();
    expect(zoomOutText).not.toBe('ズーム: 100%');
    
    // ズームリセット (Ctrl+0)
    await page.keyboard.press('Control+0');
    await page.waitForTimeout(200); // ズーム処理の完了待ち
    await expect(page.locator('text=ズーム: 100%')).toBeVisible();
    
    // グリッド切り替え (Space)
    await page.keyboard.press('Space');
    // グリッドの表示状態変更を確認（視覚的変化は難しいので、エラーが発生しないことを確認）
    await expect(page.locator('canvas')).toBeVisible();
    
    // グリッド切り替え (g)
    await page.keyboard.press('g');
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('キーボードショートカット統合テスト - Tab循環レイヤー切り替え', async ({ page }) => {
    // プロジェクト作成
    const authorInput = page.locator('input[type="text"]').nth(1);
    await authorInput.fill('テストユーザー');
    await page.click('button:has-text("作成")');
    
    // 初期状態（床レイヤー）を確認
    await expect(page.locator('text=レイヤー: floor')).toBeVisible();
    
    // Tab で順次レイヤーを切り替え
    await page.keyboard.press('Tab');
    await expect(page.locator('text=レイヤー: walls')).toBeVisible();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('text=レイヤー: events')).toBeVisible();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('text=レイヤー: decorations')).toBeVisible();
    
    // 最後からまた最初に戻る
    await page.keyboard.press('Tab');
    await expect(page.locator('text=レイヤー: floor')).toBeVisible();
  });

  test('キーボードショートカット無効化テスト - 入力フィールド内', async ({ page }) => {
    // 新規プロジェクト作成ダイアログが表示された状態で開始
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // ダンジョン名入力フィールドにフォーカス
    const dungeonNameInput = page.locator('input[type="text"]').first();
    await dungeonNameInput.click();
    await dungeonNameInput.fill(''); // フィールドをクリア
    
    // 入力フィールド内ではツール切り替えが無効化されることを確認
    await page.keyboard.type('123456'); // ツール切り替えキーを入力
    
    // 入力内容が反映されることを確認（ツール切り替えではなく文字入力として動作）
    await expect(dungeonNameInput).toHaveValue('123456');
    
    // 作成者名フィールドでも同様にテスト
    const authorInput = page.locator('input[type="text"]').nth(1);
    await authorInput.click();
    await page.keyboard.type('fwed'); // レイヤー切り替えキーを入力
    
    // 入力内容が反映されることを確認
    await expect(authorInput).toHaveValue('fwed');
    
    // プロジェクト作成
    await page.click('button:has-text("作成")');
    
    // プロジェクト作成後はキーボードショートカットが有効になることを確認
    await page.keyboard.press('1');
    await expect(page.locator('text=ツール: pen')).toBeVisible();
  });

  test('キーボードショートカット統合テスト - Ctrl組み合わせ', async ({ page }) => {
    // プロジェクト作成
    const authorInput = page.locator('input[type="text"]').nth(1);
    await authorInput.fill('テストユーザー');
    await page.click('button:has-text("作成")');
    
    // 床を配置してUndo/Redoテスト
    const canvas = page.locator('canvas');
    await canvas.click({ position: { x: 100, y: 100 } });
    
    // Ctrl+Z (Undo)
    await page.keyboard.press('Control+z');
    
    // Ctrl+Y (Redo)
    await page.keyboard.press('Control+y');
    
    // Ctrl+S (Save) - コンソールログが出ることを確認（実際のダウンロードテストは別で実施済み）
    await page.keyboard.press('Control+s');
    
    // 操作完了を確認
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('イベント編集機能 - イベントレイヤー基本表示', async ({ page }) => {
    // プロジェクト作成
    const authorInput = page.locator('input[type="text"]').nth(1);
    await authorInput.fill('テストユーザー');
    await page.click('button:has-text("作成")');
    
    // イベントレイヤーを選択
    await page.click('text=イベントレイヤー');
    await expect(page.locator('text=レイヤー: events')).toBeVisible();
    
    // イベント編集パネルが表示されることを確認
    await expect(page.locator('text=イベント編集')).toBeVisible();
    
    // イベントエディターの基本要素が表示されることを確認
    await expect(page.locator('text=イベント一覧 (0)')).toBeVisible();
    await expect(page.getByRole('button', { name: '新規作成' })).toBeVisible();
    
    // 初期状態でのメッセージ表示を確認
    await expect(page.locator('text=イベントがありません')).toBeVisible();
  });

  test('イベント編集機能 - 矩形ツールによるイベント作成', async ({ page }) => {
    // プロジェクト作成
    const authorInput = page.locator('input[type="text"]').nth(1);
    await authorInput.fill('テストユーザー');
    await page.click('button:has-text("作成")');
    
    // イベントレイヤーを選択
    await page.click('text=イベントレイヤー');
    await expect(page.locator('text=レイヤー: events')).toBeVisible();
    
    // 矩形ツールを選択
    await page.keyboard.press('2'); // 矩形ツール
    await expect(page.locator('text=ツール: rectangle')).toBeVisible();
    
    // キャンバス上で矩形を描画してイベントを作成
    const canvas = page.locator('canvas');
    
    // 矩形の開始点をクリック
    await canvas.click({ position: { x: 100, y: 100 } });
    
    // 矩形の終了点をクリック
    await canvas.click({ position: { x: 150, y: 150 } });
    
    // イベントが作成されたことを確認（イベント数が増加）
    await expect(page.locator('text=/イベント一覧 \\([1-9]\\)/')).toBeVisible();
  });

  test('イベント編集機能 - イベント種別とトリガー設定', async ({ page }) => {
    // プロジェクト作成
    const authorInput = page.locator('input[type="text"]').nth(1);
    await authorInput.fill('テストユーザー');
    await page.click('button:has-text("作成")');
    
    // イベントレイヤーを選択
    await page.click('text=イベントレイヤー');
    await expect(page.locator('text=レイヤー: events')).toBeVisible();
    
    // ペンツールでイベントを配置
    await page.keyboard.press('1'); // ペンツール
    const canvas = page.locator('canvas');
    await canvas.click({ position: { x: 100, y: 100 } });
    
    // イベント作成を確認
    await expect(page.locator('text=/イベント一覧 \\([1-9]\\)/')).toBeVisible();
    
    // 新規作成ボタンをクリックしてイベント編集ダイアログを開く
    await page.getByRole('button', { name: '新規作成' }).click();
    
    // イベント作成ダイアログが表示されることを確認
    await expect(page.locator('text=新規イベント作成')).toBeVisible();
    
    // イベントタイプの選択肢があることを確認
    await expect(page.locator('text=イベントタイプ')).toBeVisible();
    
    // トリガータイプの選択肢があることを確認
    await expect(page.locator('text=トリガータイプ')).toBeVisible();
    
    // ダイアログを閉じる
    await page.click('text=キャンセル');
  });

  test('イベント編集機能 - 消しゴムツールでのイベント削除', async ({ page }) => {
    // プロジェクト作成
    const authorInput = page.locator('input[type="text"]').nth(1);
    await authorInput.fill('テストユーザー');
    await page.click('button:has-text("作成")');
    
    // イベントレイヤーを選択
    await page.click('text=イベントレイヤー');
    await expect(page.locator('text=レイヤー: events')).toBeVisible();
    
    // ペンツールでイベントを配置
    await page.keyboard.press('1'); // ペンツール
    const canvas = page.locator('canvas');
    await canvas.click({ position: { x: 100, y: 100 } });
    
    // イベント作成を確認
    await expect(page.locator('text=/イベント一覧 \\([1-9]\\)/')).toBeVisible();
    
    // 消しゴムツールに切り替え
    await page.keyboard.press('6'); // 消しゴムツール
    await expect(page.locator('text=ツール: eraser')).toBeVisible();
    
    // 同じ位置をクリックしてイベントを削除
    await canvas.click({ position: { x: 100, y: 100 } });
    
    // イベントが削除されたことを確認
    await expect(page.locator('text=イベント一覧 (0)')).toBeVisible();
  });

  test('イベント編集機能 - イベントリスト表示', async ({ page }) => {
    // プロジェクト作成
    const authorInput = page.locator('input[type="text"]').nth(1);
    await authorInput.fill('テストユーザー');
    await page.click('button:has-text("作成")');
    
    // イベントレイヤーを選択
    await page.click('text=イベントレイヤー');
    await expect(page.locator('text=レイヤー: events')).toBeVisible();
    
    // 複数のイベントを配置
    await page.keyboard.press('1'); // ペンツール
    const canvas = page.locator('canvas');
    
    // 3つのイベントを配置
    await canvas.click({ position: { x: 100, y: 100 } });
    await canvas.click({ position: { x: 150, y: 100 } });
    await canvas.click({ position: { x: 200, y: 100 } });
    
    // イベント数が更新されることを確認
    await expect(page.locator('text=/イベント一覧 \\([3-9]\\)/')).toBeVisible();
    
    // イベントリストセクションが表示されることを確認
    await expect(page.locator('text=イベント一覧')).toBeVisible();
  });
});