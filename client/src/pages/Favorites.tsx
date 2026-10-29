import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { type ProductDto } from "@/lib/store";
import { useStore } from "@/contexts/StoreContext";
import ProductCard from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, ShoppingBag } from "lucide-react";

export default function Favorites() {
  const { favorites } = useStore();
  const { data: products, isLoading } = useQuery<ProductDto[]>({ queryKey: ["/api/products"] });

  const favProducts = (products ?? []).filter((p) => favorites.includes(p.id));

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/5] rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-6">منتجاتي المفضلة ({favProducts.length})</h1>
      {favProducts.length === 0 ? (
        <div className="text-center py-20">
          <Heart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="font-bold mb-2">لا توجد منتجات مفضلة بعد</h2>
          <p className="text-sm text-muted-foreground mb-6">
            اضغط على أيقونة القلب في أي منتج لإضافته إلى مفضلتك
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold rounded-xl px-6 py-3 hover:bg-primary/90 transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            تصفح المنتجات
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {favProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
