// src/App.jsx
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import DashBoard from "./pages/DashBoard";
import AdminPage from "./pages/AdminPage";
import MakerPage from "./pages/MakerPage";
import CheckerPage from "./pages/CheckerPage";
import "./App.css"
import CreateQuestion from "./pages/maker/CreateQuestion";
import DraftQuestions from "./pages/maker/DraftQuestions";
import SubmittedQuestions from "./pages/maker/SubmittedQuestions";
import CheckerReview from "./pages/checker/CheckerReview";
import AcceptedQuestions from "./pages/checker/AcceptedQuestions";

function PrivateRoute({ children, role }) {
  const { user, loading } = useAuth();

  // Show loader while checking auth (useful if later you add API auth)
  if (loading)
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );

  // If not logged in → redirect
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If role is provided → check it
  if (role && user.role !== role) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />

          {/* Protected */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashBoard />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <PrivateRoute role="admin">
                <AdminPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/maker"
            element={
              <PrivateRoute role="maker">
                <MakerPage />
              </PrivateRoute>
            }
          >
            <Route index element={<h1>Maker Dashboard</h1>} />
            <Route path="create" element={<CreateQuestion />} />
            <Route path="drafts" element={<DraftQuestions />} />
            <Route path="submitted" element={<SubmittedQuestions />} />
          </Route>

         
            <Route path="/checker" element={<CheckerPage />}>
              <Route path="dashboard" element={<h1>dash</h1>} />
              <Route path="review" element={<CheckerReview/>} />
              <Route path="accepted" element={<AcceptedQuestions/>} />
            </Route>
          

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
