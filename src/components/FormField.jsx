import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function FormField({
  icon: Icon,
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  required = true,
  minLength,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  return (
    <label className="field">
      <span>{label}</span>
      <div className="input-wrap">
        {Icon ? <Icon size={18} aria-hidden="true" /> : null}
        <input
          name={name}
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
        />
        {isPassword ? (
          <button
            className="icon-button"
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            title={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword((current) => !current)}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        ) : null}
      </div>
    </label>
  );
}
