interface SignInCardProps {
  /**
   * Title for the card.
   */
  title: string;
  children: React.ReactNode;
}

/**
 * Shared 'card' used for sign-up/sign-in purposes.
 *
 * @param {SignInCardProps} props
 */
const SignInCard = ({ children, title }: SignInCardProps) => {
  return (
    <div className='max-w-sm mx-auto border rounded p-4 bg-neutral-100 dark:bg-neutral-600 dark:border-none'>
      <h2 className='text-center'>{title}</h2>
      <hr />
      <br />
      {children}
    </div>
  )
}

export default SignInCard