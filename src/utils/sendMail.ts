import nodemailer, { SentMessageInfo } from "nodemailer";
import { ApiError } from "./apiError.js";

const sendEmail = async (email: string, subject: string, html: string) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const info: SentMessageInfo = await transporter.sendMail({
      from: `ekart ${process.env.EMAIL_FROM}`,
      to: email,
      subject: subject,
      html: html,
    });

    return info;
  } catch (error) {
    throw new ApiError(500, "Error while sending mail");
  }
};

export default sendEmail;
