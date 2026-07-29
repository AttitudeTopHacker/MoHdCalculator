import './InputField.css';

/**
 * Dark input field with icon prefix, teal border, and focus animation.
 *
 * @param {string}   id          - Unique element ID
 * @param {string}   type        - Input type (text, email, password)
 * @param {string}   placeholder - Placeholder text
 * @param {string}   value       - Controlled value
 * @param {function} onChange    - Change handler
 * @param {string}   icon        - SVG icon string or emoji (optional)
 * @param {string}   error       - Error message to display below field
 * @param {node}     rightSlot   - Right-side slot (e.g., show-password toggle)
 */
export default function InputField({
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  icon,
  error,
  rightSlot,
  ...rest
}) {
  return (
    <div className={`input-wrapper ${error ? 'input-wrapper--error' : ''}`}>
      {icon && <span className="input-icon" aria-hidden="true">{icon}</span>}
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="input-field"
        autoComplete="off"
        {...rest}
      />
      {rightSlot && <span className="input-right-slot">{rightSlot}</span>}
      {error && <p className="input-error">{error}</p>}
    </div>
  );
}
