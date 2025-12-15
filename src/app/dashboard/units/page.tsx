import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getUnits } from "@/actions/unit.actions";
import DashboardLayout from "@/components/DashboardLayout";
import UnitsClient from "./UnitsClient";

export const dynamic = "force-dynamic";

export default async function UnitsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  // Only ADMIN and above can manage units
  if (
    ![UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER].includes(session.user.role)
  ) {
    redirect("/dashboard");
  }

  const result = await getUnits();

  if (!result.success || !result.units) {
    return (
      <DashboardLayout>
        <div className="alert alert-danger">Error loading units</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <UnitsClient units={result.units} />
    </DashboardLayout>
  );
}
