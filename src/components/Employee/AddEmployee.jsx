import React, { useState } from 'react'
import API from '../../services/api.js'

const INITIAL_FORM = {
  full_name: '',
  gender: 'MALE',
  employment_type: 'FULL_TIME',
  position: '',
  employment_date: '',
  basic_salary: '',
  bank_account_number: '',
}

export default function AddEmployee({ onSuccess }) {
  const [form, setForm] = useState(INITIAL_FORM)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

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
      await API.post('/employees', {
        ...form,
        basic_salary: Number(form.basic_salary),
      })
      setSuccess('Employee added successfully!')
      setForm(INITIAL_FORM)
      if (onSuccess) onSuccess()
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Failed to add employee.'
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
          <label htmlFor="add-full_name">Full Name</label>
          <input
            id="add-full_name"
            type="text"
            name="full_name"
            value={form.full_name}
            onChange={handleChange}
            placeholder="Jane Doe"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="add-gender">Gender</label>
          <select
            id="add-gender"
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
          <label htmlFor="add-position">Position</label>
          <input
            id="add-position"
            type="text"
            name="position"
            value={form.position}
            onChange={handleChange}
            placeholder="Software Engineer"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="add-employment_type">Employment Type</label>
          <select
            id="add-employment_type"
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
          <label htmlFor="add-employment_date">Employment Date</label>
          <input
            id="add-employment_date"
            type="date"
            name="employment_date"
            value={form.employment_date}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="add-basic_salary">Basic Salary (USD)</label>
          <input
            id="add-basic_salary"
            type="number"
            name="basic_salary"
            value={form.basic_salary}
            onChange={handleChange}
            placeholder="5000"
            min="0"
            step="0.01"
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="add-bank_account_number">Bank Account Number</label>
        <input
          id="add-bank_account_number"
          type="text"
          name="bank_account_number"
          value={form.bank_account_number}
          onChange={handleChange}
          placeholder="1234567890"
          required
        />
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Adding…' : 'Add Employee'}
        </button>
      </div>
    </form>
  )
}
