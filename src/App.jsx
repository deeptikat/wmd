import React, { useEffect, useState } from "react";
import { PawPrint, ShieldCheck, UserRound } from "lucide-react";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import AdminLogin from "./components/AdminLogin.jsx";
import UserLogin from "./components/UserLogin.jsx";
import AdminPanel from "./components/AdminPanel.jsx";
import UserDashboard from "./components/UserDashboard.jsx";
import { appStorageKeys, defaultProducts } from "./data.js";

async function apiRequest(path, options) {
  const response = await fetch(path, options);
  const result = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(result.error || "The database request failed.");
  return result;
}

function jsonRequest(method, body) {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  };
}

function readStorage(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [loginType, setLoginType] = useState("user");
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [products, setProducts] = useState(defaultProducts);
  const [cart, setCart] = useState(() => readStorage(appStorageKeys.cart, []));
  const [favourites, setFavourites] = useState(() => readStorage(appStorageKeys.favourites, []));
  const [orders, setOrders] = useState([]);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    Promise.all([apiRequest("/api/products"), apiRequest("/api/auth/me")])
      .then(async ([savedProducts, session]) => {
        setProducts(savedProducts);
        setLoggedInUser(session.user);
        if (session.user?.role === "Admin") {
          const [savedOrders, savedUsers] = await Promise.all([
            apiRequest("/api/orders"),
            apiRequest("/api/users")
          ]);
          setOrders(savedOrders);
          setRegisteredUsers(savedUsers);
        }
      })
      .catch(error => setApiError(`Could not load saved shop data: ${error.message}`));
  }, []);

  useEffect(() => {
    localStorage.setItem(appStorageKeys.cart, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem(appStorageKeys.favourites, JSON.stringify(favourites));
  }, [favourites]);

  useEffect(() => {
    if (loggedInUser?.role !== "Admin") return undefined;
    let isActive = true;
    const refreshOrders = () => {
      apiRequest("/api/orders")
        .then(savedOrders => {
          if (isActive) {
            setOrders(savedOrders);
            setApiError("");
          }
        })
        .catch(error => {
          if (isActive) setApiError(`Could not refresh orders: ${error.message}`);
        });
    };
    const intervalId = window.setInterval(refreshOrders, 10000);
    window.addEventListener("focus", refreshOrders);
    return () => {
      isActive = false;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshOrders);
    };
  }, [loggedInUser]);

  function logout() {
    apiRequest("/api/auth/logout", { method: "POST" })
      .catch(error => setApiError(`Could not sign out: ${error.message}`));
    setLoggedInUser(null);
    setCart([]);
    setOrders([]);
    setRegisteredUsers([]);
    setLoginType("user");
  }

  async function authenticate(credentials, isRegistration = false, isAdminLogin = false) {
    const result = await apiRequest(
      isRegistration
        ? "/api/auth/register"
        : isAdminLogin ? "/api/auth/admin-login" : "/api/auth/login",
      jsonRequest("POST", credentials)
    );
    if (result.user.role === "Admin") {
      const [savedOrders, savedUsers] = await Promise.all([
        apiRequest("/api/orders"),
        apiRequest("/api/users")
      ]);
      setOrders(savedOrders);
      setRegisteredUsers(savedUsers);
    } else {
      setOrders([]);
      setRegisteredUsers([]);
    }
    setCart([]);
    setFavourites([]);
    setLoggedInUser(result.user);
    setApiError("");
  }

  function addToCart(product, quantity = 1) {
    setCart(current => {
      const existing = current.find(item => item.id === product.id);
      if (existing) {
        return current.map(item => item.id === product.id ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock) } : item);
      }
      return [...current, { id: product.id, quantity: Math.min(quantity, product.stock), name: product.name, price: product.price, image: product.image }];
    });
  }

  function updateCart(productId, change) {
    setCart(current =>
      current
        .map(item => item.id === productId ? { ...item, quantity: Math.max(0, item.quantity + change) } : item)
        .filter(item => item.quantity > 0)
    );
  }

  function toggleFavourite(productId) {
    setFavourites(current => current.includes(productId) ? current.filter(id => id !== productId) : [...current, productId]);
  }

  async function updateProduct(productId, updates) {
    try {
      const updatedProduct = await apiRequest(`/api/products/${productId}`, jsonRequest("PATCH", updates));
      setProducts(current => current.map(product => product.id === productId ? updatedProduct : product));
      setApiError("");
    } catch (error) {
      setApiError(`Could not update product: ${error.message}`);
      throw error;
    }
  }

  async function addProduct(newProduct) {
    try {
      const savedProduct = await apiRequest("/api/products", jsonRequest("POST", newProduct));
      setProducts(current => [savedProduct, ...current]);
      setApiError("");
    } catch (error) {
      setApiError(`Could not add product: ${error.message}`);
      throw error;
    }
  }

  async function checkoutCart(contactDetails) {
    try {
      const { order, products: savedProducts } = await apiRequest("/api/orders", jsonRequest("POST", {
        customer: {
          name: contactDetails.name,
          email: contactDetails.email,
          phone: contactDetails.phone
        },
        address: {
          street: contactDetails.address,
          city: contactDetails.city,
          state: contactDetails.state,
          postalCode: contactDetails.postalCode
        },
        items: cart.map(item => ({ id: item.id, quantity: item.quantity }))
      }));
      setOrders(current => [order, ...current]);
      setProducts(savedProducts);
      setCart([]);
      setApiError("");
    } catch (error) {
      setApiError(`Could not place your order: ${error.message}`);
      throw error;
    }
  }

  async function dispatchOrder(orderId) {
    const dispatchedOrder = await apiRequest(
      `/api/orders/${encodeURIComponent(orderId)}/dispatch`,
      { method: "PATCH" }
    );
    setOrders(current => current.map(order => order.id === orderId ? dispatchedOrder : order));
    return dispatchedOrder;
  }

  return (
    <div className="app-shell">
      <Header user={loggedInUser} onLogout={logout} onHome={() => !loggedInUser && setLoginType("user")} />
      {apiError && <p className="api-error" role="alert">{apiError}</p>}
      {!loggedInUser ? (
        <>
          <main className="login-layout">
            <section className="login-intro">
              <div className="intro-badge"><PawPrint size={15} /> PET CARE, CONSIDERED</div>
              <h2>A happier life<br />starts with <span>good care.</span></h2>
              <p>Discover carefully chosen essentials for the pets who make your house feel like home.</p>
              <div className="intro-perks"><span><span className="perk-check">✓</span> Everyday essentials</span><span><span className="perk-check">✓</span> Simple, thoughtful shopping</span></div>
              <div className="login-photo"><img src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=1200&q=85" alt="A dog and a cat sitting together" /><div className="photo-caption"><strong>For every kind of best friend.</strong><span>Food · Play · Comfort · Care</span></div></div>
              <div className="intro-decoration"><PawPrint size={25} /><PawPrint size={17} /><PawPrint size={21} /></div>
            </section>
            <section className="login-side">
              <div className="login-switch" role="tablist" aria-label="Choose login type">
                <button role="tab" aria-selected={loginType === "user"} className={loginType === "user" ? "switch-option active" : "switch-option"} onClick={() => setLoginType("user")}><UserRound size={16} /> User login</button>
                <button role="tab" aria-selected={loginType === "admin"} className={loginType === "admin" ? "switch-option active" : "switch-option"} onClick={() => setLoginType("admin")}><ShieldCheck size={16} /> Admin login</button>
              </div>
              {loginType === "admin"
                ? <AdminLogin onLogin={(credentials) => authenticate(credentials, false, true)} onSwitch={() => setLoginType("user")} />
                : <UserLogin onLogin={authenticate} onSwitch={() => setLoginType("admin")} />}
            </section>
          </main>
          <div className="login-bottom-note">A little more care, in every corner of their world.</div>
        </>
      ) : loggedInUser.role === "Admin" ? (
        <AdminPanel products={products} orders={orders} registeredUsers={registeredUsers} onUpdateProduct={updateProduct} onAddProduct={addProduct} onDispatchOrder={dispatchOrder} />
      ) : (
        <UserDashboard
          user={loggedInUser}
          products={products}
          cart={cart}
          favourites={favourites}
          onAddToCart={addToCart}
          onUpdateCart={updateCart}
          onToggleFavourite={toggleFavourite}
          onCheckout={checkoutCart}
        />
      )}
      <Footer />
    </div>
  );
}