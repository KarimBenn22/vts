import { NextResponse } from 'next/server'
import path from 'path'
import { promises as fs } from 'fs'
import { Vacation } from '@/types'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')
  const status = searchParams.get('status')

  const dbPath = path.join(process.cwd(), 'app', 'db.json')
  const fileContents = await fs.readFile(dbPath, 'utf8')
  const data = JSON.parse(fileContents)

  let vacations: Vacation[] = data.vacations

  // Filter by email if provided
  if (email) {
    vacations = vacations.filter((v: Vacation) => v.employeeEmail === email)
  }

  // Filter by status if provided
  if (status) {
    vacations = vacations.filter((v: Vacation) => v.status === status)
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