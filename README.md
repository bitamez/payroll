# Ethiopian Payroll Backend System

A comprehensive payroll management system designed for Ethiopian companies, featuring automated salary calculations, tax computations, pension contributions, and secure transaction processing with rollback capabilities.

## Features

- **Employee Management**: Complete employee lifecycle management
- **Ethiopian Payroll Calculations**: Automated tax brackets, pension contributions (7% employee + 11% employer)
- **Allowances & Deductions**: Flexible system for various compensation components
- **Bank Transactions**: Atomic transactions with full rollback capability
- **Multi-Role Workflow**: HR prepares, Finance approves and processes payments
- **Authentication & Authorization**: JWT-based security with role-based access control
- **Audit Trail**: Complete logging for compliance and tracking
- **RESTful API**: Well-structured endpoints following REST principles

## Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Joi
- **Logging**: Winston
- **Security**: Helmet, CORS, Rate Limiting

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd payroll-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   NODE_ENV=development
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/payroll_db
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRES_IN=24h
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system.

5. **Run the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/profile` - Update user profile

### Employee Endpoints

- `GET /api/employees` - Get all employees (with pagination)
- `POST /api/employees` - Create new employee (HR only)
- `GET /api/employees/:id` - Get employee by ID
- `PUT /api/employees/:id` - Update employee (HR only)
- `DELETE /api/employees/:id` - Terminate employee (HR only)
- `POST /api/employees/:id/allowances` - Add allowance (HR only)
- `POST /api/employees/:id/deductions` - Add deduction (HR only)

### Payroll Endpoints

- `GET /api/payroll` - Get all payrolls (with filters)
- `POST /api/payroll` - Create payroll (HR only)
- `GET /api/payroll/:id` - Get payroll by ID
- `PUT /api/payroll/:id` - Update payroll (HR only, PENDING status)
- `POST /api/payroll/:id/approve` - Approve payroll (Finance only)
- `POST /api/payroll/:id/process-payment` - Process payment (Finance only)
- `DELETE /api/payroll/:id` - Delete payroll (HR only, PENDING status)

### Transaction Endpoints

- `GET /api/transactions` - Get all transactions
- `GET /api/transactions/summary` - Get transaction summary
- `GET /api/transactions/batch/:batchId` - Get transactions by batch
- `GET /api/transactions/accounts` - Get all bank accounts
- `GET /api/transactions/accounts/:accountNumber/balance` - Get account balance
- `POST /api/transactions/manual` - Create manual transaction (Finance only)

## Ethiopian Payroll Calculations

### Tax Brackets (ETB)
- 0 - 600: 0%
- 600 - 1,650: 10%
- 1,650 - 3,200: 15%
- 3,200 - 5,250: 20%
- 5,250 - 7,800: 25%
- 7,800 - 10,900: 30%
- Above 10,900: 35%

### Pension Contributions
- Employee: 7% of gross salary
- Employer: 11% of gross salary

### Overtime Calculation
- Overtime rate: 1.5x regular hourly rate
- Regular working days: 30 days/month
- Regular working hours: 8 hours/day

## Database Schema

### Collections

1. **employees** - Employee information and allowances/deductions
2. **users** - System users (HR, Finance roles)
3. **payrolls** - Payroll calculations and workflow status
4. **bankaccounts** - Bank account information for all entities
5. **transactions** - All financial transactions with rollback support

## Security Features

- JWT-based authentication
- Role-based access control (HR, Finance)
- Password hashing with bcrypt
- Request rate limiting
- CORS protection
- Security headers with Helmet
- Input validation and sanitization

## Transaction Safety

The system implements atomic transactions with rollback capabilities:

1. **Atomic Operations**: All payroll payments are processed as atomic transactions
2. **Rollback Support**: Failed transactions are automatically rolled back
3. **Audit Trail**: Complete transaction history with batch tracking
4. **Balance Validation**: Insufficient balance checks before processing

## Workflow

1. **HR Role**:
   - Create and manage employees
   - Prepare payroll calculations
   - Add allowances and deductions

2. **Finance Role**:
   - Review and approve payrolls
   - Process payments
   - Monitor transactions and account balances

3. **Payroll Status Flow**:
   - PENDING → APPROVED → PAID
   - Failed payments marked as FAILED

## Development

### Running Tests
```bash
npm test
```

### Code Structure
```
src/
├── config/          # Database configuration
├── controllers/     # Route controllers
├── middlewares/     # Custom middleware
├── models/          # Mongoose models
├── routes/          # Express routes
├── services/        # Business logic services
└── utils/           # Utility functions
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| NODE_ENV | Environment mode | development |
| PORT | Server port | 3000 |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/payroll_db |
| JWT_SECRET | JWT signing secret | - |
| JWT_EXPIRES_IN | JWT expiration time | 24h |
| EMPLOYEE_PENSION_RATE | Employee pension rate | 0.07 |
| EMPLOYER_PENSION_RATE | Employer pension rate | 0.11 |
| OVERTIME_MULTIPLIER | Overtime pay multiplier | 1.5 |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License.