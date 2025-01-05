"use client"

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { getUserByEmail } from '@/lib/db'
import { User, Vacation } from '@/types'
import { v4 as uuidv4 } from 'uuid'

function HomeContent() {
  const searchParams = useSearchParams()
  const [user, setUser] = useState<User | null>(null)
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
      getUserByEmail(emailParam).then(setUser)
    }
  }, [searchParams])

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-black via-gray-900 to-blue-950 text-white p-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Please Sign In</h1>
          <p>Use the sign-in page to access the Vacation Tracking System</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-black via-gray-900 to-blue-950 text-white">
      <div className="container mx-auto px-4 py-8">
        {user.role === 'employee' ? (
          <EmployeeDashboard email={email!} />
        ) : (
          <ManagerDashboard />
        )}
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  )
}

function EmployeeDashboard() {
  const [vacations, setVacations] = useState<Vacation[]>([])
  const [newVacation, setNewVacation] = useState({
    startDate: '',
    endDate: ''
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'pending' | 'processed'>('pending')

  useEffect(() => {
    async function fetchVacations() {
      try {
        setIsLoading(true)
        const response = await fetch('/api/vacations')
        if (!response.ok) {
          throw new Error('Failed to fetch vacations')
        }
        const data = await response.json()
        setVacations(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchVacations()
  }, [])

  const handleSubmitVacation = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const vacationRequest = {
        id: crypto.randomUUID(),
        employeeEmail: 'current_user@example.com', // Replace with actual user email
        startDate: newVacation.startDate,
        endDate: newVacation.endDate,
        status: 'pending',
        requestedAt: new Date().toISOString()
      }

      const response = await fetch('/api/vacations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vacationRequest)
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = 'Failed to submit vacation request'
        
        try {
          const errorJson = JSON.parse(errorText)
          errorMessage = errorJson.error || errorMessage
        } catch {
          errorMessage = errorText
        }

        throw new Error(errorMessage)
      }

      // Add the new vacation to the list
      setVacations([vacationRequest, ...vacations])
      
      // Reset the form
      setNewVacation({ startDate: '', endDate: '' })
    } catch (err) {
      console.error('Vacation submission error:', err)
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    }
  }

  if (isLoading) return (
    <div className="flex justify-center items-center bg-gray-900">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
    </div>
  )

  if (error) return (
    <div className=" bg-gray-900 flex items-center justify-center">
      <div className="bg-red-900/50 border-l-4 border-red-500 p-4 rounded-lg">
        <p className="text-red-300 text-lg">Error: {error}</p>
      </div>
    </div>
  )

  // Filter vacations based on active tab
  const pendingVacations = vacations.filter(v => v.status === 'pending')
  const processedVacations = vacations.filter(v => v.status !== 'pending')

  return (
    <div className="min-h-screen bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800 rounded-xl shadow-2xl overflow-hidden mb-8">
          <div className="px-6 py-8 sm:p-10">
            <h2 className="text-3xl font-extrabold text-center mb-8 text-blue-400">
              Request Vacation
            </h2>
            
            <form onSubmit={handleSubmitVacation} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-400 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    value={newVacation.startDate}
                    onChange={(e) => setNewVacation({...newVacation, startDate: e.target.value})}
                    required
                    className="w-full bg-gray-700 border-gray-600 text-white rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-400 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    value={newVacation.endDate}
                    onChange={(e) => setNewVacation({...newVacation, endDate: e.target.value})}
                    required
                    className="w-full bg-gray-700 border-gray-600 text-white rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="
                  w-full bg-blue-600 hover:bg-blue-700 
                  text-white font-bold py-3 px-4 rounded-md 
                  transition-colors duration-300 
                  flex items-center justify-center space-x-2
                  hover:scale-105 active:scale-95
                "
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-6 w-6" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" 
                  />
                </svg>
                <span>Submit Vacation Request</span>
              </button>
            </form>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
          <div className="px-6 py-8 sm:p-10">
            {/* Tab Navigation */}
            <div className="flex mb-4 border-b border-gray-700">
              <button 
                className={`px-4 py-2 ${activeTab === 'pending' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-400'}`}
                onClick={() => setActiveTab('pending')}
              >
                Pending Requests ({pendingVacations.length})
              </button>
              <button 
                className={`px-4 py-2 ${activeTab === 'processed' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-400'}`}
                onClick={() => setActiveTab('processed')}
              >
                Processed Requests ({processedVacations.length})
              </button>
            </div>

            {/* Vacation List */}
            <div>
              {activeTab === 'pending' && (
                <div>
                  {pendingVacations.length === 0 ? (
                    <div className="text-center py-12 bg-gray-700/50 rounded-lg">
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-16 w-16 mx-auto text-gray-500 mb-4" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" 
                        />
                      </svg>
                      <p className="text-gray-400">No pending vacation requests</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingVacations.map((vacation) => (
                        <div 
                          key={vacation.id} 
                          className="bg-gray-700 rounded-lg p-5 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 hover:bg-gray-600 transition-colors"
                        >
                          <div className="flex-grow">
                            <div className="text-sm text-gray-400">
                              <span className="mr-2">
                                <strong>From:</strong> {vacation.startDate}
                              </span>
                              <span>
                                <strong>To:</strong> {vacation.endDate}
                              </span>
                            </div>
                          </div>
                          <div 
                            className="
                              font-bold uppercase px-3 py-1 rounded-full text-sm
                              bg-yellow-500/20 text-yellow-400
                            "
                          >
                            {vacation.status}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'processed' && (
                <div>
                  {processedVacations.length === 0 ? (
                    <div className="text-center py-12 bg-gray-700/50 rounded-lg">
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-16 w-16 mx-auto text-gray-500 mb-4" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" 
                        />
                      </svg>
                      <p className="text-gray-400">No processed vacation requests</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {processedVacations.map((vacation) => (
                        <div 
                          key={vacation.id} 
                          className={`
                            rounded-lg p-5 
                            ${vacation.status === 'approved' 
                              ? 'bg-green-900/50 border-l-4 border-green-500' 
                              : 'bg-red-900/50 border-l-4 border-red-500'}
                            flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0
                          `}
                        >
                          <div className="flex-grow">
                            <div className="text-sm text-gray-400">
                              <span className="mr-2">
                                <strong>From:</strong> {vacation.startDate}
                              </span>
                              <span>
                                <strong>To:</strong> {vacation.endDate}
                              </span>
                            </div>
                          </div>
                          <div 
                            className={`
                              font-bold uppercase px-3 py-1 rounded-full text-sm
                              ${vacation.status === 'approved' 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-red-500/20 text-red-400'}
                            `}
                          >
                            {vacation.status}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ManagerDashboard() {
  const [pendingVacations, setPendingVacations] = useState<Vacation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPendingVacations() {
      try {
        setIsLoading(true)
        const response = await fetch('/api/vacations?status=pending')
        if (!response.ok) {
          throw new Error('Failed to fetch pending vacations')
        }
        const data = await response.json()
        setPendingVacations(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPendingVacations()
  }, [])

  const handleVacationAction = async (vacationId: string, action: 'approved' | 'rejected') => {
    try {
      const response = await fetch(`/api/vacations/${vacationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: action })
      })
  
      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = 'Failed to update vacation status'
        
        try {
          const errorJson = JSON.parse(errorText)
          errorMessage = errorJson.error || errorMessage
        } catch {
          errorMessage = errorText
        }
  
        throw new Error(errorMessage)
      }
  
      setPendingVacations(pendingVacations.filter(v => v.id !== vacationId))
    } catch (err) {
      console.error('Vacation action error:', err)
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    }
  }

  if (isLoading) return (
    <div className="flex justify-center items-center bg-gray-900">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
    </div>
  )

  if (error) return (
    <div className=" bg-gray-900 flex items-center justify-center">
      <div className="bg-red-900/50 border-l-4 border-red-500 p-4 rounded-lg">
        <p className="text-red-300 text-lg">Error: {error}</p>
      </div>
    </div>
  )

  return (
    <div className=" h-screen max-h-screen bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
          <div className="px-6 py-8 sm:p-10">
            <h2 className="text-3xl font-extrabold text-center mb-8 text-blue-400">
              Manager Dashboard
            </h2>
            
            {pendingVacations.length === 0 ? (
              <div className="text-center py-12 bg-gray-700/50 rounded-lg">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-16 w-16 mx-auto text-gray-500 mb-4" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" 
                  />
                </svg>
                <p className="text-gray-400">No pending vacation requests</p>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold mb-4 text-blue-300">
                  Pending Vacation Requests
                </h3>
                {pendingVacations.map((vacation) => (
                  <div 
                    key={vacation.id} 
                    className="bg-gray-700 rounded-lg p-5 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex-grow">
                      <div className="font-bold text-blue-200 mb-1">
                        {vacation.employeeEmail}
                      </div>
                      <div className="text-sm text-gray-400">
                        <span className="mr-2">
                          <strong>From:</strong> {vacation.startDate}
                        </span>
                        <span>
                          <strong>To:</strong> {vacation.endDate}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      <button 
                        onClick={() => handleVacationAction(vacation.id, 'approved')}
                        className="
                          bg-green-600 hover:bg-green-700 
                          text-white font-bold py-2 px-4 rounded-md 
                          transition-colors duration-300 
                          flex items-center space-x-2
                          hover:scale-105 active:scale-95
                        "
                      >
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className="h-5 w-5" 
                          viewBox="0 0 20 20" 
                          fill="currentColor"
                        >
                          <path 
                            fillRule="evenodd" 
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                            clipRule="evenodd" 
                          />
                        </svg>
                        <span>Approve</span>
                      </button>
                      <button 
                        onClick={() => handleVacationAction(vacation.id, 'rejected')}
                        className="
                          bg-red-600 hover:bg-red-700 
                          text-white font-bold py-2 px-4 rounded-md 
                          transition-colors duration-300 
                          flex items-center space-x-2
                          hover:scale-105 active:scale-95
                        "
                      >
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className="h-5 w-5" 
                          viewBox="0 0 20 20" 
                          fill="currentColor"
                        >
                          <path 
                            fillRule="evenodd" 
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" 
                            clipRule="evenodd" 
                          />
                        </svg>
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}