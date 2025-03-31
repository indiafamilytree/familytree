import { defineFunction, secret } from "@aws-amplify/backend";

export const neo4j = defineFunction({
  name: "neo4j",
  entry: "./handler.ts",
  timeoutSeconds: 30,
  runtime: 22,
  environment: {
    NEO4J_URI: secret("NEO4J_URI"),
    NEO4J_USER_ID: secret("NEO4J_USER_ID"),
    NEO4J_SECRET: secret("NEO4J_SECRET"),
  },
});
