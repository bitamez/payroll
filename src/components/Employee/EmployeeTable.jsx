import React, { useState } from 'react'
import API from '../../services/api.js'
import Modal from '../Shared/Modal.jsx'
import EditEmployee from './EditEmployee.jsx'

export default function EmployeeTable({ employees, onRefresh }) {
  const [editTarget, setEditTarget]   = useState(null)   // employee being edited
  const [deletingId, setDeletingId]   = useState(null)   // id currently being deleted
  const [deleteError, setDeleteError] = useState('')

  async function handleDelete(employee) {
    const confirmed = window.confirm(
      `Delete employee "${employee.full_name}"? This cannot be undone.`
    )
    if (!confirmed) return

    setDeletingId(employee.id)
    setDeleteError('')
    try {
      await API.delete(`/employees/${employee.id}`)
      onRefresh()
    } catch (err) {
      setDeleteError(
        err.response?.data?.message ||
        err.message ||
        'Failed to delete employee.'
      )
    } finally {
      setDeletingId(null)
    }
  }

  function handleEditSuccess() {
    onRefresh()
  }

  if (!employees || employees.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">👥</div>
        No employees found. Add one to get started.
      </div>
    )
  }

  return (
    <>
      {deleteError && (
        <div className="alert alert-error" style={{ marginBottom: '12px' }}>
          {deleteError}
        </div>
      )}

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Gender</th>
              <th>Position</th>
              <th>Employment Type</th>
              <th>Employment Date</th>
              <th>Basic Salary</th>
              <th>Bank Account</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp, index) => (
              <tr key={emp.id}>
                <td>{index + 1}</td>
                <td style={{ fontWeight: 600 }}>{emp.full_name}</td>
                <td>{emp.gender}</td>
                <td>{emp.position}</td>
                <td>
                  <span style={{ fontSize: '0.82rem' }}>
                    {emp.employment_type?.replace('_', ' ')}
                  </span>
                </td>
                <td>
                  {emp.employment_date
                    ? new Date(emp.employment_date).toLocaleDateString()
                    : '—'}
                </td>
                <td>
                  {emp.basic_salary != null
                    ? Number(emp.basic_salary).toLocaleString('en-US', {
                        style: 'currency',
                        currency: 'USD',
                      })
                    : '—'}
                </td>
                <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                  {emp.bank_account_number || '—'}
                </td>
                <td>
                  <div className="table-actions">
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => setEditTarget(emp)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(emp)}
                      disabled={deletingId === emp.id}
                    >
                      {deletingId === emp.id ? '…' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Edit Employee"
      >
        {editTarget && (
          <EditEmployee
            employee={editTarget}
            onSuccess={handleEditSuccess}
            onClose={() => setEditTarget(null)}
          />
        )}
      </Modal>
    </>
  )
}
