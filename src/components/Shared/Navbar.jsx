import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

export default function Navbar() {
  const navigate = useNavigate()

  function handleLogout() {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <a href="/" className="navbar-brand">💼 PayrollPro</a>

      <ul className="navbar-links">
        <li>
          <NavLink
            to="/"
            end
            className={({ isActive }) => isActive ? 'active' : ''}
          >
            Dashboard
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/employees"
            className={({ isActive }) => isActive ? 'active' : ''}
          >
            Employees
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/payroll"
            className={({ isActive }) => isActive ? 'active' : ''}
          >
            Payroll
          </NavLink>
        </li>
        <li>
          <button className="btn btn-logout" onClick={handleLogout}>
            Logout
          </button>
        </li>
      </ul>
    </nav>
  )
}
