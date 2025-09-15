import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Please enter both email and password");
      return;
    }

    const res = await login(email, password);
    if (!res.success) {
      alert(res.message);
    }
  };

  // Auto redirect after login based on role
  useEffect(() => {
    if (user) {
      if (user.role === "admin") navigate("/admin");
      else if (user.role === "maker") navigate("/maker");
      else if (user.role === "checker") navigate("/checker");
      else navigate("/dashboard");
    }
  }, [user, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-gray-300 px-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-lg p-8 sm:p-10">
        {/* Branding */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-extrabold text-gray-800">
            Exam Prep Portal
          </h1>
          <p className="text-gray-500 mt-2">Sign in to continue</p>
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
                placeholder="Email"
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
              Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
