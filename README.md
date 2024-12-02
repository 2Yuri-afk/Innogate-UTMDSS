# **Thesis Management System**

An all-in-one platform for managing thesis projects, designed to streamline collaboration, scheduling, and monitoring between students, teachers, advisers, and admins. Built with React and Firebase, the system ensures seamless role-based access, robust authentication, and real-time updates.

---

## **Features**

- **Role-Based Access Control (RBAC):**

  - **Admin:** Manage users, proposals, and schedules.
  - **Adviser:** Approve proposals, monitor thesis progress, and communicate with groups.
  - **Teacher:** Provide evaluations and monitor student progress.
  - **Student:** Submit proposals, upload documents, and view adviser feedback.

- **Dynamic Thesis Workflow:**

  - Real-time updates for thesis status (pending, accepted, rejected).
  - Custom notifications for approvals, rejections, and deadlines.

- **Group Management:**

  - Automatic grouping of students.
  - Assignment of advisers and peer collaboration tools.

- **Modern UI/UX:**
  - Responsive design for mobile and desktop.
  - Dark and light theme support.
- **Security & Authentication:**

  - Firebase authentication with email/password login.
  - Secure user data storage in Firestore.

- **File Upload System:**
  - Upload thesis-related files securely.
  - Organized file structure per group.

---

## **Tech Stack**

### **Frontend:**

- [React](https://reactjs.org/)
- [CoreUI](https://coreui.io/react/)
- [react-big-calendar](https://github.com/jquense/react-big-calendar) for scheduling.

### **Backend:**

- [Firebase](https://firebase.google.com/)
  - Authentication
  - Firestore Database
  - Firebase Storage

### **Deployment:**

- [Vercel](https://vercel.com/)

---

## **Installation & Setup**

1. **Clone the Repository**

2. **Install Dependencies:**

   ```bash
   npm install
   ```

3. **Start the Development Server:**

   ```bash
   npm run start
   ```

## **License**

This project is licensed under the [MIT License](LICENSE).

---

## **Acknowledgements**

- CoreUI for the beautiful UI components.
- Firebase for backend services.

---
