'use client'

export default function SentryTestPage() {
  const throwTestError = () => {
    setTimeout(() => {
      throw new Error('Sentry preview test error')
    })
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6">
      <button
        type="button"
        onClick={throwTestError}
        className="rounded-md bg-black px-4 py-3 text-sm font-semibold text-white"
      >
        Sentry 테스트 에러 발생
      </button>
    </main>
  )
}
