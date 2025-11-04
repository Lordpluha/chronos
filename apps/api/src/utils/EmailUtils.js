import { AppConfig } from '../config/index.js'

export class EmailUtils {
  static async sendEmail(props) {
    await AppConfig.emailTransporter
      .sendMail({
        from: AppConfig.emailFrom,
        ...props,
      })
      .then((onsuccess) => {
        console.log('Message sent: %s', onsuccess.messageId)
      })
  }

  static generateEmail(code) {
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
}
