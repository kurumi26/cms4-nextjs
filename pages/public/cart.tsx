import { useEffect, useState } from "react";
import Link from "next/link";
import LandingPageLayout from "@/components/Layout/GuestLayout";
import { cartSubtotal, PublicCartItem, readPublicCart, removePublicCartItem, updatePublicCartQty } from "@/lib/publicCart";

function CustomerCartPage() {
  const [items, setItems] = useState<PublicCartItem[]>([]);
  useEffect(() => setItems(readPublicCart()), []);
  const subtotal = cartSubtotal(items);

  const updateQty = (key: string, qty: number) => setItems(updatePublicCartQty(key, qty));
  const removeItem = (key: string) => setItems(removePublicCartItem(key));

  return (
    <CustomerShell active="cart">
      <div className="customer-panel">
        <div className="panel-title">My Cart</div>
        {items.length === 0 ? (
          <div className="empty-cart">
            <p>Your cart is empty.</p>
            <Link href="/public/products" className="customer-btn">Browse Products</Link>
          </div>
        ) : (
          <>
            <div className="cart-table-wrap">
              <table className="cart-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th className="text-center">Quantity</th>
                    <th className="text-end">Price</th>
                    <th className="text-end">Total</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.key}>
                      <td>
                        <div className="cart-product">
                          <img src={item.image || "/images/logo.png"} alt="" />
                          <div>
                            <strong>{item.name}</strong>
                            <span>Status: Pending request</span>
                          </div>
                        </div>
                      </td>
                      <td className="text-center">
                        <input type="number" min="1" value={item.qty} onChange={(e) => updateQty(item.key, Number(e.target.value || 1))} />
                      </td>
                      <td className="text-end">{money(item.price)}</td>
                      <td className="text-end">{money(item.price * item.qty)}</td>
                      <td className="text-end">
                        <button className="remove-btn" type="button" onClick={() => removeItem(item.key)}>Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="cart-summary">
              <div><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
              <div><span>Total</span><strong className="grand">{money(subtotal)}</strong></div>
              <Link href="/public/checkout" className="customer-btn">Checkout</Link>
            </div>
          </>
        )}
      </div>
      <CustomerStyles />
    </CustomerShell>
  );
}

export function CustomerShell({ active, children }: { active: string; children: React.ReactNode }) {
  const links = [
    ["account", "Manage Account", "/public/account"],
    ["cart", "My Cart", "/public/cart"],
    ["password", "Change Password", "/public/account#password"],
    ["orders", "Order History", "/public/orders"],
  ];
  return (
    <div className="customer-area">
      <aside className="customer-sidebar">
        <h4>MY ACCOUNT</h4>
        <nav>
          {links.map(([key, label, href]) => (
            <Link key={key} href={href} className={active === key ? "active" : ""}>{label}</Link>
          ))}
        </nav>
      </aside>
      <div className="customer-main">{children}</div>
    </div>
  );
}

export function CustomerStyles() {
  return (
    <style jsx global>{`
      .customer-area {
        display: grid;
        grid-template-columns: 300px minmax(0, 1fr);
        gap: 24px;
        padding: 28px 0 60px;
      }
      .customer-sidebar,
      .customer-panel {
        background: #fff;
        border: 1px solid #d9dee8;
        border-radius: 8px;
        box-shadow: 0 6px 18px rgba(15, 23, 42, 0.08);
      }
      .customer-sidebar h4 {
        color: #00843d;
        font-weight: 800;
        padding: 22px 26px;
        border-bottom: 1px solid #e2e8f0;
        margin: 0;
      }
      .customer-sidebar nav {
        padding: 18px 0;
      }
      .customer-sidebar a {
        display: block;
        color: #0f172a;
        font-weight: 800;
        padding: 13px 26px;
        text-decoration: none;
      }
      .customer-sidebar a.active {
        color: #f97316;
        border-left: 4px solid #f97316;
        padding-left: 22px;
      }
      .panel-title {
        color: #f97316;
        font-size: 18px;
        font-weight: 800;
        padding: 20px 26px;
        border-bottom: 1px solid #e2e8f0;
        text-transform: uppercase;
      }
      .customer-panel {
        overflow: hidden;
      }
      .customer-area input,
      .customer-area select,
      .customer-area textarea {
        border: 1px solid #94a3b8 !important;
        border-radius: 8px !important;
        background: #fff !important;
        box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.04);
        color: #0f172a;
      }
      .customer-area input:focus,
      .customer-area select:focus,
      .customer-area textarea:focus {
        border-color: #00843d !important;
        box-shadow: 0 0 0 3px rgba(0, 132, 61, 0.16);
        outline: none;
      }
      .customer-area input:disabled {
        background: #f8fafc !important;
        color: #64748b;
      }
      .empty-cart {
        padding: 36px 26px;
      }
      .cart-table-wrap {
        overflow: auto;
      }
      .cart-table {
        width: 100%;
        min-width: 760px;
        border-collapse: collapse;
      }
      .cart-table th {
        background: #2f7db4;
        color: #fff;
        font-size: 13px;
        padding: 10px;
      }
      .cart-table td {
        border-bottom: 1px solid #eef2f7;
        padding: 12px 10px;
        vertical-align: middle;
      }
      .cart-product {
        display: flex;
        align-items: center;
        gap: 14px;
      }
      .cart-product img {
        width: 72px;
        height: 58px;
        object-fit: cover;
        border: 1px solid #e2e8f0;
        border-radius: 4px;
      }
      .cart-product strong,
      .cart-product span {
        display: block;
      }
      .cart-product span {
        color: #92400e;
        font-size: 12px;
        margin-top: 4px;
      }
      .cart-table input {
        width: 64px;
        padding: 6px;
        text-align: center;
      }
      .text-end { text-align: right; }
      .text-center { text-align: center; }
      .remove-btn {
        background: #dc3545;
        border: 0;
        border-radius: 5px;
        color: #fff;
        font-weight: 800;
        padding: 8px 12px;
      }
      .cart-summary {
        margin-left: auto;
        width: min(100%, 340px);
        padding: 22px 26px 26px;
      }
      .cart-summary div {
        display: flex;
        justify-content: space-between;
        border-bottom: 1px solid #eef2f7;
        padding: 10px 0;
      }
      .cart-summary .grand {
        font-size: 24px;
      }
      .customer-btn {
        display: inline-flex;
        justify-content: center;
        align-items: center;
        min-height: 44px;
        background: #00843d;
        border-radius: 6px;
        color: #fff !important;
        font-weight: 800;
        padding: 10px 18px;
        text-decoration: none;
        border: 0;
      }
      @media (max-width: 900px) {
        .customer-area {
          grid-template-columns: 1fr;
        }
      }
    `}</style>
  );
}

export const money = (value: number | string) => Number(value || 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" });

CustomerCartPage.Layout = function CustomerCartLayout({ children }: { children: React.ReactNode }) {
  return (
    <LandingPageLayout pageData={{ title: "My Cart", meta: { title: "Cart" } }}>
      {children}
    </LandingPageLayout>
  );
};
export default CustomerCartPage;
