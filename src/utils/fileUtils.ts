import { Dungeon } from '../types/map'

/**
 * ダンジョンをJSONファイルとしてダウンロードする
 */
export const downloadDungeonAsJSON = (dungeon: Dungeon): void => {
  const dataStr = JSON.stringify(dungeon, null, 2)
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
export const openDungeonFromFile = (onLoad: (dungeon: Dungeon) => void, onError?: (error: Error) => void): void => {
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
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const dungeonData = JSON.parse(e.target?.result as string) as Dungeon
          onLoad(dungeonData)
        } catch (error) {
          if (onError) {
            onError(error as Error)
          } else {
            console.error('ファイルの読み込みに失敗しました:', error)
          }
        }
      }
      reader.readAsText(file)
    }
  })
  
  fileInput.click()
}