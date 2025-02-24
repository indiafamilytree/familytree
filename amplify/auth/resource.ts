import { defineAuth, secret } from "@aws-amplify/backend";
import config from "../../config/config.js";

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
      callbackUrls: config.callbackUrls,
      logoutUrls: config.logoutUrls,
    },
  },
});
