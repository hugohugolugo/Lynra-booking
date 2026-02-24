"use client";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Input({ label, error, className = "", id, ...props }: InputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={inputId}
        className="text-xs font-semibold uppercase tracking-wider text-lynra-haze"
      >
        {label}
      </label>
      <input
        id={inputId}
        className={`
          bg-lynra-white border rounded-lg px-4 py-3 text-base text-lynra-obsidian font-body
          placeholder:text-lynra-aluminium
          transition-all duration-150
          focus:outline-none focus:ring-1
          ${error
            ? "border-lynra-ember focus:border-lynra-ember focus:ring-lynra-ember/30"
            : "border-lynra-aluminium focus:border-lynra-granite focus:ring-lynra-granite/20"
          }
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-xs text-lynra-ember mt-0.5">{error}</p>
      )}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function Select({ label, error, options, placeholder, className = "", id, ...props }: SelectProps) {
  const selectId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={selectId}
        className="text-xs font-semibold uppercase tracking-wider text-lynra-haze"
      >
        {label}
      </label>
      <select
        id={selectId}
        className={`
          bg-lynra-white border rounded-lg px-4 py-3 text-base text-lynra-obsidian font-body
          transition-all duration-150 cursor-pointer appearance-none
          focus:outline-none focus:ring-1
          ${error
            ? "border-lynra-ember focus:border-lynra-ember focus:ring-lynra-ember/30"
            : "border-lynra-aluminium focus:border-lynra-granite focus:ring-lynra-granite/20"
          }
          ${className}
        `}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-xs text-lynra-ember mt-0.5">{error}</p>
      )}
    </div>
  );
}
