import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import type * as z from "zod/mini";

/* ============================ Categories ============================ */

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  arName: text("ar_name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  slug: true,
  arName: true,
  sortOrder: true,
});

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

/* ============================ Products ============================ */
// Prices are stored in halalas (1 SAR = 100 halalas) to avoid float issues.

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sku: text("sku").notNull().unique(), // Forever Living item number, e.g. "815"
  arName: text("ar_name").notNull(),
  enName: text("en_name").notNull(),
  priceHalalas: integer("price_halalas").notNull(),
  categorySlug: text("category_slug").notNull(),
  image: text("image").notNull(), // e.g. "815.svg" served from /products/
  keywords: text("keywords").notNull().default("[]"), // JSON array of search keywords
  description: text("description"),
  stock: integer("stock").notNull().default(100),
  featured: integer("featured").notNull().default(0),
  active: integer("active").notNull().default(1),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at").notNull().default(0),
});

export const insertProductSchema = createInsertSchema(products).pick({
  sku: true,
  arName: true,
  enName: true,
  priceHalalas: true,
  categorySlug: true,
  image: true,
  keywords: true,
  description: true,
  stock: true,
  featured: true,
  active: true,
  sortOrder: true,
});

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

/* ============================ Orders ============================ */

export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderNumber: text("order_number").notNull().unique(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  city: text("city").notNull(),
  address: text("address").notNull(),
  notes: text("notes"),
  subtotalHalalas: integer("subtotal_halalas").notNull(),
  vatIncludedHalalas: integer("vat_included_halalas").notNull(), // VAT portion already included in subtotal
  shippingHalalas: integer("shipping_halalas").notNull(),
  totalHalalas: integer("total_halalas").notNull(),
  status: text("status").notNull().default("new"), // new | confirmed | shipped | delivered | cancelled
  createdAt: integer("created_at").notNull(),
});

export const insertOrderSchema = createInsertSchema(orders).pick({
  customerName: true,
  customerPhone: true,
  city: true,
  address: true,
  notes: true,
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull(),
  productId: integer("product_id"),
  arName: text("ar_name").notNull(), // snapshot
  priceHalalas: integer("price_halalas").notNull(), // snapshot
  qty: integer("qty").notNull(),
});

export type OrderItem = typeof orderItems.$inferSelect;

/* ============================ Settings ============================ */

export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey(),
  storeName: text("store_name").notNull().default("متجر د. محمد النبهاني"),
  ownerName: text("owner_name").notNull().default("د. محمد النبهاني"),
  whatsappNumber: text("whatsapp_number").notNull().default("966546723820"),
  contactEmail: text("contact_email").notNull().default("drmuhammed.najeeb2020@gmail.com"),
  sponsorId: text("sponsor_id").notNull().default("971001726361"),
  vatRate: text("vat_rate").notNull().default("0.15"),
  shippingFeeHalalas: integer("shipping_fee_halalas").notNull().default(3000),
  registerUrl: text("register_url")
    .notNull()
    .default("https://foreverliving.com/join/sau/en-us/checkout/personalinfo"),
  primaryColor: text("primary_color").notNull().default("#24523f"),
  accentColor: text("accent_color").notNull().default("#b47d1f"),
  promoTitle: text("promo_title").notNull().default("قوة الصبار الطبيعية"),
  promoText: text("promo_text")
    .notNull()
    .default(
      "للصبار فوائد قوية تساعدك على أن تبدو وتشعر بأفضل حال من الداخل والخارج. منتجاتنا المعتمدة من IASC مصنوعة من جل الصبار الداخلي النقي.",
    ),
});

export const updateSettingsSchema = createInsertSchema(settings).pick({
  storeName: true,
  ownerName: true,
  whatsappNumber: true,
  contactEmail: true,
  sponsorId: true,
  vatRate: true,
  shippingFeeHalalas: true,
  registerUrl: true,
  primaryColor: true,
  accentColor: true,
  promoTitle: true,
  promoText: true,
});

export type UpdateSettings = z.infer<typeof updateSettingsSchema>;
export type Settings = typeof settings.$inferSelect;
