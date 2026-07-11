import React, { createContext, useContext, useState } from "react";

/**
 * Tracks which section of the Home page is currently in view ("home",
 * "about", "services", or "contact"). Home.jsx updates this via a scroll
 * spy; Header.jsx reads it to decide which nav tab gets the active
 * underline. Kept in context because Header and Home are siblings, not
 * parent/child.
 */
const NavContext = createContext({
  activeSection: "home",
  setActiveSection: () => {},
});

export const NavProvider = ({ children }) => {
  const [activeSection, setActiveSection] = useState("home");
  return (
    <NavContext.Provider value={{ activeSection, setActiveSection }}>
      {children}
    </NavContext.Provider>
  );
};

export const useNav = () => useContext(NavContext);

export default NavContext;