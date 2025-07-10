import React, { Suspense, useRef, useEffect, useState } from 'react'
import { Box, Typography, CircularProgress, IconButton, Tooltip } from '@mui/material'
import {
  RotateLeft as RotateLeftIcon,
  RotateRight as RotateRightIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  CenterFocusStrong as CenterIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  ArrowBack as ArrowLeftIcon,
  ArrowForward as ArrowRightIcon,
} from '@mui/icons-material'
import { Canvas, extend, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { useSelector } from 'react-redux'
import { RootState } from '../store'
import * as THREE from 'three'

// OrbitControlsを拡張
extend({ OrbitControls })

// OrbitControlsコンポーネント
const Controls: React.FC<{ controlsRef: React.MutableRefObject<any> }> = ({ controlsRef }) => {
  const { camera, gl } = useThree()
  
  useFrame(() => {
    if (controlsRef.current) {
      controlsRef.current.update()
    }
  })

  return (
    // @ts-ignore
    <orbitControls
      ref={controlsRef}
      args={[camera, gl.domElement]}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      enableDamping={true}
      dampingFactor={0.1}
      rotateSpeed={0.5}
      zoomSpeed={1.0}
      panSpeed={0.8}
      maxPolarAngle={Math.PI / 2}
      minDistance={5}
      maxDistance={100}
    />
  )
}

// 3Dダンジョンセルコンポーネント
const DungeonCell: React.FC<{
  x: number
  y: number
  floorType: string
  passable: boolean
  walls: {
    north?: any
    east?: any
    south?: any
    west?: any
  }
  hasEvents: boolean
  hasDecorations: boolean
  customFloorTypes: any[]
  customWallTypes: any[]
}> = ({ x, y, floorType, passable, walls, hasEvents, hasDecorations, customFloorTypes, customWallTypes }) => {
  const meshRef = useRef<THREE.Group>(null)

  // 床の色を取得
  const getFloorColor = (type: string) => {
    // まずカスタム床タイプを確認
    const customType = customFloorTypes.find(t => t.id === type)
    if (customType) {
      return customType.color
    }
    
    // デフォルト床タイプの色
    switch (type) {
      case 'normal': return '#666666'
      case 'damage': return '#aa4444'
      case 'slippery': return '#4488aa'
      case 'pit': return '#222222'
      case 'warp': return '#aa44aa'
      default: return '#666666'
    }
  }

  // 壁の色を取得
  const getWallColor = (wallType?: string) => {
    if (!wallType) return '#ffffff'
    
    // まずカスタム壁タイプを確認
    const customType = customWallTypes.find(t => t.id === wallType)
    if (customType) {
      return customType.color
    }
    
    // デフォルト壁タイプの色
    switch (wallType) {
      case 'door': return '#8b4513'
      case 'locked_door': return '#ffd700'
      case 'hidden_door': return '#696969'
      case 'breakable': return '#ff8c42'
      default: return '#ffffff'
    }
  }

  return (
    <group ref={meshRef} position={[x, 0, y]}>
      {/* 床 */}
      {passable && (
        <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.9, 0.9]} />
          <meshStandardMaterial color={getFloorColor(floorType)} />
        </mesh>
      )}

      {/* 壁 */}
      {walls.north && (
        <mesh position={[0, 0.5, -0.45]}>
          <boxGeometry args={[0.9, 1, 0.1]} />
          <meshStandardMaterial color={getWallColor(walls.north.type)} />
        </mesh>
      )}
      {walls.east && (
        <mesh position={[0.45, 0.5, 0]}>
          <boxGeometry args={[0.1, 1, 0.9]} />
          <meshStandardMaterial color={getWallColor(walls.east.type)} />
        </mesh>
      )}
      {walls.south && (
        <mesh position={[0, 0.5, 0.45]}>
          <boxGeometry args={[0.9, 1, 0.1]} />
          <meshStandardMaterial color={getWallColor(walls.south.type)} />
        </mesh>
      )}
      {walls.west && (
        <mesh position={[-0.45, 0.5, 0]}>
          <boxGeometry args={[0.1, 1, 0.9]} />
          <meshStandardMaterial color={getWallColor(walls.west.type)} />
        </mesh>
      )}

      {/* イベント表示 */}
      {hasEvents && (
        <mesh position={[0.3, 0.2, 0.3]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.3} />
        </mesh>
      )}

      {/* 装飾表示 */}
      {hasDecorations && (
        <mesh position={[-0.3, 0.1, -0.3]}>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
          <meshStandardMaterial color="#aaaaaa" />
        </mesh>
      )}
    </group>
  )
}

