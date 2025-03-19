import * as React from "react";

export interface ISelectionStateArgs<T> {
  items: T[];
  initialSelected?: T[];
  isEqual?: (a: T, b: T) => boolean;
}

export interface ISelectionState<T> {
  selectedItems: T[];
  isItemSelected: (item: T) => boolean;
  areAllSelected: boolean;
  selectItems: (items: T[], isSelected: boolean) => void;
  selectOnly: (items: T[]) => void;
  selectAll: (isSelected: boolean) => void;
}

function doSelect<T>(
  isEqual: (a: T, b: T) => boolean,
  fullSet: T[],
  selections: T[]
) {
  return selections.length === 0
    ? []
    : fullSet.filter((item) => selections.some((test) => isEqual(item, test)));
}

export const useSelectionState = <T>({
  items,
  initialSelected = [],
  isEqual = (a, b) => a === b,
}: ISelectionStateArgs<T>): ISelectionState<T> => {
  const [selectedItems, setSelectedItems] = React.useState<T[]>(() =>
    doSelect(isEqual, items, initialSelected)
  );

  React.useEffect(() => {
    setSelectedItems((si) => doSelect(isEqual, items, si));
    console.log("useEffect -- items");
  }, [isEqual, items]);

  const isItemSelected = React.useCallback(
    (item: T) => selectedItems.some((i) => isEqual(item, i)),
    [isEqual, selectedItems]
  );

  const selectItems = React.useCallback(
    (itemsSubset: T[], isSelecting: boolean) => {
      const verifiedItemsSubset = doSelect(isEqual, items, itemsSubset);
      const selectedNotInItemsSubset = selectedItems.filter(
        (selected) =>
          !verifiedItemsSubset.some((item) => isEqual(selected, item))
      );
      const filtered = doSelect(
        isEqual,
        items,
        isSelecting
          ? [...selectedNotInItemsSubset, ...verifiedItemsSubset]
          : selectedNotInItemsSubset
      );
      setSelectedItems(filtered);
    },
    [isEqual, items, selectedItems]
  );

  const selectOnly = React.useCallback(
    (toSelect: T[]) => {
      const filtered = doSelect(isEqual, items, toSelect);
      setSelectedItems(filtered);
    },
    [isEqual, items]
  );

  const selectAll = React.useCallback(
    (isSelecting) => setSelectedItems(isSelecting ? items : []),
    [items]
  );

  const areAllSelected = React.useMemo(() => {
    return (
      selectedItems.length === items.length &&
      selectedItems.every((si) => items.some((i) => isEqual(si, i)))
    );
  }, [isEqual, items, selectedItems]);

  return {
    selectedItems,
    isItemSelected,
    areAllSelected,
    selectItems,
    selectOnly,
    selectAll,
  };
};
