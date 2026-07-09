import { useState } from 'react';

export default function PasswordInput({ className, value, onChange, placeholder = 'Password', required = false, type, ...props }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-field">
      <input
        type={visible ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className={className}
        {...props}
      />
      <button
        type="button"
        className="toggle-password-btn"
        onClick={() => setVisible(!visible)}
        tabIndex={-1}
      >
        {visible ? 'Hide' : 'Show'}
      </button>
    </div>
  );
}

