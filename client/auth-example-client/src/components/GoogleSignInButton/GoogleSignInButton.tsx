import './GoogleSignInButton.css'
import googleLogo from '../../assets/google.svg'

const GoogleSignInButton = ({ onClick }: { onClick: VoidFunction }) => {
  return (
    <button className='gsi-material-button w-full' onClick={onClick}>
      <div className='gsi-material-button-state'></div>
      <div className='gsi-material-button-content-wrapper'>
        <div className='gsi-material-button-icon'>
          <img src={googleLogo} alt='Google' />
        </div>
        <span className='gsi-material-button-contents'>Sign in with Google</span>
        <span className='hidden'>Sign in with Google</span>
      </div>
    </button>
  )
}

export default GoogleSignInButton