import type { Express } from "express";
import type { Server } from "node:http";
import { storage, db } from "./storage";
import { isAdminRequest, issueToken, verifyPassword } from "./auth";
import { insertProductSchema, updateSettingsSchema, orders as ordersTable, orderItems as orderItemsTable, products as productsTable } from "@shared/schema";
import { eq } from "drizzle-orm";

const WHATSAPP_NUMBER = "966546723820"; // fallback only — settings override

function formatSAR(halalas: number): string {
  return (halalas / 100).toFixed(2);
}

function buildWhatsAppMessage(orderData: {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  city: string;
  address: string;
  notes?: string | null;
  items: { arName: string; qty: number; priceHalalas: number }[];
  subtotalHalalas: number;
  vatIncludedHalalas: number;
  shippingHalalas: number;
  totalHalalas: number;
}): string {
  const lines: string[] = [];
  lines.push(`السلام عليكم، طلب جديد من المتجر`);
  lines.push(`رقم الطلب: ${orderData.orderNumber}`);
  lines.push(`الاسم: ${orderData.customerName}`);
  lines.push(`الجوال: ${orderData.customerPhone}`);
  lines.push(`المدينة: ${orderData.city}`);
  lines.push(`العنوان: ${orderData.address}`);
  if (orderData.notes) lines.push(`ملاحظات: ${orderData.notes}`);
  lines.push(`— المنتجات —`);
  for (const item of orderData.items) {
    lines.push(`• ${item.arName} × ${item.qty} = ${formatSAR(item.priceHalalas * item.qty)} ر.س`);
  }
  lines.push(`الإجمالي قبل الشحن: ${formatSAR(orderData.subtotalHalalas)} ر.س`);
  lines.push(`(مضمنة ضريبة القيمة المضافة 15%: ${formatSAR(orderData.vatIncludedHalalas)} ر.س)`);
  lines.push(`رسوم الشحن: ${formatSAR(orderData.shippingHalalas)} ر.س`);
  lines.push(`الإجمالي النهائي: ${formatSAR(orderData.totalHalalas)} ر.س`);
  return lines.join("\n");
}

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  /* ---------------- Public: catalog ---------------- */

  app.get("/api/products", async (req, res) => {
    const { category, search } = req.query;
    const rows = await storage.getProducts({
      category: typeof category === "string" ? category : undefined,
      search: typeof search === "string" && search.trim() ? search.trim() : undefined,
    });
    res.json(rows);
  });

  app.get("/api/categories", async (_req, res) => {
    const rows = await storage.getCategories();
    res.json(rows);
  });

  app.get("/api/products/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "معرّف غير صالح" });
    const product = await storage.getProduct(id);
    if (!product || !product.active) return res.status(404).json({ error: "المنتج غير موجود" });
    res.json(product);
  });

  app.get("/api/settings", async (_req, res) => {
    const s = await storage.getSettings();
    res.json(s);
  });

  /* ---------------- Public: orders ---------------- */
  // Prices are ALWAYS computed server-side from the database.
  // The client only sends [{productId, qty}] — never prices.

  app.post("/api/orders", async (req, res) => {
    const customer = req.body?.customer ?? {};
    // Explicit server-side validation of customer fields
    const name = String(customer.customerName ?? "").trim();
    const phone = String(customer.customerPhone ?? "").replace(/[\s-]/g, "");
    const city = String(customer.city ?? "").trim();
    const address = String(customer.address ?? "").trim();
    const notes = customer.notes ? String(customer.notes).trim() : null;
    if (!name || name.length > 100) {
      return res.status(400).json({ error: "الاسم مطلوب" });
    }
    if (!/^05\d{8}$/.test(phone)) {
      return res.status(400).json({ error: "أدخل رقم جوال سعودي صحيح (05xxxxxxxx)" });
    }
    if (!city || !address) {
      return res.status(400).json({ error: "المدينة والعنوان مطلوبان" });
    }

    const rawItems = req.body?.items;
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return res.status(400).json({ error: "السلة فارغة" });
    }
    // Validate item shape
    for (const it of rawItems) {
      if (
        typeof it !== "object" ||
        !Number.isInteger(Number(it.productId)) ||
        !Number.isInteger(Number(it.qty)) ||
        Number(it.qty) < 1 ||
        Number(it.qty) > 99
      ) {
        return res.status(400).json({ error: "عناصر السلة غير صالحة" });
      }
    }

    // Aggregate duplicate product lines before validation
    const aggregated = new Map<number, number>();
    for (const it of rawItems) {
      const id = Number(it.productId);
      aggregated.set(id, Math.min(99, (aggregated.get(id) ?? 0) + Number(it.qty)));
    }

    const settings = await storage.getSettings();
    const vatRate = parseFloat(settings.vatRate) || 0;
    const shippingFeeHalalas = settings.shippingFeeHalalas;

    // Load products from DB (trusted source of prices) and check stock
    const ids = Array.from(aggregated.keys());
    const products = await storage.getProductsByIds(ids);
    const byId = new Map(products.map((p) => [p.id, p]));

    let subtotalHalalas = 0;
    const orderItems: { productId: number; arName: string; priceHalalas: number; qty: number }[] = [];
    const stockUpdates: { id: number; stock: number }[] = [];
    for (const [id, qty] of Array.from(aggregated.entries())) {
      const p = byId.get(id);
      if (!p || !p.active) {
        return res.status(400).json({ error: "أحد المنتجات غير متوفر حاليًا" });
      }
      if (p.stock < qty) {
        return res.status(400).json({ error: `الكمية المطلوبة من «${p.arName}» غير متوفرة` });
      }
      subtotalHalalas += p.priceHalalas * qty;
      orderItems.push({ productId: p.id, arName: p.arName, priceHalalas: p.priceHalalas, qty });
      stockUpdates.push({ id: p.id, stock: p.stock - qty });
    }

    const vatIncludedHalalas = subtotalHalalas - Math.round(subtotalHalalas / (1 + vatRate));
    const shippingHalalas = subtotalHalalas > 0 ? shippingFeeHalalas : 0;
    const totalHalalas = subtotalHalalas + shippingHalalas;

    // Atomic: order + items + stock decrement in one transaction
    const order = db.transaction(() => {
      const orderNumber = `BM-${Date.now().toString(36).toUpperCase()}${Math.floor(
        Math.random() * 90 + 10,
      )}`;
      const created = db
        .insert(ordersTable)
        .values({
          orderNumber,
          customerName: name,
          customerPhone: phone,
          city,
          address,
          notes,
          subtotalHalalas,
          vatIncludedHalalas,
          shippingHalalas,
          totalHalalas,
          status: "new",
          createdAt: Date.now(),
        })
        .returning()
        .get();
      if (orderItems.length) {
        db.insert(orderItemsTable)
          .values(orderItems.map((i) => ({ ...i, orderId: created.id })))
          .run();
      }
      for (const su of stockUpdates) {
        db.update(productsTable).set({ stock: su.stock }).where(eq(productsTable.id, su.id)).run();
      }
      return created;
    });

    const message = buildWhatsAppMessage({
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      city: order.city,
      address: order.address,
      notes: order.notes,
      items: orderItems,
      subtotalHalalas,
      vatIncludedHalalas,
      shippingHalalas,
      totalHalalas,
    });
    const whatsappUrl = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(message)}`;

    res.status(201).json({ order, whatsappUrl });
  });

  /* ---------------- Admin: auth ---------------- */

  app.post("/api/admin/login", async (req, res) => {
    const { password } = req.body || {};
    if (typeof password !== "string" || !verifyPassword(password)) {
      return res.status(401).json({ error: "كلمة المرور غير صحيحة" });
    }
    res.json({ token: issueToken() });
  });

  /* ---------------- Admin: orders ---------------- */

  app.get("/api/admin/orders", async (req, res) => {
    if (!isAdminRequest(req)) return res.status(401).json({ error: "غير مصرح" });
    const rows = await storage.getOrders();
    const withItems = await Promise.all(
      rows.map(async (o) => ({ ...o, items: await storage.getOrderItems(o.id) })),
    );
    res.json(withItems);
  });

  app.patch("/api/admin/orders/:id/status", async (req, res) => {
    if (!isAdminRequest(req)) return res.status(401).json({ error: "غير مصرح" });
    const id = Number(req.params.id);
    const { status } = req.body || {};
    const valid = ["new", "confirmed", "shipped", "delivered", "cancelled"];
    if (!valid.includes(status)) return res.status(400).json({ error: "حالة غير صالحة" });
    const updated = await storage.updateOrderStatus(id, status);
    if (!updated) return res.status(404).json({ error: "الطلب غير موجود" });
    res.json(updated);
  });

  /* ---------------- Admin: products ---------------- */

  app.get("/api/admin/products", async (req, res) => {
    if (!isAdminRequest(req)) return res.status(401).json({ error: "غير مصرح" });
    const rows = await storage.getProducts({ includeInactive: true });
    res.json(rows);
  });

  app.post("/api/admin/products", async (req, res) => {
    if (!isAdminRequest(req)) return res.status(401).json({ error: "غير مصرح" });
    const parsed = insertProductSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "بيانات المنتج غير صالحة", details: parsed.error });
    }
    const existing = await storage.getProductBySku(parsed.data.sku);
    if (existing) return res.status(409).json({ error: "رقم المنتج (SKU) موجود مسبقًا" });
    const created = await storage.createProduct(parsed.data);
    res.status(201).json(created);
  });

  app.patch("/api/admin/products/:id", async (req, res) => {
    if (!isAdminRequest(req)) return res.status(401).json({ error: "غير مصرح" });
    const id = Number(req.params.id);
    const parsed = insertProductSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "بيانات المنتج غير صالحة", details: parsed.error });
    }
    const updated = await storage.updateProduct(id, parsed.data);
    if (!updated) return res.status(404).json({ error: "المنتج غير موجود" });
    res.json(updated);
  });

  app.delete("/api/admin/products/:id", async (req, res) => {
    if (!isAdminRequest(req)) return res.status(401).json({ error: "غير مصرح" });
    const id = Number(req.params.id);
    await storage.deleteProduct(id);
    res.json({ ok: true });
  });

  /* ---------------- Admin: settings & stats ---------------- */

  app.get("/api/admin/stats", async (req, res) => {
    if (!isAdminRequest(req)) return res.status(401).json({ error: "غير مصرح" });
    const stats = await storage.getStats();
    res.json(stats);
  });

  app.patch("/api/admin/settings", async (req, res) => {
    if (!isAdminRequest(req)) return res.status(401).json({ error: "غير مصرح" });
    const parsed = updateSettingsSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "الإعدادات غير صالحة", details: parsed.error });
    }
    const updated = await storage.updateSettings(parsed.data);
    res.json(updated);
  });

  return httpServer;
}
