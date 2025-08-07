import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../hooks/useAppContext'
import { usePixi, ZONES } from '../hooks/usePixi'
import { useWebSocket } from '../hooks/useWebSocket'
import { useAvatars } from '../hooks/useAvatars'

export default function Workspace() {
  const { currentUser, isConnected, connectionError, users } = useAppContext()
  const navigate = useNavigate()
  const canvasRef = useRef<HTMLDivElement>(null)
  const hasConnectedRef = useRef(false)
  const { pixiApp, isReady } = usePixi(canvasRef)
  const { connect, joinRoom, disconnect } = useWebSocket()
  const { currentZone } = useAvatars(pixiApp)

  useEffect(() => {
    if (!currentUser) {
      navigate('/')
    }
  }, [currentUser, navigate])

  useEffect(() => {
    if (!currentUser || !isReady || hasConnectedRef.current) {
      return
    }

    hasConnectedRef.current = true
    
    connect().then(() => {
      joinRoom(currentUser.name)
    }).catch(error => {
      console.error('Failed to connect to WebSocket:', error)
      hasConnectedRef.current = false
    })
  }, [currentUser, isReady, connect, joinRoom])
  
  useEffect(() => {
    return () => {
      hasConnectedRef.current = false
      disconnect()
    }
  }, [disconnect])

  const handleLeave = () => {
    disconnect()
    navigate('/')
  }

  if (!currentUser) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-900 relative">
      <div 
        ref={canvasRef} 
        className="absolute inset-0"
        style={{ cursor: 'crosshair' }}
      />
      
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={handleLeave}
          className="bg-white text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
        >
          ← Leave Workspace
        </button>
      </div>

      <div className="absolute top-4 right-4 z-10 bg-white rounded-lg p-3 shadow-lg">
        <div className="text-sm">
          <div className="font-semibold text-gray-900">{currentUser.name}</div>
          <div className={`text-xs ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
            {isConnected ? '● Connected' : '● Disconnected'}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            Users: {users.size + (currentUser ? 1 : 0)}/20
          </div>
          {currentZone && (
            <div className="text-xs text-green-600 mt-1">
              📍 {ZONES.find(z => z.id === currentZone)?.name || currentZone}
            </div>
          )}
          {connectionError && (
            <div className="text-xs text-red-600 mt-1">{connectionError}</div>
          )}
        </div>
      </div>

      <div className="absolute bottom-4 left-4 z-10 bg-white rounded-lg p-3 shadow-lg max-w-sm">
        <h3 className="font-semibold text-gray-900 mb-2">Controls</h3>
        <div className="text-sm text-gray-600 space-y-1">
          <div>• Use WASD or arrow keys to move</div>
          <div>• Enter green zones to communicate</div>
          <div>• Audio/video will activate in zones</div>
        </div>
      </div>

      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-20">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Loading workspace...</p>
          </div>
        </div>
      )}
    </div>
  )
}