import { Link } from 'react-router-dom';

const Protected = () => {
  return (
    <>
      <h1>This route is protected!</h1>
      <Link to="/">Go back to the homepage</Link>
    </>
  );
}

export default Protected;