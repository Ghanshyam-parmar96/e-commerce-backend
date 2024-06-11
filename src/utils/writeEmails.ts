export const sendOtpEmailForAccountVerification = (
  userName: string,
  otp: number,
  resend: boolean = false
): string => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Account - ${resend && "Resend"} OTP</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f6f6f6;
            margin: 0;
            padding: 0;
            color: #333333;
        }
        .container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 20px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            padding: 20px 0;
            background-color: #4CAF50;
            color: #ffffff;
        }
        .header h1 {
            margin: 0;
        }
        .content {
            padding: 20px;
        }
        .content h2 {
            color: #4CAF50;
        }
        .otp {
            font-size: 20px;
            font-weight: bold;
            margin: 20px 0;
            display: inline-block;
            padding: 10px;
            background-color: #f9f9f9;
            border: 1px solid #dddddd;
            border-radius: 5px;
        }
        .footer {
            text-align: center;
            padding: 20px;
            font-size: 12px;
            color: #888888;
        }
        .footer a {
            color: #4CAF50;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>ekart - e-commerce website</h1>
        </div>
        <div class="content">
            <h2>Verify Your Account</h2>
            <p><strong>Dear ${userName}</strong>,</p>
            <p>Thank you for joining ekart!</p>
            <p>To complete your registration, please verify your email address by entering the One-Time Password (OTP) provided below. This step ensures the security of your account and access to all our features.</p>
            <div class="otp">Your OTP: ${otp}</div>
            <p>Please enter this OTP in the verification section of our website. The code is valid for the next 15 minutes.</p>
            <p>If you did not request this OTP, please ignore this email. Your account security remains intact.</p>
            <p>If you encounter any issues or need assistance, our support team is here to help. Contact us at <a href="mailto:support@yourwebsite.com">support@yourwebsite.com</a> or visit our <a href="yourwebsite.com/help">Help Center</a>.</p>
            <p>Thank you for choosing ekart!</p>
            <p>Best regards,<br>The ekart Team</p>
        </div>
        <div class="footer">
            <p>For more information, read our <a href="[Privacy Policy Link]">Privacy Policy</a>.</p>
            <p>&copy; 2024 [Your Website Name]. All rights reserved.</p>
            <p>This email was sent to [user@example.com]. If you no longer wish to receive these emails, you may <a href="[Unsubscribe Link]">unsubscribe</a>.</p>
        </div>
    </div>
</body>
</html>
`;
};

export const forgotPasswordEmail = (userName: string, otp: number) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset Request</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f6f6f6;
            margin: 0;
            padding: 0;
            color: #333333;
        }
        .container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 20px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            padding: 20px 0;
            background-color: #4CAF50;
            color: #ffffff;
        }
        .header h1 {
            margin: 0;
        }
        .content {
            padding: 20px;
        }
        .content h2 {
            color: #4CAF50;
        }
        .button {
            display: inline-block;
            padding: 10px 20px;
            font-size: 16px;
            color: #ffffff;
            background-color: #007bff;
            text-decoration: none;
            border-radius: 5px;
        }
        .otp {
            font-size: 20px;
            font-weight: bold;
            margin: 20px 0;
            display: inline-block;
            padding: 10px;
            background-color: #f9f9f9;
            border: 1px solid #dddddd;
            border-radius: 5px;
        }
        .footer {
            text-align: center;
            padding: 20px;
            font-size: 12px;
            color: #888888;
        }
        .footer a {
            color: #4CAF50;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>ekart - e-commerce website</h1>
        </div>
        <div class="content">
            <h2>Password Reset Request</h2>
            <p><strong>Dear ${userName}</strong>,</p>
            <p>We received a request to reset your password for your [Website Name] account. If you did not make this request, please ignore this email. Otherwise, you can reset your password using the link below:</p>
            <p><a href="#" class="button">Reset Password</a></p>
            <div class="otp">Your OTP: ${otp}</div>
            <p>For your security, this link will expire in 24 hours.</p>
            <p>If you encounter any issues or have any questions, please contact our support team.</p>
            <p>Thank you,<br>The ekart Team</p>
        </div>
        <div class="footer">
            <p>For more information, read our <a href="[Privacy Policy Link]">Privacy Policy</a>.</p>
            <p>&copy; 2024 [Your Website Name]. All rights reserved.</p>
            <p>This email was sent to [user@example.com]. If you no longer wish to receive these emails, you may <a href="[Unsubscribe Link]">unsubscribe</a>.</p>
        </div>
    </div>
</body>
</html>
`;
};
