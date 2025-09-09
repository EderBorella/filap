import React from 'react';
import NavBar from '../../components/NavBar';
import Hero from '../../components/Hero';
import Footer from '../../components/Footer';
import LanguageToggle from '../../components/LanguageToggle';
import './Home.scss';

const Home: React.FC = () => {
  return (
    <div className="home">
      <NavBar />
      
      <main className="home__main">
        <Hero />
      </main>
      
      <Footer />
      
      {/* Fixed language toggle */}
      <LanguageToggle />
    </div>
  );
};

export default Home;