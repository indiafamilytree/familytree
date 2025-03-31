import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { storage } from "./storage/resource";
import { neo4j } from "./functions/neo4j/resource";

defineBackend({
  auth,
  data,
  storage,
  neo4j,
});
