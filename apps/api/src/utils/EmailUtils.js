import { AppConfig } from '../config/index.js'

export class EmailUtilsClass {
  async sendEmail(props) {
    await AppConfig.emailTransporter
      .sendMail({
        from: AppConfig.emailFrom,
        ...props,
      })
      .then((onsuccess) => {

      })
  }

  generateEmail(code) {
    return `
      <div style="font-family:Arial,sans-serif;max-width:400px;margin:auto;padding:24px;border-radius:8px;background:#f9f9f9;border:1px solid #eee;">
        <h2 style="color:#2d7ff9;text-align:center;">USOF Password Reset</h2>
        <p>Hello!</p>
        <p>You requested a password reset on our forum. Your password reset code:</p>
        <h1 style="font-size:2em;font-weight:bold;text-align:center;background:#eaf4ff;padding:12px;border-radius:6px;color:#2d7ff9;margin:16px 0;">${code}</h1>
        <p>Please enter this code on the website to complete the password reset procedure.</p>
        <hr style="margin:24px 0;border:none;border-top:1px solid #eee;">
        <p style="font-size:0.9em;color:#888;text-align:center;">If you did not request a password reset, simply ignore this email.</p>
        <p style="font-size:0.9em;color:#888;text-align:center;">USOF &copy; ${new Date().getFullYear()}</p>
      </div>
    `
  }

  generateCalendarShareEmail(ownerName, calendarTitle, permission) {
    const permissionText = {
      read: 'view',
      write: 'edit',
      admin: 'manage'
    }[permission] || 'view';

    return `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:24px;border-radius:8px;background:#f9f9f9;border:1px solid #eee;">
        <h2 style="color:#6366f1;text-align:center;">📅 Calendar Shared With You</h2>
        <p>Hello!</p>
        <p><strong>${ownerName}</strong> has shared a calendar with you on Chronos.</p>

        <div style="background:#fff;padding:16px;border-radius:6px;margin:16px 0;border-left:4px solid #6366f1;">
          <p style="margin:0;font-size:1.1em;font-weight:bold;color:#333;">${calendarTitle}</p>
          <p style="margin:8px 0 0 0;color:#666;">Permission: <strong>${permissionText}</strong></p>
        </div>

        <p>You can now access this calendar in your Chronos dashboard.</p>

        <div style="text-align:center;margin:24px 0;">
          <a href="http://localhost:5173/calendar"
             style="display:inline-block;padding:12px 32px;background:#6366f1;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;">
            Open Calendar
          </a>
        </div>

        <hr style="margin:24px 0;border:none;border-top:1px solid #eee;">
        <p style="font-size:0.9em;color:#888;text-align:center;">Chronos - Your Time, Organized</p>
        <p style="font-size:0.9em;color:#888;text-align:center;">&copy; ${new Date().getFullYear()}</p>
      </div>
    `
  }

  generateEventInviteEmail(organizerName, eventTitle, eventStart, eventEnd, role) {
    const roleText = {
      organizer: 'Organizer',
      participant: 'Participant',
      viewer: 'Viewer'
    }[role] || 'Participant';

    const startDate = new Date(eventStart).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:24px;border-radius:8px;background:#f9f9f9;border:1px solid #eee;">
        <h2 style="color:#6366f1;text-align:center;">📆 Event Invitation</h2>
        <p>Hello!</p>
        <p><strong>${organizerName}</strong> has invited you to an event on Chronos.</p>

        <div style="background:#fff;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #6366f1;">
          <h3 style="margin:0 0 12px 0;color:#333;font-size:1.3em;">${eventTitle}</h3>
          <p style="margin:8px 0;color:#666;">
            <strong>📅 When:</strong> ${startDate}
          </p>
          <p style="margin:8px 0;color:#666;">
            <strong>👤 Your role:</strong> ${roleText}
          </p>
        </div>

        <div style="text-align:center;margin:24px 0;">
          <a href="http://localhost:5173/calendar"
             style="display:inline-block;padding:12px 32px;background:#10b981;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;margin-right:8px;">
            ✓ Accept
          </a>
          <a href="http://localhost:5173/calendar"
             style="display:inline-block;padding:12px 32px;background:#6b7280;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;">
            View Details
          </a>
        </div>

        <hr style="margin:24px 0;border:none;border-top:1px solid #eee;">
        <p style="font-size:0.9em;color:#888;text-align:center;">Chronos - Your Time, Organized</p>
        <p style="font-size:0.9em;color:#888;text-align:center;">&copy; ${new Date().getFullYear()}</p>
      </div>
    `
  }
}

export const EmailUtils = new EmailUtilsClass()
