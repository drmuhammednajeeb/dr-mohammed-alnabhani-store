import { storage } from "../server/storage";
import { db } from "../server/storage";
import { categories, products, settings } from "@shared/schema";
import fs from "node:fs";
import path from "node:path";

interface SourceProduct {
  id: number;
  arName: string;
  enName: string;
  price: number;
  img: string;
  category: string;
  keywords: string[];
}

const CATEGORY_DEFS = [
  { slug: "drinks", arName: "عصير الصبار", sortOrder: 1 },
  { slug: "supplements", arName: "المكملات", sortOrder: 2 },
  { slug: "care", arName: "العناية بالشعر والبشرة", sortOrder: 3 },
  { slug: "personal-care", arName: "العناية الشخصية", sortOrder: 4 },
  { slug: "weight", arName: "التخسيس ونزول الوزن", sortOrder: 5 },
  { slug: "packs", arName: "المجموعات", sortOrder: 6 },
];

async function main() {
  // 1. Seed settings singleton
  const existingSettings = db.select().from(settings).all();
  if (!existingSettings.length) {
    db.insert(settings).values({ id: 1 }).run();
    console.log("✔ settings seeded");
  } else {
    console.log("• settings already present");
  }

  // 2. Seed categories
  const existingCats = db.select().from(categories).all();
  const haveCats = new Set(existingCats.map((c) => c.slug));
  for (const cat of CATEGORY_DEFS) {
    if (!haveCats.has(cat.slug)) {
      db.insert(categories).values(cat).run();
      console.log(`✔ category seeded: ${cat.arName}`);
    }
  }

  // 3. Seed products from extracted source data (lossless)
  const existingProducts = db.select().from(products).all();
  if (existingProducts.length > 0) {
    console.log(`• products already present (${existingProducts.length}) — skipping`);
    return;
  }

  const dataPath = path.resolve(process.cwd(), "data/products.json");
  const sourceProducts: SourceProduct[] = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  console.log(`seeding ${sourceProducts.length} products from data/products.json …`);

  for (const p of sourceProducts) {
    const sku = p.img.replace(/\.(webp|png|jpg|jpeg)$/i, "");
    const image = `${sku}.svg`;
    const featured = p.id === 1 || p.category === "packs" ? 1 : 0;
    db.insert(products)
      .values({
        sku,
        arName: p.arName,
        enName: p.enName,
        priceHalalas: Math.round(p.price * 100), // SAR → halalas
        categorySlug: p.category,
        image,
        keywords: JSON.stringify(p.keywords),
        stock: 100,
        featured,
        active: 1,
        sortOrder: p.id,
        createdAt: Date.now(),
      })
      .run();
  }
  console.log(`✔ ${sourceProducts.length} products seeded`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
