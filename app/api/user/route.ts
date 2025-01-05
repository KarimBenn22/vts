import { NextResponse } from 'next/server'
import path from 'path'
import { promises as fs } from 'fs'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')

  const dbPath = path.join(process.cwd(), 'app', 'db.json')
  const fileContents = await fs.readFile(dbPath, 'utf8')
  const data = JSON.parse(fileContents)

  const user = data.users.find((u: any) => u.email === email)

  return NextResponse.json(user || null)
}