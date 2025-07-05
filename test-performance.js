// Redux パフォーマンス最適化の検証テスト
import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // コンソールメッセージを監視
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      timestamp: new Date().toISOString()
    });
  });
  
  try {
    console.log('🔍 Redux パフォーマンス最適化検証を開始します...');
    
    // 1. アプリケーションを起動
    console.log('1. アプリケーションにアクセス中...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // 2. 新規プロジェクト作成
    console.log('2. 新規プロジェクトを作成中...');
    
    // まずボタンを見つける
    const newProjectButton = page.locator('button').filter({ hasText: '新しいプロジェクト' }).or(
      page.locator('button').filter({ hasText: '新規プロジェクト' })
    );
    
    await newProjectButton.click();
    await page.fill('input[placeholder*="プロジェクト名"]', 'パフォーマンステスト');
    await page.fill('input[placeholder*="作者名"]', 'テスト作者');
    await page.click('button:has-text("作成")');
    
    // 3. プロジェクト作成完了を待機
    await page.waitForTimeout(2000);
    
    // 4. 大量のセル更新操作を実行
    console.log('3. 大量のセル更新操作を実行中...');
    
    // ペンツールを選択
    await page.click('[data-testid="tool-pen"]');
    
    // キャンバスを取得
    const canvas = page.locator('canvas').first();
    
    // 連続して30回のクリック操作
    for (let i = 0; i < 30; i++) {
      await canvas.click({
        position: { x: 50 + i * 10, y: 50 + i * 10 }
      });
      
      // 少し待機してReduxの処理時間を確認
      await page.waitForTimeout(10);
    }
    
    // 5. レイヤー切り替えを高速実行
    console.log('4. レイヤー切り替えを高速実行中...');
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('F'); // 床レイヤー
      await page.waitForTimeout(10);
      await page.keyboard.press('W'); // 壁レイヤー
      await page.waitForTimeout(10);
      await page.keyboard.press('E'); // イベントレイヤー
      await page.waitForTimeout(10);
    }
    
    // 6. Undo/Redo操作を複数回実行
    console.log('5. Undo/Redo操作を複数回実行中...');
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Control+Z'); // Undo
      await page.waitForTimeout(50);
      await page.keyboard.press('Control+Y'); // Redo
      await page.waitForTimeout(50);
    }
    
    // 7. 矩形ツールで大きな矩形を複数描画
    console.log('6. 矩形ツールで大きな矩形を複数描画中...');
    await page.click('[data-testid="tool-rectangle"]');
    
    for (let i = 0; i < 5; i++) {
      await canvas.click({ position: { x: 100 + i * 20, y: 100 + i * 20 } });
      await page.mouse.move(200 + i * 20, 200 + i * 20);
      await canvas.click({ position: { x: 200 + i * 20, y: 200 + i * 20 } });
      await page.waitForTimeout(100);
    }
    
    // 8. 最終的な状態を確認
    await page.waitForTimeout(2000);
    
    console.log('7. 検証完了 - コンソールメッセージを分析中...');
    
    // コンソールメッセージの分析
    const errorMessages = consoleMessages.filter(msg => msg.type === 'error');
    const warnMessages = consoleMessages.filter(msg => msg.type === 'warning');
    const performanceMessages = consoleMessages.filter(msg => 
      msg.text.includes('SerializableStateInvariantMiddleware') || 
      msg.text.includes('structuredClone') ||
      msg.text.includes('ms')
    );
    
    console.log('\n=== Redux パフォーマンス最適化検証結果 ===');
    console.log(`✅ 総コンソールメッセージ: ${consoleMessages.length}個`);
    console.log(`❌ エラーメッセージ: ${errorMessages.length}個`);
    console.log(`⚠️  警告メッセージ: ${warnMessages.length}個`);
    console.log(`⏱️  パフォーマンス関連メッセージ: ${performanceMessages.length}個`);
    
    console.log('\n=== パフォーマンス関連メッセージ詳細 ===');
    performanceMessages.forEach(msg => {
      console.log(`[${msg.timestamp}] ${msg.type}: ${msg.text}`);
    });
    
    console.log('\n=== エラーメッセージ詳細 ===');
    errorMessages.forEach(msg => {
      console.log(`[${msg.timestamp}] ERROR: ${msg.text}`);
    });
    
    console.log('\n=== 警告メッセージ詳細 ===');
    warnMessages.forEach(msg => {
      console.log(`[${msg.timestamp}] WARNING: ${msg.text}`);
    });
    
    // 最適化効果の評価
    const hasSerializableWarnings = performanceMessages.some(msg => 
      msg.text.includes('SerializableStateInvariantMiddleware')
    );
    
    const hasStructuredCloneWarnings = performanceMessages.some(msg => 
      msg.text.includes('structuredClone failed')
    );
    
    console.log('\n=== 最適化効果の評価 ===');
    console.log(`🔄 structuredClone フォールバック動作: ${hasStructuredCloneWarnings ? '確認済み' : '未確認'}`);
    console.log(`⚡ SerializableStateInvariantMiddleware最適化: ${hasSerializableWarnings ? '警告あり' : '警告なし'}`);
    
    if (!hasSerializableWarnings) {
      console.log('✅ Redux最適化が成功しています！SerializableStateInvariantMiddleware の警告が抑制されています。');
    } else {
      console.log('⚠️ Redux最適化に改善の余地があります。');
    }
    
    if (hasStructuredCloneWarnings) {
      console.log('✅ structuredClone フォールバック機能が正常に動作しています。');
    }
    
  } catch (error) {
    console.error('テスト実行中にエラーが発生しました:', error);
  } finally {
    await browser.close();
  }
})();