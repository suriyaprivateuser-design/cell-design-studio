import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock } from "lucide-react";
import { GROUP_TEXT, TISSUES, getTissue } from "@/content/tissues";
import { Card, Container } from "@/components/ui";
import { PageLoading } from "@/components/PageLoading";
import { TissueKnowledge } from "@/components/library/TissueKnowledge";
import { TissueThumb } from "@/components/TissueThumb";

export function generateStaticParams() {
  return TISSUES.map((t) => ({ id: t.id }));
}

export default function TissuePage({ params }: PageProps<"/library/[id]">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <TissueDetail params={params} />
    </Suspense>
  );
}

async function TissueDetail({ params }: { params: PageProps<"/library/[id]">["params"] }) {
  const { id } = await params;
  const tissue = getTissue(id);
  if (!tissue) notFound();

  return (
    <Container className="py-6 md:py-8">
      <Link href="/library" className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> คลังเนื้อเยื่อ
      </Link>
      <div className="mb-6 space-y-1">
        <p className="text-sm font-semibold text-sage-600">
          {GROUP_TEXT[tissue.group].th} · {GROUP_TEXT[tissue.group].en}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-ink">
          {tissue.nameTh} <span className="text-xl font-normal text-muted">· {tissue.nameEn}</span>
        </h1>
      </div>
      {tissue.knowledge ? (
        <TissueKnowledge tissueId={tissue.id} />
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          <div className="overflow-hidden rounded-3xl bg-sage-50 shadow-soft">
            <TissueThumb tissueId={tissue.id} />
          </div>
          <Card className="space-y-4 p-6">
            <p className="text-[15px] leading-relaxed text-ink">{tissue.summary}</p>
            <div className="flex items-start gap-3 rounded-2xl border border-dashed border-sage-300 bg-sage-50 p-4 text-sm text-muted">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-sage-600" />
              โมเดล 3D ภาพตัดขวาง ภาพตัดตามยาว และสรุปความรู้ฉบับเต็มของเนื้อเยื่อนี้ จะเพิ่มพร้อมภารกิจออกแบบเซลล์ในเฟสถัดไป
            </div>
          </Card>
        </div>
      )}
    </Container>
  );
}
