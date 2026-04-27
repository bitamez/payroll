import React, { useState } from 'react'
import API from '../../services/api.js'

export default function EditEmployee({ employee, onSuccess, onClose }) {
  const [form, setForm] = useState({
    full_name:           employee.full_name           || '',
    gender:              employee.gender              || 'MALE',
    employment_type:     employee.employment_type     || 'FULL_TIME',
    position:            employee.position            || '',
    employment_date:     employee.employment_date
      ? employee.employment_date.slice(0, 10)
      : '',
    basic_salary:        employee.basic_salary        ?? '',
    bank_account_number: employee.bank_account_number || '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError]     = useState('')

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
    setSuccess('')
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setSuccess('')
    setError('')
    try {
      await API.put(`/employees/${employee.id}`, {
        ...form,
        basic_salary: Number(form.basic_salary),
      })
      setSuccess('Employee updated successfully!')
      if (onSuccess) onSuccess()
      if (onClose) setTimeout(onClose, 800)
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Failed to update employee.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      {success && <div className="alert alert-success">{success}</div>}
      {error   && <div className="alert alert-error">{error}</div>}

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="edit-full_name">Full Name</label>
          <input
            id="edit-full_name"
            type="text"
            name="full_name"
            value={form.full_name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="edit-gender">Gender</label>
          <select
            id="edit-gender"
            name="gender"
            value={form.gender}
            onChange={handleChange}
          >
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="edit-position">Position</label>
          <input
            id="edit-position"
            type="text"
            name="position"
            value={form.position}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="edit-employment_type">Employment Type</label>
          <select
            id="edit-employment_type"
            name="employment_type"
            value={form.employment_type}
            onChange={handleChange}
          >
            <option value="FULL_TIME">Full Time</option>
            <option value="PART_TIME">Part Time</option>
            <option value="CONTRACT">Contract</option>
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="edit-employment_date">Employment Date</label>
          <input
            id="edit-employment_date"
            type="date"
            name="employment_date"
            value={form.employment_date}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="edit-basic_salary">Basic Salary (USD)</label>
          <input
            id="edit-basic_salary"
            type="number"
            name="basic_salary"
            value={form.basic_salary}
            onChange={handleChange}
            min="0"
            step="0.01"
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="edit-bank_account_number">Bank Account Number</label>
        <input
          id="edit-bank_account_number"
          type="text"
          name="bank_account_number"
          value={form.bank_account_number}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}
