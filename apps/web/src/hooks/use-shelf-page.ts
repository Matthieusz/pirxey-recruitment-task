import { shelfPageSchema } from "@pirxey-recruitment-task/api/validators/books";
import type {
  Book,
  NewBookInput,
  ShelfUser,
} from "@pirxey-recruitment-task/api/validators/books";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type { UseMutationResult } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";

import { authClient } from "@/lib/auth-client";
import { client } from "@/utils/orpc";

import { useDebouncedValue } from "./use-debounced-value";

const DEFAULT_PAGE_SIZE = 50;
const NEW_BOOK_HIGHLIGHT_MS = 1400;

type CreateBookMutation = UseMutationResult<Book | null, Error, NewBookInput>;

export interface UseShelfPageArgs {
  readonly name: string;
  readonly pageSize?: number;
  /** When set, the count label reports "X of N rows loaded" (10M-row demo). */
  readonly totalCount?: number;
  /**
   * Mutation function. If omitted, the hook still creates a no-op mutation so
   * that routes can choose whether to mount the form by rendering or not.
   */
  readonly mutationFn?: (input: NewBookInput) => Promise<Book | null>;
  /** Toast / log handler. The hook also invalidates the shelf on success. */
  readonly onMutationError?: (error: Error) => void;
}

export interface UseShelfPageResult {
  readonly books: readonly Book[];
  readonly user: ShelfUser | null;
  readonly isLoading: boolean;
  readonly hasNextPage: boolean;
  readonly isFetchingNextPage: boolean;
  readonly fetchNextPage: () => void;
  readonly query: string;
  readonly setQuery: (q: string) => void;
  readonly debouncedQuery: string;
  readonly countLabel: string;
  /** Total books used to gate the empty vs. no-matches state. */
  readonly totalBooks: number;
  readonly newBookIds: ReadonlySet<number>;
  readonly createBook: CreateBookMutation;
  readonly isOwner: boolean;
}

const noopMutationFn = (_input: NewBookInput): Promise<Book | null> =>
  Promise.resolve(null);

export const useShelfPage = ({
  name,
  pageSize = DEFAULT_PAGE_SIZE,
  totalCount,
  mutationFn,
  onMutationError,
}: UseShelfPageArgs): UseShelfPageResult => {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query.trim(), 300);
  const [newBookIds, setNewBookIds] = useState<ReadonlySet<number>>(
    () => new Set<number>()
  );
  const highlightTimeoutsRef = useRef<Map<number, number> | null>(null);
  if (highlightTimeoutsRef.current === null) {
    highlightTimeoutsRef.current = new Map();
  }
  const highlightTimeouts = highlightTimeoutsRef.current;

  // eslint-disable-next-line sort-keys -- queryKey/infer-first ordering required by @tanstack/react-query v5 generics
  const shelfQuery = useInfiniteQuery({
    queryKey: ["books", "shelf", name, debouncedQuery],
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      const page = await client.books.getShelfByName({
        cursor: pageParam ?? undefined,
        limit: pageSize,
        name,
        query: debouncedQuery || undefined,
      });

      return page ? shelfPageSchema.parse(page) : null;
    },
    getNextPageParam: (lastPage) => lastPage?.nextCursor ?? undefined,
  });

  const { data: session } = authClient.useSession();
  const isOwner = session?.user?.name === name;

  const createBook = useMutation<Book | null, Error, NewBookInput>({
    mutationFn: mutationFn ?? noopMutationFn,
    onError: onMutationError,
    onSuccess: (inserted) => {
      if (inserted) {
        const { id } = inserted;
        setNewBookIds((prev) => new Set([...prev, id]));
        const timeout = window.setTimeout(() => {
          setNewBookIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
          highlightTimeouts.delete(id);
        }, NEW_BOOK_HIGHLIGHT_MS);
        highlightTimeouts.set(id, timeout);
      }

      queryClient.invalidateQueries({ queryKey: ["books", "shelf", name] });
    },
  });

  useEffect(
    () => () => {
      for (const timeout of highlightTimeouts.values()) {
        window.clearTimeout(timeout);
      }
      highlightTimeouts.clear();
    },
    [highlightTimeouts]
  );

  const firstPage = shelfQuery.data?.pages[0];
  const user = firstPage?.user ?? null;
  const books = useMemo<readonly Book[]>(
    () => shelfQuery.data?.pages.flatMap((page) => page?.books ?? []) ?? [],
    [shelfQuery.data?.pages]
  );
  const hasNextPage = Boolean(shelfQuery.hasNextPage);
  const { isFetchingNextPage } = shelfQuery;

  // `totalBooks` distinguishes "empty shelf" (0) from "no search matches" (≥1).
  // When searching, force a non-zero floor so the BookList shows the
  // no-matches state instead of the empty state.
  const totalBooks = debouncedQuery && books.length === 0 ? 1 : books.length;

  const countLabel = useMemo(() => {
    const suffix = hasNextPage ? "+" : "";
    const loaded = books.length.toLocaleString();

    if (debouncedQuery) {
      return totalCount
        ? `${loaded} title/author matches loaded${suffix}`
        : `${loaded} matches loaded${suffix}`;
    }

    if (totalCount) {
      return `${loaded} of ${totalCount.toLocaleString()} rows loaded${suffix}`;
    }

    return `${loaded} books loaded${suffix}`;
  }, [books.length, debouncedQuery, hasNextPage, totalCount]);

  return {
    books,
    countLabel,
    createBook,
    debouncedQuery,
    fetchNextPage: () => shelfQuery.fetchNextPage(),
    hasNextPage,
    isFetchingNextPage,
    isLoading: shelfQuery.isLoading,
    isOwner,
    newBookIds,
    query,
    setQuery,
    totalBooks,
    user,
  };
};
