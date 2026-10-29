import { useQuery } from "@tanstack/react-query";
import { SettingsDto, formatSAR } from "@/lib/store";
import { Link } from "wouter";
import { Phone, Mail, MapPin } from "lucide-react";

export default function Footer() {
  const { data: settings } = useQuery<SettingsDto>({
    queryKey: ["/api/settings"],
  });
  const wa = settings?.whatsappNumber ?? "966546723820";
  const waDisplay = `+${wa}`;
  const shippingFee = (settings?.shippingFeeHalalas ?? 3000) / 100;
  const vatRate = Math.round((parseFloat(settings?.vatRate ?? "0.15") || 0.15) * 100);

  return (
    <footer className="bg-card border-t border-border mt-12">
      <div className="max-w-6xl mx-auto px-4 py-10 grid gap-8 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <img src="favicon.svg" alt="شعار المتجر" className="w-9 h-9 rounded-xl" />
            <div className="font-bold text-primary text-lg">
              متجر {settings?.ownerName ?? "د. محمد النبهاني"}
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            منتجات فوريفر ليفينج الرسمية للعناية والصحة. منتجات معتمدة من IASC مصنوعة من جل الصبار
            الداخلي النقي. توصيل لجميع مدن المملكة.
          </p>
        </div>
        <div>
          <h3 className="font-bold mb-3 text-sm">روابط سريعة</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/shop" className="text-muted-foreground hover:text-primary transition-colors">
                كل المنتجات
              </Link>
            </li>
            <li>
              <Link href="/cart" className="text-muted-foreground hover:text-primary transition-colors">
                سلة المشتريات
              </Link>
            </li>
            <li>
              <Link href="/favorites" className="text-muted-foreground hover:text-primary transition-colors">
                المفضلة
              </Link>
            </li>
            <li>
              <a
                href={settings?.registerUrl ?? "https://foreverliving.com/join/sau/en-us/checkout/personalinfo"}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                تسجيل عضو جديد
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="font-bold mb-3 text-sm">تواصل معنا</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary shrink-0" />
              <a
                href={`https://wa.me/${wa}`}
                target="_blank"
                rel="noopener noreferrer"
                dir="ltr"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                {waDisplay}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary shrink-0" />
              <a
                href={`mailto:${settings?.contactEmail ?? "drmuhammed.najeeb2020@gmail.com"}`}
                className="text-muted-foreground hover:text-primary transition-colors text-xs sm:text-sm break-all"
              >
                {settings?.contactEmail ?? "drmuhammed.najeeb2020@gmail.com"}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              <span className="text-muted-foreground">المملكة العربية السعودية</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border pt-4 pb-24 md:pb-10 text-center text-xs text-muted-foreground">
        إدارة BizmindMakers — الأسعار تشمل ضريبة القيمة المضافة {vatRate}% — رسوم الشحن الثابتة {formatSAR(shippingFee)} ر.س
      </div>
    </footer>
  );
}
