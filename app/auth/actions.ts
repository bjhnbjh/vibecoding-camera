'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  // 폼 데이터 검증
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  // 기본 검증
  if (!data.email || !data.password) {
    redirect('/auth/login?error=missing-fields')
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect(`/auth/login?error=${error.message}`)
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  // 비밀번호 강도 검증
  if (data.password.length < 8) {
    redirect('/auth/signup?error=password-too-short')
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    redirect(`/auth/signup?error=${error.message}`)
  }

  revalidatePath('/', 'layout')
  redirect('/auth/verify-email')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/auth/login')
}
