import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect, useMemo, useState } from "react";
import { type ProductDto, CATEGORIES } from "@/lib/store";
import ProductCard from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";

type SortKey = "default" | "price-asc" | "price-desc";

export default function Shop() {
  const [location] = useLocation();
  const params = new URLSearchParams(location.split("?")[1] ?? "");
  const [searchParam, setSearchParam] = useState(params.get("q") ?? "");
  const [search, setSearch] = useState(searchParam);

  // category from path: /shop/:category
  const pathCategory = location.startsWith("/shop/") ? location.split("?")[0].replace("/shop/", "") : "all";
  const validCat = CATEGORIES.some((c) => c.slug === pathCategory) ? pathCategory : "all";
  const [category, setCategory] = useState(validCat);
  const [sort, setSort] = useState<SortKey>("default");

  useEffect(() => {
    setCategory(validCat);
  }, [validCat]);

  useEffect(() => {
    setSearch(searchParam);
  }, [searchParam]);

  const { data: products, isLoading } = useQuery<ProductDto[]>({
    queryKey: ["/api/products"],
  });

  const filtered = useMemo(() => {
    let list = products ?? [];
    if (category !== "all") list = list.filter((p) => p.categorySlug === category);
    if (search.trim()) {
      const q = search.trim();
      list = list.filter(
        (p) =>
          p.arName.includes(q) ||
          p.enName.toLowerCase().includes(q.toLowerCase()) ||
          p.sku.includes(q) ||
          p.keywords.includes(q),
      );
    }
    switch (sort) {
      case "price-asc":
        return [...list].sort((a, b) => a.priceHalalas - b.priceHalalas);
      case "price-desc":
        return [...list].sort((a, b) => b.priceHalalas - a.priceHalalas);
      default:
        return list;
    }
  }, [products, category, search, sort]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-6">قائمة المنتجات الكاملة</h1>

      {/* Search */}
      <div className="mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث في المتجر (عصير، مكملات، صبار…)"
          className="w-full bg-card border border-input rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          data-testid="input-shop-search"
        />
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {CATEGORIES.map((c) => (
          <button
            key={c.slug}
            onClick={() => {
              setCategory(c.slug);
              window.location.hash = c.slug === "all" ? "#/shop" : `#/shop/${c.slug}`;
            }}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
              category === c.slug
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-foreground hover:bg-secondary/70"
            }`}
            data-testid={`button-category-${c.slug}`}
          >
            {c.arName}
          </button>
        ))}
      </div>

      {/* Sort + count */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="text-sm text-muted-foreground" data-testid="text-results-count">
          {filtered.length} منتج
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="bg-card border border-input rounded-lg py-1.5 px-3 text-sm"
          data-testid="select-sort"
        >
          <option value="default">الترتيب الافتراضي</option>
          <option value="price-asc">السعر: من الأقل للأعلى</option>
          <option value="price-desc">السعر: من الأعلى للأقل</option>
        </select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/5] rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground" data-testid="text-no-results">
          لا توجد منتجات مطابقة لبحثك
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
