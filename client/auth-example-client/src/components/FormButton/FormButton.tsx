interface FormButtonProps {
  text: string;
  disabled?: boolean;
  isSubmitting?: boolean;
  isSubmittingText?: string;
  fullWidth?: boolean;
  type?: 'submit' | 'button';
  onClick?: () => void;
  primary?: boolean;
}

const FormButton = ({ text, disabled, isSubmitting, isSubmittingText, fullWidth, type = 'button', onClick, primary }: FormButtonProps) => {

        //   display: 'inline-block',
        //   padding: '2px',
        //   // fontSize: '16px',
        //   textAlign: 'center',
        //   textDecoration: 'none',
        //   cursor: 'pointer',
        //   border: `1px solid ${themeColour}`,
        //   color: '#3498d',
        //   backgroundColor: 'white',
        //   borderRadius: '5px',
        //   transition: 'background-color 0.3s, color 0.3s',
        //   '&:disabled': {
        //     opacity: 0.33,
        //   },

        // Hover
                //   backgroundColor: themeColour,
        //   color: 'white',


  const className = [
    primary ? 'btn-primary' : 'btn',
    fullWidth ? 'w-full' : 'w-fit',
  ].join(' ')

  return (
    <button className={className} disabled={disabled || isSubmitting} type={type} onClick={onClick}>
      {isSubmitting ? isSubmittingText : text}
    </button>
  )
}

export default FormButton