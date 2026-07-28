package com.needforfood.service;

import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

@Service
@Slf4j
public class EmailService {

    private static final String APP_ICON_PATH = "static/images/app-icon.png";
    private static final String APP_ICON_CONTENT_ID = "appIcon";

    private final JavaMailSender mailSender;
    private final String fromAddress;

    public EmailService(JavaMailSender mailSender, @Value("${app.mail.from}") String fromAddress) {
        this.mailSender = mailSender;
        this.fromAddress = fromAddress;
    }

    public void sendVerificationCode(String toEmail, String username, String code) {
        log.info("Code de vérification pour {} ({}) : {}", toEmail, username, code);

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, MimeMessageHelper.MULTIPART_MODE_RELATED, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(toEmail);
            helper.setSubject("Vérifiez votre compte Need for Food");
            helper.setText(buildVerificationHtml(username, code), true);
            helper.addInline(APP_ICON_CONTENT_ID, new ClassPathResource(APP_ICON_PATH));

            mailSender.send(mimeMessage);
        } catch (Exception e) {
            log.warn("Échec de l'envoi de l'e-mail de vérification à {} : {}", toEmail, e.getMessage());
        }
    }

    private String buildVerificationHtml(String username, String code) {
        String safeUsername = HtmlUtils.htmlEscape(username);
        String safeCode = HtmlUtils.htmlEscape(code);

        return "<div style=\"font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; text-align: center;\">"
                + "<img src=\"cid:" + APP_ICON_CONTENT_ID + "\" width=\"72\" height=\"72\" alt=\"Need for Food\" "
                + "style=\"border-radius: 16px; margin-bottom: 16px;\" />"
                + "<h2 style=\"color: #2f6b3a; margin: 0 0 8px;\">Need for Food</h2>"
                + "<p style=\"color: #555; margin: 0 0 24px;\">Bonjour " + safeUsername + ",</p>"
                + "<p style=\"color: #555; margin: 0 0 16px;\">Voici votre code de vérification :</p>"
                + "<div style=\"font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1a1a1a; "
                + "background: #f2f2f2; border-radius: 12px; padding: 16px 24px; display: inline-block; margin-bottom: 16px;\">"
                + safeCode
                + "</div>"
                + "<p style=\"color: #999; font-size: 13px;\">Ce code expire dans 15 minutes.</p>"
                + "<p style=\"color: #999; font-size: 12px; margin-top: 32px;\">L'équipe Need for Food</p>"
                + "</div>";
    }
}
