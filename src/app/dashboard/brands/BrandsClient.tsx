"use client";

import { useState } from "react";
import { createBrand, updateBrand, deleteBrand } from "@/actions/brand.actions";
import Alert from "@/components/Alert";
import { useTranslation } from "@/hooks/useTranslation";

interface Brand {
  id: string;
  name: string;
  createdAt: Date;
  _count?: {
    products: number;
  };
}

export default function BrandsClient({ brands }: { brands: Brand[] }) {
  const { t } = useTranslation();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [alert, setAlert] = useState<{ type: "success" | "danger"; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await createBrand(formData);

    if (!result.success) {
      setAlert({ type: "danger", message: result.error || t("brands.createError") });
    } else {
      setAlert({ type: "success", message: t("brands.brandCreated") });
      setShowCreateModal(false);
      setFormData({ name: "" });
    }

    setLoading(false);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBrand) return;

    setLoading(true);

    const result = await updateBrand(selectedBrand.id, formData);

    if (!result.success) {
      setAlert({ type: "danger", message: result.error || t("brands.updateError") });
    } else {
      setAlert({ type: "success", message: t("brands.brandUpdated") });
      setShowEditModal(false);
      setSelectedBrand(null);
      setFormData({ name: "" });
    }

    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("brands.deleteConfirm"))) return;

    setLoading(true);
    const result = await deleteBrand(id);

    if (!result.success) {
      setAlert({ type: "danger", message: result.error || t("brands.deleteError") });
    } else {
      setAlert({ type: "success", message: t("brands.brandDeleted") });
    }

    setLoading(false);
  };

  const openEditModal = (brand: Brand) => {
    setSelectedBrand(brand);
    setFormData({ name: brand.name });
    setShowEditModal(true);
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
        <h1 className="h3">{t("brands.title")}</h1>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="card-title mb-0">{t("brands.title")}</h5>
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              {t("brands.createBrand")}
            </button>
          </div>

          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>{t("brands.brandName")}</th>
                  <th>{t("brands.productsCount")}</th>
                  <th>{t("common.date")}</th>
                  <th>{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {brands.map((brand) => (
                  <tr key={brand.id}>
                    <td>
                      <strong>{brand.name}</strong>
                    </td>
                    <td>
                      <span className="badge bg-info">
                        {brand._count?.products || 0} {t("brands.products")}
                      </span>
                    </td>
                    <td>{new Date(brand.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="btn-group btn-group-sm">
                        <button
                          className="btn btn-outline-primary"
                          onClick={() => openEditModal(brand)}
                          disabled={loading}
                        >
                          {t("common.edit")}
                        </button>
                        <button
                          className="btn btn-outline-danger"
                          onClick={() => handleDelete(brand.id)}
                          disabled={loading}
                        >
                          {t("common.delete")}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {brands.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center text-muted">
                      {t("brands.noBrands")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Brand Modal */}
      {showCreateModal && (
        <div className="modal show d-block" tabIndex={-1}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{t("brands.createBrand")}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowCreateModal(false)}
                  aria-label="Close"
                />
              </div>
              <form onSubmit={handleCreate}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="brandName" className="form-label">
                      {t("brands.brandName")}
                    </label>
                    <input
                      type="text"
                      id="brandName"
                      className="form-control"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder={t("brands.brandNamePlaceholder")}
                      required
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
                    {loading ? t("common.loading") : t("brands.createBrand")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {showCreateModal && <div className="modal-backdrop show" />}

      {/* Edit Brand Modal */}
      {showEditModal && selectedBrand && (
        <div className="modal show d-block" tabIndex={-1}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{t("brands.editBrand")}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowEditModal(false)}
                  aria-label="Close"
                />
              </div>
              <form onSubmit={handleEdit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="editBrandName" className="form-label">
                      {t("brands.brandName")}
                    </label>
                    <input
                      type="text"
                      id="editBrandName"
                      className="form-control"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowEditModal(false)}
                  >
                    {t("common.cancel")}
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? t("common.loading") : t("brands.updateBrand")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {showEditModal && <div className="modal-backdrop show" />}
    </>
  );
}
