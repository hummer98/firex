/**
 * Watch service for real-time Firestore monitoring
 */

import type { Firestore, DocumentSnapshot, QuerySnapshot } from 'firebase-admin/firestore';
import { Result, ok, err, DocumentChange, ChangeType } from '../shared/types';

/**
 * Watch options
 */
export interface WatchOptions {
  onChange: (change: DocumentChange) => void;
  onError?: (error: Error) => void;
  showInitial?: boolean;
  maxRetries?: number;
}

/**
 * Watch error types
 */
export type WatchError =
  | { type: 'INVALID_PATH'; message: string; path: string }
  | { type: 'WATCH_ERROR'; message: string; originalError: Error }
  | { type: 'MAX_RETRIES_EXCEEDED'; message: string; attempts: number };

/**
 * Unsubscribe function type
 */
export type UnsubscribeFunction = () => void;

/**
 * Service for watching Firestore documents and collections in real-time
 */
export class WatchService {
  private unsubscribers: UnsubscribeFunction[] = [];
  private readonly DEFAULT_MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 1000;

  constructor(private firestore: Firestore) {}

  /**
   * Watch a document for changes
   */
  watchDocument(
    path: string,
    options: WatchOptions
  ): Result<UnsubscribeFunction, WatchError> {
    try {
      const docRef = this.firestore.doc(path);
      let isInitial = true;
      let retryCount = 0;
      const maxRetries = options.maxRetries ?? this.DEFAULT_MAX_RETRIES;

      const startWatching = (): UnsubscribeFunction => {
        const unsubscribe = docRef.onSnapshot(
          (snapshot: DocumentSnapshot) => {
            // Skip initial snapshot if showInitial is false
            if (isInitial && !options.showInitial) {
              isInitial = false;
              return;
            }

            if (isInitial) {
              isInitial = false;
            }

            if (!snapshot.exists) {
              const change: DocumentChange = {
                type: 'removed',
                document: {
                  data: {},
                  metadata: {
                    id: snapshot.id,
                    path: snapshot.ref.path,
                  },
                },
              };
              options.onChange(change);
              return;
            }

            const change: DocumentChange = {
              type: isInitial ? 'added' : 'modified',
              document: {
                data: snapshot.data() || {},
                metadata: {
                  id: snapshot.id,
                  path: snapshot.ref.path,
                  createTime: snapshot.createTime?.toDate(),
                  updateTime: snapshot.updateTime?.toDate(),
                  readTime: snapshot.readTime?.toDate(),
                },
              },
            };

            options.onChange(change);
          },
          (error: Error) => {
            if (options.onError) {
              options.onError(error);
            }

            // Retry logic
            if (retryCount < maxRetries) {
              retryCount++;
              setTimeout(() => {
                // Restart watching
                const newUnsubscribe = startWatching();
                // Replace old unsubscriber with new one
                const index = this.unsubscribers.findIndex((u) => u === unsubscribe);
                if (index !== -1) {
                  this.unsubscribers[index] = newUnsubscribe;
                }
              }, this.RETRY_DELAY_MS * retryCount);
            }
          }
        );

        return unsubscribe;
      };

      const unsubscribe = startWatching();
      this.unsubscribers.push(unsubscribe);

      return ok(unsubscribe);
    } catch (error) {
      return err({
        type: 'WATCH_ERROR',
        message: `ドキュメントの監視開始に失敗しました: ${
          error instanceof Error ? error.message : String(error)
        }`,
        originalError: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }

  /**
   * Watch a collection for changes
   */
  watchCollection(
    path: string,
    options: WatchOptions
  ): Result<UnsubscribeFunction, WatchError> {
    try {
      const collectionRef = this.firestore.collection(path);
      let isInitial = true;
      let retryCount = 0;
      const maxRetries = options.maxRetries ?? this.DEFAULT_MAX_RETRIES;

      const startWatching = (): UnsubscribeFunction => {
        const unsubscribe = collectionRef.onSnapshot(
          (snapshot: QuerySnapshot) => {
            // Skip initial snapshot if showInitial is false
            if (isInitial && !options.showInitial) {
              isInitial = false;
              return;
            }

            if (isInitial) {
              isInitial = false;
            }

            // Process document changes
            snapshot.docChanges().forEach((change) => {
              const doc = change.doc;
              const changeType: ChangeType = change.type as ChangeType;

              const documentChange: DocumentChange = {
                type: changeType,
                document: {
                  data: doc.data(),
                  metadata: {
                    id: doc.id,
                    path: doc.ref.path,
                    createTime: doc.createTime?.toDate(),
                    updateTime: doc.updateTime?.toDate(),
                    readTime: doc.readTime?.toDate(),
                  },
                },
              };

              options.onChange(documentChange);
            });
          },
          (error: Error) => {
            if (options.onError) {
              options.onError(error);
            }

            // Retry logic
            if (retryCount < maxRetries) {
              retryCount++;
              setTimeout(() => {
                // Restart watching
                const newUnsubscribe = startWatching();
                // Replace old unsubscriber with new one
                const index = this.unsubscribers.findIndex((u) => u === unsubscribe);
                if (index !== -1) {
                  this.unsubscribers[index] = newUnsubscribe;
                }
              }, this.RETRY_DELAY_MS * retryCount);
            }
          }
        );

        return unsubscribe;
      };

      const unsubscribe = startWatching();
      this.unsubscribers.push(unsubscribe);

      return ok(unsubscribe);
    } catch (error) {
      return err({
        type: 'WATCH_ERROR',
        message: `コレクションの監視開始に失敗しました: ${
          error instanceof Error ? error.message : String(error)
        }`,
        originalError: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }

  /**
   * Unsubscribe all active watchers
   */
  unsubscribeAll(): void {
    this.unsubscribers.forEach((unsubscribe) => {
      try {
        unsubscribe();
      } catch (error) {
        // Ignore errors during cleanup
      }
    });
    this.unsubscribers = [];
  }

  /**
   * Check if there are active watchers
   */
  isWatching(): boolean {
    return this.unsubscribers.length > 0;
  }

  /**
   * Get number of active watchers
   */
  getWatcherCount(): number {
    return this.unsubscribers.length;
  }
}
