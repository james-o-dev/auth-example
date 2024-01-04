interface FormButtonProps {
  text: string;
  disabled?: boolean;
  isSubmitting?: boolean;
  isSubmittingText?: string;
  fullWidth?: boolean;
  type?: 'submit' | 'button';
  onClick?: () => void;
}

const FormButton = ({ text, disabled, isSubmitting, isSubmittingText, fullWidth, type = 'button', onClick }: FormButtonProps) => {

  const className = fullWidth ? 'w-full' : 'w-fit'

  return (
    <button className={className} disabled={disabled || isSubmitting} type={type} onClick={onClick}>
      {isSubmitting ? isSubmittingText : text}
    </button>
  )
}

export default FormButton