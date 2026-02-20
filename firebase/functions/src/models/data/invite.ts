import {z} from "zod";
import {getDocumentById} from "../../utilities/getDocumentById";
import {INVITES_COLLECTION} from "../../utilities/constants";
import {getReferenceById} from "../../utilities/getReferenceById";
import {deleteDocumentById} from "../../utilities/deleteDocById";
import {Timestamp, WithFieldValue} from "firebase-admin/firestore";
import {setDocumentById} from "../../utilities/setDocumentById";
import {runTransactionAndUpdate} from "../../utilities/runTransactionAndUpdate";

export const Invite = z.object({
  id: z.string().min(1),
  authorId: z.string().min(1),
  inviteCode: z.string().min(1),
  ownerId: z.string().min(1),
  useCount: z.number().default(0),
  createdAt: z.instanceof(Timestamp),
  updatedAt: z.instanceof(Timestamp),
}).strict();

export type Invite = WithFieldValue<z.infer<typeof Invite>>;

export const atomicUpdateInviteById =
  runTransactionAndUpdate(Invite, INVITES_COLLECTION);
export const getInviteById = getDocumentById(Invite, INVITES_COLLECTION);
export const getInviteRefById = getReferenceById(INVITES_COLLECTION);
export const deleteInviteById = deleteDocumentById(INVITES_COLLECTION);
export const setInviteById = setDocumentById<Invite>(INVITES_COLLECTION);
