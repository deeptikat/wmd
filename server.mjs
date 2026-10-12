import {
  createHash,
  randomBytes,
  randomUUID,
  scryptSync,
  timingSafeEqual
} from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import Database from "better-sqlite3";
import express from "express";
import { defaultProducts } from "./src/data.js";

const databasePath = resolve(process.env.DATABASE_PATH || "data/pet-haven.sqlite");
mkdirSync(dirname(databasePath), { recursive: true });

const database = new Database(databasePath);
database.pragma("journal_mode = WAL");
database.pragma("foreign_keys = ON");
database.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL CHECK (price >= 0),
    stock INTEGER NOT NULL CHECK (stock >= 0),
    description TEXT NOT NULL,
    image TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('User', 'Admin')),
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    address_street TEXT NOT NULL,
    address_city TEXT NOT NULL,
    address_state TEXT NOT NULL,
    address_postal_code TEXT NOT NULL,
    total REAL NOT NULL CHECK (total >= 0),
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    dispatched_at TEXT
  );
  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    price REAL NOT NULL CHECK (price >= 0),
    quantity INTEGER NOT NULL CHECK (quantity > 0)
  );
`);

const existingOrderColumns = new Set(
  database.pragma("table_info(orders)").map(column => column.name)
);
if (!existingOrderColumns.has("user_id")) {
  database.exec("ALTER TABLE orders ADD COLUMN user_id INTEGER REFERENCES users(id)");
}
if (!existingOrderColumns.has("dispatched_at")) {
  database.exec("ALTER TABLE orders ADD COLUMN dispatched_at TEXT");
}
database.exec("CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at)");
database.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(Math.floor(Date.now() / 1000));

const adminEmail = "admin@pethaven.com";
const adminPassword = "admin123";
const otherAdminIds = database.prepare("SELECT id FROM users WHERE role = 'Admin' AND email <> ?").all(adminEmail);
const demoteOtherAdmins = database.transaction(() => {
  database.prepare("UPDATE users SET role = 'User' WHERE role = 'Admin' AND email <> ?").run(adminEmail);
  const removeSession = database.prepare("DELETE FROM sessions WHERE user_id = ?");
  for (const user of otherAdminIds) removeSession.run(user.id);
});
demoteOtherAdmins();

const existingAdmin = database.prepare("SELECT id, role, password_hash FROM users WHERE email = ?").get(adminEmail);
if (!existingAdmin || existingAdmin.role !== "Admin" || !verifyPassword(adminPassword, existingAdmin.password_hash)) {
  const { hash, salt } = hashPassword(adminPassword);
  if (existingAdmin) {
    database.prepare(`
      UPDATE users SET name = 'Admin', password_hash = ?, role = 'Admin'
      WHERE id = ?
    `).run(`${salt}:${hash}`, existingAdmin.id);
    database.prepare("DELETE FROM sessions WHERE user_id = ?").run(existingAdmin.id);
  } else {
    database.prepare(`
      INSERT INTO users (name, email, password_hash, role, created_at)
      VALUES ('Admin', ?, ?, 'Admin', ?)
    `).run(adminEmail, `${salt}:${hash}`, new Date().toISOString());
  }
  console.log(`Initialized admin account for ${adminEmail}`);
}

const productCount = database.prepare("SELECT COUNT(*) AS count FROM products").get().count;
if (productCount === 0) {
  const insertProduct = database.prepare(`
    INSERT INTO products (name, category, price, stock, description, image)
    VALUES (@name, @category, @price, @stock, @description, @image)
  `);
  const seedProducts = database.transaction(() => {
    for (const product of defaultProducts) insertProduct.run(product);
  });
  seedProducts();
}

const app = express();
app.use(express.json({ limit: "32kb" }));

const sessionDurationSeconds = 7 * 24 * 60 * 60;
const sessionCookieName = "pet_haven_session";
const secureCookie = process.env.NODE_ENV === "production" ? "; Secure" : "";

function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  const hash = scryptSync(password, salt, 64).toString("hex");
  return { salt, hash };
}

function verifyPassword(password, storedPassword) {
  const [salt, expectedHash] = storedPassword.split(":");
  if (!salt || !expectedHash) return false;
  const { hash } = hashPassword(password, salt);
  const expected = Buffer.from(expectedHash, "hex");
  const actual = Buffer.from(hash, "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function getCookie(request, name) {
  const cookieHeader = request.headers.cookie || "";
  for (const cookie of cookieHeader.split(";")) {
    const separator = cookie.indexOf("=");
    if (separator < 0 || cookie.slice(0, separator).trim() !== name) continue;
    return decodeURIComponent(cookie.slice(separator + 1).trim());
  }
  return null;
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

function createSession(userId, response) {
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = Math.floor(Date.now() / 1000) + sessionDurationSeconds;
  database.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)")
    .run(tokenHash, userId, expiresAt);
  response.setHeader(
    "Set-Cookie",
    `${sessionCookieName}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${sessionDurationSeconds}${secureCookie}`
  );
}

function requireUser(request, response, next) {
  const token = getCookie(request, sessionCookieName);
  if (!token) return response.status(401).json({ error: "Please sign in to continue." });
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const session = database.prepare(`
    SELECT users.id, users.name, users.email, users.role, sessions.expires_at
    FROM sessions JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ?
  `).get(tokenHash);
  if (!session || session.expires_at <= Math.floor(Date.now() / 1000)) {
    database.prepare("DELETE FROM sessions WHERE token_hash = ?").run(tokenHash);
    return response.status(401).json({ error: "Your session has expired. Please sign in again." });
  }
  request.user = publicUser(session);
  request.sessionTokenHash = tokenHash;
  next();
}

function requireAdmin(request, response, next) {
  if (request.user.role !== "Admin") {
    return response.status(403).json({ error: "Admin access is required." });
  }
  next();
}

function requireCustomer(request, response, next) {
  if (request.user.role !== "User") {
    return response.status(403).json({ error: "Customer access is required to place an order." });
  }
  next();
}

app.post("/api/auth/register", (request, response) => {
  const { name, email, password } = request.body ?? {};
  if (
    typeof name !== "string" || !name.trim() ||
    typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
    typeof password !== "string" || password.length < 8
  ) {
    return response.status(400).json({ error: "Enter your name, a valid email, and a password of at least 8 characters." });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const { salt, hash } = hashPassword(password);
  try {
    const result = database.prepare(`
      INSERT INTO users (name, email, password_hash, role, created_at)
      VALUES (?, ?, ?, 'User', ?)
    `).run(name.trim(), normalizedEmail, `${salt}:${hash}`, new Date().toISOString());
    const user = { id: result.lastInsertRowid, name: name.trim(), email: normalizedEmail, role: "User" };
    createSession(user.id, response);
    response.status(201).json({ user });
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return response.status(409).json({ error: "An account with that email already exists." });
    }
    throw error;
  }
});

function login(request, response, requiredRole) {
  const { email, password } = request.body ?? {};
  if (typeof email !== "string" || typeof password !== "string") {
    return response.status(400).json({ error: "Enter your email and password." });
  }
  const user = database.prepare("SELECT * FROM users WHERE email = ?").get(email.trim().toLowerCase());
  if (!user || !verifyPassword(password, user.password_hash) || user.role !== requiredRole) {
    return response.status(401).json({ error: "Incorrect email or password." });
  }
  createSession(user.id, response);
  response.json({ user: publicUser(user) });
}

app.post("/api/auth/login", (request, response) => login(request, response, "User"));
app.post("/api/auth/admin-login", (request, response) => login(request, response, "Admin"));

app.get("/api/auth/me", (request, response) => {
  const token = getCookie(request, sessionCookieName);
  if (!token) return response.json({ user: null });
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const user = database.prepare(`
    SELECT users.id, users.name, users.email, users.role
    FROM sessions JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ? AND sessions.expires_at > ?
  `).get(tokenHash, Math.floor(Date.now() / 1000));
  response.json({ user: user ? publicUser(user) : null });
});

app.post("/api/auth/logout", (request, response) => {
  const token = getCookie(request, sessionCookieName);
  if (token) {
    const tokenHash = createHash("sha256").update(token).digest("hex");
    database.prepare("DELETE FROM sessions WHERE token_hash = ?").run(tokenHash);
  }
  response.setHeader("Set-Cookie", `${sessionCookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secureCookie}`);
  response.status(204).end();
});

function conflict(message) {
  const error = new Error(message);
  error.status = 409;
  return error;
}

function mapOrder(row) {
  const items = database.prepare(`
    SELECT product_id AS id, name, price, quantity
    FROM order_items WHERE order_id = ?
  `).all(row.id);
  return {
    id: row.id,
    customer: { name: row.customer_name, email: row.customer_email, phone: row.customer_phone },
    address: {
      street: row.address_street,
      city: row.address_city,
      state: row.address_state,
      postalCode: row.address_postal_code
    },
    items,
    total: row.total,
    status: row.status,
    createdAt: row.created_at,
    dispatchedAt: row.dispatched_at
  };
}

app.get("/api/products", (_request, response) => {
  response.json(database.prepare("SELECT * FROM products ORDER BY id").all());
});

app.get("/api/orders", requireUser, requireAdmin, (_request, response) => {
  const rows = database.prepare("SELECT * FROM orders ORDER BY created_at DESC").all();
  response.json(rows.map(mapOrder));
});

app.get("/api/users", requireUser, requireAdmin, (_request, response) => {
  const registeredUsers = database.prepare(`
    SELECT id, name, email, role, created_at AS createdAt
    FROM users
    ORDER BY created_at DESC
  `).all();
  response.json(registeredUsers);
});

app.post("/api/products", requireUser, requireAdmin, (request, response) => {
  const { name, category, price, stock, description, image } = request.body ?? {};
  if (
    typeof name !== "string" || !name.trim() ||
    typeof category !== "string" || !category.trim() ||
    price === null || price === undefined ||
    !Number.isFinite(Number(price)) || Number(price) < 0 ||
    stock === null || stock === undefined ||
    !Number.isSafeInteger(Number(stock)) || Number(stock) < 0 ||
    typeof description !== "string" ||
    typeof image !== "string"
  ) {
    return response.status(400).json({ error: "Invalid product details." });
  }

  const result = database.prepare(`
    INSERT INTO products (name, category, price, stock, description, image)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(name.trim(), category.trim(), Number(price), Number(stock), description, image);
  response.status(201).json(database.prepare("SELECT * FROM products WHERE id = ?").get(result.lastInsertRowid));
});

