import asyncio
import json
import os
import random
import re
from collections import Counter
from pathlib import Path

import asyncpg
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

ARCHETYPES_PATH = Path(__file__).parent.parent.parent / "data" / "archetypes.json"
PRODUCTS_PER_ARCHETYPE = 59

# Strip unit suffixes so e.g. weight_lbs → weight, temp_rating_f → temp_rating
SUFFIX_RE = re.compile(
    r"_(lbs|oz_pair|oz|sqft|mm|f|in|m|hrs|min|pct|g|lpm|micron|L|cm|gsm)$"
)


def resolve_attr(value):
    """List of 2 numbers → random value in range. List of anything else → random choice."""
    if isinstance(value, list):
        if len(value) == 2 and all(isinstance(v, (int, float)) for v in value):
            lo, hi = value
            if isinstance(lo, float) or isinstance(hi, float):
                return round(random.uniform(lo, hi), 1)
            return random.randint(int(lo), int(hi))
        return random.choice(value)
    return value


def build_vars(archetype, attrs, brand, series, capacity, use_case, extra_detail, special):
    """Combine all resolved values into a single dict for str.format_map()."""
    vars_ = {}
    for key, val in attrs.items():
        vars_[key] = val
        stripped = SUFFIX_RE.sub("", key)
        if stripped != key:
            vars_[stripped] = val
    if "seasons" in vars_:
        vars_["season"] = vars_["seasons"]
    vars_.update({"brand": brand, "series": series, "use_case": use_case, "extra_detail": extra_detail})
    if capacity is not None:
        vars_["capacity"] = capacity
    vars_.update(special)
    return vars_


def generate_products(archetype: dict, count: int) -> list[dict]:
    # Top-level *_details lists (e.g. wind_details → provides wind_detail in template)
    special_lists = {
        key[:-1]: val  # strip trailing 's' to get singular template key
        for key, val in archetype.items()
        if key.endswith("_details") and key != "extra_details" and isinstance(val, list)
    }

    products = []
    for _ in range(count):
        attrs = {k: resolve_attr(v) for k, v in archetype.get("attribute_ranges", {}).items()}
        brand = random.choice(archetype["brands"])
        series = random.choice(archetype["series_names"])
        name_pattern = random.choice(archetype["name_patterns"])
        use_case = random.choice(archetype["use_case_pool"])
        extra_detail = random.choice(archetype["extra_details"])
        special = {k: random.choice(v) for k, v in special_lists.items()}

        capacity = None
        if "capacity_range" in archetype:
            lo, hi = archetype["capacity_range"]
            capacity = random.randint(lo, hi)

        tvars = build_vars(archetype, attrs, brand, series, capacity, use_case, extra_detail, special)

        try:
            name = name_pattern.format_map(tvars)
        except KeyError:
            name = f"{brand} {series} {archetype['archetype'].replace('_', ' ').title()}"

        tvars["name"] = name
        description = archetype["description_template"].format_map(tvars)

        tags = random.sample(archetype["tag_pool"], k=random.randint(3, min(6, len(archetype["tag_pool"]))))
        price = round(random.uniform(*archetype["price_range"]), 2)

        products.append({
            "name": name,
            "brand": brand,
            "category": archetype["category"],
            "subcategory": archetype.get("subcategory"),
            "price": price,
            "description": description,
            "attributes": attrs,
            "tags": tags,
            "unsplash_query": archetype["unsplash_query"],
        })

    return products


async def main():
    archetypes = json.loads(ARCHETYPES_PATH.read_text())

    all_products = []
    for archetype in archetypes:
        products = generate_products(archetype, PRODUCTS_PER_ARCHETYPE)
        all_products.extend(products)
        print(f"  {archetype['archetype']}: {len(products)}")

    print(f"\nTotal: {len(all_products)} products — inserting into Neon...")

    raw_url = os.environ["DATABASE_URL"].replace("postgresql+asyncpg://", "postgresql://")
    conn = await asyncpg.connect(raw_url, ssl="require")
    try:
        await conn.executemany(
            """
            INSERT INTO products
                (name, brand, category, subcategory, price, description, attributes, tags, unsplash_query)
            VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9)
            """,
            [
                (
                    p["name"], p["brand"], p["category"], p["subcategory"],
                    p["price"], p["description"], json.dumps(p["attributes"]),
                    p["tags"], p["unsplash_query"],
                )
                for p in all_products
            ],
        )
    finally:
        await conn.close()

    counts = Counter(p["category"] for p in all_products)
    print("\nBy category:")
    for cat, n in sorted(counts.items()):
        print(f"  {cat}: {n}")
    print(f"\nDone. {len(all_products)} products inserted.")


if __name__ == "__main__":
    asyncio.run(main())
