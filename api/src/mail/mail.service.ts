import { Injectable, Logger } from '@nestjs/common';



@Injectable()
export class MailService {
  private readonly mailjet;
  private readonly fromEmail = process.env.FROM_EMAIL;
  private readonly fromName = process.env.APP_NAME!;


  constructor() {
    this.mailjet = require('node-mailjet').apiConnect(
        process.env.MJ_APIKEY_PUBLIC,
        process.env.MJ_APIKEY_PRIVATE
    );

  }

  async sendConfirmationEmail(toEmail: string, confirmationToken: string) {
    
    const confirmUrl = `http://localhost:4200/confirm-account?token=${confirmationToken}`;
    
    try {
      await this.mailjet.post('send', { version: 'v3.1' }).request({
        Messages: [
          {
            From: { Email: this.fromEmail, Name: this.fromName },
            To: [{ Email: toEmail }],
            Subject: 'Confirmez votre inscription Ymoia',
            HTMLPart: `
  <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px 24px;background:#fff;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
    <h2 style="font-size:30px;color:#2166f5;margin-bottom:8px;margin-top:0;text-align:center;">Ymoia</h2>
    <div style="margin-bottom:24px;">
      <h3 style="color:#222;margin-bottom:10px;">Bienvenue sur Ymoia !</h3>
      <p style="color:#444;font-size:14px;line-height:1.6;margin:0 0 16px 0;">
        Merci de vous être inscrit.<br>
        Cliquez sur le lien ci-dessous pour activer votre compte :
      </p>
        <span style="color:#2166f5;">${confirmUrl}</span>
        <p style="color:#666;font-size:13px;margin:24px 0 0 0;">
        Ce lien est valable 1 heure.<br>
      </p>
    </div>
    <div style="font-size:12px;color:#bbb;text-align:center;margin-top:30px;">
      © Ymoia ${new Date().getFullYear()}
    </div>
  </div>
`,
          },
        ],
      });
      Logger.log(`Confirmation email sent to ${toEmail}`);
      
    } catch (err) {
        console.log('Erreur lors de l’envoi du mail de confirmation', err);
        
      Logger.error('Erreur envoi mail de confirmation', err);
      throw new Error('Erreur lors de l’envoi du mail de confirmation.');
    }
  }
}
