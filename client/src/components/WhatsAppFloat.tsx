import { useQuery } from "@tanstack/react-query";
import { SettingsDto } from "@/lib/store";
import { MessageCircle } from "lucide-react";

export default function WhatsAppFloat() {
  const { data: settings } = useQuery<SettingsDto>({
    queryKey: ["/api/settings"],
  });
  const wa = settings?.whatsappNumber ?? "966546723820";
  return (
    <a
      href={`https://wa.me/${wa}?text=${encodeURIComponent("السلام عليكم، أرغب بالاستفسار عن منتجات فوريفر")}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 start-5 z-50 flex items-center gap-2 rounded-full bg-[#25D366] text-white px-4 py-3 shadow-lg hover:bg-[#1fb855] transition-colors"
      aria-label="تواصل معنا عبر واتساب"
      data-testid="link-whatsapp-float"
    >
      <MessageCircle className="w-5 h-5" />
      <span className="hidden sm:inline text-sm font-semibold">تواصل معنا</span>
    </a>
  );
}
