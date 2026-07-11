import React, { useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router";
import logo from "../Assets/olivarezlogo.png";
import { useNav } from "../context/NavContext";

const navItems = [
  { label: "Home", path: "/" },
  { label: "About", scrollTo: "about" },
  { label: "Services", scrollTo: "services" },
  { label: "Contact", scrollTo: "contact" },
  { label: "Find A Doctor", path: "/FindDoctor" },
  { label: "Book an Appointment", path: "/BookAppointment" },
];

// Shared "growing underline" treatment for every tab — an orange bar
// that expands under the label when that tab is the active one.
const underlineClasses = (active) =>
  `relative pb-1 after:absolute after:left-0 after:-bottom-0.5 after:h-[2px] after:rounded-full after:bg-orange-500 after:transition-all after:duration-300 after:content-[''] ${
    active ? "after:w-full" : "after:w-0"
  }`;

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { activeSection } = useNav();

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e) => {
      if (headerRef.current && !headerRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  // Home/About/Services/Contact all "live" on the "/" route, so their
  // active state comes from which section is scrolled into view, not
  // just the URL — that's what lets the underline track scrolling.
  const isHomeSectionActive = (sectionKey) =>
    location.pathname === "/" && activeSection === sectionKey;

  const handleHomeClick = (e) => {
    if (location.pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleScrollClick = (targetId) => (e) => {
    e.preventDefault();
    setMenuOpen(false);
    if (location.pathname !== "/") {
      navigate("/", { state: { scrollTo: targetId } });
    } else {
      document
        .getElementById(targetId)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white shadow-sm"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo (left) */}
        <NavLink
          to="/"
          onClick={(e) => {
            if (location.pathname === "/") {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
          className="flex items-center shrink-0"
        >
          <img
            src={logo}
            alt="Logo"
            className="h-[64px] w-auto object-contain"
          />
        </NavLink>

        {/* Nav links (left to right) */}
        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) =>
            item.scrollTo ? (
              <a
                key={item.label}
                href={`/#${item.scrollTo}`}
                onClick={handleScrollClick(item.scrollTo)}
                className={`text-[13px] font-medium text-green-900 transition-colors hover:text-orange-600 ${underlineClasses(
                  isHomeSectionActive(item.scrollTo),
                )}`}
              >
                {item.label}
              </a>
            ) : item.path === "/" ? (
              <NavLink
                key={item.path}
                to={item.path}
                end
                onClick={handleHomeClick}
                className={`text-[13px] font-medium text-green-900 transition-colors hover:text-orange-600 ${underlineClasses(
                  isHomeSectionActive("home"),
                )}`}
              >
                {item.label}
              </NavLink>
            ) : (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `text-[13px] font-medium text-green-900 transition-colors hover:text-orange-600 ${underlineClasses(
                    isActive,
                  )}`
                }
              >
                {item.label}
              </NavLink>
            ),
          )}
        </nav>

        {/* Mobile menu toggle */}
        <label className="btn btn-circle swap swap-rotate bg-white text-green-700 shadow-none md:hidden">
          <input
            type="checkbox"
            checked={menuOpen}
            onChange={() => setMenuOpen((prev) => !prev)}
          />
          <svg
            className="swap-off fill-current"
            xmlns="http://www.w3.org/2000/svg"
            width="30"
            height="30"
            viewBox="0 0 512 512"
          >
            <path d="M64,384H448V341.33H64Zm0-106.67H448V234.67H64ZM64,128v42.67H448V128Z" />
          </svg>
          <svg
            className="swap-on fill-current"
            xmlns="http://www.w3.org/2000/svg"
            width="30"
            height="30"
            viewBox="0 0 512 512"
          >
            <polygon points="400 145.49 366.51 112 256 222.51 145.49 112 112 145.49 222.51 256 112 366.51 145.49 400 256 289.49 366.51 400 400 366.51 289.49 256 400 145.49" />
          </svg>
        </label>
      </div>

      {/* Mobile nav — overlays instead of pushing content down */}
      {menuOpen && (
        <nav className="absolute left-0 top-full z-30 flex w-full flex-col items-center gap-1 border-t border-gray-200 bg-white px-4 py-3 md:hidden">
          {navItems.map((item, index) =>
            item.scrollTo ? (
              <a
                key={item.label}
                href={`/#${item.scrollTo}`}
                onClick={handleScrollClick(item.scrollTo)}
                style={{ animationDelay: `${index * 80}ms` }}
                className={`animate-drop-in w-full rounded-md px-3 py-2 text-center text-[13px] font-medium text-green-900 hover:bg-green-950/10 ${
                  isHomeSectionActive(item.scrollTo) ? "bg-green-800/10" : ""
                }`}
              >
                <span className={underlineClasses(isHomeSectionActive(item.scrollTo))}>
                  {item.label}
                </span>
              </a>
            ) : item.path === "/" ? (
              <NavLink
                key={item.path}
                to={item.path}
                end
                onClick={(e) => {
                  setMenuOpen(false);
                  handleHomeClick(e);
                }}
                style={{ animationDelay: `${index * 80}ms` }}
                className={`animate-drop-in w-full rounded-md px-3 py-2 text-center text-[13px] font-medium text-green-900 hover:bg-green-950/10 ${
                  isHomeSectionActive("home") ? "bg-green-800/10" : ""
                }`}
              >
                <span className={underlineClasses(isHomeSectionActive("home"))}>
                  {item.label}
                </span>
              </NavLink>
            ) : (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMenuOpen(false)}
                style={{ animationDelay: `${index * 80}ms` }}
                className={({ isActive }) =>
                  `animate-drop-in w-full rounded-md px-3 py-2 text-center text-[13px] font-medium ${
                    isActive
                      ? "bg-green-800/10 text-green-900"
                      : "text-green-900 hover:bg-green-950/10"
                  }`
                }
              >
                {({ isActive }) => (
                  <span className={underlineClasses(isActive)}>{item.label}</span>
                )}
              </NavLink>
            ),
          )}
        </nav>
      )}
    </header>
  );
};

export default Header;