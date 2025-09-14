import CheckerSidebar from "../components/CheckerSidebar";
import { Outlet } from "react-router-dom";

export default function CheckerPage() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <CheckerSidebar />
      <div className="flex-1 p-6">
        <Outlet /> 
      </div>
    </div>
  );
}
