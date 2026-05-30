import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import NationalDashboard from './pages/NationalDashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Inventory from './pages/Inventory';
import EventChronogram from './pages/EventChronogram';
import DefectReport from './pages/DefectReport';
import EquipmentMovements from './pages/EquipmentMovements';
import MovementsHistory from './pages/MovementsHistory';
import EquipmentDetail from './pages/EquipmentDetail';
import MeetingDashboard from './pages/MeetingDashboard';
import QRTransit from './pages/QRTransit';
import MeetingDetail from './pages/MeetingDetail';
import BudgetRequests from './pages/BudgetRequests';
import BudgetRequestDetail from './pages/BudgetRequestDetail';
import ChurchesList from './pages/ChurchesList';
import EventsList from './pages/EventsList';
import EventCalendar from './pages/EventCalendar';
import TrainingDashboard from './pages/TrainingDashboard';
import TrainingHub from './pages/TrainingHub';
import ChronogramMaster from './pages/ChronogramMaster';
import ChronogramLibrary from './pages/ChronogramLibrary';
import Onboarding from './pages/Onboarding';
import UsersList from './pages/UsersList';
import Settings from './pages/Settings';
import MembersList from './pages/MembersList';
import PublicVerifyMember from './pages/PublicVerifyMember';


import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';

import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <Router>
        <ScrollToTop />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          <Route path="/onboarding" element={<ProtectedRoute checkOnboarding={false}><Onboarding /></ProtectedRoute>} />
          
          {/* Routes Protégées */}
          <Route path="/dashboard" element={<ProtectedRoute><NationalDashboard /></ProtectedRoute>} />
          <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
          <Route path="/inventory/:id" element={<ProtectedRoute><EquipmentDetail /></ProtectedRoute>} />
          <Route path="/qr-transit/:id" element={<ProtectedRoute><QRTransit /></ProtectedRoute>} />
          <Route path="/movements" element={<ProtectedRoute><EquipmentMovements /></ProtectedRoute>} />
          <Route path="/movements/history" element={<ProtectedRoute><MovementsHistory /></ProtectedRoute>} />
          <Route path="/meetings" element={<ProtectedRoute><MeetingDashboard /></ProtectedRoute>} />
          <Route path="/meetings/:id" element={<ProtectedRoute><MeetingDetail /></ProtectedRoute>} />
          <Route path="/budget" element={<ProtectedRoute><BudgetRequests /></ProtectedRoute>} />
          <Route path="/budget/:id" element={<ProtectedRoute><BudgetRequestDetail /></ProtectedRoute>} />
          <Route path="/training" element={<ProtectedRoute><TrainingDashboard /></ProtectedRoute>} />
          <Route path="/training/hub" element={<ProtectedRoute><TrainingHub /></ProtectedRoute>} />
          <Route path="/events/:id" element={<ProtectedRoute><EventChronogram /></ProtectedRoute>} />
          <Route path="/events/:id/master" element={<ProtectedRoute><ChronogramMaster /></ProtectedRoute>} />
          <Route path="/report/:materielId" element={<ProtectedRoute><DefectReport /></ProtectedRoute>} />
          <Route path="/report" element={<ProtectedRoute><DefectReport /></ProtectedRoute>} />
          
          <Route path="/events" element={<ProtectedRoute><EventsList /></ProtectedRoute>} />
          <Route path="/events/calendar" element={<ProtectedRoute><EventCalendar /></ProtectedRoute>} />
          <Route path="/chronograms/library" element={<ProtectedRoute><ChronogramLibrary /></ProtectedRoute>} />
          <Route path="/churches" element={<ProtectedRoute><ChurchesList /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute><UsersList /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/members" element={<ProtectedRoute><MembersList /></ProtectedRoute>} />
          <Route path="/public/verify-member/:id" element={<PublicVerifyMember />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
