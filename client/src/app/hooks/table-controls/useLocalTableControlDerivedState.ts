import { useLocalFilterDerivedState } from "./filtering";
import { useLocalSortDerivedState } from "./sorting";
import { useLocalPaginationDerivedState } from "./pagination";
import {
  ITableControlLocalDerivedStateArgs,
  ITableControlDerivedState,
  ITableControlState,
} from "./types";

/**
 * Returns table-level "derived state" (the results of local/client-computed filtering/sorting/pagination)
 * - Used internally by the shorthand hook useLocalTableControls.
 * - Takes "source of truth" state for all features and additional args.
 * @see useLocalTableControls
 */
export const useLocalTableControlDerivedState = <
  TItem,
  TColumnKey extends string,
  TSortableColumnKey extends TColumnKey,
  TFilterCategoryKey extends string = string,
  TPersistenceKeyPrefix extends string = string,
>(
  args: ITableControlState<
    TItem,
    TColumnKey,
    TSortableColumnKey,
    TFilterCategoryKey,
    TPersistenceKeyPrefix
  > &
    ITableControlLocalDerivedStateArgs<
      TItem,
      TColumnKey,
      TSortableColumnKey,
      TFilterCategoryKey
    >
): ITableControlDerivedState<TItem> => {
  const { items, isPaginationEnabled = true } = args;
  const { filteredItems } = useLocalFilterDerivedState({
    ...args,
    items,
  });
  const { sortedItems } = useLocalSortDerivedState({
    ...args,
    items: filteredItems,
  });
  const { currentPageItems } = useLocalPaginationDerivedState({
    ...args,
    items: sortedItems,
  });
  return {
    // TODO: Could provide access to full item set, filtered set, sorted set, and paged set
    totalItemCount: filteredItems.length,
    currentPageItems: isPaginationEnabled ? currentPageItems : sortedItems,
  };
};
