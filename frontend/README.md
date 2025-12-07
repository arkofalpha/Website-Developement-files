# Frontend (Next.js) - SME Self-Assessment (scaffold)

This is a minimal Next.js scaffold for the SME Self-Assessment frontend. It provides a starter assessment flow wired to the sample backend endpoints in the repo.

Quick start (PowerShell)

```powershell
cd "e:\Diagnostic Assessment\Assessment platform\Website Developement files\frontend"
npm install
# If your backend is running on http://localhost:3000, set the API URL:
$env:NEXT_PUBLIC_API_URL = "http://localhost:3000"
npm run dev
```

Notes
- This is a lightweight scaffold intended for development. It uses `axios` and Next.js pages. Replace the placeholder IDs used in the sample assessment flow with real IDs returned by your backend.
- The assessment page (`/assessments/new`) posts to `/api/assessments`, then PUTs responses to `/api/assessments/{id}/responses` and finally posts to `/api/assessments/{id}/submit` — matching the technical spec.

Next steps
- Improve error handling and loading states.
- Implement real authentication and business profile flows.
- Replace inline styles with a design system (Tailwind or Material UI) and add iconography.
