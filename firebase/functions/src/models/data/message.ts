import {z} from "zod";
import {MESSAGES_COLLECTION} from "../../utilities/constants";
import {getDocumentById} from "../../utilities/getDocumentById";
import {deleteDocumentById} from "../../utilities/deleteDocById";
import {updateDocumentById} from "../../utilities/updateDocumentById";
import {Timestamp, WithFieldValue} from "firebase-admin/firestore";
import {setDocumentById} from "../../utilities/setDocumentById";
import {runTransactionAndUpdate} from "../../utilities/runTransactionAndUpdate";
import {MediaElement} from "./mediaElement";

export const Message = z.object({
  id: z.string().min(1),
  ownerId: z.string().min(1),
  archived: z.boolean().optional().default(false),
  authorId: z.string().min(1),
  dev: z.boolean().optional().default(false),
  groupId: z.string().min(1),
  media: z.array(MediaElement).optional().default([]),
  recipientIds: z.string().array().min(2),
  readBy: z.string().array().optional().default([]),
  text: z.string().optional().default(""),
  createdAt: z.instanceof(Timestamp),
  updatedAt: z.instanceof(Timestamp),
}).strict();

export type Message = WithFieldValue<z.infer<typeof Message>>;

export const atomicUpdateMessageById =
  runTransactionAndUpdate(Message, MESSAGES_COLLECTION);
export const getMessageById = getDocumentById(Message, MESSAGES_COLLECTION);
export const setMessageById = setDocumentById(MESSAGES_COLLECTION);
export const updateMessageById =
  updateDocumentById<Message>(MESSAGES_COLLECTION);
export const deleteMessageById = deleteDocumentById(MESSAGES_COLLECTION);
