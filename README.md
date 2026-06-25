# Jobsync Backend

A full-stack MERN job board backend built with a hybrid LinkedIn-style architecture. Any user can create a company and post jobs — no admin role, ownership-based permissions only.

---

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB + Mongoose
- **Authentication:** JWT (access token: 1h, refresh token: 10d)
- **Password Hashing:** Bcrypt
- **File Uploads:** Cloudinary + Multer
- **Cookie Handling:** Cookie-parser
- **Other:** CORS, dotenv

---

## Project Structure

```
src/
  controllers/
    user.controller.js
    company.controller.js
    job.controller.js
    application.controller.js
  middleware/
    auth.middleware.js
    multer.middleware.js
  models/
    user.model.js
    company.model.js
    job.model.js
    application.model.js
  routes/
    user.routes.js
    company.routes.js
    job.routes.js
    application.routes.js
  db/
    index.js
  utils/
    asyncHandler.js
    ApiError.js
    ApiResponse.js
    cloudinary.js
  app.js
  constants.js
  index.js
```

---

## Environment Variables

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

## Getting Started

```bash
# Clone the repo
git clone https://github.com/anjumhere/Jobsync-Backend.git
cd Jobsync-Backend

# Install dependencies
npm install

# Start development server
npm run dev
```

---

## Models

### User

| Field        | Type       | Notes                    |
| ------------ | ---------- | ------------------------ |
| fullName     | String     | required                 |
| email        | String     | required, unique         |
| password     | String     | bcrypt hashed            |
| avatar       | String     | Cloudinary URL           |
| coverImage   | String     | Cloudinary URL           |
| headline     | String     | —                        |
| bio          | String     | —                        |
| skills       | [String]   | array of skill tags      |
| resume       | String     | PDF only, Cloudinary URL |
| savedJobs    | [ObjectId] | ref: Job                 |
| refreshToken | String     | —                        |

### Company

| Field       | Type     | Notes               |
| ----------- | -------- | ------------------- |
| owner       | ObjectId | ref: User, required |
| name        | String   | required            |
| description | String   | —                   |
| logo        | String   | Cloudinary URL      |
| website     | String   | —                   |
| industry    | String   | —                   |
| location    | String   | —                   |

### Job

| Field        | Type     | Notes                                                |
| ------------ | -------- | ---------------------------------------------------- |
| company      | ObjectId | ref: Company, required                               |
| title        | String   | required                                             |
| description  | String   | required                                             |
| requirements | [String] | —                                                    |
| location     | String   | required                                             |
| jobType      | String   | enum: full-time/part-time/contract/internship/remote |
| salaryMin    | Number   | —                                                    |
| salaryMax    | Number   | —                                                    |
| isActive     | Boolean  | default: true                                        |

### Application

| Field     | Type     | Notes                                    |
| --------- | -------- | ---------------------------------------- |
| job       | ObjectId | ref: Job, required                       |
| applicant | ObjectId | ref: User, required                      |
| status    | String   | enum: applied/reviewed/accepted/rejected |
| resume    | String   | snapshot at time of apply, required      |
| coverNote | String   | —                                        |

---

## API Reference

Base URL: `/api/v1`

### User Routes `/api/v1/users`

| Method | Route                | Access  | Description                                       |
| ------ | -------------------- | ------- | ------------------------------------------------- |
| POST   | `/register`          | Public  | Register with optional avatar, coverImage, resume |
| POST   | `/login`             | Public  | Login with email or username                      |
| POST   | `/logout`            | Private | Logout current user                               |
| POST   | `/refresh-token`     | Private | Refresh access token                              |
| POST   | `/change-password`   | Private | Change password                                   |
| GET    | `/current-user`      | Private | Get logged-in user data                           |
| PATCH  | `/update-account`    | Private | Update fullName, headline, bio                    |
| PATCH  | `/avatar`            | Private | Update avatar image                               |
| PATCH  | `/cover-image`       | Private | Update cover image                                |
| PATCH  | `/resume`            | Private | Update resume (PDF only)                          |
| POST   | `/skills`            | Private | Add a skill                                       |
| DELETE | `/skills/:skill`     | Private | Remove a skill                                    |
| POST   | `/saved-jobs/:jobId` | Private | Bookmark a job                                    |
| DELETE | `/saved-jobs/:jobId` | Private | Remove bookmarked job                             |
| GET    | `/saved-jobs`        | Private | Get all saved jobs                                |

