import React, { useEffect, useState } from "react";
import { PawPrint, ShieldCheck, UserRound } from "lucide-react";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import AdminLogin from "./components/AdminLogin.jsx";
import UserLogin from "./components/UserLogin.jsx";
import AdminPanel from "./components/AdminPanel.jsx";
import UserDashboard from "./components/UserDashboard.jsx";
import { appStorageKeys, defaultProducts } from "./data.js";

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
  const [loggedInUser, setLoggedInUser] = useState(() => readStorage(appStorageKeys.user, null));
  const [products, setProducts] = useState(() => readStorage(appStorageKeys.products, defaultProducts));
  const [cart, setCart] = useState(() => readStorage(appStorageKeys.cart, []));
  const [favourites, setFavourites] = useState(() => readStorage(appStorageKeys.favourites, []));
  const [orders, setOrders] = useState(() => readStorage(appStorageKeys.orders, []));

  useEffect(() => {
    localStorage.setItem(appStorageKeys.user, JSON.stringify(loggedInUser));
  }, [loggedInUser]);

  useEffect(() => {
    localStorage.setItem(appStorageKeys.products, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(appStorageKeys.cart, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem(appStorageKeys.favourites, JSON.stringify(favourites));
  }, [favourites]);

  useEffect(() => {
    localStorage.setItem(appStorageKeys.orders, JSON.stringify(orders));
  }, [orders]);

  function logout() {
    setLoggedInUser(null);
    setCart([]);
    setLoginType("user");
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

  function updateProduct(productId, updates) {
    setProducts(current => current.map(product => product.id === productId ? { ...product, ...updates } : product));
  }

  function addProduct(newProduct) {
    setProducts(current => [
      {
        id: Date.now(),
        ...newProduct,
        price: Number(newProduct.price),
        stock: Number(newProduct.stock)
      },
      ...current
    ]);
  }

  function checkoutCart(contactDetails) {
    const orderItems = cart.map(item => ({ ...item }));
    const total = orderItems.reduce((sum, item) => sum + item.quantity * item.price, 0);
    const order = {
      id: `PH-${Date.now().toString(36).toUpperCase()}`,
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
      items: orderItems,
      total,
      status: "Placed",
      createdAt: new Date().toISOString()
    };
    setOrders(current => [order, ...current]);
    setCart([]);
  }

  return (
    <div className="app-shell">
      <Header user={loggedInUser} onLogout={logout} onHome={() => !loggedInUser && setLoginType("user")} />
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
              {loginType === "admin" ? <AdminLogin onLogin={setLoggedInUser} onSwitch={() => setLoginType("user")} /> : <UserLogin onLogin={setLoggedInUser} onSwitch={() => setLoginType("admin")} />}
            </section>
          </main>
          <div className="login-bottom-note">A little more care, in every corner of their world.</div>
        </>
      ) : loggedInUser.role === "Admin" ? (
        <AdminPanel products={products} orders={orders} onUpdateProduct={updateProduct} onAddProduct={addProduct} />
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