'use client'

import { Slide, toast, ToastContainer } from 'react-toastify'

const Toast = () => {
  return (
    <ToastContainer
      position="bottom-center"
      autoClose={2000}
      hideProgressBar
      closeOnClick={true}
      closeButton={false}
      limit={1}
      transition={Slide}
    />
  )
}

export const useToast = {
  success: (message: string) => {
    toast.success(message)
  },
  error: (message: string) => {
    toast.error(message)
  },
}

export default Toast
