import { getDamagedItems } from "@/actions/damaged-item.actions";
import DamagedItemsClient from "./DamagedItemsClient";
import DashboardLayout from "@/components/DashboardLayout";

export default async function DamagedItemsPage() {
    const items = await getDamagedItems();

    return (
        <DashboardLayout>
            <DamagedItemsClient items={items} />
        </DashboardLayout>
    );
}
