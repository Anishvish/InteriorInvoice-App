# 🧾 Interior Invoice

A professional, offline-first mobile invoicing app built for interior designers and contractors. Create, manage, edit, and share beautiful PDF invoices — all from your phone.

Built with **React Native (Expo)** + **TypeScript**.

---

## ✨ Features

### 📊 Dashboard
- At-a-glance stats: **Total Invoices**, **Revenue**, **Collected**, **Pending**
- **Payment Status Breakdown** — Paid, Partial, and Unpaid invoice counts
- Recent invoices with payment status badges
- Pull-to-refresh for instant updates

### 🧾 Invoice Management
- **Create Invoices** with detailed client info and multiple line items
- **Edit Invoices** — fix mistakes or update any field after creation
- **Delete Invoices** with confirmation prompt
- Search invoices by client name or invoice number
- **Filter by payment status** — All, Unpaid, Partial, Paid (with live counts)
- Paginated invoice list with infinite scroll

### ⚡ Performance Optimized
- **100+ items without lag** — FlatList virtualization + React.memo'd item cards
- Each item card only re-renders when its own fields change (per-item `useWatch`)
- Isolated summary component prevents cascading re-renders

### 📐 Dual Calculation Modes
- **Area Mode** — enter length × width in Feet & Inches or Inches Only
- **Direct Mode** — enter quantity and rate directly
- Mix both modes freely within a single invoice

### 💰 Payment Tracking
- Track **advance payments** and **balance due**
- **Record payments** with quick-fill buttons (Full Balance / Half)
- **Mark as Paid** — one-tap to mark invoice fully paid
- **Reset Payment** — undo and reset to unpaid
- Auto-detects status: UNPAID → PARTIAL → PAID
- Color-coded status badges everywhere (green/orange/red)

### 🎯 User-Friendly Design
- **Collapsible item cards** — expand/collapse individual items or all at once
- **Duplicate items** — one tap to clone an item with all values copied
- **Auto-focus** description field when adding new items
- **Floating running total** — see grand total while scrolling items
- **Discard confirmation** — warns before losing unsaved changes
- **Guided empty states** — friendly prompts with action buttons

### 📄 PDF Generation & Sharing
- Professional PDF invoice layout with company branding
- **Preview** invoices before printing
- **Share** directly via WhatsApp, Email, or any sharing target
- GST-compliant Tax Invoice format when applicable

### 🏢 Multi-Company Support
- Manage multiple companies from one app
- Per-company **invoice numbering** with custom prefix (e.g., `EI-2026-0001`)
- Auto-incrementing invoice counter
- Switch between companies seamlessly

### 🎨 Premium UI
- Dark & Light themes with instant switching
- Material Design 3 (React Native Paper) components
- Animated toast notifications (success, error, info)
- Floating action buttons with spring animations

### 📱 Offline-First
- **SQLite** local database — no internet needed
- All data stored on-device
- Instant load times

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native (Expo SDK 54) |
| Language | TypeScript |
| UI Library | React Native Paper (MD3) |
| Navigation | React Navigation (Stack + Bottom Tabs) |
| State Management | Zustand |
| Database | expo-sqlite |
| Forms | React Hook Form + useFieldArray |
| PDF | expo-print + expo-sharing |
| Icons | @expo/vector-icons (MaterialCommunityIcons) |

---

## 📁 Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── Toast.tsx              # Animated toast notifications
│   ├── InvoiceItemCard.tsx    # Memoized, collapsible item card
│   ├── InvoiceSummary.tsx     # Isolated totals component
│   └── FloatingTotalBar.tsx   # Running total overlay
├── database/         # SQLite initialization & migrations
├── models/           # TypeScript type definitions
├── navigation/       # Stack + Tab navigator setup
├── repository/       # Database CRUD operations
│   ├── companyRepository.ts
│   └── invoiceRepository.ts
├── screens/          # App screens
│   ├── DashboardScreen.tsx
│   ├── InvoiceListScreen.tsx
│   ├── CreateInvoiceScreen.tsx
│   ├── InvoiceDetailScreen.tsx
│   ├── CompanyListScreen.tsx
│   └── CompanyFormScreen.tsx
├── services/         # PDF generation & sharing
├── store/            # Zustand state stores
├── theme/            # Light & dark theme definitions
└── utils/            # Calculation helpers, invoice numbering
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Android/iOS device or emulator

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd InteriorInvoice

# Install dependencies
npm install

# Start the dev server
npx expo start
```

### Build APK (Android)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build preview APK
eas build -p android --profile preview
```

---

## 📋 Data Models

### Company
- Company name, owner, phone, address
- GST toggle with GSTIN and default GST %
- Company logo support
- Invoice prefix and auto-counter

### Invoice
- Client name, phone, address
- Multiple line items (area or direct mode)
- Subtotal, GST, grand total, advance, balance
- **Payment status** (UNPAID / PARTIAL / PAID)
- Auto-generated invoice number
- Timestamps

---

## 📸 Screens Overview

| Screen | Description |
|---|---|
| **Dashboard** | Company overview, revenue stats, payment breakdown, recent invoices |
| **Invoice List** | Searchable list with filter chips (All/Unpaid/Partial/Paid) |
| **Create Invoice** | Collapsible item cards, duplicate items, floating total, discard guard |
| **Edit Invoice** | Same form pre-filled with existing data for corrections |
| **Invoice Detail** | Full breakdown with Record Payment, Mark Paid, PDF, Share, Delete |
| **Companies** | List and manage multiple companies |
| **Company Form** | Add/edit company details with GST configuration |

---

## 📜 License

This project is private and intended for personal/commercial use by the owner.
