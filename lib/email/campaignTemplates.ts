type EmailKind = "promotion" | "coupon" | "invoice" | "announcement";

type OrderLine = {
  product_name: string;
  quantity: number;
  unit_price: number;
};

type TemplateParams = {
  kind: EmailKind;
  subject: string;
  previewText?: string;
  message: string;
  couponCode?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  recipientName?: string | null;
  orderId?: string;
  orderTotal?: number;
  orderDate?: string;
  orderItems?: OrderLine[];
  invoiceNumber?: string;
  couponDiscountLabel?: string;
  expiresLabel?: string;
};

function esc(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function toHtmlParagraphs(text: string): string {
  return esc(text)
    .split(/\n{2,}/)
    .map((block) => `<p style="margin:0 0 14px;line-height:1.7;color:#3a2a16;font-size:15px">${block.replaceAll("\n", "<br/>")}</p>`)
    .join("");
}

function invoiceTable(items: OrderLine[]): string {
  if (items.length === 0) return "";
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:14px">
      <thead>
        <tr>
          <th align="left" style="padding:10px;border-bottom:1px solid #eee7de;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#8b7358">Item</th>
          <th align="right" style="padding:10px;border-bottom:1px solid #eee7de;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#8b7358">Qty</th>
          <th align="right" style="padding:10px;border-bottom:1px solid #eee7de;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#8b7358">Price</th>
        </tr>
      </thead>
      <tbody>
        ${items
          .map(
            (item) => `
          <tr>
            <td style="padding:10px;border-bottom:1px solid #f5efe8;color:#2a2015">${esc(item.product_name)}</td>
            <td align="right" style="padding:10px;border-bottom:1px solid #f5efe8;color:#2a2015">${item.quantity}</td>
            <td align="right" style="padding:10px;border-bottom:1px solid #f5efe8;color:#2a2015">N$${Number(item.unit_price).toFixed(2)}</td>
          </tr>
        `,
          )
          .join("")}
      </tbody>
    </table>
  `;
}

export function renderCampaignHtml(input: TemplateParams): string {
  const greeting = input.recipientName ? `Dear ${esc(input.recipientName)},` : "Hello,";
  const messageHtml = toHtmlParagraphs(input.message);
  const ctaButton = (bg: string, fg: string) =>
    input.ctaLabel && input.ctaUrl
      ? `<a href="${esc(input.ctaUrl)}" style="display:inline-block;margin-top:18px;background:${bg};color:${fg};text-decoration:none;padding:12px 18px;font-weight:600;letter-spacing:.03em;border-radius:8px">${esc(input.ctaLabel)}</a>`
      : "";

  const preview = input.previewText ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(input.previewText)}</div>` : "";

  if (input.kind === "coupon") {
    return `
    <!doctype html>
    <html>
      <body style="margin:0;background:#fff7ed;font-family:Inter,Arial,sans-serif">
        ${preview}
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px">
          <tr><td align="center">
            <table width="640" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #fde7d0">
              <tr><td style="padding:26px;background:linear-gradient(135deg,#b45309,#d97706)">
                <p style="margin:0;color:#ffedd5;font-size:12px;letter-spacing:.18em;text-transform:uppercase">RauVei Exclusive</p>
                <h1 style="margin:8px 0 0;color:#fff;font-size:30px;line-height:1.2">${esc(input.subject)}</h1>
              </td></tr>
              <tr><td style="padding:28px">
                <p style="margin:0 0 14px;color:#7c4a17;font-size:15px">${greeting}</p>
                ${messageHtml}
                ${
                  input.couponCode
                    ? `<div style="margin:18px 0;padding:16px;border:2px dashed #f59e0b;background:#fffbeb;text-align:center;border-radius:10px">
                         <p style="margin:0 0 6px;color:#92400e;font-size:12px;letter-spacing:.12em;text-transform:uppercase">Coupon code</p>
                         <p style="margin:0;color:#78350f;font-size:26px;font-weight:800;letter-spacing:.08em">${esc(input.couponCode)}</p>
                         ${input.couponDiscountLabel ? `<p style="margin:8px 0 0;color:#92400e;font-size:13px">${esc(input.couponDiscountLabel)}</p>` : ""}
                         ${input.expiresLabel ? `<p style="margin:4px 0 0;color:#b45309;font-size:12px">Valid until ${esc(input.expiresLabel)}</p>` : ""}
                       </div>`
                    : ""
                }
                ${ctaButton("#d97706", "#fff")}
              </td></tr>
            </table>
          </td></tr>
        </table>
      </body>
    </html>`;
  }

  if (input.kind === "invoice") {
    return `
    <!doctype html>
    <html>
      <body style="margin:0;background:#f3f4f6;font-family:Inter,Arial,sans-serif">
        ${preview}
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px">
          <tr><td align="center">
            <table width="680" cellpadding="0" cellspacing="0" style="max-width:680px;background:#fff;border:1px solid #e5e7eb">
              <tr><td style="padding:24px 28px;border-bottom:1px solid #e5e7eb">
                <table width="100%"><tr>
                  <td>
                    <p style="margin:0;color:#6b7280;font-size:12px;letter-spacing:.16em;text-transform:uppercase">Invoice</p>
                    <h1 style="margin:8px 0 0;color:#111827;font-size:28px">${esc(input.subject)}</h1>
                  </td>
                  <td align="right">
                    <p style="margin:0;color:#374151;font-size:13px">Invoice #: <strong>${esc(input.invoiceNumber ?? "—")}</strong></p>
                    <p style="margin:6px 0 0;color:#374151;font-size:13px">Order #: <strong>${esc(input.orderId ?? "—")}</strong></p>
                    <p style="margin:6px 0 0;color:#374151;font-size:13px">Date: <strong>${esc(input.orderDate ?? "—")}</strong></p>
                  </td>
                </tr></table>
              </td></tr>
              <tr><td style="padding:24px 28px">
                <p style="margin:0 0 14px;color:#374151;font-size:15px">${greeting}</p>
                ${messageHtml}
                ${invoiceTable(input.orderItems ?? [])}
                <div style="margin-top:12px;padding:12px;background:#f9fafb;border:1px solid #e5e7eb">
                  <p style="margin:0;color:#111827;font-size:14px">Total due: <strong>N$${Number(input.orderTotal ?? 0).toFixed(2)}</strong></p>
                </div>
                ${ctaButton("#111827", "#fff")}
              </td></tr>
            </table>
          </td></tr>
        </table>
      </body>
    </html>`;
  }

  if (input.kind === "promotion") {
    return `
    <!doctype html>
    <html>
      <body style="margin:0;background:#f5f3ff;font-family:Inter,Arial,sans-serif">
        ${preview}
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:22px 12px">
          <tr><td align="center">
            <table width="640" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border:1px solid #ede9fe">
              <tr><td style="padding:26px;background:#4c1d95">
                <p style="margin:0;color:#ddd6fe;letter-spacing:.14em;text-transform:uppercase;font-size:11px">Limited campaign</p>
                <h1 style="margin:8px 0 0;color:#fff;font-size:30px;line-height:1.2">${esc(input.subject)}</h1>
              </td></tr>
              <tr><td style="padding:26px 28px">
                <p style="margin:0 0 12px;color:#4c1d95;font-size:15px">${greeting}</p>
                ${messageHtml}
                ${ctaButton("#7c3aed", "#fff")}
              </td></tr>
            </table>
          </td></tr>
        </table>
      </body>
    </html>`;
  }

  return `
  <!doctype html>
  <html>
    <body style="margin:0;background:#f6f1eb;font-family:Georgia, 'Times New Roman', serif">
      ${preview}
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px">
        <tr>
          <td align="center">
            <table width="640" cellpadding="0" cellspacing="0" style="max-width:640px;background:#fff;border:1px solid #efe7de">
              <tr>
                <td style="background:#1a1209;padding:26px 28px;text-align:center">
                  <div style="color:#fff;font-size:26px;letter-spacing:.08em;font-weight:700">RAUVEI</div>
                  <div style="color:#d7b896;font-size:12px;letter-spacing:.18em;margin-top:6px">FASHION BOUTIQUE</div>
                </td>
              </tr>
              <tr>
                <td style="padding:28px">
                  <h1 style="margin:0 0 14px;color:#1a1209;font-size:26px;font-weight:700">${esc(input.subject)}</h1>
                  <p style="margin:0 0 16px;color:#6f5338;font-size:15px;line-height:1.6">${greeting}</p>
                  ${messageHtml}
                  ${ctaButton("#c8956c", "#fff")}
                </td>
              </tr>
              <tr>
                <td style="padding:20px 28px;border-top:1px solid #f0e8de;color:#8b7358;font-size:12px;line-height:1.6">
                  Sent by RauVei Boutique. For support, reply to this email.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
}
