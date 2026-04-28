# Ethiopian Payroll Backend API

Backend service for the Ethiopian Payroll Management System.

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your MongoDB connection

# Initialize database with sample data
npm run setup

# Start the server
npm start
```

## API Base URL
```
http://localhost:3000/api
```

## Environment Variables

Create a `.env` file with:

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/payroll_db
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h
```

## Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run setup` - Initialize database with sample data
- `npm run explore:db` - Explore database contents
- `npm test` - Run tests

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Employees (HR Only)
- `GET /api/employees` - Get all employees
- `POST /api/employees` - Create employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Payroll
- `GET /api/payroll` - Get payroll records
- `POST /api/payroll/calculate` - Calculate payroll (HR)
- `PUT /api/payroll/:id/approve` - Approve payroll (Finance)
- `POST /api/payroll/:id/process-payment` - Process payment (Finance)

### Reports
- `GET /api/reports/payroll` - Payroll reports
- `GET /api/reports/tax-summary` - Tax summary

### Transactions (Finance Only)
- `GET /api/transactions` - Transaction history
- `POST /api/transactions/rollback/:id` - Rollback transaction

## Ethiopian Tax Brackets

| Income Range (ETB) | Tax Rate |
|-------------------|----------|
| 0 - 600           | 0%       |
| 601 - 1,650       | 10%      |
| 1,651 - 3,200     | 15%      |
| 3,201 - 5,250     | 20%      |
| 5,251 - 7,800     | 25%      |
| 7,801 - 10,900    | 30%      |
| 10,901+           | 35%      |

## Pension Contributions
- Employee: 7% of gross salary
- Employer: 11% of gross salary

## Sample Users

After running `npm run setup`:

**HR User:**
- Email: hr@company.com
- Password: hr123456

**Finance User:**
- Email: finance@company.com  
- Password: finance123456

## Technology Stack

- Node.js + Express.js
- MongoDB + Mongoose
- JWT Authentication
- Winston Logging
- Joi Validation