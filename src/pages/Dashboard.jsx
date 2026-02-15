import { useNavigate } from 'react-router-dom';
import { User } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();

  const features = [
    {
      title: 'Charts',
      description: 'Top artists, albums, tracks played by you. View in depth analysis of listening activity and generate a collage to share',
      path: '/charts'
    },
    {
      title: 'Discovery',
      description: 'Find new artists, songs generated for you and recognize a unknown song',
      path: '/discovery'
    },
    {
      title: 'Friends',
      description: 'See your Friends listening activity and compare music taste',
      path: '/friends'
    },
    {
      title: 'Profile',
      description: 'View your profile and recent tracks',
      path: '/profile'
    }
  ];

  return (
    <div className="home-page">
      <div className="home-background" />
      
      <div className="home-container">
        <nav className="home-nav">
          <button 
            onClick={() => navigate('/')}
            className="home-nav-button home-nav-button--active"
          >
            Home
          </button>
          <button 
            onClick={() => navigate('/charts')}
            className="home-nav-button"
          >
            Charts
          </button>
          <button 
            onClick={() => navigate('/friends')}
            className="home-nav-button"
          >
            Friends
          </button>
          <button 
            onClick={() => navigate('/discovery')}
            className="home-nav-button"
          >
            Discovery
          </button>
          <button 
            onClick={() => navigate('/profile')}
            className="home-profile-button"
            aria-label="Profile"
          >
            <User size={32} />
          </button>
        </nav>

        <div className="home-features">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="home-feature-card"
              onClick={() => navigate(feature.path)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(feature.path);
                }
              }}
            >
              <h2 className="home-feature-title">{feature.title}</h2>
              <p className="home-feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
