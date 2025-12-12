import React from "react";
import { Link } from "react-router-dom";
import { assets } from "../../assets/assets";

const HeroBanner = () => {
  return (
    <div className="relative group overflow-hidden rounded-lg shadow-inner" data-testid="hero-banner">
      {/* Background Image */}
      <img
        src={assets.landingPage_bg}
        alt="Hero Banner"
        className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-110"
      />

      {/* Inner Shadow */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"></div>

      <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

      {/* Text Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 sm:px-8 lg:px-16 text-white">
        <div className="flex items-center gap-2 mb-2">
          <p className="w-8 md:w-11 h-[2px] bg-white"></p>
          <p className="font-medium text-sm md:text-base">Lewis Store</p>
          <p className="w-8 md:w-11 h-[2px] bg-white"></p>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 text-red-700" style={{ WebkitTextStroke: "1px #ffffff" }}>
          Welcome
        </h1>

        {/* SHOP NOW Button */}
        <Link
          to="/collection"
          className="px-4 py-2 rounded-full border-2 border-black bg-white text-black hover:bg-black hover:text-white transition"
          data-testid="hero-shop-now"
        >
          SHOP NOW
        </Link>
      </div>
    </div>
  );
};

export default HeroBanner;
