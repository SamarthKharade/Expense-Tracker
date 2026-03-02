# 💰 ExpenseAI - Smart Expense Tracker

A full-stack expense tracker with ML-powered insights built with React, Flask, and MongoDB Atlas.

## 🏗️ Project Structure

```
expense-tracker/
├── backend/          # Flask API
│   ├── app.py        # Main Flask app
│   ├── config.py     # Configuration
│   ├── requirements.txt
│   ├── routes/
│   │   ├── auth.py       # Login/Register
│   │   ├── expenses.py   # CRUD expenses
│   │   ├── budget.py     # Budget limits
│   │   └── insights.py   # ML insights endpoint
│   └── ml/
│       └── predictor.py  # ML model (z-score + trend analysis)
└── frontend/         # React app (Vite)
    └── src/
        ├── App.jsx
        ├── context/AuthContext.jsx
        ├── api/axios.js
        ├── pages/
        │   ├── Login.jsx
        │   └── Register.jsx
        └── components/
            ├── Navbar.jsx
            ├── Dashboard.jsx
            ├── AddExpense.jsx
            ├── ExpenseList.jsx
            ├── Charts.jsx
            ├── BudgetSettings.jsx
            └── MLInsights.jsx
```

## 🚀 Setup Instructions

### 1. MongoDB Atlas Setup
1. Go to https://cloud.mongodb.com and create a free account
2. Create a new cluster (free tier M0 is fine)
3. Create a database user with read/write access
4. Whitelist your IP address (or allow 0.0.0.0/0 for development)
5. Copy the connection string (looks like: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/`)

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env and add your MongoDB URI and a secret key

# Run the server
python app.py
```

The API runs on http://localhost:5000

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```

The app runs on http://localhost:3000

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔐 Authentication | JWT-based login/register |
| 💸 Add Expenses | Track expenses/income by category |
| 📋 Expense List | Filter, edit, delete transactions |
| 📊 Analytics | Pie charts, bar charts, monthly trends |
| 🎯 Budget | Set total and per-category monthly limits |
| 🤖 AI Insights | ML model compares this vs last month, detects anomalies using z-score, predicts end-of-month spending |

## 🤖 ML Model Details

The ML model in `backend/ml/predictor.py` does:

1. **Month-over-Month Comparison**: Compares spending in each category vs last month and flags 30%+ increases
2. **Anomaly Detection**: Uses z-score on 3-month historical data to detect unusual spending spikes (z > 2)
3. **End-of-Month Prediction**: Projects current spending pace to predict total by month end
4. **Smart Alerts**: Generates human-readable insights with severity levels

## 📡 API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Expenses
- `POST /api/expenses/` - Add expense
- `GET /api/expenses/` - Get expenses (filter by month, category)
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense
- `GET /api/expenses/summary/:month` - Get monthly summary by category

### Budget
- `GET /api/budget/:month` - Get budget
- `POST /api/budget/:month` - Set budget

### ML Insights
- `GET /api/insights/` - Get AI-powered spending insights

## 🛠️ Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS, Recharts, React Router
- **Backend**: Flask, Flask-JWT-Extended, PyMongo, Flask-CORS
- **Database**: MongoDB Atlas
- **ML**: NumPy, scikit-learn (Z-score anomaly detection)
