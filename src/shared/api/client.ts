import createClient from "openapi-fetch"
import type { paths } from "./schema";

export const client = createClient<paths>({baseUrl: "https://musicfun.it-incubator.app/api/1.0",
    headers: {
        'api-key': 'a03aefd6-d7fb-49bc-96e8-93041c87a1a7'
    }});