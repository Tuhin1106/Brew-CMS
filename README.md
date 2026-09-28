# ☕ Brew CMS

An offline-first **Cafe Management System** for mobile, built with React Native and TypeScript. Brew CMS runs 100% on the device with **no backend and no internet connection required**. Tables, orders, kitchen tickets, billing, reports and settings all live in local storage.

## ✨ Features

- **Role-based login** — sign in as Manager, Cashier, Waiter or Barista, with one-tap prototype demo logins
- **Table management** — live floor grid with Available / Occupied / Needs Cleaning states, plus shift table, merge table, add, edit and delete
- **POS & ordering** — category-based menu and half/full plate pricing for meals
- **Kitchen Display System (KDS)** — KOT tickets with live timers, color-coded urgency, tap-to-strike items, and status progression from Received to Complete
- **Billing & checkout** — CGST/SGST breakdown, split bill (2 to 6 people), and Cash / Card / UPI payments
- **Offline UPI QR** — dynamic QR generated on-device from `upi://pay?pa={upiId}&am={totalAmount}`
- **Reports & analytics** — gross sales, tax collected, order count, average order value, payment split and top 5 dishes, filterable by date range
- **Settings** — cafe profile, account, staff accounts, GST configuration and full menu management (including 86 / out-of-stock toggles)
- **Fully offline visuals** — menu items use emoji badges instead of remote images

## 🛠️ Tech Stack

- [React Native](https://reactnative.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Zustand](https://zustand-demo.pmnd.rs/) — state management, persisted with AsyncStorage
- [lucide-react-native](https://lucide.dev/) — icons
- Bottom tab navigation for the main app shell

## 📱 Screens

| Screen | Description |
|---|---|
| Sign In | Role selector, phone + password login, quick-fill demo chips |
| Dashboard | Landing tab with the cafe overview |
| Floor | Table grid, status filters, and table actions |
| POS | Menu grid, item customizer, cart, KOT and checkout |
| Kitchen | Kanban-style KOT board with timers and status filters |
| Reports | Sales metrics, payment breakdown and top sellers |
| Settings | Profile, account, staff, GST and menu management |

## 🗃️ Pre-loaded Demo Data

The store ships with sample data so the app is usable immediately:

- 4 staff users (Manager, Cashier, Waiter, Barista)
- A default cafe profile ("RoastOps Cafe", Kolkata) with a sample UPI ID
- GST enabled with CGST 2.5% and SGST 2.5%
- 7 categories: Coffee, Starter, Meal, Dessert, Cold Drinks, Breakfast, Seasonal
- 10 menu items, 8 floor tables, 3 active KOT tickets and 5 completed bills

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- A working React Native environment with an Android emulator/device or iOS simulator/device

### Installation

```bash
git clone https://github.com/Tuhin1106/Brew-CMS.git
cd Brew-CMS
npm install
```

### Run the app

```bash
npm start
```

Then launch it on your emulator or device using the options shown in the terminal (for example `npm run android` or `npm run ios`, depending on your setup).

## 🔄 How an Order Flows

1. **Floor** — pick an available table (or add items to an occupied one)
2. **POS** — add items, customize with kitchen notes, then **Send KOT to Kitchen**
3. **Kitchen** — the ticket moves from Received to In Prep to Ready to Complete
4. **Checkout** — settle the bill via Cash, Card or UPI, and the table is set to Needs Cleaning
5. **Floor** — mark the table clean and it becomes Available again
6. **Reports** — the completed bill feeds into the sales analytics

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.
