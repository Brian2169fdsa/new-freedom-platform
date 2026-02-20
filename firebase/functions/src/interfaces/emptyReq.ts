import {z} from "zod";

export const EmptyReq = z.object({
});

export type EmptyReq = z.infer<typeof EmptyReq>;
