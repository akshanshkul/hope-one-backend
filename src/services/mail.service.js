import env from "../config/env.js";

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

export const sendRegistrationThankYou = async ({ email, fullName }) => {
  if (!env.mail.apiHost || !env.mail.apiToken || !env.mail.fromAddress) {
    console.warn("Registration email skipped: mail settings are not configured");
    return;
  }

  const response = await fetch(`https://${env.mail.apiHost}/v1.1/email`, {
    method: "POST",
    headers: {
      Authorization: env.mail.apiToken,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: { address: env.mail.fromAddress, name: env.mail.fromName },
      to: [{ email_address: { address: email, name: fullName } }],
      subject: "Thank you for registering",
      htmlbody: `
        <!doctype html>
        <html lang="en">
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta name="color-scheme" content="light">
            <title>Welcome to Onco Sahayak</title>
          </head>
          <body style="margin:0;padding:0;background:#eef8f4;font-family:Arial,Helvetica,sans-serif;color:#12283f;">
            <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
              Thank you for joining Onco Sahayak. We are working for you.
            </div>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#eef8f4;padding:28px 12px;">
              <tr>
                <td align="center">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 8px 28px rgba(15,44,82,.10);">
                    <tr>
                      <td style="height:8px;background:linear-gradient(90deg,#0e7c5a 0%,#19a974 55%,#d94f7b 100%);font-size:0;line-height:0;">&nbsp;</td>
                    </tr>
                    <tr>
                      <td align="center" style="padding:32px 28px 22px;background:#f7fcfa;">
                        ${
                          env.mail.logoUrl
                            ? `<img src="${escapeHtml(env.mail.logoUrl)}" alt="Onco Sahayak" width="190" style="display:block;width:190px;max-width:80%;height:auto;border:0;">`
                            : `<div style="font-size:27px;font-weight:800;letter-spacing:-.6px;"><span style="color:#0e7c5a;">Onco </span><span style="color:#0f2c52;">Sahayak</span></div>
                               <div style="margin-top:5px;color:#64748b;font-size:11px;letter-spacing:.6px;">TOGETHER AGAINST CANCER</div>`
                        }
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:34px 36px 12px;">
                        <div style="display:inline-block;padding:7px 12px;border-radius:999px;background:#e6f7ef;color:#0e7c5a;font-size:12px;font-weight:700;letter-spacing:.3px;">
                          REGISTRATION RECEIVED
                        </div>
                        <h1 style="margin:18px 0 10px;color:#0f2c52;font-size:28px;line-height:1.25;">
                          Welcome, ${escapeHtml(fullName)}!
                        </h1>
                        <p style="margin:0;color:#52677d;font-size:16px;line-height:1.7;">
                          Thank you for registering with us. We are working for you and will stay connected throughout your journey.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:18px 36px;">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#fff7ed;border:1px solid #fde7c2;border-radius:16px;">
                          <tr>
                            <td style="padding:18px 20px;">
                              <div style="color:#a45b08;font-size:13px;font-weight:700;">WHAT HAPPENS NEXT?</div>
                              <div style="margin-top:7px;color:#70552e;font-size:14px;line-height:1.6;">
                                Our team is reviewing your information. We will share helpful updates and assistance opportunities with you.
                              </div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:12px 36px 36px;">
                        <p style="margin:0;color:#52677d;font-size:15px;line-height:1.7;">
                          You are not alone. We are here to support you with care, guidance, and hope.
                        </p>
                        <p style="margin:22px 0 0;color:#0f2c52;font-size:15px;line-height:1.6;">
                          With warm regards,<br>
                          <strong style="color:#0e7c5a;">Team Onco Sahayak</strong>
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="padding:20px 28px;background:#0f2c52;">
                        <div style="color:#ffffff;font-size:14px;font-weight:700;">Onco Sahayak</div>
                        <div style="margin-top:6px;color:#b9d9d0;font-size:12px;">Together Against Cancer</div>
                        <div style="margin-top:14px;color:#9eb3c7;font-size:11px;line-height:1.5;">
                          This is an automated message. Please do not reply directly to this email.
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `
    })
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`ZeptoMail request failed (${response.status}): ${details}`);
  }
};

export const sendContactChangeOtp = async ({
  email, newEmail, fullName, currentCode, newCode, changeType
}) => {
  if (!env.mail.apiHost || !env.mail.apiToken || !env.mail.fromAddress) {
    throw new Error("Email verification is not configured");
  }
  const send = async (recipient, code, label) => {
    const response = await fetch(`https://${env.mail.apiHost}/v1.1/email`, {
      method: "POST",
      headers: { Authorization: env.mail.apiToken, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: { address: env.mail.fromAddress, name: env.mail.fromName },
        to: [{ email_address: { address: recipient, name: fullName } }],
        subject: "Verify your Onco contact change",
        htmlbody: `<p>Use this OTP to verify your ${changeType} change (${label}): <strong>${code}</strong></p><p>This code expires in ${OTP_TTL_MINUTES} minutes.</p>`
      })
    });
    if (!response.ok) throw new Error(`OTP email failed (${response.status})`);
  };
  const OTP_TTL_MINUTES = 10;
  await send(email, currentCode, "current email");
  if (newEmail && newCode) await send(newEmail, newCode, "new email");
};

export const sendPasswordResetOtp = async ({ email, fullName, code }) => {
  if (!env.mail.apiHost || !env.mail.apiToken || !env.mail.fromAddress) {
    const error = new Error("Password reset email is not configured on the server");
    error.statusCode = 503;
    throw error;
  }
  const response = await fetch(`https://${env.mail.apiHost}/v1.1/email`, {
    method: "POST",
    headers: { Authorization: env.mail.apiToken, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: { address: env.mail.fromAddress, name: env.mail.fromName },
      to: [{ email_address: { address: email, name: fullName || email } }],
      subject: "Your Onco Sahayak password reset code",
      htmlbody: `<p>Use this OTP to reset your Onco Sahayak password: <strong>${code}</strong></p><p>This code expires in 10 minutes.</p><p>If you did not request this, you can ignore this email.</p>`
    })
  });
  if (!response.ok) {
    const details = await response.text();
    const error = new Error(`Password reset email could not be sent (${response.status})`);
    error.statusCode = 502;
    error.cause = details;
    throw error;
  }
};
