import 'server-only';

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { VisitorIdentity } from '@/lib/visitor-tracking';

export type StoredReview = {
  id: string;
  documentType: string;
  rating: number;
  comment: string | null;
  userEmail: string | null;
  visitorId: string;
  createdAt: string;
};

export type StoredVisitor = {
  id: string;
  ipHash: string;
  userAgent: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  visitCount: number;
  lastPath: string | null;
};

export type FeedbackStore = {
  version: 1;
  reviews: StoredReview[];
  visitors: StoredVisitor[];
};

type ReviewInput = {
  documentType: string;
  rating: number;
  comment: string | null;
  userEmail: string | null;
  visitor: VisitorIdentity;
};

let writeQueue: Promise<unknown> = Promise.resolve();

function dataDirectory() {
  return process.env.EAZITOOL_DATA_DIR?.trim() || join(process.cwd(), 'data');
}

function storePath() {
  return join(dataDirectory(), 'feedback.json');
}

function cloneEmptyStore(): FeedbackStore {
  return { version: 1, reviews: [], visitors: [] };
}

function isFeedbackStore(value: unknown): value is FeedbackStore {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<FeedbackStore>;
  return candidate.version === 1 && Array.isArray(candidate.reviews) && Array.isArray(candidate.visitors);
}

async function readStore(): Promise<FeedbackStore> {
  try {
    const content = await readFile(storePath(), 'utf8');
    const parsed: unknown = JSON.parse(content);
    if (!isFeedbackStore(parsed)) throw new Error('Feedback JSON has an unsupported format.');
    return parsed;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return cloneEmptyStore();
    throw error;
  }
}

async function saveStore(store: FeedbackStore) {
  const directory = dataDirectory();
  await mkdir(directory, { recursive: true });
  const destination = storePath();
  const temporary = `${destination}.${randomUUID()}.tmp`;
  await writeFile(temporary, `${JSON.stringify(store, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
  await rename(temporary, destination);
}

function updateVisitor(store: FeedbackStore, visitor: VisitorIdentity, path?: string): StoredVisitor {
  const now = new Date().toISOString();
  const existing = store.visitors.find((item) => item.id === visitor.id);

  if (existing) {
    existing.ipHash = visitor.ipHash;
    existing.userAgent = visitor.userAgent;
    existing.lastSeenAt = now;
    if (path) {
      existing.visitCount += 1;
      existing.lastPath = path;
    }
    return existing;
  }

  const created: StoredVisitor = {
    id: visitor.id,
    ipHash: visitor.ipHash,
    userAgent: visitor.userAgent,
    firstSeenAt: now,
    lastSeenAt: now,
    visitCount: path ? 1 : 0,
    lastPath: path ?? null,
  };
  store.visitors.push(created);
  return created;
}

function queueWrite<T>(operation: (store: FeedbackStore) => T | Promise<T>): Promise<T> {
  const next = writeQueue.then(async () => {
    const store = await readStore();
    const result = await operation(store);
    await saveStore(store);
    return result;
  });

  // Keep later writes working even when one write fails.
  writeQueue = next.catch(() => undefined);
  return next;
}

export async function recordVisitorVisit(visitor: VisitorIdentity, path: string) {
  return queueWrite((store) => updateVisitor(store, visitor, path));
}

export async function recordReview(input: ReviewInput) {
  return queueWrite((store) => {
    updateVisitor(store, input.visitor);
    const review: StoredReview = {
      id: randomUUID(),
      documentType: input.documentType,
      rating: input.rating,
      comment: input.comment,
      userEmail: input.userEmail,
      visitorId: input.visitor.id,
      createdAt: new Date().toISOString(),
    };
    store.reviews.push(review);
    return review;
  });
}

export async function getFeedbackStore() {
  return readStore();
}
