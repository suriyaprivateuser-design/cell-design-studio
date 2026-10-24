import Link from "next/link";
import { ArrowRight, BookOpenCheck, Library, Network } from "lucide-react";
import { ButtonLink, Container } from "@/components/ui";
import { HeroCell } from "@/components/HeroCell";

export default function HomePage() {
  return (
    <Container className="py-6 md:py-12">
      <section className="grid items-center gap-6 md:grid-cols-[1fr_1.15fr] md:gap-10">
        <div className="order-2 space-y-6 md:order-1">
          <div className="space-y-3">
            <p className="text-sm font-medium text-sage-600">เนื้อเยื่อพืช · Plant Tissue Explorer</p>
            <h1 className="text-4xl font-semibold tracking-tight text-sage-900 md:text-5xl">Cell Design Studio</h1>
            <p className="max-w-md text-[15px] leading-relaxed text-muted">
              รับโจทย์จากพืช ออกแบบเซลล์ให้แก้ปัญหานั้น ทดสอบผล แล้วค้นพบว่าเซลล์ที่ออกแบบคือเนื้อเยื่อชนิดใด
            </p>
          </div>
          <ButtonLink href="/missions" className="px-7 py-3 text-base">
            เริ่มเรียนรู้
            <ArrowRight className="h-4 w-4" />
          </ButtonLink>
          <div className="grid max-w-md grid-cols-3 gap-2">
            <HomeLink href="/library" icon={<Library className="h-5 w-5" />} label="คลังเนื้อเยื่อ" />
            <HomeLink href="/classification" icon={<Network className="h-5 w-5" />} label="แผนผังเนื้อเยื่อ" />
            <HomeLink href="/quiz" icon={<BookOpenCheck className="h-5 w-5" />} label="แบบทดสอบ" />
          </div>
        </div>
        <div className="order-1 md:order-2">
          <HeroCell />
        </div>
      </section>
    </Container>
  );
}

function HomeLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-white px-2 py-4 text-center text-sm text-sage-900 shadow-soft transition hover:-translate-y-0.5 hover:border-sage-300"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sage-100 text-sage-700">{icon}</span>
      {label}
    </Link>
  );
}
