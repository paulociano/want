# PATCH v6.6 · Consumer-only Public Landing

## Goal
Turn the public landing into a consumer-only surface.

## Removed from the landing
- direct B2B navigation;
- direct Pilot Lab navigation;
- B2B commercial section;
- links exposing internal validation/business tooling.

## Landing now focuses on
- creating a demand;
- browsing existing local signals;
- understanding how WANT works;
- understanding why participation matters.

## Access note
`/b2b/` and `/pilot/` still exist in the project for internal use.
This release removes them from public landing navigation and discoverability.
It does not add authentication or route-level authorization.

## Runtime marker
- landing: 6.6.0
