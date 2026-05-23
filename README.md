# 🧘‍♂️ ArogyaMitra | AI Health & Fitness Companion

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

Welcome to **ArogyaMitra**, your personal, intelligent health companion built to help you eat better, train smarter, and stay consistent. 

Instead of relying on generic templates, ArogyaMitra leverages Large Language Models (LLMs) under the hood to provide actionable, highly personalized fitness and nutrition advice that adapts to your specific goals, body metrics, and lifestyle.

---

## ✨ Core Features

* 🤖 **AI Coach Chat:** Converse with an intelligent AI coach that understands your fitness context and provides real-time, actionable advice.
* 🏋️ **Dynamic Workout Plans:** Generate personalized routines complete with embedded YouTube tutorial videos for every exercise.
* 🥗 **Smart Nutrition Plans:** Receive macro-balanced meal plans meticulously tailored to your specific daily calorie targets.
* 📊 **Health Dashboard:** Clean, interactive visualizations of your BMI, BMR, and TDEE using Recharts and Chart.js.
* 📅 **Google Calendar Sync:** Push your generated workout sessions directly to your Google Calendar with a single click.
* 🔐 **Robust Authentication:** Secure sign-ups via Email/Password, Google OAuth, or GitHub OAuth, managed via stateless JWT sessions.

---

## 🛠️ Tech Stack & Architecture

**Frontend:** React 19, TypeScript, Vite, TailwindCSS, Recharts, Chart.js, Framer Motion

**Backend:** Node.js, Express, TypeScript, better-sqlite3, JWT Auth, bcrypt

**External Integrations:** Groq (LLaMA 3.3 70B), Google Gemini, YouTube Data API, Google OAuth, GitHub OAuth, Clerk

### 📂 Project Layout
```text
📦 arogyamitra
 ┣ 📂 backend/
 ┃ ┣ 📂 database/      # SQLite schema and connection logic
 ┃ ┣ 📂 middleware/    # Auth and error-handling middleware
 ┃ ┣ 📂 routes/        # Express REST API route handlers
 ┃ ┣ 📂 services/      # AI integrations, YouTube API, and external services
 ┃ ┗ 📜 server.ts      # Application entry point
 ┣ 📂 frontend/
 ┃ ┣ 📂 components/    # Reusable React UI components
 ┃ ┣ 📂 pages/         # Route-level views
 ┃ ┣ 📂 services/      # API client layer (Axios/Fetch)
 ┃ ┗ 📜 App.tsx        # Root component and router
 ┣ 📜 render.yaml      # Render deployment configuration
 ┗ 📜 package.json

```
## 🛡️ Security-First Approach
As a developer with a cybersecurity mindset, data protection is paramount in this application:
 * **Zero Client-Side Keys:** All AI and third-party API calls are strictly executed server-side. No sensitive API keys ever reach the browser.
 * **Encrypted Storage:** Passwords are salted and hashed using bcrypt (10 rounds) before hitting the database.
 * **Data Sanitization:** The password_hash is explicitly stripped from all API responses to prevent data leaks.
 * **Stateless Auth:** Secure session management utilizing HTTP-only, cryptographically signed JSON Web Tokens (JWTs).
## 🌐 REST API Endpoints
### 🔐 Authentication
| Method | Route | Description |
|---|---|---|
| POST | /api/auth/register | Create a new user account |
| POST | /api/auth/login | Authenticate user & receive JWT |
| GET | /api/auth/google/url | Initiate Google OAuth flow |
| GET | /api/auth/github/url | Initiate GitHub OAuth flow |
### 🧠 AI Features (Protected Routes)
| Method | Route | Description |
|---|---|---|
| POST | /api/workout/plan | Generate a customized workout plan |
| POST | /api/nutrition/plan | Generate a macro-balanced meal plan |
| POST | /api/coach/chat | Interact with the AI fitness coach |
### 📅 Integrations (Protected Routes)
| Method | Route | Description |
|---|---|---|
| POST | /api/google/calendar/schedule | Sync a workout to Google Calendar |
## 🚀 Local Development Setup
**1. Clone the repository:**
```bash
git clone [https://github.com/AbhirajSinghrajpoot/arogyamitra.git](https://github.com/AbhirajSinghrajpoot/arogyamitra.git)
cd arogyamitra

```
**2. Install dependencies:**
```bash
npm install

```
**3. Environment Configuration:**
```bash
cp .env.example .env

```
Open the .env file and populate it with your API keys:
 * **Groq/Gemini:** For AI coach generation.
 * **YouTube Data API v3:** For fetching exercise tutorials.
 * **Google/GitHub OAuth:** For authentication and calendar sync.
 * **JWT Secret:** Generate a strong 32-character hex key.
**4. Run the application:**
```bash
npm run dev

```
The application will spin up at http://localhost:3000.
## ☁️ Deployment (Render)
This project is optimized for deployment on Render.
 1. Connect this repository to a new Render Web Service.
 2. Build Command: npm install && npm run build
 3. Start Command: npm start
 4. **Important:** Because this app uses SQLite, ensure you attach a **Persistent Disk** on Render so your database survives redeployments.
## 👨‍💻 About the Developer
**Abhiraj Singh Rajpoot** | *Software Engineer & Full-Stack Developer*
Bridging the gap between scalable web development and system security. I build applications that not only solve real-world problems efficiently but also prioritize robust backend architectures and secure data flow.
📫 **Let's Connect:**
 * **Portfolio:** wizards-portfolio.vercel.app
 * **LinkedIn:** Abhiraj Singh Rajpoot
 * **GitHub:** @AbhirajSinghrajpoot