// 3Dシーンコンポーネント
const DungeonScene: React.FC = () => {
  const { dungeon, currentFloor, customFloorTypes, customWallTypes } = useSelector((state: RootState) => ({
    dungeon: state.map.dungeon,
    currentFloor: state.editor.currentFloor,
    customFloorTypes: state.editor.customFloorTypes,
    customWallTypes: state.editor.customWallTypes,
  }))

  if (!dungeon) return null

  const floor = dungeon.floors[currentFloor]
  if (!floor) return null

  return (
    <group>
      {/* 照明 */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />
      <pointLight position={[-10, 10, -5]} intensity={0.4} />

      {/* ダンジョンセル */}
      {floor.cells.map((row, y) =>
        row.map((cell, x) => (
          <DungeonCell
            key={`${x}-${y}`}
            x={x}
            y={y}
            floorType={cell.floor.type}
            passable={cell.floor.passable}
            walls={cell.walls}
            hasEvents={cell.events.length > 0}
            hasDecorations={cell.decorations.length > 0}
            customFloorTypes={customFloorTypes}
            customWallTypes={customWallTypes}
          />
        ))
      )}

      {/* グリッド（参考用） */}
      <gridHelper 
        args={[Math.max(floor.width, floor.height), Math.max(floor.width, floor.height), '#444444', '#444444']} 
        position={[(floor.width - 1) / 2, 0, (floor.height - 1) / 2]}
      />
    </group>
  )
}

const MapEditor3D: React.FC = () => {
  const controlsRef = useRef<any>(null)

  const { dungeon, currentFloor } = useSelector((state: RootState) => ({
    dungeon: state.map.dungeon,
    currentFloor: state.editor.currentFloor,
  }))

  // マップサイズに基づいて適切なカメラ位置を計算
  const getCameraPosition = (): [number, number, number] => {
    if (!dungeon?.floors[currentFloor]) {
      return [20, 20, 20] // デフォルト位置
    }
    
    const floor = dungeon.floors[currentFloor]
    const centerX = (floor.width - 1) / 2
    const centerZ = (floor.height - 1) / 2
    const maxDimension = Math.max(floor.width, floor.height)
    
    // マップサイズに応じて適切な距離でカメラを配置
    const distance = maxDimension * 1.5
    const height = maxDimension * 0.8
    
    return [centerX + distance * 0.7, height, centerZ + distance * 0.7]
  }

  const cameraPosition = getCameraPosition()

  // 初期時にOrbitControlsのターゲットをマップ中心に設定
  useEffect(() => {
    if (controlsRef.current && dungeon?.floors[currentFloor]) {
      const floor = dungeon.floors[currentFloor]
      const centerX = (floor.width - 1) / 2
      const centerZ = (floor.height - 1) / 2
      controlsRef.current.target.set(centerX, 0, centerZ)
      controlsRef.current.update()
    }
  }, [dungeon, currentFloor])

  const handleZoomIn = () => {
    if (controlsRef.current) {
      const controls = controlsRef.current
      const camera = controls.object
      const distance = camera.position.distanceTo(controls.target)
      const newDistance = distance * 0.8 // ズームイン
      
      // カメラの位置を更新
      const direction = new THREE.Vector3()
      direction.subVectors(camera.position, controls.target).normalize()
      camera.position.copy(controls.target).add(direction.multiplyScalar(newDistance))
      controls.update()
    }
  }

  const handleZoomOut = () => {
    if (controlsRef.current) {
      const controls = controlsRef.current
      const camera = controls.object
      const distance = camera.position.distanceTo(controls.target)
      const newDistance = distance * 1.25 // ズームアウト
      
      // カメラの位置を更新
      const direction = new THREE.Vector3()
      direction.subVectors(camera.position, controls.target).normalize()
      camera.position.copy(controls.target).add(direction.multiplyScalar(newDistance))
      controls.update()
    }
  }

  const handleRotateLeft = () => {
    if (controlsRef.current) {
      const controls = controlsRef.current
      const camera = controls.object
      const target = controls.target
      
      // Y軸周りに回転
      const spherical = new THREE.Spherical()
      spherical.setFromVector3(camera.position.clone().sub(target))
      spherical.theta += Math.PI / 8 // 左回転
      
      // 新しい位置を計算
      const newPosition = new THREE.Vector3()
      newPosition.setFromSpherical(spherical)
      newPosition.add(target)
      
      camera.position.copy(newPosition)
      controls.update()
    }
  }

  const handleRotateRight = () => {
    if (controlsRef.current) {
      const controls = controlsRef.current
      const camera = controls.object
      const target = controls.target
      
      // Y軸周りに回転
      const spherical = new THREE.Spherical()
      spherical.setFromVector3(camera.position.clone().sub(target))
      spherical.theta -= Math.PI / 8 // 右回転
      
      // 新しい位置を計算
      const newPosition = new THREE.Vector3()
      newPosition.setFromSpherical(spherical)
      newPosition.add(target)
      
      camera.position.copy(newPosition)
      controls.update()
    }
  }

  const handleCenter = () => {
    if (controlsRef.current && dungeon) {
      const floor = dungeon.floors[currentFloor]
      if (floor) {
        // マップの中心に適切に設定
        const centerX = (floor.width - 1) / 2
        const centerZ = (floor.height - 1) / 2
        controlsRef.current.target.set(centerX, 0, centerZ)
        controlsRef.current.update()
      }
    }
  }

  const handleMoveUp = () => {
    if (controlsRef.current) {
      const controls = controlsRef.current
      const moveDistance = 2
      
      // カメラとターゲットを同時に上方向に移動
      controls.target.z -= moveDistance
      controls.object.position.z -= moveDistance
      controls.update()
    }
  }

  const handleMoveDown = () => {
    if (controlsRef.current) {
      const controls = controlsRef.current
      const moveDistance = 2
      
      // カメラとターゲットを同時に下方向に移動
      controls.target.z += moveDistance
      controls.object.position.z += moveDistance
      controls.update()
    }
  }

  const handleMoveLeft = () => {
    if (controlsRef.current) {
      const controls = controlsRef.current
      const moveDistance = 2
      
      // カメラとターゲットを同時に左方向に移動
      controls.target.x -= moveDistance
      controls.object.position.x -= moveDistance
      controls.update()
    }
  }

  const handleMoveRight = () => {
    if (controlsRef.current) {
      const controls = controlsRef.current
      const moveDistance = 2
      
      // カメラとターゲットを同時に右方向に移動
      controls.target.x += moveDistance
      controls.object.position.x += moveDistance
      controls.update()
    }
  }

  if (!dungeon) {
    return (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#1a1a1a',
          color: '#fff',
        }}
      >
        <Typography variant="h6" color="text.secondary">
          3Dプレビューを表示するにはプロジェクトを作成してください
        </Typography>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
        bgcolor: '#1a1a1a',
      }}
    >
      {/* 3Dキャンバス */}
      <Canvas 
        style={{ width: '100%', height: '100%' }}
        camera={{ position: cameraPosition, fov: 60, near: 0.1, far: 1000 }}
      >
        <Suspense fallback={null}>
          <Controls controlsRef={controlsRef} />
          <DungeonScene />
        </Suspense>
      </Canvas>

      {/* 3Dコントロール */}
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          left: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          bgcolor: 'rgba(0, 0, 0, 0.7)',
          p: 1,
          borderRadius: 1,
        }}
      >
        <Tooltip title="ズームイン">
          <IconButton size="small" onClick={handleZoomIn} sx={{ color: 'white' }}>
            <ZoomInIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="ズームアウト">
          <IconButton size="small" onClick={handleZoomOut} sx={{ color: 'white' }}>
            <ZoomOutIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="左回転">
          <IconButton size="small" onClick={handleRotateLeft} sx={{ color: 'white' }}>
            <RotateLeftIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="右回転">
          <IconButton size="small" onClick={handleRotateRight} sx={{ color: 'white' }}>
            <RotateRightIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="中央に移動">
          <IconButton size="small" onClick={handleCenter} sx={{ color: 'white' }}>
            <CenterIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* カメラ移動コントロール */}
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gridTemplateRows: 'repeat(3, 1fr)',
          gap: 0.5,
          bgcolor: 'rgba(0, 0, 0, 0.7)',
          p: 1,
          borderRadius: 1,
        }}
      >
        {/* 上段：上移動 */}
        <Box />
        <Tooltip title="上に移動">
          <IconButton size="small" onClick={handleMoveUp} sx={{ color: 'white' }}>
            <ArrowUpIcon />
          </IconButton>
        </Tooltip>
        <Box />
        
        {/* 中段：左移動・右移動 */}
        <Tooltip title="左に移動">
          <IconButton size="small" onClick={handleMoveLeft} sx={{ color: 'white' }}>
            <ArrowLeftIcon />
          </IconButton>
        </Tooltip>
        <Box />
        <Tooltip title="右に移動">
          <IconButton size="small" onClick={handleMoveRight} sx={{ color: 'white' }}>
            <ArrowRightIcon />
          </IconButton>
        </Tooltip>
        
        {/* 下段：下移動 */}
        <Box />
        <Tooltip title="下に移動">
          <IconButton size="small" onClick={handleMoveDown} sx={{ color: 'white' }}>
            <ArrowDownIcon />
          </IconButton>
        </Tooltip>
        <Box />
      </Box>

      {/* フロア情報 */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          bgcolor: 'rgba(0, 0, 0, 0.7)',
          p: 1,
          borderRadius: 1,
        }}
      >
        <Typography variant="body2" sx={{ color: 'white' }}>
          フロア {currentFloor + 1}: {dungeon.floors[currentFloor]?.name || '無名'}
        </Typography>
        <Typography variant="caption" sx={{ color: '#aaa', display: 'block' }}>
          マウス: 回転・ズーム・パン | コントロール: 基本操作
        </Typography>
      </Box>

      {/* ローディング */}
      <Suspense
        fallback={
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(0, 0, 0, 0.8)',
              color: 'white',
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <CircularProgress color="primary" />
              <Typography variant="body2" sx={{ mt: 2 }}>
                3Dシーンを読み込み中...
              </Typography>
            </Box>
          </Box>
        }
      >
        {/* 空のコンポーネント（Suspenseのfallback用） */}
        <div />
      </Suspense>
    </Box>
  )
}

export default MapEditor3D