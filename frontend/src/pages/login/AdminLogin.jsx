import { useAuth } from "../../context/AuthContext";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

 const handleLogin = async () => {
   if (!email || !password) return alert("Enter email & password");

   const res = await login(email, password, "admin");
   if (!res.success) return alert(res.message);
   navigate("/checker");
 };

  // Auto redirect only if role is admin
  useEffect(() => {
    if (user) {
      if (user.role === "admin") {
        navigate("/admin");
      } else {
        alert("Access denied! Only admins can log in here.");
      }
    }
  }, [user, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-gray-300 px-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-lg p-8 sm:p-10">
        {/* Branding */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-extrabold text-gray-800">Admin Login</h1>
          <p className="text-gray-500 mt-2">
            Sign in with your admin credentials
          </p>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* Input Fields */}
            <div className="flex flex-col gap-4 mb-6">
              <input
                type="email"
                placeholder="Admin Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Login Button */}
            <button
              onClick={handleLogin}
              className="w-full py-3 rounded-lg bg-blue-600 text-white font-semibold shadow-md hover:bg-blue-700 transition"
            >
              Login as Admin
            </button>
          </>
        )}
      </div>
    </div>
  );
}
