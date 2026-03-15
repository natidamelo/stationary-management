# 📦 Stationery Management System

A comprehensive web-based stationery management system with role-based access control, inventory tracking, and distribution management.

## 🚀 Technology Stack

- **Frontend:** React 18, TypeScript, Vite, Material UI
- **Backend:** NestJS, Mongoose (MongoDB), JWT Authentication
- **Database:** MongoDB
- **Containerization:** Docker & Docker Compose

## ✨ Key Features

- **Multi-Tenant Ready:** Support for multiple shops/locations.
- **User Roles:** Admin, Manager, Employee, Inventory Clerk.
- **Inventory Management:** SKU tracking, reorder levels, price history, and image uploads.
- **Supply Chain:** Supplier management, Purchase Requests, and Purchase Orders.
- **Distribution:** Track item issuance to departments and handle returns/damages.
- **Reporting:** Real-time dashboard, stock movement logs, and CSV exports.

---

## 💻 Local Development

### Prerequisites
- [Node.js 20+](https://nodejs.org/)
- [MongoDB](https://www.mongodb.com/try/download/community) (Or use Docker)

### 1. Backend Setup
```bash
cd backend
npm install
# Update .env with your MongoDB URI
npm run start:dev
```
- **API Docs:** `http://localhost:3000/api/docs` (Swagger)

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
- **App:** `http://localhost:5173`

---

## 🐳 Docker Setup (Recommended)

To run the entire system (DB + API + App) with one command:

```bash
docker-compose up -d
```
- **Frontend:** `http://localhost:80`
- **Backend/API:** `http://localhost:3000`

---

## 🌐 Go Online (Cloud Deployment)

To access this project from anywhere:

1. **Initialize Git**: `git init` in the root folder.
2. **Push to GitHub**: Create a repository and push your code.
3. **Deploy to Railway.app**: 
   - Connect your GitHub repo.
   - Railway will automatically detect the `docker-compose.yml`.
   - Set your `MONGODB_URI` and `JWT_SECRET` in the dashboard.

---

## 🔐 Default Credentials
- **Admin:** `admin@example.com`
- **Password:** `Admin@123`
stribution`, `POST .../issue`, `.../return/:id`, `.../damage`
- `GET /api/dashboard/summary`, `GET /api/reports/stock`, `GET /api/reports/stock/csv`
- `GET /api/search?q=...`, `POST /api/upload`

Full OpenAPI spec at **http://localhost:3000/api/docs** when the backend is running.
