interface ToggleProps {
  enabled: boolean
  onClick: () => void
}

const ToggleButton = ({ onClick, enabled }: ToggleProps) => {
  return (
    <button
      onClick={onClick}
      className={`relative inline-flex h-20 w-40 items-center rounded-full transition-colors ${
        enabled ? 'bg-secondary-100' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-16 w-16 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-22' : 'translate-x-2'
        }`}
      />
    </button>
  )
}

export default ToggleButton
