# PATCH v6.4 · Brand Fidelity Correction

## Cause
v6.3 over-interpreted the approved concept:
- it altered the geometry of the entire WANT wordmark when only the T needed refinement;
- it used a newly generated hero image instead of preserving the approved visual direction;
- it pushed image backgrounds into system pages where the approved identity called for cleaner Signal Map surfaces.

## Fix
- restored the v6.2 W / A / N geometry;
- changed only the T crossbar width;
- replaced the v6.3 generated hero visual with a direct crop from the approved brand board;
- removed synthetic HTML pins/cards over the approved map image;
- kept B2B, Pilot and Control dark and brand-aligned without photo collage treatment;
- preserved all product logic, tracking, persistence, API and experiments.

## Runtime markers
- landing: 6.4.0
- b2b: 6.4.0-b2b
- pilot: 6.4.0-pilot
- control: 6.4.0-control
- brand model: 1.4
