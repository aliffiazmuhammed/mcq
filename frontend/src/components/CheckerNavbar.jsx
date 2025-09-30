import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // Assuming you have an AuthContext
import { useState } from "react";
import { HiMenu, HiX } from "react-icons/hi";

export default function CheckerNavbar() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  // Navigation items for the Checker role
  const menuItems = [
    { name: "Review Questions", path: "/checker/review", icon: "📝" },
    { name: "Reviewd Questions", path: "/checker/accepted", icon: "✅" },
    { name: "Question Papers", path: "/checker/claimed-pdfs", icon: "📗" },
    { name: "Dashboard", path: "/checker/dashboard", icon: "📊" },
  ];

  return (
    <nav className="bg-white shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo and Role */}
          <div className="flex-shrink-0">
            <NavLink to="/checker" className="text-2xl font-bold text-blue-600">
              MCQ Portal
            </NavLink>
            <p className="text-xs text-gray-500 -mt-1">Role: {user?.role}</p>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {menuItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium transition ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`
                  }
                >
                  {item.name}
                </NavLink>
              ))}
              <button
                onClick={() => logout(navigate)}
                className="ml-4 px-3 py-2 rounded-md text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 transition"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 focus:outline-none"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <HiX className="block h-6 w-6" />
              ) : (
                <HiMenu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="md:hidden border-t">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-md text-base font-medium transition ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`
                }
              >
                {item.name}
              </NavLink>
            ))}
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="px-2">
              <button
                onClick={() => {
                  setIsOpen(false);
                  logout(navigate);
                }}
                className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-red-600 bg-red-50 hover:bg-red-100 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
