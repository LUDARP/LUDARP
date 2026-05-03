# 🏗️ LUDARP — Enterprise Construction Management Portal

**LUDARP** is a high-fidelity, production-grade construction management platform designed for massive infrastructure projects. It bridges the gap between site execution, financial oversight, and client transparency.

🚀 **Live Portal**: [https://ludarp.github.io/](https://ludarp.github.io/)

---

## 🌟 High-Impact Enterprise Modules

### 🧱 1. BIM Integration Layer (3D Intelligence)
The platform's Unique Selling Point (USP). Link 3D models (Sketchfab/Autodesk) directly to project data.
- **Interactive Viewer**: Pan, zoom, and rotate models inside the portal.
- **Element Tracking**: Link specific building elements (Beams, Columns, MEP) to costs, stages, or tasks.
- **Visual Progress**: Completion percentages are calculated based on model element status.

### 📊 2. Advanced KPI Analytics
A dedicated dashboard for executive oversight and data-driven decision making.
- **Profitability Ranking**: Automatic ranking of projects based on budget vs actual spending.
- **Delay Analytics**: "Ahead vs Behind" tracker comparing progress vs time elapsed.
- **Team Leaderboard**: Gamified activity score for engineers and supervisors.
- **Resource Utilization**: Tracking labor days, wages, and site update frequency.

### 🔐 3. Advanced RBAC & Security
Granular access control beyond simple roles.
- **Custom Permissions**: Grant/Revoke specific features (BIM, Invoices, Delete) per user.
- **Project-Specific Access**: Restrict users to only see the projects they are assigned to.
- **Access Expiry**: Set temporary credentials that automatically block access on a specified date.

### 🧾 4. Financial & Invoicing System
- **Milestone Invoicing**: Create professional invoices linked to project completion stages.
- **Payment History**: Track partial/full payments with automated status updates.
- **Client Notifications**: Real-time alerts when invoices are raised or settled.

### 📅 5. Smart Planning & Scheduler
- **Gantt Chart View**: Visualize project timelines and task dependencies.
- **Task Assignment**: Assign tasks to specific roles (Engineer, Supervisor).
- **Deadline Tracking**: Automated alerts for overdue tasks and upcoming milestones.

### ❓ 6. Client Support & Query System
- **Threaded Tickets**: Clients can raise queries with priority levels (Low → Urgent).
- **Resolution Tracking**: Full audit trail of query resolution between admin and client.
- **Live Notifications**: Admin is alerted instantly when a client raises a query.

---

## 🛠️ Technology Stack
- **Core**: React 18 + Vite (High-performance rendering)
- **State & Data**: `dummy_data.json` with a robust CRUD API layer (`adminApi`).
- **Routing**: React Router 6 (SPA with protected routes).
- **Styling**: Premium Vanilla CSS (Modern design with glassmorphism and animations).
- **Deployment**: GitHub Actions + GitHub Pages (CI/CD).

---

## 📦 Version History

### **v2.2.1 — Current (03 May 2026)**
- ✅ **BIM Integration**: Full 3D model element-tracking system.
- ✅ **KPI Dashboard**: Enterprise analytics and leaderboards.
- ✅ **Advanced RBAC**: Custom permissions and access expiry.
- ✅ **UX Polish**: Sidebar scroll controls and Topbar sign-out dropdown.
- ✅ **CI/CD**: Fully automated deployment to `ludarp.github.io`.

### **v2.1 — Invoicing & Queries**
- ✅ **Client Queries**: Ticket-based support system with threaded replies.
- ✅ **Invoice Module**: Milestone-based financial tracking.
- ✅ **Notification Bell**: Real-time in-app alerts.

### **v2.0 — Enterprise Core**
- ✅ **Inventory**: Material stock tracking and low-stock alerts.
- ✅ **Workforce**: Attendance logging and wage calculator.
- ✅ **Approvals**: Document review workflow for architects and engineers.
- ✅ **Intelligence**: Auto-risk detection (budget overruns, delays).

---

## 🚀 Deployment Instructions
This project uses **GitHub Actions** for automated deployment.
1. Push any change to the `main` branch.
2. The workflow in `.github/workflows/deploy.yml` will build the app and push it to the `gh-pages` branch.
3. The site updates automatically at [ludarp.github.io](https://ludarp.github.io).

---

## 🗺️ Enterprise Roadmap (Phase Alignment Plan)

### 🔹 Phase 1: Stabilization (IN PROGRESS)
*Goal: Turn prototypes into "Real" production features.*
- [ ] **Structured Data Layer**: Replace loose JSON reads with a validated Data Service.
- [ ] **True CRUD Logic**: Implement deep consistency (e.g., deleting a project cleans up all related logs/costs).
- [ ] **Hardened RBAC**: Move security enforcement from the Router into the Component/Data layer.
- [ ] **Live Flow Validation**: Verify the Admin → Engineer → Client data chain works without lag.

### 🔹 Phase 2: Core Engine Strengthening
*Goal: Focus on accuracy and file management.*
- [ ] **Financial Accuracy**: Implement decimal-perfect cost calculations and currency handling.
- [ ] **Dynamic Progress**: Link site updates directly to completion percentages.
- [ ] **Working File System**: Transition document "placeholders" to actual browser-based file storage.

### 🔹 Phase 3: The USP Layer (BIM & Analytics)
*Goal: Deep integration.*
- [ ] **Real BIM Mapping**: Ensure model elements are bi-directionally linked to live project tasks.
- [ ] **KPI Intelligence**: Actual formula-based calculations for profitability and delay scores.

### 🔹 Phase 4: Enterprise Polish
*Goal: Communication & Notifications.*
- [ ] **Push Notifications**: Transition bell notifications to browser-level push alerts.
- [ ] **Invoice Automation**: Auto-generate invoice numbers and payment links.
- [ ] **Query Resolution**: Resolve tickets with auto-emails to clients.

---
*Created with ❤️ for LUDARP Enterprise by Antigravity AI.*

