import { useEffect, useState } from "react";
import Link from "next/link";
import AdminLayout from "@/components/Layout/AdminLayout";
import ConfirmModal from "@/components/UI/ConfirmModal";
import DataTable, { Column } from "@/components/UI/DataTable";
import { toast } from "@/lib/toast";
import { deleteJobOrder, getJobOrder, getJobOrders, JobOrder } from "@/services/jobOrderService";

const sources = ["", "Roces Branch", "Tandang Sora Head Office"];
const deliveryTypes = ["", "Door-to-door", "Pickup", "Store delivery"];

function ManageJobOrders() {
  const [orders, setOrders] = useState<JobOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState("");
  const [deliveryType, setDeliveryType] = useState("");
  const [orderStart, setOrderStart] = useState("");
  const [orderEnd, setOrderEnd] = useState("");
  const [neededStart, setNeededStart] = useState("");
  const [neededEnd, setNeededEnd] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [detailOrder, setDetailOrder] = useState<JobOrder | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<JobOrder | null>(null);

  const fetchOrders = async (opts?: { silent?: boolean }) => {
    try {
      if (!opts?.silent) setLoading(true);
      const res = await getJobOrders({
        search,
        source,
        delivery_type: deliveryType,
        order_date_from: orderStart,
        order_date_to: orderEnd,
        date_needed_from: neededStart,
        date_needed_to: neededEnd,
        page: currentPage,
        per_page: perPage,
      }, opts);
      setOrders(Array.isArray(res?.data) ? res.data : []);
      setTotalPages(res?.last_page ?? 1);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load job orders");
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => fetchOrders({ silent: true }), 350);
    return () => clearTimeout(timeout);
  }, [currentPage, deliveryType, neededEnd, neededStart, orderEnd, orderStart, perPage, search, source]);

  const resetFilters = () => {
    setSource("");
    setDeliveryType("");
    setOrderStart("");
    setOrderEnd("");
    setNeededStart("");
    setNeededEnd("");
    setSearch("");
    setCurrentPage(1);
  };

  const remove = (order: JobOrder) => {
    setDeleteTarget(order);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteJobOrder(deleteTarget.id);
      toast.success("Job order deleted");
      setDeleteTarget(null);
      fetchOrders();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete job order");
    }
  };

  const openDetails = async (order: JobOrder) => {
    try {
      setDetailLoading(true);
      setDetailOrder(order);
      const freshOrder = await getJobOrder(order.id, { silent: true });
      setDetailOrder(freshOrder);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load job order details");
    } finally {
      setDetailLoading(false);
    }
  };

  const columns: Column<JobOrder>[] = [
    { key: "jo_no", header: "JO No.", sortable: true, minWidth: 130, render: (row) => <strong>{row.jo_no}</strong> },
    { key: "customer_name", header: "Customer/Branch", sortable: true, minWidth: 160, render: (row) => row.customer_name || "-" },
    { key: "product", header: "Product", sortable: true, minWidth: 210, render: (row) => row.items?.[0]?.name || "-" },
    { key: "total_quantity", header: "Qty", sortable: true, render: (row) => Number(row.total_quantity || 0).toFixed(1) },
    { key: "total", header: "Price", sortable: true, render: (row) => money(row.total || 0) },
    { key: "source", header: "Source", minWidth: 160 },
    { key: "category", header: "Category", render: (row) => row.category || "-" },
    { key: "date_needed", header: "Date Needed", minWidth: 150, render: (row) => formatDateTime(row.date_needed) },
    { key: "status", header: "Status", minWidth: 120 },
    {
      key: "action",
      header: "Action",
      minWidth: 140,
      render: (row) => (
        <div className="btn-group btn-group-sm">
          <button className="btn btn-secondary" type="button" onClick={() => openDetails(row)}>Details</button>
          <button className="btn btn-danger" type="button" onClick={() => remove(row)}>Delete</button>
        </div>
      ),
    },
  ];

  return (
    <div className="container-fluid px-4 pt-3">
      <h3 className="mb-4">Manage Job Orders</h3>

      <div className="jo-filter-grid mb-3">
        <select className="form-select" value={source} onChange={(e) => setSource(e.target.value)}>
          <option value="">Source</option>
          {sources.filter(Boolean).map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <input type="date" className="form-control" aria-label="Start Date Order" value={orderStart} onChange={(e) => setOrderStart(e.target.value)} />
        <input type="date" className="form-control" aria-label="End Date Order" value={orderEnd} onChange={(e) => setOrderEnd(e.target.value)} />
        <input className="form-control" placeholder="Order, Customer" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="btn btn-secondary" type="button">Filters</button>
        <button className="btn btn-success" type="button" onClick={() => { setCurrentPage(1); fetchOrders(); }}>Search</button>
        <button className="btn btn-info text-white" type="button" onClick={resetFilters}>Reset</button>
        <button className="btn btn-danger" type="button">Import</button>

        <select className="form-select" value={deliveryType} onChange={(e) => setDeliveryType(e.target.value)}>
          <option value="">Delivery Type</option>
          {deliveryTypes.filter(Boolean).map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <input type="date" className="form-control" aria-label="Start Date Needed" value={neededStart} onChange={(e) => setNeededStart(e.target.value)} />
        <input type="date" className="form-control" aria-label="End Date Needed" value={neededEnd} onChange={(e) => setNeededEnd(e.target.value)} />
        <Link className="btn btn-primary" href="/job-orders/create">Create a Job Order</Link>
      </div>

      <DataTable<JobOrder>
        columns={columns}
        data={orders}
        loading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        itemsPerPage={perPage}
        onItemsPerPageChange={(n) => { setPerPage(n); setCurrentPage(1); }}
        wrapperStyle={{ borderRadius: 4 }}
      />

      {detailOrder && (
        <JobOrderDetailsModal
          order={detailOrder}
          loading={detailLoading}
          onClose={() => setDetailOrder(null)}
        />
      )}

      <ConfirmModal
        show={!!deleteTarget}
        title="Delete Job Order"
        message={<>Are you sure you want to delete <strong>{deleteTarget?.jo_no}</strong>?</>}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <style jsx global>{`
        .jo-filter-grid {
          display: grid;
          grid-template-columns: 140px 160px 160px 200px 80px 68px 62px 80px;
          gap: 3px;
          align-items: stretch;
        }
        .jo-filter-grid :global(.btn),
        .jo-filter-grid :global(.form-control),
        .jo-filter-grid :global(.form-select) {
          min-height: 34px;
          font-size: 12px;
          border-radius: 4px;
        }
        .jo-filter-grid :global(.btn-primary) {
          grid-column: span 2;
        }
        @media (max-width: 1100px) {
          .jo-filter-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .jo-filter-grid :global(.btn-primary) {
            grid-column: span 1;
          }
        }
        @media (max-width: 640px) {
          .jo-filter-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

function JobOrderDetailsModal({ order, loading, onClose }: { order: JobOrder; loading: boolean; onClose: () => void }) {
  const products = order.items?.filter((item) => !item.is_miscellaneous) ?? [];
  const miscItems = order.items?.filter((item) => item.is_miscellaneous) ?? [];

  return (
    <div className="modal show d-block jo-detail-backdrop" tabIndex={-1}>
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content jo-detail-modal">
          <div className="modal-header jo-detail-header">
            <div className="header-copy">
              <span className="header-kicker">Job Order</span>
              <h5 className="modal-title">{order.jo_no}</h5>
              <div className="header-subtitle">
                {order.customer_name || "No customer"} · {formatDateTime(order.order_date)}
              </div>
            </div>
            <div className="header-meta">
              <span className={`status-pill ${statusClass(order.status)}`}>{order.status || "Open Date"}</span>
              <strong>PHP {money(order.total || 0)}</strong>
            </div>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>

          <div className="modal-body">
            {loading && <div className="refresh-strip">Refreshing details...</div>}

            <div className="detail-hero">
              <div className="hero-tile customer">
                <span className="tile-icon"><i className="fa-solid fa-user" /></span>
                <div>
                  <span className="detail-label">Customer</span>
                  <strong>{order.customer_name || "-"}</strong>
                  <small>{order.customer_email || order.customer_contact || "No contact details"}</small>
                </div>
              </div>
              <div className="hero-tile">
                <span className="tile-icon"><i className="fa-solid fa-truck" /></span>
                <div>
                  <span className="detail-label">Delivery</span>
                  <strong>{order.delivery_type || "-"}</strong>
                  <small>{order.delivery_location || order.delivery_address || "No delivery location"}</small>
                </div>
              </div>
              <div className="hero-tile total">
                <span className="tile-icon"><i className="fa-solid fa-receipt" /></span>
                <div>
                  <span className="detail-label">Total</span>
                  <strong className="detail-total">PHP {money(order.total || 0)}</strong>
                  <small>{order.total_quantity ?? 0} total item(s)</small>
                </div>
              </div>
            </div>

            <div className="detail-grid">
              <DetailCard title="Order">
                <ReadLine label="JO No." value={order.jo_no} />
                <ReadLine label="Source" value={order.source} />
                <ReadLine label="Category" value={order.category} />
                <ReadLine label="Order Date" value={formatDateTime(order.order_date)} />
                <ReadLine label="Date Needed" value={formatDateTime(order.date_needed)} />
              </DetailCard>

              <DetailCard title="Customer">
                <ReadLine label="Type" value={pretty(order.customer_type)} />
                <ReadLine label="Name" value={order.customer_name} />
                <ReadLine label="Email" value={order.customer_email} />
                <ReadLine label="Contact" value={order.customer_contact} />
              </DetailCard>

              <DetailCard title="Delivery">
                <ReadLine label="Delivery Type" value={order.delivery_type} />
                <ReadLine label="Location" value={order.delivery_location} />
                <ReadLine label="Address" value={order.delivery_address} />
                <ReadLine label="Delivery Charge" value={money(order.delivery_charge || 0)} />
              </DetailCard>
            </div>

            <ItemsTable title="Added Products" items={products} />
            <ItemsTable title="Added Miscellaneous Products" items={miscItems} />

            <div className="row g-3">
              <div className="col-lg-7">
                <DetailCard title="Payments">
                  <div className="detail-table-wrap">
                    <table className="detail-table">
                      <thead>
                        <tr>
                          <th>Method</th>
                          <th className="text-end">Amount</th>
                          <th>Remarks</th>
                          <th>Attachment</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(order.payments ?? []).length === 0 ? (
                          <tr><td colSpan={4} className="empty-cell">No payments added.</td></tr>
                        ) : order.payments?.map((payment) => (
                          <tr key={payment.id ?? `${payment.payment_method}-${payment.amount}`}>
                            <td>{payment.payment_method}</td>
                            <td className="text-end">{money(payment.amount || 0)}</td>
                            <td>{payment.remarks || "-"}</td>
                            <td>{payment.attachment_path || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </DetailCard>
              </div>

              <div className="col-lg-5">
                <DetailCard title="Computation" accent>
                  <div className="totals-panel">
                    <ReadLine label="Total Quantity" value={String(order.total_quantity ?? 0)} strong />
                    <ReadLine label="Delivery Charge" value={money(order.delivery_charge || 0)} strong />
                    <ReadLine label="Sub Total" value={`PHP ${money(order.subtotal || 0)}`} strong />
                    <ReadLine label="Total Discount" value={money(order.discount_total || 0)} strong />
                    <div className="detail-grand-total">
                      <span>Total</span>
                      <strong>PHP {money(order.total || 0)}</strong>
                    </div>
                  </div>
                </DetailCard>
              </div>
            </div>

            <DetailCard title="Remarks">
              <div className="remarks-box">{order.remarks || "-"}</div>
            </DetailCard>
          </div>

          <div className="modal-footer">
            <button className="btn btn-outline-secondary" type="button" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .jo-detail-backdrop {
          background: rgba(15, 23, 42, 0.58);
          backdrop-filter: blur(2px);
        }
        .jo-detail-modal {
          border: 0;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 24px 80px rgba(15, 23, 42, 0.3);
        }
        .jo-detail-header {
          background: #0f172a;
          color: #fff;
          border-bottom: 0;
          padding: 20px 24px;
          align-items: center;
          gap: 18px;
        }
        .jo-detail-modal :global(.modal-body) {
          background: #f6f8fb;
          padding: 20px 24px 12px;
        }
        .jo-detail-modal :global(.modal-footer) {
          background: #fff;
          border-top-color: #e2e8f0;
          padding: 12px 24px;
        }
        .jo-detail-modal :global(.btn-close) {
          filter: invert(1) grayscale(100%);
          opacity: 0.85;
        }
        .header-copy {
          flex: 1;
          min-width: 0;
        }
        .header-kicker {
          color: #93c5fd;
          display: block;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.08em;
          margin-bottom: 3px;
          text-transform: uppercase;
        }
        .header-copy h5 {
          font-size: 24px;
          font-weight: 800;
          line-height: 1.15;
          margin: 0;
        }
        .header-subtitle {
          color: #cbd5e1;
          font-size: 13px;
          margin-top: 5px;
        }
        .header-meta {
          display: flex;
          align-items: flex-end;
          flex-direction: column;
          gap: 8px;
        }
        .header-meta strong {
          color: #5eead4;
          font-size: 20px;
          line-height: 1;
          white-space: nowrap;
        }
        .status-pill {
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 800;
          line-height: 1;
          padding: 7px 11px;
          white-space: nowrap;
        }
        .status-processing {
          background: #dbeafe;
          color: #1d4ed8;
        }
        .status-completed {
          background: #dcfce7;
          color: #15803d;
        }
        .status-cancelled {
          background: #fee2e2;
          color: #b91c1c;
        }
        .status-open {
          background: #fef3c7;
          color: #92400e;
        }
        .refresh-strip {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 8px;
          color: #1d4ed8;
          font-size: 13px;
          margin-bottom: 14px;
          padding: 10px 12px;
        }
        .detail-hero {
          display: grid;
          grid-template-columns: 1.3fr 0.8fr 0.9fr;
          gap: 12px;
          margin-bottom: 14px;
        }
        .hero-tile,
        .detail-card {
          border: 1px solid #dde5f0;
          border-radius: 10px;
          background: #fff;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
        }
        .hero-tile {
          display: flex;
          gap: 12px;
          min-width: 0;
          padding: 16px;
        }
        .hero-tile.customer {
          border-left: 4px solid #2563eb;
        }
        .hero-tile.total {
          border-left: 4px solid #0f766e;
        }
        .tile-icon {
          align-items: center;
          background: #eff6ff;
          border-radius: 8px;
          color: #2563eb;
          display: inline-flex;
          flex: 0 0 38px;
          height: 38px;
          justify-content: center;
          width: 38px;
        }
        .detail-label {
          display: block;
          color: #64748b;
          font-size: 12px;
          margin-bottom: 4px;
        }
        .hero-tile strong {
          color: #0f172a;
          display: block;
          font-size: 16px;
          line-height: 1.25;
          overflow-wrap: anywhere;
        }
        .hero-tile small {
          color: #94a3b8;
          display: block;
          font-size: 12px;
          line-height: 1.35;
          margin-top: 3px;
          overflow-wrap: anywhere;
        }
        .detail-total {
          color: #0f766e !important;
        }
        .detail-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 14px;
        }
        .detail-card {
          margin-bottom: 14px;
          overflow: hidden;
        }
        .detail-card-title {
          align-items: center;
          background: #fff;
          border-bottom: 1px solid #e2e8f0;
          color: #172554;
          display: flex;
          font-size: 13px;
          font-weight: 800;
          justify-content: space-between;
          padding: 12px 14px;
        }
        .detail-card-title::before {
          background: #2563eb;
          border-radius: 999px;
          content: "";
          height: 8px;
          margin-right: 8px;
          width: 8px;
        }
        .detail-card-title span {
          align-items: center;
          display: inline-flex;
          flex: 1;
        }
        .detail-card.accent {
          border-color: #99f6e4;
        }
        .detail-card.accent .detail-card-title {
          background: #f0fdfa;
          color: #0f766e;
        }
        .detail-card-body {
          padding: 14px;
        }
        .read-line {
          display: grid;
          grid-template-columns: minmax(120px, 42%) minmax(0, 1fr);
          gap: 14px;
          padding: 6px 0;
          border-bottom: 1px solid #f1f5f9;
          font-size: 13px;
          min-height: 32px;
          align-items: start;
        }
        .read-line:last-child {
          border-bottom: 0;
        }
        .read-line span {
          color: #64748b;
        }
        .read-line strong {
          color: #0f172a;
          overflow-wrap: anywhere;
          text-align: right;
          font-weight: 600;
          min-width: 0;
        }
        .detail-table-wrap {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          overflow: auto;
        }
        .detail-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 560px;
        }
        .detail-table th {
          background: #f8fafc;
          color: #64748b;
          font-size: 11px;
          font-weight: 800;
          padding: 9px 10px;
          text-transform: uppercase;
          white-space: nowrap;
        }
        .detail-table td {
          border-top: 1px solid #eef2f7;
          color: #334155;
          font-size: 13px;
          padding: 10px;
          vertical-align: top;
        }
        .detail-table tbody tr:hover td {
          background: #fbfdff;
        }
        .empty-cell {
          color: #94a3b8 !important;
          text-align: center;
          padding: 18px 10px !important;
        }
        .text-end {
          text-align: right;
        }
        .detail-grand-total {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          background: #0f172a;
          border-radius: 9px;
          margin-top: 12px;
          padding: 14px;
        }
        .detail-grand-total span {
          color: #cbd5e1;
          font-weight: 700;
        }
        .detail-grand-total strong {
          color: #5eead4;
          font-size: 18px;
        }
        .totals-panel .read-line {
          padding-left: 2px;
          padding-right: 2px;
        }
        .remarks-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          color: #334155;
          min-height: 64px;
          padding: 12px;
          white-space: pre-wrap;
        }
        @media (max-width: 992px) {
          .detail-hero,
          .detail-grid {
            grid-template-columns: 1fr;
          }
          .jo-detail-header {
            align-items: flex-start;
            flex-direction: column;
          }
          .header-meta {
            align-items: flex-start;
          }
        }
        @media (max-width: 576px) {
          .read-line {
            grid-template-columns: 1fr;
            gap: 2px;
          }
          .read-line strong {
            text-align: left;
          }
        }
      `}</style>
    </div>
  );
}

function DetailCard({ title, children, accent }: { title: string; children: React.ReactNode; accent?: boolean }) {
  return (
    <section className={`detail-card${accent ? " accent" : ""}`}>
      <div className="detail-card-title"><span>{title}</span></div>
      <div className="detail-card-body">{children}</div>
    </section>
  );
}

function ReadLine({ label, value, strong }: { label: string; value?: string | number | null; strong?: boolean }) {
  return (
    <div className="read-line">
      <span>{label}</span>
      <strong style={strong ? { fontWeight: 700 } : undefined}>{value || "-"}</strong>
    </div>
  );
}

function ItemsTable({ title, items }: { title: string; items: NonNullable<JobOrder["items"]> }) {
  return (
    <DetailCard title={title}>
      <div className="detail-table-wrap">
        <table className="detail-table">
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Type</th>
              <th className="text-end">Price/Item</th>
              <th className="text-end">Qty</th>
              <th className="text-end">Total Price</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={5} className="empty-cell">No items added.</td></tr>
            ) : items.map((item) => (
              <tr key={item.id ?? `${item.name}-${item.quantity}`}>
                <td>{item.name}</td>
                <td>{pretty(item.item_type)}</td>
                <td className="text-end">{money(item.price)}</td>
                <td className="text-end">{item.quantity}</td>
                <td className="text-end">{money(item.total_price ?? Number(item.price || 0) * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DetailCard>
  );
}

const money = (value: number | string) => Number(value || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const pretty = (value?: string | null) => value ? value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) : "-";

const statusClass = (value?: string | null) => {
  const status = String(value || "").toLowerCase();
  if (status.includes("complete")) return "status-completed";
  if (status.includes("cancel")) return "status-cancelled";
  if (status.includes("process")) return "status-processing";
  return "status-open";
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "-";
  return date.toLocaleString("en-US", {
    month: "long",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

ManageJobOrders.Layout = AdminLayout;
export default ManageJobOrders;