app.patch("/api/products/:id", requireUser, requireAdmin, (request, response) => {
  const productId = Number(request.params.id);
  const { stock } = request.body ?? {};
  if (!Number.isSafeInteger(productId) || productId <= 0 || !Number.isSafeInteger(stock) || stock < 0) {
    return response.status(400).json({ error: "A valid product ID and non-negative stock are required." });
  }

  const result = database.prepare("UPDATE products SET stock = ? WHERE id = ?").run(stock, productId);
  if (result.changes === 0) return response.status(404).json({ error: "Product not found." });
  response.json(database.prepare("SELECT * FROM products WHERE id = ?").get(productId));
});

app.patch("/api/orders/:id/dispatch", requireUser, requireAdmin, (request, response) => {
  const result = database.prepare(`
    UPDATE orders SET status = 'Dispatched', dispatched_at = ?
    WHERE id = ? AND status = 'Placed'
  `).run(new Date().toISOString(), request.params.id);
  if (result.changes === 0) {
    const existingOrder = database.prepare("SELECT status FROM orders WHERE id = ?").get(request.params.id);
    if (!existingOrder) return response.status(404).json({ error: "Order not found." });
    return response.status(409).json({ error: "This order has already been dispatched." });
  }
  const order = database.prepare("SELECT * FROM orders WHERE id = ?").get(request.params.id);
  response.json(mapOrder(order));
});

