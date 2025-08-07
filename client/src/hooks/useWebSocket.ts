import { useEffect, useRef, useCallback } from 'react'
import { SignalingService } from '../services/signaling'
import { useAppContext } from './useAppContext'
import { WebSocketMessage, User } from '../types'

export function useWebSocket() {
  const signalingService = useRef<SignalingService | null>(null)
  const { 
    currentUser, 
    setCurrentUser, 
    addUser, 
    removeUser, 
    updateUser, 
    setConnectionStatus,
    clearUsers 
  } = useAppContext()
  
  // Store the latest values in refs to avoid stale closures
  const handleMessageRef = useRef<(message: WebSocketMessage) => void>()
  const setConnectionStatusRef = useRef(setConnectionStatus)
  const clearUsersRef = useRef(clearUsers)
  
  // Update refs when values change
  setConnectionStatusRef.current = setConnectionStatus
  clearUsersRef.current = clearUsers

  const handleMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'connection':
        if (currentUser && message.data.userId) {
          setCurrentUser({
            ...currentUser,
            id: message.data.userId
          })
        }
        break

      case 'joined':
        setConnectionStatus(true)
        if (message.data.users) {
          clearUsers()
          message.data.users.forEach((user: User) => {
            if (user.id !== currentUser?.id) {
              addUser(user)
            }
          })
        }
        break

      case 'user-joined':
        if (message.data && message.data.id !== currentUser?.id) {
          addUser(message.data)
        }
        break

      case 'user-left':
        if (message.data.userId) {
          removeUser(message.data.userId)
        }
        break

      case 'position-update':
        if (message.data.userId && message.data.userId !== currentUser?.id) {
          updateUser(message.data.userId, {
            x: message.data.x,
            y: message.data.y
          })
        }
        break

      case 'zone-enter':
      case 'zone-exit':
        if (message.data.userId && message.data.userId !== currentUser?.id) {
          updateUser(message.data.userId, {
            zone: message.type === 'zone-enter' ? message.data.zoneName : undefined
          })
        }
        break

      case 'error':
        console.error('Server error:', message.data.message)
        setConnectionStatus(false, message.data.message)
        break

      default:
        console.log('Unhandled message type:', message.type)
    }
  }, [currentUser, setCurrentUser, addUser, removeUser, updateUser, setConnectionStatus, clearUsers])

  // Update the ref with the latest handleMessage
  handleMessageRef.current = handleMessage

  const connect = useCallback(async () => {
    if (signalingService.current?.isConnected()) {
      console.log('Already connected, skipping connection attempt')
      return
    }

    if (!signalingService.current) {
      signalingService.current = new SignalingService()
      if (handleMessageRef.current) {
        signalingService.current.addMessageHandler(handleMessageRef.current)
      }
    }

    try {
      console.log('Initiating WebSocket connection...')
      await signalingService.current.connect()
      setConnectionStatusRef.current(true)
    } catch (error) {
      console.error('Failed to connect to server:', error)
      setConnectionStatusRef.current(false, 'Failed to connect to server')
    }
  }, [])

  const disconnect = useCallback(() => {
    if (signalingService.current) {
      signalingService.current.disconnect()
      signalingService.current = null
      setConnectionStatusRef.current(false)
      clearUsersRef.current()
    }
  }, [])

  const joinRoom = useCallback((name: string) => {
    if (signalingService.current) {
      signalingService.current.joinRoom(name)
    }
  }, [])

  const leaveRoom = useCallback(() => {
    if (signalingService.current) {
      signalingService.current.leaveRoom()
    }
  }, [])

  const sendPosition = useCallback((x: number, y: number) => {
    if (signalingService.current) {
      signalingService.current.sendPosition(x, y)
    }
  }, [])

  const sendZoneEnter = useCallback((zoneName: string) => {
    if (signalingService.current) {
      signalingService.current.sendZoneEnter(zoneName)
    }
  }, [])

  const sendZoneExit = useCallback((zoneName: string) => {
    if (signalingService.current) {
      signalingService.current.sendZoneExit(zoneName)
    }
  }, [])

  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    connect,
    disconnect,
    joinRoom,
    leaveRoom,
    sendPosition,
    sendZoneEnter,
    sendZoneExit,
    isConnected: signalingService.current?.isConnected() || false,
    signalingService: signalingService.current
  }
}