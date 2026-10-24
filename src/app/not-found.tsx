import { ButtonLink, Container } from "@/components/ui";

export default function NotFound() {
  return (
    <Container className="py-20 text-center">
      <p className="text-lg font-semibold text-ink">ไม่พบหน้านี้</p>
      <ButtonLink href="/" variant="secondary" className="mt-6">
        กลับหน้าแรก
      </ButtonLink>
    </Container>
  );
}
