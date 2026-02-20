import {z} from "zod";
import {POSTS_COLLECTION} from "../../utilities/constants";
import {getDocumentById} from "../../utilities/getDocumentById";
import {deleteDocumentById} from "../../utilities/deleteDocById";
import {updateDocumentById} from "../../utilities/updateDocumentById";
import {Timestamp, WithFieldValue} from "firebase-admin/firestore";
import {setDocumentById} from "../../utilities/setDocumentById";
import {runTransactionAndUpdate} from "../../utilities/runTransactionAndUpdate";
import {MediaElement} from "./mediaElement";

export const Post = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  ownerId: z.string().min(1),
  replyTo: z.string().optional(),
  archived: z.boolean().default(false),
  authorDisplayName: z.string().default(""),
  authorId: z.string().min(1),
  authorProfilePicURL: z.union([
    z.literal("").optional(),
    z.string().url().optional(),
  ]),
  dev: z.boolean().default(false),
  isReply: z.boolean().default(false),
  likedBy: z.string().array().default([]),
  media: z.array(MediaElement).optional().default([]),
  messageboardLink: z.string().optional().default(""),
  replies: z.string().array().default([]),
  text: z.string().optional().default(""),
  title: z.string().optional().default(""),
  createdAt: z.instanceof(Timestamp),
  updatedAt: z.instanceof(Timestamp),
}).strict();

export type Post = WithFieldValue<z.infer<typeof Post>>;

export const atomicUpdatePostById =
  runTransactionAndUpdate(Post, POSTS_COLLECTION);
export const getPostById = getDocumentById(Post, POSTS_COLLECTION);
export const setPostById = setDocumentById(POSTS_COLLECTION);
export const updatePostById = updateDocumentById<Post>(POSTS_COLLECTION);
export const deletePostById = deleteDocumentById(POSTS_COLLECTION);
