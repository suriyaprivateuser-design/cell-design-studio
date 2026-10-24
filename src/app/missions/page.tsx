import { Container, PageTitle } from "@/components/ui";
import { MissionList } from "@/components/MissionList";

export default function MissionsPage() {
  return (
    <Container className="space-y-6 py-6 md:py-10">
      <PageTitle
        eyebrow="เลือกภารกิจ"
        title="ภารกิจออกแบบเซลล์"
        sub="แต่ละภารกิจเป็นปัญหาที่พืชต้องแก้ ออกแบบเซลล์ให้เหมาะกับปัญหา แล้วค้นพบว่าเป็นเนื้อเยื่อชนิดใด"
      />
      <MissionList />
    </Container>
  );
}
