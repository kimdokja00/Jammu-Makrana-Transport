import nodemailer from 'nodemailer';

/**
 * Checks whether SMTP credentials are fully provided in environment.
 */
export function isEmailConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
}

let cachedTransporter = null;

/**
 * Returns a cached Nodemailer transporter or creates a new one.
 */
export function getTransporter() {
  if (!isEmailConfigured()) {
    return null;
  }

  if (!cachedTransporter) {
    const port = Number(process.env.SMTP_PORT) || 587;
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;

    cachedTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production',
      },
    });
  }

  return cachedTransporter;
}

/**
 * Normalizes and formats status descriptors for emails.
 */
function getStatusMeta(status, order) {
  const norm = String(status || '').toLowerCase().trim();

  switch (norm) {
    case 'confirmed':
      return {
        badge: 'CONFIRMED',
        badgeBg: '#ECFDF5',
        badgeText: '#065F46',
        badgeBorder: '#A7F3D0',
        headline: 'Order Confirmed & Vehicle Allocated',
        subject: `Order Confirmed: ${order.orderNumber} | Jammu Makrana Transport`,
        lead: `Great news! Your transport booking request has been confirmed by our operations team in Makrana. A dedicated heavy transport vehicle has been allocated for your consignment.`,
        instructions: `Our Makrana yard team is completing vehicle inspection, loading verification, and transit paperwork for your delivery to ${order.dropCity}, ${order.dropState}.`,
      };

    case 'dispatched':
    case 'shipped':
    case 'in_transit':
      return {
        badge: 'IN TRANSIT / DISPATCHED',
        badgeBg: '#FFFBEB',
        badgeText: '#92400E',
        badgeBorder: '#FDE68A',
        headline: 'Consignment Dispatched & On Highway',
        subject: `Consignment Dispatched / In Transit: ${order.orderNumber} | Jammu Makrana Transport`,
        lead: `Your natural stone consignment is now loaded and on the highway, travelling towards ${order.dropCity}, ${order.dropState}.`,
        instructions: `Our driver is navigating the national highway route. Milestone logs and highway checkpoint details are recorded in your live tracking dashboard.`,
      };

    case 'delivered':
      return {
        badge: 'DELIVERED',
        badgeBg: '#F0FDF4',
        badgeText: '#166534',
        badgeBorder: '#BBF7D0',
        headline: 'Consignment Successfully Delivered',
        subject: `Consignment Delivered: ${order.orderNumber} | Jammu Makrana Transport`,
        lead: `Your consignment has safely arrived at your destination address in ${order.dropCity}, ${order.dropState}. Unloading has been completed.`,
        instructions: `Thank you for choosing Jammu Makrana Transport & Komal Minerals Supplier. Please inspect the unloaded stone slabs and reach out if you need material certifications or further assistance.`,
      };

    case 'placed':
      return {
        badge: 'ORDER PLACED',
        badgeBg: '#EFF6FF',
        badgeText: '#1E40AF',
        badgeBorder: '#BFDBFE',
        headline: 'Transport Booking Request Received',
        subject: `Booking Confirmed: ${order.orderNumber} | Jammu Makrana Transport`,
        lead: `We have received your transport booking request. Our logistics desk in Makrana is reviewing your cargo specifications and route details.`,
        instructions: `We will allocate an appropriate transport vehicle and update your status to Confirmed shortly.`,
      };

    case 'rejected':
    case 'cancelled':
      return {
        badge: norm.toUpperCase(),
        badgeBg: '#FEF2F2',
        badgeText: '#991B1B',
        badgeBorder: '#FECACA',
        headline: `Order Status: ${norm.toUpperCase()}`,
        subject: `Order Update: ${order.orderNumber} (${norm.toUpperCase()}) | Jammu Makrana Transport`,
        lead: `Your transport order #${order.orderNumber} status has been updated to ${norm}.`,
        instructions: `If you have questions or wish to re-book, please contact our dispatch desk directly at +91 98295 75967.`,
      };

    default:
      return {
        badge: (status || 'UPDATED').toUpperCase(),
        badgeBg: '#F3F4F6',
        badgeText: '#374151',
        badgeBorder: '#D1D5DB',
        headline: `Order Status Update: ${status}`,
        subject: `Order Status Update: ${order.orderNumber} | Jammu Makrana Transport`,
        lead: `The status for your transport order #${order.orderNumber} has been updated to "${status}".`,
        instructions: `View your order dashboard for live updates and delivery timelines.`,
      };
  }
}

