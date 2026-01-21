import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import '@/shared/styles/global.css';
import { Home } from '@/features/home';
import { Login } from '@/features/auth';

// Farmer Pages
import {
  FarmerLayout,
  FarmerHome,
  CropPlans,
  Activities,
  PestManagement,
  Harvest,
  Calendar,
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
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />

        {/* Nested Farmer Routes */}
        <Route path="/farmer" element={<FarmerLayout />}>
          <Route index element={<FarmerHome />} />
          <Route path="crop" element={<CropPlans />} />
          <Route path="activity" element={<Activities />} />
          <Route path="pest" element={<PestManagement />} />
          <Route path="harvest" element={<Harvest />} />
          <Route path="meeting" element={<Calendar />} />
          <Route path="alerts" element={<Weather />} />
          <Route path="settings" element={<FarmerSettings />} />
        </Route>

        {/* Nested Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminHome />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="engagement" element={<Engagement />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* Nested Instructor Routes */}
        <Route path="/instructor" element={<InstructorLayout />}>
          <Route index element={<InstructorHome />} />
          <Route path="farmers" element={<FarmerManagement />} />
          <Route path="crop-plans" element={<CropPlanReview />} />
          <Route path="pest-management" element={<PestReports />} />
          <Route path="reports" element={<InstructorReports />} />
          <Route path="schedule" element={<InstructorSchedule />} />
          <Route path="settings" element={<InstructorSettings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
