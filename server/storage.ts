import {
  categories,
  products,
  orders,
  orderItems,
  settings,
  type Category,
  type InsertCategory,
  type Product,
  type InsertProduct,
  type Order,
  type OrderItem,
  type Settings,
  type UpdateSettings,
} from "@shared/schema";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, desc, asc, inArray, and, like, or } from "drizzle-orm";

const sqlite = new Database("data.db");
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite);

export interface IStorage {
  // categories
  getCategories(): Promise<Category[]>;
  createCategory(c: InsertCategory): Promise<Category>;
  // products
  getProducts(opts?: {
    category?: string;
    search?: string;
    includeInactive?: boolean;
  }): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  getProductBySku(sku: string): Promise<Product | undefined>;
  getProductsByIds(ids: number[]): Promise<Product[]>;
  createProduct(p: InsertProduct): Promise<Product>;
  updateProduct(id: number, p: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<void>;
  // orders
  getOrders(): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  getOrderByNumber(orderNumber: string): Promise<Order | undefined>;
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  createOrder(
    order: Omit<Order, "id" | "orderNumber">,
    items: Omit<OrderItem, "id" | "orderId">[],
  ): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  // settings
  getSettings(): Promise<Settings>;
  updateSettings(s: Partial<UpdateSettings>): Promise<Settings>;
  // admin stats
  getStats(): Promise<{
    ordersCount: number;
    revenueHalalas: number;
    productsCount: number;
    newOrders: number;
    topProducts: { arName: string; qty: number }[];
  }>;
}

export class DatabaseStorage implements IStorage {
  async getCategories(): Promise<Category[]> {
    return db.select().from(categories).orderBy(asc(categories.sortOrder)).all();
  }

  async createCategory(c: InsertCategory): Promise<Category> {
    return db.insert(categories).values(c).returning().get();
  }

  async getProducts(opts?: {
    category?: string;
    search?: string;
    includeInactive?: boolean;
  }): Promise<Product[]> {
    const conditions = [];
    if (!opts?.includeInactive) conditions.push(eq(products.active, 1));
    if (opts?.category && opts.category !== "all") {
      conditions.push(eq(products.categorySlug, opts.category));
    }
    if (opts?.search) {
      const q = `%${opts.search}%`;
      conditions.push(
        or(
          like(products.arName, q),
          like(products.enName, q),
          like(products.keywords, q),
          like(products.sku, q),
        )!,
      );
    }
    const query = db.select().from(products);
    const rows = conditions.length
      ? await query.where(and(...conditions)).orderBy(asc(products.sortOrder), asc(products.id)).all()
      : await query.orderBy(asc(products.sortOrder), asc(products.id)).all();
    return rows;
  }

  async getProduct(id: number): Promise<Product | undefined> {
    return db.select().from(products).where(eq(products.id, id)).get();
  }

  async getProductBySku(sku: string): Promise<Product | undefined> {
    return db.select().from(products).where(eq(products.sku, sku)).get();
  }

  async getProductsByIds(ids: number[]): Promise<Product[]> {
    if (!ids.length) return [];
    return db.select().from(products).where(inArray(products.id, ids)).all();
  }

  async createProduct(p: InsertProduct): Promise<Product> {
    return db
      .insert(products)
      .values({ ...p, createdAt: Date.now() })
      .returning()
      .get();
  }

  async updateProduct(id: number, p: Partial<InsertProduct>): Promise<Product | undefined> {
    return db.update(products).set(p).where(eq(products.id, id)).returning().get();
  }

  async deleteProduct(id: number): Promise<void> {
    db.delete(products).where(eq(products.id, id)).run();
  }

  async getOrders(): Promise<Order[]> {
    return db.select().from(orders).orderBy(desc(orders.createdAt)).all();
  }

  async getOrder(id: number): Promise<Order | undefined> {
    return db.select().from(orders).where(eq(orders.id, id)).get();
  }

  async getOrderByNumber(orderNumber: string): Promise<Order | undefined> {
    return db.select().from(orders).where(eq(orders.orderNumber, orderNumber)).get();
  }

  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return db.select().from(orderItems).where(eq(orderItems.orderId, orderId)).all();
  }

  async createOrder(
    order: Omit<Order, "id" | "orderNumber">,
    items: Omit<OrderItem, "id" | "orderId">[],
  ): Promise<Order> {
    const orderNumber = `BM-${Date.now().toString(36).toUpperCase()}${Math.floor(
      Math.random() * 90 + 10,
    )}`;
    const created = db
      .insert(orders)
      .values({ ...order, orderNumber })
      .returning()
      .get();
    if (items.length) {
      db.insert(orderItems)
        .values(items.map((i) => ({ ...i, orderId: created.id })))
        .run();
    }
    return created;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    return db.update(orders).set({ status }).where(eq(orders.id, id)).returning().get();
  }

  async getSettings(): Promise<Settings> {
    const row = db.select().from(settings).where(eq(settings.id, 1)).get();
    if (row) return row;
    return db.insert(settings).values({ id: 1 }).returning().get();
  }

  async updateSettings(s: Partial<UpdateSettings>): Promise<Settings> {
    await this.getSettings(); // ensure row exists
    return db.update(settings).set(s).where(eq(settings.id, 1)).returning().get();
  }

  async getStats() {
    const allOrders = db.select().from(orders).all();
    const allProducts = db.select().from(products).all();
    const revenue = allOrders
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + o.totalHalalas, 0);
    const items = db.select().from(orderItems).all();
    const byProduct = new Map<string, number>();
    for (const it of items) {
      byProduct.set(it.arName, (byProduct.get(it.arName) || 0) + it.qty);
    }
    const topProducts = Array.from(byProduct.entries())
      .map(([arName, qty]) => ({ arName, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
    return {
      ordersCount: allOrders.length,
      revenueHalalas: revenue,
      productsCount: allProducts.length,
      newOrders: allOrders.filter((o) => o.status === "new").length,
      topProducts,
    };
  }
}

export const storage = new DatabaseStorage();
