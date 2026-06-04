'use client'

import 'nprogress/nprogress.css'
import Spinner from '@/components/common/spinner/Spinner'
import { useAuthCallbackFlow } from '@/hooks/useAuthCallbackFlow'

const CallbackPage = () => {
  const { loading, errorMessage } = useAuthCallbackFlow()

  if (errorMessage) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background px-24">
        <p className="text-center text-body02 text-gray-600">{errorMessage}</p>
      </main>
    )
  }

  return <Spinner isLoading={loading} />
}

export default CallbackPage
