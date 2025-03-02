import 'nprogress/nprogress.css'

interface SpinnerProps {
  isLoading: boolean
}

const Spinner = ({ isLoading }: SpinnerProps) => {
  return (
    <div>
      {isLoading ? (
        <div className="spinner-overlay">
          <div className="spinner"></div>
        </div>
      ) : null}
    </div>
  )
}

export default Spinner
