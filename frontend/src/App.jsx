// src/App.jsx
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AdminLogin from "./pages/login/AdminLogin";
import AdminPage from "./pages/AdminPage";
import MakerPage from "./pages/MakerPage";
import CheckerPage from "./pages/CheckerPage";
import "./App.css"
import CreateQuestion from "./pages/maker/CreateQuestion";
import DraftQuestions from "./pages/maker/DraftQuestions";
import SubmittedQuestions from "./pages/maker/SubmittedQuestions";
import CheckerReview from "./pages/checker/CheckerReview";
import AcceptedQuestions from "./pages/checker/AcceptedQuestions";
import CheckerLogin from "./pages/login/CheckerLogin";
import MakerLogin from "./pages/login/MakerLogin";
import PdfUploadPage from "./pages/admin/PdfUploadPage";
import CreateUserPage from "./pages/admin/CreateUserPage";
import ShowallUsersPage from "./pages/admin/ShowallUsersPage";
import PdfListPage from "./pages/admin/PdfListPage";

function PrivateRoute({ children, role }) {
  const { user, loading } = useAuth();

  // Show loader while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  // Check role (safely, since user is guaranteed now)
  if (role && user.role !== role) {
    if (user.role === "maker")
      return <Navigate to="/maker/create" replace />;
    if (user.role === "checker")
      return <Navigate to="/checker/review" replace />;
    if (user.role === "admin") return <Navigate to="/admin" replace />;
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
          <Route path="/login/admin" element={<AdminLogin />} />
          <Route path="/login/maker" element={<MakerLogin />} />
          <Route path="/login/checker" element={<CheckerLogin />} />

          {/* Protected */}

          <Route
            path="/admin"
            element={
              <PrivateRoute role="admin">
                <AdminPage />
              </PrivateRoute>
            }
          >
            <Route path="pdf-upload" element={<PdfUploadPage />} />
            <Route path="create-user" element={<CreateUserPage />} />
            <Route path="show-users" element={<ShowallUsersPage />} />
            <Route path="list-pdf" element={<PdfListPage />} />
          </Route>
          <Route
            path="/maker"
            element={
              <PrivateRoute role="maker">
                <MakerPage />
              </PrivateRoute>
            }
          >
            <Route path="create" element={<CreateQuestion />} />
            <Route path="create/:id" element={<CreateQuestion />} />
            <Route path="drafts" element={<DraftQuestions />} />
            <Route path="submitted" element={<SubmittedQuestions />} />
          </Route>

          <Route
            path="/checker"
            element={
              <PrivateRoute role="checker">
                <CheckerPage />
              </PrivateRoute>
            }
          >
            <Route path="review" element={<CheckerReview />} />
            <Route path="accepted" element={<AcceptedQuestions />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
