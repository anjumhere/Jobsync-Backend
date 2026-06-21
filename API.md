# Jobsync API Design

This document lists all planned API endpoints for the Job Board platform, organized by resource. Each route is designed before implementation to keep the API shape intentional and consistent.

## Access levels

- public — no authentication required
- logged-in — requires a valid access token (verifyJWT middleware)
- owner-only — requires authentication AND ownership of the resource (checked in controller logic)

---

## User

### POST /api/users/register

- Purpose: Create a new account
- Access: public

### POST /api/users/login

- Purpose: Log in with email + password
- Access: public

### POST /api/users/logout

- Purpose: Log out, clear refresh token
- Access: logged-in

### POST /api/users/refresh-token

- Purpose: Get a new access token using refresh token
- Access: logged-in (via refresh token)

### POST /api/users/change-password

- Purpose: Change password (requires old password)
- Access: logged-in

### GET /api/users/current-user

- Purpose: Get the logged-in user's profile
- Access: logged-in

### PATCH /api/users/update-account

- Purpose: Update fullName, headline, bio
- Access: logged-in

### PATCH /api/users/avatar

- Purpose: Update avatar image
- Access: logged-in

### PATCH /api/users/cover-image

- Purpose: Update cover image
- Access: logged-in

### PATCH /api/users/resume

- Purpose: Update resume file
- Access: logged-in

### POST /api/users/skills

- Purpose: Add one skill
- Access: logged-in

### DELETE /api/users/skills/:skill

- Purpose: Remove one skill
- Access: logged-in

### POST /api/users/saved-jobs/:jobId

- Purpose: Bookmark a job
- Access: logged-in

### DELETE /api/users/saved-jobs/:jobId

- Purpose: Remove a bookmarked job
- Access: logged-in

### GET /api/users/saved-jobs

- Purpose: List all bookmarked jobs
- Access: logged-in

### Notes

- Login uses email + password only, never fullName, since it isn't a secure identifier.
- update-account excludes email, changing email is treated as a separate, more sensitive flow (not yet designed).
- avatar, cover-image, and resume are separate routes from update-account because they involve file uploads (Multer + Cloudinary), which need different middleware than plain text updates.
- Skills use granular add/remove routes (not a full-array replace), matches how platforms like LinkedIn handle skill editing, and maps cleanly to MongoDB's $push / $pull operators.

---

## Company

### POST /api/companies

- Purpose: Create a company

# Jobsync API Design

This document lists all planned API endpoints for the Job Board platform, organized by resource. Each route is designed before implementation to keep the API shape intentional and consistent.

## Access levels

- public — no authentication required
- logged-in — requires a valid access token (verifyJWT middleware)
- owner-only — requires authentication AND ownership of the resource (checked in controller logic)

---

## User

### POST /api/users/register

- Purpose: Create a new account
- Access: public

### POST /api/users/login

- Purpose: Log in with email + password
- Access: public

### POST /api/users/logout

- Purpose: Log out, clear refresh token
- Access: logged-in

### POST /api/users/refresh-token

- Purpose: Get a new access token using refresh token
- Access: logged-in (via refresh token)

### POST /api/users/change-password

- Purpose: Change password (requires old password)
- Access: logged-in

### GET /api/users/current-user

- Purpose: Get the logged-in user's profile
- Access: logged-in

### PATCH /api/users/update-account

- Purpose: Update fullName, headline, bio
- Access: logged-in

### PATCH /api/users/avatar

- Purpose: Update avatar image
- Access: logged-in

### PATCH /api/users/cover-image

- Purpose: Update cover image
- Access: logged-in

### PATCH /api/users/resume

- Purpose: Update resume file
- Access: logged-in

### POST /api/users/skills

- Purpose: Add one skill
- Access: logged-in

### DELETE /api/users/skills/:skill

- Purpose: Remove one skill
- Access: logged-in

### POST /api/users/saved-jobs/:jobId

- Purpose: Bookmark a job
- Access: logged-in

### DELETE /api/users/saved-jobs/:jobId

- Purpose: Remove a bookmarked job
- Access: logged-in

### GET /api/users/saved-jobs

- Purpose: List all bookmarked jobs
- Access: logged-in

### Notes

- Login uses email + password only, never fullName, since it isn't a secure identifier.
- update-account excludes email, changing email is treated as a separate, more sensitive flow (not yet designed).
- avatar, cover-image, and resume are separate routes from update-account because they involve file uploads (Multer + Cloudinary), which need different middleware than plain text updates.
- Skills use granular add/remove routes (not a full-array replace), matches how platforms like LinkedIn handle skill editing, and maps cleanly to MongoDB's $push / $pull operators.

---

## Company

### POST /api/companies

- Purpose: Create a company
- Access: logged-in

### GET /api/companies

- Purpose: List/search all companies
- Access: public

### GET /api/companies/:id

