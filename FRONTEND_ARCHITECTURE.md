# DeltaSpec Frontend Architecture

This document details the architecture of the DeltaSpec frontend application, a React-based trading dashboard designed for real-time crypto market analysis.

## Overview

The frontend is a Single Page Application (SPA) built with **React 18** and **TypeScript**, using **Vite** as the build tool. It integrates with **Tailwind CSS** and **shadcn/ui** for styling and design components.

### Core Technologies
- **Framework:** React 18
- **Language:** TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS + shadcn/ui
- **State Management:** React Context (Auth, Market Data)
- **Real-time:** Socket.io-client
- **HTTP Client:** Axios with interceptors
- **Charts:** Recharts (planned integration)
- **Routing:** React Router

---

## Application Structure

### 1. Entry Point
- **`main.tsx`**: Application bootstrap, establishes global providers.
- **`App.tsx`**: Main application component with routing configuration.

### 2. Routing & Guards
- **`ProtectedRoute.tsx`**: Route guard ensuring user authentication.
- **Routes:**
  - `/login` → Login page
  - `/register` → Registration page
  - `/` → Protected Dashboard

### 3. Layout System
- **`components/Layout.tsx`**: Main layout wrapper.
  - **Header:** Logo, instrument selector, settings, theme toggle.
  - **Sidebar:** Navigation tabs with quick stats.
  - **Main Content:** Dynamic view content.
  - **Right Panels:** Order book and alerts.

### 4. Context Providers
- **AuthContext:** Manages authentication state, token refresh, user profile.
- **MarketDataContext:** Handles real-time market data from Socket.io.
- **ThemeProvider:** Manages light/dark theme switching.

---

## Component Architecture

### Dashboard Layout Components

#### Header (`components/DeltaSpec/Header.tsx`)
- **Logo:** DeltaSpec branding.
- **InstrumentSelector:** Dropdown for choosing trading pairs.
- **ConnectionStatus:** Real-time connection indicator.
- **SettingsButton:** Opens settings modal.
- **ThemeToggle:** Light/dark mode switcher.

#### Sidebar (`components/DeltaSpec/Sidebar.tsx`)
- **Navigation Tabs:** 6 main view tabs with icons.
  - Live Data, Delta Analysis, Footprint, Volume Profile, Signals, Export Data.
- **Quick Stats Cards:** Real-time metrics (Volume, Active Signals, Success Rate).
- **Responsive Behavior:** Collapses on smaller screens.

#### Right Panels (`components/DeltaSpec/RightPanels.tsx`)
- **Order Book:** Live bid/ask levels with spread calculation.
- **Active Alerts:** Trading signals and warnings with auto-scroll.

### View Components (`components/DeltaSpec/Views/`)

#### Live Data View
- **Price Overview:** 24h change, high/low, volume.
- **Timeframe Selector:** 1m, 5m, 15m, 1h, 4h, 1d.
- **Chart Placeholder:** Ready for Recharts integration.
- **Recent Trades Feed:** Real-time trade updates with color-coded buy/sell.

#### Delta Analysis View
- **Control Panel:** Lookback period, method selector, sensitivity.
- **4 Metric Cards:**
  - Cumulative Delta with trend indicator.
  - Buy Volume with progress bar.
  - Sell Volume with progress bar.
  - Net Delta with percentage.

#### Footprint View
- **Filters:** Intensity and minimum volume sliders.
- **Heatmap Visualization:** Price-level volume distribution.
- **Statistics:** Levels, highest volume, average volume.
- **Export Functionality:** Data download capability.

#### Volume Profile View
- **Profile Controls:** Profile type, value area percentage.
- **Key Level Cards:** POC, VAH, VAL, VWAP with gradients.
- **Horizontal Bar Chart:** Volume distribution visualization.

