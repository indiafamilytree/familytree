import { defineStorage } from "@aws-amplify/backend";

export const storage = defineStorage({
  name: "treeStore",
  isDefault: true,
  access: (allow) => ({
    "entity-files/{entity_id}/*": [
      allow.authenticated.to(["read", "write", "delete"]),
    ],
  }),
});