app.post("/api/orders", requireUser, requireCustomer, (request, response) => {
  const { customer, address, items } = request.body ?? {};
  const addressFields = ["street", "city", "state", "postalCode"];
  if (
    !customer || typeof customer.phone !== "string" || !customer.phone.trim() ||
    !address || addressFields.some(field => typeof address[field] !== "string" || !address[field].trim()) ||
    !Array.isArray(items) || items.length === 0 ||
    items.some(item =>
      !item ||
      !Number.isSafeInteger(item.id) ||
      !Number.isSafeInteger(item.quantity) ||
      item.quantity < 1
    )
  ) {
    return response.status(400).json({ error: "Valid customer, delivery, and order item details are required." });
  }

  const createOrder = database.transaction(() => {
    const productStatement = database.prepare("SELECT * FROM products WHERE id = ?");
    const requested = new Map();
    for (const item of items) {
      requested.set(item.id, (requested.get(item.id) || 0) + item.quantity);
    }

    const orderItems = [];
    for (const [productId, quantity] of requested) {
      const product = productStatement.get(productId);
      if (!product) throw conflict(`Product ${productId} is no longer available.`);
      if (product.stock < quantity) throw conflict(`${product.name} does not have enough stock.`);
      orderItems.push({ id: product.id, name: product.name, price: product.price, quantity });
    }

    const id = `PH-${randomUUID().toUpperCase()}`;
    const createdAt = new Date().toISOString();
    const total = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    database.prepare(`
      INSERT INTO orders (
        id, user_id, customer_name, customer_email, customer_phone,
        address_street, address_city, address_state, address_postal_code,
        total, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Placed', ?)
    `).run(
      id, request.user.id, request.user.name, request.user.email, customer.phone.trim(),
      address.street.trim(), address.city.trim(), address.state.trim(), address.postalCode.trim(),
      total, createdAt
    );

    const insertItem = database.prepare(`
      INSERT INTO order_items (order_id, product_id, name, price, quantity)
      VALUES (?, ?, ?, ?, ?)
    `);
    const decrementStock = database.prepare("UPDATE products SET stock = stock - ? WHERE id = ?");
    for (const item of orderItems) {
      insertItem.run(id, item.id, item.name, item.price, item.quantity);
      decrementStock.run(item.quantity, item.id);
    }

    return {
      order: mapOrder(database.prepare("SELECT * FROM orders WHERE id = ?").get(id)),
      products: database.prepare("SELECT * FROM products ORDER BY id").all()
    };
  });

  try {
    response.status(201).json(createOrder());
  } catch (error) {
    if (error.status === 409) {
      return response.status(409).json({ error: error.message });
    }
    throw error;
  }
});

app.use((error, _request, response, _next) => {
  console.error(error);
  if (response.headersSent) return;
  const isInvalidJson = error.type === "entity.parse.failed";
  response.status(isInvalidJson ? 400 : 500).json({
    error: isInvalidJson ? "Request body must be valid JSON." : "The database request failed."
  });
});

const port = Number(process.env.API_PORT || 3001);
app.listen(port, "127.0.0.1", () => {
  console.log(`Pet Haven API listening on http://127.0.0.1:${port}`);
});
