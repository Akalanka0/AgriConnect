import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/Home.module.css';

// Component imports
import NavBar from '@/features/home/components/NavBar';
import HeroSection from '@/features/home/components/HeroSection';
import FeaturesSection from '@/features/home/components/FeaturesSection';
import StakeholdersSection from '@/features/home/components/StakeholdersSection';
import VisionMissionSection from '@/features/home/components/VisionMissionSection';
import CTASection from '@/features/home/components/CTASection';
import Footer from '@/features/home/components/Footer';

/**
 * Home Page Component
 * Centralized landing page for AgriConnect
 */
const Home = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  // Callbacks for interactions
  const handleMenuToggle = useCallback(() => {
    setMenuOpen(prev => !prev);
  }, []);

  const handleCloseMenu = useCallback(() => {
    setMenuOpen(false);
  }, []);

  const handleLoginClick = useCallback(() => {
    handleCloseMenu();
    navigate('/login');
  }, [navigate, handleCloseMenu]);

  const handleRegisterClick = useCallback(() => {
    handleCloseMenu();
    navigate('/login?show=register');
  }, [navigate, handleCloseMenu]);

  return (
    <div className={styles.homePage}>
      <NavBar
        menuOpen={menuOpen}
        onMenuToggle={handleMenuToggle}
        onNavigate={handleLoginClick}
      />

      <HeroSection
        onLoginClick={handleLoginClick}
        onRegisterClick={handleRegisterClick}
      />

      <FeaturesSection />

      <StakeholdersSection />

      <VisionMissionSection />

      <CTASection
        onLoginClick={handleLoginClick}
        onRegisterClick={handleRegisterClick}
      />

      <Footer />
    </div>
  );
};

export default Home;