import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { type ProductDto, type SettingsDto, formatSAR } from "@/lib/store";
import { useStore } from "@/contexts/StoreContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Minus, Plus, Trash2, ShoppingBag, ChevronLeft } from "lucide-react";

export default function CartPage() {
  const { cart, setQty, removeFromCart, clearCart } = useStore();
  const { data: products, isLoading } = useQuery<ProductDto[]>({ queryKey: ["/api/products"] });
  const { data: settings } = useQuery<SettingsDto>({ queryKey: ["/api/settings"] });

  const byId = new Map((products ?? []).map((p) => [p.id, p]));
  const items = cart
    .map((c) => ({ product: byId.get(c.productId), qty: c.qty }))
    .filter((x) => x.product);

  const subtotal = items.reduce((sum, x) => sum + (x.product!.priceHalalas * x.qty), 0);
  const shipping = subtotal > 0 ? settings?.shippingFeeHalalas ?? 3000 : 0;
  const total = subtotal + shipping;
  const vatRate = parseFloat(settings?.vatRate ?? "0.15") || 0.15;
  const vatIncluded = subtotal - Math.round(subtotal / (1 + vatRate));

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-40" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-xl font-bold mb-2">سلة المشتريات فارغة</h1>
        <p className="text-sm text-muted-foreground mb-6">أضف منتجاتك المفضلة وابدأ رحلة العناية والصحة</p>
        <Link 
          href="/shop" 
          className="inline-block bg-primary text-primary-foreground font-bold rounded-xl px-6 py-3 hover:bg-primary/90 transition-colors"
        >
          تصفح المنتجات
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-6">سلة المشتريات ({items.length})</h1>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map(({ product, qty }) => (
            <div 
              key={product!.id} 
              className="flex items-center gap-4 bg-card border border-card-border rounded-2xl p-3" 
              data-testid={`row-cart-${product!.id}`}
            >
              <Link href={`/product/${product!.id}`} className="shrink-0">
                <img 
                  src={`/products/${product!.id}.jpg`} 
                  alt={product!.arName} 
                  className="w-20 h-20 rounded-xl object-cover" 
                />
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/product/${product!.id}`} className="text-sm font-semibold line-clamp-2 hover:text-primary transition-colors">
                  {product!.arName}
                </Link>
                <div className="text-sm font-bold text-primary mt-1">
                  {formatSAR(product!.priceHalalas)} ر.س
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center border border-input rounded-lg overflow-hidden">
                  <button 
                    onClick={() => setQty(product!.id, qty - 1)} 
                    className="p-2 hover:bg-secondary transition-colors" 
                    aria-label="تقليل"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-9 text-center text-sm font-bold">{qty}</span>
                  <button 
                    onClick={() => setQty(product!.id, qty + 1)} 
                    className="p-2 hover:bg-secondary transition-colors" 
                    aria-label="زيادة"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button 
                  onClick={() => removeFromCart(product!.id)} 
                  className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors" 
                  aria-label="حذف من السلة"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          <button 
            onClick={clearCart} 
            className="text-sm text-destructive hover:underline" 
            data-testid="button-clear-cart"
          >
            إفراغ السلة
          </button>
        </div>

        {/* Summary */}
        <div className="bg-card border border-card-border rounded-2xl p-5 h-fit sticky top-40">
          <h2 className="font-bold mb-4">ملخص الطلب</h2>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">الإجمالي قبل الشحن</span>
              <span className="font-semibold">{formatSAR(subtotal)} ر.س</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>ضريبة القيمة المضافة {Math.round(vatRate * 100)}% (مضمنة)</span>
              <span>{formatSAR(vatIncluded)} ر.س</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">رسوم الشحن</span>
              <span className="font-semibold">{formatSAR(shipping)} ر.س</span>
            </div>
            <div className="border-t border-border pt-3 flex justify-between text-base">
              <span className="font-bold">الإجمالي النهائي</span>
              <span className="font-bold text-primary" data-testid="text-cart-total">
                {formatSAR(total)} ر.س
              </span>
            </div>
          </div>
          <Link 
            href="/checkout" 
            className="flex items-center justify-center gap-2 mt-5 bg-primary text-primary-foreground font-bold rounded-xl px-6 py-3 hover:bg-primary/90 transition-colors" 
            data-testid="link-checkout"
          >
            متابعة الشراء
            <ChevronLeft className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}