import { Container, PageTitle } from "@/components/ui";
import { QuizHub } from "@/components/quiz/QuizHub";

export default function QuizHubPage() {
  return (
    <Container className="space-y-6 py-6 md:py-10">
      <PageTitle eyebrow="Mini Quiz" title="แบบทดสอบท้ายภารกิจ" sub="ทดสอบการจำแนกเนื้อเยื่อ การระบุลักษณะเซลล์ และการเชื่อมโยงโครงสร้างกับหน้าที่" />
      <QuizHub />
    </Container>
  );
}
