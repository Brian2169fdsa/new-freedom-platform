import {CallableRequest, onCall} from "firebase-functions/v2/https";
import {logger} from "firebase-functions";
import {getAuthUserIdOrThrow} from "../utilities/getAuthUserIdOrThrow";
import {Context, DefaultOptions} from "./context";
import {
  AppendableHttpsError,
  internalError, InvalidArgumentError, InvalidRoleError,
  UnknownError,
} from "../utilities/errors";
import {z, ZodError} from "zod";
import {RequestConfig} from "./requestConfig";
import {assertDataType} from "../utilities/assertDataType";
import {getUserById, User} from "../models/data/user";
import {validateOrThrow} from "../utilities/validateOrThrow";
import {isProd} from "../utilities/isProd";

/**
 * Handles callable function calls by validating the request type, executing
 *  the provided function, and returning the response.
 *
 * @param {object} config - The request configuration.
 * @param {function} fn - The
 *  function to execute with the validated request and context.
 * @return {CallableFunction} - The callable function handler.
 */
export function callHandler<Req extends z.ZodTypeAny, Res>(
  config: RequestConfig<Req, Res>,
  fn: (request: z.infer<Req>, context: Context) => Promise<Res>
) {
  return onCall(async (request: CallableRequest<unknown>) => {
    const {data} = request;
    const contextOptions = config.contextOptions ?? DefaultOptions;
    const ctx: Context = {
      authUserId: "UNUSED",
      authUser: {} as User,
    };

    try {
      // validate request type
      assertDataType(config.schema, data);
      // handle context options
      if (contextOptions.withAuthUserId) {
        ctx.authUserId = getAuthUserIdOrThrow(request);
        if (contextOptions.withRole != "UNUSED" || contextOptions.includeUser) {
          const user = await getUserById(ctx.authUserId);
          ctx.authUser = user;
          if (contextOptions.withRole != "UNUSED") {
            const requestedByRole = user.role === contextOptions.withRole;
            validateOrThrow(requestedByRole, InvalidRoleError);
          }
        }
      }

      return await fn(data, ctx);
    } catch (error) {
      /* v8 ignore next 3 */
      if (isProd()) {
        logger.error("callHandler error : " + JSON.stringify(error));
      }
      if (error instanceof AppendableHttpsError) {
        throw error.append(config.name);
      } else if (error instanceof ZodError) {
        throw InvalidArgumentError.append(config.name);
      }
      throw internalError(error ? JSON.stringify(error) : UnknownError);
    }
  });
}
