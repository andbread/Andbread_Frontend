interface ToggleProps {
  enabled: boolean
  onClick: () => void
  ariaLabel?: string
}

const ToggleButton = ({ onClick, enabled, ariaLabel }: ToggleProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={enabled}
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