#### Signals View
- **Filter System:** Signal type and sensitivity filters.
- **Performance Metrics:** Win rate, average gain, total signals, active now.
- **Signals Grid:** 3-column layout for active signals.
- **History Table:** Paginated history with sortable columns.

#### Export Data View
- **Data Selection:** Trade, order book, delta, signals data types.
- **Format Options:** CSV, JSON export formats.
- **Date Range Picker:** Custom time range selection.
- **Export History:** Previous exports with download links.

### LLM Integration Components

#### Chat Interface (`components/DeltaSpec/Views/LLMGuidance/`)
- **ChatMessage.tsx:** Individual chat message rendering.
- **GuidanceCard.tsx:** Structured recommendation display.
- **QuickInsightsWidget.tsx:** Dynamic market insights display.

---

## State Management

### Context Pattern
The app uses React Context for global state management:

1. **AuthContext (`contexts/AuthContext.tsx`):**
   - Authentication status, tokens, user profile.
   - Automatic token refresh logic.
   - Login/logout actions.

2. **MarketDataContext (`context/MarketDataContext.tsx`):**
   - Real-time price updates.
   - Order book data.
   - Trade stream subscription.

### Local Component State
- **React Hooks:** `useState`, `useEffect`, `useMemo`, `useCallback`.
- **Custom Hooks:** `useMarketData`, `useToast`, `useMobile`.

---

## API Integration

### HTTP Client (`api/api.ts`)
- **Axios Instance:** Pre-configured with base URL and auth headers.
- **Request Interceptors:** Automatic token attachment.
- **Response Interceptors:** Token refresh on 401 errors.
- **Error Handling:** Standardized error responses.

### API Modules (`api/`)
- **`auth.ts`:** Authentication endpoints.
- **`llmGuidance.ts`:** AI chat and guidance endpoints.
- **`marketData.ts`:** Real-time data subscriptions.
- **`settings.ts`:** User preferences and configurations.
- **`export.ts`:** Data export functionality.

---

## Real-time Data Flow

1. **Socket.io Connection:** Established on app load when authenticated.
2. **Stream Subscription:** Client subscribes to relevant Redis streams.
3. **Data Updates:** Context updates trigger re-renders.
4. **Visual Updates:** Components display new data with smooth animations.

---

## Styling System

### Tailwind CSS
- **Utility-first Approach:** Rapid component development.
- **Design Tokens:** Consistent spacing, colors, typography.
- **Dark Theme:** Default theme with light mode toggle.
- **Responsive Design:** Mobile-first breakpoint system.

### shadcn/ui Components
- **Accessibility:** ARIA-compliant components.
- **Customization:** Easy theming and modification.
- **Consistency:** Uniform component behavior and styling.

### Custom Styling
- **Frosted Glass Effects:** Backdrop blur with transparency.
- **Gradient Backgrounds:** Subtle depth and visual hierarchy.
- **Smooth Animations:** CSS transitions for interactions.
- **Color Coding:** Semantic colors (green=bullish, red=bearish, blue=neutral).

---

## Performance Optimizations

### Code Splitting
- **Dynamic Imports:** Views loaded on demand.
- **Lazy Components:** Route-based code splitting.
- **Bundle Optimization:** Tree shaking and dead code elimination.

### React Optimizations
- **React.memo:** Expensive component memoization.
- **useMemo/useCallback:** Expensive calculation caching.
- **Virtual Scrolling:** Ready for large data lists.

### Data Management
- **Debouncing:** Search and filter inputs.
- **Buffer Management:** Real-time data buffering.
- **Connection Management:** Smart WebSocket reconnection.

---

## Error Handling & Logging

### Error Boundaries
- **Component-level:** Catch and handle React errors.
- **Global Error Handler:** Unhandled error recovery.
- **User Feedback:** Toast notifications for user actions.

### Logging
- **Console Logging:** Development debugging.
- **Error Tracking:** Production error monitoring (ready for Sentry integration).
- **Performance Tracking:** API response time monitoring.