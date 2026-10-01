# Interactive Product Configurator — 10×10 Canopy Tent

Working replica of a logo canopy tent configurator (inspired by [MVP Visuals](https://mvpvisuals.com/pages/logo-canopy-tent-configurator)), built as a technical test deliverable.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

| Route | Purpose |
| --- | --- |
| `/` | Full configurator |
| `/embed` | iframe-friendly shell (same engine, postMessage bridge) |

```bash
npm run build    # production build
npm run preview  # preview build locally
```

## What it does

- Independent customization of canopy, valances, and walls (color, text, image upload, drag/scale/rotate)
- **2D Konva editor** and **3D Three.js preview** sharing one Zustand config store (changes sync both ways)
- Structured `TentConfig` JSON as the single source of truth
- Dynamic pricing via a **pricing service** (UI never hard-codes dollar amounts)
- Mock **Shopify add-to-cart** that returns a line-item + properties payload
- **Configuration PDF** with selections, branding inventory, quote, and preview snapshots
- Responsive layout; reusable product-definition layer for other configurators

## Architecture

```
src/
  core/           types, Zustand store, iframe postMessage bridge
  products/       product-specific definitions (canopy-tent/)
  services/       PricingService + ShopifyCartAdapter (mock implementations)
  components/     UI: OptionsPanel, Editor2D, Preview3D, PriceSummary, Configurator
  utils/          section canvas compositor, PDF generator
public/models/    GLB assets (Tent_8_8 used as 10×10 stand-in)
```

### Data flow

1. User edits options / 2D elements → `useConfigStore` updates `TentConfig`
2. `Editor2D` and `Preview3D` both subscribe to the same store
3. Section fill + elements are composited to a canvas (`renderSectionToCanvas`) and applied as textures / procedural fallback mesh materials in 3D
4. Debounced calls to `pricingService.quote(config)` refresh the price summary
5. Add to cart → `shopifyCart.addToCart(config, quote)` → mock checkout payload (+ `postMessage` when embedded)
6. PDF export serializes config + quote + canvas snapshots

### Reusability

Adding another product:

1. Create `src/products/<name>/definition.ts` with sections, setup options, model URL
2. Register a default config factory
3. Point the store / Configurator at that definition

Core types (`DesignElement`, pricing/Shopify interfaces, embed bridge) stay unchanged.

## Pricing & Shopify integration approach

### Pricing

- Interface: `PricingService.quote(TentConfig) → PriceQuote`
- Mock: `MockPricingService` in `src/services/pricing.ts` with SKU catalog (base setup, wall variants, branding line)
- To connect a real CRM/Shopify Functions / custom pricing API: implement `PricingService` with `fetch('/api/pricing/quote', { method: 'POST', body: JSON.stringify(config) })` and inject it instead of the mock

### Shopify

- Interface: `ShopifyCartAdapter.addToCart(config, quote) → ShopifyCartPayload`
- Mock returns:
  - `variantId` (GID-shaped)
  - `properties` including `_configId`, wall summary, quoted total, truncated `_configJson`
  - a fake `checkoutUrl`
- Production swap options:
  - **Ajax Cart / Cart API**: `POST /cart/add.js` with `properties`
  - **Storefront API**: `cartCreate` / `cartLinesAdd` with merchandise + attributes
  - Attach generated PDF to the order via Admin API (metafield or order note / file)

## iframe embed

```html
<iframe
  id="tent-config"
  src="https://your-host.example/embed"
  style="width:100%;height:800px;border:0"
  allow="clipboard-write"
></iframe>
<script>
  const frame = document.getElementById('tent-config')
  window.addEventListener('message', (e) => {
    if (e.data?.channel !== 'tent-configurator') return
    if (e.data.type === 'tent:ready') console.log('ready')
    if (e.data.type === 'tent:configChanged') console.log(e.data.config)
    if (e.data.type === 'tent:addToCart') {
      // forward e.data.payload to your Shopify cart
    }
  })
  // Request current config:
  // frame.contentWindow.postMessage({ channel: 'tent-configurator', type: 'tent:getConfig' }, '*')
</script>
```

## 3D notes

Bundled GLBs live under `public/models/` (sourced from `/glb`). `tent.glb` (`Tent_8_8.glb`) is the primary preview model. Mesh-name heuristics map materials to sections; if naming does not match, an ErrorBoundary falls back to a procedural tent so the configurator remains usable.

## Live demo

Deploy the Vite `dist/` output to any static host (Vercel, Netlify, GitHub Pages):

```bash
npm run build
# deploy dist/
```

Vercel: import the repo, framework preset Vite, output `dist`.

## Evaluation mapping

| Criterion | Where |
| --- | --- |
| Code quality / TS | Strict typings across config + services |
| Architecture / scalability | `core` vs `products` vs `services` |
| 2D/3D sync | Shared Zustand store + canvas compositor |
| API integration | `PricingService` interface + mock |
| Shopify approach | Cart adapter + line-item properties |
| Dynamic pricing | Catalog in service layer only |
| Config structure | `TentConfig` JSON |
| Performance | Debounced quotes, texture cache, Suspense |
| Reusability | Product definition registry pattern |
| PDF | `src/utils/pdf.ts` |
| iframe | `/embed` + `src/core/embed.ts` |

## License

Technical test / demo project. Product imagery and brand references are for evaluation only.
