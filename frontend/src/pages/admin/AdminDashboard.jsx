import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
// The local import for 'host' has been inlined to prevent compilation errors.
import { host } from "../../utils/APIRoutes";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// --- Reusable Components ---
const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-white p-6 rounded-lg shadow-md flex items-center gap-4">
    <div
      className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}
    >
      <span className="text-2xl">{icon}</span>
    </div>
    <div>
      <p className="text-gray-500 text-sm font-medium">{title}</p>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

const PerformanceTable = ({ title, headers, data, dataKeys }) => (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <h2 className="text-xl font-bold text-gray-800 mb-4">{title}</h2>
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-4 py-3">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data &&
            data.map((row, index) => (
              <tr key={index} className="bg-white border-b hover:bg-gray-50">
                {dataKeys.map((key) => (
                  <td
                    key={key}
                    className={`px-4 py-4 ${
                      key === dataKeys[0]
                        ? "font-medium text-gray-900"
                        : "text-center"
                    }`}
                  >
                    {row[key]}
                  </td>
                ))}
              </tr>
            ))}
          {(!data || data.length === 0) && (
            <tr>
              <td
                colSpan={headers.length}
                className="text-center py-10 text-gray-500"
              >
                No data available for this period.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

// --- Main Dashboard Component ---
export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState("weekly");
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = { timeframe };

      if (timeframe === "custom" && startDate && endDate) {
        params.startDate = startDate.toISOString();
        params.endDate = endDate.toISOString();
      }

      const res = await axios.get(`${host}/api/admin/dashboard-stats`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setDashboardData(res.data);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, [timeframe, startDate, endDate]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleTimeframeChange = (newTimeframe) => {
    setTimeframe(newTimeframe);
    if (newTimeframe !== "custom") {
      setDateRange([null, null]);
    }
  };

  const COLORS = {
    Approved: "#10B981",
    Rejected: "#EF4444",
    Pending: "#F59E0B",
    Draft: "#6B7280",
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header and Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">
            System-wide performance overview.
          </p>
        </div>
        <div className="flex items-center gap-2 mt-4 sm:mt-0 flex-wrap">
          {["weekly", "monthly", "all"].map((tf) => (
            <button
              key={tf}
              onClick={() => handleTimeframeChange(tf)}
              className={`px-3 py-1.5 text-sm font-semibold rounded-md ${
                timeframe === tf
                  ? "bg-blue-600 text-white"
                  : "bg-white hover:bg-gray-100 border"
              }`}
            >
              {tf.charAt(0).toUpperCase() + tf.slice(1)}
            </button>
          ))}
          <DatePicker
            selectsRange={true}
            startDate={startDate}
            endDate={endDate}
            onChange={(update) => {
              setDateRange(update);
              handleTimeframeChange("custom");
            }}
            isClearable={true}
            placeholderText="Select custom date range"
            className={`px-3 py-1.5 text-sm font-semibold rounded-md w-48 border text-center ${
              timeframe === "custom"
                ? "bg-blue-600 text-white placeholder-gray-200 ring-2 ring-blue-300"
                : "bg-white"
            }`}
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      ) : !dashboardData ? (
        <div className="text-center py-20 text-red-500">
          Failed to load dashboard data.
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            <StatCard
              title="Total Created"
              value={dashboardData.summary.totalQuestions}
              icon="📚"
              color="bg-gray-100"
            />
            <StatCard
              title="Approved"
              value={dashboardData.summary.totalApproved}
              icon="✅"
              color="bg-green-100"
            />
            <StatCard
              title="Rejected"
              value={dashboardData.summary.totalRejected}
              icon="❌"
              color="bg-red-100"
            />
            <StatCard
              title="Pending"
              value={dashboardData.summary.totalPending}
              icon="⏳"
              color="bg-yellow-100"
            />
          </div>

          {/* Charts and Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Question Status Distribution
              </h2>
              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={dashboardData.statusDistribution}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} (${(percent * 100).toFixed(0)}%)`
                      }
                    >
                      {dashboardData.statusDistribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[entry.status] || "#8884d8"}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="lg:col-span-3">
              <PerformanceTable
                title="Top Maker Performance"
                headers={[
                  "Maker",
                  "Created",
                  "Approved",
                  "Pending",
                  "Drafted",
                  "Hist. Rejections",
                ]}
                data={dashboardData.makerPerformance}
                dataKeys={[
                  "name",
                  "totalCreated",
                  "approved",
                  "pending",
                  "drafted",
                  "historicalRejections",
                ]}
              />
            </div>
          </div>
          <PerformanceTable
            title="Checker Performance"
            headers={[
              "Checker",
              "Total Reviewed",
              "Approved",
              "Rejected",
              "False Rejections",
            ]}
            data={dashboardData.checkerPerformance}
            dataKeys={[
              "name",
              "totalReviewed",
              "approved",
              "rejected",
              "falseRejections",
            ]}
          />
        </>
      )}
    </div>
  );
}