- Purpose: Get one company's details
- Access: public

### GET /api/companies/my-companies

- Purpose: List companies the logged-in user owns
- Access: logged-in

### PATCH /api/companies/:id

- Purpose: Update a company (name, description, website, industry, location)
- Access: owner-only

### PATCH /api/companies/:id/logo

- Purpose: Update company logo
- Access: owner-only

### DELETE /api/companies/:id

- Purpose: Delete a company
- Access: owner-only

### Notes

- logo is its own route, same reasoning as avatar on User, file upload needs separate middleware from plain text updates.
- owner is never accepted from the request body on create, it's pulled from req.user.\_id (the verified JWT), so nobody can create a company and claim someone else as the owner.
- Block delete: if a Company still has Jobs attached, the delete request is rejected (e.g. "Cannot delete company with active job postings, close or delete jobs first"). This matches industry standard (LinkedIn, Greenhouse) of not silently cascading deletes through job postings and applicant history.

## Job

(planned next)

## Application

(planned next)

- Access: logged-in

### GET /api/companies

- Purpose: List/search all companies
- Access: public

### GET /api/companies/:id

- Purpose: Get one company's details
- Access: public

### GET /api/companies/my-companies

- Purpose: List companies the logged-in user owns
- Access: logged-in

### PATCH /api/companies/:id

- Purpose: Update a company (name, description, website, industry, location)
- Access: owner-only

### PATCH /api/companies/:id/logo

- Purpose: Update company logo
- Access: owner-only

### DELETE /api/companies/:id

- Purpose: Delete a company
- Access: owner-only

### Notes

- logo is its own route, same reasoning as avatar on User, file upload needs separate middleware from plain text updates.
- owner is never accepted from the request body on create, it's pulled from req.user.\_id (the verified JWT), so nobody can create a company and claim someone else as the owner.
- Block delete: if a Company still has Jobs attached, the delete request is rejected (e.g. "Cannot delete company with active job postings, close or delete jobs first"). This matches industry standard (LinkedIn, Greenhouse) of not silently cascading deletes through job postings and applicant history.

---

## Job

### POST /api/jobs

- Purpose: Post a new job under a company
- Access: logged-in + must own the company

### GET /api/jobs

- Purpose: Browse/search jobs (core search feature, e.g. "web development jobs")
- Access: public

### GET /api/jobs/:id

- Purpose: Get one job's full details
- Access: public

### GET /api/jobs/company/:companyId

- Purpose: List all jobs posted by one company
- Access: public

### PATCH /api/jobs/:id

- Purpose: Update a job's details
- Access: owner-only (via company ownership)

### PATCH /api/jobs/:id/toggle-active

- Purpose: Open or close a job posting (isActive true/false)
- Access: owner-only

### DELETE /api/jobs/:id

- Purpose: Delete a job
- Access: owner-only

### Notes

- GET /api/jobs is the single most important route in the app, it's the actual job search feature. Will support query params like ?search=&location=&jobType= at the controller level.
- "Owner-only" here is checked through Company ownership, not direct User ownership, since Job has no owner field of its own, only a company reference. The controller must look up Job -> Company -> owner and compare to req.user.\_id.
- A Job cannot be created without first specifying a valid, owned company (Job.company is required), matching the LinkedIn-style flow of needing a Company Page before posting a job.

---

## Application

### POST /api/applications/:jobId

- Purpose: Apply to a job
- Access: logged-in

### GET /api/applications/my-applications

- Purpose: Seeker views their own submitted applications
- Access: logged-in

### GET /api/applications/job/:jobId

- Purpose: Employer views all applicants for one job
- Access: owner-only (via company ownership)

### PATCH /api/applications/:id/status

- Purpose: Employer updates an application's status (applied/reviewed/accepted/rejected)
- Access: owner-only

### DELETE /api/applications/:id

- Purpose: Withdraw an application
- Access: applicant-only (only the user who applied)

### Notes

- resume on Application is a snapshot URL captured at the time of applying, independent of whatever is currently on the user's profile (User.resume). This matches how real ATS platforms (LinkedIn, Greenhouse, Workday) preserve historical application records.
- status defaults to "applied" and only the employer (via company ownership of the job) can change it.
- Deleting an application is restricted to the applicant who submitted it, not the employer, an employer rejects via status change, they don't delete the applicant's record.

---

## Saved Jobs (User bookmarks)

### POST /api/users/saved-jobs/:jobId

- Purpose: Bookmark a job
- Access: logged-in

### DELETE /api/users/saved-jobs/:jobId

- Purpose: Remove a bookmarked job
- Access: logged-in

### GET /api/users/saved-jobs

- Purpose: List all bookmarked jobs
- Access: logged-in

### Notes

- These routes live under /api/users since savedJobs is a field on the User model, not a separate resource. Listed here again for completeness alongside the other resource groups, full detail is under the User section above.
