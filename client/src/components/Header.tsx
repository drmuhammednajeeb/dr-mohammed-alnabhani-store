import { useLocation } from "wouter";
import { useStore } from "@/contexts/StoreContext";
import { useQuery } from "@tanstack/react-query";
import { SettingsDto } from "@/lib/store";
import { Search, ShoppingBag, Heart, Moon, Sun, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

export default function Header() {
  const [location] = useLocation();
  const { cartCount, favorites, theme, toggleTheme } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: settings } = useQuery<SettingsDto>({
    queryKey: ["/api/settings"],
  });

  const navLinks = [
    { href: "/", label: "الرئيسية" },
    { href: "/shop", label: "المنتجات" },
    { href: "/shop/packs", label: "المجموعات" },
    { href: "/favorites", label: "المفضلة" },
    { href: "/admin", label: "لوحة التحكم" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur border-b border-border shadow-sm">
      {/* Top bar: sponsor */}
      <div className="bg-primary text-primary-foreground">
        <div className="max-w-6xl mx-auto px-4 py-1.5 flex items-center justify-between gap-2 text-xs sm:text-sm">
          <span className="flex items-center gap-1.5">
            <span className="font-semibold">BizmindMakers</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="opacity-90">رقم السبونسر:</span>
            <b className="font-mono tracking-wide" data-testid="text-sponsor-id">
              {settings?.sponsorId ?? "971001726361"}
            </b>
            <button
              className="rounded-md bg-black/20 hover:bg-black/30 px-2 py-0.5 transition-colors"
              onClick={() => {
                navigator.clipboard?.writeText(settings?.sponsorId ?? "971001726361");
              }}
              data-testid="button-copy-sponsor"
            >
              نسخ
            </button>
          </span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between gap-3 py-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0" data-testid="link-home">
          <img src="/products/falcon-logo.jpg" alt="شعار المتجر" className="w-10 h-10 rounded-xl object-cover" />
            <div className="leading-tight">
              <div className="text-sm text-muted-foreground">متجر</div>
              <div className="text-base font-bold text-primary">
                {settings?.ownerName ?? "د. محمد النبهاني"}
              </div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  location === l.href
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-secondary text-foreground"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
              aria-label="تبديل الوضع الليلي"
              data-testid="button-theme"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <Link
              href="/favorites"
              className="relative p-2 rounded-lg hover:bg-secondary transition-colors"
              aria-label="المفضلة"
              data-testid="link-favorites"
            >
              <Heart className="w-5 h-5" />
              {favorites.length > 0 && (
                <span className="absolute -top-0.5 -left-0.5 bg-[hsl(40,62%,42%)] text-white text-[10px] min-w-4 h-4 px-0.5 rounded-full flex items-center justify-center font-bold">
                  {favorites.length}
                </span>
              )}
            </Link>
            <Link
              href="/cart"
              className="relative p-2 rounded-lg hover:bg-secondary transition-colors"
              aria-label="سلة المشتريات"
              data-testid="link-cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -left-0.5 bg-primary text-primary-foreground text-[10px] min-w-4 h-4 px-0.5 rounded-full flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </Link>
            <button
              className="md:hidden p-2 rounded-lg hover:bg-secondary transition-colors"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="القائمة"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Search bar */}
        <form
          className="pb-3"
          onSubmit={(e) => {
            e.preventDefault();
            window.location.hash = `#/shop?q=${encodeURIComponent(search)}`;
          }}
        >
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث في المتجر (عصير، مكملات، صبار…)"
              className="w-full bg-background border border-input rounded-xl py-2.5 ps-10 pe-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              data-testid="input-search"
            />
          </div>
        </form>

        {/* Mobile menu */}
        {menuOpen && (
          <nav className="md:hidden pb-3 flex flex-col gap-1">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-secondary transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
