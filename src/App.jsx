import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import EmployeesPage from './pages/EmployeesPage.jsx'
import PayrollPage from './pages/PayrollPage.jsx'
import Navbar from './components/Shared/Navbar.jsx'

// PrivateRoute: wraps protected pages, redirects to /login if no token
function PrivateRoute({ children }) {
  const token = localStorage.getItem('token')
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return children
}

// Layout wraps protected pages with the Navbar
function ProtectedLayout({ children }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Public route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <ProtectedLayout>
                <DashboardPage />
              </ProtectedLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/employees"
          element={
            <PrivateRoute>
              <ProtectedLayout>
                <EmployeesPage />
              </ProtectedLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/payroll"
          element={
            <PrivateRoute>
              <ProtectedLayout>
                <PayrollPage />
              </ProtectedLayout>
            </PrivateRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
