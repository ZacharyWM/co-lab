import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../hooks/useAppContext'

export default function NameEntry() {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { setCurrentUser } = useAppContext()

  const validateName = (name: string): string | null => {
    const trimmedName = name.trim()
    
    if (!trimmedName) {
      return 'Name is required'
    }
    
    if (trimmedName.length > 20) {
      return 'Name must be 20 characters or less'
    }
    
    if (!/^[a-zA-Z0-9\s]+$/.test(trimmedName)) {
      return 'Name can only contain letters, numbers, and spaces'
    }
    
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validationError = validateName(name)
    if (validationError) {
      setError(validationError)
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const trimmedName = name.trim()
      setCurrentUser({
        id: '',
        name: trimmedName,
        x: 100,
        y: 100
      })
      
      navigate('/workspace')
    } catch (err) {
      setError('Failed to enter workspace. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Co-Lab</h1>
          <p className="text-gray-600">Enter your name to join the virtual workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Your Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${
                error ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Enter your name..."
              maxLength={20}
              disabled={isLoading}
            />
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {name.length}/20 characters
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading || !name.trim()}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Entering Workspace...' : 'Enter Workspace'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Up to 20 users can join simultaneously</p>
          <p>Move around and enter green zones to communicate</p>
        </div>
      </div>
    </div>
  )
}