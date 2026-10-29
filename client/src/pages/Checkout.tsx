import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { useState } from "react";
import { type ProductDto, type SettingsDto, formatSAR } from "@/lib/store";
import { useStore } from "@/contexts/StoreContext";
import { apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, MessageCircle } from "lucide-react";

interface OrderResult {
  order: { id: number; orderNumber: string; totalHalalas: number };
  whatsappUrl: string;
}

const CITIES = [
  "جدة", "مكة المكرمة", "المدينة المنورة", "الرياض", "الدمام", "الخبر",
  "أبها", "تبوك", "بريدة", "خميس مشيط", "حائل", "نجران", "جيزان", "ينبع", "الطائف", "أخرى",
];

export default function Checkout() {
  const { cart, clearCart } = useStore();
  const { data: products, isLoading } = useQuery<ProductDto[]>({ queryKey: ["/api/products"] });
  const { data: settings } = useQuery<SettingsDto>({ queryKey: ["/api/settings"] });
  const [form, setForm] = useState({ customerName: "", customerPhone: "", city: "جدة", address: "", notes: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<OrderResult | null>(null);

  const byId = new Map((products ?? []).map((p) => [p.id, p]));
  const items = cart.map((c) => ({ product: byId.get(c.productId), qty: c.qty })).filter((x) => x.product);
  const subtotal = items.reduce((sum, x) => sum + (x.product!.priceHalalas * x.qty), 0);
  const shipping = settings?.shippingFeeHalalas ?? 3000;
  const total = subtotal + shipping;

  const placeOrder = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/orders", {
        customer: form,
        items: cart.map((c) => ({ productId: c.productId, qty: c.qty })),
      });
      return (await res.json()) as OrderResult;
    },
    onSuccess: (data) => {
      setResult(data);
      clearCart();
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  // Success screen
  if (result) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <CheckCircle2 className="w-16 h-16 mx-auto text-primary mb-4" />
        <h1 className="text-xl font-bold mb-2">تم استلام طلبك بنجاح</h1>
        <p className="text-sm text-muted-foreground mb-2">
          رقم الطلب: <b className="font-mono text-foreground">{result.order.orderNumber}</b>
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          الإجمالي: {formatSAR(result.order.totalHalalas)} ر.س — لإتمام الطلب أرسل التفاصيل عبر واتساب
        </p>
        <a
          href={result.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-[#25D366] text-white font-bold rounded-xl px-8 py-3.5 hover:bg-[#1fb855] transition-colors mb-6"
          data-testid="link-whatsapp-order"
        >
          <MessageCircle className="w-5 h-5" />
          إتمام الطلب عبر الواتساب
        </a>
        <div>
          <Link href="/shop" className="text-sm text-primary font-semibold">
            متابعة التسوق
          </Link>
        </div>
      </div>
    );
  }

  // Empty cart
  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="text-xl font-bold mb-2">سلة المشتريات فارغة</h1>
        <Link href="/shop" className="text-primary font-semibold text-sm">
          تصفح المنتجات
        </Link>
      </div>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.customerName.trim()) errs.customerName = "الاسم مطلوب";
    if (!/^05\d{8}$|^5\d{8}$/.test(form.customerPhone.trim().replace(/\s/g, "")))
      errs.customerPhone = "أدخل رقم جوال سعودي صحيح (05xxxxxxxx)";
    if (!form.address.trim()) errs.address = "العنوان مطلوب";
    setErrors(errs);
    if (Object.keys(errs).length === 0) placeOrder.mutate();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-6">إتمام الطلب</h1>
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Form */}
        <form onSubmit={submit} className="lg:col-span-2 bg-card border border-card-border rounded-2xl p-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1.5" htmlFor="customerName">
              الاسم الكامل *
            </label>
            <input
              id="customerName"
              value={form.customerName}
              onChange={(e) => setForm({ ...form, customerName: e.target.value })}
              className={`w-full bg-background border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 ${errors.customerName ? "border-destructive" : "border-input"}`}
              data-testid="input-name"
            />
            {errors.customerName && <div className="text-xs text-destructive mt-1">{errors.customerName}</div>}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5" htmlFor="customerPhone">
              رقم الجوال *
            </label>
            <input
              id="customerPhone"
              value={form.customerPhone}
              onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
              placeholder="05xxxxxxxx"
              dir="ltr"
              className={`w-full bg-background border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 ${errors.customerPhone ? "border-destructive" : "border-input"}`}
              data-testid="input-phone"
            />
            {errors.customerPhone && <div className="text-xs text-destructive mt-1">{errors.customerPhone}</div>}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5" htmlFor="city">
              المدينة *
            </label>
            <select
              id="city"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full bg-background border border-input rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              data-testid="select-city"
            >
              {CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5" htmlFor="address">
              العنوان التفصيلي *
            </label>
            <textarea
              id="address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              rows={3}
              className={`w-full bg-background border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 ${errors.address ? "border-destructive" : "border-input"}`}
              data-testid="input-address"
            />
            {errors.address && <div className="text-xs text-destructive mt-1">{errors.address}</div>}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5" htmlFor="notes">
              ملاحظات إضافية
            </label>
            <textarea
              id="notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full bg-background border border-input rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              data-testid="input-notes"
            />
          </div>

          <button
            type="submit"
            disabled={placeOrder.isPending}
            className="w-full bg-primary text-primary-foreground font-bold rounded-xl px-6 py-3.5 hover:bg-primary/90 disabled:opacity-50 transition-colors"
            data-testid="button-submit-order"
          >
            {placeOrder.isPending ? "جارٍ إرسال الطلب…" : "تأكيد الطلب"}
          </button>
          {placeOrder.isError && (
            <div className="text-sm text-destructive" data-testid="text-order-error">
              حدث خطأ أثناء إرسال الطلب. حاول مرة أخرى.
            </div>
          )}
        </form>

        {/* Summary */}
        <div className="bg-card border border-card-border rounded-2xl p-5 h-fit sticky top-40">
          <h2 className="font-bold mb-4">ملخص الطلب</h2>
          <div className="space-y-2 text-sm mb-4">
            {items.map(({ product, qty }) => (
              <div key={product!.id} className="flex justify-between gap-2">
                <span className="text-muted-foreground line-clamp-1">
                  {product!.arName} × {qty}
                </span>
                <span className="font-semibold shrink-0">
                  {formatSAR(product!.priceHalalas * qty!)} ر.س
                </span>
              </div>
            ))}
          </div>
          <div className="space-y-2 text-sm border-t border-border pt-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">قبل الشحن</span>
              <span className="font-semibold">{formatSAR(subtotal)} ر.س</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">الشحن</span>
              <span className="font-semibold">{formatSAR(shipping)} ر.س</span>
            </div>
            <div className="flex justify-between text-base font-bold text-primary">
              <span>الإجمالي</span>
              <span data-testid="text-checkout-total">{formatSAR(total)} ر.س</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
