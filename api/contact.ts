import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const toEmail = process.env.CONTACT_TO_EMAIL;
const fromEmail = process.env.CONTACT_FROM_EMAIL;

const resend = resendApiKey ? new Resend(resendApiKey) : null;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!resend || !toEmail || !fromEmail) {
    console.error("Missing email configuration environment variables.");
    return res
      .status(500)
      .json({ error: "Email configuration is not set on the server." });
  }

  try {
    const body = (req.body || {}) as {
      name?: string;
      email?: string;
      company?: string;
      projectType?: string;
      budget?: string;
      message?: string;
      companyWebsite?: string; // honeypot
    };

    const {
      name,
      email,
      company,
      projectType,
      budget,
      message,
      companyWebsite,
    } = body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    // Honeypot: silently accept but do nothing if filled in
    if (companyWebsite && companyWebsite.trim() !== "") {
      return res.status(200).json({ ok: true });
    }

    const subject = `New lead from DT Software site: ${name}`;
    const textLines = [
      `Name: ${name}`,
      `Email: ${email}`,
      company ? `Company: ${company}` : null,
      projectType ? `Project type: ${projectType}` : null,
      budget ? `Budget: ${budget}` : null,
      "",
      "Message:",
      message,
    ].filter(Boolean) as string[];

    const text = textLines.join("\n");

    const { error } = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject,
      text,
      reply_to: email,
    });

    if (error) {
      console.error("Resend error:", error);
      return res.status(500).json({ error: "Error sending email." });
    }

    return res
      .status(200)
      .json({ ok: true, message: "Lead sent successfully." });
  } catch (err) {
    console.error("Unexpected error in contact handler:", err);
    return res
      .status(500)
      .json({ error: "Unexpected error. Please try again later." });
  }
}


