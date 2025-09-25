import { useEffect, useState } from "react";
import axios from "axios";
// The local import for 'host' has been inlined to prevent compilation errors.
 import { host } from "../../utils/APIRoutes";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Pie } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

// --- Helper Components ---

const StatCard = ({ title, value, icon }) => (
  <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
    </div>
    <div className="text-4xl text-blue-500">{icon}</div>
  </div>
);

const StatusPieChart = ({ data }) => {
  const chartData = {
    labels: data.map((d) => d.status),
    datasets: [
      {
        data: data.map((d) => d.count),
        backgroundColor: [
          "#34D399", // Approved (Green)
          "#F87171", // Rejected (Red)
          "#FBBF24", // Pending (Yellow)
          "#9CA3AF", // Draft (Gray)
        ],
        borderColor: "#ffffff",
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Question Status Distribution",
        font: { size: 18 },
      },
    },
  };

  return <Pie data={chartData} options={options} />;
};

// --- Main Component ---

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${host}/api/admin/dashboard-stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(res.data);
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
        setError(
          "Failed to load dashboard data. You may not have admin privileges."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 text-red-600 font-semibold">
        {error}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-20 text-gray-500">
        No dashboard data available.
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-gray-800">Admin Dashboard</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Questions"
            value={stats.summary.totalQuestions}
            icon="📊"
          />
          <StatCard
            title="Approved"
            value={stats.summary.totalApproved}
            icon="✅"
          />
          <StatCard
            title="Rejected"
            value={stats.summary.totalRejected}
            icon="❌"
          />
          <StatCard
            title="Pending Review"
            value={stats.summary.totalPending}
            icon="⏳"
          />
        </div>

        {/* Charts & Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Pie Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
            <StatusPieChart data={stats.statusDistribution} />
          </div>

          {/* Performance Tables */}
          <div className="lg:col-span-3 space-y-8">
            {/* Maker Performance - UPDATED TABLE */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Top Maker Productivity
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                    <tr>
                      <th className="p-3">Maker Name</th>
                      <th className="p-3 text-center text-green-600">
                        Approved
                      </th>
                      <th className="p-3 text-center text-red-600">Rejected</th>
                      <th className="p-3 text-center text-yellow-600">
                        Pending
                      </th>
                      <th className="p-3 text-center">Total Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.makerPerformance.map((maker, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{maker.makerName}</td>
                        <td className="p-3 text-center font-bold text-green-600">
                          {maker.approved}
                        </td>
                        <td className="p-3 text-center font-bold text-red-600">
                          {maker.rejected}
                        </td>
                        <td className="p-3 text-center font-bold text-yellow-600">
                          {maker.pending}
                        </td>
                        <td className="p-3 text-center font-bold">
                          {maker.totalSubmitted}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Checker Performance */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Top Checker Activity
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                    <tr>
                      <th className="p-3">Checker Name</th>
                      <th className="p-3 text-center text-green-600">
                        Approved
                      </th>
                      <th className="p-3 text-center text-red-600">Rejected</th>
                      <th className="p-3 text-center">Total Reviewed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.checkerPerformance.map((checker, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">
                          {checker.checkerName}
                        </td>
                        <td className="p-3 text-center font-bold text-green-600">
                          {checker.approved}
                        </td>
                        <td className="p-3 text-center font-bold text-red-600">
                          {checker.rejected}
                        </td>
                        <td className="p-3 text-center font-bold">
                          {checker.totalReviewed}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
