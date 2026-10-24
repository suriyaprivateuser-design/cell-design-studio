import { Container, PageTitle } from "@/components/ui";
import { ClassificationMap } from "@/components/classification/ClassificationMap";

export default function ClassificationPage() {
  return (
    <Container className="space-y-6 py-6 md:py-10">
      <PageTitle eyebrow="Plant Tissue Classification" title="แผนผังเนื้อเยื่อพืช" sub="สรุปการจำแนกเนื้อเยื่อเจริญและเนื้อเยื่อถาวร" />
      <ClassificationMap />
    </Container>
  );
}
