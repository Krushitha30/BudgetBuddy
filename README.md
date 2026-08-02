# 💰 BudgetBuddy

**BudgetBuddy** is a full-stack personal budget planning and expense management platform. It allows users to securely register, log in, create and manage expenses across different categories, filter and sort their expenses, and calculate total spending — all protected by JWT authentication.

---

## 🚀 Tech Stack

### Backend
| Tool | Description |
|---|---|
| **Django 6.0** | Python web framework |
| **Django REST Framework** | RESTful API development |
| **Simple JWT** | JSON Web Token authentication |
| **SQLite** | Default local database |
| **django-cors-headers** | Cross-origin request handling |
| **python-decouple** | Environment variable management |

### Frontend
| Tool | Description |
|---|---|
| **React 19** | UI library |
| **Vite** | Frontend build tool and dev server |
| **React Router DOM** | Client-side routing |
| **Axios** | HTTP requests to the backend API |

---

## 📁 Project Structure

```
BudgetBuddy/
├── backend/
│   ├── config/          # Django project settings and main URL routing
│   ├── users/           # User registration, login, logout, profile APIs
│   ├── expenses/        # Expense CRUD, filtering, sorting, total APIs
│   ├── budgets/         # Budget management module
│   ├── reports/         # Reporting module
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── src/             # React components, pages, and routing
│   ├── public/
│   ├── index.html
│   └── package.json
├── screenshots/         # Postman API verification screenshots
└── README.md
```

---

## ⚙️ Installation & Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- pip
- npm

---

### 1. Clone the Repository

```bash
git clone https://github.com/Krushitha30/BudgetBuddy.git
cd BudgetBuddy
```

---

### 2. Backend Setup

```bash
# Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # macOS/Linux

# Install dependencies
pip install -r backend/requirements.txt

# Run database migrations
cd backend
python manage.py migrate

# Create a superuser (optional, for Django admin)
python manage.py createsuperuser

# Start the development server
python manage.py runserver
```

The backend will run at: **`http://127.0.0.1:8000`**

---

### 3. Frontend Setup

```bash
# In a new terminal, navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```

The frontend will run at: **`http://localhost:5173`**

---

## 🔐 Authentication

BudgetBuddy uses **JWT (JSON Web Token)** based authentication.

| Endpoint | Method | Description |
|---|---|---|
| `/api/users/register/` | POST | Register a new user |
| `/api/token/` | POST | Login and obtain access & refresh tokens |
| `/api/token/refresh/` | POST | Refresh the access token |
| `/api/users/logout/` | POST | Logout and blacklist the refresh token |
| `/api/users/profile/` | GET | Get authenticated user's profile |

Include the access token in every request header:
```
Authorization: Bearer <access_token>
```

---

## 📊 Expense APIs

All expense endpoints require authentication via Bearer Token.

### CRUD Operations

| Endpoint | Method | Description |
|---|---|---|
| `/api/expenses/` | GET | List all expenses for the logged-in user |
| `/api/expenses/` | POST | Create a new expense |
| `/api/expenses/<id>/` | GET | Retrieve a specific expense |
| `/api/expenses/<id>/` | PATCH | Update a specific expense |
| `/api/expenses/<id>/` | DELETE | Delete a specific expense |
| `/api/expenses/total/` | GET | Get total sum of all expenses |

---

### 🏷️ Expense Categories

The `category` field supports the following choices:

| Category |
|---|
| `FOOD` |
| `TRAVEL` |
| `SHOPPING` |
| `EDUCATION` |
| `ENTERTAINMENT` |
| `HEALTHCARE` |
| `BILLS` |
| `MISCELLANEOUS` |

---

### 🔍 Filtering by Category

Filter expenses by category using a query parameter:

```
GET /api/expenses/?category=FOOD
```

---

### 🔃 Sorting Expenses

Sort expenses using the `sort` query parameter:

| Sort Value | Description |
|---|---|
| `latest` (default) | Latest expense dates first |
| `oldest` | Oldest expense dates first |
| `highest_amount` | Highest amount first |
| `lowest_amount` | Lowest amount first |

**Example:**
```
GET /api/expenses/?sort=highest_amount
GET /api/expenses/?sort=oldest
```

---

### 💵 Total Expenses

Get the total sum of all expenses for the logged-in user:
```
GET /api/expenses/total/
```

Get the total for a specific category:
```
GET /api/expenses/total/?category=FOOD
```

**Response:**
```json
{
    "total_expense": 279.50
}
```

---

## 📝 Sample Request Body (Create Expense)

```json
{
    "title": "Weekly Groceries",
    "category": "FOOD",
    "amount": 120.50,
    "expense_date": "2026-07-14",
    "description": "Supermarket run"
}
```

---

## 🧪 Running Tests

```bash
cd backend
python manage.py test
```

The test suite covers:
- ✅ Create, Retrieve, Update, and Delete Expense
- ✅ Category choice validation
- ✅ Filtering by category
- ✅ Sorting (latest, oldest, highest amount, lowest amount)
- ✅ Total expense calculation (with and without category filter)
- ✅ User data isolation (each user only sees their own data)

---

## 📸 API Verification Screenshots

All Postman verification screenshots are stored in the [`screenshots/`](./screenshots) folder.

| Screenshot | Description |
|---|---|
| `create_expense.png` | POST request - Create a new expense |
| `view_expenses.png` | GET request - View all expenses |
| `update_expense.png` | PATCH request - Update an expense |
| `delete_expense.png` | DELETE request - Delete an expense |
| `filter_expenses_category.png` | GET request - Filter by category |
| `sort_expenses_highest.png` | GET request - Sort by highest amount |
| `total_expenses.png` | GET request - Total expenses calculation |

---

## 👩‍💻 Author

**Krushitha**
- GitHub: [@Krushitha30](https://github.com/Krushitha30)

---

## 📄 License

This project is licensed under the MIT License.
