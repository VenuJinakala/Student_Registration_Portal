# Students Registration Forms & Evaluation System

A fullstack application built with **React.js**, **Node.js / Express**, and a **SQLite Database** (`schema.sql` included), strictly fulfilling every requirement and mockup from the **Task Document & Evaluation Guide**.

### 🌐 Live Deployment Link:
👉 **[https://venujinakala.github.io/Student_Registration_Portal/](https://venujinakala.github.io/Student_Registration_Portal/)**

---

## 🚀 Features & Evaluation Checklist Compliance

### 1. Student Signup Form
- **Fields**: Full Name, Email, Password, Date of Birth, Gender (radio buttons), Qualification (dropdown), Interests (checkboxes: Coding, Design, Gaming, Sports), Class, Subject, Marks, and Aadhaar Document Upload.
- **Duplicate Email Validation**: Triggers the exact error: `"This email is already registered."`.
- **File Validation**: Validates that uploaded Aadhaar documents are **PDF files only**.
- **File Upload Security**: Uploaded Aadhaar files are automatically renamed with randomized unique identifiers (`aadhaar_<timestamp>_<randomHex>.pdf`) in `server/uploads/` so files never overwrite each other.

### 2. Single Unified Login Screen
- Single screen for both Admins and Students with credentials redirection:
  - **Admin login** routes to the **Admin Dashboard** (`/admin-dashboard`).
  - **Student login** routes to the **Student Dashboard** (`/student-dashboard`).
- **Functional Forgot Password Flow**: Modal/flow allows resetting password with confirmation.

### 3. Student Dashboard & Profile Editing
- **Welcome Banner**: Displays `"Welcome, [User Name] (User ID: #[ID])"`, matching the mockup:
  `Welcome, John Doe (User ID: #STU001)`.
- Displays all submitted student details with a **locked email indicator 🔒**.
- **Edit Profile**: Updates information while **keeping email locked/uneditable**, and allows replacing the Aadhaar PDF document.
- Clickable links/modal to open and inspect the uploaded Aadhaar PDF document.

### 4. Protected Admin Dashboard & Live Filters
- **Protected Access**: Route guards block unauthorized access or non-admin users.
- **Student Records Table**: Displays all registered students with computed Age, Class, Marks, Interests, and Aadhaar links.
- **Instant Live Search & Filters**:
  - Filter instantly by **Name** / Student ID.
  - Filter instantly by **Class**.
  - Filter by **Age (Minimum)** and **Age (Maximum)** (dynamically calculated from Date of Birth).
- **CRUD Controls**:
  - **Delete Record**: Confirmation modal and record deletion.
  - **Edit User Details**: **Strict evaluation rule enforced: Name and Email stay strictly locked/uneditable**.

### 5. LocalStorage Fallback Resilience
- In addition to the live Node.js + Express backend, client-side persistence and fallback are included as described in the specification's fallback note.

---

## 🔑 Default Credentials

| Role | Email | Password | User ID |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@example.com` | `admin123` | - |
| **Pre-seeded Student** | `john.doe@example.com` | `password123` | `#STU001` |

*(Convenient one-click Demo buttons are also available on the Login screen).*

---

## 📁 Project Structure

```
├── client/                     # Frontend React (Vite + Bootstrap 5)
│   ├── src/
│   │   ├── components/         # Navbar, Footer, ProtectedRoute, Modals
│   │   ├── pages/              # LoginPage, SignupPage, StudentDashboard, AdminDashboard
│   │   ├── services/           # api.js (backend API + localStorage fallback)
│   │   ├── App.jsx             # React Router setup
│   │   └── index.css           # Mockup-matching custom styling
│   └── vite.config.js          # API & /uploads proxy to backend port 5000
├── server/                     # Backend API (Node.js + Express + SQLite)
│   ├── uploads/                # Secured randomized Aadhaar PDF storage
│   ├── db.js                   # SQLite database connector & queries
│   ├── schema.sql              # Database schema & seed data
│   ├── server.js               # Express API endpoints & Multer upload
│   └── package.json
├── schema.sql                  # Database schema for deployment / evaluation
├── run_eval_tests.js           # Automated end-to-end evaluation test suite
└── package.json                # Root concurrent scripts
```

---

## 🛠️ How to Run Locally

### 1. Start Both Backend & Frontend
From the root directory:
```bash
npm run dev
```
- **Frontend URL**: [http://localhost:3000](http://localhost:3000)
- **Backend API URL**: [http://localhost:5000](http://localhost:5000)

### 2. Run Automated Evaluation Test Suite
```bash
node run_eval_tests.js
```
Runs an end-to-end test suite checking all 11 criteria (duplicate email validation, non-PDF rejection, randomized file renaming, admin locked name/email, student locked email, age filters, forgot password, CRUD operations).
