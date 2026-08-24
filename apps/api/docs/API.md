# MONPRO API Reference

## Base URL

```
/api/v1
```

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

Tokens are obtained via OTP verification and expire after 15 minutes. Use the refresh endpoint to renew.

## Public Endpoints (no authentication)

| Method | Path | Description |
|--------|------|-------------|
| POST | /auth/request-otp | Request OTP code |
| POST | /auth/verify-otp | Verify OTP and get tokens |
| POST | /auth/register | Register new account |
| POST | /auth/refresh | Refresh access token |
| GET | /categories | List categories |
| GET | /categories/:id | Category detail |
| GET | /services | List services |
| GET | /services/:id | Service detail |
| GET | /professionals | List professionals |
| GET | /professionals/:id | Professional profile |
| GET | /professionals/match | Match professionals for a service |
| GET | /geography/* | Countries, regions, cities, districts |
| GET | /health | Health check |
| GET | /health/ready | Readiness probe |
| POST | /payments/webhook/:provider | Payment webhook (signature-verified) |

## Protected Endpoints

### Users
| Method | Path | Description |
|--------|------|-------------|
| GET | /users/me | Current user profile |
| PATCH | /users/me | Update profile |

### Addresses
| Method | Path | Description |
|--------|------|-------------|
| GET | /addresses | My addresses |
| POST | /addresses | Add address |
| PATCH | /addresses/:id | Update address |
| DELETE | /addresses/:id | Delete address |
| PATCH | /addresses/:id/default | Set as default |

### Service Requests
| Method | Path | Description |
|--------|------|-------------|
| POST | /service-requests | Create request |
| GET | /service-requests/mine | My requests |
| GET | /service-requests/:id | Request detail |
| PATCH | /service-requests/:id/status | Update status |

### Quotes
| Method | Path | Description |
|--------|------|-------------|
| POST | /quotes | Send quote (professional) |
| GET | /quotes/professional | My quotes |
| PATCH | /quotes/:id/accept | Accept quote |
| PATCH | /quotes/:id/reject | Reject quote |

### Bookings
| Method | Path | Description |
|--------|------|-------------|
| POST | /bookings | Create booking from quote |
| GET | /bookings/:id | Booking detail |
| PATCH | /bookings/:id/status | Update booking status |

### Interventions
| Method | Path | Description |
|--------|------|-------------|
| POST | /interventions/:bookingId | Create intervention |
| PATCH | /interventions/:bookingId/arrived | Mark arrived |
| PATCH | /interventions/:bookingId/start | Start (with photos) |
| PATCH | /interventions/:bookingId/complete | Complete (with photos) |
| PATCH | /interventions/:bookingId/confirm | Client confirms |
| GET | /interventions/:bookingId | Intervention detail |

### Payments
| Method | Path | Description |
|--------|------|-------------|
| POST | /payments | Initiate payment |
| GET | /payments/booking/:bookingId | Payment for booking |

### Reviews
| Method | Path | Description |
|--------|------|-------------|
| POST | /reviews | Create review |
| GET | /reviews/professional/:id | Professional reviews |
| PATCH | /reviews/:id/respond | Respond to review |

### Messaging
| Method | Path | Description |
|--------|------|-------------|
| GET | /conversations | My conversations |
| POST | /conversations | Create conversation |
| GET | /conversations/:id/messages | Messages |
| POST | /conversations/:id/messages | Send message |
| POST | /conversations/:id/read | Mark as read |

### Notifications
| Method | Path | Description |
|--------|------|-------------|
| GET | /notifications | My notifications |
| PATCH | /notifications/:id/read | Mark as read |
| POST | /notifications/read-all | Mark all as read |

### Device Tokens
| Method | Path | Description |
|--------|------|-------------|
| POST | /device-tokens | Register token |
| DELETE | /device-tokens/:token | Unregister token |

### Businesses
| Method | Path | Description |
|--------|------|-------------|
| POST | /businesses | Create business |
| GET | /businesses | My businesses |
| PATCH | /businesses/:id | Update business |
| POST | /businesses/:id/members | Add member |
| DELETE | /businesses/:id/members/:professionalId | Remove member |

### Uploads
| Method | Path | Description |
|--------|------|-------------|
| POST | /uploads/:folder | Upload file |
| DELETE | /uploads | Delete file |

## Admin Endpoints (ADMIN role required)

| Method | Path | Description |
|--------|------|-------------|
| GET | /admin/dashboard | Dashboard stats |
| GET | /admin/verifications | Pending verifications |
| PATCH | /admin/verifications/:id | Verify/reject professional |
| GET | /admin/commissions | Commission configs |
| POST | /admin/commissions | Create commission |
| PATCH | /admin/commissions/:id | Update commission rate |
| GET | /admin/bookings | All bookings |
| GET | /admin/payments | All payments |

## Disputes
| Method | Path | Description |
|--------|------|-------------|
| POST | /disputes | Create dispute |
| GET | /disputes | List disputes (admin) |
| PATCH | /disputes/:id/resolve | Resolve dispute (admin) |
| POST | /disputes/reports | Report user |
| GET | /disputes/reports | List reports (admin) |

## OpenAPI

Full OpenAPI 3.0 specification available at:

```
GET /api/openapi.json
```

Swagger UI (development only):

```
GET /api/docs
```

## Error Format

```json
{
  "statusCode": 400,
  "message": "Description of error",
  "error": "Bad Request"
}
```

## Pagination

Paginated endpoints accept `?page=1&limit=20` and return:

```json
{
  "data": [...],
  "total": 100,
  "page": 1,
  "limit": 20,
  "totalPages": 5
}
```
