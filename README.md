# Ethiopian Payroll Management System

A comprehensive payroll management system designed for Ethiopian companies, featuring automated salary calculations, tax computations, pension contributions, and secure transaction processing.

## Project Structure

```
payroll/
├── backend/          # Backend API service
│   ├── src/         # Source code
│   ├── package.json # Backend dependencies
│   └── README.md    # Backend documentation
├── frontend/        # Frontend application (to be added)
└── README.md        # This file
```

## Features

- **Employee Management**: Complete employee lifecycle management
- **Ethiopian Payroll Calculations**: Automated tax brackets (0-35%), pension contributions (7% + 11%)
- **Role-Based Access**: HR and Finance user workflows
- **Bank Transactions**: Atomic transactions with rollback capability
- **RESTful API**: Complete backend API with JWT authentication
- **Audit Trail**: Complete logging for compliance and tracking

## Quick Start

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB connection
npm run setup
npm start
```

The backend API will be available at `http://localhost:3000/api`

### Frontend Setup
*Frontend implementation coming soon*

## Technology Stack

### Backend
- Node.js + Express.js
- MongoDB + Mongoose ODM
- JWT Authentication
- Winston Logging
- Joi Validation

### Frontend
*To be determined*

## Ethiopian Payroll Specifications

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

## API Documentation

See [Backend README](./backend/README.md) for detailed API documentation.

## Development

### Backend Development
```bash
cd backend
npm run dev
```

### Testing
```bash
cd backend
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License.

---

**Made with ❤️ for Ethiopian businesses**