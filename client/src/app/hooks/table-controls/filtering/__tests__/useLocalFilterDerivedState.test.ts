import { renderHook } from "@testing-library/react-hooks";
import { FilterCategory, FilterType } from "@app/components/FilterToolbar";
import { useLocalFilterDerivedState } from "../useLocalFilterDerivedState";

interface TestItem {
  name: string;
  order?: number;
  flag?: boolean;
}

const items: TestItem[] = [{ name: "Foo" }, { name: "Bar" }];

const defaultCategory: FilterCategory<TestItem, string> = {
  categoryKey: "name",
  type: FilterType.multiselect,
  title: "Name",
  placeholderText: "Placeholder",
};

const withParams = (
  filters: string[] | null | undefined,
  categories: FilterCategory<TestItem, string>[] = [defaultCategory]
) => ({
  items,
  filterCategories: categories,
  filterState: {
    filterValues: { name: filters },
    setFilterValues: () => {},
  },
});

describe("useLocalFilterDerivedState", () => {
  it("returns all items when empty filters applied", () => {
    const { result } = renderHook(() =>
      useLocalFilterDerivedState(withParams([]))
    );
    expect(result.current.filteredItems).toEqual(items);
  });

  it("returns all items when nullish filters applied", () => {
    const { result } = renderHook(() =>
      useLocalFilterDerivedState(withParams(null))
    );
    expect(result.current.filteredItems).toEqual(items);
  });

  it("returns no items if filter key doesn't map to property name (and no category is provided)", () => {
    const { result } = renderHook(() =>
      useLocalFilterDerivedState({
        items,
        filterCategories: [],
        filterState: {
          filterValues: { test: ["Foo"] },
          setFilterValues: () => {},
        },
      })
    );
    expect(result.current.filteredItems).toEqual([]);
  });

  it("filters when no filter category found but filter key maps to property name", () => {
    const { result } = renderHook(() =>
      useLocalFilterDerivedState(
        withParams(
          ["Foo"],
          [
            {
              ...defaultCategory,
              categoryKey: "test",
            },
          ]
        )
      )
    );
    expect(result.current.filteredItems).toEqual([{ name: "Foo" }]);
  });

  it("returns no items for falsy item values (without getItemValue)", () => {
    const { result } = renderHook(() =>
      useLocalFilterDerivedState({
        items: [{ name: "Test", order: 0 }],
        filterCategories: [],
        filterState: {
          filterValues: { order: ["0"] },
          setFilterValues: () => {},
        },
      })
    );
    expect(result.current.filteredItems).toEqual([]);
  });

  it("filters falsy item values with getItemValue returning string)", () => {
    const { result } = renderHook(() =>
      useLocalFilterDerivedState({
        items: [{ name: "Test", order: 0 }],
        filterCategories: [
          {
            categoryKey: "order",
            title: "Order",
            type: FilterType.multiselect,
            placeholderText: "Placeholder",
            getItemValue: (item) => String(item.order),
          },
        ],
        filterState: {
          filterValues: { order: ["0"] },
          setFilterValues: () => {},
        },
      })
    );
    expect(result.current.filteredItems).toEqual([{ name: "Test", order: 0 }]);
  });

  it("returns no items for falsy item values if  getItemValue returns boolean", () => {
    const { result } = renderHook(() =>
      useLocalFilterDerivedState({
        items: [{ name: "Test", flag: false }],
        filterCategories: [
          {
            categoryKey: "flag",
            title: "Flag",
            type: FilterType.multiselect,
            placeholderText: "Placeholder",
            getItemValue: (item) => item.flag,
          },
        ],
        filterState: {
          filterValues: { flag: ["false"] },
          setFilterValues: () => {},
        },
      })
    );
    expect(result.current.filteredItems).toEqual([]);
  });

  it("filters if filter key doesn't map to property name but category provides getItemValue", () => {
    const { result } = renderHook(() =>
      useLocalFilterDerivedState({
        items,
        filterCategories: [
          {
            ...defaultCategory,
            categoryKey: "test",
            getItemValue: (item: TestItem) => item.name,
          },
        ],
        filterState: {
          filterValues: { test: ["Foo"] },
          setFilterValues: () => {},
        },
      })
    );
    expect(result.current.filteredItems).toEqual([{ name: "Foo" }]);
  });

  it("filters without getItemValue (category exists)", () => {
    const { result } = renderHook(() =>
      useLocalFilterDerivedState(withParams(["Foo"]))
    );
    expect(result.current.filteredItems).toEqual([{ name: "Foo" }]);
  });

  it("filters with getItemValue", () => {
    const { result } = renderHook(() =>
      useLocalFilterDerivedState(
        withParams(
          ["Foo"],
          [
            {
              ...defaultCategory,
              getItemValue: (item: TestItem) => item.name,
            },
          ]
        )
      )
    );
    expect(result.current.filteredItems).toEqual([{ name: "Foo" }]);
  });

  it("filters with partial match", () => {
    const { result } = renderHook(() =>
      useLocalFilterDerivedState(withParams(["oo"]))
    );
    expect(result.current.filteredItems).toEqual([{ name: "Foo" }]);
  });

  it("filters case insensitive", () => {
    const { result } = renderHook(() =>
      useLocalFilterDerivedState(withParams(["foo"]))
    );
    expect(result.current.filteredItems).toEqual([{ name: "Foo" }]);
  });

  it("returns results when at least one OR filter was matched", () => {
    const { result } = renderHook(() =>
      useLocalFilterDerivedState(withParams(["foo", "oo", "test"]))
    );
    expect(result.current.filteredItems).toEqual([{ name: "Foo" }]);
  });

  it("returns no results when all OR filters were not matched", () => {
    const { result } = renderHook(() =>
      useLocalFilterDerivedState(withParams(["test", "test2"]))
    );
    expect(result.current.filteredItems).toEqual([]);
  });

  it("returns results when all AND filters were matched", () => {
    const { result } = renderHook(() =>
      useLocalFilterDerivedState(
        withParams(
          ["f", "o"],
          [
            {
              ...defaultCategory,
              logicOperator: "AND",
            },
          ]
        )
      )
    );
    expect(result.current.filteredItems).toEqual([{ name: "Foo" }]);
  });

  it("returns no results when at least one AND filter was not matched", () => {
    const { result } = renderHook(() =>
      useLocalFilterDerivedState(
        withParams(
          ["foo", "test"],
          [
            {
              ...defaultCategory,
              logicOperator: "AND",
            },
          ]
        )
      )
    );
    expect(result.current.filteredItems).toEqual([]);
  });
});
