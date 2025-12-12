import React from "react";
import HeroBanner from "../components/common/HeroBanner";
import LatestCollection from "../components/common/LatestCollection";
import BestSeller from "../components/common/BestSeller";
import OurPolicy from "../components/common/OurPolicy";
import NewsLetter from "../components/common/NewsLetter";
import Partners from "../components/common/Partners";

const Home = () => {
  return (
    <div>
      <div className="fade-in-up" data-testid="home-hero-section">
        <HeroBanner />
      </div>
      <div className="fade-in-up" data-testid="home-latest-section">
        <LatestCollection />
      </div>
      <div className="fade-in-up" data-testid="home-bestseller-section">
        <BestSeller />
      </div>
      <div className="fade-in-up" data-testid="home-policy-section">
        <OurPolicy />
      </div>
      <div className="fade-in-up" data-testid="home-newsletter-section">
        <NewsLetter />
      </div>
      <div className="fade-in-up" data-testid="home-partners-section">
        <Partners />
      </div>
    </div>
  );
};

export default Home;
