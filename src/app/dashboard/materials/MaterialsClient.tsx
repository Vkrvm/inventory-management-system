"use client";

import { useState } from "react";
import { createMaterial, updateMaterial, deleteMaterial } from "@/actions/material.actions";
import Alert from "@/components/Alert";
import { useTranslation } from "@/hooks/useTranslation";

interface Unit {
  id: string;
  name: string;
  abbreviation: string;
}

interface Material {
  id: string;
  name: string;
  unit: Unit;
  createdAt: Date;
  _count?: {
    stocks: number;
  };
}

export default function MaterialsClient({ materials, units }: { materials: Material[]; units: Unit[] }) {
  const { t } = useTranslation();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [alert, setAlert] = useState<{ type: "success" | "danger"; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    unitId: units[0]?.id || "",
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await createMaterial(formData);

    if (result.error) {
      setAlert({ type: "danger", message: result.error });
    } else {
      setAlert({ type: "success", message: t("materials.materialCreated") });
      setShowCreateModal(false);
      setFormData({ name: "", unitId: units[0]?.id || "" });
    }

    setLoading(false);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterial) return;

    setLoading(true);

    const result = await updateMaterial(selectedMaterial.id, formData);

    if (result.error) {
      setAlert({ type: "danger", message: result.error });
    } else {
      setAlert({ type: "success", message: t("materials.materialUpdated") });
      setShowEditModal(false);
      setSelectedMaterial(null);
      setFormData({ name: "", unitId: units[0]?.id || "" });
    }

    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("materials.deleteConfirm"))) return;

    setLoading(true);
    const result = await deleteMaterial(id);

    if (result.error) {
      setAlert({ type: "danger", message: result.error });
    } else {
      setAlert({ type: "success", message: t("materials.materialDeleted") });
    }

    setLoading(false);
  };

  const openEditModal = (material: Material) => {
    setSelectedMaterial(material);
    setFormData({ name: material.name, unitId: material.unit.id });
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
        <h1 className="h3">{t("materials.title")}</h1>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="card-title mb-0">{t("materials.title")}</h5>
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              {t("materials.addNewMaterial")}
            </button>
          </div>

          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>{t("materials.materialName")}</th>
                  <th>{t("materials.unit")}</th>
                  <th>{t("materials.stockRecords")}</th>
                  <th>{t("common.createdAt")}</th>
                  <th>{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((material) => (
                  <tr key={material.id}>
                    <td>
                      <strong>{material.name}</strong>
                    </td>
                    <td>
                      <span className="badge bg-secondary">
                        {material.unit.abbreviation}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-info">
                        {material._count?.stocks || 0} {t("common.records")}
                      </span>
                    </td>
                    <td>{new Date(material.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="btn-group btn-group-sm">
                        <button
                          className="btn btn-outline-primary"
                          onClick={() => openEditModal(material)}
                          disabled={loading}
                        >
                          {t("common.edit")}
                        </button>
                        <button
                          className="btn btn-outline-danger"
                          onClick={() => handleDelete(material.id)}
                          disabled={loading}
                        >
                          {t("common.delete")}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {materials.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-muted">
                      {t("materials.noMaterials")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Material Modal */}
      {showCreateModal && (
        <div className="modal show d-block" tabIndex={-1}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{t("materials.addNewMaterial")}</h5>
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
                    <label htmlFor="materialName" className="form-label">
                      {t("materials.materialName")}
                    </label>
                    <input
                      type="text"
                      id="materialName"
                      className="form-control"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder={t("materials.namePlaceholder")}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="materialUnit" className="form-label">
                      {t("materials.unitOfMeasurement")}
                    </label>
                    <select
                      id="materialUnit"
                      className="form-select"
                      value={formData.unitId}
                      onChange={(e) =>
                        setFormData({ ...formData, unitId: e.target.value })
                      }
                      required
                    >
                      {units.map((unit) => (
                        <option key={unit.id} value={unit.id}>
                          {unit.name} ({unit.abbreviation})
                        </option>
                      ))}
                    </select>
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
                    {loading ? t("common.creating") : t("materials.createMaterial")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {showCreateModal && <div className="modal-backdrop show" />}

      {/* Edit Material Modal */}
      {showEditModal && selectedMaterial && (
        <div className="modal show d-block" tabIndex={-1}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{t("materials.editMaterial")}</h5>
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
                    <label htmlFor="editMaterialName" className="form-label">
                      {t("materials.materialName")}
                    </label>
                    <input
                      type="text"
                      id="editMaterialName"
                      className="form-control"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="editMaterialUnit" className="form-label">
                      {t("materials.unitOfMeasurement")}
                    </label>
                    <select
                      id="editMaterialUnit"
                      className="form-select"
                      value={formData.unitId}
                      onChange={(e) =>
                        setFormData({ ...formData, unitId: e.target.value })
                      }
                      required
                    >
                      {units.map((unit) => (
                        <option key={unit.id} value={unit.id}>
                          {unit.name} ({unit.abbreviation})
                        </option>
                      ))}
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
                    {loading ? t("common.updating") : t("materials.updateMaterial")}
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
