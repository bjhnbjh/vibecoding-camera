import { getUser } from '@/lib/auth/utils'
import HomePageContent from './HomePageContent'

export default async function HomePage() {
  // 실제 인증 상태 확인
  const user = await getUser()

  return <HomePageContent initialUser={user} />
}