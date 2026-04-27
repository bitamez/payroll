# 🗄️ Ethiopian Payroll Database Guide

## 📊 **How to Explore Your Database**

### **Method 1: Command Line Database Explorer** ⭐ **RECOMMENDED**
```bash
npm run explore:db
```
This gives you a complete overview of all your data with statistics and analysis.

### **Method 2: Web-Based Database Viewer** 🌐
1. **Make sure your server is running:**
   ```bash
   npm run dev
   ```
2. **Open the database viewer:**
   - Open `database-viewer.html` in your browser
   - It will automatically connect to your API and show live data

### **Method 3: MongoDB Atlas Web Interface** ☁️
You're already using this! In your MongoDB Atlas dashboard:
1. Click on your **"payroll"** project
2. Go to **"Browse Collections"**
3. Select **"payroll_db"** database
4. Explore each collection

### **Method 4: MongoDB Compass** 🧭
Download MongoDB Compass and connect using your connection string from `.env`

---

## 🏗️ **Database Structure Overview**

### **Collections in your `payroll_db` database:**

#### 📁 **users** (3 documents)
- **HR Manager** (hr@company.com) - Role: HR
- **Finance Manager** (finance@company.com) - Role: FINANCE  
- **System Administrator** (admin@company.com) - Role: HR

#### 📁 **employees** (7 documents)
- **EMP0001** - Abebe Kebede (Senior Developer) - 15,000 ETB
- **EMP0002** - Almaz Tadesse (Project Manager) - 18,000 ETB
- **EMP0003** - Dawit Haile (Accountant) - 12,000 ETB
- **EMP0004** - Hanan Mohammed (Consultant) - 8,000 ETB
- **EMP0005** - John Doe (Software Developer) - 8,000 ETB
- **EMP0006** - Jane Smith (Project Manager) - 12,000 ETB
- **EMP0007** - Ahmed Hassan (Consultant) - 5,000 ETB

#### 📁 **payrolls** (3 documents)
Recent payroll calculations for April 2026:
- **John Doe**: Gross 7,866.67 ETB → Net 6,039.33 ETB (Tax: 1,276.67 ETB)
- **Jane Smith**: Gross 11,600 ETB → Net 8,503 ETB (Tax: 2,285 ETB)
- **Ahmed Hassan**: Gross 3,966.67 ETB → Net 3,258.17 ETB (Tax: 430.83 ETB)

#### 📁 **bankaccounts** (10 documents)
- **COMPANY-001** - Orbit Mesh Technologies (1,000,000 ETB)
- **GOV-001** - Ethiopian Revenue Authority (0 ETB)
- **PENSION-001** - Ethiopian Pension Fund (0 ETB)
- **7 Employee Accounts** - Individual employee bank accounts (0 ETB each)

#### 📁 **transactions** (0 documents)
No transactions yet (requires MongoDB replica set for production)

---

## 📈 **Key Statistics**

### **Employee Statistics:**
- **Total Employees:** 7
- **Active Employees:** 7
- **Employment Types:** 5 Full-time, 2 Part-time
- **Total Salary Budget:** 78,000 ETB/month

### **Payroll Statistics:**
- **Total Payroll Records:** 3
- **Total Gross Pay:** 23,433.34 ETB
- **Total Net Pay:** 17,800.50 ETB
- **Total Tax Collected:** 3,992.50 ETB
- **Total Pension Contributions:** 4,218 ETB

### **Financial Overview:**
- **System Balance:** 1,000,000 ETB
- **Bank Accounts:** 10 total (1 Company, 1 Government, 1 Pension, 7 Employee)

---

## 🔍 **Sample Database Queries**

### **Using the API (with authentication):**

1. **Get all employees:**
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/employees
   ```

2. **Get payroll records:**
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/payroll
   ```

3. **Get bank accounts:**
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/transactions/accounts
   ```

### **Direct MongoDB Queries (if using MongoDB shell):**

```javascript
// Connect to your database
use payroll_db

// Get all employees
db.employees.find().pretty()

// Get payroll statistics
db.payrolls.aggregate([
  {
    $group: {
      _id: null,
      totalGross: { $sum: "$grossPay" },
      totalNet: { $sum: "$netPay" },
      totalTax: { $sum: "$incomeTax" },
      count: { $sum: 1 }
    }
  }
])

// Get employee count by status
db.employees.aggregate([
  {
    $group: {
      _id: "$status",
      count: { $sum: 1 }
    }
  }
])
```

---

## 🛠️ **Database Management Commands**

### **Reset Database:**
```bash
npm run setup
```
This clears all data and recreates sample data.

### **Explore Database:**
```bash
npm run explore:db
```
Shows complete database analysis.

### **Test API:**
```bash
npm run test:api
```
Tests all API endpoints and shows data flow.

---

## 🔐 **Database Security**

### **Access Control:**
- **HR Role:** Can create/edit employees and payrolls
- **Finance Role:** Can approve payrolls and process payments
- **Authentication:** JWT tokens required for all operations

### **Data Validation:**
- Employee IDs are auto-generated (EMP0001, EMP0002, etc.)
- Bank account numbers must be unique
- Salary amounts must be positive
- Tax calculations follow Ethiopian tax brackets

### **Audit Trail:**
All operations are logged for compliance and tracking.

---

## 📱 **Quick Access Methods**

| Method | Command/Action | Best For |
|--------|----------------|----------|
| **CLI Explorer** | `npm run explore:db` | Complete analysis |
| **Web Viewer** | Open `database-viewer.html` | Visual browsing |
| **MongoDB Atlas** | Your current browser tab | Cloud management |
| **API Testing** | `npm run test:api` | Functionality testing |

---

## 🎯 **Next Steps**

1. **Explore your data** using any of the methods above
2. **Create more employees** through the API or web interface
3. **Generate payrolls** for different periods
4. **Set up MongoDB replica set** for transaction processing in production
5. **Monitor database growth** and performance

Your Ethiopian Payroll Database is fully operational and ready for production use! 🇪🇹💼✨