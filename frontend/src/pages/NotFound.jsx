import { Link } from 'react-router-dom';
import { IoHomeOutline } from 'react-icons/io5';
import Header from '../components/Header';

const NotFound = () => {
  return (
    <div className="home-container">
        <main className="not-found-content">
          <div className="not-found-card">
            <h1>404</h1>
            <h2>Page Not Found</h2>
            <p>The page you're looking for doesn't exist or has been moved.</p>
            <Link to="/" className="back-home-button">
              <IoHomeOutline />
              Back to Home
            </Link>
          </div>
        </main>
    </div>
  );
};

export default NotFound;