# 🧾 Interior Invoice

A professional, offline-first mobile invoicing app built for interior designers and contractors. Create, manage, edit, and share beautiful PDF invoices — all from your phone.

Built with **React Native (Expo)** + **TypeScript**.

---

## ✨ Features

### 📊 Dashboard
- At-a-glance stats: **Total Invoices**, **Total Revenue**, **Pending Balance**
- Recent invoices list with quick navigation
- Pull-to-refresh for instant updates
- Active company header with GST status

### 🧾 Invoice Management
- **Create Invoices** with detailed client info and multiple line items
- **Edit Invoices** — fix mistakes or update any field after creation (invoice number stays unchanged)
- **Delete Invoices** with confirmation prompt
- Search invoices by client name or invoice number
- Paginated invoice list with infinite scroll

### 📐 Dual Calculation Modes
- **Area Mode** — enter length × width in feet & inches, auto-calculates square footage
- **Direct Mode** — enter quantity and rate directly
- Mix both modes freely within a single invoice

### 💰 Flexible Pricing & Payments
- Automatic **subtotal**, **GST** (configurable %), and **grand total** calculation
- Track **advance payments** and **balance due**
- Color-coded paid/pending status indicators

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
- Dark theme with a refined purple-accent color palette
- Material Design 3 (React Native Paper) components
- Animated toast notifications (success, error, info)
- Floating action buttons with spring animations
- Safe area handling for all device types

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
├── components/       # Reusable UI (Toast notifications)
├── database/         # SQLite initialization & schema
├── models/           # TypeScript type definitions
├── navigation/       # Stack + Tab navigator setup
├── repository/       # Database CRUD operations
│   ├── companyRepository.ts
│   └── invoiceRepository.ts
├── screens/          # App screens
│   ├── DashboardScreen.tsx
│   ├── InvoiceListScreen.tsx
│   ├── CreateInvoiceScreen.tsx   # Create + Edit dual-mode
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
- Auto-generated invoice number
- Timestamps

---

## 📸 Screens Overview

| Screen | Description |
|---|---|
| **Dashboard** | Company overview, stats cards, recent invoices, FAB to create |
| **Invoice List** | Searchable, paginated list with paid/pending chips |
| **Create Invoice** | Form with client details, dynamic item cards, live totals |
| **Edit Invoice** | Same form pre-filled with existing data for corrections |
| **Invoice Detail** | Full breakdown with Edit, Preview PDF, Share, and Delete actions |
| **Companies** | List and manage multiple companies |
| **Company Form** | Add/edit company details with GST configuration |

---

## 📜 License

This project is private and intended for personal/commercial use by the owner.
