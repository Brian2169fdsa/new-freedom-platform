/* v8 ignore start */
import {ContextOptions} from "./context";
import {z} from "zod";

// Res is marked as unused, however it is used in the request
// and call handlers to determine response type
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface RequestConfig<Req extends z.ZodTypeAny, Res> {
  name: string,
  contextOptions?: ContextOptions,
  schema: Req
}
