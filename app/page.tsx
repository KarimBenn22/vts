"use client"

import { useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { getUserByEmail } from '@/lib/db'
import { User, Vacation } from '@/types'
import { v4 as uuidv4 } from 'uuid'

export default function Home() {
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

function EmployeeDashboard({ email }: { email: string }) {
  const [vacations, setVacations] = useState<Vacation[]>([])
  const [newVacation, setNewVacation] = useState({ startDate: '', endDate: '' })

  useEffect(() => {
    // Fetch employee's vacations
    fetch(`/api/vacations?email=${email}&role=employee`)
      .then(response => response.json())
      .then(setVacations)
      .catch(console.error)
  }, [email])

  const handleSubmitVacation = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newVacation.startDate || !newVacation.endDate) {
      alert('Please select both start and end dates')
      return
    }

    const vacationRequest: Vacation = {
      id: uuidv4(),
      employeeEmail: email,
      startDate: newVacation.startDate,
      endDate: newVacation.endDate,
      status: 'pending',
      requestedAt: new Date().toISOString()
    }

    try {
      const response = await fetch('/api/vacations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vacationRequest)
      })

      if (response.ok) {
        setVacations([...vacations, vacationRequest])
        setNewVacation({ startDate: '', endDate: '' })
        alert('Vacation request submitted successfully!')
      } else {
        alert('Failed to submit vacation request')
      }
    } catch (error) {
      console.error('Error submitting vacation request:', error)
      alert('An error occurred while submitting the request')
    }
  }

  return (
    <div className="max-w-4xl mx-auto bg-white/10 rounded-xl p-6 shadow-lg">
      <h1 className="text-3xl font-bold mb-6 text-center">Vacation Request</h1>
      <form onSubmit={handleSubmitVacation} className="space-y-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Start Date</label>
            <input 
              type="date" 
              className="w-full bg-black/50 text-white p-3 rounded-lg border border-white/20 focus:ring-2 focus:ring-blue-500"
              value={newVacation.startDate}
              onChange={(e) => setNewVacation({...newVacation, startDate: e.target.value})}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">End Date</label>
            <input 
              type="date" 
              className="w-full bg-black/50 text-white p-3 rounded-lg border border-white/20 focus:ring-2 focus:ring-blue-500"
              value={newVacation.endDate}
              onChange={(e) => setNewVacation({...newVacation, endDate: e.target.value})}
              required
            />
          </div>
        </div>
        <button 
          type="submit" 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition duration-300 ease-in-out transform hover:scale-[1.02]"
        >
          Submit Vacation Request
        </button>
      </form>

      <div>
        <h2 className="text-2xl font-bold mb-4">Your Vacation Requests</h2>
        {vacations.length === 0 ? (
          <p className="text-center text-white/70">No vacation requests</p>
        ) : (
          <div className="space-y-2">
            {vacations.map((vacation) => (
              <div 
                key={vacation.id} 
                className={`p-4 rounded-lg ${
                  vacation.status === 'pending' ? 'bg-yellow-500/20' : 
                  vacation.status === 'approved' ? 'bg-green-500/20' : 
                  'bg-red-500/20'
                }`}
              >
                <div className="flex justify-between">
                  <div>
                    <p>From: {vacation.startDate}</p>
                    <p>To: {vacation.endDate}</p>
                  </div>
                  <span className="font-bold uppercase">{vacation.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ManagerDashboard() {
  const [vacations, setVacations] = useState<Vacation[]>([])

  useEffect(() => {
    // Fetch all vacations
    fetch('/api/vacations?role=manager')
      .then(response => response.json())
      .then(setVacations)
      .catch(console.error)
  }, [])

  const handleVacationAction = async (vacationId: string, status: 'approved' | 'rejected') => {
    try {
      const response = await fetch('/api/vacations', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vacationId, status })
      })

      if (response.ok) {
        // Update local state
        setVacations(vacations.map(v => 
          v.id === vacationId ? { ...v, status } : v
        ))
      } else {
        alert('Failed to update vacation status')
      }
    } catch (error) {
      console.error('Error updating vacation status:', error)
      alert('An error occurred while updating vacation status')
    }
  }

  return (
    <div className="max-w-4xl mx-auto bg-white/10 rounded-xl p-6 shadow-lg">
      <h1 className="text-3xl font-bold mb-6 text-center">Manager Vacation Dashboard</h1>
      {vacations.length === 0 ? (
        <p className="text-center text-white/70">No vacation requests</p>
      ) : (
        <div className="space-y-4">
          {vacations.map((vacation) => (
            <div 
              key={vacation.id} 
              className={`p-4 rounded-lg ${
                vacation.status === 'pending' ? 'bg-yellow-500/20' : 
                vacation.status === 'approved' ? 'bg-green-500/20' : 
                'bg-red-500/20'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p>Employee: {vacation.employeeEmail}</p>
                  <p>From: {vacation.startDate}</p>
                  <p>To: {vacation.endDate}</p>
                </div>
                {vacation.status === 'pending' && (
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleVacationAction(vacation.id, 'approved')}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => handleVacationAction(vacation.id, 'rejected')}
                      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </div>
                )}
                {vacation.status !== 'pending' && (
                  <span className="font-bold uppercase">{vacation.status}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}