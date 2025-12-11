# Google Maps Migration: @agm/core → @angular/google-maps

## ✅ Package Updated

**Changed**: `@agm/core` → `@angular/google-maps`

**Reason**: `@agm/core` is not maintained and doesn't support Angular 21. `@angular/google-maps` is the official Angular team library.

## ✅ Module Imports Updated

All module imports have been updated:
- ✅ `app.module.ts`
- ✅ `maps.module.ts`
- ✅ `full-pages.module.ts`
- ✅ `rfq.module.ts`

## ⚠️ Template Updates Required

The HTML templates need to be updated from `@agm/core` syntax to `@angular/google-maps` syntax.

### Old Syntax (@agm/core):
```html
<agm-map [latitude]="lat" [longitude]="lng">
  <agm-marker [latitude]="lat" [longitude]="lng"></agm-marker>
</agm-map>
```

### New Syntax (@angular/google-maps):
```html
<google-map
  [center]="{lat: lat, lng: lng}"
  [zoom]="zoom"
  height="400px"
  width="100%">
  <map-marker
    [position]="{lat: lat, lng: lng}"
    [label]="markerLabel"
    [title]="markerTitle">
  </map-marker>
</google-map>
```

## Files That Need Template Updates

1. `src/app/maps/google-map/google-map.component.html`
2. `src/app/maps/full-screen-map/full-screen-map.component.html` (if it uses maps)
3. Any other components using `<agm-map>` or `<agm-marker>`

## Component TypeScript Updates

Update component properties:

### Old (@agm/core):
```typescript
lat: number = 51.678418;
lng: number = 7.809007;
```

### New (@angular/google-maps):
```typescript
center: google.maps.LatLngLiteral = { lat: 51.678418, lng: 7.809007 };
zoom = 12;
```

## Next Steps

1. ✅ Package updated in package.json
2. ✅ Module imports updated
3. ✅ Google Maps script added to index.html
4. ⚠️ **TODO**: Update map component templates
5. ⚠️ **TODO**: Update map component TypeScript files

## Testing

After updating templates:
1. Navigate to map pages
2. Verify maps render correctly
3. Test map interactions (markers, zoom, etc.)

---

*Migration Started: $(Get-Date)*
*Status: Package and imports updated, templates need manual update*
