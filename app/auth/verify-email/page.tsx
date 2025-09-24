import { redirectIfAuthenticated } from '@/lib/auth/utils'

export default async function VerifyEmailPage() {
  await redirectIfAuthenticated()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto bg-emerald-500 rounded-full flex items-center justify-center mb-6">
            <span className="text-3xl">📧</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            이메일을 확인해주세요
          </h2>
          <p className="text-gray-600 text-lg">
            회원가입 시 입력하신 이메일로 인증 메일을 발송했습니다.
            이메일을 확인하고 인증 링크를 클릭해주세요.
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-lg rounded-2xl text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">✉️</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              인증 메일이 도착하지 않으셨나요?
            </h3>
            <p className="text-sm text-gray-600">
              스팸 메일함을 확인해보시거나, 다시 시도해보세요.
            </p>
            <div className="pt-4">
              <a
                href="/auth/login"
                className="inline-flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
              >
                로그인 페이지로 돌아가기
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
