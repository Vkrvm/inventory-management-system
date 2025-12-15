import DashboardLayout from "@/components/DashboardLayout";
import { getCustomers } from "@/actions/customer.actions";
import CustomersClient from "./CustomersClient";

export default async function CustomersPage() {
  const result = await getCustomers();

  if (!result.success) {
    return (
      <DashboardLayout>
        <div className="alert alert-danger">
          Error loading customers: {result.error}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>

      <CustomersClient customers={result.customers || []} />
    </DashboardLayout>
  );
}
