import { LoginForm } from '@/components/auth/LoginForm'
import GoogleLoginButton from '@/components/auth/GoogleLoginButton'
import { redirectIfAuthenticated } from '@/lib/auth/utils'

export default async function LoginPage() {
  await redirectIfAuthenticated()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto bg-emerald-500 rounded-full flex items-center justify-center mb-6">
            <span className="text-3xl">📸</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            로그인
          </h2>
          <p className="text-gray-600">
            계정에 로그인하여 식단 기록을 시작하세요
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-lg rounded-2xl space-y-6">
          {/* Google 로그인 버튼 */}
          <GoogleLoginButton text="Google로 로그인" />

          {/* 구분선 */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">또는</span>
            </div>
          </div>

          {/* 기존 이메일/비밀번호 로그인 폼 */}
          <LoginForm />
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            계정이 없으신가요?{' '}
            <a href="/auth/signup" className="font-medium text-emerald-600 hover:text-emerald-500">
              회원가입
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
