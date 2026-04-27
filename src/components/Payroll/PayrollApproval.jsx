import React, { useState, useEffect, useCallback } from 'react'
import API from '../../services/api.js'
import StatusBadge from '../Shared/StatusBadge.jsx'

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

export default function PayrollApproval() {
  const [payrolls, setPayrolls]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [actionId, setActionId]     = useState(null)   // id of row being acted on
  const [actionType, setActionType] = useState(null)   // 'approve' | 'reject'
  const [actionError, setActionError] = useState('')

  const fetchPending = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await API.get('/payrolls', { params: { status: 'PENDING' } })
      // Filter client-side as a fallback in case the API ignores the query param
      const pending = Array.isArray(res.data)
        ? res.data.filter((p) => p.status === 'PENDING')
        : []
      setPayrolls(pending)
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        'Failed to load pending payrolls.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPending()
  }, [fetchPending])

  async function handleAction(id, type) {
    setActionId(id)
    setActionType(type)
    setActionError('')
    try {
      await API.patch(`/payrolls/${id}/${type}`)
      fetchPending()
    } catch (err) {
      setActionError(
        err.response?.data?.message ||
        err.message ||
        `Failed to ${type} payroll.`
      )
    } finally {
      setActionId(null)
      setActionType(null)
    }
  }

  if (loading) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">⏳</div>
        Loading pending approvals…
      </div>
    )
  }

  if (error) {
    return <div className="alert alert-error">{error}</div>
  }

  if (payrolls.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">✅</div>
        No pending payrolls — all caught up!
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
              <th>Employee</th>
              <th>Month / Year</th>
              <th>Net Salary</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payrolls.map((p, index) => {
              const isActing = actionId === p.id
              return (
                <tr key={p.id}>
                  <td>{index + 1}</td>
                  <td>
                    {p.employee_name || p.full_name || `Employee #${p.employee_id}`}
                  </td>
                  <td>
                    {MONTHS[(p.month ?? 1) - 1] || p.month} {p.year}
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
                    <div className="table-actions">
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleAction(p.id, 'approve')}
                        disabled={isActing}
                      >
                        {isActing && actionType === 'approve' ? '…' : '✓ Approve'}
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleAction(p.id, 'reject')}
                        disabled={isActing}
                      >
                        {isActing && actionType === 'reject' ? '…' : '✕ Reject'}
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
