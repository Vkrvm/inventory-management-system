"use client";

import { useState } from "react";
import { UserRole } from "@prisma/client";
import {
  createUser,
  updateUserRole,
  resetUserPassword,
  toggleUserStatus,
} from "@/actions/user.actions";
import Alert from "@/components/Alert";
import { useTranslation } from "@/hooks/useTranslation";

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
}

export default function UserManagementClient({ users }: { users: User[] }) {
  const { t } = useTranslation();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "danger"; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    role: UserRole.SALES as UserRole,
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await createUser(formData);

    if (result.error) {
      setAlert({ type: "danger", message: result.error });
    } else {
      setAlert({ type: "success", message: t("users.userCreated") });
      setShowCreateModal(false);
      setFormData({ email: "", password: "", name: "", role: UserRole.SALES as UserRole });
    }

    setLoading(false);
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    setLoading(true);
    const result = await toggleUserStatus(userId, !currentStatus);

    if (result.error) {
      setAlert({ type: "danger", message: result.error });
    } else {
      setAlert({
        type: "success",
        message: !currentStatus ? t("users.userActivated") : t("users.userDeactivated"),
      });
    }

    setLoading(false);
  };

  const handleResetPassword = async (userId: string) => {
    const newPassword = prompt(t("users.enterNewPassword"));
    if (!newPassword) return;

    setLoading(true);
    const result = await resetUserPassword(userId, newPassword);

    if (result.error) {
      setAlert({ type: "danger", message: result.error });
    } else {
      setAlert({ type: "success", message: t("users.passwordResetSuccess") });
    }

    setLoading(false);
  };

  const handleChangeRole = async (userId: string, newRole: UserRole) => {
    setLoading(true);
    const result = await updateUserRole(userId, newRole);

    if (result.error) {
      setAlert({ type: "danger", message: result.error });
    } else {
      setAlert({ type: "success", message: t("users.roleUpdated") });
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
        <h1 className="h3">{t("users.title")}</h1>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="card-title mb-0">{t("users.title")}</h5>
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              {t("users.createUser")}
            </button>
          </div>

          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>{t("users.name")}</th>
                  <th>{t("users.email")}</th>
                  <th>{t("users.role")}</th>
                  <th>{t("users.status")}</th>
                  <th>{t("users.created")}</th>
                  <th>{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <select
                        className="form-select form-select-sm"
                        value={user.role}
                        onChange={(e) =>
                          handleChangeRole(user.id, e.target.value as UserRole)
                        }
                        disabled={loading}
                      >
                        {Object.values(UserRole).map((role) => (
                          <option key={role} value={role}>
                            {t(`users.roles.${role}`)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <span
                        className={`badge ${user.isActive ? "bg-success" : "bg-danger"}`}
                      >
                        {user.isActive ? t("users.active") : t("users.inactive")}
                      </span>
                    </td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-warning me-2"
                        onClick={() => handleResetPassword(user.id)}
                        disabled={loading}
                      >
                        {t("users.resetPassword")}
                      </button>
                      <button
                        className={`btn btn-sm ${user.isActive ? "btn-outline-danger" : "btn-outline-success"}`}
                        onClick={() => handleToggleStatus(user.id, user.isActive)}
                        disabled={loading}
                      >
                        {user.isActive ? t("users.deactivate") : t("users.activate")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div className="modal show d-block" tabIndex={-1}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{t("users.createUser")}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowCreateModal(false)}
                />
              </div>
              <form onSubmit={handleCreate}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">{t("users.name")}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">{t("users.email")}</label>
                    <input
                      type="email"
                      className="form-control"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">{t("users.password")}</label>
                    <input
                      type="password"
                      className="form-control"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">{t("users.role")}</label>
                    <select
                      className="form-select"
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          role: e.target.value as UserRole,
                        })
                      }
                    >
                      {Object.values(UserRole).map((role) => (
                        <option key={role} value={role}>
                          {t(`users.roles.${role}`)}
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
                    {loading ? t("common.creating") : t("users.createUser")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {showCreateModal && <div className="modal-backdrop show" />}
    </>
  );
}
