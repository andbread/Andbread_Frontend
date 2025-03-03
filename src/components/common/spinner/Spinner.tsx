import classNames from 'classnames'
import 'nprogress/nprogress.css'

interface SpinnerProps {
  isLoading: boolean
}

const Spinner = ({ isLoading }: SpinnerProps) => {
  return (
    <div
      className={classNames(
        'fixed inset-0 flex items-center justify-center transition-opacity',
        { hidden: !isLoading },
      )}
    >
      <div className="h-40 w-40 animate-spin rounded-full border-4 border-gray-200 border-t-primary-500"></div>
    </div>
  )
}

export default Spinner
