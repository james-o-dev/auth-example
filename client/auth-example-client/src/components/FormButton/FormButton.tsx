interface FormButtonProps {
  text: string;
  disabled?: boolean;
  isSubmitting?: boolean;
  isSubmittingText?: string;
  fullWidth?: boolean;
}

const FormButton = ({ text, disabled, isSubmitting, isSubmittingText, fullWidth }: FormButtonProps) => {

  const className = fullWidth ? 'w-full' : 'w-fit'

  return (
    <button className={className} disabled={disabled || isSubmitting} type='submit'>
      {isSubmitting ? isSubmittingText : text}
    </button>
  )
}

export default FormButton