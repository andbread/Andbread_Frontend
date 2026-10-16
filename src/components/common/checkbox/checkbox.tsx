interface CheckboxProps {
  disabled?: boolean
  isChecked?: boolean
  onChange: () => void
  testId?: string
}

const Checkbox = ({ disabled, isChecked, onChange, testId }: CheckboxProps) => {
  return (
    <label className="checkbox_label h-16" data-testid={testId}>
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
