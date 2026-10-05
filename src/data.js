export const defaultProducts = [
  {
    id: 1,
    name: "Everyday Dog Food",
    category: "Food",
    price: 799,
    stock: 25,
    description: "Balanced everyday nutrition for happy, active dogs.",
    image: "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=900&q=85"
  },
  {
    id: 2,
    name: "Playtime Rope Toy",
    category: "Toys",
    price: 249,
    stock: 42,
    description: "A durable rope toy for tugging and playful afternoons.",
    image: "https://images.unsplash.com/photo-1535294435445-d7249524ef2e?auto=format&fit=crop&w=900&q=85"
  },
  {
    id: 3,
    name: "Comfort Collar & Leash",
    category: "Accessories",
    price: 499,
    stock: 18,
    description: "A comfortable set for daily walks and little adventures.",
    image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=900&q=85"
  },
  {
    id: 4,
    name: "Gentle Grooming Kit",
    category: "Grooming",
    price: 399,
    stock: 30,
    description: "Everyday essentials to keep your pet clean and cared for.",
    image: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=900&q=85"
  },
  {
    id: 5,
    name: "Cozy Pet Bed",
    category: "Comfort",
    price: 1199,
    stock: 12,
    description: "A soft place for your favourite companion to recharge.",
    image: "https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?auto=format&fit=crop&w=900&q=85"
  },
  {
    id: 6,
    name: "Cat Scratching Post",
    category: "Accessories",
    price: 599,
    stock: 15,
    description: "A fun scratching spot for indoor cats.",
    image: "https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=900&q=85"
  },
  {
    id: 7,
    name: "Seafood Feast Bites",
    category: "Food",
    price: 699,
    stock: 20,
    description: "Protein-rich bites with natural ingredients for a healthy coat and energy.",
    image: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=900&q=85"
  },
  {
    id: 8,
    name: "Chew & Chase Ball",
    category: "Toys",
    price: 279,
    stock: 35,
    description: "A bright, durable ball for fetch, chewing, and excitement outside.",
    image: "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=900&q=85"
  }
];

export const users = [
  { id: 1, name: "Aarav Shah", email: "aarav@example.com", role: "Customer", status: "Active" },
  { id: 2, name: "Mira Patel", email: "mira@example.com", role: "Customer", status: "Active" },
  { id: 3, name: "Kabir Rao", email: "kabir@example.com", role: "Customer", status: "Active" }
];

export const demoCredentials = {
  admin: { email: "admin@pethaven.com", password: "admin123" },
  user: { email: "user@pethaven.com", password: "user123" }
};

export const appStorageKeys = {
  products: "pet-haven-products",
  cart: "pet-haven-cart",
  user: "pet-haven-user",
  favourites: "pet-haven-favourites",
  orders: "pet-haven-orders"
};