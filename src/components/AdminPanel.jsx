import React, { useState } from "react";
import { Package, Users, IndianRupee, Boxes, ShieldCheck, PlusCircle, Sparkles } from "lucide-react";
import { users } from "../data";

export default function AdminPanel({ products, orders, onUpdateProduct, onAddProduct }) {
  const [draft, setDraft] = useState({ name: "", category: "Food", price: "", stock: "" });
  const [notice, setNotice] = useState("");

  const totalStock = products.reduce((sum, product) => sum + product.stock, 0);
  const inventoryValue = products.reduce((sum, product) => sum + product.price * product.stock, 0);
  const lowStockCount = products.filter(product => product.stock < 15).length;

  function handleStockChange(productId, value) {
    const nextStock = Math.max(0, Number(value) || 0);
    onUpdateProduct(productId, { stock: nextStock });
  }

  function handleAddProduct(event) {
    event.preventDefault();
    if (!draft.name.trim() || !draft.price || !draft.stock) {
      setNotice("Please fill in the product name, price, and stock level.");
      return;
    }

    onAddProduct({
      name: draft.name.trim(),
      category: draft.category,
      price: Number(draft.price),
      stock: Number(draft.stock),
      description: "Freshly added to the Pet Haven range.",
      image: "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=900&q=85"
    });

    setDraft({ name: "", category: "Food", price: "", stock: "" });
    setNotice(`${draft.name.trim()} added successfully.`);
  }

  return (
    <main className="dashboard">
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">MANAGEMENT OVERVIEW</p>
          <h1>Admin dashboard</h1>
          <p className="muted">A quick view of the Pet Haven store.</p>
        </div>
        <span className="secure-badge"><ShieldCheck size={16} /> Admin access</span>
      </div>

      <section className="stat-grid">
        <article className="stat-card"><span className="stat-icon lilac"><Package /></span><span className="stat-label">Products</span><strong>{products.length}</strong><small>Listed in catalogue</small></article>
        <article className="stat-card"><span className="stat-icon peach"><Users /></span><span className="stat-label">Users</span><strong>{users.length}</strong><small>Sample customer records</small></article>
        <article className="stat-card"><span className="stat-icon mint"><Boxes /></span><span className="stat-label">Units in stock</span><strong>{totalStock}</strong><small>Across all products</small></article>
        <article className="stat-card"><span className="stat-icon yellow"><IndianRupee /></span><span className="stat-label">Stock value</span><strong>₹{inventoryValue.toLocaleString("en-IN")}</strong><small>Estimated retail value</small></article>
      </section>

      <section className="panel admin-panel">
        <div className="panel-heading">
          <div>
            <h2>Inventory overview</h2>
            <p>{lowStockCount} products need restocking soon.</p>
          </div>
          <span className="table-count">{products.length} products</span>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id}>
                  <td>
                    <div className="table-product">
                      <img src={product.image} alt="" />
                      <div>
                        <strong>{product.name}</strong>
                        <small>SKU-PH-{String(product.id).padStart(3, "0")}</small>
                      </div>
                    </div>
                  </td>
                  <td>{product.category}</td>
                  <td>₹{product.price.toLocaleString("en-IN")}</td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      value={product.stock}
                      onChange={event => handleStockChange(product.id, event.target.value)}
                      className="stock-input"
                    />
                  </td>
                  <td><span className={product.stock < 15 ? "status low" : "status active"}>{product.stock < 15 ? "Low stock" : "In stock"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel add-product-panel">
        <div className="panel-heading">
          <div>
            <h2>Add new product</h2>
            <p>Extend the catalogue with new pet essentials.</p>
          </div>
          <span className="table-count"><PlusCircle size={14} /> New item</span>
        </div>

        <form className="product-form" onSubmit={handleAddProduct}>
          <label>
            Product name
            <input value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} placeholder="Fluffy bed set" />
          </label>
          <label>
            Category
            <select value={draft.category} onChange={event => setDraft({ ...draft, category: event.target.value })}>
              <option value="Food">Food</option>
              <option value="Toys">Toys</option>
              <option value="Accessories">Accessories</option>
              <option value="Grooming">Grooming</option>
              <option value="Comfort">Comfort</option>
            </select>
          </label>
          <label>
            Price (₹)
            <input type="number" min="0" value={draft.price} onChange={event => setDraft({ ...draft, price: event.target.value })} placeholder="599" />
          </label>
          <label>
            Stock
            <input type="number" min="0" value={draft.stock} onChange={event => setDraft({ ...draft, stock: event.target.value })} placeholder="18" />
          </label>
          <button type="submit" className="primary-button"><Sparkles size={16} /> Add product</button>
        </form>
        {notice && <div className="admin-notice">{notice}</div>}
      </section>

      <section className="panel orders-panel">
        <div className="panel-heading">
          <div>
            <h2>Customer orders</h2>
            <p>Orders submitted at checkout, with delivery and contact details.</p>
          </div>
          <span className="table-count">{orders.length} {orders.length === 1 ? "order" : "orders"}</span>
        </div>
        {orders.length === 0 ? (
          <div className="orders-empty">No orders yet. Orders placed by customers will appear here.</div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Items</th>
                  <th>Delivery address</th>
                  <th>Placed</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id}>
                    <td><strong>{order.id}</strong></td>
                    <td>{order.customer.name}</td>
                    <td className="order-contact">
                      <span>{order.customer.email}</span>
                      <span>{order.customer.phone}</span>
                    </td>
                    <td className="order-items-cell">
                      {order.items.map(item => (
                        <span key={item.id}>{item.name} × {item.quantity}</span>
                      ))}
                    </td>
                    <td className="order-address">
                      {order.address.street}, {order.address.city}, {order.address.state} {order.address.postalCode}
                    </td>
                    <td>{new Date(order.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</td>
                    <td><strong>₹{order.total.toLocaleString("en-IN")}</strong></td>
                    <td><span className="status active">{order.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel-heading"><div><h2>Registered users</h2><p>Example user records displayed through a React component.</p></div><span className="table-count">{users.length} users</span></div>
        <div className="table-scroll"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th></tr></thead><tbody>
          {users.map(user => <tr key={user.id}><td><strong>{user.name}</strong></td><td>{user.email}</td><td>{user.role}</td><td><span className="status active">{user.status}</span></td></tr>)}
        </tbody></table></div>
      </section>
    </main>
  );
}