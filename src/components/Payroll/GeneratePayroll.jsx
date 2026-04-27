import React, { useState } from 'react'
import API from '../../services/api.js'

const INITIAL_FORM = {
  employee_id:  '',
  working_days: '',
  month:        '',
  year:         new Date().getFullYear().toString(),
}

export default function GeneratePayroll() {
  const [form, setForm]       = useState(INITIAL_FORM)
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState(null)
  const [success, setSuccess] = useState('')
  const [error, setError]     = useState('')

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
    setSuccess('')
    setError('')
    setResult(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setSuccess('')
    setError('')
    setResult(null)
    try {
      const res = await API.post('/payrolls/generate', {
        employee_id:  Number(form.employee_id),
        working_days: Number(form.working_days),
        month:        Number(form.month),
        year:         Number(form.year),
      })
      setResult(res.data)
      setSuccess('Payroll generated successfully!')
      setForm(INITIAL_FORM)
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Failed to generate payroll.'
      )
    } finally {
      setLoading(false)
    }
  }

  const MONTHS = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
  ]

  return (
    <div>
      <form className="form" onSubmit={handleSubmit}>
        {success && <div className="alert alert-success">{success}</div>}
        {error   && <div className="alert alert-error">{error}</div>}

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="gen-employee_id">Employee ID</label>
            <input
              id="gen-employee_id"
              type="number"
              name="employee_id"
              value={form.employee_id}
              onChange={handleChange}
              placeholder="e.g. 1"
              min="1"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="gen-working_days">Working Days</label>
            <input
              id="gen-working_days"
              type="number"
              name="working_days"
              value={form.working_days}
              onChange={handleChange}
              placeholder="e.g. 22"
              min="1"
              max="31"
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="gen-month">Month</label>
            <select
              id="gen-month"
              name="month"
              value={form.month}
              onChange={handleChange}
              required
            >
              <option value="">Select month…</option>
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="gen-year">Year</label>
            <input
              id="gen-year"
              type="number"
              name="year"
              value={form.year}
              onChange={handleChange}
              placeholder={new Date().getFullYear()}
              min="2000"
              max="2100"
              required
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Generating…' : '⚙️ Generate Payroll'}
          </button>
        </div>
      </form>

      {/* Result Card */}
      {result && (
        <div className="result-card">
          <h4>📄 Payroll Summary</h4>
          <div className="result-grid">
            {result.employee_id != null && (
              <div className="result-item">
                <span className="result-label">Employee ID</span>
                <span className="result-value">{result.employee_id}</span>
              </div>
            )}
            {result.month != null && (
              <div className="result-item">
                <span className="result-label">Period</span>
                <span className="result-value">
                  {MONTHS[(result.month ?? 1) - 1]} {result.year}
                </span>
              </div>
            )}
            {result.working_days != null && (
              <div className="result-item">
                <span className="result-label">Working Days</span>
                <span className="result-value">{result.working_days}</span>
              </div>
            )}
            {result.basic_salary != null && (
              <div className="result-item">
                <span className="result-label">Basic Salary</span>
                <span className="result-value">
                  {Number(result.basic_salary).toLocaleString('en-US', {
                    style: 'currency', currency: 'USD',
                  })}
                </span>
              </div>
            )}
            {result.deductions != null && (
              <div className="result-item">
                <span className="result-label">Deductions</span>
                <span className="result-value" style={{ color: '#dc2626' }}>
                  {Number(result.deductions).toLocaleString('en-US', {
                    style: 'currency', currency: 'USD',
                  })}
                </span>
              </div>
            )}
            {result.net_salary != null && (
              <div className="result-item">
                <span className="result-label">Net Salary</span>
                <span className="result-value" style={{ color: '#16a34a', fontSize: '1.15rem' }}>
                  {Number(result.net_salary).toLocaleString('en-US', {
                    style: 'currency', currency: 'USD',
                  })}
                </span>
              </div>
            )}
            {result.status && (
              <div className="result-item">
                <span className="result-label">Status</span>
                <span className="result-value">{result.status}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
