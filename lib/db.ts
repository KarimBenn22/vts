export async function getUserByEmail(email: string) {
    const response = await fetch(`/api/user?email=${encodeURIComponent(email)}`)
    return response.json()
  }