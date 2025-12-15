import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Sidebar from "./Sidebar";
import UserGreeting from "./UserGreeting";
import { UserPreferencesProvider } from "@/contexts/UserPreferencesContext";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Get user preferences from database
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { language: true, currency: true },
  });

  const language = user?.language || "AR";
  const currency = user?.currency || "EGP";

  return (
    <UserPreferencesProvider initialLanguage={language} initialCurrency={currency}>
      <div className="d-flex">
        <div style={{ width: "250px", minHeight: "100vh", maxHeight: "100vh", overflowY: "scroll", flexShrink: 0 }}>
          <Sidebar userRole={session.user.role} />
        </div>
        <div className="flex-grow-1 p-4" style={{ minHeight: "100vh", maxHeight: "100vh", overflowY: "scroll", backgroundColor: "#f8f9fa" }}>
          <div className="mb-3 d-flex justify-content-between align-items-center">
            <div>
              <UserGreeting name={session.user.name || ""} role={session.user.role || ""} />
            </div>
          </div>
          {children}
        </div>
      </div>
    </UserPreferencesProvider>
  );
}
