import { writeFile } from "fs/promises";
import openapiTS, { astToString } from "openapi-typescript";

(async () => {
  // Download file
  const url = new URL("http://localhost:8000/openapi.json");
  const response = await fetch(url);
  const text = await response.text();
  await writeFile("./lib/tools/swagger.json", text);

  // Generate types
  const ast = await openapiTS(new URL("./swagger.json", import.meta.url), {});
  const formatted = astToString(ast);
  await writeFile("./lib/api/swagger.ts", formatted);
})();
