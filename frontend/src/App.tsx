import { Route, Routes } from "react-router-dom";
import { AuthLayout } from "./components/templates/AuthLayout";
import { PublicLayout } from "./components/templates/PublicLayout";
import { RequireRole } from "./context/RequireRole";
import AdminDashboard from "./pages/AdminDashboard";
import DentistDashboard from "./pages/DentistDashboard";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";
import PatientDashboard from "./pages/PatientDashboard";
import RegisterPage from "./pages/RegisterPage";

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
      </Route>

      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route path="/patient" element={<RequireRole roles={["PATIENT"]}><PatientDashboard /></RequireRole>} />
      <Route path="/dentist" element={<RequireRole roles={["DENTIST"]}><DentistDashboard /></RequireRole>} />
      <Route path="/admin" element={<RequireRole roles={["ADMIN"]}><AdminDashboard /></RequireRole>} />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}