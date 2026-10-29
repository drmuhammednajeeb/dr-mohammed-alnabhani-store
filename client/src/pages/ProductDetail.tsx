import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { type ProductDto, type SettingsDto, formatSAR, categoryArName } from "@/lib/store";
import { useStore } from "@/contexts/StoreContext";
import ProductCard from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, ShoppingBag, Minus, Plus, ChevronLeft, BadgeCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ProductDetail() {
  const [location] = useLocation();
  const id = Number(location.split("?")[0].replace("/product/", ""));
  const [qty, setQty] = useState(1);
  const { favorites, toggleFavorite, addToCart } = useStore();
  const { toast } = useToast();

  const { data: product, isLoading } = useQuery<ProductDto>({
    queryKey: ["/api/products", id],
  });
  const { data: settings } = useQuery<SettingsDto>({ queryKey: ["/api/settings"] });
  const shippingFee = (settings?.shippingFeeHalalas ?? 3000) / 100;

  const { data: all } = useQuery<ProductDto[]>({ queryKey: ["/api/products"] });
  const related = (all ?? []).filter((p) => p.categorySlug === product?.categorySlug && p.id !== id).slice(0, 4);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 grid md:grid-cols-2 gap-8">
        <Skeleton className="aspect-square rounded-3xl" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center text-muted-foreground">
        المنتج غير موجود.{" "}
        <Link href="/shop" className="text-primary font-semibold">
          العودة للمتجر
        </Link>
      </div>
    );
  }

  const isFav = favorites.includes(product.id);
  const keywords: string[] = JSON.parse(product.keywords || "[]");

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary">الرئيسية</Link>
        <ChevronLeft className="w-4 h-4" />
        <Link href="/shop" className="hover:text-primary">المنتجات</Link>
        <ChevronLeft className="w-4 h-4" />
        <Link href={`/shop/${product.categorySlug}`} className="hover:text-primary">
          {categoryArName(product.categorySlug)}
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-14">
        {/* Image */}
        <div className="relative">
          <img
            src={`/products/${product.id}.jpg`}
            alt={product.arName}
            className="w-full aspect-square object-cover rounded-3xl border border-card-border"
          />
          <button
            onClick={() => toggleFavorite(product.id)}
            className={`absolute top-4 start-4 p-3 rounded-full backdrop-blur transition-colors ${
              isFav ? "bg-[hsl(40,62%,42%)] text-white" : "bg-white/80 hover:bg-white"
            }`}
            aria-label={isFav ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
            data-testid={`button-favorite-detail-${product.id}`}
          >
            <Heart className={`w-5 h-5 ${isFav ? "fill-current" : ""}`} />
          </button>
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full">
              {categoryArName(product.categorySlug)}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <BadgeCheck className="w-3.5 h-3.5 text-primary" />
              SKU: <span className="font-mono">{product.sku}</span>
            </span>
          </div>

          <h1 className="text-xl md:text-2xl font-bold mb-1">{product.arName}</h1>
          <div className="text-sm text-muted-foreground mb-4">{product.enName}</div>

          <div className="text-2xl font-bold text-primary mb-1" data-testid="text-price-detail">
            {formatSAR(product.priceHalalas)} ر.س
          </div>
          <div className="text-xs text-muted-foreground mb-6">
            السعر يشمل ضريبة القيمة المضافة — رسوم الشحن {formatSAR(shippingFee)} ر.س
          </div>

          {product.description && (
            <p className="text-sm leading-relaxed text-muted-foreground mb-6">{product.description}</p>
          )}

          {keywords.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {keywords.slice(0, 6).map((k) => (
                <span key={k} className="bg-secondary text-xs px-2.5 py-1 rounded-full">{k}</span>
              ))}
            </div>
          )}

          {/* Qty + add to cart */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center border border-input rounded-xl overflow-hidden">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="p-3 hover:bg-secondary transition-colors"
                aria-label="تقليل الكمية"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-12 text-center font-bold" data-testid="text-qty">
                {qty}
              </span>
              <button
                onClick={() => setQty((q) => Math.min(product.stock || 99, q + 1))}
                className="p-3 hover:bg-secondary transition-colors"
                aria-label="زيادة الكمية"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs text-muted-foreground">
              {product.stock > 0 ? `متوفر: ${product.stock} قطعة` : "نفدت الكمية"}
            </div>
          </div>

          <button
            onClick={() => {
              addToCart(product.id, qty);
              toast({ title: "تمت الإضافة للسلة", description: product.arName });
            }}
            disabled={product.stock <= 0}
            className="flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold rounded-xl px-6 py-3.5 hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors w-full md:w-auto"
            data-testid="button-add-cart-detail"
          >
            <ShoppingBag className="w-5 h-5" />
            إضافة إلى السلة
          </button>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section>
          <h2 className="text-lg font-bold mb-5">منتجات مشابهة</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
