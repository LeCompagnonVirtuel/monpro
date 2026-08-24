# MONPRO Payments

Payment providers are external dependencies.

Create a provider interface such as:

PaymentProvider
- createPayment()
- getPaymentStatus()
- handleWebhook()
- refund()

Provider implementations must be isolated.

A payment is not successful until the backend receives trusted provider confirmation.

Required states:
PENDING
SUCCESS
FAILED
CANCELLED
REFUNDED

Implement idempotency.

Record:
- provider
- provider transaction ID
- internal transaction ID
- booking/request
- gross amount
- platform fee
- professional amount
- status
- timestamps

Never store raw card/payment credentials unless explicitly required by a compliant provider flow.
