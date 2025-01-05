import { NextResponse } from 'next/server'
import path from 'path'
import { promises as fs } from 'fs'
import { Vacation } from '@/types'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')
  const role = searchParams.get('role')

  const dbPath = path.join(process.cwd(), 'app', 'db.json')
  const fileContents = await fs.readFile(dbPath, 'utf8')
  const data = JSON.parse(fileContents)

  let vacations: Vacation[] = []
  if (role === 'employee') {
    // Employee sees only their vacations
    vacations = data.vacations.filter((v: Vacation) => v.employeeEmail === email)
  } else if (role === 'manager') {
    // Manager sees all vacations
    vacations = data.vacations
  }

  return NextResponse.json(vacations)
}

export async function POST(request: Request) {
  try {
    const vacation = await request.json()
    
    const dbPath = path.join(process.cwd(), 'app', 'db.json')
    const fileContents = await fs.readFile(dbPath, 'utf8')
    const data = JSON.parse(fileContents)

    data.vacations.push(vacation)

    await fs.writeFile(dbPath, JSON.stringify(data, null, 2))

    return NextResponse.json(vacation, { status: 200 })
  } catch (error) {
    console.error('Error processing vacation request:', error)
    return NextResponse.json({ error: 'Failed to process vacation request' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { vacationId, status } = await request.json()
    
    const dbPath = path.join(process.cwd(), 'app', 'db.json')
    const fileContents = await fs.readFile(dbPath, 'utf8')
    const data = JSON.parse(fileContents)

    const vacationIndex = data.vacations.findIndex((v: Vacation) => v.id === vacationId)
    
    if (vacationIndex !== -1) {
      data.vacations[vacationIndex].status = status

      await fs.writeFile(dbPath, JSON.stringify(data, null, 2))
      return NextResponse.json(data.vacations[vacationIndex], { status: 200 })
    }

    return NextResponse.json({ error: 'Vacation not found' }, { status: 404 })
  } catch (error) {
    console.error('Error updating vacation status:', error)
    return NextResponse.json({ error: 'Failed to update vacation status' }, { status: 500 })
  }
}