import MakerNavbar from "../components/MakerNavbar";
import { Outlet } from "react-router-dom";

export default function MakerPage() {
  return (
      <div className="min-h-screen bg-gray-50">
        <MakerNavbar />
        <main>
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            {/* The main content for each route will be rendered here */}
            <Outlet />
          </div>
        </main>
      </div>
    );
}
