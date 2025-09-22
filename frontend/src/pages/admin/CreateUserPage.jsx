import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { host } from "../../utils/APIRoutes";

function CreateUserPage() {
  const { user } = useAuth(); // Current admin user
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "maker",
  });
  const token = localStorage.getItem("token");
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      alert("Please fill all fields");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${host}/api/admin/create-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // send admin JWT
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to create user");
      } else {
        alert(data.message);

        // Reset form
        setFormData({ name: "", email: "", password: "", role: "maker" });
      }
    } catch (err) {
      console.error("Error creating user:", err);
      alert("Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md relative mt-6">
      <h1 className="text-2xl font-bold mb-6 text-center">Create New User</h1>

      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-70 flex justify-center items-center z-50 rounded-lg">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={formData.name}
            onChange={handleInputChange}
            className="border px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleInputChange}
            className="border px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleInputChange}
            className="border px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            name="role"
            value={formData.role}
            onChange={handleInputChange}
            className="border px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="maker">Maker</option>
            <option value="checker">Checker</option>
          </select>
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition mt-4"
        >
          Create User
        </button>
      </form>
    </div>
  );
}

export default CreateUserPage;
