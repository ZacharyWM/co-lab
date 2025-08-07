import { useEffect, useRef, useCallback } from 'react'
import { WORLD_WIDTH, WORLD_HEIGHT } from './usePixi'

interface MovementState {
  keys: Set<string>
  isMoving: boolean
}

interface MovementOptions {
  speed?: number
  onPositionChange?: (x: number, y: number) => void
  onMove?: () => void
  onStop?: () => void
}

const DEFAULT_SPEED = 200 // pixels per second

export function useMovement(
  initialX: number,
  initialY: number,
  options: MovementOptions = {}
) {
  const {
    speed = DEFAULT_SPEED,
    onPositionChange,
    onMove,
    onStop
  } = options

  const positionRef = useRef({ x: initialX, y: initialY })
  const movementStateRef = useRef<MovementState>({
    keys: new Set(),
    isMoving: false
  })
  const lastUpdateRef = useRef<number>(performance.now())
  const animationFrameRef = useRef<number>()

  const clampPosition = useCallback((x: number, y: number) => {
    const avatarRadius = 20
    return {
      x: Math.max(avatarRadius, Math.min(WORLD_WIDTH - avatarRadius, x)),
      y: Math.max(avatarRadius, Math.min(WORLD_HEIGHT - avatarRadius, y))
    }
  }, [])

  const updatePosition = useCallback(() => {
    const now = performance.now()
    const deltaTime = (now - lastUpdateRef.current) / 1000
    lastUpdateRef.current = now

    const state = movementStateRef.current
    let deltaX = 0
    let deltaY = 0

    // Check movement keys
    if (state.keys.has('ArrowUp') || state.keys.has('KeyW')) deltaY -= 1
    if (state.keys.has('ArrowDown') || state.keys.has('KeyS')) deltaY += 1
    if (state.keys.has('ArrowLeft') || state.keys.has('KeyA')) deltaX -= 1
    if (state.keys.has('ArrowRight') || state.keys.has('KeyD')) deltaX += 1

    // Normalize diagonal movement
    if (deltaX !== 0 && deltaY !== 0) {
      deltaX *= 0.707 // 1/sqrt(2)
      deltaY *= 0.707
    }

    const isCurrentlyMoving = deltaX !== 0 || deltaY !== 0

    if (isCurrentlyMoving) {
      const distance = speed * deltaTime
      const newX = positionRef.current.x + deltaX * distance
      const newY = positionRef.current.y + deltaY * distance

      const clampedPosition = clampPosition(newX, newY)
      positionRef.current = clampedPosition

      onPositionChange?.(clampedPosition.x, clampedPosition.y)

      if (!state.isMoving) {
        state.isMoving = true
        onMove?.()
      }
    } else if (state.isMoving) {
      state.isMoving = false
      onStop?.()
    }

    animationFrameRef.current = requestAnimationFrame(updatePosition)
  }, [speed, onPositionChange, onMove, onStop, clampPosition])

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const key = event.code
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(key)) {
      event.preventDefault()
      movementStateRef.current.keys.add(key)
    }
  }, [])

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    const key = event.code
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(key)) {
      event.preventDefault()
      movementStateRef.current.keys.delete(key)
    }
  }, [])

  const setPosition = useCallback((x: number, y: number) => {
    const clampedPosition = clampPosition(x, y)
    positionRef.current = clampedPosition
    onPositionChange?.(clampedPosition.x, clampedPosition.y)
  }, [clampPosition, onPositionChange])

  const getPosition = useCallback(() => {
    return { ...positionRef.current }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    // Start animation loop
    animationFrameRef.current = requestAnimationFrame(updatePosition)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [handleKeyDown, handleKeyUp, updatePosition])

  // Handle window focus/blur to stop movement when window loses focus
  useEffect(() => {
    const handleBlur = () => {
      movementStateRef.current.keys.clear()
      if (movementStateRef.current.isMoving) {
        movementStateRef.current.isMoving = false
        onStop?.()
      }
    }

    window.addEventListener('blur', handleBlur)
    return () => window.removeEventListener('blur', handleBlur)
  }, [onStop])

  return {
    position: positionRef.current,
    isMoving: movementStateRef.current.isMoving,
    setPosition,
    getPosition
  }
}