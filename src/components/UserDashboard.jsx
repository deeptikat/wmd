import React, { useMemo, useState } from "react";
import { ArrowLeft, ArrowUpRight, CheckCircle2, Minus, Plus, Search, ShoppingBag, Heart, X } from "lucide-react";

export default function UserDashboard({
  user,
  products,
  cart,
  favourites,
  onAddToCart,
  onUpdateCart,
  onToggleFavourite,
  onCheckout
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const [isCheckout, setIsCheckout] = useState(false);
  const [checkoutDetails, setCheckoutDetails] = useState({
    name: user.name === "Pet Parent" ? "" : user.name,
    email: user.email || "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postalCode: ""
  });

  const categories = useMemo(() => ["All", ...new Set(products.map(product => product.category))], [products]);

  const filtered = products.filter(product => {
    const matchesSearch = `${product.name} ${product.category} ${product.description}`.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (category === "All" || product.category === category);
  });

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);

  function handleCheckout() {
    if (!cart.length) return;
    setCheckoutMessage("");
    setCheckoutError("");
    setIsCheckout(true);
  }

  async function handlePlaceOrder(event) {
    event.preventDefault();
    if (!cart.length) return;
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    setCheckoutError("");
    try {
      await onCheckout(checkoutDetails);
      setIsCheckout(false);
      setCheckoutMessage(`Order placed for ${itemCount} item${itemCount > 1 ? "s" : ""}. Thanks, ${checkoutDetails.name}!`);
    } catch (error) {
      setCheckoutError(error.message);
    }
  }

  function updateCheckoutField(event) {
    const { name, value } = event.target;
    setCheckoutDetails(current => ({ ...current, [name]: value }));
  }

  if (isCheckout) {
    return (
      <main className="dashboard checkout-page">
        <button className="back-to-shop" type="button" onClick={() => setIsCheckout(false)}>
          <ArrowLeft size={16} /> Back to shopping
        </button>
        <div className="checkout-heading">
          <p className="eyebrow">ALMOST THERE</p>
          <h1>Checkout</h1>
          <p>Where should we deliver your pet's goodies?</p>
        </div>
        {checkoutError && <p className="form-error" role="alert">{checkoutError}</p>}

        <div className="checkout-layout">
          <form id="place-order" className="checkout-form" onSubmit={handlePlaceOrder}>
            <section className="checkout-card">
              <div className="checkout-section-title">
                <span className="checkout-step">1</span>
                <div>
                  <h2>Contact information</h2>
                  <p>We'll use these details for your order confirmation.</p>
                </div>
              </div>
              <div className="checkout-fields">
                <label htmlFor="checkout-name">Full name</label>
                <input id="checkout-name" name="name" autoComplete="name" value={checkoutDetails.name} readOnly required />
                <label htmlFor="checkout-email">Email address</label>
                <input id="checkout-email" name="email" type="email" autoComplete="email" value={checkoutDetails.email} readOnly required />
                <label htmlFor="checkout-phone">Phone number</label>
                <input id="checkout-phone" name="phone" type="tel" autoComplete="tel" value={checkoutDetails.phone} onChange={updateCheckoutField} placeholder="+91 98765 43210" required />
              </div>
            </section>

            <section className="checkout-card">
              <div className="checkout-section-title">
                <span className="checkout-step">2</span>
                <div>
                  <h2>Delivery address</h2>
                  <p>Enter the address where your order should arrive.</p>
                </div>
              </div>
              <div className="checkout-fields">
                <label htmlFor="checkout-address">Street address</label>
                <textarea id="checkout-address" name="address" autoComplete="street-address" value={checkoutDetails.address} onChange={updateCheckoutField} placeholder="House / flat number, street, area" rows="3" required />
                <div className="address-row">
                  <div>
                    <label htmlFor="checkout-city">City</label>
                    <input id="checkout-city" name="city" autoComplete="address-level2" value={checkoutDetails.city} onChange={updateCheckoutField} placeholder="City" required />
                  </div>
                  <div>
                    <label htmlFor="checkout-state">State</label>
                    <input id="checkout-state" name="state" autoComplete="address-level1" value={checkoutDetails.state} onChange={updateCheckoutField} placeholder="State" required />
                  </div>
                </div>
                <label htmlFor="checkout-postal">PIN code</label>
                <input id="checkout-postal" name="postalCode" autoComplete="postal-code" inputMode="numeric" pattern="[0-9]{6}" maxLength="6" value={checkoutDetails.postalCode} onChange={updateCheckoutField} placeholder="6-digit PIN code" title="Enter a 6-digit PIN code" required />
              </div>
            </section>
            <p className="checkout-demo-note">Demo checkout only — no payment will be collected.</p>
          </form>

          <aside className="order-summary">
            <div className="order-summary-heading">
              <div>
                <p className="eyebrow">YOUR ORDER</p>
                <h2>Order summary</h2>
              </div>
              <span className="mini-badge"><ShoppingBag size={15} /> {cartCount}</span>
            </div>
            <div className="summary-items">
              {cart.map(item => (
                <div className="summary-item" key={item.id}>
                  <img src={item.image} alt="" />
                  <div>
                    <strong>{item.name}</strong>
                    <span>Qty {item.quantity} × ₹{item.price.toLocaleString("en-IN")}</span>
                  </div>
                  <strong>₹{(item.quantity * item.price).toLocaleString("en-IN")}</strong>
                </div>
              ))}
            </div>
            <div className="order-totals">
              <div><span>Subtotal</span><strong>₹{subtotal.toLocaleString("en-IN")}</strong></div>
              <div><span>Delivery</span><strong className="free-delivery">Free</strong></div>
              <div className="grand-total"><span>Total</span><strong>₹{subtotal.toLocaleString("en-IN")}</strong></div>
            </div>
            <button className="primary-button place-order-button" type="submit" form="place-order" disabled={cart.length === 0}>
              <CheckCircle2 size={17} /> Place order · ₹{subtotal.toLocaleString("en-IN")}
            </button>
          </aside>
        </div>
      </main>
    );
  }

  return (
    <main className="dashboard user-dashboard">
      <section className="user-hero">
        <div>
          <p className="eyebrow">THE PET HAVEN EDIT</p>
          <h1>Little things.<br /><em>Big tail wags.</em></h1>
          <p>Thoughtful everyday essentials for the companions who make life better.</p>
          <div className="hero-note"><span className="hero-dot" /> Welcome, {user.name}. Have a look around.</div>
        </div>
        <div className="hero-art">
          <img src="https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=1000&q=85" alt="Happy dog looking at the camera" />
          <span className="floating-note">Made for the good ones <Heart size={15} fill="currentColor" /></span>
        </div>
      </section>

      <section className="catalogue-section">
        <div className="catalogue-heading">
          <div>
            <p className="eyebrow">SHOP THE COLLECTION</p>
            <h2>Pet parent favourites</h2>
          </div>
          <span className="product-total"><ShoppingBag size={16} /> {filtered.length} products</span>
        </div>

        <div className="catalogue-controls">
          <label className="search-box">
            <Search size={17} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." aria-label="Search products" />
          </label>

          <div className="category-tabs" aria-label="Filter by category">
            {categories.map(item => (
              <button
                key={item}
                className={category === item ? "category-tab selected" : "category-tab"}
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {checkoutMessage && <div className="checkout-success">{checkoutMessage}</div>}

        <div className="shop-grid">
          <div className="product-grid">
            {filtered.map((product, index) => (
              <article className="product-card" key={product.id}>
                <div className="product-image-wrap">
                  <img src={product.image} alt={product.name} loading="lazy" />
                  <span className="product-number">0{index + 1}</span>
                  <button
                    className={favourites.includes(product.id) ? "save-button saved" : "save-button"}
                    onClick={() => onToggleFavourite(product.id)}
                    aria-label={favourites.includes(product.id) ? "Remove from favourites" : "Add to favourites"}
                  >
                    <Heart size={17} fill={favourites.includes(product.id) ? "currentColor" : "none"} />
                  </button>
                </div>

                <div className="product-info">
                  <span className="product-category">{product.category}</span>
                  <h3>{product.name}</h3>
                  <p>{product.description}</p>
                  <div className="product-bottom">
                    <strong>₹{product.price.toLocaleString("en-IN")}</strong>
                    <span>{product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}</span>
                  </div>
                  <div className="product-actions">
                    <button className="outline-button" onClick={() => setSelectedProduct(product)}>
                      View details <ArrowUpRight size={16} />
                    </button>
                    <button className="add-button" onClick={() => onAddToCart(product, 1)} disabled={product.stock <= 0}>
                      Add to cart
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <aside className="cart-panel">
            <div className="cart-header">
              <div>
                <p className="eyebrow">YOUR CART</p>
                <h3>{cartCount} item{cartCount === 1 ? "" : "s"}</h3>
              </div>
              <span className="mini-badge"><ShoppingBag size={16} /> {cartCount}</span>
            </div>

            {cart.length === 0 ? (
              <div className="empty-cart">
                <p>Your cart is empty.</p>
                <span>Add a few essentials for your pet.</span>
              </div>
            ) : (
              <div className="cart-items">
                {cart.map(item => (
                  <div className="cart-item" key={item.id}>
                    <img src={item.image} alt={item.name} />
                    <div className="cart-item-body">
                      <div className="cart-item-top">
                        <strong>{item.name}</strong>
                        <span>₹{(item.quantity * item.price).toLocaleString("en-IN")}</span>
                      </div>
                      <div className="cart-controls">
                        <button aria-label={`Decrease quantity of ${item.name}`} onClick={() => onUpdateCart(item.id, -1)}><Minus size={14} /></button>
                        <span>{item.quantity}</span>
                        <button aria-label={`Increase quantity of ${item.name}`} onClick={() => onUpdateCart(item.id, 1)}><Plus size={14} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="cart-summary">
              <div>
                <span>Subtotal</span>
                <strong>₹{subtotal.toLocaleString("en-IN")}</strong>
              </div>
              <button className="primary-button" onClick={handleCheckout} disabled={cart.length === 0}>Checkout</button>
            </div>
          </aside>
        </div>

        {filtered.length === 0 && <div className="empty-state">No products match that search. Try another name or category.</div>}
      </section>

      {selectedProduct && (
        <div className="modal-backdrop" onClick={() => setSelectedProduct(null)}>
          <div className="product-modal" onClick={event => event.stopPropagation()}>
            <button className="close-modal" onClick={() => setSelectedProduct(null)} aria-label="Close product details">
              <X size={18} />
            </button>
            <img src={selectedProduct.image} alt={selectedProduct.name} />
            <div className="modal-content">
              <span className="product-category">{selectedProduct.category}</span>
              <h3>{selectedProduct.name}</h3>
              <p>{selectedProduct.description}</p>
              <div className="modal-meta">
                <span>{selectedProduct.stock > 0 ? `${selectedProduct.stock} in stock` : "Out of stock"}</span>
                <strong>₹{selectedProduct.price.toLocaleString("en-IN")}</strong>
              </div>
              <button className="primary-button" onClick={() => { onAddToCart(selectedProduct, 1); setSelectedProduct(null); }} disabled={selectedProduct.stock <= 0}>
                Add to cart
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}