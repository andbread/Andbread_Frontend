interface CheckboxProps {
  disabled?: boolean
  isChecked?: boolean
  onChange: () => void
}

const Checkbox = ({ disabled, isChecked, onChange }: CheckboxProps) => {
  return (
    <label className="checkbox_label h-16">
      <input
        type="checkbox"
        disabled={disabled || false}
        onChange={onChange}
        checked={isChecked}
      />
      <span className="checkbox_icon" />
    </label>
  )
}

export default Checkbox
