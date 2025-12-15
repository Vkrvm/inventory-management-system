import DashboardLayout from "@/components/DashboardLayout";
import { getMaterials } from "@/actions/material.actions";
import { getUnits } from "@/actions/unit.actions";
import MaterialsClient from "./MaterialsClient";

export default async function MaterialsPage() {
  const [materialsResult, unitsResult] = await Promise.all([
    getMaterials(),
    getUnits(),
  ]);

  if (!materialsResult.success) {
    return (
      <DashboardLayout>
        <div className="alert alert-danger">
          Error loading materials: {materialsResult.error}
        </div>
      </DashboardLayout>
    );
  }

  if (!unitsResult.success) {
    return (
      <DashboardLayout>
        <div className="alert alert-danger">
          Error loading units: {unitsResult.error}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>

      <MaterialsClient
        materials={materialsResult.materials || []}
        units={unitsResult.units || []}
      />
    </DashboardLayout>
  );
}
