import React, { useState, useRef, useEffect, useContext } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ShopContext } from "../../context/ShopContext";
import { assets } from "../../assets/assets";
import AuthPopup from "../AuthPopup";

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [searchValue, setSearchValue] = useState("");

  const {
    setSearch,
    setShowSearch,
    showSearch,
    mobileSearchOpen,
    setMobileSearchOpen,
    isAdmin,
    userName,
    logout,
    basketCount,
  } = useContext(ShopContext);

  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef(null);
  const userRef = useRef(null);

  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearch(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (userRef.current && !userRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
  }, [mobileMenuOpen]);

  useEffect(() => {
    setShowSearch(false);
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
    setAuthOpen(false);
  }, [location.pathname]);

  const openAuthPopup = (mode) => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  const navLinks = [
    { path: "/", label: "Home" },
    { path: "/collection", label: "Collection" },
    { path: "/about", label: "About" },
    { path: "/contact", label: "Contact" },
  ];

  return (
    <>
      {/* NAVBAR */}
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 w-full bg-white z-50 transition-all",
          scrolled ? "shadow-md border-b" : "shadow-sm"
        )}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link to="/" className="flex-shrink-0" data-testid="nav-logo">
              <img
                src={assets.LewisStore_Logo}
                className="w-32 md:w-32 h-full transition-all duration-300 hover:scale-110 hover:drop-shadow-[0_0_2px_red]"
                alt="Logo"
              />
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={({ isActive }) =>
                    cn(
                      "text-sm hover:text-gray-800 transition-all",
                      isActive && "font-semibold text-gray-900"
                    )
                  }
                  data-testid={`nav-link-${link.label.toLowerCase()}`}
                >
                  {link.label}
                </NavLink>
              ))}
            </div>

            {/* Right Icons */}
            <div className="flex items-center gap-4 relative">
              {/* Desktop Search */}
              <div
                ref={searchRef}
                className="hidden sm:flex items-center relative"
              >
                <button
                  onClick={() => setShowSearch((v) => !v)}
                  className="p-1 hover:scale-105 rounded-full"
                  data-testid="nav-search-toggle"
                >
                  <img src={assets.search_icon} alt="" className="w-6 h-6" />
                </button>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setSearch(searchValue);
                    setShowSearch(true);
                    navigate("/collection");
                  }}
                  className={cn(
                    "absolute right-0 top-full mt-2 h-10 flex items-center transition-all duration-300 z-50",
                    showSearch
                      ? "w-72 md:w-96 opacity-100"
                      : "w-0 opacity-0 overflow-hidden"
                  )}
                  data-testid="nav-search-form"
                >
                  <div className="flex w-full items-center bg-white border border-gray-300 rounded-full shadow-sm">
                    <span className="pl-3">
                      <img src={assets.search_icon} className="w-4 h-4" />
                    </span>
                    <input
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      placeholder="Search products"
                      className="flex-1 px-3 py-2 bg-transparent focus:outline-none"
                      data-testid="nav-search-input"
                    />
                    <button
                      className="h-10 px-4 bg-red-600 text-white rounded-r-full flex justify-center items-center shadow-md hover:bg-red-700 transition-colors duration-200"
                      data-testid="nav-search-submit"
                    >
                      Search
                    </button>
                  </div>
                </form>
              </div>

              {/* User Menu */}
              <div
                ref={userRef}
                className="relative hidden sm:flex items-center"
              >
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="p-1 hover:scale-105 rounded-full"
                  data-testid="nav-user-toggle"
                >
                  <img src={assets.user_icon} className="w-6 h-6" alt="" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-2 top-10 w-56 bg-white border rounded-xl shadow-lg z-50">
                    {userName ? (
                      <div className="py-2">
                        <div className="px-4 py-2 text-sm text-gray-600">
                          {userName}
                        </div>

                        <Link
                          to="/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="block px-4 py-2 hover:bg-gray-100"
                          data-testid="nav-user-profile"
                        >
                          Profile
                        </Link>

                        {isAdmin && (
                          <>
                            <Link
                              to="/admin/products"
                              onClick={() => setUserMenuOpen(false)}
                              className="block px-4 py-2 hover:bg-gray-100"
                              data-testid="nav-admin-products"
                            >
                              Admin Products
                            </Link>

                            <Link
                              to="/admin/orders"
                              onClick={() => setUserMenuOpen(false)}
                              className="block px-4 py-2 hover:bg-gray-100"
                              data-testid="nav-admin-orders"
                            >
                              Admin Orders
                            </Link>

                            <Link
                              to="/admin/reports"
                              onClick={() => setUserMenuOpen(false)}
                              className="block px-4 py-2 hover:bg-gray-100"
                              data-testid="nav-admin-reports"
                            >
                              Admin Reports
                            </Link>
                          </>
                        )}

                        <button
                          onClick={() => {
                            logout();
                            setUserMenuOpen(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
                          data-testid="nav-logout"
                        >
                          Logout
                        </button>
                      </div>
                    ) : (
                      <div>
                        <Link
                          to="/auth/login"
                          onClick={() => setUserMenuOpen(false)}
                          className="block px-4 py-2 hover:bg-gray-100 rounded-t-xl"
                          data-testid="nav-user-login"
                        >
                          Login
                        </Link>
                        <Link
                          to="/auth/register"
                          onClick={() => setUserMenuOpen(false)}
                          className="block px-4 py-2 hover:bg-gray-100 rounded-b-xl"
                          data-testid="nav-user-register"
                        >
                          Register
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Cart */}
              <Link to="/cart" className="relative" data-testid="nav-cart-link">
                <img src={assets.cart_icon} className="w-6 h-6" />
                {basketCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full h-5 min-w-[20px] flex items-center justify-center">
                    {basketCount}
                  </span>
                )}
              </Link>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="sm:hidden p-1"
                data-testid="nav-mobile-open"
              >
                <img src={assets.menu_icon} className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* MOBILE MENU */}
      <div
        className={cn(
          "fixed top-0 right-0 bottom-0 z-50 bg-white transition-all duration-300",
          mobileMenuOpen ? "w-full" : "w-0"
        )}
      >
        <div className="flex flex-col h-full">
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-4 p-6 hover:bg-gray-100"
            data-testid="nav-mobile-back"
          >
            <img src={assets.dropdown_icon} className="h-4 rotate-90" />
            <span>Back</span>
          </button>

          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                cn(
                  "py-4 px-6 border-b hover:bg-gray-100",
                  isActive && "font-semibold bg-gray-100"
                )
              }
            >
              {link.label.toUpperCase()}
            </NavLink>
          ))}

          {/* MOBILE SEARCH */}
          <div className="px-6 mt-4">
            <button
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="w-full flex items-center justify-center gap-2 bg-gray-200 py-2 rounded-lg"
              data-testid="nav-mobile-search-toggle"
            >
              <img src={assets.search_icon} className="w-5 h-5" />
              Search
            </button>

            {mobileSearchOpen && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSearch(searchValue);
                  setShowSearch(true);
                  navigate("/collection");
                  setMobileSearchOpen(false);
                  setMobileMenuOpen(false);
                }}
                className="mt-2"
                data-testid="nav-mobile-search-form"
              >
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="Search products..."
                  className="w-full border rounded-lg px-3 py-2"
                  data-testid="nav-mobile-search-input"
                />
                <button
                  type="submit"
                  className="w-full mt-2 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700"
                  data-testid="nav-mobile-search-submit"
                >
                  Search
                </button>
              </form>
            )}
          </div>

          {/* MOBILE AUTH */}
          <div className="mt-6 px-6 flex flex-col gap-3">
            {userName ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-3 text-center bg-gray-200 rounded-lg hover:bg-gray-300"
                  data-testid="nav-mobile-profile"
                >
                  Profile
                </Link>

                {/* FULL ADMIN MENU FOR MOBILE */}
                {isAdmin && (
                  <>
                    <Link
                      to="/admin/products"
                      onClick={() => setMobileMenuOpen(false)}
                      className="py-3 text-center bg-gray-200 rounded-lg hover:bg-gray-300"
                      data-testid="nav-mobile-admin-products"
                    >
                      Admin Products
                    </Link>

                    <Link
                      to="/admin/orders"
                      onClick={() => setMobileMenuOpen(false)}
                      className="py-3 text-center bg-gray-200 rounded-lg hover:bg-gray-300"
                      data-testid="nav-mobile-admin-orders"
                    >
                      Admin Orders
                    </Link>

                    <Link
                      to="/admin/reports"
                      onClick={() => setMobileMenuOpen(false)}
                      className="py-3 text-center bg-gray-200 rounded-lg hover:bg-gray-300"
                      data-testid="nav-mobile-admin-reports"
                    >
                      Admin Reports
                    </Link>
                  </>
                )}

                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="py-3 text-center bg-red-600 text-white rounded-lg hover:bg-red-700"
                  data-testid="nav-mobile-logout"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink
                  to="/auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-3 text-center bg-black text-white rounded-lg hover:bg-black/90"
                  data-testid="nav-mobile-login"
                >
                  Login
                </NavLink>
                <NavLink
                  to="/auth/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-3 text-center bg-red-600 text-white rounded-lg hover:bg-red-700"
                  data-testid="nav-mobile-register"
                >
                  Register
                </NavLink>
              </>
            )}
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/10 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <AuthPopup
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        mode={authMode}
      />
    </>
  );
};

export default Navbar;
