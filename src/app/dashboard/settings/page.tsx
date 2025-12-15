import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import SettingsClient from "./SettingsClient";
import DashboardLayout from "@/components/DashboardLayout";

export default async function SettingsPage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    return (
        <DashboardLayout>
            <SettingsClient user={session.user} />
        </DashboardLayout>
    );
}
