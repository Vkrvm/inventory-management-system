"use client";

import { useState } from "react";
import { createUnit, updateUnit, deleteUnit } from "@/actions/unit.actions";
import Alert from "@/components/Alert";
import { useTranslation } from "@/hooks/useTranslation";

interface Unit {
  id: string;
  name: string;
  abbreviation: string;
  createdAt: Date;
  _count?: {
    materials: number;
  };
}

export default function UnitsClient({ units }: { units: Unit[] }) {
  const { t } = useTranslation();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [alert, setAlert] = useState<{ type: "success" | "danger"; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    abbreviation: "",
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await createUnit(formData);

    if (result.error) {
      setAlert({ type: "danger", message: result.error });
    } else {
      setAlert({ type: "success", message: t("units.unitCreated") });
      setShowCreateModal(false);
      setFormData({ name: "", abbreviation: "" });
    }

    setLoading(false);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnit) return;

    setLoading(true);

    const result = await updateUnit(selectedUnit.id, formData);

    if (result.error) {
      setAlert({ type: "danger", message: result.error });
    } else {
      setAlert({ type: "success", message: t("units.unitUpdated") });
      setShowEditModal(false);
      setSelectedUnit(null);
      setFormData({ name: "", abbreviation: "" });
    }

    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("units.deleteConfirm"))) return;

    setLoading(true);
    const result = await deleteUnit(id);

    if (result.error) {
      setAlert({ type: "danger", message: result.error });
    } else {
      setAlert({ type: "success", message: t("units.unitDeleted") });
    }

    setLoading(false);
  };

  const openEditModal = (unit: Unit) => {
    setSelectedUnit(unit);
    setFormData({ name: unit.name, abbreviation: unit.abbreviation });
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

      <div className="card">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="card-title mb-0">{t("units.title")}</h5>
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              {t("units.addNewUnit")}
            </button>
          </div>

          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>{t("units.unitName")}</th>
                  <th>{t("units.abbreviation")}</th>
                  <th>{t("units.materialsCount")}</th>
                  <th>{t("common.createdAt")}</th>
                  <th>{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {units.map((unit) => (
                  <tr key={unit.id}>
                    <td>
                      <strong>{unit.name}</strong>
                    </td>
                    <td>
                      <span className="badge bg-secondary">
                        {unit.abbreviation}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-info">
                        {unit._count?.materials || 0} {t("materials.title").toLowerCase()}
                      </span>
                    </td>
                    <td>{new Date(unit.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="btn-group btn-group-sm">
                        <button
                          className="btn btn-outline-primary"
                          onClick={() => openEditModal(unit)}
                          disabled={loading}
                        >
                          {t("common.edit")}
                        </button>
                        <button
                          className="btn btn-outline-danger"
                          onClick={() => handleDelete(unit.id)}
                          disabled={loading}
                        >
                          {t("common.delete")}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {units.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-muted">
                      {t("units.noUnits")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Unit Modal */}
      {showCreateModal && (
        <div className="modal show d-block" tabIndex={-1}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{t("units.addNewUnit")}</h5>
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
                    <label htmlFor="unitName" className="form-label">
                      {t("units.unitName")}
                    </label>
                    <input
                      type="text"
                      id="unitName"
                      className="form-control"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder={t("units.namePlaceholder")}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="unitAbbreviation" className="form-label">
                      {t("units.abbreviation")}
                    </label>
                    <input
                      type="text"
                      id="unitAbbreviation"
                      className="form-control"
                      value={formData.abbreviation}
                      onChange={(e) =>
                        setFormData({ ...formData, abbreviation: e.target.value })
                      }
                      placeholder={t("units.abbreviationPlaceholder")}
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
                    {loading ? t("common.creating") : t("units.createUnit")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {showCreateModal && <div className="modal-backdrop show" />}

      {/* Edit Unit Modal */}
      {showEditModal && selectedUnit && (
        <div className="modal show d-block" tabIndex={-1}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{t("units.editUnit")}</h5>
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
                    <label htmlFor="editUnitName" className="form-label">
                      {t("units.unitName")}
                    </label>
                    <input
                      type="text"
                      id="editUnitName"
                      className="form-control"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="editUnitAbbreviation" className="form-label">
                      {t("units.abbreviation")}
                    </label>
                    <input
                      type="text"
                      id="editUnitAbbreviation"
                      className="form-control"
                      value={formData.abbreviation}
                      onChange={(e) =>
                        setFormData({ ...formData, abbreviation: e.target.value })
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
                    {loading ? t("common.updating") : t("units.updateUnit")}
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
