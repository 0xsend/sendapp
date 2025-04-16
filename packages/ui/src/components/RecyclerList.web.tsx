// @TODO eventually we will have to tamagui-ify this

import { DataProvider, GridLayoutProvider, RecyclerListView } from 'recyclerlistview/web'
export * from 'recyclerlistview/web'

export const RecyclerList = RecyclerListView

/**
 * Creates a DataProvider that determines when to recycle list elements.
 * @param data Array of data
 * @param options Configuration options for the DataProvider
 * @param options.rowHasChanged Optional comparison function determining if two rows are different.
 * Defaults to a strict inequality check (r1 !== r2) which compares object references.
 * @param options.getStableId Optional function to generate stable IDs for items
 * @returns DataProvider instance configured with the provided data and comparison logic
 */
export const dataProviderMaker = <T = never>(
  data?: T[],
  options: {
    rowHasChanged?: (r1: T, r2: T) => boolean
    getStableId?: (index: number) => string
  } = {}
): DataProvider => {
  const rowHasChanged = options.rowHasChanged ?? ((r1: T, r2: T) => r1 !== r2)
  const getStableId = options.getStableId

  const dataProvider = new DataProvider(rowHasChanged, getStableId)

  return data ? dataProvider.cloneWithRows(data) : dataProvider
}

/**
 * Creates a GridLayoutProvider that determines dimensions for grid-based layouts.
 * @param options Configuration options for the GridLayoutProvider
 * @param options.maxSpan Maximum number of spans in a row. Defaults to 1
 * @param options.getLayoutType Function to determine the type of layout for an item at given index. Defaults to one type
 * @param options.getSpan Function to determine how many spans an item should occupy. Defaults to full span
 * @param options.getHeightOrWidth Function to determine the height (for vertical) or width (for horizontal) of an item
 * @example
 * layoutProviderMaker({
 *   maxSpan: 4,
 *   getLayoutType: (index) => {
 *     return data[index].type; // returns a string or number identifying the type
 *   },
 *   getSpan: (index) => {
 *     const type = data[index].type;
 *     switch (type) {
 *       case "ITEM_SPAN_1": return 1;
 *       case "ITEM_SPAN_2": return 2;
 *       case "ITEM_SPAN_4": return 4;
 *       default: return 1;
 *     }
 *   },
 *   getHeightOrWidth: (index) => {
 *     return 100; // fixed height/width for items
 *   }
 * })
 * @returns GridLayoutProvider instance configured with the provided layout options
 */
export const layoutProviderMaker = (options: {
  maxSpan?: number
  getLayoutType?: (index: number) => string | number
  getSpan?: (index: number) => number
  getHeightOrWidth: (index: number) => number
}) => {
  const maxSpan = options.maxSpan ?? 1
  const getLayoutType = options.getLayoutType ?? ((index: number) => 0)
  const getSpan = options.getSpan ?? ((index: number) => 1)
  const { getHeightOrWidth } = options

  return new GridLayoutProvider(maxSpan, getLayoutType, getSpan, getHeightOrWidth)
}
