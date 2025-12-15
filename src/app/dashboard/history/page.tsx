import DashboardLayout from "@/components/DashboardLayout";
import { prisma } from "@/lib/db";
import HistoryClient from "./HistoryClient";

async function getHistory() {
  try {
    const history = await prisma.history.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return { success: true, history };
  } catch (error) {
    console.error("Get history error:", error);
    return { success: false, error: "Failed to fetch history", history: [] };
  }
}

export default async function HistoryPage() {
  const result = await getHistory();

  return (
    <DashboardLayout>

      <HistoryClient history={result.history || []} />
    </DashboardLayout>
  );
}
