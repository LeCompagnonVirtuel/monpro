# MONPRO Marketplace Logic

## Core objects

Service Request:
what the client needs.

Quote:
what a professional proposes.

Booking:
the accepted commercial/scheduling relationship.

Intervention:
the actual service execution represented by booking state.

## Matching

Score professionals based on:
- service compatibility
- service area
- distance
- availability
- verification
- rating
- reliability

Keep the formula configurable.

## Cancellation

Cancellation rules must be explicit.

Consider:
- who cancelled
- booking state
- timing
- refund eligibility
- potential professional/customer penalties

Do not invent financial penalties without product requirements.

## Disputes

A dispute should preserve:
- involved users
- booking
- reason
- evidence
- timestamps
- current status
- admin resolution