/**
 * Builds responsive, email-client-friendly HTML email template.
 */
function buildHtmlTemplate(order, status, extraNotes = '') {
  const meta = getStatusMeta(status, order);
  const siteUrl = (process.env.SITE_URL || 'https://jammumakranatransport-theta.vercel.app').replace(/\/+$/, '');
  const trackingUrl = `${siteUrl}/customer/order/${order.orderNumber || order.id || order._id}`;
  const portalUrl = `${siteUrl}/customer/login`;

  const supportEmail = process.env.SUPPORT_EMAIL || process.env.SMTP_USER || 'info@jmtransport.com';
  let cargoRowsHtml = '';
  if (Array.isArray(order.stones) && order.stones.length > 0) {
    cargoRowsHtml = order.stones
      .map(
        (s) => `
        <tr style="border-bottom: 1px solid #E5E7EB;">
          <td style="padding: 10px 12px; font-weight: 600; color: #1F2937; font-size: 13px;">${escapeHtml(s.stoneName || 'Stone Cargo')}</td>
          <td style="padding: 10px 12px; color: #4B5563; font-size: 13px;">${escapeHtml(s.slabSize || 'Standard')}</td>
          <td style="padding: 10px 12px; color: #4B5563; font-size: 13px;">${escapeHtml(s.slabCount || '-')}</td>
          <td style="padding: 10px 12px; color: #4B5563; font-size: 13px;">${escapeHtml(s.quantityTonnes ? `${s.quantityTonnes} T` : '-')}</td>
        </tr>
      `
      )
      .join('');
  } else {
    cargoRowsHtml = `
      <tr style="border-bottom: 1px solid #E5E7EB;">
        <td style="padding: 10px 12px; font-weight: 600; color: #1F2937; font-size: 13px;">${escapeHtml(order.materialType || 'Natural Stone')}</td>
        <td style="padding: 10px 12px; color: #4B5563; font-size: 13px;">Standard</td>
        <td style="padding: 10px 12px; color: #4B5563; font-size: 13px;">${escapeHtml(order.quantity || '-')}</td>
        <td style="padding: 10px 12px; color: #4B5563; font-size: 13px;">${escapeHtml(order.weightTonnes ? `${order.weightTonnes} T` : '-')}</td>
      </tr>
    `;
  }

  // Format milestone notes / dispatch details if present
  let dispatchDetailsHtml = '';
  const hasDispatchInfo = order.dispatchLocation || order.dispatchDate || order.shippedDate || order.deliveredDate || order.estimatedDeliveryDate || extraNotes;

  if (hasDispatchInfo) {
    const infoItems = [];
    if (order.dispatchLocation) {
      infoItems.push(`<strong>📍 Dispatch Location:</strong> ${escapeHtml(order.dispatchLocation)}`);
    }
    if (order.estimatedDeliveryDate) {
      const estDate = new Date(order.estimatedDeliveryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      infoItems.push(`<strong>📅 Estimated Delivery:</strong> ${estDate}`);
    }
    if (order.shippedDate) {
      const shipDate = new Date(order.shippedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      infoItems.push(`<strong>🚚 Shipped Date:</strong> ${shipDate}`);
    }
    if (order.deliveredDate) {
      const delDate = new Date(order.deliveredDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      infoItems.push(`<strong>✅ Delivered Date:</strong> ${delDate}`);
    }
    if (extraNotes) {
      infoItems.push(`<strong>📝 Operations Note:</strong> ${escapeHtml(extraNotes)}`);
    }

    dispatchDetailsHtml = `
      <div style="background-color: #F8FAFC; border-left: 4px solid #C5A059; padding: 14px 18px; margin: 20px 0; border-radius: 0 8px 8px 0;">
        <h4 style="margin: 0 0 8px 0; color: #1B2A4A; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Transit & Operations Details</h4>
        <div style="font-size: 13px; color: #334155; line-height: 1.6;">
          ${infoItems.join('<br />')}
        </div>
      </div>
    `;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(meta.subject)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F1F5F9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1E293B;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F1F5F9; padding: 24px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 620px; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06); border: 1px solid #E2E8F0;">
          
          <!-- Header Bar -->
          <tr>
            <td style="background-color: #1B2A4A; padding: 28px 24px; text-align: center; border-bottom: 4px solid #C5A059;">
              <div style="color: #C5A059; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 6px;">
                JAMMU MAKRANA TRANSPORT
              </div>
              <h1 style="margin: 0; color: #FFFFFF; font-size: 22px; font-weight: 700; letter-spacing: 0.5px;">
                Komal Minerals Supplier
              </h1>
              <div style="color: #94A3B8; font-size: 12px; margin-top: 6px;">
                Makrana, Rajasthan • Natural Stone & Minerals Logistics Since 1985
              </div>
            </td>
          </tr>

          <!-- Status Highlight Card -->
          <tr>
            <td style="padding: 28px 28px 16px 28px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <span style="display: inline-block; background-color: ${meta.badgeBg}; color: ${meta.badgeText}; border: 1px solid ${meta.badgeBorder}; font-size: 11px; font-weight: 700; letter-spacing: 1px; padding: 5px 12px; border-radius: 9999px; text-transform: uppercase;">
                      ● ${meta.badge}
                    </span>
                    <h2 style="margin: 12px 0 8px 0; color: #1B2A4A; font-size: 20px; font-weight: 700;">
                      ${meta.headline}
                    </h2>
                    <p style="margin: 0 0 14px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                      Dear <strong>${escapeHtml(order.fullName || 'Valued Customer')}</strong>,
                    </p>
                    <p style="margin: 0 0 14px 0; font-size: 14px; line-height: 1.6; color: #334155;">
                      ${meta.lead}
                    </p>
                    <p style="margin: 0 0 16px 0; font-size: 13px; line-height: 1.6; color: #64748B;">
                      ${meta.instructions}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Dispatch & Route Details -->
          <tr>
            <td style="padding: 0 28px;">
              ${dispatchDetailsHtml}
            </td>
          </tr>

          <!-- Key Order Info Grid -->
          <tr>
            <td style="padding: 0 28px 20px 28px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 14px 16px;">
                <tr>
                  <td width="50%" valign="top" style="padding: 6px 10px;">
                    <span style="font-size: 11px; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px; display: block;">Consignment Order #</span>
                    <strong style="font-size: 15px; color: #1B2A4A; font-family: monospace;">${escapeHtml(order.orderNumber)}</strong>
                  </td>
                  <td width="50%" valign="top" style="padding: 6px 10px;">
                    <span style="font-size: 11px; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px; display: block;">Target Delivery Date</span>
                    <strong style="font-size: 14px; color: #1B2A4A;">${escapeHtml(order.arrivedByDate || order.pickupDate || 'Scheduled')}</strong>
                  </td>
                </tr>
                <tr>
                  <td width="50%" valign="top" style="padding: 6px 10px;">
                    <span style="font-size: 11px; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px; display: block;">Destination City</span>
                    <strong style="font-size: 14px; color: #1B2A4A;">${escapeHtml(order.dropCity)}, ${escapeHtml(order.dropState)}</strong>
                  </td>
                  <td width="50%" valign="top" style="padding: 6px 10px;">
                    <span style="font-size: 11px; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px; display: block;">Unloading Address</span>
                    <span style="font-size: 13px; color: #334155;">${escapeHtml(order.dropAddress)}${order.dropPin ? ` (${escapeHtml(order.dropPin)})` : ''}</span>
                  </td>
                </tr>
                ${order.vehicleType ? `
                <tr>
                  <td colspan="2" valign="top" style="padding: 6px 10px; border-top: 1px solid #E2E8F0;">
                    <span style="font-size: 11px; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px; display: block;">Vehicle Allocation</span>
                    <strong style="font-size: 13px; color: #1B2A4A;">${escapeHtml(order.vehicleType)}</strong>
                  </td>
                </tr>
                ` : ''}
              </table>
            </td>
          </tr>

          <!-- Cargo Breakdown Table -->
          <tr>
            <td style="padding: 0 28px 24px 28px;">
              <h3 style="margin: 0 0 10px 0; color: #1B2A4A; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
                Natural Stone Cargo Manifest
              </h3>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse: collapse; border: 1px solid #E5E7EB; border-radius: 8px; overflow: hidden;">
                <thead>
                  <tr style="background-color: #1B2A4A; color: #FFFFFF; font-size: 12px; text-align: left;">
                    <th style="padding: 10px 12px; font-weight: 600;">Stone Material</th>
                    <th style="padding: 10px 12px; font-weight: 600;">Slab Size</th>
                    <th style="padding: 10px 12px; font-weight: 600;">Slabs</th>
                    <th style="padding: 10px 12px; font-weight: 600;">Weight</th>
                  </tr>
                </thead>
                <tbody>
                  ${cargoRowsHtml}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Primary CTA Button -->
          <tr>
            <td align="center" style="padding: 0 28px 30px 28px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="background-color: #1B2A4A; border-radius: 6px;">
                    <a href="${trackingUrl}" target="_blank" style="display: inline-block; padding: 14px 28px; color: #FFFFFF; font-size: 14px; font-weight: 700; text-decoration: none; letter-spacing: 0.5px; text-transform: uppercase;">
                      Track Consignment Online →
                    </a>
                  </td>
                </tr>
              </table>
              <div style="font-size: 12px; color: #64748B; margin-top: 10px;">
                You can also log in to your <a href="${portalUrl}" style="color: #C5A059; text-decoration: underline;">Customer Portal</a> anytime to download invoices and review timeline history.
              </div>
            </td>
          </tr>

          <!-- Company Direct Contact Info -->
          <tr>
            <td style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 22px 28px; font-size: 12px; color: #64748B; line-height: 1.6;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td width="60%" valign="top">
                    <strong style="color: #1B2A4A; font-size: 13px;">Jammu Makrana Transport</strong><br />
                    Station Road, RIICO Industrial Area,<br />
                    Makrana, Didwana-Kuchaman District,<br />
                    Rajasthan - 341505, India
                  </td>
                  <td width="40%" valign="top" align="right">
                    <strong>Dispatch Helpdesk:</strong><br />
                    <a href="tel:+919829575967" style="color: #1B2A4A; text-decoration: none; font-weight: 600;">+91 98295 75967</a><br />
                    <a href="tel:+919919400782" style="color: #1B2A4A; text-decoration: none; font-weight: 600;">+91 99194 00782</a><br />
                    <a href="mailto:${supportEmail}" style="color: #C5A059; text-decoration: none;">${escapeHtml(supportEmail)}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer Legal -->
          <tr>
            <td style="background-color: #0F172A; padding: 16px 24px; text-align: center; color: #94A3B8; font-size: 11px;">
              © ${new Date().getFullYear()} Jammu Makrana Transport & Komal Minerals Supplier. All rights reserved.<br />
              This is an automated operational notification regarding your consignment order.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Builds plain-text fallback for mail clients without HTML support.
 */
function buildPlainText(order, status, extraNotes = '') {
  const meta = getStatusMeta(status, order);
  const siteUrl = (process.env.SITE_URL || 'https://jammumakranatransport-theta.vercel.app').replace(/\/+$/, '');
  const trackingUrl = `${siteUrl}/customer/order/${order.orderNumber || order.id || order._id}`;
  const supportEmail = process.env.SUPPORT_EMAIL || process.env.SMTP_USER || 'info@jmtransport.com';

  const lines = [
    `JAMMU MAKRANA TRANSPORT & KOMAL MINERALS SUPPLIER`,
    `Makrana, Rajasthan • Logistics Since 1985`,
    `----------------------------------------------------`,
    `ORDER STATUS: ${meta.badge}`,
    `Subject: ${meta.headline}`,
    `Order Number: ${order.orderNumber}`,
    ``,
    `Dear ${order.fullName || 'Valued Customer'},`,
    meta.lead,
    meta.instructions,
    ``,
    `CONSIGNMENT DETAILS:`,
    `- Destination: ${order.dropCity}, ${order.dropState}`,
    `- Delivery Address: ${order.dropAddress}${order.dropPin ? ` (${order.dropPin})` : ''}`,
    `- Target Date: ${order.arrivedByDate || order.pickupDate || 'Standard transit'}`,
  ];

  if (order.dispatchLocation) {
    lines.push(`- Dispatch Location: ${order.dispatchLocation}`);
  }
  if (extraNotes) {
    lines.push(`- Operations Note: ${extraNotes}`);
  }

  lines.push(
    ``,
    `Track your order online:`,
    trackingUrl,
    ``,
    `Need help? Call Makrana Yard Dispatch: +91 98295 75967 / +91 99194 00782 or email ${supportEmail}`
  );

  return lines.join('\n');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Sends order status update email to the customer.
 * Safe & non-blocking: never throws; returns status object.
 *
 * @param {object} order Order document/object
 * @param {string} status Status being transitioned to ('confirmed', 'shipped', 'delivered', etc.)
 * @param {string} extraNotes Optional dispatch note or admin milestone comment
 */
export async function sendOrderStatusEmail(order, status, extraNotes = '') {
  if (!order || !order.email) {
    console.warn('[EmailService] Order has no valid recipient email. Skipping email dispatch.');
    return { success: false, reason: 'No recipient email' };
  }

  const recipientEmail = String(order.email).trim().toLowerCase();
  const meta = getStatusMeta(status, order);

  // If SMTP is unconfigured, simulate send and log cleanly without error
  if (!isEmailConfigured()) {
    console.log(
      `[EmailService] [SIMULATED] SMTP not configured. Would send "${meta.subject}" to ${recipientEmail} for order ${order.orderNumber} (status: ${status})`
    );
    return {
      success: true,
      simulated: true,
      to: recipientEmail,
      orderNumber: order.orderNumber,
      status,
      subject: meta.subject,
    };
  }

  try {
    const transporter = getTransporter();
    if (!transporter) {
      console.warn('[EmailService] Transporter unavailable despite isEmailConfigured returning true.');
      return { success: false, reason: 'Transporter creation failed' };
    }

    const defaultFrom = process.env.EMAIL_FROM || `"Jammu Makrana Transport" <${process.env.SMTP_USER}>`;
    const supportEmail = process.env.SUPPORT_EMAIL || process.env.SMTP_USER || 'info@jmtransport.com';
    const htmlContent = buildHtmlTemplate(order, status, extraNotes);
    const textContent = buildPlainText(order, status, extraNotes);

    const mailOptions = {
      from: defaultFrom,
      to: recipientEmail,
      replyTo: supportEmail,
      subject: meta.subject,
      text: textContent,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] Email sent successfully for ${order.orderNumber} (${status}) to ${recipientEmail}: ${info.messageId}`);
    return {
      success: true,
      messageId: info.messageId,
      to: recipientEmail,
      status,
    };
  } catch (err) {
    console.error(`[EmailService] Failed to send email for ${order.orderNumber} (${status}) to ${recipientEmail}:`, err.message);
    return {
      success: false,
      error: err.message,
    };
  }
}

export default {
  isEmailConfigured,
  getTransporter,
  sendOrderStatusEmail,
};
