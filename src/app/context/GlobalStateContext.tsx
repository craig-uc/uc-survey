"use client";

import React, {createContext, ReactNode, useContext, useEffect, useState} from "react";

interface GlobalState {
  user: string | null;
  setUser: (name: string | null) => void;
  lang: string | null;
  setLang: (lang: string | null) => void;
  showTag: boolean;
  setShowTag: (value: boolean) => void;
  showFooter: boolean;
  setShowFooter: (value: boolean) => void;
  showMenu: boolean;
  setShowMenu: (value: boolean) => void;
  showPersonName: boolean;
  setShowPersonName: (value: boolean) => void;
  isHydrated: boolean;
  logout: () => void;
}

const GlobalStateContext = createContext<GlobalState | undefined>(undefined);

export const GlobalStateProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<string | null>(null);
  const [lang, setLang] = useState<string | null>(null);
  const [showTag, setShowTag] = useState(false);
  const [showFooter, setShowFooter] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showPersonName, setShowPersonName] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  const logout = () => {
    setUser(null);
    setShowTag(false);
    setShowFooter(false);
    setShowMenu(false);
    setShowPersonName(false);
    localStorage.removeItem("f");
    localStorage.removeItem("fn");
    localStorage.removeItem("footer");
    localStorage.removeItem("k");
    localStorage.removeItem("l");
    localStorage.removeItem("menu");
    localStorage.removeItem("personName");
    localStorage.removeItem("tag");
    localStorage.removeItem("tagLine");
    localStorage.removeItem("account");
    localStorage.removeItem("title");
    localStorage.removeItem("user");
  };

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedShowTag = localStorage.getItem("tagLine");
    const savedShowFooter = localStorage.getItem("footer");
    const savedShowMenu = localStorage.getItem("menu");
    const savedShowPersonName = localStorage.getItem("personName");

    if (savedUser) setUser(savedUser);
    if (savedShowTag) setShowTag(savedShowTag === "1");
    if (savedShowFooter) setShowFooter(savedShowFooter === "1");
    if (savedShowMenu) setShowMenu(savedShowMenu === "1");
    if (savedShowPersonName) setShowPersonName(savedShowPersonName === "1");

    setIsHydrated(true);
  }, []);

  return (
    <GlobalStateContext.Provider value={{
      user, setUser,
      lang, setLang,
      showTag, setShowTag,
      showFooter, setShowFooter,
      showMenu, setShowMenu,
      showPersonName, setShowPersonName,
      isHydrated, logout,
    }}>
      {children}
    </GlobalStateContext.Provider>
  );
};

export const useGlobalState = () => {
  const context = useContext(GlobalStateContext);
  if (!context) {
    throw new Error("useGlobalState must be used within a GlobalStateProvider");
  }
  return context;
};
