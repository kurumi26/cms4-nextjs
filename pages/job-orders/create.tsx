import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/Layout/AdminLayout";
import { toast } from "@/lib/toast";
import { createJobOrder } from "@/services/jobOrderService";
import { getProducts } from "@/services/productService";
import { getCustomers, CustomerRow } from "@/services/customerService";

type LineItem = {
  id: number;
  productId?: number | null;
  itemType: string;
  name: string;
  price: number;
  quantity: number;
};

type PaymentRow = {
  id: number;
  method: string;
  amount: number;
  remarks: string;
  attachment?: File | null;
};

type OrderOption = {
  type: string;
  name: string;
  price: number;
  productId?: number | null;
};

const fallbackProductItems: OrderOption[] = [
  { type: "Product", name: "Whole Lechon (De Leche) 5-6 Kgs.", price: 12800, productId: null },
  { type: "Product", name: "Petite (Lechon Cebu) 3-4 kgs.", price: 9800, productId: null },
];

const serviceItems: OrderOption[] = [
  { type: "Service", name: "Catering Service", price: 2500, productId: null },
  { type: "Service", name: "Food Tray Setup", price: 1200, productId: null },
];

const locations = ["Quezon City", "Makati", "Pasig", "Taguig", "Manila"];
const paymentMethods = [
  "Bank Deposit",
  "Cash",
  "Check Payment",
  "COD",
  "Credit/Debit Card",
  "Discount (Promo)",
  "Discount (VAT)",
  "Discount (Senior Citizen)",
  "Ex-deal",
  "Gcash",
  "Gift Certificate",
  "M Lhuillier",
  "Ok Order",
  "Online Bank Transfer",
  "Open Date Order",
];

const emptyPayment = (): PaymentRow => ({ id: Date.now(), method: "", amount: 0, remarks: "", attachment: null });

