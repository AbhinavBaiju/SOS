import './Header.css';
import { useNavigate, useLocation } from 'react-router-dom';
import headerLogo from '/header/Header_Logo.png';
import headerBack from '/header/Header_Back.png';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    if (location.pathname === '/dashboard') {
      localStorage.removeItem('userName');
      navigate('/home');
    } else if (location.pathname === '/scan') {
      navigate('/dashboard');
    }
  };

  const showBackButton = location.pathname !== '/home';

  return (
    <div className="header">
      {showBackButton && (
        <img
          src={headerBack}
          alt="Back"
          className="header-back"
          onClick={handleBack}
        />
      )}
      <img src={headerLogo} alt="SOS Logo" className="header-logo" />
      <div className="header-line" />
    </div>
  );
}