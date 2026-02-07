const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// https://stackoverflow.com/questions/9719570/generate-random-password-string-with-5-letters-and-3-numbers-in-javascript
const generateUserPassword = (
  length = 12,
  characters = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz~!@-#$"
) => {
  return Array.from(crypto.getRandomValues(new Uint32Array(length)))
    .map((x) => characters[x % characters.length])
    .join("");
};

const googleGetUserInfo = async (code) => {
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      grant_type: "authorization_code",
      // https://stackoverflow.com/questions/74189161/google-identity-services-sdk-authorization-code-model-in-popup-mode-how-to-r
      redirect_uri: "postmessage",
    }),
  });
  if (!tokenRes.ok) {
    throw new Error("Authentication failed.");
  }
  const tokenData = await tokenRes.json();
  const ticket = await client.verifyIdToken({
    idToken: tokenData.id_token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const { name, email, email_verified: isEmailVerified } = ticket.getPayload();
  return {name, email, isEmailVerified };
};

module.exports = {
  generateUserPassword,
  googleGetUserInfo,
};
