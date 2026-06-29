
# 📚 Library Management System

![React](https://img.shields.io/badge/React-19-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)
![Express.js](https://img.shields.io/badge/Express.js-Backend-black?logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-green?logo=mongodb)
![JWT](https://img.shields.io/badge/JWT-Authentication-orange)

A full-stack **Library Management System** that enables librarians to efficiently manage books, members, and borrowing records while allowing members to browse and borrow books through a secure and responsive web application.

---

# 📖 Project Overview

The Library Management System is a modern web application designed to simplify library operations. It provides secure authentication, role-based authorization, book inventory management, member management, and borrowing/return functionality.

The project follows a client-server architecture where the React frontend communicates with an Express.js REST API. MongoDB serves as the primary database, while a JSON file is used as a fallback storage option when MongoDB is unavailable.

---

# ✨ Features

## Authentication
- User Registration
- Secure Login
- JWT Authentication
- Password Hashing using bcrypt
- Protected Routes

## Role-Based Access Control

### Librarian
- Add Books
- Update Books
- Delete Books
- Manage Members
- Issue Books
- Return Books
- View Server Logs
- View Database Status

### Member
- Browse Books
- Borrow Books
- Return Books
- View Borrowed Books

## Book Management

- Add New Books
- Edit Book Details
- Delete Books
- Search Books
- Track Available Copies
- ISBN Management
- Category Management

## Member Management

- Register Members
- Manage Profiles
- View Borrowing History

---

# 🛠 Technologies Used

## Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Lucide React

## Backend

- Express.js
- TypeScript
- JWT
- bcrypt
- CORS

## Database

- MongoDB
- Mongoose
- JSON Database (Fallback)

## Development Tools

- Node.js
- npm
- Git
- GitHub

---

# 📂 Project Structure

```
Library-Management-System
│
├── server/
│   ├── db.ts
│   ├── middleware.ts
│   └── routes.ts
│
├── src/
│   ├── components/
│   │   ├── ApiReference.tsx
│   │   ├── AuthCard.tsx
│   │   ├── BookForm.tsx
│   │   ├── BookList.tsx
│   │   ├── MemberManager.tsx
│   │   └── ServerLogs.tsx
│   │
│   ├── App.tsx
│   ├── main.tsx
│   └── types.ts
│
├── db.json
├── server.ts
├── package.json
└── README.md
```

---

# ⚙️ Installation Steps

## 1. Clone the Repository

```bash
git clone https://github.com/mayankgenwa/Library-Management-System.git
```

## 2. Navigate to the Project

```bash
cd Library-Management-System
```

## 3. Install Dependencies

```bash
npm install
```

## 4. Create Environment File

Create a `.env` file in the project root.

```env
JWT_SECRET=your_secret_key

MONGODB_URI=mongodb://localhost:27017/librarydb
```

## 5. Start Development Server

```bash
npm run dev
```

The application will start on the configured development port.

---

# 🌍 Environment Variables

| Variable | Description |
|----------|-------------|
| JWT_SECRET | Secret key used for signing JWT tokens |
| MONGODB_URI | MongoDB connection string |

Example:

```env
JWT_SECRET=mySecretKey123

MONGODB_URI=mongodb://localhost:27017/librarydb
```

---

# 🗄 Database Setup

## MongoDB (Recommended)

Install MongoDB and start the database server.

Example connection:

```
mongodb://localhost:27017/librarydb
```

The application automatically creates the required collections.

---

## JSON Database (Fallback)

If MongoDB is unavailable, the application automatically switches to the local `db.json` file to store application data.

No additional configuration is required.

---

# 🔐 Authentication Flow

```
User Registers
        │
        ▼
Password Hashed (bcrypt)
        │
        ▼
Stored in Database
        │
        ▼
User Login
        │
        ▼
Credentials Verified
        │
        ▼
JWT Token Generated
        │
        ▼
Token Sent to Client
        │
        ▼
Client Stores Token
        │
        ▼
Authenticated API Requests
```

---

# 📡 REST API Endpoints

## Authentication

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login user |

---

## Books

| Method | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/books` | Get all books |
| POST | `/api/books` | Add new book |
| PUT | `/api/books/:id` | Update book |
| DELETE | `/api/books/:id` | Delete book |

---

## Members

| Method | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/members` | Get all members |
| GET | `/api/members/me/books` | Get borrowed books |

---

## Borrowing

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/books/:id/borrow` | Borrow a book |
| POST | `/api/books/:id/return` | Return a book |

---

## System

| Method | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/system/logs` | View server logs |
| GET | `/api/system/db-info` | Database information |

---

# 🔒 Security Features

- JWT Authentication
- Password Hashing using bcrypt
- Protected API Routes
- Role-Based Authorization
- Secure Password Storage
- Request Validation

---

# 🚀 Running the Application

Development Mode

```bash
npm run dev
```

Production Build

```bash
npm run build
```

Run Production

```bash
npm start
```

---

# 🧪 Demo Credentials

## Librarian

```
Email:
eleanor@library.org

Password:
password123
```

## Member

```
Email:
julian@member.com

Password:
password123
```


---

# 🌐 Deployment URL

## Live Demo

```
https://mayankgenwa.github.io/Library-Management-System
```
