import DashboardLayout from "@/components/DashboardLayout";
import { getAllCategories } from "@/actions/category.actions";
import CategoriesClient from "./CategoriesClient";

export default async function CategoriesPage() {
  const result = await getAllCategories();

  if (!result.success) {
    return (
      <DashboardLayout>
        <div className="alert alert-danger">
          Error loading categories: {result.error}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>

      <CategoriesClient categories={result.data || []} />
    </DashboardLayout>
  );
}
