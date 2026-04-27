import React from 'react'
import GeneratePayroll from '../components/Payroll/GeneratePayroll.jsx'
import PayrollHistory from '../components/Payroll/PayrollHistory.jsx'
import PayrollApproval from '../components/Payroll/PayrollApproval.jsx'

export default function PayrollPage() {
  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Payroll</h1>
      </div>

      <div className="section">
        <div className="card">
          <h2 className="card-title">Generate Payroll</h2>
          <GeneratePayroll />
        </div>
      </div>

      <div className="section">
        <div className="card">
          <h2 className="card-title">Pending Approvals</h2>
          <PayrollApproval />
        </div>
      </div>

      <div className="section">
        <div className="card">
          <h2 className="card-title">Payroll History</h2>
          <PayrollHistory />
        </div>
      </div>
    </div>
  )
}
