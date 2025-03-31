import { generateClient } from "aws-amplify/api";

const client = generateClient({
  authMode: "oidc",
});

export async function createPerson() {
  console.log(client.queries);
  let lambdaresponse = await client.queries.graphdb({});
  console.log(lambdaresponse);
  return lambdaresponse;
}
