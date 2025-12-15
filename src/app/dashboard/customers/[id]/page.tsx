import DashboardLayout from "@/components/DashboardLayout";
import { getCustomerReturns } from "@/actions/return.actions";
import { getCreditHistory } from "@/actions/credit.actions";
import CustomerAccountClient from "./CustomerAccountClient";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function CustomerAccountPage({
  params,
}: {
  params: { id: string };
}) {
  const customer = await prisma.customer.findUnique({
    where: { id: params.id },
    include: {
      invoices: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!customer) {
    redirect("/dashboard/customers");
  }

  const payments = await prisma.customerPayment.findMany({
    where: { customerId: params.id },
    orderBy: { paymentDate: "desc" },
  });

  const returns = await getCustomerReturns(params.id);
  const creditTransactions = await getCreditHistory(params.id);

  // Fetch a user to act as the current session user (Temporary fix until proper auth)
  const currentUser = await prisma.user.findFirst();

  return (
    <DashboardLayout>
      <CustomerAccountClient
        customer={customer}
        payments={payments}
        returns={returns}
        creditTransactions={creditTransactions}
        currentUser={currentUser || { id: "unknown", name: "Guest" }} // Fallback
      />
    </DashboardLayout>
  );
}
