# 🚀 JobSync Backend API

[![Live](https://img.shields.io/badge/status-live-brightgreen)](https://jobsyc.bonto.run)
[![Node.js](https://img.shields.io/badge/node.js-20.x-green)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-blue)](https://mongodb.com/)

**JobSync** is a full‑stack job board platform that blends a modern MERN stack with a LinkedIn‑style permission system.  
Any user can create a company and post jobs — **no admin role**, only ownership‑based access control.

> 🟢 **Production API:** [`https://jobsyc.bonto.run/api/v1/`](https://jobsyc.bonto.run/api/v1/)  
> Hosted on **Bonto** – fully functional and battle‑tested with Postman.

---

## 📖 Table of Contents

- [Live API & Deployment](#live-api--deployment)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Data Models](#data-models)
- [API Reference](#api-reference)
- [Key Patterns](#key-patterns)
- [Project Status](#project-status)
- [Author](#author)

---

## 🌐 Live API & Deployment

The backend is **live and production‑ready**, deployed on **Bonto**. All routes have been verified with Postman.

- **Base URL:** [`https://jobsyc.bonto.run/api/v1/`](https://jobsyc.bonto.run/api/v1/)
- **Example Endpoint:**  
  `POST /users/login` – returns a JWT and sets httpOnly cookies.

You can test the API immediately using your favourite HTTP client.  
_(A Postman collection is available upon request.)_

---

## 🛠️ Tech Stack

| Layer              | Technology                                      |
| ------------------ | ----------------------------------------------- |
| **Runtime**        | Node.js                                         |
| **Framework**      | Express.js                                      |
| **Database**       | MongoDB + Mongoose ODM                          |
| **Authentication** | JWT (access 1h, refresh 10d) + httpOnly cookies |
| **Password**       | Bcrypt                                          |
| **File Uploads**   | Cloudinary + Multer                             |
| **Utilities**      | Cookie‑parser, CORS, dotenv                     |

---

## 📂 Project Structure

```plaintext
src/
├── controllers/
│   ├── user.controller.js
│   ├── company.controller.js
│   ├── job.controller.js
│   └── application.controller.js
├── middleware/
│   ├── auth.middleware.js
│   └── multer.middleware.js
├── models/
│   ├── user.model.js
│   ├── company.model.js
│   ├── job.model.js
│   └── application.model.js
├── routes/
│   ├── user.routes.js
│   ├── company.routes.js
│   ├── job.routes.js
│   └── application.routes.js
├── db/
│   └── index.js
├── utils/
│   ├── asyncHandler.js
│   ├── ApiError.js
│   ├── ApiResponse.js
│   └── cloudinary.js
├── app.js
├── constants.js
└── index.js
```

---

## 🔐 Environment Variables

Create a `.env` file in the root:

```env
PORT=8000
MONGODB_URI=your_mongodb_connection_string
CORS_ORIGIN=http://localhost:5173

ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=1h
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=10d

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## 🏁 Getting Started

```bash
# Clone the repository
git clone https://github.com/anjumhere/Jobsync-Backend.git
cd Jobsync-Backend

# Install dependencies
npm install

# Start the development server (with auto‑reload)
npm run dev
```

---

## 📊 Data Models

### 👤 User

| Field          | Type       | Notes                    |
| -------------- | ---------- | ------------------------ |
| `fullName`     | String     | required                 |
| `email`        | String     | required, unique         |
| `password`     | String     | bcrypt‑hashed            |
| `avatar`       | String     | Cloudinary URL           |
| `coverImage`   | String     | Cloudinary URL           |
| `headline`     | String     | –                        |
| `bio`          | String     | –                        |
| `skills`       | [String]   | array of skill tags      |
| `resume`       | String     | PDF only, Cloudinary URL |
| `savedJobs`    | [ObjectId] | ref: `Job`               |
| `refreshToken` | String     | –                        |

### 🏢 Company

| Field         | Type     | Notes            |
| ------------- | -------- | ---------------- |
| `owner`       | ObjectId | ref: `User`, req |
| `name`        | String   | required         |
| `description` | String   | –                |
| `logo`        | String   | Cloudinary URL   |
| `website`     | String   | –                |
| `industry`    | String   | –                |
| `location`    | String   | –                |

### 💼 Job

| Field          | Type     | Notes                                                                  |
| -------------- | -------- | ---------------------------------------------------------------------- |
| `company`      | ObjectId | ref: `Company`, req                                                    |
| `title`        | String   | required                                                               |
| `description`  | String   | required                                                               |
| `requirements` | [String] | –                                                                      |
| `location`     | String   | required                                                               |
| `jobType`      | String   | enum: `full-time` / `part-time` / `contract` / `internship` / `remote` |
| `salaryMin`    | Number   | –                                                                      |
| `salaryMax`    | Number   | –                                                                      |
| `isActive`     | Boolean  | default: `true`                                                        |

### 📝 Application

| Field       | Type     | Notes                                                  |
| ----------- | -------- | ------------------------------------------------------ |
| `job`       | ObjectId | ref: `Job`, required                                   |
| `applicant` | ObjectId | ref: `User`, required                                  |
| `status`    | String   | enum: `applied` / `reviewed` / `accepted` / `rejected` |
| `resume`    | String   | snapshot at apply time, required                       |
| `coverNote` | String   | –                                                      |

---

## 📡 API Reference

**Base URL:** `/api/v1`  
**Full Production Base:** [`https://jobsyc.bonto.run/api/v1/`](https://jobsyc.bonto.run/api/v1/)

### 👤 User Routes (`/api/v1/users`)

| Method | Route                | Access  | Description                                  |
| ------ | -------------------- | ------- | -------------------------------------------- |
| POST   | `/register`          | Public  | Register with optional avatar, cover, resume |
| POST   | `/login`             | Public  | Login with email or username                 |
| POST   | `/logout`            | Private | Logout current user                          |
| POST   | `/refresh-token`     | Private | Refresh access token                         |
| POST   | `/change-password`   | Private | Change password                              |
| GET    | `/current-user`      | Private | Get logged‑in user data                      |
| PATCH  | `/update-account`    | Private | Update `fullName`, `headline`, `bio`         |
| PATCH  | `/avatar`            | Private | Update avatar image                          |
| PATCH  | `/cover-image`       | Private | Update cover image                           |
| PATCH  | `/resume`            | Private | Update resume (PDF only)                     |
| POST   | `/skills`            | Private | Add a skill                                  |
| DELETE | `/skills/:skill`     | Private | Remove a skill                               |
| POST   | `/saved-jobs/:jobId` | Private | Bookmark a job                               |
| DELETE | `/saved-jobs/:jobId` | Private | Remove bookmarked job                        |
| GET    | `/saved-jobs`        | Private | Get all saved jobs                           |

### 🏢 Company Routes (`/api/v1/companies`)

| Method | Route           | Access     | Description                                 |
| ------ | --------------- | ---------- | ------------------------------------------- |
| POST   | `/`             | Private    | Create a company                            |
| GET    | `/`             | Public     | List/search companies with pagination       |
| GET    | `/my-companies` | Private    | Get companies owned by user                 |
| GET    | `/:id`          | Public     | Get company by ID (populates owner)         |
| PATCH  | `/:id`          | Owner only | Update company details                      |
| PATCH  | `/:id/logo`     | Owner only | Update company logo                         |
| DELETE | `/:id`          | Owner only | Delete company (blocked if has active jobs) |

### 💼 Job Routes (`/api/v1/jobs`)

| Method | Route                 | Access     | Description                        |
| ------ | --------------------- | ---------- | ---------------------------------- |
| POST   | `/`                   | Private    | Post a job (must own the company)  |
| GET    | `/`                   | Public     | Search/filter jobs with pagination |
| GET    | `/:id`                | Public     | Get job by ID                      |
| GET    | `/company/:companyId` | Public     | Get all jobs under a company       |
| PATCH  | `/:id`                | Owner only | Update job details                 |
| PATCH  | `/:id/toggle-active`  | Owner only | Toggle job active status           |
| DELETE | `/:id`                | Owner only | Delete a job                       |

### 📝 Application Routes (`/api/v1/applications`)

| Method | Route              | Access         | Description                    |
| ------ | ------------------ | -------------- | ------------------------------ |
| POST   | `/:jobId`          | Private        | Apply to a job                 |
| GET    | `/my-applications` | Private        | Get all applications by user   |
| GET    | `/job/:jobId`      | Owner only     | Get all applications for a job |
| PATCH  | `/:id/status`      | Owner only     | Update application status      |
| DELETE | `/:id`             | Applicant only | Withdraw application           |

---

## 🧩 Key Patterns

- **Error Handling:** All errors are wrapped in `ApiError(statusCode, message)` and managed via `asyncHandler`.
- **Responses:** Uniform `ApiResponse(statusCode, data, message)` structure.
- **Authentication:** `verifyJWT` middleware protects private routes; tokens are stored in **httpOnly cookies**.
- **File Uploads:** Multer handles single or multiple files; all uploads are sent to Cloudinary.
- **Ownership Checks:** `document.owner.toString() !== req.user._id.toString()` pattern throughout.
- **Pagination:** All list endpoints accept `page` and `limit`, returning `total` and `totalPages`.
- **Skill Management:** `$addToSet` for adding, `$pull` for removal (prevents duplicates).
- **Resume Snapshot:** The resume URL is copied from the user at application time; changes to the user’s resume do not affect existing applications.

---

## ✅ Project Status

| Layer                     | Status         |
| ------------------------- | -------------- |
| Models                    | ✅ Complete    |
| User Controllers          | ✅ Complete    |
| Company Controllers       | ✅ Complete    |
| Job Controllers           | ✅ Complete    |
| Application Controllers   | ✅ Complete    |
| Postman Testing           | ✅ Complete    |
| **Production Deployment** | ✅ **Live**    |
| Frontend (separate repo)  | ⏳ Not started |

---

## 👨‍💻 Author

**Anjum**  
[GitHub: @anjumhere](https://github.com/anjumhere)

---

_Built with ❤️ and a lot of Postman requests._
