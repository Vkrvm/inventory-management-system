"use client";

import { useState } from "react";
import { MovementType, WarehouseType } from "@prisma/client";
import { updateStock, transferStock } from "@/actions/stock.actions";
import Alert from "@/components/Alert";
import { useTranslation } from "@/hooks/useTranslation";
import Select from "react-select";

interface Stock {
  id: string;
  warehouse: { id: string; name: string; type: WarehouseType };
  material?: { id: string; name: string; unit: { id: string; name: string; abbreviation: string } } | null;
  productVariant?: {
    id: string;
    color: string;
    product: { id: string; brandId: string; code: string; category: { name: string }; brand: { name: string } };
  } | null;
  quantity: number;
  updatedAt: Date;
}

export default function StockClient({ stocks, warehouses, materials, products, categories }: any) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"view" | "in" | "out" | "transfer">("view");

  const getTranslatedWarehouseName = (name: string) => {
    if (name === "Main Product Warehouse") return t("warehouses.mainProductWarehouse");
    if (name === "Raw Materials Warehouse") return t("warehouses.rawMaterialsWarehouse");
    return name;
  };

  // Default to first warehouse if available
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(warehouses.length > 0 ? warehouses[0].id : "");

  // Filters
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterBrand, setFilterBrand] = useState<string>("");
  const [filterColor, setFilterColor] = useState<string>("");

  const [alert, setAlert] = useState<{ type: "success" | "danger"; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // Forms state
  const [inOutForm, setInOutForm] = useState({
    warehouseId: "",
    type: "material" as "material" | "product",
    categoryId: "",
    materialId: "",
    productVariantId: "",
    quantity: 0,
    notes: "",
  });

  const [transferForm, setTransferForm] = useState({
    warehouseFromId: "",
    warehouseToId: "",
    type: "material" as "material" | "product",
    categoryId: "",
    materialId: "",
    productVariantId: "",
    quantity: 0,
    notes: "",
  });

  // Extract unique brands and colors
  const brands = Array.from(new Set(products.map((p: any) => JSON.stringify({ id: p.brand.id, name: p.brand.name })))).map((b: any) => JSON.parse(b));

  // Extract all unique colors from all product variants
  const allColors = Array.from(new Set(
    products.flatMap((p: any) => p.variants?.map((v: any) => v.color) || [])
  )).sort();

  // Filter stocks
  const filteredStocks = stocks.filter((stock: Stock) => {
    // Warehouse Filter (Always active now)
    if (stock.warehouse.id !== selectedWarehouseId) {
      return false;
    }

    // Advanced Filters (Only for Products)
    if (stock.productVariant) {
      if (filterCategory && stock.productVariant.product.category.id !== filterCategory) return false;
      if (filterBrand && stock.productVariant.product.brand.id !== filterBrand) return false;
      if (filterColor && stock.productVariant.color !== filterColor) return false;
    }

    return true;
  });

  const handleStockIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await updateStock({
      warehouseId: inOutForm.warehouseId,
      materialId: inOutForm.type === "material" ? inOutForm.materialId : undefined,
      productVariantId: inOutForm.type === "product" ? inOutForm.productVariantId : undefined,
      quantity: inOutForm.quantity,
      type: MovementType.IN,
      notes: inOutForm.notes,
    });

    if (result.error) {
      setAlert({ type: "danger", message: result.error });
    } else {
      setAlert({ type: "success", message: t("stock.stockAdded") });
      setInOutForm({ warehouseId: "", type: "material", categoryId: "", materialId: "", productVariantId: "", quantity: 0, notes: "" });
    }

    setLoading(false);
  };

  const handleStockOut = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await updateStock({
      warehouseId: inOutForm.warehouseId,
      materialId: inOutForm.type === "material" ? inOutForm.materialId : undefined,
      productVariantId: inOutForm.type === "product" ? inOutForm.productVariantId : undefined,
      quantity: inOutForm.quantity,
      type: MovementType.OUT,
      notes: inOutForm.notes,
    });

    if (result.error) {
      setAlert({ type: "danger", message: result.error });
    } else {
      setAlert({ type: "success", message: t("stock.stockRemoved") });
      setInOutForm({ warehouseId: "", type: "material", categoryId: "", materialId: "", productVariantId: "", quantity: 0, notes: "" });
    }

    setLoading(false);
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await transferStock({
      warehouseFromId: transferForm.warehouseFromId,
      warehouseToId: transferForm.warehouseToId,
      materialId: transferForm.type === "material" ? transferForm.materialId : undefined,
      productVariantId: transferForm.type === "product" ? transferForm.productVariantId : undefined,
      quantity: transferForm.quantity,
      notes: transferForm.notes,
    });

    if (result.error) {
      setAlert({ type: "danger", message: result.error });
    } else {
      setAlert({ type: "success", message: t("stock.stockTransferred") });
      setTransferForm({ warehouseFromId: "", warehouseToId: "", type: "material", categoryId: "", materialId: "", productVariantId: "", quantity: 0, notes: "" });
    }

    setLoading(false);
  };

  const getProductVariants = () => {
    const variants: any[] = [];
    products.forEach((product: any) => {
      product.variants?.forEach((variant: any) => {
        variants.push({
          ...variant,
          product: product,
        });
      });
    });
    return variants;
  };

  const productVariants = getProductVariants();

  // Format options for react-select
  const materialOptions = materials.map((m: any) => ({
    value: m.id,
    label: `${m.name} (${m.unit.abbreviation})`,
    material: m,
  }));

  const categoryOptions = categories.map((c: any) => ({
    value: c.id,
    label: c.name,
    category: c,
  }));

  const brandOptions = brands.map((b: any) => ({
    value: b.id,
    label: b.name
  }));

  const colorOptions = allColors.map((c: any) => ({
    value: c,
    label: c
  }));

  const getProductOptions = (categoryId: string) => {
    return productVariants
      .filter((v: any) => !categoryId || v.product.category.id === categoryId)
      .map((v: any) => ({
        value: v.id,
        label: `${v.product.category.name} | ${v.product.brand.name} ${v.product.code} - ${v.color}`,
        variant: v,
      }));
  };

  // Determine current warehouse type for valid filtering UI
  const selectedWarehouse = warehouses.find((w: any) => w.id === selectedWarehouseId);

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
        <h1 className="h3">{t("stock.title")}</h1>
      </div>

      {/* Main Mode Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button className={`nav-link ${activeTab === "view" ? "active" : ""}`} onClick={() => setActiveTab("view")}>
            {t("stock.viewStock")}
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === "in" ? "active" : ""}`} onClick={() => setActiveTab("in")}>
            {t("stock.stockIn")}
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === "out" ? "active" : ""}`} onClick={() => setActiveTab("out")}>
            {t("stock.stockOut")}
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === "transfer" ? "active" : ""}`} onClick={() => setActiveTab("transfer")}>
            {t("stock.transfer")}
          </button>
        </li>
      </ul>

      {activeTab === "view" && (
        <div>
          {/* Warehouse Filtering Tabs (Pills) */}
          <ul className="nav nav-pills mb-3">
            {/* All Warehouses Option Removed */}
            {warehouses.map((w: any) => (
              <li className="nav-item" key={w.id}>
                <button
                  className={`nav-link ${selectedWarehouseId === w.id ? "active" : ""}`}
                  onClick={() => {
                    setSelectedWarehouseId(w.id);
                    // Reset filters on warehouse change
                    setFilterCategory("");
                    setFilterBrand("");
                    setFilterColor("");
                  }}
                >
                  {getTranslatedWarehouseName(w.name)}
                </button>
              </li>
            ))}
          </ul>

          {/* Filters for Product Warehouse */}
          {selectedWarehouse?.type === "PRODUCT" && (
            <div className="row mb-4">
              <div className="col-md-3">
                <Select
                  options={categoryOptions}
                  value={categoryOptions.find((o: any) => o.value === filterCategory) || null}
                  onChange={(val: any) => setFilterCategory(val?.value || "")}
                  placeholder={t("products.selectCategory")}
                  isClearable
                />
              </div>
              <div className="col-md-3">
                <Select
                  options={brandOptions}
                  value={brandOptions.find((o: any) => o.value === filterBrand) || null}
                  onChange={(val: any) => setFilterBrand(val?.value || "")}
                  placeholder={t("products.selectBrand")}
                  isClearable
                />
              </div>
              <div className="col-md-3">
                <Select
                  options={colorOptions}
                  value={colorOptions.find((o: any) => o.value === filterColor) || null}
                  onChange={(val: any) => setFilterColor(val?.value || "")}
                  placeholder={t("products.color")}
                  isClearable
                />
              </div>
              <div className="col-md-3 d-flex align-items-center">
                <button className="btn btn-outline-secondary w-100" onClick={() => {
                  setFilterCategory("");
                  setFilterBrand("");
                  setFilterColor("");
                }}>
                  {t("common.filter")} ({t("common.delete")})
                </button>
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-body">
              <h5 className="card-title mb-3">{t("stock.currentStockLevels")}</h5>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>{t("stock.warehouse")}</th>
                      <th>{t("stock.item")}</th>
                      <th>{t("common.type")}</th>
                      <th>{t("stock.quantity")}</th>
                      <th>{t("common.lastUpdated")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStocks.map((stock: Stock) => (
                      <tr key={stock.id}>
                        <td>
                          <strong>{getTranslatedWarehouseName(stock.warehouse.name)}</strong>
                          <br />
                          <span className="badge bg-secondary">
                            {stock.warehouse.type === "PRODUCT"
                              ? t("warehouses.productWarehouse")
                              : t("warehouses.materialWarehouse")}
                          </span>
                        </td>
                        <td>
                          {stock.material && <span>{stock.material.name}</span>}
                          {stock.productVariant && (
                            <span>
                              <strong>{stock.productVariant.product.category.name}</strong><br />
                              <small>{stock.productVariant.product.brand.name} {stock.productVariant.product.code} - {stock.productVariant.color}</small>
                            </span>
                          )}
                        </td>
                        <td>
                          {stock.material && <span className="badge bg-info">{t("common.material")}</span>}
                          {stock.productVariant && <span className="badge bg-primary">{t("common.product")}</span>}
                        </td>
                        <td>
                          <strong className={stock.quantity < 10 ? "text-danger" : ""}>{stock.quantity}</strong>
                          {stock.material && <span className="text-muted"> {stock.material.unit.abbreviation}</span>}
                          {stock.productVariant && <span className="text-muted"> {t("common.pcs")}</span>}
                        </td>
                        <td>{new Date(stock.updatedAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {filteredStocks.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center text-muted">
                          {t("stock.noStockRecords")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "in" && (
        <div className="card">
          <div className="card-body">
            <h5 className="card-title mb-3">{t("stock.addStockIn")}</h5>
            <form onSubmit={handleStockIn}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">{t("stock.warehouse")}</label>
                  <select className="form-select" value={inOutForm.warehouseId} onChange={(e) => setInOutForm({ ...inOutForm, warehouseId: e.target.value })} required>
                    <option value="">{t("stock.selectWarehouse")}</option>
                    {warehouses.map((w: any) => (
                      <option key={w.id} value={w.id}>
                        {getTranslatedWarehouseName(w.name)} ({w.type})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">{t("stock.itemType")}</label>
                  <select className="form-select" value={inOutForm.type} onChange={(e) => setInOutForm({ ...inOutForm, type: e.target.value as any, categoryId: "", materialId: "", productVariantId: "" })}>
                    <option value="material">{t("common.material")}</option>
                    <option value="product">{t("common.product")}</option>
                  </select>
                </div>
              </div>

              {inOutForm.type === "product" && (
                <div className="mb-3">
                  <label className="form-label">{t("common.category")}</label>
                  <Select
                    options={categoryOptions}
                    value={categoryOptions.find((opt: any) => opt.value === inOutForm.categoryId) || null}
                    onChange={(option: any) => setInOutForm({ ...inOutForm, categoryId: option?.value || "", productVariantId: "" })}
                    placeholder={t("stock.selectCategory")}
                    isClearable
                    isSearchable
                    styles={{
                      control: (base) => ({
                        ...base,
                        minHeight: '38px',
                      }),
                    }}
                  />
                </div>
              )}

              {inOutForm.type === "material" && (
                <div className="mb-3">
                  <label className="form-label">{t("common.material")}</label>
                  <Select
                    options={materialOptions}
                    value={materialOptions.find((opt: any) => opt.value === inOutForm.materialId) || null}
                    onChange={(option: any) => setInOutForm({ ...inOutForm, materialId: option?.value || "" })}
                    placeholder={t("stock.selectMaterial")}
                    isClearable
                    isSearchable
                    styles={{
                      control: (base) => ({
                        ...base,
                        minHeight: '38px',
                      }),
                    }}
                  />
                </div>
              )}

              {inOutForm.type === "product" && inOutForm.categoryId && (
                <div className="mb-3">
                  <label className="form-label">{t("common.product")}</label>
                  <Select
                    options={getProductOptions(inOutForm.categoryId)}
                    value={getProductOptions(inOutForm.categoryId).find((opt: any) => opt.value === inOutForm.productVariantId) || null}
                    onChange={(option: any) => setInOutForm({ ...inOutForm, productVariantId: option?.value || "" })}
                    placeholder={t("stock.selectProductVariant")}
                    isClearable
                    isSearchable
                    styles={{
                      control: (base) => ({
                        ...base,
                        minHeight: '38px',
                      }),
                    }}
                  />
                </div>
              )}

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">{t("stock.quantity")}</label>
                  <input type="number" className="form-control" value={inOutForm.quantity} onChange={(e) => setInOutForm({ ...inOutForm, quantity: parseInt(e.target.value) || 0 })} min="1" required />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">{t("common.notes")}</label>
                  <input type="text" className="form-control" value={inOutForm.notes} onChange={(e) => setInOutForm({ ...inOutForm, notes: e.target.value })} placeholder={t("common.optionalNotes")} />
                </div>
              </div>

              <button type="submit" className="btn btn-success" disabled={loading}>
                {loading ? t("common.processing") : t("stock.addStock")}
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === "out" && (
        <div className="card">
          <div className="card-body">
            <h5 className="card-title mb-3">{t("stock.removeStockOut")}</h5>
            <form onSubmit={handleStockOut}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">{t("stock.warehouse")}</label>
                  <select className="form-select" value={inOutForm.warehouseId} onChange={(e) => setInOutForm({ ...inOutForm, warehouseId: e.target.value })} required>
                    <option value="">{t("stock.selectWarehouse")}</option>
                    {warehouses.map((w: any) => (
                      <option key={w.id} value={w.id}>
                        {getTranslatedWarehouseName(w.name)} ({w.type})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">{t("stock.itemType")}</label>
                  <select className="form-select" value={inOutForm.type} onChange={(e) => setInOutForm({ ...inOutForm, type: e.target.value as any, categoryId: "", materialId: "", productVariantId: "" })}>
                    <option value="material">{t("common.material")}</option>
                    <option value="product">{t("common.product")}</option>
                  </select>
                </div>
              </div>

              {inOutForm.type === "product" && (
                <div className="mb-3">
                  <label className="form-label">{t("common.category")}</label>
                  <Select
                    options={categoryOptions}
                    value={categoryOptions.find((opt: any) => opt.value === inOutForm.categoryId) || null}
                    onChange={(option: any) => setInOutForm({ ...inOutForm, categoryId: option?.value || "", productVariantId: "" })}
                    placeholder={t("stock.selectCategory")}
                    isClearable
                    isSearchable
                    styles={{
                      control: (base) => ({
                        ...base,
                        minHeight: '38px',
                      }),
                    }}
                  />
                </div>
              )}

              {inOutForm.type === "material" && (
                <div className="mb-3">
                  <label className="form-label">{t("common.material")}</label>
                  <Select
                    options={materialOptions}
                    value={materialOptions.find((opt: any) => opt.value === inOutForm.materialId) || null}
                    onChange={(option: any) => setInOutForm({ ...inOutForm, materialId: option?.value || "" })}
                    placeholder={t("stock.selectMaterial")}
                    isClearable
                    isSearchable
                    styles={{
                      control: (base) => ({
                        ...base,
                        minHeight: '38px',
                      }),
                    }}
                  />
                </div>
              )}

              {inOutForm.type === "product" && inOutForm.categoryId && (
                <div className="mb-3">
                  <label className="form-label">{t("common.product")}</label>
                  <Select
                    options={getProductOptions(inOutForm.categoryId)}
                    value={getProductOptions(inOutForm.categoryId).find((opt: any) => opt.value === inOutForm.productVariantId) || null}
                    onChange={(option: any) => setInOutForm({ ...inOutForm, productVariantId: option?.value || "" })}
                    placeholder={t("stock.selectProductVariant")}
                    isClearable
                    isSearchable
                    styles={{
                      control: (base) => ({
                        ...base,
                        minHeight: '38px',
                      }),
                    }}
                  />
                </div>
              )}

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">{t("stock.quantity")}</label>
                  <input type="number" className="form-control" value={inOutForm.quantity} onChange={(e) => setInOutForm({ ...inOutForm, quantity: parseInt(e.target.value) || 0 })} min="1" required />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">{t("common.notes")}</label>
                  <input type="text" className="form-control" value={inOutForm.notes} onChange={(e) => setInOutForm({ ...inOutForm, notes: e.target.value })} placeholder={t("common.optionalNotes")} />
                </div>
              </div>

              <button type="submit" className="btn btn-danger" disabled={loading}>
                {loading ? t("common.processing") : t("stock.removeStock")}
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === "transfer" && (
        <div className="card">
          <div className="card-body">
            <h5 className="card-title mb-3">{t("stock.transferBetweenWarehouses")}</h5>
            <form onSubmit={handleTransfer}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">{t("stock.fromWarehouse")}</label>
                  <select className="form-select" value={transferForm.warehouseFromId} onChange={(e) => setTransferForm({ ...transferForm, warehouseFromId: e.target.value })} required>
                    <option value="">{t("stock.selectSourceWarehouse")}</option>
                    {warehouses.map((w: any) => (
                      <option key={w.id} value={w.id}>
                        {getTranslatedWarehouseName(w.name)} ({w.type})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">{t("stock.toWarehouse")}</label>
                  <select className="form-select" value={transferForm.warehouseToId} onChange={(e) => setTransferForm({ ...transferForm, warehouseToId: e.target.value })} required>
                    <option value="">{t("stock.selectDestinationWarehouse")}</option>
                    {warehouses.map((w: any) => (
                      <option key={w.id} value={w.id} disabled={w.id === transferForm.warehouseFromId}>
                        {getTranslatedWarehouseName(w.name)} ({w.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">{t("stock.itemType")}</label>
                <select className="form-select" value={transferForm.type} onChange={(e) => setTransferForm({ ...transferForm, type: e.target.value as any, categoryId: "", materialId: "", productVariantId: "" })}>
                  <option value="material">{t("common.material")}</option>
                  <option value="product">{t("common.product")}</option>
                </select>
              </div>

              {transferForm.type === "product" && (
                <div className="mb-3">
                  <label className="form-label">{t("common.category")}</label>
                  <Select
                    options={categoryOptions}
                    value={categoryOptions.find((opt: any) => opt.value === transferForm.categoryId) || null}
                    onChange={(option: any) => setTransferForm({ ...transferForm, categoryId: option?.value || "", productVariantId: "" })}
                    placeholder={t("stock.selectCategory")}
                    isClearable
                    isSearchable
                    styles={{
                      control: (base) => ({
                        ...base,
                        minHeight: '38px',
                      }),
                    }}
                  />
                </div>
              )}

              {transferForm.type === "material" && (
                <div className="mb-3">
                  <label className="form-label">{t("common.material")}</label>
                  <Select
                    options={materialOptions}
                    value={materialOptions.find((opt: any) => opt.value === transferForm.materialId) || null}
                    onChange={(option: any) => setTransferForm({ ...transferForm, materialId: option?.value || "" })}
                    placeholder={t("stock.selectMaterial")}
                    isClearable
                    isSearchable
                    styles={{
                      control: (base) => ({
                        ...base,
                        minHeight: '38px',
                      }),
                    }}
                  />
                </div>
              )}

              {transferForm.type === "product" && transferForm.categoryId && (
                <div className="mb-3">
                  <label className="form-label">{t("common.product")}</label>
                  <Select
                    options={getProductOptions(transferForm.categoryId)}
                    value={getProductOptions(transferForm.categoryId).find((opt: any) => opt.value === transferForm.productVariantId) || null}
                    onChange={(option: any) => setTransferForm({ ...transferForm, productVariantId: option?.value || "" })}
                    placeholder={t("stock.selectProductVariant")}
                    isClearable
                    isSearchable
                    styles={{
                      control: (base) => ({
                        ...base,
                        minHeight: '38px',
                      }),
                    }}
                  />
                </div>
              )}

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">{t("stock.quantity")}</label>
                  <input type="number" className="form-control" value={transferForm.quantity} onChange={(e) => setTransferForm({ ...transferForm, quantity: parseInt(e.target.value) || 0 })} min="1" required />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">{t("common.notes")}</label>
                  <input type="text" className="form-control" value={transferForm.notes} onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })} placeholder={t("common.optionalNotes")} />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? t("common.processing") : t("stock.transferStock")}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
