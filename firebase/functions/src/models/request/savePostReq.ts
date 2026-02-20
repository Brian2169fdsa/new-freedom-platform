import {z} from "zod";
import {RequestMediaElement} from "./requestMediaElement";

export const SavePostReq = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  text: z.string().optional().default(""),
  dev: z.boolean().optional().default(false),
  title: z.string().optional().default(""),
  messageboardLink: z.string().optional().default(""),
  replyTo: z.string().optional().default(""),
  media: z.array(RequestMediaElement).optional().default([]),
});

export type SavePostReq = z.infer<typeof SavePostReq>;

