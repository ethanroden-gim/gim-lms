/**
 * GIM LMS — Email Reminder Web App
 * ================================
 *
 * Deploy this Apps Script as a Web App and paste its /exec URL into
 * GIM_CONFIG.appsScriptReminderUrl in index.html.
 *
 * Setup:
 *   1. Go to https://script.google.com → New project
 *   2. Replace the default Code.gs contents with this entire file
 *   3. (Optional) In Project Settings, set GIM_LMS_SECRET — see verifyAuth()
 *   4. Save (project name: "GIM LMS Reminders")
 *   5. Deploy → New deployment → Type: Web app
 *        Execute as:        Me (your @getgim.com account)
 *        Who has access:    Anyone within getgim.com
 *      (or "Anyone" if you want learners signing in via personal accounts)
 *   6. Copy the deployment "/exec" URL
 *   7. Paste it into GIM_CONFIG.appsScriptReminderUrl in index.html, push,
 *      and clicking "Send reminder" in the LMS will POST here.
 *
 * Notes:
 *   - sendEmail uses the deployer's Gmail quota
 *     (1500/day for Workspace, 100/day for free Google accounts).
 *   - The LMS sends Content-Type: text/plain to skip the CORS preflight,
 *     so the body arrives as e.postData.contents (a JSON string).
 */

const FROM_NAME = "GIM Learning";

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || "{}");
    if (!verifyAuth(payload, e)) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const { recipients = [], subject, message, course, dueDate, sentBy, sentByName } = payload;
    if (!recipients.length) return jsonResponse({ error: "No recipients" }, 400);

    const sentResults = [];
    const errors = [];

    recipients.forEach(r => {
      if (!r.email) {
        errors.push({ email: null, error: "Missing email" });
        return;
      }
      const finalSubject = subject || `Training reminder${course ? `: ${course}` : ""}`;
      const finalBody = buildBody({
        recipientName: r.name || r.email.split("@")[0],
        message,
        course,
        dueDate,
        sentBy,
        sentByName,
      });

      try {
        MailApp.sendEmail({
          to: r.email,
          subject: finalSubject,
          htmlBody: finalBody,
          name: FROM_NAME,
          replyTo: sentBy || Session.getActiveUser().getEmail(),
        });
        sentResults.push(r.email);
      } catch (err) {
        errors.push({ email: r.email, error: String(err) });
      }
    });

    return jsonResponse({ sent: sentResults.length, recipients: sentResults, errors });
  } catch (err) {
    return jsonResponse({ error: String(err) }, 500);
  }
}

// Optional: GET handler so you can sanity-check the deployment URL in a browser
function doGet() {
  return jsonResponse({ ok: true, service: "GIM LMS Reminders" });
}

/**
 * Optional shared-secret check. To enable:
 *   Project Settings → Script Properties → Add property
 *     name:  GIM_LMS_SECRET
 *     value: <pick a long random string>
 *   Then put the same string into GIM_CONFIG.appsScriptSecret in index.html.
 *   The LMS will include it in the request body and this function will reject
 *   anything else.
 *
 * If GIM_LMS_SECRET isn't set, requests are accepted from anyone with the URL.
 */
function verifyAuth(payload, e) {
  const expected = PropertiesService.getScriptProperties().getProperty("GIM_LMS_SECRET");
  if (!expected) return true; // not configured → allow
  const provided = (payload && payload.secret) || "";
  return provided === expected;
}

function buildBody({ recipientName, message, course, dueDate, sentBy, sentByName }) {
  const lines = [];
  lines.push(`<p>Hi ${escapeHtml(recipientName)},</p>`);
  if (message && message.trim()) {
    lines.push(`<p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>`);
  } else if (course) {
    lines.push(`<p>This is a friendly reminder to complete your training: <strong>${escapeHtml(course)}</strong>.</p>`);
    if (dueDate) lines.push(`<p>It's due <strong>${escapeHtml(dueDate)}</strong>.</p>`);
  } else {
    lines.push(`<p>You have outstanding training in GIM Learning. Please log in to complete it.</p>`);
  }
  lines.push(`<p style="margin-top:24px"><a href="https://ethanroden-gim.github.io/gim-lms/" style="display:inline-block;background:#7ac142;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;font-weight:600">Open GIM Learning</a></p>`);
  lines.push(`<p style="font-size:12px;color:#666;margin-top:32px">Sent ${sentByName ? `by ${escapeHtml(sentByName)}` : ""}${sentBy ? ` (${escapeHtml(sentBy)})` : ""} via GIM Learning.</p>`);
  return lines.join("\n");
}

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function jsonResponse(obj, status) {
  // Apps Script ContentService doesn't expose status codes directly, but the
  // browser will treat any 200 with an `error` field as a soft-fail; that's
  // handled by the LMS client (it throws when payload.error is set).
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
