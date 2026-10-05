# Pet Haven — WMD Lab Experiment 3

A React + JSX product catalogue demo adapted from the Experiment 3 brief. It uses functional components, state, and static product/user data.

## Run in VS Code

1. Extract this ZIP.
2. Open the extracted `pet-haven-exp3` folder in VS Code.
3. Open Terminal → New Terminal.
4. Run:

   ```bash
   npm install
   npm run dev
   ```

5. Open the local URL printed by Vite (usually `http://localhost:5173`).

## Demo logins

**User**
- Email: `user@pethaven.com`
- Password: `user123`

**Admin**
- Email: `admin@pethaven.com`
- Password: `admin123`

Select User login or Admin login at the top of the login panel. Admin sees inventory and sample users; User sees the product catalogue, search, category filters, and favourites.

## Important lab note

These are front-end demonstration credentials only. Authentication is checked in React using hardcoded demo values; this is not secure production authentication and is not connected to a database or backend. Product/user data is static in `src/data.js`. Product detail buttons show a demo message rather than completing checkout.

## Main components

- `src/App.jsx` — switches between login screens and dashboards.
- `src/components/AdminLogin.jsx` — admin login form.
- `src/components/UserLogin.jsx` — customer login form.
- `src/components/AdminPanel.jsx` — product inventory and sample users.
- `src/components/UserDashboard.jsx` — product catalogue, search, category filter, favourites.
- `src/components/Header.jsx` and `Footer.jsx` — shared layout components.
- `src/data.js` — static product records, user records, and demo credentials.
