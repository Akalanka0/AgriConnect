import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getAccessToken } from '@/utils/authStorage';
import { getStoredUser } from '@/utils/userStorage';

const roleHome = {
  admin: '/admin',
  instructor: '/instructor',
  farmer: '/farmer'
};

const RequireAuth = ({ allowedRoles = [] }) => {
  const location = useLocation();
  const token = getAccessToken();
  const user = getStoredUser();

  if (!token || !user?.role) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to={roleHome[user.role] || '/login'} replace />;
  }

  return <Outlet />;
};

export default RequireAuth;
