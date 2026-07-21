import { Hono } from "hono";

const privacyRouter = new Hono();

privacyRouter.get("/", (c) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Privacy Policy — KEL Smart</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #252525;
      color: #E0E0E0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 16px;
      line-height: 1.7;
      padding: 0 0 60px;
    }
    header {
      background-color: #1a1a1a;
      border-bottom: 1px solid #333;
      padding: 32px 24px 28px;
      text-align: center;
    }
    header h1 {
      color: #F59E0B;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.3px;
      margin-bottom: 8px;
    }
    header p {
      color: #9E9E9E;
      font-size: 14px;
    }
    main {
      max-width: 760px;
      margin: 0 auto;
      padding: 40px 24px 0;
    }
    .intro {
      background-color: #2e2e2e;
      border-left: 4px solid #F59E0B;
      border-radius: 6px;
      padding: 18px 20px;
      margin-bottom: 36px;
      font-size: 15px;
      color: #C0C0C0;
    }
    section {
      margin-bottom: 36px;
    }
    h2 {
      color: #F59E0B;
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 14px;
      padding-bottom: 6px;
      border-bottom: 1px solid #333;
    }
    h3 {
      color: #BDBDBD;
      font-size: 15px;
      font-weight: 600;
      margin: 14px 0 8px;
    }
    p {
      margin-bottom: 10px;
      color: #E0E0E0;
    }
    ul {
      margin: 8px 0 10px 20px;
      color: #E0E0E0;
    }
    ul li {
      margin-bottom: 5px;
    }
    a {
      color: #F59E0B;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    .badge {
      display: inline-block;
      background-color: #F59E0B22;
      color: #F59E0B;
      border: 1px solid #F59E0B55;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      padding: 2px 8px;
      margin-right: 6px;
      vertical-align: middle;
    }
    footer {
      margin-top: 60px;
      border-top: 1px solid #333;
      padding-top: 24px;
      text-align: center;
      color: #757575;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <header>
    <h1>Privacy Policy</h1>
    <p>KEL Smart &nbsp;&bull;&nbsp; Last Updated: March 21, 2026</p>
  </header>

  <main>
    <div class="intro">
      KEL Electronic Solution ("we", "our", or "us") operates the KEL Smart mobile application. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application.
    </div>

    <!-- 1 -->
    <section>
      <h2>1. Information We Collect</h2>

      <h3>Personal Information</h3>
      <p>When you create an account, we collect:</p>
      <ul>
        <li>Email address and password (via Firebase Authentication)</li>
        <li>Full name</li>
        <li>Company name</li>
        <li>Phone number</li>
      </ul>

      <h3>Tank Monitoring Data</h3>
      <p>To provide our core service, we collect:</p>
      <ul>
        <li>Tank configurations and settings</li>
        <li>Sensor data and readings</li>
        <li>Historical monitoring data</li>
        <li>Alert settings and notification preferences</li>
        <li>Sensor metadata and calibration information</li>
      </ul>

      <h3>Device &amp; Usage Information</h3>
      <p>We automatically collect:</p>
      <ul>
        <li>Device information (type, operating system, unique device identifiers)</li>
        <li>Usage patterns and app interaction data</li>
      </ul>
    </section>

    <!-- 2 -->
    <section>
      <h2>2. How We Use Your Information</h2>
      <ul>
        <li><strong>Service Provision:</strong> To operate and deliver the KEL Smart monitoring service</li>
        <li><strong>Improvement:</strong> To analyze usage and improve features and performance</li>
        <li><strong>Communication:</strong> To send alerts, notifications, and support responses</li>
        <li><strong>Security &amp; Compliance:</strong> To detect fraud, enforce terms, and meet legal obligations</li>
      </ul>
    </section>

    <!-- 3 -->
    <section>
      <h2>3. Data Storage and Security</h2>
      <p>Your data is stored securely using Google Firebase infrastructure. We implement the following safeguards:</p>
      <ul>
        <li>SSL/TLS encryption for all data in transit</li>
        <li>Firebase Authentication for secure user identity management</li>
        <li>Role-based access control to limit data access</li>
        <li>Firebase Security Rules to protect database and storage resources</li>
      </ul>
    </section>

    <!-- 4 -->
    <section>
      <h2>4. Data Sharing and Disclosure</h2>
      <p><strong>We do NOT sell your personal data.</strong> We may share information only in the following limited circumstances:</p>
      <ul>
        <li><strong>Firebase / Google Cloud:</strong> As our infrastructure and hosting provider</li>
        <li><strong>Legal Requirements:</strong> When required by law, court order, or governmental authority</li>
        <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets, with appropriate confidentiality protections</li>
      </ul>
    </section>

    <!-- 5 -->
    <section>
      <h2>5. Your Data Rights and Choices</h2>
      <p>You have the right to:</p>
      <ul>
        <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
        <li><strong>Update:</strong> Correct inaccurate or incomplete information via app settings</li>
        <li><strong>Delete:</strong> Request deletion of your account and associated data</li>
        <li><strong>Export:</strong> Receive your data in a portable format upon request</li>
      </ul>
      <p>To delete your account, go to <strong>Settings → Account → Delete Account</strong> within the app, or contact us at <a href="mailto:support@kel-electronics.com">support@kel-electronics.com</a>. Account deletion requests are processed within <strong>30 days</strong>.</p>
    </section>

    <!-- 6 -->
    <section>
      <h2>6. Third-Party Services</h2>
      <ul>
        <li><strong>Firebase / Google Cloud Platform:</strong> Authentication, database, and cloud storage. Governed by <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Google's Privacy Policy</a>.</li>
        <li><strong>ESP32 Sensors:</strong> Hardware sensors that transmit monitoring data to our backend. No personal data is collected by sensor hardware.</li>
      </ul>
    </section>

    <!-- 7 -->
    <section>
      <h2>7. Children's Privacy</h2>
      <p>The KEL Smart application is not directed to individuals under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that a child under 13 has provided us with personal information, we will delete it promptly.</p>
    </section>

    <!-- 8 -->
    <section>
      <h2>8. International Data Transfers</h2>
      <p>Your information is processed and stored in the United States via Firebase / Google Cloud Platform. If you are located outside the United States, your data will be transferred to and processed in the US. By using the app, you consent to this transfer.</p>
    </section>

    <!-- 9 -->
    <section>
      <h2>9. California Privacy Rights (CCPA)</h2>
      <p>If you are a California resident, you have the following rights under the California Consumer Privacy Act:</p>
      <ul>
        <li><strong>Right to Know:</strong> Request disclosure of the categories and specific pieces of personal information we have collected about you</li>
        <li><strong>Right to Delete:</strong> Request deletion of your personal information, subject to certain exceptions</li>
        <li><strong>Right to Opt-Out:</strong> We do not sell personal information, so this right is not applicable</li>
        <li><strong>Right to Non-Discrimination:</strong> We will not discriminate against you for exercising your CCPA rights</li>
      </ul>
      <p>To exercise your CCPA rights, contact us at <a href="mailto:privacy@kel-electronics.com">privacy@kel-electronics.com</a>.</p>
    </section>

    <!-- 10 -->
    <section>
      <h2>10. European Privacy Rights (GDPR)</h2>
      <p>If you are located in the European Economic Area, you have the following rights under the General Data Protection Regulation:</p>
      <ul>
        <li><strong>Right of Access:</strong> Obtain a copy of your personal data</li>
        <li><strong>Right to Rectification:</strong> Correct inaccurate personal data</li>
        <li><strong>Right to Erasure:</strong> Request deletion of your personal data ("right to be forgotten")</li>
        <li><strong>Right to Restriction:</strong> Restrict how we process your personal data</li>
        <li><strong>Right to Data Portability:</strong> Receive your data in a structured, machine-readable format</li>
        <li><strong>Right to Object:</strong> Object to processing based on legitimate interests</li>
        <li><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time without affecting prior processing</li>
      </ul>
      <p>To exercise your GDPR rights, contact us at <a href="mailto:privacy@kel-electronics.com">privacy@kel-electronics.com</a>.</p>
    </section>

    <!-- 11 -->
    <section>
      <h2>11. Changes to This Privacy Policy</h2>
      <p>We may update this Privacy Policy from time to time. When we do:</p>
      <ul>
        <li>We will notify you via an in-app notification</li>
        <li>We will update the "Last Updated" date at the top of this page</li>
        <li>For significant changes, we will also send an email notification</li>
      </ul>
      <p>Continued use of the app after changes are posted constitutes your acceptance of the updated policy.</p>
    </section>

    <!-- 12 -->
    <section>
      <h2>12. Data Breach Notification</h2>
      <p>In the event of a data breach that affects your personal information, we will notify you within <strong>72 hours</strong> of becoming aware of the breach, in accordance with applicable law. Notification will be sent to the email address associated with your account.</p>
    </section>

    <!-- 13 -->
    <section>
      <h2>13. Contact Us</h2>
      <p>If you have questions, concerns, or requests related to this Privacy Policy, please contact us:</p>
      <ul>
        <li><strong>Company:</strong> KEL Electronic Solution</li>
        <li><strong>Privacy inquiries:</strong> <a href="mailto:privacy@kel-electronics.com">privacy@kel-electronics.com</a></li>
        <li><strong>Support:</strong> <a href="mailto:support@kel-electronics.com">support@kel-electronics.com</a></li>
      </ul>
      <p>We aim to respond to all privacy-related inquiries within <strong>48 hours</strong>.</p>
    </section>

    <!-- 14 -->
    <section>
      <h2>14. Your Consent</h2>
      <p>By using the KEL Smart application, you consent to this Privacy Policy and agree to its terms. If you do not agree with this policy, please discontinue use of the application and contact us to request deletion of your data.</p>
    </section>

    <footer>
      &copy; 2026 K.E.L. Electronic Solution. All rights reserved.
    </footer>
  </main>
</body>
</html>`;

  return c.html(html);
});

export { privacyRouter };
