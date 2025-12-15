"use client";

import { useState, useEffect } from "react";
import { createProduct, createProductVariant, deleteProduct } from "@/actions/product.actions";
import { getAllBrands } from "@/actions/brand.actions";
import { getAllCategories } from "@/actions/category.actions";
import Alert from "@/components/Alert";
import { useTranslation } from "@/hooks/useTranslation";

interface Brand {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  categoryId: string;
  brandId: string;
  code: string;
  description: string | null;
  category: {
    id: string;
    name: string;
  };
  brand: {
    id: string;
    name: string;
  };
  variants: {
    id: string;
    color: string;
  }[];
}

export default function ProductsClient({ products }: { products: Product[] }) {
  const { t } = useTranslation();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [alert, setAlert] = useState<{ type: "success" | "danger"; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [formData, setFormData] = useState({
    categoryId: "",
    brandId: "",
    code: "",
    description: "",
  });

  const [variantData, setVariantData] = useState({
    color: "",
  });

  // Load brands and categories when modal opens
  useEffect(() => {
    if (showCreateModal) {
      loadBrandsAndCategories();
    }
  }, [showCreateModal]);

  const loadBrandsAndCategories = async () => {
    const brandsResult = await getAllBrands();
    const categoriesResult = await getAllCategories();

    if (brandsResult.success && brandsResult.data) {
      setBrands(brandsResult.data);
      if (brandsResult.data.length > 0) {
        setFormData((prev) => ({ ...prev, brandId: brandsResult.data[0].id }));
      }
    }

    if (categoriesResult.success && categoriesResult.data) {
      setCategories(categoriesResult.data);
      if (categoriesResult.data.length > 0) {
        setFormData((prev) => ({ ...prev, categoryId: categoriesResult.data[0].id }));
      }
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await createProduct(formData);

    if (result.error) {
      setAlert({ type: "danger", message: result.error });
    } else {
      setAlert({ type: "success", message: t("products.productCreated") });
      setShowCreateModal(false);
      setFormData({ categoryId: "", brandId: "", code: "", description: "" });
    }

    setLoading(false);
  };

  const handleCreateVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setLoading(true);

    const result = await createProductVariant({
      productId: selectedProduct.id,
      color: variantData.color,
    });

    if (result.error) {
      setAlert({ type: "danger", message: result.error });
    } else {
      setAlert({ type: "success", message: t("products.variantCreated") });
      setShowVariantModal(false);
      setVariantData({ color: "" });
    }

    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("products.deleteConfirm"))) return;

    setLoading(true);
    const result = await deleteProduct(id);

    if (result.error) {
      setAlert({ type: "danger", message: result.error });
    } else {
      setAlert({ type: "success", message: t("products.productDeleted") });
    }

    setLoading(false);
  };

  return (
    <>
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3">{t("products.title")}</h1>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="card-title mb-0">{t("products.title")}</h5>
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              {t("products.createProduct")}
            </button>
          </div>

          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>{t("products.category")}</th>
                  <th>{t("products.brand")}</th>
                  <th>{t("products.code")}</th>
                  <th>{t("products.description")}</th>
                  <th>{t("products.variants")}</th>
                  <th>{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <span className="badge bg-info">{product.category.name}</span>
                    </td>
                    <td>{product.brand.name}</td>
                    <td>
                      <code>{product.code}</code>
                    </td>
                    <td>{product.description || "-"}</td>
                    <td>
                      <div className="d-flex flex-wrap gap-1">
                        {product.variants.map((variant) => (
                          <span key={variant.id} className="badge bg-secondary">
                            {variant.color}
                          </span>
                        ))}
                        <button
                          className="badge bg-success border-0"
                          onClick={() => {
                            setSelectedProduct(product);
                            setShowVariantModal(true);
                          }}
                          style={{ cursor: "pointer" }}
                        >
                          + {t("products.addColor")}
                        </button>
                      </div>
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(product.id)}
                        disabled={loading}
                      >
                        {t("common.delete")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Product Modal */}
      {showCreateModal && (
        <div className="modal show d-block" tabIndex={-1}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{t("products.createProduct")}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowCreateModal(false)}
                />
              </div>
              <form onSubmit={handleCreateProduct}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">{t("products.category")}</label>
                    <select
                      className="form-select"
                      value={formData.categoryId}
                      onChange={(e) =>
                        setFormData({ ...formData, categoryId: e.target.value })
                      }
                      required
                    >
                      <option value="">{t("products.selectCategory")}</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">{t("products.brand")}</label>
                    <select
                      className="form-select"
                      value={formData.brandId}
                      onChange={(e) =>
                        setFormData({ ...formData, brandId: e.target.value })
                      }
                      required
                    >
                      <option value="">{t("products.selectBrand")}</option>
                      {brands.map((brand) => (
                        <option key={brand.id} value={brand.id}>
                          {brand.name}
                        </option>
                      ))}
                    </select>
                    <div className="form-text">
                      {t("products.dontSeeBrand")} <a href="/dashboard/brands">{t("products.manageBrands")}</a>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">{t("products.code")}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({ ...formData, code: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">{t("products.description")}</label>
                    <textarea
                      className="form-control"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      rows={3}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowCreateModal(false)}
                  >
                    {t("common.cancel")}
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? t("common.loading") : t("products.createProduct")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {showCreateModal && <div className="modal-backdrop show" />}

      {/* Add Variant Modal */}
      {showVariantModal && selectedProduct && (
        <div className="modal show d-block" tabIndex={-1}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {t("products.addColorTo")} {selectedProduct.brand.name} {selectedProduct.code}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowVariantModal(false)}
                />
              </div>
              <form onSubmit={handleCreateVariant}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">{t("products.color")}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={variantData.color}
                      onChange={(e) =>
                        setVariantData({ ...variantData, color: e.target.value })
                      }
                      placeholder={t("products.colorPlaceholder")}
                      required
                    />
                  </div>
                  <div className="alert alert-info">
                    <small>
                      <strong>{t("products.existingColors")}:</strong>{" "}
                      {selectedProduct.variants.map((v) => v.color).join(", ") || t("common.none")}
                    </small>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowVariantModal(false)}
                  >
                    {t("common.cancel")}
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? t("common.loading") : t("products.addColor")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {showVariantModal && <div className="modal-backdrop show" />}
    </>
  );
}
