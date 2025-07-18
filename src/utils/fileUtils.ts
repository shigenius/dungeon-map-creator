import { Dungeon, CustomFloorType, CustomWallType, CustomDecorationType } from '../types/map'

/**
 * ダンジョンをJSONファイルとしてダウンロードする
 */
export const downloadDungeonAsJSON = (dungeon: Dungeon, customFloorTypes?: CustomFloorType[], customWallTypes?: CustomWallType[], customDecorationTypes?: CustomDecorationType[]): void => {
  // カスタムタイプ情報を含むダンジョンデータを作成
  const dungeonWithCustomTypes: Dungeon = {
    ...dungeon,
    customFloorTypes: customFloorTypes || [],
    customWallTypes: customWallTypes || [],
    customDecorationTypes: customDecorationTypes || []
  }
  
  const dataStr = JSON.stringify(dungeonWithCustomTypes, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${dungeon.name}.json`
  link.click()
  URL.revokeObjectURL(url)
}

/**
 * ファイル選択ダイアログを開いてJSONファイルを読み込む
 */
export const openDungeonFromFile = (onLoad: (_dungeon: Dungeon, _customFloorTypes?: CustomFloorType[], _customWallTypes?: CustomWallType[], _customDecorationTypes?: CustomDecorationType[]) => void, onError?: (_error: Error) => void): void => {
  // 既存のfile inputを削除
  const existingInput = document.querySelector('input[type="file"]')
  if (existingInput) {
    existingInput.remove()
  }
  
  const fileInput = document.createElement('input')
  fileInput.type = 'file'
  fileInput.accept = '.json'
  fileInput.style.display = 'none'
  document.body.appendChild(fileInput)
  
  fileInput.addEventListener('change', (event) => {
    console.log('ファイル選択イベントが発生しました')
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]
    console.log('選択されたファイル:', file)
    if (file) {
      console.log('ファイル読み込み開始:', file.name)
      const reader = new FileReader()
      reader.onload = (e) => {
        console.log('ファイル読み込み完了')
        try {
          const content = e.target?.result as string
          console.log('ファイル内容:', content.substring(0, 200) + '...')
          const dungeonData = JSON.parse(content) as Dungeon
          console.log('JSONパース成功:', dungeonData)
          
          // カスタムタイプ情報を分離
          const customFloorTypes = dungeonData.customFloorTypes || []
          const customWallTypes = dungeonData.customWallTypes || []
          const customDecorationTypes = dungeonData.customDecorationTypes || []
          
          // ダンジョンデータからカスタムタイプ情報を削除（clean up）
          const { customFloorTypes: _, customWallTypes: __, customDecorationTypes: ___, ...cleanDungeonData } = dungeonData
          
          onLoad(cleanDungeonData as Dungeon, customFloorTypes, customWallTypes, customDecorationTypes)
        } catch (error) {
          console.error('JSONパースエラー:', error)
          if (onError) {
            onError(error as Error)
          } else {
            console.error('ファイルの読み込みに失敗しました:', error)
          }
        }
      }
      reader.onerror = (error) => {
        console.error('ファイル読み込みエラー:', error)
      }
      reader.readAsText(file)
    } else {
      console.log('ファイルが選択されていません')
    }
    
    // ファイル入力をクリーンアップ
    document.body.removeChild(fileInput)
  })
  
  fileInput.click()
}