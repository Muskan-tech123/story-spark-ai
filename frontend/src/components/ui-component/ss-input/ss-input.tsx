import { useState } from "react";
import {
  UseFormRegister,
  FieldValues,
  Path,
  RegisterOptions,
  FieldError,
} from "react-hook-form";

interface SSInputProps<T extends FieldValues> {
  label: string;
  name: Path<T>;
  type?: string;
  placeholder?: string;
  required?: boolean;
  icon?: string;
  register: UseFormRegister<T>;
  validation?: RegisterOptions<T>;
  error?: FieldError;
  autoComplete?: string;
  autoFocus?: boolean;
}

const SSInput = <T extends FieldValues>({
  label,
  name,
  type = "text",
  placeholder,
  required,
  icon,
  register,
  validation,
  error,
  autoComplete,
  autoFocus,
}: SSInputProps<T>) => {
  const [showPassword, setShowPassword] = useState(false);

  const inputType =
    type === "password" ? (showPassword ? "text" : "password") : type;

  return (
    <div className="w-full flex flex-col min-w-0">
      {/* Label */}
      <label
        htmlFor={name}
        className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 text-left"
      >
        {label}
        {required && <span className="text-rose-500"> *</span>}
      </label>

      {/* Input Wrapper */}
      <div className="relative w-full min-w-0">
        {/* Left Icon */}
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
            <i className={icon}></i>
          </span>
        )}

        {/* Input */}
        <input
          id={name}
          type={inputType}
          placeholder={placeholder}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          {...register(name, validation)}
          className={`block w-full min-w-0 box-border rounded-md border bg-white dark:bg-slate-800
            py-2 pl-10 ${
              type === "password" ? "pr-10" : "pr-3"
            }
            text-sm text-gray-900 dark:text-gray-200
            placeholder:text-gray-500 dark:placeholder:text-gray-400
            ${
              error
                ? "border-red-500 focus:outline-red-500"
                : "border-gray-300 focus:outline-indigo-600"
            }`}
        />

        {/* Password Toggle */}
        {type === "password" && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
            aria-label={showPassword ? "Hide password" : "Show password"}
            title={showPassword ? "Hide password" : "Show password"}
          >
            <i
              className={
                showPassword ? "fi fi-rr-eye" : "fi fi-rr-eye-crossed"
              }
            />
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="mt-1 text-xs font-medium text-rose-500 break-words">
          {error.message}
        </p>
      )}
    </div>
  );
};

export default SSInput;