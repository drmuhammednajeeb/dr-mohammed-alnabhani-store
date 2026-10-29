import { Link } from "wouter";
import { useStore } from "@/contexts/StoreContext";
import { formatSAR, type ProductDto } from "@/lib/store";
import { Heart, ShoppingBag } from "lucide-react";

export default function ProductCard({ product }: { product: ProductDto }) {
  const { favorites, toggleFavorite, addToCart } = useStore();
  const isFav = favorites.includes(product.id);

  return (
    <div
      className="group bg-card border border-card-border rounded-2xl overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
      data-testid={`card-product-${product.id}`}
    >
      <div className="relative">
        <Link href={`/product/${product.id}`}>
          <img
          src={`/products/${product.id}.jpg`}
            loading="lazy"
            className="w-full aspect-square object-cover group-hover:scale-[1.03] transition-transform duration-300"
          />
        </Link>
        <button
          onClick={() => toggleFavorite(product.id)}
          className={`absolute top-2 start-2 p-2 rounded-full backdrop-blur transition-colors ${
            isFav ? "bg-[hsl(40,62%,42%)] text-white" : "bg-white/80 text-foreground hover:bg-white"
          }`}
          aria-label={isFav ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
          data-testid={`button-favorite-${product.id}`}
        >
          <Heart className={`w-4 h-4 ${isFav ? "fill-current" : ""}`} />
        </button>
        {product.stock <= 0 && (
          <span className="absolute top-2 end-2 bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded-full">
            نفدت الكمية
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col gap-2 flex-1">
        <Link href={`/product/${product.id}`} className="text-sm font-semibold leading-snug hover:text-primary transition-colors line-clamp-2">
          {product.arName}
        </Link>
        <div dir="ltr" className="text-xs text-muted-foreground truncate">{product.enName}</div>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <div className="font-bold text-primary text-base" data-testid={`text-price-${product.id}`}>
            {formatSAR(product.priceHalalas)} ر.س
          </div>
          <button
            onClick={() => addToCart(product.id)}
            disabled={product.stock <= 0}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg px-3 py-2 hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            data-testid={`button-add-cart-${product.id}`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            أضف للسلة
          </button>
        </div>
      </div>
    </div>
  );
}
