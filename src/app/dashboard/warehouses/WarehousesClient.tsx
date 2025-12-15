"use client";

import { useState } from "react";
import { WarehouseType } from "@prisma/client";
import { createWarehouse, updateWarehouse, deleteWarehouse } from "@/actions/warehouse.actions";
import Alert from "@/components/Alert";
import { useTranslation } from "@/hooks/useTranslation";

interface Warehouse {
  id: string;
  name: string;
  type: WarehouseType;
  createdAt: Date;
  _count?: {
    stocks: number;
  };
}

export default function WarehousesClient({ warehouses }: { warehouses: Warehouse[] }) {
  const { t } = useTranslation();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [alert, setAlert] = useState<{ type: "success" | "danger"; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    type: WarehouseType.PRODUCT,
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await createWarehouse(formData);

    if (result.error) {
      setAlert({ type: "danger", message: result.error });
    } else {
      setAlert({ type: "success", message: t("warehouses.warehouseCreated") });
      setShowCreateModal(false);
      setFormData({ name: "", type: WarehouseType.PRODUCT });
    }

    setLoading(false);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWarehouse) return;

    setLoading(true);

    const result = await updateWarehouse(selectedWarehouse.id, formData);

    if (result.error) {
      setAlert({ type: "danger", message: result.error });
    } else {
      setAlert({ type: "success", message: t("warehouses.warehouseUpdated") });
      setShowEditModal(false);
      setSelectedWarehouse(null);
      setFormData({ name: "", type: WarehouseType.PRODUCT });
    }

    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("warehouses.deleteConfirm"))) return;

    setLoading(true);
    const result = await deleteWarehouse(id);

    if (result.error) {
      setAlert({ type: "danger", message: result.error });
    } else {
      setAlert({ type: "success", message: t("warehouses.warehouseDeleted") });
    }

    setLoading(false);
  };

  const openEditModal = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    setFormData({ name: warehouse.name, type: warehouse.type });
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
        <h1 className="h3">{t("warehouses.title")}</h1>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="card-title mb-0">{t("warehouses.title")}</h5>
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              {t("warehouses.addNewWarehouse")}
            </button>
          </div>

          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>{t("common.name")}</th>
                  <th>{t("common.type")}</th>
                  <th>{t("warehouses.stockItems")}</th>
                  <th>{t("common.createdAt")}</th>
                  <th>{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {warehouses.map((warehouse) => (
                  <tr key={warehouse.id}>
                    <td>
                      <strong>{warehouse.name}</strong>
                    </td>
                    <td>
                      <span
                        className={`badge ${warehouse.type === "PRODUCT" ? "bg-primary" : "bg-secondary"
                          }`}
                      >
                        {warehouse.type}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-info">
                        {warehouse._count?.stocks || 0} {t("common.items")}
                      </span>
                    </td>
                    <td>{new Date(warehouse.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="btn-group btn-group-sm">
                        <button
                          className="btn btn-outline-primary"
                          onClick={() => openEditModal(warehouse)}
                          disabled={loading}
                        >
                          {t("common.edit")}
                        </button>
                        <button
                          className="btn btn-outline-danger"
                          onClick={() => handleDelete(warehouse.id)}
                          disabled={loading}
                        >
                          {t("common.delete")}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {warehouses.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-muted">
                      {t("warehouses.noWarehouses")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Warehouse Modal */}
      {showCreateModal && (
        <div className="modal show d-block" tabIndex={-1}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{t("warehouses.addNewWarehouse")}</h5>
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
                    <label htmlFor="warehouseName" className="form-label">
                      {t("warehouses.warehouseName")}
                    </label>
                    <input
                      type="text"
                      id="warehouseName"
                      className="form-control"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder={t("warehouses.namePlaceholder")}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="warehouseType" className="form-label">
                      {t("warehouses.warehouseType")}
                    </label>
                    <select
                      id="warehouseType"
                      className="form-select"
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value as WarehouseType })
                      }
                      required
                    >
                      <option value={WarehouseType.PRODUCT}>{t("warehouses.productWarehouse")}</option>
                      <option value={WarehouseType.MATERIAL}>{t("warehouses.materialWarehouse")}</option>
                    </select>
                    <div className="form-text">
                      {t("warehouses.typeDescription")}
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
                    {loading ? t("common.creating") : t("warehouses.createWarehouse")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {showCreateModal && <div className="modal-backdrop show" />}

      {/* Edit Warehouse Modal */}
      {showEditModal && selectedWarehouse && (
        <div className="modal show d-block" tabIndex={-1}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{t("warehouses.editWarehouse")}</h5>
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
                    <label htmlFor="editWarehouseName" className="form-label">
                      {t("warehouses.warehouseName")}
                    </label>
                    <input
                      type="text"
                      id="editWarehouseName"
                      className="form-control"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="editWarehouseType" className="form-label">
                      {t("warehouses.warehouseType")}
                    </label>
                    <select
                      id="editWarehouseType"
                      className="form-select"
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value as WarehouseType })
                      }
                      required
                    >
                      <option value={WarehouseType.PRODUCT}>{t("warehouses.productWarehouse")}</option>
                      <option value={WarehouseType.MATERIAL}>{t("warehouses.materialWarehouse")}</option>
                    </select>
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
                    {loading ? t("common.updating") : t("warehouses.updateWarehouse")}
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
