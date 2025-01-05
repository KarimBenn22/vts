"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function SignInPage() {
  const [email, setEmail] = useState("")
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Navigate to root with email as query parameter
    router.push(`/?email=${encodeURIComponent(email)}`)
  }

  return (
    <div className="flex items-center justify-center h-full w-full bg-gradient-to-br from-black via-black to-blue-950 p-4">
      <Card className="w-full max-w-md bg-white/5 border-white/10 shadow-xl rounded-xl">
        <CardContent className="p-6 space-y-4">
          <div className="text-center mb-4">
            <h1 className="text-3xl font-bold text-white">Sign In</h1>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="text-white text-sm mb-2">Email</div>
              <Input 
                id="email" 
                type="email" 
                placeholder="you@organization.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder-white/50 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Sign In
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}