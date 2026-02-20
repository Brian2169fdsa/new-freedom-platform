import {z} from "zod";
import {RequestMediaElement} from "./requestMediaElement";

export const SaveMessageReq = z.object({
  id: z.string().min(1),
  text: z.string().optional().default(""),
  dev: z.boolean().optional().default(false),
  groupId: z.string().min(1),
  recipientIds: z.string().array().min(2),
  media: z.array(RequestMediaElement).optional().default([]),
});

export type SaveMessageReq = z.infer<typeof SaveMessageReq>;

