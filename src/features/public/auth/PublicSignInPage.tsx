import { SignInForm } from "@/components/auth/SignInForm";
import { AuthShell } from "@/components/layout/AuthShell";
import { ROUTES } from "@/lib/routes";

export function PublicSignInPage() {
  return (
    <AuthShell
      backHref={ROUTES.home}
      backLabel="Return to Landing Page"
      eyebrow="HÀNH TRÌNH THÔNG MINH CHO NGƯỜI VIỆT"
      title={
        <>
          Chào mừng trở lại{" "}
          <span className="text-brand-brightTeal">TripMate</span>
        </>
      }
      description="Đăng nhập để quản lý lịch trình, khám phá điểm đến và đồng hành cùng bạn trên mọi chuyến đi."
    >
      <SignInForm />
    </AuthShell>
  );
}
