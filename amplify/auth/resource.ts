import { defineAuth, secret } from "@aws-amplify/backend";

export const auth = defineAuth({
  loginWith: {
    email: true,
    externalProviders: {
      google: {
        clientId: secret("GOOGLE_CLIENT_ID"),
        clientSecret: secret("GOOGLE_CLIENT_SECRET"),
        scopes: ["profile", "email", "openid"],
        attributeMapping: {
          email: "email",
          givenName: "given_name",
          familyName: "family_name",
          emailVerified: "email_verified",
          gender: "genders",
        },
      },
      callbackUrls: [
        "http://localhost:5173/",
        "https://familytree.releasign.com",
      ],
      logoutUrls: [
        "http://localhost:5174/",
        "https://familytree.releasign.com",
      ],
    },
  },
});
