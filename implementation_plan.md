# Medical Migration Map — Implementation Plan

Build a full-featured interactive hospital discovery map inside the existing SWASTHYA-FLOW React/Vite app. The feature lets users find nearby hospitals, compare affordability, check Ayushman Bharat eligibility, and get "Best for You" recommendations.

## Proposed Changes

### Dependencies / CDN

#### [MODIFY] [index.html](file:///e:/HACKATHON/SAIT%20COGNOISE/frontend/index.html)
- Add **Leaflet.js CSS + JS** via CDN (free map library, no API key required)
- Add **Leaflet.markercluster** plugin CSS + JS for marker clustering

---

### Data Layer

#### [NEW] [hospitalData.js](file:///e:/HACKATHON/SAIT%20COGNOISE/frontend/src/utils/hospitalData.js)
Rich mock dataset of 15–20 hospitals with:
- `id`, `name`, `lat`, `lng`, `rating`, `distance`
- `ayushmanBharat` (bool), `insuranceProviders` (array)
- `pricing` (`{ general, semiPrivate, private }` per bed/night)
- `emergency` (bool), `specialists` (array with dept tags)
- `departments` (array), `bedAvailability` (object)
- `estimatedTreatmentCost` (ranges), `specialties` (array)

---

### Pages

#### [NEW] [MedicalMigrationMap.jsx](file:///e:/HACKATHON/SAIT%20COGNOISE/frontend/src/pages/MedicalMigrationMap.jsx)
Single-file implementation containing all sub-components:

**State**
- `hospitals` — filtered list of hospitals
- `selectedHospital` — currently clicked marker
- `filters` — `{ ayushman, insurance, priceRange, specialties, sortBy }`
- `userLocation` — `{ lat, lng }` from geolocation or default
- `isPanelOpen`, `isExpanded` (detail accordion)
- `isLoading` (skeleton state)

**Layout** (mobile-first)
- Full-screen map taking up left 60% on desktop / full-width on mobile
- Filter bar pinned at top (scrollable chips on mobile)
- Slide-up bottom sheet on mobile / right panel on desktop when hospital clicked

**Map Section**
- `useEffect` initialises Leaflet map from `window.L`
- Attempts `navigator.geolocation.getCurrentPosition` → centres map; on fail shows city search input
- Custom SVG hospital marker icons (teal for normal, amber for "Best for You")
- `L.markerClusterGroup()` for clustering
- `marker.on('click', ...)` → sets `selectedHospital`

**HospitalPanel Component** (inline)
- Summary row: name, ⭐ rating, 📍 distance
- Chips: Ayushman badge (green), insurance provider tags
- Bed pricing table (general / semi-private / private)
- Emergency badge
- "Best for You" banner (conditional)
- Accordion "View Details":
  - Doctor cards with specialty chips
  - Department list
  - Bed availability bar chart (CSS only)
  - Treatment cost ranges

**FilterBar Component** (inline)
- Toggle chip: Ayushman Eligible
- Multi-select dropdown: Specialty
- Price range slider (HTML range input)
- Sort select: Distance | Rating | Price ↑ | Price ↓

**Recommendation Logic**
- Score each hospital: `score = (1/distance)*0.4 + rating*0.3 + affordability*0.3`
- Top scorer gets "Best for You" badge + amber marker

**Skeleton Loader**
- Show pulsing placeholder cards while `isLoading` is true (500ms simulated delay)

---

### Routing

#### [MODIFY] [App.jsx](file:///e:/HACKATHON/SAIT%20COGNOISE/frontend/src/App.jsx)
- Import `MedicalMigrationMap`
- Add `<Route path="/hospital-map" element={<MedicalMigrationMap />} />`

#### [MODIFY] [RoleSelection.jsx](file:///e:/HACKATHON/SAIT%20COGNOISE/frontend/src/pages/RoleSelection.jsx)
- Add a 4th card "Hospital Map" with map pin icon → navigates to `/hospital-map`

---

## Verification Plan

### Browser Testing
1. Run `npm run dev` in `e:\HACKATHON\SAIT COGNOISE\frontend` (already running)
2. Open browser to `http://localhost:5173/hospital-map`
3. Verify map renders with hospital markers
4. Allow/deny geolocation → map centres correctly in both cases
5. Click a hospital marker → panel slides in with data
6. Toggle "View Details" → accordion expands
7. Apply Ayushman filter → markers update
8. Change sort to "Price ↑" → hospitals reorder in panel list
9. Resize to mobile (375px) → bottom sheet appears, filter bar scrolls

### Manual Checklist
- [x] Map renders without console errors
- [x] Markers visible and clustered when zoomed out
- [x] Hospital panel shows all required fields
- [x] All filters work correctly
- [x] "Best for You" badge appears on exactly one hospital
- [x] No layout breaks on mobile viewport

---

## Status

Plan implemented in:
- `frontend/index.html` (Leaflet + MarkerCluster CDN)
- `frontend/src/utils/hospitalData.js` (dataset + scoring)
- `frontend/src/pages/MedicalMigrationMap.jsx` (map page, filters, clustering, panel, responsive)
- `frontend/src/App.jsx` (route `/hospital-map`)
- `frontend/src/pages/RoleSelection.jsx` (Hospital Map entry card)
