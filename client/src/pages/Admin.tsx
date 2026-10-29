import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  type ProductDto,
  type SettingsDto,
  formatSAR,
  statusArName,
  ORDER_STATUSES,
  CATEGORIES,
} from "@/lib/store";
import { apiRequest } from "@/lib/queryClient";
import { safeStorage, adminSession } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import {
  LayoutDashboard, Package, ClipboardList, Settings2, LogOut, Plus, Pencil, Trash2,
} from "lucide-react";

interface AdminOrder {
  id: number;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  city: string;
  address: string;
  notes: string | null;
  subtotalHalalas: number;
  shippingHalalas: number;
  totalHalalas: number;
  status: string;
  createdAt: number;
  items: { id: number; arName: string; qty: number; priceHalalas: number }[];
}

interface Stats {
  ordersCount: number;
  revenueHalalas: number;
  productsCount: number;
  newOrders: number;
  topProducts: { arName: string; qty: number }[];
}

type Tab = "dashboard" | "orders" | "products" | "settings";

function adminAuthHeaders(): Record<string, string> {
  const token = adminSession.token ?? safeStorage.get("bm_admin_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Fetch wrapper for admin GET queries — attaches Bearer token and handles API_BASE rewrite. */
async function adminQuery<T>(queryKey: string[]): Promise<T> {
  const API_BASE = "__PORT_5000__".startsWith("__") ? "" : "__PORT_5000__";
  const res = await fetch(`${API_BASE}${queryKey.join("/")}`, {
    headers: adminAuthHeaders(),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/** Authenticated mutation helper — handles API_BASE rewrite + Bearer token. */
async function adminMutate<T>(
  method: "POST" | "PATCH" | "DELETE",
  url: string,
  body?: unknown,
): Promise<T> {
  const API_BASE = "__PORT_5000__".startsWith("__") ? "" : "__PORT_5000__";
  const res = await fetch(`${API_BASE}${url}`, {
    method,
    headers: { "Content-Type": "application/json", ...adminAuthHeaders() },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export default function Admin() {
  const [token, setToken] = useState<string | null>(
    adminSession.token ?? safeStorage.get("bm_admin_token"),
  );
  const [tab, setTab] = useState<Tab>("dashboard");

  if (!token) {
    return (
      <AdminLogin
        onLogin={(t) => {
          adminSession.token = t;
          safeStorage.set("bm_admin_token", t);
          setToken(t);
        }}
      />
    );
  }

  const logout = () => {
    adminSession.token = null;
    safeStorage.set("bm_admin_token", "");
    setToken(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">لوحة التحكم</h1>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive transition-colors"
        >
          <LogOut className="w-4 h-4" />
          تسجيل الخروج
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 mb-6 bg-secondary rounded-xl p-1 w-fit">
        {[
          { key: "dashboard", label: "الرئيسية", icon: LayoutDashboard },
          { key: "orders", label: "الطلبات", icon: ClipboardList },
          { key: "products", label: "المنتجات", icon: Package },
          { key: "settings", label: "الإعدادات", icon: Settings2 },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as Tab)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              tab === t.key ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
            data-testid={`button-admin-tab-${t.key}`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "dashboard" && <AdminDashboard />}
      {tab === "orders" && <AdminOrders />}
      {tab === "products" && <AdminProducts />}
      {tab === "settings" && <AdminSettings />}
    </div>
  );
}

/* ---------------- Login ---------------- */

function AdminLogin({ onLogin }: { onLogin: (token: string) => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { toast } = useToast();

  const login = useMutation({
    mutationFn: async () => {
      const API_BASE = "__PORT_5000__".startsWith("__") ? "" : "__PORT_5000__";
      const res = await fetch(`${API_BASE}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "كلمة المرور غير صحيحة");
      }
      return res.json();
    },
    onSuccess: (data: { token: string }) => {
      onLogin(data.token);
      toast({ title: "مرحبًا بك في لوحة التحكم" });
    },
    onError: (err: Error) => setError(err.message),
  });

  return (
    <div className="max-w-sm mx-auto px-4 py-20">
      <div className="bg-card border border-card-border rounded-2xl p-6">
        <h1 className="text-lg font-bold mb-1 text-center">لوحة التحكم</h1>
        <p className="text-xs text-muted-foreground text-center mb-5">أدخل كلمة مرور المدير للمتابعة</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError("");
            login.mutate();
          }}
          className="space-y-4"
        >
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="كلمة المرور"
            className="w-full bg-background border border-input rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            data-testid="input-admin-password"
          />
          {error && <div className="text-xs text-destructive text-center">{error}</div>}
          <button
            type="submit"
            disabled={login.isPending}
            className="w-full bg-primary text-primary-foreground font-bold rounded-xl py-2.5 hover:bg-primary/90 disabled:opacity-50 transition-colors"
            data-testid="button-admin-login"
          >
            {login.isPending ? "جارٍ التحقق…" : "دخول"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ---------------- Dashboard ---------------- */

function AdminDashboard() {
  const { data: stats } = useQuery<Stats>({
    queryKey: ["/api/admin/stats"],
    queryFn: () => adminQuery<Stats>(["/api/admin/stats"]),
    refetchInterval: 10000,
  });
  const { data: orders } = useQuery<AdminOrder[]>({
    queryKey: ["/api/admin/orders"],
    queryFn: () => adminQuery<AdminOrder[]>(["/api/admin/orders"]),
    refetchInterval: 10000,
  });

  const cards = [
    { label: "إجمالي الطلبات", value: stats?.ordersCount ?? 0 },
    { label: "طلبات جديدة", value: stats?.newOrders ?? 0 },
    { label: "الإيرادات", value: `${formatSAR(stats?.revenueHalalas ?? 0)} ر.س` },
    { label: "عدد المنتجات", value: stats?.productsCount ?? 0 },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {cards.map((c) => (
          <div key={c.label} className="bg-card border border-card-border rounded-2xl p-4">
            <div className="text-xs text-muted-foreground mb-1">{c.label}</div>
            <div className="text-xl font-bold" data-testid={`text-stat-${c.label}`}>
              {c.value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-card border border-card-border rounded-2xl p-5">
          <h3 className="font-bold mb-3 text-sm">الأكثر مبيعًا</h3>
          {stats?.topProducts.length ? (
            <ul className="space-y-2">
              {stats.topProducts.map((p, i) => (
                <li key={p.arName} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    {p.arName}
                  </span>
                  <span className="font-bold">{p.qty} قطعة</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">لا توجد مبيعات بعد</p>
          )}
        </div>
        <div className="bg-card border border-card-border rounded-2xl p-5">
          <h3 className="font-bold mb-3 text-sm">أحدث الطلبات</h3>
          {orders?.length ? (
            <ul className="space-y-2">
              {orders.slice(0, 5).map((o) => (
                <li key={o.id} className="flex items-center justify-between text-sm">
                  <span className="font-mono text-xs">{o.orderNumber}</span>
                  <span className="text-muted-foreground">{o.customerName}</span>
                  <span className="font-bold">{formatSAR(o.totalHalalas)} ر.س</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">لا توجد طلبات بعد</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Orders ---------------- */

function AdminOrders() {
  const queryClient = useQueryClient();
  const { data: orders, isLoading } = useQuery<AdminOrder[]>({
    queryKey: ["/api/admin/orders"],
    queryFn: () => adminQuery<AdminOrder[]>(["/api/admin/orders"]),
    refetchInterval: 10000,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      adminMutate(`PATCH`, `/api/admin/orders/${id}/status`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] }),
  });

  if (isLoading) return <div className="text-sm text-muted-foreground">جارٍ التحميل…</div>;

  if (!orders?.length) {
    return <div className="text-sm text-muted-foreground py-10 text-center">لا توجد طلبات بعد</div>;
  }

  return (
    <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary text-xs text-muted-foreground">
              <th className="p-3 text-start font-semibold">رقم الطلب</th>
              <th className="p-3 text-start font-semibold">العميل</th>
              <th className="p-3 text-start font-semibold">المدينة</th>
              <th className="p-3 text-start font-semibold">المنتجات</th>
              <th className="p-3 text-start font-semibold">الإجمالي</th>
              <th className="p-3 text-start font-semibold">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-border">
                <td className="p-3 font-mono text-xs">{o.orderNumber}</td>
                <td className="p-3">
                  <div className="font-semibold">{o.customerName}</div>
                  <div className="text-xs text-muted-foreground" dir="ltr">{o.customerPhone}</div>
                </td>
                <td className="p-3">{o.city}</td>
                <td className="p-3 text-xs text-muted-foreground">
                  {o.items.map((i) => `${i.arName} × ${i.qty}`).join("، ")}
                </td>
                <td className="p-3 font-bold whitespace-nowrap">{formatSAR(o.totalHalalas)} ر.س</td>
                <td className="p-3">
                  <select
                    value={o.status}
                    onChange={(e) => statusMutation.mutate({ id: o.id, status: e.target.value })}
                    className="bg-background border border-input rounded-lg py-1 px-2 text-xs"
                    data-testid={`select-order-status-${o.id}`}
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{s.arName}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- Products ---------------- */

interface ProductForm {
  id?: number;
  sku: string;
  arName: string;
  enName: string;
  price: string; // SAR
  categorySlug: string;
  stock: string;
  keywords: string;
  image: string;
  featured?: number;
  active?: number;
  sortOrder?: number;
}

const emptyForm: ProductForm = {
  sku: "", arName: "", enName: "", price: "", categorySlug: "care", stock: "100", keywords: "", image: "",
};

function AdminProducts() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editing, setEditing] = useState<ProductForm | null>(null);

  const { data: products, isLoading } = useQuery<ProductDto[]>({
    queryKey: ["/api/admin/products"],
    queryFn: () => adminQuery<ProductDto[]>(["/api/admin/products"]),
  });

  const saveMutation = useMutation({
    mutationFn: (form: ProductForm) => {
      const payload = {
        sku: form.sku.trim(),
        arName: form.arName.trim(),
        enName: form.enName.trim(),
        priceHalalas: Math.round(parseFloat(form.price) * 100),
        categorySlug: form.categorySlug,
        stock: parseInt(form.stock) || 0,
        keywords: JSON.stringify(
          form.keywords.split(",").map((k) => k.trim()).filter(Boolean),
        ),
        image: form.image.trim() || `${form.sku.trim()}.svg`,
        active: form.active ?? 1,
        featured: form.featured ?? 0,
        sortOrder: form.sortOrder ?? 999,
      };
      return adminMutate(
        form.id ? "PATCH" : "POST",
        form.id ? `/api/admin/products/${form.id}` : "/api/admin/products",
        payload,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setEditing(null);
      toast({ title: "تم حفظ المنتج بنجاح" });
    },
    onError: (err: Error) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminMutate("DELETE", `/api/admin/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "تم حذف المنتج" });
    },
  });

  if (isLoading) return <div className="text-sm text-muted-foreground">جارٍ التحميل…</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-muted-foreground">{products?.length ?? 0} منتج</div>
        <button
          onClick={() => setEditing({ ...emptyForm })}
          className="flex items-center gap-1.5 bg-primary text-primary-foreground text-sm font-bold rounded-xl px-4 py-2 hover:bg-primary/90 transition-colors"
          data-testid="button-add-product"
        >
          <Plus className="w-4 h-4" />
          إضافة منتج
        </button>
      </div>

      {/* Edit dialog */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-card border border-card-border rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold mb-4">{editing.id ? "تعديل المنتج" : "إضافة منتج جديد"}</h3>
            <div className="space-y-3">
              <input
                value={editing.sku}
                onChange={(e) => setEditing({ ...editing, sku: e.target.value })}
                placeholder="رقم المنتج SKU (مثال: 0)"
                className="w-full bg-background border border-input rounded-xl py-2.5 px-4 text-sm"
                data-testid="input-product-sku"
              />
              <input
                value={editing.arName}
                onChange={(e) => setEditing({ ...editing, arName: e.target.value })}
                placeholder="اسم المنتج بالعربية"
                className="w-full bg-background border border-input rounded-xl py-2.5 px-4 text-sm"
                data-testid="input-product-arname"
              />
              <input
                value={editing.enName}
                onChange={(e) => setEditing({ ...editing, enName: e.target.value })}
                placeholder="اسم المنتج بالإنجليزية"
                className="w-full bg-background border border-input rounded-xl py-2.5 px-4 text-sm"
                data-testid="input-product-enname"
              />
              <input
                value={editing.price}
                onChange={(e) => setEditing({ ...editing, price: e.target.value })}
                placeholder="السعر بالريال (مثال: 133)"
                dir="ltr"
                className="w-full bg-background border border-input rounded-xl py-2.5 px-4 text-sm"
                data-testid="input-product-price"
              />
              <select
                value={editing.categorySlug}
                onChange={(e) => setEditing({ ...editing, categorySlug: e.target.value })}
                className="w-full bg-background border border-input rounded-xl py-2.5 px-4 text-sm"
              >
                {CATEGORIES.filter((c) => c.slug !== "all").map((c) => (
                  <option key={c.slug} value={c.slug}>{c.arName}</option>
                ))}
              </select>
              <input
                value={editing.stock}
                onChange={(e) => setEditing({ ...editing, stock: e.target.value })}
                placeholder="المخزون"
                dir="ltr"
                className="w-full bg-background border border-input rounded-xl py-2.5 px-4 text-sm"
              />
              <input
                value={editing.image}
                onChange={(e) => setEditing({ ...editing, image: e.target.value })}
                placeholder="اسم ملف الصورة (: 0.jpg) — تُرفع الصور إلى مجلد products"
                dir="ltr"
                className="w-full bg-background border border-input rounded-xl py-2.5 px-4 text-sm"
                data-testid="input-product-image"
              />
              <input
                value={editing.keywords}
                onChange={(e) => setEditing({ ...editing, keywords: e.target.value })}
                placeholder="كلمات مفتاحية مفصولة بفواصل"
                className="w-full bg-background border border-input rounded-xl py-2.5 px-4 text-sm"
              />
              {saveMutation.isError && (
                <div className="text-xs text-destructive">{(saveMutation.error as Error).message}</div>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => saveMutation.mutate(editing)}
                  disabled={saveMutation.isPending}
                  className="flex-1 bg-primary text-primary-foreground font-bold rounded-xl py-2.5 text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  data-testid="button-save-product"
                >
                  {saveMutation.isPending ? "جارٍ الحفظ…" : "حفظ"}
                </button>
                <button
                  onClick={() => setEditing(null)}
                  className="flex-1 border border-input rounded-xl py-2.5 text-sm font-semibold hover:bg-secondary transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary text-xs text-muted-foreground">
                <th className="p-3 text-start font-semibold">SKU</th>
                <th className="p-3 text-start font-semibold">المنتج</th>
                <th className="p-3 text-start font-semibold">الفئة</th>
                <th className="p-3 text-start font-semibold">السعر</th>
                <th className="p-3 text-start font-semibold">المخزون</th>
                <th className="p-3 text-start font-semibold">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {(products ?? []).map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="p-3 font-mono text-xs">{p.sku}</td>
                  <td className="p-3">
                    <div className="font-semibold">{p.arName}</div>
                    <div className="text-xs text-muted-foreground">{p.enName}</div>
                  </td>
                  <td className="p-3 text-xs">{CATEGORIES.find((c) => c.slug === p.categorySlug)?.arName ?? p.categorySlug}</td>
                  <td className="p-3 font-bold whitespace-nowrap">{formatSAR(p.priceHalalas)} ر.س</td>
                  <td className="p-3">{p.stock}</td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() =>
                          setEditing({
                            id: p.id,
                            sku: p.sku,
                            arName: p.arName,
                            enName: p.enName,
                            price: (p.priceHalalas / 100).toString(),
                            categorySlug: p.categorySlug,
                            stock: String(p.stock),
                            keywords: (JSON.parse(p.keywords || "[]") as string[]).join(", "),
                            image: p.image,
                            featured: p.featured,
                            active: p.active,
                            sortOrder: p.sortOrder,
                          })
                        }
                        className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
                        aria-label="تعديل"
                        data-testid={`button-edit-product-${p.id}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(p.id)}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                        aria-label="حذف"
                        data-testid={`button-delete-product-${p.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Settings ---------------- */

function AdminSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: settings } = useQuery<SettingsDto>({ queryKey: ["/api/settings"] });
  const [form, setForm] = useState<Partial<SettingsDto> | null>(null);

  const current = form ?? settings ?? null;

  const saveMutation = useMutation({
    mutationFn: (s: Partial<SettingsDto>) =>
      adminMutate("PATCH", "/api/admin/settings", {
        ...s,
        shippingFeeHalalas: s.shippingFeeHalalas != null ? Math.round(Number(s.shippingFeeHalalas)) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      setForm(null);
      toast({ title: "تم حفظ الإعدادات بنجاح" });
    },
  });

  if (!current) return <div className="text-sm text-muted-foreground">جارٍ التحميل…</div>;

  const fields: { key: keyof SettingsDto; label: string; dir?: string }[] = [
    { key: "storeName", label: "اسم المتجر" },
    { key: "ownerName", label: "اسم المالك" },
    { key: "whatsappNumber", label: "رقم الواتساب (بصيغة دولية بدون +)", dir: "ltr" },
    { key: "contactEmail", label: "البريد الإلكتروني للتواصل", dir: "ltr" },
    { key: "sponsorId", label: "رقم السبونسر", dir: "ltr" },
    { key: "shippingFeeHalalas", label: "رسوم الشحن (بالهللات — 3000 = 30 ر.س)", dir: "ltr" },
    { key: "promoTitle", label: "عنوان قسم الترويج" },
    { key: "promoText", label: "نص قسم الترويج" },
  ];

  return (
    <div className="bg-card border border-card-border rounded-2xl p-5 max-w-2xl">
      <div className="space-y-4">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="block text-sm font-semibold mb-1.5">{f.label}</label>
            {f.key === "promoText" ? (
              <textarea
                value={String(current[f.key] ?? "")}
                onChange={(e) => setForm({ ...current, [f.key]: e.target.value })}
                rows={3}
                className="w-full bg-background border border-input rounded-xl py-2.5 px-4 text-sm"
                data-testid={`input-setting-${f.key}`}
              />
            ) : (
              <input
                value={String(current[f.key] ?? "")}
                onChange={(e) => setForm({ ...current, [f.key]: e.target.value })}
                dir={f.dir}
                className="w-full bg-background border border-input rounded-xl py-2.5 px-4 text-sm"
                data-testid={`input-setting-${f.key}`}
              />
            )}
          </div>
        ))}

        {/* Colors */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-1.5">اللون الأساسي</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={current.primaryColor ?? "#24523f"}
                onChange={(e) => setForm({ ...current, primaryColor: e.target.value })}
                className="h-10 w-14 rounded-lg border border-input bg-background"
              />
              <input
                value={current.primaryColor ?? ""}
                onChange={(e) => setForm({ ...current, primaryColor: e.target.value })}
                dir="ltr"
                className="flex-1 bg-background border border-input rounded-xl py-2.5 px-4 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5">لون التمييز (ذهبي)</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={current.accentColor ?? "#b47d1f"}
                onChange={(e) => setForm({ ...current, accentColor: e.target.value })}
                className="h-10 w-14 rounded-lg border border-input bg-background"
              />
              <input
                value={current.accentColor ?? ""}
                onChange={(e) => setForm({ ...current, accentColor: e.target.value })}
                dir="ltr"
                className="flex-1 bg-background border border-input rounded-xl py-2.5 px-4 text-sm"
              />
            </div>
          </div>
        </div>

        {saveMutation.isError && (
          <div className="text-xs text-destructive">فشل الحفظ — تحقق من الجلسة وأعد المحاولة</div>
        )}
        <button
          onClick={() => current && saveMutation.mutate(current)}
          disabled={saveMutation.isPending || !form}
          className="bg-primary text-primary-foreground font-bold rounded-xl px-6 py-2.5 text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
          data-testid="button-save-settings"
        >
          {saveMutation.isPending ? "جارٍ الحفظ…" : "حفظ الإعدادات"}
        </button>
      </div>
    </div>
  );
}
