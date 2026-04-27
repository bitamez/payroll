import React from 'react'
import DashboardStats from '../components/Dashboard/DashboardStats.jsx'

export default function DashboardPage() {
  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
      </div>
      <DashboardStats />
    </div>
  )
}
