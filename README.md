# Pet Haven — WMD Lab Experiment 3

A React pet shop demo with a local SQLite database and Express API. Products, customer accounts, orders, order items, and dispatch history are stored in the database.

## Run in VS Code

1. Open the project folder in VS Code.
2. Open Terminal → New Terminal.
3. Install packages and start the app:

   ```bash
   npm install
   npm run dev
   ```

4. Open the local URL printed by Vite (usually `http://localhost:5173`). Vite starts the API on port `3001` and proxies `/api` requests to it.

The database is created automatically at `data/pet-haven.sqlite`. The starter catalogue is inserted only when the database has no products. Set `DATABASE_PATH` before starting the API if you want to use a different database file.

## Admin login

The local demo admin account is initialized automatically whenever the API starts:

- Email: `admin@pethaven.com`
- Password: `admin123`

The password is saved as a salted scrypt hash, not as plaintext. Customer registration cannot create admin accounts; the configured admin credentials are the only account with portal access.

## Accounts and orders

- Customer passwords are salted and hashed in SQLite. Login sessions use a random, HTTP-only cookie; the server stores only a hash of the session token.
- Customers can register, sign in, browse, and place orders.
- Admins can review placed orders and choose **Mark dispatched**. The order is removed from Current orders and retained in Order history with its dispatch time.
- The admin dashboard lists registered customer accounts.
- Cart and favourites remain in browser storage. Checkout is a demo and does not collect payment.

This project is intended for local demonstration. Before exposing it publicly, add production controls such as HTTPS, rate limiting, backups, and an account recovery process.

## Main components

- `src/App.jsx` — app state, authenticated API calls, and dashboard selection.
- `src/components/UserLogin.jsx` — customer sign-in and registration.
- `src/components/AdminLogin.jsx` — admin sign-in.
- `src/components/AdminPanel.jsx` — inventory, placed orders, dispatch actions, order history, and registered users.
- `src/components/UserDashboard.jsx` — product catalogue, cart, favourites, and checkout.
- `src/data.js` — starter catalogue.
- `server.mjs` — SQLite schema/migrations, authentication, sessions, and API.
