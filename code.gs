function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const action = e.parameter.action;
  
  // Handle profile updates
  if (action === 'updateProfile') {
    const email = e.parameter.email.trim().toLowerCase();
    const username = e.parameter.username.trim();
    const profilePicture = e.parameter.profilePicture;
    
    return updateUserProfile(sheet, email, username, profilePicture);
  }
  
  // Regular registration flow
  const email = e.parameter.email.trim().toLowerCase();
  const password = e.parameter.password.trim();
  const username = e.parameter.username ? e.parameter.username.trim() : email.split('@')[0];
  const profilePicture = e.parameter.profilePicture || '';
  const isResend = e.parameter.resend === 'true';

  // Checking if this is a resend request
  if (isResend) {
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0].trim().toLowerCase() === email) {
        // Generate a new code and update it
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        sheet.getRange(i + 1, 4).setValue(code);
        
        // Send the new verification code
        sendVerificationEmail(email, username, code);
        return ContentService.createTextOutput("verification_sent");
      }
    }
    return ContentService.createTextOutput("email_not_found");
  }

  // Regular registration flow
  // Checking if the email already exists
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0].trim().toLowerCase() === email) { // Ensuring email is trimmed and lowercase
      return ContentService.createTextOutput("email_exists");
    }
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();  // Random 6-digit code
  const timestamp = new Date(); // Record registration time
  
  // Add username and profile picture to the spreadsheet
  sheet.appendRow([email, password, false, code, timestamp, username, profilePicture]);

  // Send the verification code to the email
  sendVerificationEmail(email, username, code);

  return ContentService.createTextOutput("verification_sent");
}

function updateUserProfile(sheet, email, username, profilePicture) {
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0].trim().toLowerCase() === email) {
      // Update username in column 6 (F)
      sheet.getRange(i + 1, 6).setValue(username);
      
      // Update profile picture in column 7 (G)
      sheet.getRange(i + 1, 7).setValue(profilePicture);
      
      return ContentService.createTextOutput("profile_updated");
    }
  }
  
  return ContentService.createTextOutput("user_not_found");
}

function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const action = e.parameter.action;
  
  // Handle sign in requests
  if (action === 'signin') {
    const email = e.parameter.email.trim().toLowerCase();
    const password = e.parameter.password.trim();
    
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      const rowEmail = String(data[i][0]).trim().toLowerCase();
      const rowPassword = String(data[i][1]).trim();
      const isVerified = data[i][2];
      
      if (rowEmail === email && rowPassword === password) {
        if (!isVerified) {
          return ContentService.createTextOutput("not_verified");
        }
        
        // Return user data including username and profile picture
        const userData = {
          email: rowEmail,
          username: data[i][5] || rowEmail.split('@')[0],
          profilePicture: data[i][6] || '',
          lastLogin: new Date().toISOString()
        };
        
        // Return success message with JSON data
        return ContentService.createTextOutput("success:" + JSON.stringify(userData));
      }
    }
    
    return ContentService.createTextOutput("invalid_credentials");
  }
  
  // Handle verification attempts
  const email = e.parameter.email?.trim().toLowerCase();
  const code = e.parameter.code?.trim();

  if (email && code) {
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      const rowEmail = String(data[i][0]).trim().toLowerCase();
      const rowCode = String(data[i][3]).trim();
      
      if (rowEmail === email && rowCode === code) {
        sheet.getRange(i + 1, 3).setValue(true);  // Update verified to true
        sheet.getRange(i + 1, 5).setValue(new Date()); // Record verification time
        return ContentService.createTextOutput("verified");
      }
    }
    return ContentService.createTextOutput("invalid_code");  // If code doesn't match
  }
  
  return ContentService.createTextOutput("missing_parameters");
}

/**
 * Sends a beautifully formatted verification email with the code
 */
function sendVerificationEmail(email, username, code) {
  const userName = username || email.split('@')[0]; // Use provided username or extract from email
  const formattedCode = code.split('').join(' '); // Add spaces between digits for readability
  
  // Create a professional HTML email template
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 0;
          background-color: #f7f7f7;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .email-wrapper {
          background-color: #ffffff;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        }
        .header {
          background-color: #1976D2;
          padding: 30px 40px;
          text-align: center;
        }
        .header h1 {
          color: white;
          margin: 0;
          font-size: 26px;
          font-weight: 600;
        }
        .content {
          padding: 40px;
          color: #333333;
        }
        .greeting {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 20px;
        }
        .message {
          font-size: 16px;
          line-height: 1.6;
          margin-bottom: 30px;
        }
        .verification-code {
          background-color: #f5f9ff;
          border: 1px solid #d0e3ff;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          margin-bottom: 30px;
        }
        .code {
          font-size: 32px;
          font-weight: 700;
          letter-spacing: 5px;
          color: #1976D2;
          margin: 10px 0;
        }
        .instructions {
          font-size: 14px;
          color: #666666;
          margin-bottom: 30px;
        }
        .footer {
          padding: 20px 40px;
          background-color: #f7f7f7;
          text-align: center;
          color: #666666;
          font-size: 12px;
        }
        .footer p {
          margin: 5px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="email-wrapper">
          <div class="header">
            <h1>Email Verification</h1>
          </div>
          <div class="content">
            <p class="greeting">Hello ${userName},</p>
            <p class="message">
              Thank you for registering! To complete your account setup, please verify your email address by entering the verification code below:
            </p>
            <div class="verification-code">
              <p style="margin-bottom: 5px; color: #666;">Your verification code is:</p>
              <div class="code">${formattedCode}</div>
            </div>
            <p class="instructions">
              This code will expire in 30 minutes. If you didn't request this code, you can safely ignore this email.
            </p>
          </div>
          <div class="footer">
            <p>This is an automated message, please do not reply to this email.</p>
            <p>© ${new Date().getFullYear()} Oria by Xexis. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  // Create plain text version as fallback
  const plainTextBody = 
    `Hello ${userName},
    
Thank you for registering! To complete your account setup, please verify your email address using the verification code below:

Your verification code: ${code}

This code will expire in 30 minutes. If you didn't request this code, you can safely ignore this email.

This is an automated message, please do not reply to this email.
© ${new Date().getFullYear()} Oria by Xexis. All rights reserved.`;

  // Send the email with both HTML and plain text versions
  GmailApp.sendEmail(
    email,
    "Verify Your Email Address",
    plainTextBody,
    {
      htmlBody: htmlBody,
      name: "Oria Account Verification"
    }
  );
} 