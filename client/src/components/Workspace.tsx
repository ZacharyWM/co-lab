import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../hooks/useAppContext'
import { usePixi } from '../hooks/usePixi'
import { useWebSocket } from '../hooks/useWebSocket'

export default function Workspace() {
  const { currentUser, isConnected, connectionError } = useAppContext()
  const navigate = useNavigate()
  const canvasRef = useRef<HTMLDivElement>(null)
  const { pixiApp, isReady } = usePixi(canvasRef)
  const { connect, joinRoom, disconnect } = useWebSocket()

  useEffect(() => {
    if (!currentUser) {
      navigate('/')
    }
  }, [currentUser, navigate])

  useEffect(() => {
    if (currentUser && isReady) {
      connect().then(() => {
        joinRoom(currentUser.name)
      })
    }

    return () => {
      disconnect()
    }
  }, [currentUser, isReady, connect, joinRoom, disconnect])

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