import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import homePicture from '/home/Home_Picture.png';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');

  const handleGetStarted = () => {
    if (name.trim()) {
      localStorage.setItem('userName', name.trim());
      navigate('/dashboard');
    }
  };

  return (
    <div className="home">
      <img src={homePicture} alt="Home" className="home-picture" />
      <div className="bottom-section">
        <h1 className="welcome-text">WELCOME TO SOS</h1>
        <p className="subtitle">your personal sustainability guide!</p>
        <input
          type="text"
          className="name-input"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="get-started-btn" onClick={handleGetStarted}>
          get started today!
        </button>
      </div>
    </div>
  );
};

export default Home;