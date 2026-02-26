import type { Metadata } from "next";
import { getPublicShareData } from "@/lib/services/share.service";
import { PublicDashboard } from "@/components/share/public-dashboard";

interface PageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { token } = await params;
  try {
    const data = await getPublicShareData(token);
    return {
      title: `${(data.group as { name: string }).name} — SplitFree`,
      description: "Shared expense group",
    };
  } catch {
    return { title: "Shared Group — SplitFree" };
  }
}

export default async function SharePage({ params }: PageProps) {
  const { token } = await params;

  let data;
  let error: string | null = null;

  try {
    data = await getPublicShareData(token);
  } catch (err) {
    if (err instanceof Response) {
      const body = await err.json().catch(() => ({}));
      error =
        (body as { error?: string }).error ?? "This share link is invalid.";
      if (err.status === 401) {
        error = "This share link has expired.";
      }
    } else {
      error = "Share link not found.";
    }
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {error ?? "Not found"}
          </h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            The share link may have expired or been revoked.
          </p>
        </div>
      </div>
    );
  }

  return <PublicDashboard data={data} />;
}
