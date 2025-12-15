"use client";

import { useTranslation } from "@/hooks/useTranslation";

interface UserGreetingProps {
    name: string;
    role: string;
}

export default function UserGreeting({ name, role }: UserGreetingProps) {
    const { t } = useTranslation();

    return (
        <small className="text-muted">
            {t("dashboard.loggedInAs")} <strong>{name}</strong> ({role})
        </small>
    );
}
