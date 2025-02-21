interface CheckboxProps {
  disabled?: boolean
  isChecked?: boolean
  onClick: () => void
}

const Checkbox = ({ disabled, isChecked, onClick }: CheckboxProps) => {
  return (
    <label className="checkbox_label h-16" onClick={onClick}>
      <input type="checkbox" disabled={disabled || false} checked={isChecked} />
      <span className="checkbox_icon" />
    </label>
  )
}

export default Checkbox