### Company Routes `/api/v1/companies`

| Method | Route           | Access     | Description                                 |
| ------ | --------------- | ---------- | ------------------------------------------- |
| POST   | `/`             | Private    | Create a company                            |
| GET    | `/`             | Public     | List/search companies with pagination       |
| GET    | `/my-companies` | Private    | Get companies owned by logged-in user       |
| GET    | `/:id`          | Public     | Get company by ID (populates owner)         |
| PATCH  | `/:id`          | Owner only | Update company details                      |
| PATCH  | `/:id/logo`     | Owner only | Update company logo                         |
| DELETE | `/:id`          | Owner only | Delete company (blocked if has active jobs) |

### Job Routes `/api/v1/jobs`

| Method | Route                 | Access     | Description                        |
| ------ | --------------------- | ---------- | ---------------------------------- |
| POST   | `/`                   | Private    | Post a job (must own the company)  |
| GET    | `/`                   | Public     | Search/filter jobs with pagination |
| GET    | `/:id`                | Public     | Get job by ID                      |
| GET    | `/company/:companyId` | Public     | Get all jobs under a company       |
| PATCH  | `/:id`                | Owner only | Update job details                 |
| PATCH  | `/:id/toggle-active`  | Owner only | Toggle job active status           |
| DELETE | `/:id`                | Owner only | Delete a job                       |

### Application Routes `/api/v1/applications`

| Method | Route              | Access         | Description                            |
| ------ | ------------------ | -------------- | -------------------------------------- |
| POST   | `/:jobId`          | Private        | Apply to a job                         |
| GET    | `/my-applications` | Private        | Get all applications by logged-in user |
| GET    | `/job/:jobId`      | Owner only     | Get all applications for a job         |
| PATCH  | `/:id/status`      | Owner only     | Update application status              |
| DELETE | `/:id`             | Applicant only | Withdraw application                   |

---

## Key Patterns

**Error handling** — all errors use `ApiError(statusCode, message)` wrapped in `asyncHandler`.

**Responses** — all responses use `ApiResponse(statusCode, data, message)`.

**Auth** — `verifyJWT` middleware on all protected routes. Tokens sent via httpOnly cookies.

**File uploads** — `upload.single()` for one file routes, `upload.fields()` for register (avatar + coverImage + resume). All files go to Cloudinary.

**Ownership checks** — `document.owner.toString() !== req.user._id.toString()` pattern throughout.

**Pagination** — `page`, `limit`, `skip` pattern on all list routes. Response includes `total` and `totalPages`.

**Skill management** — `$addToSet` to add, `$pull` to remove. Prevents duplicates automatically.

**Resume snapshot** — resume URL is copied from the user document at apply time and stored on the Application document. Changes to the user's resume do not affect submitted applications.

---

## Status

| Layer                    | Status         |
| ------------------------ | -------------- |
| Models                   | ✅ Complete    |
| User controllers         | ✅ Complete    |
| Company controllers      | ✅ Complete    |
| Job controllers          | 🔄 In progress |
| Application controllers  | ⏳ Not started |
| Postman testing          | 🔄 In progress |
| Frontend (separate repo) | ⏳ Not started |

---

## Author

**Anjum** — Self-taught full-stack developer based in Rawalpindi, Pakistan.
GitHub: [@anjumhere](https://github.com/anjumhere)
