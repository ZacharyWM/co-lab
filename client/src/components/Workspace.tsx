import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../hooks/useAppContext'

export default function Workspace() {
  const { currentUser } = useAppContext()
  const navigate = useNavigate()

  useEffect(() => {
    if (!currentUser) {
      navigate('/')
    }
  }, [currentUser, navigate])

  if (!currentUser) {
    return null
  }

  return (
    <div className="min-h-screen bg-blue-500 relative">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-4xl font-bold mb-4">Welcome, {currentUser.name}!</h1>
          <p className="text-xl mb-8">Virtual workspace coming soon...</p>
          <div className="bg-green-400 rounded-lg p-8 max-w-md mx-auto">
            <h2 className="text-2xl font-semibold text-green-900 mb-2">Communication Zone</h2>
            <p className="text-green-800">Step into green areas to talk with others</p>
          </div>
        </div>
      </div>
      
      <button
        onClick={() => navigate('/')}
        className="absolute top-4 left-4 bg-white text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        ← Back to Entry
      </button>
    </div>
  )
}