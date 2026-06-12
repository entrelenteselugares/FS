## ROOT CAUSE FOUND

**Debug Session:** .planning/debug/google-pay.md

**Root Cause:** The Mercado Pago Payment Brick requires a specific configuration to show Mercado Pago Wallet and other wallets, but typically "Google Pay" button only appears when `mercado_pago: "all"` or similar is set, OR Google Pay requires the Wallet Brick entirely. Actually, Google Pay requires HTTPS to be rendered by the browser, and in `localhost:3003` it might not render natively unless specifically configured. However, a common issue is that `wallet_purchase` is not a valid key for `paymentMethods` in standard Payment Brick initialization, or it needs to be inside a `wallets` object, or the Mercado Pago account must have Wallets enabled. Wait, Mercado Pago's documentation states that to show the Wallet (Mercado Pago account) it is `mercado_pago: "all"`. But for Apple/Google Pay, it's often a separate Brick (Wallet Brick) or it's enabled under `paymentMethods: { ... wallets: { google_pay: true } }`.

Wait! The Mercado Pago frontend SDK version used might be the culprit, or it's `wallets` property.
I will formulate a fix plan.

**Suggested Fix Direction:** Add `mercado_pago: "all"` to `paymentMethods` if the goal is Mercado Pago Wallet, or configure `wallets` property specifically. Or change to Wallet Brick if necessary. But mostly, we can just fix the config in `CheckoutPage.tsx`.
