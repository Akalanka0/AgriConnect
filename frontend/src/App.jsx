import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider as CommonToastProvider } from '@/components/common/feedback/ToastProvider';
import RequireAuth from '@/components/auth/RequireAuth';
import { Home } from '@/features/home';
import { Login } from '@/features/auth';
import VerificationPage from '@/features/auth/pages/VerificationPage';
import EmailVerificationPage from '@/features/auth/pages/EmailVerificationPage';

// Farmer Pages
import {
  FarmerLayout,
  FarmerHome,
  CropPlans,
  Activities,
  PestManagement,
  Harvest,
  FarmerSchedule,
  Weather,
  Settings as FarmerSettings
} from '@/features/farmer';

// Admin Pages
import {
  AdminLayout,
  AdminHome,
  UserManagement,
  Engagement,
  Reports as AdminReports,
  UserIdManagement,
  Settings as AdminSettings
} from '@/features/admin';

// Instructor Pages
import {
  InstructorLayout,
  InstructorHome,
  FarmerManagement,
  CropPlanReview,
  PestReports,
  InstructorReports,
  InstructorSchedule,
  InstructorSettings
} from '@/features/instructor';

export default function App() {
  return (
    <div className="theme-home">
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/login"
            element={(
              <CommonToastProvider>
                <Login />
              </CommonToastProvider>
            )}
          />
          <Route
            path="/verify"
            element={(
              <CommonToastProvider>
                <VerificationPage />
              </CommonToastProvider>
            )}
          />
          <Route
            path="/verify-email"
            element={(
              <CommonToastProvider>
                <EmailVerificationPage />
              </CommonToastProvider>
            )}
          />

          {/* Nested Farmer Routes */}
          <Route element={<RequireAuth allowedRoles={['farmer']} />}>
            <Route path="/farmer" element={<FarmerLayout />}>
              <Route index element={<FarmerHome />} />
              <Route path="crop" element={<CropPlans />} />
              <Route path="activity" element={<Activities />} />
              <Route path="pest" element={<PestManagement />} />
              <Route path="harvest" element={<Harvest />} />
              <Route path="meeting" element={<FarmerSchedule />} />
              <Route path="alerts" element={<Weather />} />
              <Route path="settings" element={<FarmerSettings />} />
            </Route>
          </Route>

          {/* Nested Admin Routes */}
          <Route element={<RequireAuth allowedRoles={['admin']} />}>
            <Route
              path="/admin"
              element={(
                <CommonToastProvider>
                  <AdminLayout />
                </CommonToastProvider>
              )}
            >
                <Route index element={<AdminHome />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="engagement" element={<Engagement />} />
                <Route path="reports" element={<AdminReports />} />
                <Route path="ids" element={<UserIdManagement />} />
                <Route path="settings" element={<AdminSettings />} />
            </Route>
          </Route>

          {/* Nested Instructor Routes */}
          <Route element={<RequireAuth allowedRoles={['instructor']} />}>
            <Route path="/instructor" element={<InstructorLayout />}>
              <Route index element={<InstructorHome />} />
              <Route path="farmers" element={<FarmerManagement />} />
              <Route path="crop-plans" element={<CropPlanReview />} />
              <Route path="pest-management" element={<PestReports />} />
              <Route path="reports" element={<InstructorReports />} />
              <Route path="schedule" element={<InstructorSchedule />} />
              <Route path="settings" element={<InstructorSettings />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </div>
  );
}
