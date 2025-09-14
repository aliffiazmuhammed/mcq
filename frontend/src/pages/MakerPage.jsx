import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";

export default function MakerPage() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 p-6">
        <Outlet /> {/* Nested pages render here */}
      </div>
    </div>
  );
}
