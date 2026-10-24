import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Thai } from "next/font/google";
import { AppHeader, MobileNav } from "@/components/AppNav";
import { StoreHydrator } from "@/store/StoreHydrator";
import "./globals.css";

const plexThai = IBM_Plex_Sans_Thai({
  variable: "--font-plex-thai",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Cell Design Studio",
  description: "เรียนรู้เนื้อเยื่อพืชผ่านการออกแบบเซลล์ 3 มิติ สำหรับนักเรียนมัธยมศึกษาตอนปลาย",
};

export const viewport: Viewport = {
  themeColor: "#f6f8f3",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className={`${plexThai.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <StoreHydrator />
        <AppHeader />
        <main className="flex-1 pb-24 md:pb-10">{children}</main>
        <MobileNav />
      </body>
    </html>
  );
}
