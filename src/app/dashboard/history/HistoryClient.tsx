"use client";

import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { HistoryDetails } from "./components/HistoryDetails";

export default function HistoryClient({ history }: any) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");

  const filteredHistory = history.filter((h: any) => {
    const matchesAction = !filter || h.action.toLowerCase().includes(filter.toLowerCase());
    const matchesEntity = !entityFilter || h.entity === entityFilter;
    return matchesAction && matchesEntity;
  });

  const uniqueEntities = [...new Set(history.map((h: any) => h.entity).filter(Boolean))];

  const getActionBadge = (action: string) => {
    if (action.includes("CREATE")) return "bg-success";
    if (action.includes("UPDATE") || action.includes("EDIT")) return "bg-primary";
    if (action.includes("DELETE")) return "bg-danger";
    if (action.includes("STOCK")) return "bg-info";
    if (action.includes("PAYMENT")) return "bg-warning";
    return "bg-secondary";
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3">{t("history.title")}</h1>
      </div>
      <div className="card" style={{ height: "80%", overflowY: "scroll" }}>
        <div className="card-body">
          <div className="row mb-3">
            <div className="col-md-6">
              <input
                type="text"
                className="form-control"
                placeholder={t("history.searchByAction")}
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
            <div className="col-md-6">
              <select
                className="form-select"
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
                aria-label={t("history.filterByEntity")}
              >
                <option value="">{t("history.allEntities")}</option>
                {uniqueEntities.map((entity: string) => (
                  <option key={entity} value={entity}>
                    {entity}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>{t("history.dateTime")}</th>
                  <th>{t("history.user")}</th>
                  <th>{t("history.action")}</th>
                  <th>{t("history.entity")}</th>
                  <th>{t("history.details")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((h: any) => (
                  <tr key={h.id}>
                    <td>
                      <small>
                        {new Date(h.createdAt).toLocaleString()}
                      </small>
                    </td>
                    <td>
                      <strong>{h.user.name}</strong>
                      <br />
                      <small className="text-muted">{h.user.role}</small>
                    </td>
                    <td>
                      <span className={`badge ${getActionBadge(h.action)}`}>
                        {h.action.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td>
                      {h.entity && <span className="badge bg-light text-dark">{h.entity}</span>}
                    </td>
                    <td>
                      <HistoryDetails action={h.action} details={h.details} />
                    </td>
                  </tr>
                ))}
                {filteredHistory.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-muted">
                      {t("history.noActivityFound")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="text-muted mt-3">
            <small>{t("history.showing")} {filteredHistory.length} {t("history.of")} {history.length} {t("history.activities")} ({t("history.last100")})</small>
          </div>
        </div>
      </div>
    </>
  );
}
