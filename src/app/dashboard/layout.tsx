import { Header } from "@/components/layout/header";
import { OfflineBanner } from "@/components/ui/offline-banner";
import { InstallBanner } from "@/components/pwa/install-banner";
import { FAB } from "@/components/ui/fab";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950">
      <Header />
      <main className="flex-1">{children}</main>
      <FAB />
      <OfflineBanner />
      <InstallBanner />
    </div>
  );
}
