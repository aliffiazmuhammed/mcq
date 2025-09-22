import React, { useEffect, useState } from "react";
import { host } from "../../utils/APIRoutes";

function ShowAllUsersPage() {
  const [users, setUsers] = useState({ makers: [], checkers: [] });
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You must be logged in as admin");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${host}/api/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Failed to fetch users");
      } else {
        setUsers({ makers: data.makers, checkers: data.checkers });
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      alert("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (role, id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${host}/api/admin/user/${role}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Failed to delete user");
      } else {
        alert(data.message);
        fetchUsers(); // Refresh the list
      }
    } catch (err) {
      console.error("Error deleting user:", err);
      alert("Failed to delete user");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-lg shadow-md mt-6">
      <h1 className="text-2xl font-bold mb-6 text-center">All Users</h1>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {["makers", "checkers"].map((role) => (
            <div key={role} className="mb-6">
              <h2 className="text-xl font-semibold mb-3 capitalize">{role}</h2>
              {users[role].length === 0 ? (
                <p className="text-gray-500">No {role} found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-200 rounded">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 border">#</th>
                        <th className="px-4 py-2 border">Name</th>
                        <th className="px-4 py-2 border">Email</th>
                        <th className="px-4 py-2 border">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users[role].map((user, idx) => (
                        <tr key={user._id} className="text-center">
                          <td className="px-4 py-2 border">{idx + 1}</td>
                          <td className="px-4 py-2 border">{user.name}</td>
                          <td className="px-4 py-2 border">{user.email}</td>
                          <td className="px-4 py-2 border">
                            <button
                              onClick={() =>
                                handleDelete(role.slice(0, -1), user._id)
                              }
                              className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default ShowAllUsersPage;
