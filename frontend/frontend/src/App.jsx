import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import AdminDashboard from "./pages/Dashboard/AdminDashboard";
import DoctorDashboard from "./pages/Dashboard/DoctorDashboard";
import PatientDashboard from "./pages/Dashboard/PatientDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import Chatbot from "./components/Chatbot";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} /> 
        <Route path="/register" element={<Register />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/doctor"
          element={
            <ProtectedRoute allowedRoles={["doctor"]}>
              <DoctorDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/patient"
          element={
            <ProtectedRoute allowedRoles={["patient"]}>
              <PatientDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="/chatbot" element={<Chatbot />} /> 
      </Routes>
    </BrowserRouter>
  );
}

export default App;
