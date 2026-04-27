import React, { useState, useEffect } from 'react'
import API from '../../services/api.js'

export default function DashboardStats() {
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    async function fetchStats() {
      setLoading(true)
      setError('')
      try {
        const [empRes, payRes] = await Promise.all([
          API.get('/employees'),
          API.get('/payrolls'),
        ])

        const employees = Array.isArray(empRes.data) ? empRes.data : []
        const payrolls  = Array.isArray(payRes.data) ? payRes.data : []

        const totalEmployees = employees.length

        const totalSalaryPaid = payrolls
          .filter((p) => p.status === 'PAID')
          .reduce((sum, p) => sum + (Number(p.net_salary) || 0), 0)

        const pendingPayrolls = payrolls.filter((p) => p.status === 'PENDING').length

        setStats({ totalEmployees, totalSalaryPaid, pendingPayrolls })
      } catch (err) {
        setError(
          err.response?.data?.message ||
          err.message ||
          'Failed to load dashboard data.'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="stats-grid">
        {[1, 2, 3].map((i) => (
          <div key={i} className="stat-card" style={{ opacity: 0.5 }}>
            <div className="stat-icon">⏳</div>
            <div className="stat-info">
              <span className="stat-label">Loading…</span>
              <span className="stat-value">—</span>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return <div className="alert alert-error">{error}</div>
  }

  const cards = [
    {
      icon: '👥',
      label: 'Total Employees',
      value: stats.totalEmployees.toLocaleString(),
    },
    {
      icon: '💰',
      label: 'Total Salary Paid',
      value: stats.totalSalaryPaid.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }),
    },
    {
      icon: '⏳',
      label: 'Pending Payrolls',
      value: stats.pendingPayrolls.toLocaleString(),
    },
  ]

  return (
    <div className="stats-grid">
      {cards.map((card) => (
        <div key={card.label} className="stat-card">
          <div className="stat-icon">{card.icon}</div>
          <div className="stat-info">
            <span className="stat-label">{card.label}</span>
            <span className="stat-value">{card.value}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
