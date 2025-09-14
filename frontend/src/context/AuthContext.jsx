import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // user = { username, role }
  const [loading, setLoading] = useState(false);

  // Dummy users with passwords
  const dummyUsers = [
    { username: "adminUser", password: "admin123", role: "admin" },
    { username: "makerUser", password: "maker123", role: "maker" },
    { username: "checkerUser", password: "checker123", role: "checker" },
  ];

  // Login function with username + password check
  const login = (username, password, role) => {
    setLoading(true);

    setTimeout(() => {
      const foundUser = dummyUsers.find(
        (u) =>
          u.username === username && u.password === password && u.role === role
      );

      if (foundUser) {
        setUser(foundUser);
      } else {
        alert("Invalid credentials. Please try again.");
        setUser(null);
      }
      setLoading(false);
    }, 1000); // simulate API delay
  };

  // Logout function
  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
