import React, { useState, useEffect, useCallback } from 'react'
import API from '../../services/api.js'
import StatusBadge from '../Shared/StatusBadge.jsx'

const MONTHS = [
  'Jan','Feb','Mar','Apr','May','Jun',
  'Jul','Aug','Sep','Oct','Nov','Dec',
]

export default function PayrollHistory() {
  const [payrolls, setPayrolls] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [approvingId, setApprovingId] = useState(null)
  const [actionError, setActionError] = useState('')

  const fetchPayrolls = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await API.get('/payrolls')
      setPayrolls(res.data)
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        'Failed to load payroll history.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPayrolls()
  }, [fetchPayrolls])

  async function handleApprove(id) {
    setApprovingId(id)
    setActionError('')
    try {
      await API.patch(`/payrolls/${id}/approve`)
      fetchPayrolls()
    } catch (err) {
      setActionError(
        err.response?.data?.message ||
        err.message ||
        'Failed to approve payroll.'
      )
    } finally {
      setApprovingId(null)
    }
  }

  if (loading) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">⏳</div>
        Loading payroll history…
      </div>
    )
  }

  if (error) {
    return <div className="alert alert-error">{error}</div>
  }

  if (payrolls.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📋</div>
        No payroll records found.
      </div>
    )
  }

  return (
    <>
      {actionError && (
        <div className="alert alert-error" style={{ marginBottom: '12px' }}>
          {actionError}
        </div>
      )}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Employee ID</th>
              <th>Month</th>
              <th>Year</th>
              <th>Working Days</th>
              <th>Basic Salary</th>
              <th>Net Salary</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payrolls.map((p, index) => (
              <tr key={p.id}>
                <td>{index + 1}</td>
                <td>{p.employee_id}</td>
                <td>{MONTHS[(p.month ?? 1) - 1] || p.month}</td>
                <td>{p.year}</td>
                <td>{p.working_days}</td>
                <td>
                  {p.basic_salary != null
                    ? Number(p.basic_salary).toLocaleString('en-US', {
                        style: 'currency', currency: 'USD',
                      })
                    : '—'}
                </td>
                <td style={{ fontWeight: 600 }}>
                  {p.net_salary != null
                    ? Number(p.net_salary).toLocaleString('en-US', {
                        style: 'currency', currency: 'USD',
                      })
                    : '—'}
                </td>
                <td>
                  <StatusBadge status={p.status} />
                </td>
                <td>
                  {p.status === 'PENDING' && (
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => handleApprove(p.id)}
                      disabled={approvingId === p.id}
                    >
                      {approvingId === p.id ? '…' : 'Approve'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
