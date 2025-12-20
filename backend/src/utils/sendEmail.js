import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendVerificationEmail = async (email, link) => {
  await transporter.sendMail({
    from: `"GreenReceipt" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify your GreenReceipt account",
    html: `
      <h2>Welcome to GreenReceipt 🌱</h2>
      <p>Please verify your email to activate your account.</p>
      <a href="${link}" style="padding:10px 20px;background:#16A34A;color:white;border-radius:6px;text-decoration:none;">
        Verify Email
      </a>
      <p>This link will expire in 10 minutes.</p>
    `,
  });
};

export const sendOtpEmail = async (email, code) => {
  await transporter.sendMail({
    from: `"GreenReceipt" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your GreenReceipt verification code",
    html: `
      <h2>Verify your email</h2>
      <p>Use the code below to verify your GreenReceipt account. This code expires in 10 minutes.</p>
      <div style="font-size:28px;font-weight:700;letter-spacing:8px;margin:16px 0;">${code}</div>
      <p>If you did not request this, you can safely ignore this email.</p>
    `,
  });
};
