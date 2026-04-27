import React, { useState, useEffect, useCallback } from 'react'
import API from '../services/api.js'
import EmployeeTable from '../components/Employee/EmployeeTable.jsx'
import AddEmployee from '../components/Employee/AddEmployee.jsx'

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAdd, setShowAdd] = useState(false)

  const fetchEmployees = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await API.get('/employees')
      setEmployees(res.data)
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        'Failed to load employees.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

  function handleAddSuccess() {
    setShowAdd(false)
    fetchEmployees()
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Employees</h1>
        <button
          className="btn btn-primary"
          onClick={() => setShowAdd((prev) => !prev)}
        >
          {showAdd ? '✕ Cancel' : '+ Add Employee'}
        </button>
      </div>

      {showAdd && (
        <div className="card section">
          <h2 className="card-title">Add New Employee</h2>
          <AddEmployee onSuccess={handleAddSuccess} />
        </div>
      )}

      {error && (
        <div className="alert alert-error section">{error}</div>
      )}

      {loading ? (
        <div className="empty-state">
          <div className="empty-state-icon">⏳</div>
          Loading employees…
        </div>
      ) : (
        <div className="card">
          <h2 className="card-title">Employee List</h2>
          <EmployeeTable employees={employees} onRefresh={fetchEmployees} />
        </div>
      )}
    </div>
  )
}
