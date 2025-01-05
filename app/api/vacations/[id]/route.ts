import { NextResponse } from 'next/server'
import path from 'path'
import { promises as fs } from 'fs'
import { Vacation } from '@/types'

export async function PATCH(
  request: Request, 
  { params }: { params: { id: string } }
) {
  try {
    const vacationId = params.id

    if (!vacationId) {
      return NextResponse.json({ error: 'Vacation ID is required' }, { status: 400 })
    }

    const { status } = await request.json()
    
    const dbPath = path.join(process.cwd(), 'app', 'db.json')
    const fileContents = await fs.readFile(dbPath, 'utf8')
    const data = JSON.parse(fileContents)

    const vacationIndex = data.vacations.findIndex((v: Vacation) => v.id === vacationId)
    
    if (vacationIndex === -1) {
      return NextResponse.json({ error: 'Vacation not found' }, { status: 404 })
    }

    // Add approval/rejection history
    if (!data.vacations[vacationIndex].history) {
      data.vacations[vacationIndex].history = []
    }

    data.vacations[vacationIndex].history.push({
      status,
      timestamp: new Date().toISOString(),
      // You might want to add the manager's email or ID in the future
    })

    data.vacations[vacationIndex].status = status

    await fs.writeFile(dbPath, JSON.stringify(data, null, 2))
    return NextResponse.json(data.vacations[vacationIndex], { status: 200 })
  } catch (error) {
    console.error('Error updating vacation status:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to update vacation status' 
    }, { status: 500 })
  }
}