import { Header } from "@/components/layout/header";
import { OfflineBanner } from "@/components/ui/offline-banner";
import { InstallBanner } from "@/components/pwa/install-banner";
import { FAB } from "@/components/ui/fab";
import { ToastProvider } from "@/components/ui/toast";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex-1">{children}</main>
        <FAB />
        <OfflineBanner />
        <InstallBanner />
      </div>
    </ToastProvider>
  );
}
