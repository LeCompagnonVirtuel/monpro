# MONPRO Mobile Standards

## Stack

React Native + Expo + TypeScript + Expo Router.

## Structure

Prefer feature-oriented organization:

src/
  app/
  components/
  features/
    auth/
    home/
    search/
    requests/
    professionals/
    quotes/
    bookings/
    messages/
    profile/
  lib/
  services/
  hooks/
  store/
  theme/
  types/

Adapt to the existing Expo Router layout.

## Rules

- typed navigation
- reusable components
- no business logic hidden inside screens
- central API client
- central auth/session handling
- centralized design tokens
- accessible touch targets
- keyboard-safe forms
- image optimization
- loading/error/empty states
- optimistic updates only where rollback is safe

## Location

Request permission explicitly.

Handle:
- denied
- restricted
- unavailable
- timeout
- manual address fallback

## Network

All API requests go through a shared client.

Handle:
- timeouts
- auth expiry
- retry only when safe
- offline state

Never expose privileged backend secrets in the mobile bundle.