function CreateJobOrder() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [productOptions, setProductOptions] = useState<OrderOption[]>(fallbackProductItems);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [itemType, setItemType] = useState("Product");
  const [customerType, setCustomerType] = useState("Existing");
  const [customerId, setCustomerId] = useState<number | "">("");
  const [newCustomerName, setNewCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerContact, setCustomerContact] = useState("");
  const [source, setSource] = useState("");
  const [status, setStatus] = useState("Open Date");
  const [dateNeeded, setDateNeeded] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(fallbackProductItems[0].name);
  const [quantity, setQuantity] = useState(1);
  const [deliveryType, setDeliveryType] = useState("Pickup");
  const [location, setLocation] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [remarks, setRemarks] = useState("");
  const [products, setProducts] = useState<LineItem[]>([]);
  const [miscProducts, setMiscProducts] = useState<LineItem[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([emptyPayment()]);

  useEffect(() => {
    getProducts({ per_page: 1000 }, { silent: true })
      .then((res) => {
        const products = Array.isArray(res?.data) ? res.data : [];
        const options = products.map((product: any) => ({
          type: "Product",
          name: product.name,
          price: Number(product.price || 0),
          productId: product.id,
        })).filter((product: OrderOption) => product.name);
        if (options.length) {
          setProductOptions(options);
          setSelectedOrder(options[0].name);
        }
      })
      .catch(() => setProductOptions(fallbackProductItems));

    getCustomers({ per_page: 1000 }, { silent: true })
      .then((res) => {
        const rows = Array.isArray(res?.data?.data) ? res.data.data : [];
        setCustomers(rows);
        if (rows[0]?.id) setCustomerId(rows[0].id);
      })
      .catch(() => setCustomers([]));
  }, []);

  const orderItems = useMemo(() => [...productOptions, ...serviceItems], [productOptions]);
  const availableOrders = orderItems.filter((item) => item.type === itemType);
  const selectedItem = orderItems.find((item) => item.name === selectedOrder) ?? availableOrders[0];
  const selectedCustomer = customers.find((customer: any) => customer.id === customerId) as any;

  const totals = useMemo(() => {
    const productTotal = products.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const miscTotal = miscProducts.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const totalQuantity = [...products, ...miscProducts].reduce((sum, item) => sum + item.quantity, 0);
    const discountTotal = payments
      .filter((payment) => payment.method.toLowerCase().includes("discount"))
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const subTotal = productTotal + miscTotal + Number(deliveryCharge || 0);
    return {
      totalQuantity,
      deliveryCharge: Number(deliveryCharge || 0),
      subTotal,
      discountTotal,
      total: Math.max(0, subTotal - discountTotal),
    };
  }, [deliveryCharge, miscProducts, payments, products]);

  const addItem = (bucket: "products" | "misc") => {
    if (!selectedItem) return;
    const item: LineItem = {
      id: Date.now(),
      productId: selectedItem.productId ?? null,
      itemType: itemType.toLowerCase(),
      name: selectedItem.name,
      price: selectedItem.price,
      quantity: Number(quantity || 1),
    };
    if (bucket === "products") setProducts((current) => [...current, item]);
    else setMiscProducts((current) => [...current, item]);
  };

  const removeItem = (bucket: "products" | "misc", id: number) => {
    if (bucket === "products") setProducts((current) => current.filter((item) => item.id !== id));
    else setMiscProducts((current) => current.filter((item) => item.id !== id));
  };

  const updatePayment = (id: number, patch: Partial<PaymentRow>) => {
    setPayments((current) => current.map((payment) => payment.id === id ? { ...payment, ...patch } : payment));
  };

  const removePayment = (id: number) => {
    setPayments((current) => current.length === 1 ? current : current.filter((payment) => payment.id !== id));
  };

  const submit = async () => {
    const items = [...products, ...miscProducts].map((item) => ({
      product_id: item.productId ?? null,
      item_type: item.itemType,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      is_miscellaneous: miscProducts.some((misc) => misc.id === item.id),
    }));

    if (items.length === 0) {
      toast.error("Please add at least one product or service");
      return;
    }

    try {
      setSaving(true);
      await createJobOrder({
        customer_id: customerType === "Existing" && customerId ? Number(customerId) : null,
        customer_type: customerType.toLowerCase(),
        customer_name: customerType === "Existing" ? selectedCustomer?.name : newCustomerName,
        customer_email: customerType === "Existing" ? selectedCustomer?.email : customerEmail,
        customer_contact: customerContact,
        source,
        category: "Order",
        status,
        order_date: new Date().toISOString(),
        date_needed: dateNeeded || null,
        delivery_type: deliveryType,
        delivery_location: location,
        delivery_address: deliveryAddress,
        delivery_charge: deliveryCharge,
        remarks,
        items,
        payments: payments
          .filter((payment) => payment.method)
          .map((payment) => ({
            payment_method: payment.method,
            amount: payment.amount,
            remarks: payment.remarks,
            attachment: payment.attachment ?? null,
          })),
      });
      toast.success("Job order created");
      router.push("/job-orders");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create job order");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container-fluid px-4 pt-3 pb-5">
      <h3 className="mb-4">Create Job Order</h3>

      <div className="row g-4">
        <div className="col-xl-7">
          <section className="jo-panel">
            <h5>Order Information</h5>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Product or Service</label>
                <select
                  className="form-select"
                  value={itemType}
                  onChange={(e) => {
                    const nextType = e.target.value;
                    setItemType(nextType);
                    setSelectedOrder(orderItems.find((item) => item.type === nextType)?.name ?? "");
                  }}
                >
                  <option>Product</option>
                  <option>Service</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Order Details</label>
                <select className="form-select" value={selectedOrder} onChange={(e) => setSelectedOrder(e.target.value)}>
                  {availableOrders.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Quantity</label>
                <input type="number" min="1" className="form-control" value={quantity} onChange={(e) => setQuantity(Number(e.target.value || 1))} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Price/Item</label>
                <div className="form-control bg-light">{money(selectedItem?.price ?? 0)}</div>
              </div>
              <div className="col-md-4 d-flex align-items-end gap-2">
                <button className="btn btn-success flex-fill" type="button" onClick={() => addItem("products")}>Add</button>
                <button className="btn btn-outline-secondary flex-fill" type="button" onClick={() => addItem("misc")}>Misc</button>
              </div>
            </div>
          </section>

          <section className="jo-panel">
            <h5>Customer Details</h5>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Customer Type</label>
                <select className="form-select" value={customerType} onChange={(e) => setCustomerType(e.target.value)}>
                  <option>Existing</option>
                  <option>New</option>
                </select>
              </div>
              {customerType === "Existing" ? (
                <div className="col-md-8">
                  <label className="form-label">Existing Customer</label>
                  <select className="form-select" value={customerId} onChange={(e) => setCustomerId(e.target.value ? Number(e.target.value) : "")}>
                    <option value="">- Select Customer -</option>
                    {customers.map((customer: any) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
                  </select>
                </div>
              ) : (
                <>
                  <div className="col-md-4">
                    <label className="form-label">Customer Name</label>
                    <input className="form-control" value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Email</label>
                    <input className="form-control" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Contact No.</label>
                    <input className="form-control" value={customerContact} onChange={(e) => setCustomerContact(e.target.value)} />
                  </div>
                </>
              )}
            </div>
          </section>

          <section className="jo-panel">
            <h5>Delivery & Remarks</h5>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Source</label>
                <input className="form-control" placeholder="Branch / source" value={source} onChange={(e) => setSource(e.target.value)} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Status</label>
                <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option>Open Date</option>
                  <option>Processing Stock</option>
                  <option>Pending</option>
                  <option>Completed</option>
                  <option>Cancelled</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Date Needed</label>
                <input type="datetime-local" className="form-control" value={dateNeeded} onChange={(e) => setDateNeeded(e.target.value)} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Delivery Type</label>
                <select
                  className="form-select"
                  value={deliveryType}
                  onChange={(e) => {
                    const next = e.target.value;
                    setDeliveryType(next);
                    if (next === "Door-to-door" && !deliveryCharge) setDeliveryCharge(400);
                    if (next !== "Door-to-door") {
                      setLocation("");
                      setDeliveryAddress("");
                    }
                  }}
                >
                  <option>Pickup</option>
                  <option>Door-to-door</option>
                  <option>Store delivery</option>
                  <option>Flexible arrangement</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Delivery Charge</label>
                <input type="number" min="0" className="form-control" value={deliveryCharge} onChange={(e) => setDeliveryCharge(Number(e.target.value || 0))} />
              </div>
              {deliveryType === "Door-to-door" && (
                <>
                  <div className="col-md-5">
                    <label className="form-label">Location</label>
                    <select className="form-select" value={location} onChange={(e) => setLocation(e.target.value)}>
                      <option value="">- Select Location -</option>
                      {locations.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </div>
                  <div className="col-md-7">
                    <label className="form-label">Delivery Address</label>
                    <input className="form-control" value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} />
                  </div>
                </>
              )}
              <div className="col-12">
                <label className="form-label">Remarks</label>
                <textarea className="form-control" rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
              </div>
            </div>
          </section>

          <section className="jo-panel">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h5 className="mb-0">Payment</h5>
              <button className="btn btn-success btn-sm" type="button" onClick={() => setPayments((current) => [...current, emptyPayment()])}>Add Payment</button>
            </div>
            <div className="payment-table">
              <div className="payment-heading">Payment Method</div>
              <div className="payment-heading">Amount</div>
              <div className="payment-heading">Remarks & Attachment</div>
              <div />
              {payments.map((payment) => (
                <div className="payment-row" key={payment.id}>
                  <select className="form-select" value={payment.method} onChange={(e) => updatePayment(payment.id, { method: e.target.value })}>
                    <option value="">- Select -</option>
                    {paymentMethods.map((method) => <option key={method} value={method}>{method}</option>)}
                  </select>
                  <input type="number" min="0" className="form-control" value={payment.amount} onChange={(e) => updatePayment(payment.id, { amount: Number(e.target.value || 0) })} />
                  <div>
                    <textarea className="form-control mb-2" rows={2} placeholder="Enter payment details" value={payment.remarks} onChange={(e) => updatePayment(payment.id, { remarks: e.target.value })} />
                    <input
                      className="form-control"
                      type="file"
                      onChange={(e) => updatePayment(payment.id, { attachment: e.target.files?.[0] ?? null })}
                    />
                  </div>
                  <button className="btn btn-warning" type="button" onClick={() => removePayment(payment.id)}>
                    <i className="fa-solid fa-xmark" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <div className="d-flex gap-2">
            <button className="btn btn-primary px-4" type="button" onClick={submit} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
            <button className="btn btn-outline-secondary px-4" type="button" onClick={() => router.push("/job-orders")}>Cancel</button>
          </div>
        </div>

        <div className="col-xl-5">
          <section className="jo-computation">
            <div className="jo-computation-header">
              <div>
                <i className="fa-solid fa-calculator" /> On-Screen Computation
              </div>
              <span>PHP {money(totals.total)}</span>
            </div>
            <ComputationItems title="Added Products" items={products} onRemove={(id) => removeItem("products", id)} />
            <ComputationItems title="Added Miscellaneous Products" items={miscProducts} onRemove={(id) => removeItem("misc", id)} />
            <div className="summary-box">
              <div className="summary-line"><span>Total Quantity</span><strong>{totals.totalQuantity}</strong></div>
              <div className="summary-line"><span>Delivery Charge</span><strong>{money(totals.deliveryCharge)}</strong></div>
              <div className="summary-line"><span>Sub Total</span><strong>PHP {money(totals.subTotal)}</strong></div>
              <div className="summary-divider" />
              <div className="summary-line"><span>Total Discount</span><strong>{money(totals.discountTotal)}</strong></div>
              <div className="summary-line summary-total"><span>Total</span><strong>PHP {money(totals.total)}</strong></div>
            </div>
          </section>
        </div>
      </div>

      <style jsx>{`
        .jo-panel,
        .jo-computation {
          background: #fff;
          border: 1px solid #d9dee8;
          border-radius: 6px;
          padding: 18px;
          margin-bottom: 18px;
        }
        .jo-panel h5 {
          color: #6f7f9e;
          font-weight: 600;
          margin-bottom: 16px;
        }
        .payment-table {
          display: grid;
          grid-template-columns: 1.1fr 0.7fr 1.6fr 72px;
          gap: 10px 16px;
          align-items: start;
        }
        .payment-heading {
          color: #6f7f9e;
          font-size: 15px;
          font-weight: 600;
          padding-bottom: 8px;
          border-bottom: 1px solid #d9dee8;
        }
        .payment-row {
          display: contents;
        }
        .jo-computation {
          background: #f8fafc;
          position: sticky;
          top: 18px;
          padding: 0;
          overflow: hidden;
        }
        .jo-computation-header {
          padding: 16px 18px;
          border-bottom: 1px solid #d9dee8;
          font-weight: 600;
          color: #172554;
          background: linear-gradient(180deg, #ffffff 0%, #f3f6fb 100%);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        .jo-computation-header span {
          color: #0f766e;
          font-size: 18px;
          white-space: nowrap;
        }
        .computation-section {
          padding: 16px 18px 4px;
        }
        .computation-section-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
          color: #1f2937;
          font-weight: 700;
        }
        .computation-count {
          border-radius: 999px;
          background: #e0f2fe;
          color: #075985;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 8px;
        }
        .computation-table-wrap {
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          overflow: hidden;
          background: #fff;
        }
        .computation-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }
        .computation-table th {
          background: #f1f5f9;
          color: #64748b;
          font-size: 11px;
          font-weight: 700;
          padding: 9px 8px;
          border-bottom: 1px solid #e2e8f0;
          text-transform: uppercase;
        }
        .computation-table td {
          color: #334155;
          font-size: 12.5px;
          padding: 10px 8px;
          border-bottom: 1px solid #eef2f7;
          vertical-align: middle;
        }
        .computation-table tbody tr:last-child td {
          border-bottom: 0;
        }
        .item-name {
          font-weight: 600;
          color: #0f172a;
          line-height: 1.3;
          overflow-wrap: anywhere;
        }
        .text-end {
          text-align: right;
        }
        .text-center {
          text-align: center;
        }
        .empty-row {
          text-align: center;
          color: #94a3b8 !important;
          padding: 18px 8px !important;
        }
        .summary-box {
          margin: 14px 18px 18px;
          border: 1px solid #dbe3ef;
          border-radius: 6px;
          background: #fff;
          padding: 12px 14px;
        }
        .summary-line {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          padding: 7px 0;
          color: #64748b;
          font-size: 13px;
        }
        .summary-line strong {
          color: #0f172a;
          font-weight: 700;
          text-align: right;
        }
        .summary-divider {
          height: 1px;
          background: #e2e8f0;
          margin: 6px 0;
        }
        .summary-total {
          color: #172554;
          font-size: 15px;
          padding-top: 10px;
        }
        .summary-total strong {
          color: #0f766e;
          font-size: 17px;
        }
        @media (max-width: 720px) {
          .payment-table,
          .payment-row {
            display: block;
          }
          .payment-heading {
            display: none;
          }
          .payment-row > * {
            margin-bottom: 10px;
          }
          .jo-computation {
            position: static;
          }
          .jo-computation-header {
            align-items: flex-start;
            flex-direction: column;
            gap: 6px;
          }
        }
      `}</style>
    </div>
  );
}

function ComputationItems({ title, items, onRemove }: { title: string; items: LineItem[]; onRemove: (id: number) => void }) {
  return (
    <div className="computation-section">
      <div className="computation-section-title">
        <span>{title}</span>
        <span className="computation-count">{items.length}</span>
      </div>
      <div className="computation-table-wrap">
        <table className="computation-table">
          <colgroup>
            <col style={{ width: "42%" }} />
            <col style={{ width: "20%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "20%" }} />
            <col style={{ width: "36px" }} />
          </colgroup>
          <thead>
            <tr>
              <th>Product Name</th>
              <th className="text-end">Price/Item</th>
              <th className="text-center">Qty</th>
              <th className="text-end">Total</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td className="empty-row" colSpan={5}>No items added.</td>
              </tr>
            ) : items.map((item) => (
              <tr key={item.id}>
                <td><div className="item-name">{item.name}</div></td>
                <td className="text-end">{money(item.price)}</td>
                <td className="text-center">{item.quantity}</td>
                <td className="text-end">{money(item.price * item.quantity)}</td>
                <td className="text-center">
                  <button className="btn btn-link btn-sm text-danger p-0" type="button" onClick={() => onRemove(item.id)} title="Remove item">
                    <i className="fa-solid fa-trash" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const money = (value: number) => Number(value || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

CreateJobOrder.Layout = AdminLayout;
export default CreateJobOrder;
