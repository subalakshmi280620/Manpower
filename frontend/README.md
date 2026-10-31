# Sri Sai Manpower Services — Frontend

The public website and admin panel use React and Vite. Public content is loaded
from the Express API; updates made in the admin panel are stored in MySQL.

## Run locally

```powershell
cd "C:\Users\Admin\Downloads\Manpower project\frontend"
npm install
npm run dev
```

Start the backend separately; setup instructions are in
[`../backend/README_SETUP.txt`](../backend/README_SETUP.txt). The API defaults to
`http://localhost:5001`; set `VITE_API_URL` in a frontend `.env` file if it is
hosted elsewhere.

Open the public website at the Vite URL printed in the terminal and the admin
panel at `/admin`.

## Checks

```powershell
npm run lint
npm run build
```
