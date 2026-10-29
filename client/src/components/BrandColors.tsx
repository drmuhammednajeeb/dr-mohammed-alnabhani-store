import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { SettingsDto } from "@/lib/store";

/** Applies store-branded colors (from admin settings) to the shadcn CSS variables. */
function hexToHslTriplet(hex: string): string | null {
  const m = hex.trim().match(/^#?([0-9a-f]{6})$/i);
  if (!m) return null;
  const r = parseInt(m[1].slice(0, 2), 16) / 255;
  const g = parseInt(m[1].slice(2, 4), 16) / 255;
  const b = parseInt(m[1].slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h *= 60;
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export default function BrandColors() {
  const { data: settings } = useQuery<SettingsDto>({ queryKey: ["/api/settings"] });

  useEffect(() => {
    if (!settings) return;
    const root = document.documentElement;
    const primary = hexToHslTriplet(settings.primaryColor);
    if (primary) {
      const isDark = settings.primaryColor.replace("#", "");
      const lum =
        (parseInt(isDark.slice(0, 2), 16) * 0.299 +
          parseInt(isDark.slice(2, 4), 16) * 0.587 +
          parseInt(isDark.slice(4, 6), 16) * 0.114) /
        255;
      root.style.setProperty("--primary", primary);
      root.style.setProperty("--primary-foreground", lum > 0.6 ? "160 14% 12%" : "0 0% 98%");
      root.style.setProperty("--ring", primary);
      root.style.setProperty("--sidebar-primary", primary);
      root.style.setProperty("--sidebar-ring", primary);
    }
    const accent = hexToHslTriplet(settings.accentColor);
    if (accent) {
      root.style.setProperty("--accent", accent);
    }
  }, [settings]);

  return null;
}
