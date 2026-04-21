# Change Summary: Removed Unsplash API Integration

## Reason for Change
Unsplash's free tier only allows 50 requests/hour, which is insufficient for a catalog of 1000 products. A single search results page could trigger 20+ image requests, quickly exhausting the rate limit.

## What Changed

### Database Schema
**Before:**
```sql
unsplash_query TEXT NOT NULL,   -- e.g. "backpacking tent outdoors"
```

**After:**
```sql
image_url TEXT,                 -- placeholder image URL or path
```

### Product Images Approach
**Before:** Dynamic Unsplash API calls at runtime, with frontend caching

**After:** Use placeholder images. Two options:
1. **Placeholder service** (recommended for simplicity): `https://placehold.co/400x400?text={category}`
2. **Static category images**: Create a few placeholder images per category, reference them in the `image_url` field

### Stack Table Update
**Before:**
```
| Images | Unsplash API | Dynamic image fetch at runtime by search term, cached in frontend |
```

**After:**
```
| Images | Placeholder images | Category-based placeholder images to avoid API rate limits and costs |
```

### Components Removed
- `UnsplashImage.jsx` component (no longer needed)
- `useUnsplash.js` hook (no longer needed)

### Environment Variables Removed
- Frontend: `VITE_UNSPLASH_ACCESS_KEY`
- No Unsplash API key needed anywhere

## Implementation Notes for `generate_catalog.py`

When generating products, set `image_url` based on category:

```python
def get_placeholder_image(category: str) -> str:
    """Return a placeholder image URL for the given category."""
    # Option 1: Use placehold.co
    return f"https://placehold.co/400x400/e2e8f0/475569?text={category.replace('_', '+')}"
    
    # Option 2: Use local static images (if you create them)
    # category_images = {
    #     "tents": "/images/tent-placeholder.jpg",
    #     "sleeping": "/images/sleeping-placeholder.jpg",
    #     "footwear": "/images/footwear-placeholder.jpg",
    #     ...
    # }
    # return category_images.get(category, "/images/default-placeholder.jpg")
```

## What Stays the Same
- All product data fields (name, brand, description, attributes, tags, etc.)
- The archetype generation strategy
- Database structure (except the one field rename)
- Frontend product display (just swap image source)

## Next Steps
1. Update your database schema (if already created) to use `image_url` instead of `unsplash_query`
2. Update `generate_catalog.py` to populate `image_url` with placeholder URLs
3. Frontend components should display `product.image_url` directly — no API calls, no caching logic needed
