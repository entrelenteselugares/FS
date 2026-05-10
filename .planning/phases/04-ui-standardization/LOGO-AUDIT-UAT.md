# LOGO-AUDIT-UAT.md

## Finding F-01: Inconsistent Logo File Paths
**Severity:** Medium
**Description:** Multiple logo paths are used (`/logo-fs.png`, `/logo.png`, `/assets/logo.png`).
**Files:** 
- `Navbar.tsx`
- `HomePage.tsx`
- `LoginPage.tsx`
- `RegisterPage.tsx`
- `DashboardLayout.tsx`
- `PaywallView.tsx`
- `DeliveryView.tsx`
**Expected:** All primary logo usages should use `/logo.png`.

## Finding F-02: Non-Standardized Logo Sizes
**Severity:** Medium
**Description:** Logo heights vary arbitrarily between `16px` (h-4) and `32px` without a clear hierarchy.
**Files:**
- `Navbar.tsx` (20px)
- `HomePage.tsx` (32px)
- `DashboardLayout.tsx` (28px and 22px)
- `LoginPage.tsx` (h-6)
- `RegisterPage.tsx` (h-4)
- `CheckoutPage.tsx` (h-4)
**Expected:** Standardize to 20px (Navbar), 28px (Auth/Sidebar), 32px (Footer), 16px (UI elements).

## Finding F-03: Hardcoded Filters Breaking Dark/Light Mode
**Severity:** High
**Description:** Several components use hardcoded `invert`, `grayscale`, or `brightness` filters which don't adapt to the theme toggle.
**Files:**
- `NotFoundPage.tsx` (`grayscale(1) brightness(2)`)
- `ClubLandingPage.tsx` (`grayscale`)
- `PaywallView.tsx` (`invert brightness-0`)
- `DeliveryView.tsx` (`invert brightness-0`)
**Expected:** Use `var(--logo-filter)` for theme-aware rendering.

## Finding F-04: Missing Logo Link in Some Views
**Severity:** Low
**Description:** Some logos are not wrapped in a `<Link to="/">`, breaking UX expectations.
**Files:**
- `LoginPage.tsx`
- `CheckoutPage.tsx`
**Expected:** All primary logos should link to the homepage.
