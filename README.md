# EVCharge: Smart EV Charging Station Management and Slot Booking System

> **Tagline:** Smart charging. Simple booking. Better journeys.

EVCharge is an enterprise-grade full-stack MERN platform built to streamline electric vehicle fleet charging operations, driver slot reservations, on-site QR check-ins, simulated telemetry streaming, automated billing calculations, digital receipts, network revenue analytics, and business intelligence reports.

This repository includes:
- **Phase 1:** Foundation, JWT Auth, Role-Based Access Control, User/Admin Dashboards
- **Phase 2:** Electric Vehicle Garage, Charging Station Catalog, Charger Port CRUD & Filters
- **Phase 3:** Slot Reservation, Conflict & Overlap Prevention, Booking Confirmation
- **Phase 4:** Cryptographic QR Check-In, ChargingSession Simulation Engine, Socket.IO Real-Time Telemetry & Admin Monitoring
- **Phase 5:** Payment Model, Server-Side Billing Engine, Mock Payment Simulator, Digital Tax Receipts, Admin Refunds & Revenue Dashboard
- **Phase 6:** Admin Analytics & Intelligence Hub, Multi-Metric Station Matrix, Peak Demand Curves, Charger Utilization Approximations, Audit Reports & CSV Export Engine

---

## Table of Contents
1. [Phase 6 Overview & Objectives](#phase-6-overview--objectives)
2. [Data & Metric Definitions](#data--metric-definitions)
3. [Formulas (Revenue, Utilization, Energy)](#formulas-revenue-utilization-energy)
4. [Date & Timezone Handling (Asia/Kolkata)](#date--timezone-handling-asiakolkata)
5. [MongoDB Aggregation Architecture](#mongodb-aggregation-architecture)
6. [Real-Time Socket.IO Telemetry & Fallback](#real-time-socketio-telemetry--fallback)
7. [Reports Hub & CSV Data Export](#reports-hub--csv-data-export)
8. [Phase 6 API Reference](#phase-6-api-reference)
9. [Frontend Routes & Recharts Visualizations](#frontend-routes--recharts-visualizations)
10. [Security & Access Control](#security--access-control)
11. [Installation, Seeding & Testing](#installation-seeding--testing)
12. [Known Limitations & Phase 7 Preview](#known-limitations--phase-7-preview)

---

## Phase 6 Overview & Objectives

Phase 6 implements a comprehensive **Admin Operations, Analytics & Reporting Center** designed to provide network administrators with real-time telemetry, operational insights, and exportable financial audits without overloading the Node.js runtime.

### Key Capabilities:
- **High-Performance MongoDB Pipelines:** All KPI summaries, daily groupings, hourly histograms, and station comparative matrix calculations run directly inside MongoDB aggregation pipelines using `$facet`, `$group`, `$project`, and `$dateToString`.
- **Analytics Intelligence Hub (`/admin/analytics`):** Master dashboard featuring 8 real-time KPI cards, live Socket.IO connection status, revenue trends, booking flow, energy throughput, and a sortable station performance table.
- **24-Hour Peak Demand Histogram:** Grouping booking start times into 0–23 hourly buckets in `Asia/Kolkata` local time to visualize morning and evening grid demand curves.
- **Charger Port Utilization Matrix:** Tracks port-level occupancy percentages with clear disclaimers distinguishing software-simulated bookings from physical hardware telemetry.
- **Audit Reports & CSV Streaming:** 4 dedicated reporting tabs (Bookings, Sessions, Payments, Energy) with pagination and 1-click verified CSV file exports.

---

## Data & Metric Definitions

All metrics adhere to strict business rules:

| Metric | Definition | Pipeline / Calculation Basis |
|---|---|---|
| **Gross Revenue** | Total sum of all verified `paid` transactions before any refund adjustments | Filter: `status: { $in: ['paid', 'refunded', 'partially_refunded'] }`, sum of `amount` |
| **Refunds** | Cumulative refunds issued by administrators | Sum of `refundAmount` across verified payment records |
| **Net Revenue** | Actual retained income after processing customer refunds | `grossRevenue - refunds` |
| **Energy Dispensed** | Total kilowatt-hours delivered to vehicles | Sum of `energyConsumedKwh` from `status: 'completed'` charging sessions |
| **Average Session Duration** | Mean charging cycle time in minutes | Mean of `actualDurationMinutes` from completed sessions |
| **Cancellation Rate** | Percentage of scheduled reservations cancelled by drivers | `(cancelledBookings / totalBookings) * 100` |
| **Charger Utilization Rate** | Estimated port busy time over configured operating window | `(bookedMinutes / (durationDays * 1440)) * 100` |
| **Peak Demand Hours** | 24-hour distribution of charging start times | `$hour` projection in `Asia/Kolkata` (+05:30) |

---

## Formulas (Revenue, Utilization, Energy)

### 1. Revenue & Billing Formula
$$\text{Gross Revenue} = \sum_{\text{paid, refunded}} \text{Payment.amount}$$
$$\text{Net Revenue} = \text{Gross Revenue} - \sum \text{Payment.refundAmount}$$

### 2. Charger Utilization Formula (Booking-Based Approximation)
$$\text{Operating Minutes} = \text{Days in Period} \times 24 \times 60$$
$$\text{Utilization Rate (\%)} = \min\left(100, \; \frac{\sum \text{Booked Minutes}}{\text{Operating Minutes}} \times 100\right)$$

> [!NOTE]
> **Hardware Disclaimers:** In Phase 6, physical charger hardware telemetry logs are not connected. All port occupancy numbers are calculated from booking and charging session records. Every charger analytics response includes `"isApproximation": true` and displays the warning:
> *"Utilization is estimated from bookings and simulated sessions. Physical charger uptime is not connected."*

---

## Date & Timezone Handling (Asia/Kolkata)

To eliminate date misalignment across UTC servers and Indian Standard Time (IST, UTC+05:30), `server/src/utils/analyticsHelpers.js` computes exact local day boundaries:

- **Presets Supported:** `today`, `yesterday`, `last_7_days`, `last_30_days`, `this_month`, `previous_month`.
- **Date Formatting:** Daily and monthly aggregations use MongoDB's `$dateToString` with timezone parameter:
  ```javascript
  {
    $dateToString: {
      format: "%Y-%m-%d",
      date: "$createdAt",
      timezone: "Asia/Kolkata"
    }
  }
  ```
- **Custom Dates:** `fromDate` and `toDate` query parameters validate that `fromDate <= toDate` and convert local calendar days into exact UTC query bounds.

---

## MongoDB Aggregation Architecture

To maintain sub-100ms response times and prevent Node.js Out-Of-Memory errors on large datasets:
1. **Early Filtering (`$match`):** Applied as the first pipeline stage using indexed fields (`stationId`, `createdAt`, `status`).
2. **Parallel Sub-Pipelines (`$facet`):** Executes status breakdowns, overall totals, and completed session statistics in a single database round-trip.
3. **Safe Division:** Avoids `DivideByZero` crashes using `$cond: [{ $gt: ['$total', 0] }, ..., 0]`.
4. **Lean Serialization:** All queries use `.lean()` or raw aggregation output to skip Mongoose document hydration overhead.

---

## Real-Time Socket.IO Telemetry & Fallback

The analytics console integrates with the central Socket.IO streaming engine:
- **Live Room Subscription:** Admins join the `admin:sessions` room on mount.
- **Event Listeners:** Real-time triggers for `session:started`, `session:completed`, `session:updated`, and `charger:statusUpdated`.
- **Adaptive Polling Fallback:** If the WebSocket connection drops, the UI automatically transitions to a 30-second background polling cycle and displays the badge: `Live updates unavailable (Polling 30s)`.
- **Clean Teardown:** All event listeners and intervals are terminated on component unmount.

---

## Reports Hub & CSV Data Export

The Reports module (`/admin/reports`) provides paginated audit tables and secure CSV file downloads:
- **Content Headers:** Returns `Content-Type: text/csv` with `Content-Disposition: attachment; filename="report-timestamp.csv"`.
- **Privacy Enforcement:** Sanitizes records to ensure passwords, password hashes, `qrTokenHash`, Stripe keys, and internal secrets are NEVER exported.
- **Memory Safety:** Streaming exports are capped at 2,000 records per file to protect server memory.

---

## Phase 6 API Reference

All endpoints are protected by `protect` (valid JWT required) and `adminOnly` (HTTP 403 for non-admins).

### Analytics Endpoints (`/api/admin/analytics`)
| Method | Endpoint | Query Parameters | Description |
|---|---|---|---|
| `GET` | `/api/admin/analytics/overview` | `preset`, `fromDate`, `toDate`, `stationId` | High-level summary of users, stations, ports, bookings, sessions, and revenues |
| `GET` | `/api/admin/analytics/revenue` | `preset`, `fromDate`, `toDate`, `stationId` | Financial summary (Gross, Net, Refunds, Pending) |
| `GET` | `/api/admin/analytics/revenue/daily` | `preset`, `fromDate`, `toDate`, `stationId` | Daily revenue timeline data for charts |
| `GET` | `/api/admin/analytics/revenue/monthly` | `preset`, `fromDate`, `toDate`, `stationId` | Monthly revenue aggregations |
| `GET` | `/api/admin/analytics/revenue/by-station` | `preset`, `fromDate`, `toDate` | Revenue generated grouped per station |
| `GET` | `/api/admin/analytics/revenue/by-payment-method` | `preset`, `fromDate`, `toDate` | Breakdown of revenue across UPI, Card, and Cash |
| `GET` | `/api/admin/analytics/bookings` | `preset`, `fromDate`, `toDate`, `stationId` | Booking metrics, cancellation rates, duration averages |
| `GET` | `/api/admin/analytics/bookings/daily` | `preset`, `fromDate`, `toDate`, `stationId` | Daily booking volumes by status |
| `GET` | `/api/admin/analytics/bookings/by-station` | `preset`, `fromDate`, `toDate` | Bookings count and cancellation rate per station |
| `GET` | `/api/admin/analytics/bookings/by-status` | `preset`, `fromDate`, `toDate` | Booking status distribution counts |
| `GET` | `/api/admin/analytics/bookings/peak-hours` | `preset`, `fromDate`, `toDate`, `stationId` | 24-hour demand histogram (0–23 hours in IST) |
| `GET` | `/api/admin/analytics/sessions` | `preset`, `fromDate`, `toDate`, `stationId` | Session telemetry, energy averages, duration extremes |
| `GET` | `/api/admin/analytics/sessions/daily` | `preset`, `fromDate`, `toDate`, `stationId` | Daily completed sessions and energy totals |
| `GET` | `/api/admin/analytics/energy` | `preset`, `fromDate`, `toDate`, `stationId` | Overall energy throughput in kWh |
| `GET` | `/api/admin/analytics/energy/daily` | `preset`, `fromDate`, `toDate`, `stationId` | Daily energy consumption trend |
| `GET` | `/api/admin/analytics/energy/by-station` | `preset`, `fromDate`, `toDate` | Energy dispensed per station |
| `GET` | `/api/admin/analytics/chargers` | `preset`, `fromDate`, `toDate`, `stationId` | Port status distribution and occupancy utilization % |
| `GET` | `/api/admin/analytics/stations` | `preset`, `fromDate`, `toDate`, `sortBy`, `sortOrder` | Multi-metric station performance matrix |
| `GET` | `/api/admin/analytics/payments/status` | `preset`, `fromDate`, `toDate` | Payment methods, providers, and settlement status |
| `GET` | `/api/admin/analytics/users` | `preset`, `fromDate`, `toDate` | User registrations, active booking drivers |

### Reports & CSV Endpoints (`/api/admin/reports`)
| Method | Endpoint | Query Parameters | Description |
|---|---|---|---|
| `GET` | `/api/admin/reports/summary` | `preset`, `fromDate`, `toDate`, `stationId` | Report totals across bookings, sessions, revenue, and energy |
| `GET` | `/api/admin/reports/bookings` | `page`, `limit`, `preset`, `fromDate`, `toDate`, `format=csv` | Paginated bookings report table or CSV download |
| `GET` | `/api/admin/reports/sessions` | `page`, `limit`, `preset`, `fromDate`, `toDate`, `format=csv` | Paginated charging sessions report table or CSV download |
| `GET` | `/api/admin/reports/payments` | `page`, `limit`, `preset`, `fromDate`, `toDate`, `format=csv` | Paginated payment ledger table or CSV download |
| `GET` | `/api/admin/reports/energy` | `page`, `limit`, `preset`, `fromDate`, `toDate`, `format=csv` | Paginated kilowatt-hour audit table or CSV download |

---

## Frontend Routes & Recharts Visualizations

### Admin Analytics Routes
- `/admin/analytics` — Master Analytics & Intelligence Console
- `/admin/analytics/revenue` — Revenue deep dive with gross vs. net charts and channel breakdowns
- `/admin/analytics/bookings` — Booking fulfillment, cancellation metrics, and 24-hour peak demand curves
- `/admin/analytics/sessions` — Charging duration distributions and energy throughput
- `/admin/analytics/chargers` — Port status donut charts and hardware utilization rankings
- `/admin/analytics/stations` — Sortable station comparative performance matrix
- `/admin/reports` — 4-tab audit reporting center with instant CSV exports

### Visualizations Implemented (via Recharts)
1. **Revenue Timeline:** Dual-area gradient chart (Gross vs. Net vs. Refunds) with toggle to grouped Bar chart.
2. **Daily Booking Flow:** Stacked multi-color Bar chart (Completed, Confirmed, Cancelled).
3. **Energy Dispensed:** Purple gradient Area chart tracking daily kWh delivered.
4. **Charger Status Breakdown:** Donut chart with status indicators (Available, Charging, Reserved, Maintenance).
5. **Peak Demand Histogram:** 24-bar distribution (0–23h IST) highlighting rush hours.
6. **Station Revenue Yield:** Horizontal Bar chart ranking top earning locations.
7. **Payment Method Mix:** Pie chart analyzing settlement distribution across UPI, Card, and Cash.

---

## Security & Access Control

1. **Role Verification:** All `/api/admin/*` routes enforce `role === 'admin'`. Normal users receive `HTTP 403 Forbidden`.
2. **Frontend Route Guards:** Non-admin users navigating to `/admin/*` routes are intercepted by `<ProtectedRoute requireAdmin={true} />` and redirected to `/dashboard`.
3. **Query Parameter Sanitization:** Date and ID parameters are validated to prevent MongoDB operator injection.
4. **Data Privacy in Exports:** Passwords, password hashes, `qrTokenHash`, and gateway API secrets are omitted from all JSON responses and CSV downloads.

---

## Installation, Seeding & Testing

### 1. Database Seeding (Phase 6)
Populates multiple stations (Indiranagar, Whitefield, Koramangala), various charger power ratings (15kW–60kW), multi-user profiles, and 25+ days of realistic charging sessions and peak demand histograms:
```bash
npm --prefix server run seed:phase6
```
*Test Credentials:*
- **Admin:** `admin@evcharge.com` / `Admin@123`
- **Driver:** `driver@evcharge.com` / `Driver@123`

### 2. Running Automated Tests
Executes the 34-assertion automated integration test suite verifying analytics endpoints, date boundaries, CSV exports, role protection, and zero-data safety:
```bash
npm --prefix server run test:phase6
```

### 3. Client Production Build
Validates Vite bundling, TailwindCSS styles, and Recharts components:
```bash
npm --prefix client run build
```

---

## Known Limitations & Phase 7 Preview

### Phase 6 Limitations
1. **Hardware Telemetry Simulation:** Port utilization is calculated from booking and charging session records rather than real hardware IoT telemetry streams.
2. **Timezone Focus:** Standardized to Indian Standard Time (`Asia/Kolkata`, UTC+05:30).

### Phase 7 Connection
The analytics datasets, peak demand curves, and station occupancy metrics established in Phase 6 form the foundational input for **Phase 7 (Maps, Driver Reviews, Dynamic Pricing & Notifications)**:
- **Dynamic Tariff Engine:** Uses Phase 6 peak demand hours to automatically adjust pricing during high-load periods.
- **Interactive Map Layers:** Plots station performance and real-time port availability on Mapbox / Leaflet map markers.
- **Smart Notifications:** Triggers driver alerts when favorite stations have high port availability during non-peak hours.
