import DashboardLayout from "@/components/DashboardLayout";
import { getProducts } from "@/actions/product.actions";
import ProductsClient from "./ProductsClient";

export default async function ProductsPage() {
  const result = await getProducts();

  if (result.error) {
    return (
      <DashboardLayout>
        <div className="alert alert-danger">{result.error}</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>

      <ProductsClient products={result.products || []} />
    </DashboardLayout>
  );
}
