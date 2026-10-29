import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { SettingsDto, type ProductDto, formatSAR } from "@/lib/store";
import ProductCard from "@/components/ProductCard";
import { ChevronLeft, Leaf, ShieldCheck, Truck, Users } from "lucide-react";

export default function Home() {
  const { data: settings } = useQuery<SettingsDto>({ queryKey: ["/api/settings"] });
  const { data: products } = useQuery<ProductDto[]>({ queryKey: ["/api/products"] });
  const shippingFee = (settings?.shippingFeeHalalas ?? 3000) / 100;

  const featured = (products ?? []).filter((p) => p.featured === 1).slice(0, 4);
  const newest = (products ?? []).slice(0, 8);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-bl from-[#e7efe6] via-background to-[#f6f0dd] dark:from-[#16241c] dark:via-background dark:to-[#1f1d14]">
        <div className="max-w-6xl mx-auto px-4 py-14 md:py-20 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
              <Leaf className="w-3.5 h-3.5" />
              منتجات معتمدة من IASC
            </div>
            <h1 className="text-2xl md:text-[2.5rem] font-bold leading-tight mb-4">
              متجر {settings?.ownerName ?? "د. محمد النبهاني"}
              <span className="block text-primary mt-2 text-xl md:text-3xl">
                منتجات فوريفر ليفينج الرسمية
              </span>
            </h1>
            <p className="text-muted-foreground leading-relaxed mb-6 text-sm md:text-base">
              اكتشف منتجات فوريفر ليفينج للعناية والصحة. تصفح المنتجات، أضف للسلة، وأكمل طلبك بسهولة
              عبر واتساب — توصيل لجميع مدن المملكة.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/shop"
                className="bg-primary text-primary-foreground font-semibold rounded-xl px-6 py-3 hover:bg-primary/90 transition-colors"
                data-testid="link-shop-hero"
              >
                تصفح المنتجات
              </Link>
              <a
                href={`https://wa.me/${settings?.whatsappNumber ?? "966546723820"}`}
                target="_blank"
                rel="noopener noreferrer"
                className="border border-primary text-primary font-semibold rounded-xl px-6 py-3 hover:bg-primary/5 transition-colors"
              >
                تواصل معنا
              </a>
            </div>
          </div>
          <div className="hidden md:block">
            <img
            src="/products/0.jpg"
              alt="عصير الصبار"
              className="w-full max-w-md mx-auto rounded-3xl shadow-xl"
            />
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="max-w-6xl mx-auto px-4 -mt-2 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 bg-card border border-card-border rounded-2xl p-4">
            <ShieldCheck className="w-8 h-8 text-primary shrink-0" />
            <div>
              <div className="font-bold text-sm">منتجات فوريفر ليفينج الرسمية</div>
              <div className="text-xs text-muted-foreground">مصدرها الموقع الرسمي للشركة</div>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-card border border-card-border rounded-2xl p-4">
            <Truck className="w-8 h-8 text-primary shrink-0" />
            <div>
              <div className="font-bold text-sm">شحن لجميع مدن المملكة</div>
              <div className="text-xs text-muted-foreground">رسوم شحن ثابتة {formatSAR(shippingFee)} ر.س — الأسعار تشمل ضريبة القيمة المضافة</div>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-card border border-card-border rounded-2xl p-4">
            <Users className="w-8 h-8 text-primary shrink-0" />
            <div>
              <div className="font-bold text-sm">انضم لفريقنا</div>
              <div className="text-xs text-muted-foreground">سجّل عضويًا برعايتنا واستفد من العروض</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold mb-6">تصفح حسب الفئة</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { slug: "drinks", name: "عصير الصبار", emoji: "🥤" },
            { slug: "supplements", name: "المكملات", emoji: "💊" },
            { slug: "care", name: "العناية بالشعر والبشرة", emoji: "🧴" },
            { slug: "personal-care", name: "العناية الشخصية", emoji: "🪥" },
            { slug: "weight", name: "التخسيس ونزول الوزن", emoji: "⚖️" },
            { slug: "packs", name: "المجموعات", emoji: "📦" },
          ].map((c) => (
            <Link
              key={c.slug}
              href={`/shop/${c.slug}`}
              className="bg-card border border-card-border rounded-2xl p-4 text-center hover:border-primary hover:shadow-md transition-all"
            >
              <div className="text-3xl mb-2">{c.emoji}</div>
              <div className="text-xs font-semibold">{c.name}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Promo (from source) */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="rounded-3xl bg-primary text-primary-foreground p-8 md:p-10 relative overflow-hidden">
          <div className="absolute -top-10 -start-10 w-40 h-40 rounded-full bg-white/10" />
          <h2 className="text-xl font-bold mb-3 relative">{settings?.promoTitle ?? "قوة الصبار الطبيعية"}</h2>
          <p className="leading-relaxed max-w-2xl relative text-sm md:text-base opacity-95">
            {settings?.promoText ??
              "للصبار فوائد قوية تساعدك على أن تبدو وتشعر بأفضل حال من الداخل والخارج. منتجاتنا المعتمدة من IASC مصنوعة من جل الصبار الداخلي النقي."}
          </p>
          <a
            href="https://foreverliving.com/are/ar-ae/our-aloe"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-5 bg-white text-primary font-bold rounded-xl px-5 py-2.5 text-sm hover:bg-white/90 transition-colors relative"
          >
            اعرف المزيد عن الصبار
            <ChevronLeft className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* Featured products */}
      {featured.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">المجموعات والعروض</h2>
            <Link href="/shop" className="text-sm text-primary font-semibold flex items-center gap-1">
              كل المنتجات <ChevronLeft className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Newest products */}
      <section className="max-w-6xl mx-auto px-4 py-8 pb-14">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">أحدث المنتجات</h2>
          <Link href="/shop" className="text-sm text-primary font-semibold flex items-center gap-1">
            عرض الكل <ChevronLeft className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {newest.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
