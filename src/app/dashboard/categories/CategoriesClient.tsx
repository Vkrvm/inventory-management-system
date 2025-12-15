"use client";

import { useState } from "react";
import { createCategory, updateCategory, deleteCategory } from "@/actions/category.actions";
import Alert from "@/components/Alert";
import { useTranslation } from "@/hooks/useTranslation";

interface Category {
  id: string;
  name: string;
  createdAt: Date;
  _count?: {
    products: number;
  };
}

export default function CategoriesClient({ categories }: { categories: Category[] }) {
  const { t } = useTranslation();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [alert, setAlert] = useState<{ type: "success" | "danger"; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await createCategory(formData);

    if (!result.success) {
      setAlert({ type: "danger", message: result.error || t("categories.createError") });
    } else {
      setAlert({ type: "success", message: t("categories.categoryCreated") });
      setShowCreateModal(false);
      setFormData({ name: "" });
    }

    setLoading(false);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) return;

    setLoading(true);

    const result = await updateCategory(selectedCategory.id, formData);

    if (!result.success) {
      setAlert({ type: "danger", message: result.error || t("categories.updateError") });
    } else {
      setAlert({ type: "success", message: t("categories.categoryUpdated") });
      setShowEditModal(false);
      setSelectedCategory(null);
      setFormData({ name: "" });
    }

    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("categories.deleteConfirm"))) return;

    setLoading(true);
    const result = await deleteCategory(id);

    if (!result.success) {
      setAlert({ type: "danger", message: result.error || t("categories.deleteError") });
    } else {
      setAlert({ type: "success", message: t("categories.categoryDeleted") });
    }

    setLoading(false);
  };

  const openEditModal = (category: Category) => {
    setSelectedCategory(category);
    setFormData({ name: category.name });
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
        <h1 className="h3">{t("categories.title")}</h1>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="card-title mb-0">{t("categories.title")}</h5>
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              {t("categories.createCategory")}
            </button>
          </div>

          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>{t("categories.categoryName")}</th>
                  <th>{t("categories.productsCount")}</th>
                  <th>{t("common.date")}</th>
                  <th>{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td>
                      <strong>{category.name}</strong>
                    </td>
                    <td>
                      <span className="badge bg-info">
                        {category._count?.products || 0} {t("categories.products")}
                      </span>
                    </td>
                    <td>{new Date(category.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="btn-group btn-group-sm">
                        <button
                          className="btn btn-outline-primary"
                          onClick={() => openEditModal(category)}
                          disabled={loading}
                        >
                          {t("common.edit")}
                        </button>
                        <button
                          className="btn btn-outline-danger"
                          onClick={() => handleDelete(category.id)}
                          disabled={loading}
                        >
                          {t("common.delete")}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {categories.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center text-muted">
                      {t("categories.noCategories")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Category Modal */}
      {showCreateModal && (
        <div className="modal show d-block" tabIndex={-1}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{t("categories.createCategory")}</h5>
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
                    <label htmlFor="categoryName" className="form-label">
                      {t("categories.categoryName")}
                    </label>
                    <input
                      type="text"
                      id="categoryName"
                      className="form-control"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder={t("categories.categoryNamePlaceholder")}
                      required
                    />
                    <div className="form-text">
                      {t("categories.uppercaseNote")}
                    </div>
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
                    {loading ? t("common.loading") : t("categories.createCategory")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {showCreateModal && <div className="modal-backdrop show" />}

      {/* Edit Category Modal */}
      {showEditModal && selectedCategory && (
        <div className="modal show d-block" tabIndex={-1}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{t("categories.editCategory")}</h5>
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
                    <label htmlFor="editCategoryName" className="form-label">
                      {t("categories.categoryName")}
                    </label>
                    <input
                      type="text"
                      id="editCategoryName"
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
                    {loading ? t("common.loading") : t("categories.updateCategory")}
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
