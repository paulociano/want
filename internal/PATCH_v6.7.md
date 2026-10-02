# PATCH v6.7 · Cluster Detail Theme Contrast

## Bug
The public landing uses a dark theme with global white H1 styling.
The cluster detail card remains a light surface, so the global landing H1 rule
was overriding the cluster title and rendering white text on a light background.

## Fix
- explicit dark title color on light cluster cards;
- dark fact values and big-number text;
- muted descriptions / metadata on light surfaces;
- category pill aligned to Indigo;
- support panel remains dark Graphite / Indigo;
- back button remains readable on the dark page canvas.

## Scope
Visual-only. No changes to cluster API, support flow, sharing, tracking or persistence.

## Runtime
- landing: 6.7.0
