import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function getUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

export async function requireAuth() {
  const user = await getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return user
}

export async function redirectIfAuthenticated() {
  const user = await getUser()

  if (user) {
    redirect('/')
  }
}
