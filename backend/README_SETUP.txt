SRI SAI MANPOWER SERVICES - LOCAL SETUP

Requirements:
- Node.js
- MySQL 8 or compatible

1. Configure backend\.env
   If backend\.env does not exist, copy backend\.env.example to backend\.env.
   Set the database connection values, a strong JWT_SECRET, and an admin username
   and password (at least 12 characters). Never overwrite an existing .env file
   or share its contents.

2. Create the database tables (safe to run; it does not drop or reset data):

   cd /d "C:\Users\Admin\Downloads\Manpower project\backend"
   node setup-database.js

3. Create or update the admin login, then initialize the site content:

   node scripts\create-admin.js
   node scripts\seed-content.js

   The content seeder replaces only recognized setup placeholders and preserves
   existing non-placeholder content.

4. Start the API in this terminal:

   npm run dev

   API health check: http://localhost:5001/api/health

5. In a second terminal, start the frontend:

   cd /d "C:\Users\Admin\Downloads\Manpower project\frontend"
   npm run dev

   Open the Vite URL shown in the terminal (normally http://localhost:5173).
   Admin login: http://localhost:5173/admin

SMTP notifications:
Set SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM, and
NOTIFY_EMAIL in backend\.env. Enquiries are stored even if email delivery fails;
the API logs the delivery failure and returns an explicit notification status.

Image management:
Sign in to the admin panel, open Website Content, and upload a JPEG, PNG, GIF,
or WebP image up to 5 MB. Copy its returned URL into the relevant image field
in the section's JSON editor. Uploaded files are stored in backend\uploads.

API:
POST  /api/admin/login
GET   /api/content
GET   /api/admin/content                 (admin token required)
PUT   /api/admin/content/:key            (admin token required)
POST  /api/admin/uploads                 (admin token required)
GET   /api/admin/enquiries               (admin token required)
PATCH /api/admin/enquiries/:id           (admin token required)
POST  /api/enquiries

Never share backend\.env or passwords. Do not commit .env files.
