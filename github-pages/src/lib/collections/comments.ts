import * as v from 'valibot';
import { createCollection, MemoryAdapter } from '@aicacia/db';

export const commentSchema = v.object({
	id: v.string(),
	recipeId: v.string(),
	author: v.string(),
	text: v.string(),
	createdAt: v.date(),
	updatedAt: v.date()
});

export type Comment = v.InferOutput<typeof commentSchema>;

export const commentsCollection = createCollection({
	id: 'comments',
	source: new MemoryAdapter<Comment>('id'),
	keyOf: (doc) => doc.id
});
