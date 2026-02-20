import {z} from "zod";
import {getDocumentById} from "../../utilities/getDocumentById";
import {
  DELETED_USERS_COLLECTION,
  USERS_COLLECTION,
} from "../../utilities/constants";
import {deleteDocumentById} from "../../utilities/deleteDocById";
import {runTransactionAndUpdate} from "../../utilities/runTransactionAndUpdate";
import {updateDocumentById} from "../../utilities/updateDocumentById";
import {Timestamp, WithFieldValue} from "firebase-admin/firestore";
import {setDocumentById} from "../../utilities/setDocumentById";

export const User = z.object({
  id: z.string().min(1),
  ownerId: z.string().min(1),
  allowPhoneContact: z.boolean().default(false),
  anonymous: z.boolean().default(true),
  archived: z.boolean().default(false),
  blockedUsers: z.string().array().default([]),
  dev: z.boolean().default(false),
  displayName: z.string().default(""),
  email: z.string().email().min(1),
  firstName: z.string().default(""),
  lastName: z.string().default(""),
  likeCount: z.number().default(0),
  phone: z.string().default(""),
  profilePicURL: z.union([
    z.literal("").optional(),
    z.string().url().optional(),
  ]),
  role: z.string().min(1).default("member"),
  createdAt: z.instanceof(Timestamp),
  updatedAt: z.instanceof(Timestamp),
}).strict();

export type User = WithFieldValue<z.infer<typeof User>>;

export const setUserById = setDocumentById(USERS_COLLECTION);
export const updateUserById = updateDocumentById<User>(USERS_COLLECTION);
export const atomicUpdateUserById =
  runTransactionAndUpdate(User, USERS_COLLECTION);
export const getUserById = getDocumentById(User, USERS_COLLECTION);
export const deleteUserById = deleteDocumentById(USERS_COLLECTION);

export const deleteDeletedUserById =
  deleteDocumentById(DELETED_USERS_COLLECTION);
