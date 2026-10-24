import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { GROUP_TEXT, TISSUES, type TissueGroup } from "@/content/tissues";
import { Container, PageTitle } from "@/components/ui";
import { TissueThumb } from "@/components/TissueThumb";

const ORDER: TissueGroup[] = ["meristem", "ground", "dermal", "vascular"];

export default function LibraryPage() {
  return (
    <Container className="space-y-8 py-6 md:py-10">
      <PageTitle eyebrow="Tissue Library" title="คลังเนื้อเยื่อพืช" sub="ตัวอย่างเนื้อเยื่อพืชจัดตามหมวดที่เรียน กดเพื่อดูโมเดลเซลล์ ภาพตัดขวาง ภาพตัดตามยาว ลักษณะสำคัญ หน้าที่ และตำแหน่งที่พบ" />
      {ORDER.map((g) => {
        const items = TISSUES.filter((t) => t.group === g);
        return (
          <section key={g} className="space-y-3">
            <h2 className="text-lg font-semibold text-ink">
              {GROUP_TEXT[g].th} <span className="text-sm font-normal text-faint">· {GROUP_TEXT[g].en}</span>
            </h2>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/library/${t.id}`}
                    className="group flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-white shadow-soft transition hover:-translate-y-0.5 hover:border-sage-300 hover:shadow-lift"
                  >
                    <div className="aspect-[3/2] bg-sage-50">
                      <TissueThumb tissueId={t.id} />
                    </div>
                    <div className="flex flex-1 flex-col gap-1 p-4">
                      <p className="text-base font-semibold text-ink">
                        {t.nameTh} <span className="text-sm font-normal text-muted">· {t.nameEn}</span>
                      </p>
                      <p className="text-[13px] leading-relaxed text-muted">{t.summary}</p>
                      <div className="mt-auto flex items-center justify-between pt-3 text-xs">
                        {t.detail === "full" ? (
                          <span className="inline-flex items-center gap-1 font-medium text-sage-700">
                            ดูโมเดลและความรู้ <ArrowRight className="h-3.5 w-3.5" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-faint">
                            <Clock className="h-3.5 w-3.5" /> โมเดล 3D เพิ่มในเฟสถัดไป
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </Container>
  );
}
