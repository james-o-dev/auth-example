export interface FormInputProps {
  value: string;
  label: string;
  name: string;
  setValue: (value: string) => void;
  required?: boolean;
  type?: string;
  autoComplete?: string;
  /**
   * Tailwind min-w-[px] class with arbritrary format; e.g. `'min-w-[120px]'`
   * @example
   * 'min-w-[120px]'
   */
  minLabelWidth?: string;
  inputWidth?: string;
}

const FormInput = ({ value, setValue, required, type, name, autoComplete, minLabelWidth, label }: FormInputProps) => {

  const labelClassName = [
    'mr-1 sm:text-right',
    minLabelWidth,
  ].join(' ')

  const inputClassName = [
    'w-full',
    'sm:max-w-64',
  ].join(' ')

  return (
    <label className='flex-col sm:flex-row flex sm:items-center' htmlFor={name}>
      <div className={labelClassName}>{label}</div>
      <input
        className={inputClassName}
        required={required}
        type={type || 'text'}
        name={name}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => setValue(e.target.value)} />
    </label>
  )
}

export default FormInput