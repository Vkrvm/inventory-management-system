import DashboardLayout from "@/components/DashboardLayout";
import { getUsers } from "@/actions/user.actions";
import UserManagementClient from "./UserManagementClient";

export default async function UsersPage() {
  const result = await getUsers();

  if (result.error) {
    return (
      <DashboardLayout>
        <div className="alert alert-danger">{result.error}</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>

      <UserManagementClient users={result.users || []} />
    </DashboardLayout>
  );
}
