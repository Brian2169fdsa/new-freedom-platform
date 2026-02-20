import {z} from "zod";
import {INVITE_REQUESTS_COLLECTION} from "../../utilities/constants";
import {runTransactionAndUpdate} from "../../utilities/runTransactionAndUpdate";
import {Timestamp, WithFieldValue} from "firebase-admin/firestore";
import {setDocumentById} from "../../utilities/setDocumentById";
import {deleteDocumentById} from "../../utilities/deleteDocById";
import {getDocumentById} from "../../utilities/getDocumentById";
import {updateDocumentById} from "../../utilities/updateDocumentById";

export const InviteRequest = z.object({
  id: z.string().min(1),
  ownerId: z.string().min(1),
  email: z.string().email().min(1),
  status: z.enum(["pending", "assigned", "completed"]).default("pending"),
  createdAt: z.instanceof(Timestamp),
  updatedAt: z.instanceof(Timestamp),
}).strict();

export type InviteRequest = WithFieldValue<z.infer<typeof InviteRequest>>;

export const atomicUpdateInviteRequestById =
  runTransactionAndUpdate(InviteRequest, INVITE_REQUESTS_COLLECTION);
export const setInviteRequestById =
  setDocumentById<InviteRequest>(INVITE_REQUESTS_COLLECTION);
export const deleteInviteRequestById =
  deleteDocumentById(INVITE_REQUESTS_COLLECTION);
export const getInviteRequestById =
  getDocumentById(InviteRequest, INVITE_REQUESTS_COLLECTION);
export const updateInviteRequestById =
  updateDocumentById<InviteRequest>(INVITE_REQUESTS_COLLECTION);
