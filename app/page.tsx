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
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-blue-950 text-white">
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

function EmployeeDashboard({ email }: { email: string }) {
  const [vacations, setVacations] = useState<Vacation[]>([])
  const [newVacation, setNewVacation] = useState({ startDate: '', endDate: '' })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchVacations() {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/vacations?email=${encodeURIComponent(email)}`)
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
  }, [email])

  const handleSubmitVacation = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/vacations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: uuidv4(),
          employeeEmail: email,
          startDate: newVacation.startDate,
          endDate: newVacation.endDate,
          status: 'pending',
          requestedAt: new Date().toISOString()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to submit vacation request')
      }

      const newVacationRequest = await response.json()
      setVacations([...vacations, newVacationRequest])
      setNewVacation({ startDate: '', endDate: '' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    }
  }

  if (isLoading) return <div>Loading vacations...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Employee Dashboard</h2>
      
      <form onSubmit={handleSubmitVacation} className="mb-6">
        <div className="flex space-x-4">
          <input
            type="date"
            value={newVacation.startDate}
            onChange={(e) => setNewVacation({...newVacation, startDate: e.target.value})}
            required
            className="text-black p-2 rounded"
          />
          <input
            type="date"
            value={newVacation.endDate}
            onChange={(e) => setNewVacation({...newVacation, endDate: e.target.value})}
            required
            className="text-black p-2 rounded"
          />
          <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Request Vacation
          </button>
        </div>
      </form>

      <div>
        <h3 className="text-xl font-semibold mb-2">Your Vacation Requests</h3>
        {vacations.length === 0 ? (
          <p>No vacation requests found.</p>
        ) : (
          <ul>
            {vacations.map((vacation) => (
              <li key={vacation.id} className="mb-2 p-3 bg-gray-800 rounded">
                <div>From: {vacation.startDate}</div>
                <div>To: {vacation.endDate}</div>
                <div>Status: {vacation.status}</div>
              </li>
            ))}
          </ul>
        )}
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
        throw new Error(`Failed to ${action} vacation request`)
      }

      setPendingVacations(pendingVacations.filter(v => v.id !== vacationId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    }
  }

  if (isLoading) return <div>Loading pending vacations...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Manager Dashboard</h2>
      
      {pendingVacations.length === 0 ? (
        <p>No pending vacation requests.</p>
      ) : (
        <div>
          <h3 className="text-xl font-semibold mb-2">Pending Vacation Requests</h3>
          <ul>
            {pendingVacations.map((vacation) => (
              <li key={vacation.id} className="mb-2 p-3 bg-gray-800 rounded flex justify-between items-center">
                <div>
                  <div>Employee: {vacation.employeeEmail}</div>
                  <div>From: {vacation.startDate}</div>
                  <div>To: {vacation.endDate}</div>
                </div>
                <div className="space-x-2">
                  <button 
                    onClick={() => handleVacationAction(vacation.id, 'approved')}
                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Approve
                  </button>
                  <button 
                    onClick={() => handleVacationAction(vacation.id, 'rejected')}
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}