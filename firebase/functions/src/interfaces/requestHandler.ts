import {onRequest} from "firebase-functions/v2/https";
import {RequestConfig} from "./requestConfig";
import {
  AppendableHttpsError,
  HttpErrorCodes,
  UnknownError,
} from "../utilities/errors";
import {Request} from "firebase-functions/lib/common/providers/https";
import {z, ZodError} from "zod";
import {assertDataType} from "../utilities/assertDataType";

/**
 * Handles HTTP requests by validating the request type,
 *  executing the provided function, and sending the response.
 *
 * @param {object} config - The request configuration.
 * @param {function} fn - The function to
 *  execute with the validated request.
 * @return {RequestHandler} - The request handler function.
 */
export function requestHandler<Req extends z.ZodTypeAny, Res>(
  config: RequestConfig<Req, Res>,
  fn: (request: z.infer<Req>) => Promise<Res>
) {
  return onRequest(
    {cors: [
      "https://position-of-neutrality-g9zijd.flutterflow.app",
      "https://newfreedom-637b5-7c3c3.firebaseapp.com",
      "http://localhost:3001",
      "http://localhost:3002",
      "http://localhost:3003",
      "http://localhost:3004",
    ]},
    async (request: Request, response): Promise<void> => {
      const {query} = request;
      try {
        // validate request type
        assertDataType(config.schema, query);

        const result = await fn(query);
        response.status(200).send(result);
      } catch (error) {
        if (error instanceof AppendableHttpsError) {
          response.status(HttpErrorCodes[error.code]).send({
            success: false, error: error.append(config.name).message});
        } else if (error instanceof ZodError) {
          response.status(HttpErrorCodes["invalid-argument"]).send({
            success: false, error: "invalid-argument",
          });
        } else {
          response.status(500).send({success: false, error: UnknownError});
        }
      }
    });
}
