import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import { HiMenu, HiX } from "react-icons/hi";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Sidebar menu items (Maker-specific)
  const menuItems = [
    { name: "Create Question", path: "/maker/create", icon: "➕" },
    { name: "Draft Questions", path: "/maker/drafts", icon: "📝" },
    { name: "Submitted Questions", path: "/maker/submitted", icon: "📤" },
    { name: "Availabe Pdfs", path: "/maker/availabe-pdfs", icon: "📚" },
    { name: "Claimed Pdfs", path: "/maker/claimed-pdfs", icon: "🧾" },
  ];
const navigate = useNavigate();
  return (
    <>
      {/* Mobile Toggle Button (top-left) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="sm:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow-md border border-gray-200"
      >
        {isOpen ? <HiX size={22} /> : <HiMenu size={22} />}
      </button>

      {/* Sidebar (desktop & mobile) */}
      <div
        className={`fixed sm:static top-0 left-0 h-full w-64 bg-white shadow-lg flex flex-col transform transition-transform duration-300 z-40
        ${isOpen ? "translate-x-0" : "-translate-x-full sm:translate-x-0"}`}
      >
        {/* Brand / Logo */}
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-blue-600">MCQ Portal</h1>
          <p className="text-sm text-gray-500 mt-1">Role: {user?.role}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-3">
            {menuItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={() => setIsOpen(false)} // close on mobile
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                      isActive
                        ? "bg-blue-600 text-white shadow"
                        : "text-gray-700 hover:bg-gray-100"
                    }`
                  }
                >
                  <span>{item.icon}</span>
                  {item.name}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t">
          <button
            onClick={() => logout(navigate)}
            className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Overlay for mobile when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black opacity-40 sm:hidden z-30"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </>
  );
}
