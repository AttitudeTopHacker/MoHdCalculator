package mohd.salman.ansari.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    /**
     * Send a password reset OTP to the user's email.
     */
    public void sendPasswordResetOtpEmail(String toEmail, String fullName, String otpCode) {
        String subject = "Reset Your AreaCalculator Password";
        String htmlBody = buildResetOtpEmailHtml(fullName, otpCode);
        sendHtmlEmail(toEmail, subject, htmlBody);
    }

    /**
     * Send a signup verification OTP to the user's email.
     */
    public void sendSignupVerificationOtpEmail(String toEmail, String fullName, String otpCode) {
        String subject = "Verify Your AreaCalculator Account";
        String htmlBody = buildSignupOtpEmailHtml(fullName, otpCode);
        sendHtmlEmail(toEmail, subject, htmlBody);
    }

    private void sendHtmlEmail(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send email: " + e.getMessage(), e);
        }
    }

    private String buildResetOtpEmailHtml(String fullName, String otpCode) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <style>
                body { font-family: 'Segoe UI', Arial, sans-serif; background: #0D0D0D; margin: 0; padding: 0; }
                .container { max-width: 540px; margin: 40px auto; background: #121212; border: 1px solid #2EE6C5;
                             border-radius: 18px; padding: 40px; }
                h1 { color: #E8791A; font-size: 28px; margin: 0 0 8px; }
                p  { color: #cccccc; line-height: 1.6; font-size: 15px; }
                .otp-box { display: inline-block; margin: 24px 0; background: #1a1a1a; color: #2EE6C5;
                        padding: 14px 36px; border-radius: 10px; border: 1px dashed #2EE6C5;
                        font-weight: 700; font-size: 24px; letter-spacing: 4px; }
                .note { color: #888; font-size: 13px; margin-top: 24px; }
                .footer { color: #555; font-size: 12px; text-align: center; margin-top: 32px; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>Password Reset OTP</h1>
                <p>Hi <strong style="color:#fff">%s</strong>,</p>
                <p>We received a request to reset your AreaCalculator password.
                   Use the One-Time Password (OTP) below to set a new password.</p>
                <div class="otp-box">%s</div>
                <p class="note">This OTP expires in <strong>10 minutes</strong>.<br>
                   If you didn't request this, you can safely ignore this email.</p>
                <div class="footer">AreaCalculator &mdash; by Salman Ansari</div>
              </div>
            </body>
            </html>
            """.formatted(fullName != null ? fullName : "there", otpCode);
    }

    private String buildSignupOtpEmailHtml(String fullName, String otpCode) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <style>
                body { font-family: 'Segoe UI', Arial, sans-serif; background: #0D0D0D; margin: 0; padding: 0; }
                .container { max-width: 540px; margin: 40px auto; background: #121212; border: 1px solid #2EE6C5;
                             border-radius: 18px; padding: 40px; }
                h1 { color: #2EE6C5; font-size: 28px; margin: 0 0 8px; }
                p  { color: #cccccc; line-height: 1.6; font-size: 15px; }
                .otp-box { display: inline-block; margin: 24px 0; background: #1a1a1a; color: #E8791A;
                        padding: 14px 36px; border-radius: 10px; border: 1px dashed #E8791A;
                        font-weight: 700; font-size: 24px; letter-spacing: 4px; }
                .note { color: #888; font-size: 13px; margin-top: 24px; }
                .footer { color: #555; font-size: 12px; text-align: center; margin-top: 32px; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>Verify Your Account</h1>
                <p>Hi <strong style="color:#fff">%s</strong>,</p>
                <p>Thank you for registering with AreaCalculator.
                   Please use the One-Time Password (OTP) below to verify your email address and activate your account.</p>
                <div class="otp-box">%s</div>
                <p class="note">This OTP expires in <strong>10 minutes</strong>.<br>
                   If you didn't register for this account, you can safely ignore this email.</p>
                <div class="footer">AreaCalculator &mdash; by Salman Ansari</div>
              </div>
            </body>
            </html>
            """.formatted(fullName != null ? fullName : "there", otpCode);
    }
}
