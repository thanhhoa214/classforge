import createFetchClient from "openapi-fetch";
import createClient from "openapi-react-query";
import type { paths } from "./swagger";

const FetchClient = createFetchClient<paths>({
  baseUrl: "http://localhost:8000",
});

const ApiQueryClient = createClient(FetchClient);

export { ApiQueryClient, FetchClient };
