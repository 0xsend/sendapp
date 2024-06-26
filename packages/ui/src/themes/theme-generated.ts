type Theme = {
  color0: string;
  color1: string;
  color2: string;
  color3: string;
  color4: string;
  color5: string;
  color6: string;
  color7: string;
  color8: string;
  color9: string;
  color10: string;
  color11: string;
  color12: string;
  background: string;
  backgroundHover: string;
  backgroundPress: string;
  backgroundFocus: string;
  backgroundStrong: string;
  backgroundTransparent: string;
  color: string;
  colorHover: string;
  colorPress: string;
  colorFocus: string;
  colorTransparent: string;
  borderColor: string;
  borderColorHover: string;
  borderColorFocus: string;
  borderColorPress: string;
  placeholderColor: string;
  shadowColor: string;
  shadowColorHover: string;
  shadowColorPress: string;
  shadowColorFocus: string;

}

function t(a: [number, number][]) {
  let res: Record<string,string> = {}
  for (const [ki, vi] of a) {
    res[ks[ki] as string] = vs[vi] as string
  }
  return res as Theme
}
const vs = [
  '#FFFFFF',
  '#F7F7F7',
  '#E6E6E6',
  '#B2B2B2',
  '#666666',
  '#081619',
  'transparent',
  'rgba(0,0,0,0.2)',
  'rgba(0,0,0,0.1)',
  '#111f22',
  '#3E4A3C',
  '#343434',
  'hsl(60, 54.0%, 98.5%)',
  'hsl(52, 100%, 95.5%)',
  'hsl(55, 100%, 90.9%)',
  'hsl(54, 100%, 86.6%)',
  'hsl(52, 97.9%, 82.0%)',
  'hsl(50, 89.4%, 76.1%)',
  'hsl(48, 100%, 46.1%)',
  'hsl(53, 92.0%, 50.0%)',
  'hsl(50, 100%, 48.5%)',
  'hsl(42, 100%, 29.0%)',
  'hsl(40, 55.0%, 13.5%)',
  '#40FB50',
  '#86AE80',
  '#0B4129',
  'hsl(359, 100%, 99.4%)',
  'hsl(359, 100%, 98.6%)',
  'hsl(360, 100%, 96.8%)',
  'hsl(360, 97.9%, 94.8%)',
  'hsl(360, 90.2%, 91.9%)',
  'hsl(360, 81.7%, 87.8%)',
  'hsl(359, 69.5%, 74.3%)',
  'hsl(358, 75.0%, 59.0%)',
  'hsl(358, 69.4%, 55.2%)',
  'hsl(358, 65.0%, 48.7%)',
  'hsl(354, 50.0%, 14.6%)',
  'hsl(45, 100%, 5.5%)',
  'hsl(46, 100%, 6.7%)',
  'hsl(45, 100%, 8.7%)',
  'hsl(45, 100%, 10.4%)',
  'hsl(47, 100%, 12.1%)',
  'hsl(49, 100%, 14.3%)',
  'hsl(50, 100%, 22.0%)',
  'hsl(54, 100%, 68.0%)',
  'hsl(48, 100%, 47.0%)',
  'hsl(53, 100%, 91.0%)',
  '#082B1B',
  '#12643F',
  'hsl(353, 23.0%, 9.8%)',
  'hsl(357, 34.4%, 12.0%)',
  'hsl(356, 43.4%, 16.4%)',
  'hsl(356, 47.6%, 19.2%)',
  'hsl(356, 51.1%, 21.9%)',
  'hsl(356, 55.2%, 25.9%)',
  'hsl(358, 65.0%, 40.4%)',
  'hsl(358, 85.3%, 64.0%)',
  'hsl(358, 100%, 69.5%)',
  'hsl(351, 89.0%, 96.0%)',
  'rgba(0,0,0,0.5)',
  'rgba(0,0,0,0.9)',
  'undefined',
]

const ks = [
'color0',
'color1',
'color2',
'color3',
'color4',
'color5',
'color6',
'color7',
'color8',
'color9',
'color10',
'color11',
'color12',
'background',
'backgroundHover',
'backgroundPress',
'backgroundFocus',
'backgroundStrong',
'backgroundTransparent',
'color',
'colorHover',
'colorPress',
'colorFocus',
'colorTransparent',
'borderColor',
'borderColorHover',
'borderColorFocus',
'borderColorPress',
'placeholderColor',
'shadowColor',
'shadowColorHover',
'shadowColorPress',
'shadowColorFocus']


const n1 = t([[0, 0],[1, 1],[2, 2],[3, 3],[4, 0],[5, 0],[6, 0],[7, 0],[8, 0],[9, 2],[10, 4],[11, 5],[12, 5],[13, 0],[14, 1],[15, 0],[16, 1],[17, 2],[18, 6],[19, 5],[20, 5],[21, 5],[22, 5],[23, 6],[24, 0],[25, 0],[26, 0],[27, 0],[28, 0],[29, 7],[30, 7],[31, 8],[32, 8]])

export const light = n1
const n2 = t([[0, 5],[1, 9],[2, 10],[3, 11],[4, 4],[5, 5],[6, 5],[7, 5],[8, 5],[9, 4],[10, 3],[11, 0],[12, 0],[13, 5],[14, 9],[15, 5],[16, 9],[17, 10],[18, 6],[19, 0],[20, 0],[21, 0],[22, 0],[23, 6],[24, 5],[25, 5],[26, 5],[27, 5],[28, 5],[29, 7],[30, 7],[31, 8],[32, 8]])

export const dark = n2
const n3 = t([[0, 12],[1, 13],[2, 14],[3, 15],[4, 16],[5, 17],[6, 18],[7, 19],[8, 20],[9, 21],[10, 22],[11, 5],[12, 5],[13, 12],[14, 13],[15, 12],[16, 13],[17, 14],[18, 6],[19, 5],[20, 5],[21, 5],[22, 5],[23, 6],[24, 16],[25, 17],[26, 16],[27, 16],[28, 19]])

export const light_yellow = n3
const n4 = t([[0, 0],[1, 23],[2, 24],[3, 25],[4, 23],[5, 0],[6, 0],[7, 23],[8, 24],[9, 25],[10, 5],[11, 5],[12, 5],[13, 0],[14, 23],[15, 0],[16, 23],[17, 24],[18, 6],[19, 5],[20, 5],[21, 5],[22, 5],[23, 6],[24, 23],[25, 0],[26, 23],[27, 23],[28, 23]])

export const light_green = n4
const n5 = t([[0, 26],[1, 27],[2, 28],[3, 29],[4, 30],[5, 31],[6, 32],[7, 33],[8, 34],[9, 35],[10, 36],[11, 5],[12, 5],[13, 26],[14, 27],[15, 26],[16, 27],[17, 28],[18, 6],[19, 5],[20, 5],[21, 5],[22, 5],[23, 6],[24, 30],[25, 31],[26, 30],[27, 30],[28, 33]])

export const light_red = n5
const n6 = t([[0, 37],[1, 38],[2, 39],[3, 40],[4, 41],[5, 42],[6, 43],[7, 19],[8, 44],[9, 45],[10, 46],[11, 0],[12, 0],[13, 37],[14, 38],[15, 37],[16, 38],[17, 39],[18, 6],[19, 0],[20, 0],[21, 0],[22, 0],[23, 6],[24, 37],[25, 19],[26, 19],[27, 19],[28, 19]])

export const dark_yellow = n6
const n7 = t([[0, 5],[1, 47],[2, 24],[3, 48],[4, 23],[5, 5],[6, 5],[7, 10],[8, 24],[9, 23],[10, 0],[11, 0],[12, 0],[13, 5],[14, 47],[15, 5],[16, 47],[17, 24],[18, 6],[19, 0],[20, 0],[21, 0],[22, 0],[23, 6],[24, 5],[25, 10],[26, 10],[27, 10],[28, 10]])

export const dark_green = n7
const n8 = t([[0, 49],[1, 50],[2, 51],[3, 52],[4, 53],[5, 54],[6, 55],[7, 33],[8, 56],[9, 57],[10, 58],[11, 0],[12, 0],[13, 49],[14, 50],[15, 49],[16, 50],[17, 51],[18, 6],[19, 0],[20, 0],[21, 0],[22, 0],[23, 6],[24, 49],[25, 33],[26, 33],[27, 33],[28, 33]])

export const dark_red = n8
const n9 = t([[13, 59]])

export const light_SheetOverlay = n9
export const light_DialogOverlay = n9
export const light_ModalOverlay = n9
export const light_yellow_SheetOverlay = n9
export const light_yellow_DialogOverlay = n9
export const light_yellow_ModalOverlay = n9
export const light_green_SheetOverlay = n9
export const light_green_DialogOverlay = n9
export const light_green_ModalOverlay = n9
export const light_red_SheetOverlay = n9
export const light_red_DialogOverlay = n9
export const light_red_ModalOverlay = n9
export const light_ghost_SheetOverlay = n9
export const light_ghost_DialogOverlay = n9
export const light_ghost_ModalOverlay = n9
export const light_yellow_ghost_SheetOverlay = n9
export const light_yellow_ghost_DialogOverlay = n9
export const light_yellow_ghost_ModalOverlay = n9
export const light_green_ghost_SheetOverlay = n9
export const light_green_ghost_DialogOverlay = n9
export const light_green_ghost_ModalOverlay = n9
export const light_red_ghost_SheetOverlay = n9
export const light_red_ghost_DialogOverlay = n9
export const light_red_ghost_ModalOverlay = n9
export const light_alt1_SheetOverlay = n9
export const light_alt1_DialogOverlay = n9
export const light_alt1_ModalOverlay = n9
export const light_alt2_SheetOverlay = n9
export const light_alt2_DialogOverlay = n9
export const light_alt2_ModalOverlay = n9
export const light_active_SheetOverlay = n9
export const light_active_DialogOverlay = n9
export const light_active_ModalOverlay = n9
export const light_dim_SheetOverlay = n9
export const light_dim_DialogOverlay = n9
export const light_dim_ModalOverlay = n9
export const light_yellow_alt1_SheetOverlay = n9
export const light_yellow_alt1_DialogOverlay = n9
export const light_yellow_alt1_ModalOverlay = n9
export const light_yellow_alt2_SheetOverlay = n9
export const light_yellow_alt2_DialogOverlay = n9
export const light_yellow_alt2_ModalOverlay = n9
export const light_yellow_active_SheetOverlay = n9
export const light_yellow_active_DialogOverlay = n9
export const light_yellow_active_ModalOverlay = n9
export const light_yellow_dim_SheetOverlay = n9
export const light_yellow_dim_DialogOverlay = n9
export const light_yellow_dim_ModalOverlay = n9
export const light_green_alt1_SheetOverlay = n9
export const light_green_alt1_DialogOverlay = n9
export const light_green_alt1_ModalOverlay = n9
export const light_green_alt2_SheetOverlay = n9
export const light_green_alt2_DialogOverlay = n9
export const light_green_alt2_ModalOverlay = n9
export const light_green_active_SheetOverlay = n9
export const light_green_active_DialogOverlay = n9
export const light_green_active_ModalOverlay = n9
export const light_green_dim_SheetOverlay = n9
export const light_green_dim_DialogOverlay = n9
export const light_green_dim_ModalOverlay = n9
export const light_red_alt1_SheetOverlay = n9
export const light_red_alt1_DialogOverlay = n9
export const light_red_alt1_ModalOverlay = n9
export const light_red_alt2_SheetOverlay = n9
export const light_red_alt2_DialogOverlay = n9
export const light_red_alt2_ModalOverlay = n9
export const light_red_active_SheetOverlay = n9
export const light_red_active_DialogOverlay = n9
export const light_red_active_ModalOverlay = n9
export const light_red_dim_SheetOverlay = n9
export const light_red_dim_DialogOverlay = n9
export const light_red_dim_ModalOverlay = n9
export const light_ghost_alt1_SheetOverlay = n9
export const light_ghost_alt1_DialogOverlay = n9
export const light_ghost_alt1_ModalOverlay = n9
export const light_ghost_alt2_SheetOverlay = n9
export const light_ghost_alt2_DialogOverlay = n9
export const light_ghost_alt2_ModalOverlay = n9
export const light_ghost_active_SheetOverlay = n9
export const light_ghost_active_DialogOverlay = n9
export const light_ghost_active_ModalOverlay = n9
export const light_ghost_dim_SheetOverlay = n9
export const light_ghost_dim_DialogOverlay = n9
export const light_ghost_dim_ModalOverlay = n9
export const light_yellow_ghost_alt1_SheetOverlay = n9
export const light_yellow_ghost_alt1_DialogOverlay = n9
export const light_yellow_ghost_alt1_ModalOverlay = n9
export const light_yellow_ghost_alt2_SheetOverlay = n9
export const light_yellow_ghost_alt2_DialogOverlay = n9
export const light_yellow_ghost_alt2_ModalOverlay = n9
export const light_yellow_ghost_active_SheetOverlay = n9
export const light_yellow_ghost_active_DialogOverlay = n9
export const light_yellow_ghost_active_ModalOverlay = n9
export const light_yellow_ghost_dim_SheetOverlay = n9
export const light_yellow_ghost_dim_DialogOverlay = n9
export const light_yellow_ghost_dim_ModalOverlay = n9
export const light_green_ghost_alt1_SheetOverlay = n9
export const light_green_ghost_alt1_DialogOverlay = n9
export const light_green_ghost_alt1_ModalOverlay = n9
export const light_green_ghost_alt2_SheetOverlay = n9
export const light_green_ghost_alt2_DialogOverlay = n9
export const light_green_ghost_alt2_ModalOverlay = n9
export const light_green_ghost_active_SheetOverlay = n9
export const light_green_ghost_active_DialogOverlay = n9
export const light_green_ghost_active_ModalOverlay = n9
export const light_green_ghost_dim_SheetOverlay = n9
export const light_green_ghost_dim_DialogOverlay = n9
export const light_green_ghost_dim_ModalOverlay = n9
export const light_red_ghost_alt1_SheetOverlay = n9
export const light_red_ghost_alt1_DialogOverlay = n9
export const light_red_ghost_alt1_ModalOverlay = n9
export const light_red_ghost_alt2_SheetOverlay = n9
export const light_red_ghost_alt2_DialogOverlay = n9
export const light_red_ghost_alt2_ModalOverlay = n9
export const light_red_ghost_active_SheetOverlay = n9
export const light_red_ghost_active_DialogOverlay = n9
export const light_red_ghost_active_ModalOverlay = n9
export const light_red_ghost_dim_SheetOverlay = n9
export const light_red_ghost_dim_DialogOverlay = n9
export const light_red_ghost_dim_ModalOverlay = n9
const n10 = t([[13, 60]])

export const dark_SheetOverlay = n10
export const dark_DialogOverlay = n10
export const dark_ModalOverlay = n10
export const dark_yellow_SheetOverlay = n10
export const dark_yellow_DialogOverlay = n10
export const dark_yellow_ModalOverlay = n10
export const dark_green_SheetOverlay = n10
export const dark_green_DialogOverlay = n10
export const dark_green_ModalOverlay = n10
export const dark_red_SheetOverlay = n10
export const dark_red_DialogOverlay = n10
export const dark_red_ModalOverlay = n10
export const dark_ghost_SheetOverlay = n10
export const dark_ghost_DialogOverlay = n10
export const dark_ghost_ModalOverlay = n10
export const dark_yellow_ghost_SheetOverlay = n10
export const dark_yellow_ghost_DialogOverlay = n10
export const dark_yellow_ghost_ModalOverlay = n10
export const dark_green_ghost_SheetOverlay = n10
export const dark_green_ghost_DialogOverlay = n10
export const dark_green_ghost_ModalOverlay = n10
export const dark_red_ghost_SheetOverlay = n10
export const dark_red_ghost_DialogOverlay = n10
export const dark_red_ghost_ModalOverlay = n10
export const dark_alt1_SheetOverlay = n10
export const dark_alt1_DialogOverlay = n10
export const dark_alt1_ModalOverlay = n10
export const dark_alt2_SheetOverlay = n10
export const dark_alt2_DialogOverlay = n10
export const dark_alt2_ModalOverlay = n10
export const dark_active_SheetOverlay = n10
export const dark_active_DialogOverlay = n10
export const dark_active_ModalOverlay = n10
export const dark_dim_SheetOverlay = n10
export const dark_dim_DialogOverlay = n10
export const dark_dim_ModalOverlay = n10
export const dark_yellow_alt1_SheetOverlay = n10
export const dark_yellow_alt1_DialogOverlay = n10
export const dark_yellow_alt1_ModalOverlay = n10
export const dark_yellow_alt2_SheetOverlay = n10
export const dark_yellow_alt2_DialogOverlay = n10
export const dark_yellow_alt2_ModalOverlay = n10
export const dark_yellow_active_SheetOverlay = n10
export const dark_yellow_active_DialogOverlay = n10
export const dark_yellow_active_ModalOverlay = n10
export const dark_yellow_dim_SheetOverlay = n10
export const dark_yellow_dim_DialogOverlay = n10
export const dark_yellow_dim_ModalOverlay = n10
export const dark_green_alt1_SheetOverlay = n10
export const dark_green_alt1_DialogOverlay = n10
export const dark_green_alt1_ModalOverlay = n10
export const dark_green_alt2_SheetOverlay = n10
export const dark_green_alt2_DialogOverlay = n10
export const dark_green_alt2_ModalOverlay = n10
export const dark_green_active_SheetOverlay = n10
export const dark_green_active_DialogOverlay = n10
export const dark_green_active_ModalOverlay = n10
export const dark_green_dim_SheetOverlay = n10
export const dark_green_dim_DialogOverlay = n10
export const dark_green_dim_ModalOverlay = n10
export const dark_red_alt1_SheetOverlay = n10
export const dark_red_alt1_DialogOverlay = n10
export const dark_red_alt1_ModalOverlay = n10
export const dark_red_alt2_SheetOverlay = n10
export const dark_red_alt2_DialogOverlay = n10
export const dark_red_alt2_ModalOverlay = n10
export const dark_red_active_SheetOverlay = n10
export const dark_red_active_DialogOverlay = n10
export const dark_red_active_ModalOverlay = n10
export const dark_red_dim_SheetOverlay = n10
export const dark_red_dim_DialogOverlay = n10
export const dark_red_dim_ModalOverlay = n10
export const dark_ghost_alt1_SheetOverlay = n10
export const dark_ghost_alt1_DialogOverlay = n10
export const dark_ghost_alt1_ModalOverlay = n10
export const dark_ghost_alt2_SheetOverlay = n10
export const dark_ghost_alt2_DialogOverlay = n10
export const dark_ghost_alt2_ModalOverlay = n10
export const dark_ghost_active_SheetOverlay = n10
export const dark_ghost_active_DialogOverlay = n10
export const dark_ghost_active_ModalOverlay = n10
export const dark_ghost_dim_SheetOverlay = n10
export const dark_ghost_dim_DialogOverlay = n10
export const dark_ghost_dim_ModalOverlay = n10
export const dark_yellow_ghost_alt1_SheetOverlay = n10
export const dark_yellow_ghost_alt1_DialogOverlay = n10
export const dark_yellow_ghost_alt1_ModalOverlay = n10
export const dark_yellow_ghost_alt2_SheetOverlay = n10
export const dark_yellow_ghost_alt2_DialogOverlay = n10
export const dark_yellow_ghost_alt2_ModalOverlay = n10
export const dark_yellow_ghost_active_SheetOverlay = n10
export const dark_yellow_ghost_active_DialogOverlay = n10
export const dark_yellow_ghost_active_ModalOverlay = n10
export const dark_yellow_ghost_dim_SheetOverlay = n10
export const dark_yellow_ghost_dim_DialogOverlay = n10
export const dark_yellow_ghost_dim_ModalOverlay = n10
export const dark_green_ghost_alt1_SheetOverlay = n10
export const dark_green_ghost_alt1_DialogOverlay = n10
export const dark_green_ghost_alt1_ModalOverlay = n10
export const dark_green_ghost_alt2_SheetOverlay = n10
export const dark_green_ghost_alt2_DialogOverlay = n10
export const dark_green_ghost_alt2_ModalOverlay = n10
export const dark_green_ghost_active_SheetOverlay = n10
export const dark_green_ghost_active_DialogOverlay = n10
export const dark_green_ghost_active_ModalOverlay = n10
export const dark_green_ghost_dim_SheetOverlay = n10
export const dark_green_ghost_dim_DialogOverlay = n10
export const dark_green_ghost_dim_ModalOverlay = n10
export const dark_red_ghost_alt1_SheetOverlay = n10
export const dark_red_ghost_alt1_DialogOverlay = n10
export const dark_red_ghost_alt1_ModalOverlay = n10
export const dark_red_ghost_alt2_SheetOverlay = n10
export const dark_red_ghost_alt2_DialogOverlay = n10
export const dark_red_ghost_alt2_ModalOverlay = n10
export const dark_red_ghost_active_SheetOverlay = n10
export const dark_red_ghost_active_DialogOverlay = n10
export const dark_red_ghost_active_ModalOverlay = n10
export const dark_red_ghost_dim_SheetOverlay = n10
export const dark_red_ghost_dim_DialogOverlay = n10
export const dark_red_ghost_dim_ModalOverlay = n10
const n11 = t([[13, 6],[14, 6],[15, 0],[16, 1],[17, 2],[18, 6],[19, 0],[20, 5],[21, 0],[22, 5],[23, 6],[24, 0],[25, 0],[26, 0],[27, 0],[28, 0]])

export const light_ghost = n11
const n12 = t([[13, 6],[14, 6],[15, 5],[16, 9],[17, 10],[18, 6],[19, 5],[20, 0],[21, 5],[22, 0],[23, 6],[24, 5],[25, 5],[26, 5],[27, 5],[28, 5]])

export const dark_ghost = n12
export const dark_ghost_ListItem = n12
const n13 = t([[13, 6],[14, 6],[15, 12],[16, 13],[17, 14],[18, 6],[19, 16],[20, 5],[21, 12],[22, 5],[23, 6],[24, 16],[25, 17],[26, 16],[27, 16],[28, 19]])

export const light_yellow_ghost = n13
const n14 = t([[13, 6],[14, 6],[15, 0],[16, 23],[17, 24],[18, 6],[19, 23],[20, 5],[21, 0],[22, 5],[23, 6],[24, 23],[25, 0],[26, 23],[27, 23],[28, 23]])

export const light_green_ghost = n14
const n15 = t([[13, 6],[14, 6],[15, 26],[16, 27],[17, 28],[18, 6],[19, 30],[20, 5],[21, 26],[22, 5],[23, 6],[24, 30],[25, 31],[26, 30],[27, 30],[28, 33]])

export const light_red_ghost = n15
const n16 = t([[13, 6],[14, 6],[15, 37],[16, 38],[17, 39],[18, 6],[19, 37],[20, 0],[21, 37],[22, 0],[23, 6],[24, 37],[25, 19],[26, 19],[27, 19],[28, 19]])

export const dark_yellow_ghost = n16
export const dark_yellow_ghost_ListItem = n16
const n17 = t([[13, 6],[14, 6],[15, 5],[16, 47],[17, 24],[18, 6],[19, 5],[20, 0],[21, 5],[22, 0],[23, 6],[24, 5],[25, 10],[26, 10],[27, 10],[28, 10]])

export const dark_green_ghost = n17
export const dark_green_ghost_ListItem = n17
const n18 = t([[13, 6],[14, 6],[15, 49],[16, 50],[17, 51],[18, 6],[19, 49],[20, 0],[21, 49],[22, 0],[23, 6],[24, 49],[25, 33],[26, 33],[27, 33],[28, 33]])

export const dark_red_ghost = n18
export const dark_red_ghost_ListItem = n18
const n19 = t([[0, 1],[1, 2],[2, 3],[3, 0],[4, 0],[5, 0],[6, 0],[7, 0],[8, 2],[9, 4],[10, 5],[11, 5],[12, 5],[13, 1],[14, 2],[15, 1],[16, 2],[17, 3],[19, 5],[20, 4],[21, 5],[22, 4],[24, 1],[25, 0],[26, 0],[27, 0],[28, 0]])

export const light_alt1 = n19
const n20 = t([[0, 2],[1, 3],[2, 0],[3, 0],[4, 0],[5, 0],[6, 0],[7, 2],[8, 4],[9, 5],[10, 5],[11, 5],[12, 5],[13, 2],[14, 3],[15, 2],[16, 3],[17, 0],[19, 4],[20, 2],[21, 4],[22, 2],[24, 2],[25, 2],[26, 2],[27, 2],[28, 2]])

export const light_alt2 = n20
const n21 = t([[13, 3],[14, 0],[15, 3],[16, 0],[17, 0],[19, 2],[20, 0],[21, 2],[22, 0],[24, 3],[25, 4],[26, 4],[27, 4],[28, 4]])

export const light_active = n21
export const light_Separator = n21
export const light_alt1_Checkbox = n21
export const light_alt1_Switch = n21
export const light_alt1_SliderTrack = n21
export const light_alt2_Card = n21
export const light_alt2_Button = n21
export const light_alt2_DrawerFrame = n21
export const light_alt2_Progress = n21
export const light_alt2_TooltipArrow = n21
export const light_alt2_Input = n21
export const light_alt2_Surface = n21
const n22 = t([[13, 0],[14, 0],[15, 0],[16, 0],[17, 1],[19, 5],[20, 5],[21, 5],[22, 5],[24, 0],[25, 0],[26, 0],[27, 0],[28, 0]])

export const light_dim = n22
export const light_ListItem = n22
export const light_TooltipContent = n22
const n23 = t([[0, 9],[1, 10],[2, 11],[3, 4],[4, 5],[5, 5],[6, 5],[7, 5],[8, 4],[9, 3],[10, 0],[11, 0],[12, 0],[13, 9],[14, 10],[15, 9],[16, 10],[17, 11],[19, 0],[20, 3],[21, 0],[22, 3],[24, 9],[25, 5],[26, 5],[27, 5],[28, 5]])

export const dark_alt1 = n23
const n24 = t([[0, 10],[1, 11],[2, 4],[3, 5],[4, 5],[5, 5],[6, 5],[7, 4],[8, 3],[9, 0],[10, 0],[11, 0],[12, 0],[13, 10],[14, 11],[15, 10],[16, 11],[17, 4],[19, 3],[20, 4],[21, 3],[22, 4],[24, 10],[25, 4],[26, 4],[27, 4],[28, 4]])

export const dark_alt2 = n24
const n25 = t([[13, 11],[14, 4],[15, 11],[16, 4],[17, 5],[19, 4],[20, 5],[21, 4],[22, 5],[24, 11],[25, 3],[26, 3],[27, 3],[28, 3]])

export const dark_active = n25
export const dark_Separator = n25
export const dark_alt1_Checkbox = n25
export const dark_alt1_Switch = n25
export const dark_alt1_SliderTrack = n25
export const dark_alt2_Card = n25
export const dark_alt2_Button = n25
export const dark_alt2_DrawerFrame = n25
export const dark_alt2_Progress = n25
export const dark_alt2_TooltipArrow = n25
export const dark_alt2_Input = n25
export const dark_alt2_Surface = n25
export const dark_active_ListItem = n25
const n26 = t([[13, 5],[14, 5],[15, 5],[16, 5],[17, 9],[19, 0],[20, 0],[21, 0],[22, 0],[24, 5],[25, 5],[26, 5],[27, 5],[28, 5]])

export const dark_dim = n26
export const dark_TooltipContent = n26
export const dark_dim_ListItem = n26
const n27 = t([[0, 13],[1, 14],[2, 15],[3, 16],[4, 17],[5, 18],[6, 19],[7, 20],[8, 21],[9, 22],[10, 5],[11, 5],[12, 5],[13, 13],[14, 14],[15, 13],[16, 14],[17, 15],[19, 5],[20, 22],[21, 5],[22, 22],[24, 17],[25, 18],[26, 17],[27, 17],[28, 20]])

export const light_yellow_alt1 = n27
const n28 = t([[0, 14],[1, 15],[2, 16],[3, 17],[4, 18],[5, 19],[6, 20],[7, 21],[8, 22],[9, 5],[10, 5],[11, 5],[12, 5],[13, 14],[14, 15],[15, 14],[16, 15],[17, 16],[19, 22],[20, 21],[21, 22],[22, 21],[24, 18],[25, 19],[26, 18],[27, 18],[28, 21]])

export const light_yellow_alt2 = n28
const n29 = t([[13, 15],[14, 16],[15, 15],[16, 16],[17, 17],[19, 21],[20, 20],[21, 21],[22, 20],[24, 19],[25, 20],[26, 19],[27, 19],[28, 22]])

export const light_yellow_active = n29
export const light_yellow_Separator = n29
export const light_yellow_alt1_Checkbox = n29
export const light_yellow_alt1_Switch = n29
export const light_yellow_alt1_SliderTrack = n29
export const light_yellow_alt2_Card = n29
export const light_yellow_alt2_Button = n29
export const light_yellow_alt2_DrawerFrame = n29
export const light_yellow_alt2_Progress = n29
export const light_yellow_alt2_TooltipArrow = n29
export const light_yellow_alt2_Input = n29
export const light_yellow_alt2_Surface = n29
const n30 = t([[13, 12],[14, 12],[15, 12],[16, 12],[17, 13],[19, 5],[20, 5],[21, 5],[22, 5],[24, 15],[25, 16],[26, 15],[27, 15],[28, 18]])

export const light_yellow_dim = n30
export const light_yellow_ListItem = n30
export const light_yellow_TooltipContent = n30
const n31 = t([[0, 23],[1, 24],[2, 25],[3, 23],[4, 0],[5, 0],[6, 23],[7, 24],[8, 25],[9, 5],[10, 5],[11, 5],[12, 5],[13, 23],[14, 24],[15, 23],[16, 24],[17, 25],[19, 5],[20, 5],[21, 5],[22, 5],[24, 0],[25, 0],[26, 0],[27, 0],[28, 24]])

export const light_green_alt1 = n31
const n32 = t([[0, 24],[1, 25],[2, 23],[3, 0],[4, 0],[5, 23],[6, 24],[7, 25],[8, 5],[9, 5],[10, 5],[11, 5],[12, 5],[13, 24],[14, 25],[15, 24],[16, 25],[17, 23],[19, 5],[20, 25],[21, 5],[22, 25],[24, 0],[25, 23],[26, 0],[27, 0],[28, 25]])

export const light_green_alt2 = n32
const n33 = t([[13, 25],[14, 23],[15, 25],[16, 23],[17, 0],[19, 25],[20, 24],[21, 25],[22, 24],[24, 23],[25, 24],[26, 23],[27, 23],[28, 5]])

export const light_green_active = n33
export const light_green_Separator = n33
export const light_green_alt1_Checkbox = n33
export const light_green_alt1_Switch = n33
export const light_green_alt1_SliderTrack = n33
export const light_green_alt2_Card = n33
export const light_green_alt2_Button = n33
export const light_green_alt2_DrawerFrame = n33
export const light_green_alt2_Progress = n33
export const light_green_alt2_TooltipArrow = n33
export const light_green_alt2_Input = n33
export const light_green_alt2_Surface = n33
const n34 = t([[13, 0],[14, 0],[15, 0],[16, 0],[17, 23],[19, 5],[20, 5],[21, 5],[22, 5],[24, 25],[25, 23],[26, 25],[27, 25],[28, 0]])

export const light_green_dim = n34
export const light_green_ListItem = n34
export const light_green_TooltipContent = n34
const n35 = t([[0, 27],[1, 28],[2, 29],[3, 30],[4, 31],[5, 32],[6, 33],[7, 34],[8, 35],[9, 36],[10, 5],[11, 5],[12, 5],[13, 27],[14, 28],[15, 27],[16, 28],[17, 29],[19, 5],[20, 36],[21, 5],[22, 36],[24, 31],[25, 32],[26, 31],[27, 31],[28, 34]])

export const light_red_alt1 = n35
const n36 = t([[0, 28],[1, 29],[2, 30],[3, 31],[4, 32],[5, 33],[6, 34],[7, 35],[8, 36],[9, 5],[10, 5],[11, 5],[12, 5],[13, 28],[14, 29],[15, 28],[16, 29],[17, 30],[19, 36],[20, 35],[21, 36],[22, 35],[24, 32],[25, 33],[26, 32],[27, 32],[28, 35]])

export const light_red_alt2 = n36
const n37 = t([[13, 29],[14, 30],[15, 29],[16, 30],[17, 31],[19, 35],[20, 34],[21, 35],[22, 34],[24, 33],[25, 34],[26, 33],[27, 33],[28, 36]])

export const light_red_active = n37
export const light_red_Separator = n37
export const light_red_alt1_Checkbox = n37
export const light_red_alt1_Switch = n37
export const light_red_alt1_SliderTrack = n37
export const light_red_alt2_Card = n37
export const light_red_alt2_Button = n37
export const light_red_alt2_DrawerFrame = n37
export const light_red_alt2_Progress = n37
export const light_red_alt2_TooltipArrow = n37
export const light_red_alt2_Input = n37
export const light_red_alt2_Surface = n37
const n38 = t([[13, 26],[14, 26],[15, 26],[16, 26],[17, 27],[19, 5],[20, 5],[21, 5],[22, 5],[24, 29],[25, 30],[26, 29],[27, 29],[28, 32]])

export const light_red_dim = n38
export const light_red_ListItem = n38
export const light_red_TooltipContent = n38
const n39 = t([[0, 38],[1, 39],[2, 40],[3, 41],[4, 42],[5, 43],[6, 19],[7, 44],[8, 45],[9, 46],[10, 0],[11, 0],[12, 0],[13, 38],[14, 39],[15, 38],[16, 39],[17, 40],[19, 0],[20, 46],[21, 0],[22, 46],[24, 38],[25, 44],[26, 44],[27, 44],[28, 44]])

export const dark_yellow_alt1 = n39
const n40 = t([[0, 39],[1, 40],[2, 41],[3, 42],[4, 43],[5, 19],[6, 44],[7, 45],[8, 46],[9, 0],[10, 0],[11, 0],[12, 0],[13, 39],[14, 40],[15, 39],[16, 40],[17, 41],[19, 46],[20, 45],[21, 46],[22, 45],[24, 39],[25, 45],[26, 45],[27, 45],[28, 45]])

export const dark_yellow_alt2 = n40
const n41 = t([[13, 40],[14, 41],[15, 40],[16, 41],[17, 42],[19, 45],[20, 44],[21, 45],[22, 44],[24, 40],[25, 46],[26, 46],[27, 46],[28, 46]])

export const dark_yellow_active = n41
export const dark_yellow_Separator = n41
export const dark_yellow_alt1_Checkbox = n41
export const dark_yellow_alt1_Switch = n41
export const dark_yellow_alt1_SliderTrack = n41
export const dark_yellow_alt2_Card = n41
export const dark_yellow_alt2_Button = n41
export const dark_yellow_alt2_DrawerFrame = n41
export const dark_yellow_alt2_Progress = n41
export const dark_yellow_alt2_TooltipArrow = n41
export const dark_yellow_alt2_Input = n41
export const dark_yellow_alt2_Surface = n41
export const dark_yellow_active_ListItem = n41
const n42 = t([[13, 37],[14, 37],[15, 37],[16, 37],[17, 38],[19, 0],[20, 0],[21, 0],[22, 0],[24, 37],[25, 43],[26, 43],[27, 43],[28, 43]])

export const dark_yellow_dim = n42
export const dark_yellow_TooltipContent = n42
export const dark_yellow_dim_ListItem = n42
const n43 = t([[0, 47],[1, 24],[2, 48],[3, 23],[4, 5],[5, 5],[6, 10],[7, 24],[8, 23],[9, 0],[10, 0],[11, 0],[12, 0],[13, 47],[14, 24],[15, 47],[16, 24],[17, 48],[19, 0],[20, 0],[21, 0],[22, 0],[24, 47],[25, 24],[26, 24],[27, 24],[28, 24]])

export const dark_green_alt1 = n43
const n44 = t([[0, 24],[1, 48],[2, 23],[3, 5],[4, 5],[5, 10],[6, 24],[7, 23],[8, 0],[9, 0],[10, 0],[11, 0],[12, 0],[13, 24],[14, 48],[15, 24],[16, 48],[17, 23],[19, 0],[20, 23],[21, 0],[22, 23],[24, 24],[25, 23],[26, 23],[27, 23],[28, 23]])

export const dark_green_alt2 = n44
const n45 = t([[13, 48],[14, 23],[15, 48],[16, 23],[17, 5],[19, 23],[20, 24],[21, 23],[22, 24],[24, 48],[25, 0],[26, 0],[27, 0],[28, 0]])

export const dark_green_active = n45
export const dark_green_Separator = n45
export const dark_green_alt1_Checkbox = n45
export const dark_green_alt1_Switch = n45
export const dark_green_alt1_SliderTrack = n45
export const dark_green_alt2_Card = n45
export const dark_green_alt2_DrawerFrame = n45
export const dark_green_alt2_Progress = n45
export const dark_green_alt2_TooltipArrow = n45
export const dark_green_alt2_Input = n45
export const dark_green_alt2_Surface = n45
export const dark_green_active_ListItem = n45
const n46 = t([[13, 5],[14, 5],[15, 5],[16, 5],[17, 47],[19, 0],[20, 0],[21, 0],[22, 0],[24, 5],[25, 5],[26, 5],[27, 5],[28, 5]])

export const dark_green_dim = n46
export const dark_green_TooltipContent = n46
export const dark_green_dim_ListItem = n46
const n47 = t([[0, 50],[1, 51],[2, 52],[3, 53],[4, 54],[5, 55],[6, 33],[7, 56],[8, 57],[9, 58],[10, 0],[11, 0],[12, 0],[13, 50],[14, 51],[15, 50],[16, 51],[17, 52],[19, 0],[20, 58],[21, 0],[22, 58],[24, 50],[25, 56],[26, 56],[27, 56],[28, 56]])

export const dark_red_alt1 = n47
const n48 = t([[0, 51],[1, 52],[2, 53],[3, 54],[4, 55],[5, 33],[6, 56],[7, 57],[8, 58],[9, 0],[10, 0],[11, 0],[12, 0],[13, 51],[14, 52],[15, 51],[16, 52],[17, 53],[19, 58],[20, 57],[21, 58],[22, 57],[24, 51],[25, 57],[26, 57],[27, 57],[28, 57]])

export const dark_red_alt2 = n48
const n49 = t([[13, 52],[14, 53],[15, 52],[16, 53],[17, 54],[19, 57],[20, 56],[21, 57],[22, 56],[24, 52],[25, 58],[26, 58],[27, 58],[28, 58]])

export const dark_red_active = n49
export const dark_red_Separator = n49
export const dark_red_alt1_Checkbox = n49
export const dark_red_alt1_Switch = n49
export const dark_red_alt1_SliderTrack = n49
export const dark_red_alt2_Card = n49
export const dark_red_alt2_Button = n49
export const dark_red_alt2_DrawerFrame = n49
export const dark_red_alt2_Progress = n49
export const dark_red_alt2_TooltipArrow = n49
export const dark_red_alt2_Input = n49
export const dark_red_alt2_Surface = n49
export const dark_red_active_ListItem = n49
const n50 = t([[13, 49],[14, 49],[15, 49],[16, 49],[17, 50],[19, 0],[20, 0],[21, 0],[22, 0],[24, 49],[25, 55],[26, 55],[27, 55],[28, 55]])

export const dark_red_dim = n50
export const dark_red_TooltipContent = n50
export const dark_red_dim_ListItem = n50
const n51 = t([[15, 1],[16, 2],[17, 3],[19, 1],[20, 4],[21, 1],[22, 4],[24, 1],[25, 0],[26, 0],[27, 0],[28, 0]])

export const light_ghost_alt1 = n51
export const light_ghost_Card = n51
export const light_ghost_Button = n51
export const light_ghost_DrawerFrame = n51
export const light_ghost_Progress = n51
export const light_ghost_TooltipArrow = n51
export const light_ghost_Input = n51
export const light_ghost_Surface = n51
export const light_ghost_alt2_ListItem = n51
export const light_ghost_alt2_TooltipContent = n51
const n52 = t([[15, 2],[16, 3],[17, 0],[19, 2],[20, 2],[21, 2],[22, 2],[24, 2],[25, 2],[26, 2],[27, 2],[28, 2]])

export const light_ghost_alt2 = n52
export const light_ghost_Checkbox = n52
export const light_ghost_Switch = n52
export const light_ghost_SliderTrack = n52
export const light_ghost_alt1_Card = n52
export const light_ghost_alt1_Button = n52
export const light_ghost_alt1_DrawerFrame = n52
export const light_ghost_alt1_Progress = n52
export const light_ghost_alt1_TooltipArrow = n52
export const light_ghost_alt1_Input = n52
export const light_ghost_alt1_Surface = n52
export const light_ghost_active_ListItem = n52
export const light_ghost_active_TooltipContent = n52
const n53 = t([[15, 3],[16, 0],[17, 0],[19, 3],[20, 0],[21, 3],[22, 0],[24, 3],[25, 4],[26, 4],[27, 4],[28, 4]])

export const light_ghost_active = n53
export const light_ghost_Separator = n53
export const light_ghost_alt1_Checkbox = n53
export const light_ghost_alt1_Switch = n53
export const light_ghost_alt1_SliderTrack = n53
export const light_ghost_alt2_Card = n53
export const light_ghost_alt2_Button = n53
export const light_ghost_alt2_DrawerFrame = n53
export const light_ghost_alt2_Progress = n53
export const light_ghost_alt2_TooltipArrow = n53
export const light_ghost_alt2_Input = n53
export const light_ghost_alt2_Surface = n53
const n54 = t([[15, 0],[16, 0],[17, 1],[19, 0],[20, 5],[21, 0],[22, 5],[24, 0],[25, 0],[26, 0],[27, 0],[28, 0]])

export const light_ghost_dim = n54
export const light_ghost_ListItem = n54
export const light_ghost_TooltipContent = n54
const n55 = t([[15, 9],[16, 10],[17, 11],[19, 9],[20, 3],[21, 9],[22, 3],[24, 9],[25, 5],[26, 5],[27, 5],[28, 5]])

export const dark_ghost_alt1 = n55
export const dark_ghost_Card = n55
export const dark_ghost_Button = n55
export const dark_ghost_DrawerFrame = n55
export const dark_ghost_Progress = n55
export const dark_ghost_TooltipArrow = n55
export const dark_ghost_Input = n55
export const dark_ghost_Surface = n55
export const dark_ghost_alt1_ListItem = n55
export const dark_ghost_alt2_TooltipContent = n55
const n56 = t([[15, 10],[16, 11],[17, 4],[19, 10],[20, 4],[21, 10],[22, 4],[24, 10],[25, 4],[26, 4],[27, 4],[28, 4]])

export const dark_ghost_alt2 = n56
export const dark_ghost_Checkbox = n56
export const dark_ghost_Switch = n56
export const dark_ghost_SliderTrack = n56
export const dark_ghost_alt1_Card = n56
export const dark_ghost_alt1_Button = n56
export const dark_ghost_alt1_DrawerFrame = n56
export const dark_ghost_alt1_Progress = n56
export const dark_ghost_alt1_TooltipArrow = n56
export const dark_ghost_alt1_Input = n56
export const dark_ghost_alt1_Surface = n56
export const dark_ghost_alt2_ListItem = n56
export const dark_ghost_active_TooltipContent = n56
const n57 = t([[15, 11],[16, 4],[17, 5],[19, 11],[20, 5],[21, 11],[22, 5],[24, 11],[25, 3],[26, 3],[27, 3],[28, 3]])

export const dark_ghost_active = n57
export const dark_ghost_Separator = n57
export const dark_ghost_alt1_Checkbox = n57
export const dark_ghost_alt1_Switch = n57
export const dark_ghost_alt1_SliderTrack = n57
export const dark_ghost_alt2_Card = n57
export const dark_ghost_alt2_Button = n57
export const dark_ghost_alt2_DrawerFrame = n57
export const dark_ghost_alt2_Progress = n57
export const dark_ghost_alt2_TooltipArrow = n57
export const dark_ghost_alt2_Input = n57
export const dark_ghost_alt2_Surface = n57
export const dark_ghost_active_ListItem = n57
const n58 = t([[15, 5],[16, 5],[17, 9],[19, 5],[20, 0],[21, 5],[22, 0],[24, 5],[25, 5],[26, 5],[27, 5],[28, 5]])

export const dark_ghost_dim = n58
export const dark_ghost_TooltipContent = n58
export const dark_ghost_dim_ListItem = n58
const n59 = t([[15, 13],[16, 14],[17, 15],[19, 17],[20, 22],[21, 13],[22, 22],[24, 17],[25, 18],[26, 17],[27, 17],[28, 20]])

export const light_yellow_ghost_alt1 = n59
export const light_yellow_ghost_Card = n59
export const light_yellow_ghost_Button = n59
export const light_yellow_ghost_DrawerFrame = n59
export const light_yellow_ghost_Progress = n59
export const light_yellow_ghost_TooltipArrow = n59
export const light_yellow_ghost_Input = n59
export const light_yellow_ghost_Surface = n59
export const light_yellow_ghost_alt2_ListItem = n59
export const light_yellow_ghost_alt2_TooltipContent = n59
const n60 = t([[15, 14],[16, 15],[17, 16],[19, 18],[20, 21],[21, 14],[22, 21],[24, 18],[25, 19],[26, 18],[27, 18],[28, 21]])

export const light_yellow_ghost_alt2 = n60
export const light_yellow_ghost_Checkbox = n60
export const light_yellow_ghost_Switch = n60
export const light_yellow_ghost_SliderTrack = n60
export const light_yellow_ghost_alt1_Card = n60
export const light_yellow_ghost_alt1_Button = n60
export const light_yellow_ghost_alt1_DrawerFrame = n60
export const light_yellow_ghost_alt1_Progress = n60
export const light_yellow_ghost_alt1_TooltipArrow = n60
export const light_yellow_ghost_alt1_Input = n60
export const light_yellow_ghost_alt1_Surface = n60
export const light_yellow_ghost_active_ListItem = n60
export const light_yellow_ghost_active_TooltipContent = n60
const n61 = t([[15, 15],[16, 16],[17, 17],[19, 19],[20, 20],[21, 15],[22, 20],[24, 19],[25, 20],[26, 19],[27, 19],[28, 22]])

export const light_yellow_ghost_active = n61
export const light_yellow_ghost_Separator = n61
export const light_yellow_ghost_alt1_Checkbox = n61
export const light_yellow_ghost_alt1_Switch = n61
export const light_yellow_ghost_alt1_SliderTrack = n61
export const light_yellow_ghost_alt2_Card = n61
export const light_yellow_ghost_alt2_Button = n61
export const light_yellow_ghost_alt2_DrawerFrame = n61
export const light_yellow_ghost_alt2_Progress = n61
export const light_yellow_ghost_alt2_TooltipArrow = n61
export const light_yellow_ghost_alt2_Input = n61
export const light_yellow_ghost_alt2_Surface = n61
const n62 = t([[15, 12],[16, 12],[17, 13],[19, 15],[20, 5],[21, 12],[22, 5],[24, 15],[25, 16],[26, 15],[27, 15],[28, 18]])

export const light_yellow_ghost_dim = n62
export const light_yellow_ghost_ListItem = n62
export const light_yellow_ghost_TooltipContent = n62
const n63 = t([[15, 23],[16, 24],[17, 25],[19, 0],[20, 5],[21, 23],[22, 5],[24, 0],[25, 0],[26, 0],[27, 0],[28, 24]])

export const light_green_ghost_alt1 = n63
export const light_green_ghost_Card = n63
export const light_green_ghost_Button = n63
export const light_green_ghost_DrawerFrame = n63
export const light_green_ghost_Progress = n63
export const light_green_ghost_TooltipArrow = n63
export const light_green_ghost_Input = n63
export const light_green_ghost_Surface = n63
export const light_green_ghost_alt2_ListItem = n63
export const light_green_ghost_alt2_TooltipContent = n63
const n64 = t([[15, 24],[16, 25],[17, 23],[19, 0],[20, 25],[21, 24],[22, 25],[24, 0],[25, 23],[26, 0],[27, 0],[28, 25]])

export const light_green_ghost_alt2 = n64
export const light_green_ghost_Checkbox = n64
export const light_green_ghost_Switch = n64
export const light_green_ghost_SliderTrack = n64
export const light_green_ghost_alt1_Card = n64
export const light_green_ghost_alt1_Button = n64
export const light_green_ghost_alt1_DrawerFrame = n64
export const light_green_ghost_alt1_Progress = n64
export const light_green_ghost_alt1_TooltipArrow = n64
export const light_green_ghost_alt1_Input = n64
export const light_green_ghost_alt1_Surface = n64
export const light_green_ghost_active_ListItem = n64
export const light_green_ghost_active_TooltipContent = n64
const n65 = t([[15, 25],[16, 23],[17, 0],[19, 23],[20, 24],[21, 25],[22, 24],[24, 23],[25, 24],[26, 23],[27, 23],[28, 5]])

export const light_green_ghost_active = n65
export const light_green_ghost_Separator = n65
export const light_green_ghost_alt1_Checkbox = n65
export const light_green_ghost_alt1_Switch = n65
export const light_green_ghost_alt1_SliderTrack = n65
export const light_green_ghost_alt2_Card = n65
export const light_green_ghost_alt2_Button = n65
export const light_green_ghost_alt2_DrawerFrame = n65
export const light_green_ghost_alt2_Progress = n65
export const light_green_ghost_alt2_TooltipArrow = n65
export const light_green_ghost_alt2_Input = n65
export const light_green_ghost_alt2_Surface = n65
const n66 = t([[15, 0],[16, 0],[17, 23],[19, 25],[20, 5],[21, 0],[22, 5],[24, 25],[25, 23],[26, 25],[27, 25],[28, 0]])

export const light_green_ghost_dim = n66
export const light_green_ghost_ListItem = n66
export const light_green_ghost_TooltipContent = n66
const n67 = t([[15, 27],[16, 28],[17, 29],[19, 31],[20, 36],[21, 27],[22, 36],[24, 31],[25, 32],[26, 31],[27, 31],[28, 34]])

export const light_red_ghost_alt1 = n67
export const light_red_ghost_Card = n67
export const light_red_ghost_Button = n67
export const light_red_ghost_DrawerFrame = n67
export const light_red_ghost_Progress = n67
export const light_red_ghost_TooltipArrow = n67
export const light_red_ghost_Input = n67
export const light_red_ghost_Surface = n67
export const light_red_ghost_alt2_ListItem = n67
export const light_red_ghost_alt2_TooltipContent = n67
const n68 = t([[15, 28],[16, 29],[17, 30],[19, 32],[20, 35],[21, 28],[22, 35],[24, 32],[25, 33],[26, 32],[27, 32],[28, 35]])

export const light_red_ghost_alt2 = n68
export const light_red_ghost_Checkbox = n68
export const light_red_ghost_Switch = n68
export const light_red_ghost_SliderTrack = n68
export const light_red_ghost_alt1_Card = n68
export const light_red_ghost_alt1_Button = n68
export const light_red_ghost_alt1_DrawerFrame = n68
export const light_red_ghost_alt1_Progress = n68
export const light_red_ghost_alt1_TooltipArrow = n68
export const light_red_ghost_alt1_Input = n68
export const light_red_ghost_alt1_Surface = n68
export const light_red_ghost_active_ListItem = n68
export const light_red_ghost_active_TooltipContent = n68
const n69 = t([[15, 29],[16, 30],[17, 31],[19, 33],[20, 34],[21, 29],[22, 34],[24, 33],[25, 34],[26, 33],[27, 33],[28, 36]])

export const light_red_ghost_active = n69
export const light_red_ghost_Separator = n69
export const light_red_ghost_alt1_Checkbox = n69
export const light_red_ghost_alt1_Switch = n69
export const light_red_ghost_alt1_SliderTrack = n69
export const light_red_ghost_alt2_Card = n69
export const light_red_ghost_alt2_Button = n69
export const light_red_ghost_alt2_DrawerFrame = n69
export const light_red_ghost_alt2_Progress = n69
export const light_red_ghost_alt2_TooltipArrow = n69
export const light_red_ghost_alt2_Input = n69
export const light_red_ghost_alt2_Surface = n69
const n70 = t([[15, 26],[16, 26],[17, 27],[19, 29],[20, 5],[21, 26],[22, 5],[24, 29],[25, 30],[26, 29],[27, 29],[28, 32]])

export const light_red_ghost_dim = n70
export const light_red_ghost_ListItem = n70
export const light_red_ghost_TooltipContent = n70
const n71 = t([[15, 38],[16, 39],[17, 40],[19, 38],[20, 46],[21, 38],[22, 46],[24, 38],[25, 44],[26, 44],[27, 44],[28, 44]])

export const dark_yellow_ghost_alt1 = n71
export const dark_yellow_ghost_Card = n71
export const dark_yellow_ghost_Button = n71
export const dark_yellow_ghost_DrawerFrame = n71
export const dark_yellow_ghost_Progress = n71
export const dark_yellow_ghost_TooltipArrow = n71
export const dark_yellow_ghost_Input = n71
export const dark_yellow_ghost_Surface = n71
export const dark_yellow_ghost_alt1_ListItem = n71
export const dark_yellow_ghost_alt2_TooltipContent = n71
const n72 = t([[15, 39],[16, 40],[17, 41],[19, 39],[20, 45],[21, 39],[22, 45],[24, 39],[25, 45],[26, 45],[27, 45],[28, 45]])

export const dark_yellow_ghost_alt2 = n72
export const dark_yellow_ghost_Checkbox = n72
export const dark_yellow_ghost_Switch = n72
export const dark_yellow_ghost_SliderTrack = n72
export const dark_yellow_ghost_alt1_Card = n72
export const dark_yellow_ghost_alt1_Button = n72
export const dark_yellow_ghost_alt1_DrawerFrame = n72
export const dark_yellow_ghost_alt1_Progress = n72
export const dark_yellow_ghost_alt1_TooltipArrow = n72
export const dark_yellow_ghost_alt1_Input = n72
export const dark_yellow_ghost_alt1_Surface = n72
export const dark_yellow_ghost_alt2_ListItem = n72
export const dark_yellow_ghost_active_TooltipContent = n72
const n73 = t([[15, 40],[16, 41],[17, 42],[19, 40],[20, 44],[21, 40],[22, 44],[24, 40],[25, 46],[26, 46],[27, 46],[28, 46]])

export const dark_yellow_ghost_active = n73
export const dark_yellow_ghost_Separator = n73
export const dark_yellow_ghost_alt1_Checkbox = n73
export const dark_yellow_ghost_alt1_Switch = n73
export const dark_yellow_ghost_alt1_SliderTrack = n73
export const dark_yellow_ghost_alt2_Card = n73
export const dark_yellow_ghost_alt2_Button = n73
export const dark_yellow_ghost_alt2_DrawerFrame = n73
export const dark_yellow_ghost_alt2_Progress = n73
export const dark_yellow_ghost_alt2_TooltipArrow = n73
export const dark_yellow_ghost_alt2_Input = n73
export const dark_yellow_ghost_alt2_Surface = n73
export const dark_yellow_ghost_active_ListItem = n73
const n74 = t([[15, 37],[16, 37],[17, 38],[19, 37],[20, 0],[21, 37],[22, 0],[24, 37],[25, 43],[26, 43],[27, 43],[28, 43]])

export const dark_yellow_ghost_dim = n74
export const dark_yellow_ghost_TooltipContent = n74
export const dark_yellow_ghost_dim_ListItem = n74
const n75 = t([[15, 47],[16, 24],[17, 48],[19, 47],[20, 0],[21, 47],[22, 0],[24, 47],[25, 24],[26, 24],[27, 24],[28, 24]])

export const dark_green_ghost_alt1 = n75
export const dark_green_ghost_Card = n75
export const dark_green_ghost_DrawerFrame = n75
export const dark_green_ghost_Progress = n75
export const dark_green_ghost_TooltipArrow = n75
export const dark_green_ghost_Input = n75
export const dark_green_ghost_Surface = n75
export const dark_green_ghost_alt1_ListItem = n75
export const dark_green_ghost_alt2_TooltipContent = n75
const n76 = t([[15, 24],[16, 48],[17, 23],[19, 24],[20, 23],[21, 24],[22, 23],[24, 24],[25, 23],[26, 23],[27, 23],[28, 23]])

export const dark_green_ghost_alt2 = n76
export const dark_green_ghost_Checkbox = n76
export const dark_green_ghost_Switch = n76
export const dark_green_ghost_SliderTrack = n76
export const dark_green_ghost_alt1_Card = n76
export const dark_green_ghost_alt1_DrawerFrame = n76
export const dark_green_ghost_alt1_Progress = n76
export const dark_green_ghost_alt1_TooltipArrow = n76
export const dark_green_ghost_alt1_Input = n76
export const dark_green_ghost_alt1_Surface = n76
export const dark_green_ghost_alt2_ListItem = n76
export const dark_green_ghost_active_TooltipContent = n76
const n77 = t([[15, 48],[16, 23],[17, 5],[19, 48],[20, 24],[21, 48],[22, 24],[24, 48],[25, 0],[26, 0],[27, 0],[28, 0]])

export const dark_green_ghost_active = n77
export const dark_green_ghost_Separator = n77
export const dark_green_ghost_alt1_Checkbox = n77
export const dark_green_ghost_alt1_Switch = n77
export const dark_green_ghost_alt1_SliderTrack = n77
export const dark_green_ghost_alt2_Card = n77
export const dark_green_ghost_alt2_DrawerFrame = n77
export const dark_green_ghost_alt2_Progress = n77
export const dark_green_ghost_alt2_TooltipArrow = n77
export const dark_green_ghost_alt2_Input = n77
export const dark_green_ghost_alt2_Surface = n77
export const dark_green_ghost_active_ListItem = n77
const n78 = t([[15, 5],[16, 5],[17, 47],[19, 5],[20, 0],[21, 5],[22, 0],[24, 5],[25, 5],[26, 5],[27, 5],[28, 5]])

export const dark_green_ghost_dim = n78
export const dark_green_ghost_TooltipContent = n78
export const dark_green_ghost_dim_ListItem = n78
const n79 = t([[15, 50],[16, 51],[17, 52],[19, 50],[20, 58],[21, 50],[22, 58],[24, 50],[25, 56],[26, 56],[27, 56],[28, 56]])

export const dark_red_ghost_alt1 = n79
export const dark_red_ghost_Card = n79
export const dark_red_ghost_Button = n79
export const dark_red_ghost_DrawerFrame = n79
export const dark_red_ghost_Progress = n79
export const dark_red_ghost_TooltipArrow = n79
export const dark_red_ghost_Input = n79
export const dark_red_ghost_Surface = n79
export const dark_red_ghost_alt1_ListItem = n79
export const dark_red_ghost_alt2_TooltipContent = n79
const n80 = t([[15, 51],[16, 52],[17, 53],[19, 51],[20, 57],[21, 51],[22, 57],[24, 51],[25, 57],[26, 57],[27, 57],[28, 57]])

export const dark_red_ghost_alt2 = n80
export const dark_red_ghost_Checkbox = n80
export const dark_red_ghost_Switch = n80
export const dark_red_ghost_SliderTrack = n80
export const dark_red_ghost_alt1_Card = n80
export const dark_red_ghost_alt1_Button = n80
export const dark_red_ghost_alt1_DrawerFrame = n80
export const dark_red_ghost_alt1_Progress = n80
export const dark_red_ghost_alt1_TooltipArrow = n80
export const dark_red_ghost_alt1_Input = n80
export const dark_red_ghost_alt1_Surface = n80
export const dark_red_ghost_alt2_ListItem = n80
export const dark_red_ghost_active_TooltipContent = n80
const n81 = t([[15, 52],[16, 53],[17, 54],[19, 52],[20, 56],[21, 52],[22, 56],[24, 52],[25, 58],[26, 58],[27, 58],[28, 58]])

export const dark_red_ghost_active = n81
export const dark_red_ghost_Separator = n81
export const dark_red_ghost_alt1_Checkbox = n81
export const dark_red_ghost_alt1_Switch = n81
export const dark_red_ghost_alt1_SliderTrack = n81
export const dark_red_ghost_alt2_Card = n81
export const dark_red_ghost_alt2_Button = n81
export const dark_red_ghost_alt2_DrawerFrame = n81
export const dark_red_ghost_alt2_Progress = n81
export const dark_red_ghost_alt2_TooltipArrow = n81
export const dark_red_ghost_alt2_Input = n81
export const dark_red_ghost_alt2_Surface = n81
export const dark_red_ghost_active_ListItem = n81
const n82 = t([[15, 49],[16, 49],[17, 50],[19, 49],[20, 0],[21, 49],[22, 0],[24, 49],[25, 55],[26, 55],[27, 55],[28, 55]])

export const dark_red_ghost_dim = n82
export const dark_red_ghost_TooltipContent = n82
export const dark_red_ghost_dim_ListItem = n82
const n83 = t([[13, 1],[14, 2],[15, 1],[16, 2],[17, 3],[19, 5],[20, 4],[21, 5],[22, 4],[24, 1],[25, 0],[26, 0],[27, 0],[28, 0]])

export const light_Card = n83
export const light_Button = n83
export const light_DrawerFrame = n83
export const light_Progress = n83
export const light_TooltipArrow = n83
export const light_Input = n83
export const light_Surface = n83
export const light_alt2_ListItem = n83
export const light_alt2_TooltipContent = n83
const n84 = t([[13, 2],[14, 3],[15, 2],[16, 3],[17, 0],[19, 4],[20, 2],[21, 4],[22, 2],[24, 2],[25, 2],[26, 2],[27, 2],[28, 2]])

export const light_Checkbox = n84
export const light_Switch = n84
export const light_SliderTrack = n84
export const light_alt1_Card = n84
export const light_alt1_Button = n84
export const light_alt1_DrawerFrame = n84
export const light_alt1_Progress = n84
export const light_alt1_TooltipArrow = n84
export const light_alt1_Input = n84
export const light_alt1_Surface = n84
export const light_active_ListItem = n84
export const light_active_TooltipContent = n84
const n85 = t([[13, 5],[14, 5],[15, 5],[16, 5],[17, 5],[18, 61],[19, 0],[20, 0],[21, 0],[22, 0],[23, 61],[24, 5],[25, 0],[26, 0],[27, 0],[28, 0]])

export const light_SwitchThumb = n85
export const light_alt1_SwitchThumb = n85
export const light_dim_SwitchThumb = n85
export const light_dim_SliderThumb = n85
export const light_dim_Tooltip = n85
export const light_dim_ProgressIndicator = n85
const n86 = t([[13, 5],[14, 4],[15, 5],[16, 4],[17, 2],[18, 61],[19, 1],[20, 2],[21, 1],[22, 2],[23, 61],[24, 5],[25, 0],[26, 0],[27, 0],[28, 0]])

export const light_SliderTrackActive = n86
export const light_alt1_SliderThumb = n86
export const light_alt1_Tooltip = n86
export const light_alt1_ProgressIndicator = n86
export const light_active_SwitchThumb = n86
const n87 = t([[13, 5],[14, 5],[15, 5],[16, 5],[17, 4],[18, 61],[19, 0],[20, 1],[21, 0],[22, 1],[23, 61],[24, 5],[25, 0],[26, 0],[27, 0],[28, 0]])

export const light_SliderThumb = n87
export const light_Tooltip = n87
export const light_ProgressIndicator = n87
export const light_alt2_SwitchThumb = n87
const n88 = t([[13, 0],[14, 0],[15, 0],[16, 0],[17, 1],[19, 5],[20, 5],[21, 5],[22, 5],[24, 1],[25, 0],[26, 0],[27, 0],[28, 0]])

export const light_TextArea = n88
const n89 = t([[13, 5],[14, 9],[15, 5],[16, 9],[17, 10],[18, 6],[19, 0],[20, 0],[21, 0],[22, 0],[23, 6],[24, 5],[25, 5],[26, 5],[27, 5],[28, 5]])

export const dark_ListItem = n89
const n90 = t([[13, 9],[14, 10],[15, 9],[16, 10],[17, 11],[19, 0],[20, 3],[21, 0],[22, 3],[24, 9],[25, 5],[26, 5],[27, 5],[28, 5]])

export const dark_Card = n90
export const dark_Button = n90
export const dark_DrawerFrame = n90
export const dark_Progress = n90
export const dark_TooltipArrow = n90
export const dark_Input = n90
export const dark_Surface = n90
export const dark_alt1_ListItem = n90
export const dark_alt2_TooltipContent = n90
const n91 = t([[13, 10],[14, 11],[15, 10],[16, 11],[17, 4],[19, 3],[20, 4],[21, 3],[22, 4],[24, 10],[25, 4],[26, 4],[27, 4],[28, 4]])

export const dark_Checkbox = n91
export const dark_Switch = n91
export const dark_SliderTrack = n91
export const dark_alt1_Card = n91
export const dark_alt1_Button = n91
export const dark_alt1_DrawerFrame = n91
export const dark_alt1_Progress = n91
export const dark_alt1_TooltipArrow = n91
export const dark_alt1_Input = n91
export const dark_alt1_Surface = n91
export const dark_alt2_ListItem = n91
export const dark_active_TooltipContent = n91
const n92 = t([[13, 0],[14, 0],[15, 0],[16, 0],[17, 0],[18, 61],[19, 5],[20, 5],[21, 5],[22, 5],[23, 61],[24, 0],[25, 5],[26, 5],[27, 5],[28, 5]])

export const dark_SwitchThumb = n92
export const dark_alt1_SwitchThumb = n92
export const dark_dim_SwitchThumb = n92
export const dark_dim_SliderThumb = n92
export const dark_dim_Tooltip = n92
export const dark_dim_ProgressIndicator = n92
export const dark_green_alt1_SwitchThumb = n92
export const dark_green_dim_SliderThumb = n92
export const dark_green_dim_Tooltip = n92
export const dark_green_dim_ProgressIndicator = n92
const n93 = t([[13, 0],[14, 3],[15, 0],[16, 3],[17, 4],[18, 61],[19, 9],[20, 10],[21, 9],[22, 10],[23, 61],[24, 0],[25, 4],[26, 4],[27, 4],[28, 4]])

export const dark_SliderTrackActive = n93
export const dark_alt1_SliderThumb = n93
export const dark_alt1_Tooltip = n93
export const dark_alt1_ProgressIndicator = n93
export const dark_active_SwitchThumb = n93
const n94 = t([[13, 0],[14, 0],[15, 0],[16, 0],[17, 3],[18, 61],[19, 5],[20, 9],[21, 5],[22, 9],[23, 61],[24, 0],[25, 5],[26, 5],[27, 5],[28, 5]])

export const dark_SliderThumb = n94
export const dark_Tooltip = n94
export const dark_ProgressIndicator = n94
export const dark_alt2_SwitchThumb = n94
const n95 = t([[13, 5],[14, 9],[15, 5],[16, 9],[17, 10],[18, 6],[19, 0],[20, 0],[21, 0],[22, 0],[23, 6],[24, 9],[25, 5],[26, 5],[27, 5],[28, 5]])

export const dark_TextArea = n95
const n96 = t([[13, 13],[14, 14],[15, 13],[16, 14],[17, 15],[19, 5],[20, 22],[21, 5],[22, 22],[24, 17],[25, 18],[26, 17],[27, 17],[28, 20]])

export const light_yellow_Card = n96
export const light_yellow_Button = n96
export const light_yellow_DrawerFrame = n96
export const light_yellow_Progress = n96
export const light_yellow_TooltipArrow = n96
export const light_yellow_Input = n96
export const light_yellow_Surface = n96
export const light_yellow_alt2_ListItem = n96
export const light_yellow_alt2_TooltipContent = n96
const n97 = t([[13, 14],[14, 15],[15, 14],[16, 15],[17, 16],[19, 22],[20, 21],[21, 22],[22, 21],[24, 18],[25, 19],[26, 18],[27, 18],[28, 21]])

export const light_yellow_Checkbox = n97
export const light_yellow_Switch = n97
export const light_yellow_SliderTrack = n97
export const light_yellow_alt1_Card = n97
export const light_yellow_alt1_Button = n97
export const light_yellow_alt1_DrawerFrame = n97
export const light_yellow_alt1_Progress = n97
export const light_yellow_alt1_TooltipArrow = n97
export const light_yellow_alt1_Input = n97
export const light_yellow_alt1_Surface = n97
export const light_yellow_active_ListItem = n97
export const light_yellow_active_TooltipContent = n97
const n98 = t([[13, 5],[14, 5],[15, 5],[16, 5],[17, 5],[18, 61],[19, 12],[20, 12],[21, 12],[22, 12],[23, 61],[24, 22],[25, 21],[26, 22],[27, 22],[28, 19]])

export const light_yellow_SwitchThumb = n98
const n99 = t([[13, 5],[14, 22],[15, 5],[16, 22],[17, 21],[18, 61],[19, 13],[20, 14],[21, 13],[22, 14],[23, 61],[24, 19],[25, 18],[26, 19],[27, 19],[28, 16]])

export const light_yellow_SliderTrackActive = n99
export const light_yellow_alt1_SliderThumb = n99
export const light_yellow_alt1_Tooltip = n99
export const light_yellow_alt1_ProgressIndicator = n99
export const light_yellow_active_SwitchThumb = n99
const n100 = t([[13, 5],[14, 5],[15, 5],[16, 5],[17, 22],[18, 61],[19, 12],[20, 13],[21, 12],[22, 13],[23, 61],[24, 20],[25, 19],[26, 20],[27, 20],[28, 17]])

export const light_yellow_SliderThumb = n100
export const light_yellow_Tooltip = n100
export const light_yellow_ProgressIndicator = n100
export const light_yellow_alt2_SwitchThumb = n100
const n101 = t([[13, 12],[14, 12],[15, 12],[16, 12],[17, 13],[19, 5],[20, 5],[21, 5],[22, 5],[24, 17],[25, 18],[26, 17],[27, 17],[28, 18]])

export const light_yellow_TextArea = n101
const n102 = t([[13, 23],[14, 24],[15, 23],[16, 24],[17, 25],[19, 5],[20, 5],[21, 5],[22, 5],[24, 0],[25, 0],[26, 0],[27, 0],[28, 24]])

export const light_green_Card = n102
export const light_green_Button = n102
export const light_green_DrawerFrame = n102
export const light_green_Progress = n102
export const light_green_TooltipArrow = n102
export const light_green_Input = n102
export const light_green_Surface = n102
export const light_green_alt2_ListItem = n102
export const light_green_alt2_TooltipContent = n102
const n103 = t([[13, 24],[14, 25],[15, 24],[16, 25],[17, 23],[19, 5],[20, 25],[21, 5],[22, 25],[24, 0],[25, 23],[26, 0],[27, 0],[28, 25]])

export const light_green_Checkbox = n103
export const light_green_Switch = n103
export const light_green_SliderTrack = n103
export const light_green_alt1_Card = n103
export const light_green_alt1_Button = n103
export const light_green_alt1_DrawerFrame = n103
export const light_green_alt1_Progress = n103
export const light_green_alt1_TooltipArrow = n103
export const light_green_alt1_Input = n103
export const light_green_alt1_Surface = n103
export const light_green_active_ListItem = n103
export const light_green_active_TooltipContent = n103
const n104 = t([[13, 5],[14, 5],[15, 5],[16, 5],[17, 5],[18, 61],[19, 0],[20, 0],[21, 0],[22, 0],[23, 61],[24, 5],[25, 25],[26, 5],[27, 5],[28, 23]])

export const light_green_SwitchThumb = n104
const n105 = t([[13, 5],[14, 5],[15, 5],[16, 5],[17, 25],[18, 61],[19, 23],[20, 24],[21, 23],[22, 24],[23, 61],[24, 23],[25, 0],[26, 23],[27, 23],[28, 23]])

export const light_green_SliderTrackActive = n105
export const light_green_alt1_SliderThumb = n105
export const light_green_alt1_Tooltip = n105
export const light_green_alt1_ProgressIndicator = n105
export const light_green_active_SwitchThumb = n105
const n106 = t([[13, 5],[14, 5],[15, 5],[16, 5],[17, 5],[18, 61],[19, 0],[20, 23],[21, 0],[22, 23],[23, 61],[24, 24],[25, 23],[26, 24],[27, 24],[28, 0]])

export const light_green_SliderThumb = n106
export const light_green_Tooltip = n106
export const light_green_ProgressIndicator = n106
export const light_green_alt2_SwitchThumb = n106
const n107 = t([[13, 0],[14, 0],[15, 0],[16, 0],[17, 23],[19, 5],[20, 5],[21, 5],[22, 5],[24, 0],[25, 0],[26, 0],[27, 0],[28, 0]])

export const light_green_TextArea = n107
const n108 = t([[13, 27],[14, 28],[15, 27],[16, 28],[17, 29],[19, 5],[20, 36],[21, 5],[22, 36],[24, 31],[25, 32],[26, 31],[27, 31],[28, 34]])

export const light_red_Card = n108
export const light_red_Button = n108
export const light_red_DrawerFrame = n108
export const light_red_Progress = n108
export const light_red_TooltipArrow = n108
export const light_red_Input = n108
export const light_red_Surface = n108
export const light_red_alt2_ListItem = n108
export const light_red_alt2_TooltipContent = n108
const n109 = t([[13, 28],[14, 29],[15, 28],[16, 29],[17, 30],[19, 36],[20, 35],[21, 36],[22, 35],[24, 32],[25, 33],[26, 32],[27, 32],[28, 35]])

export const light_red_Checkbox = n109
export const light_red_Switch = n109
export const light_red_SliderTrack = n109
export const light_red_alt1_Card = n109
export const light_red_alt1_Button = n109
export const light_red_alt1_DrawerFrame = n109
export const light_red_alt1_Progress = n109
export const light_red_alt1_TooltipArrow = n109
export const light_red_alt1_Input = n109
export const light_red_alt1_Surface = n109
export const light_red_active_ListItem = n109
export const light_red_active_TooltipContent = n109
const n110 = t([[13, 5],[14, 5],[15, 5],[16, 5],[17, 5],[18, 61],[19, 26],[20, 26],[21, 26],[22, 26],[23, 61],[24, 36],[25, 35],[26, 36],[27, 36],[28, 33]])

export const light_red_SwitchThumb = n110
const n111 = t([[13, 5],[14, 36],[15, 5],[16, 36],[17, 35],[18, 61],[19, 27],[20, 28],[21, 27],[22, 28],[23, 61],[24, 33],[25, 32],[26, 33],[27, 33],[28, 30]])

export const light_red_SliderTrackActive = n111
export const light_red_alt1_SliderThumb = n111
export const light_red_alt1_Tooltip = n111
export const light_red_alt1_ProgressIndicator = n111
export const light_red_active_SwitchThumb = n111
const n112 = t([[13, 5],[14, 5],[15, 5],[16, 5],[17, 36],[18, 61],[19, 26],[20, 27],[21, 26],[22, 27],[23, 61],[24, 34],[25, 33],[26, 34],[27, 34],[28, 31]])

export const light_red_SliderThumb = n112
export const light_red_Tooltip = n112
export const light_red_ProgressIndicator = n112
export const light_red_alt2_SwitchThumb = n112
const n113 = t([[13, 26],[14, 26],[15, 26],[16, 26],[17, 27],[19, 5],[20, 5],[21, 5],[22, 5],[24, 31],[25, 32],[26, 31],[27, 31],[28, 32]])

export const light_red_TextArea = n113
const n114 = t([[13, 37],[14, 38],[15, 37],[16, 38],[17, 39],[18, 6],[19, 0],[20, 0],[21, 0],[22, 0],[23, 6],[24, 37],[25, 19],[26, 19],[27, 19],[28, 19]])

export const dark_yellow_ListItem = n114
const n115 = t([[13, 38],[14, 39],[15, 38],[16, 39],[17, 40],[19, 0],[20, 46],[21, 0],[22, 46],[24, 38],[25, 44],[26, 44],[27, 44],[28, 44]])

export const dark_yellow_Card = n115
export const dark_yellow_Button = n115
export const dark_yellow_DrawerFrame = n115
export const dark_yellow_Progress = n115
export const dark_yellow_TooltipArrow = n115
export const dark_yellow_Input = n115
export const dark_yellow_Surface = n115
export const dark_yellow_alt1_ListItem = n115
export const dark_yellow_alt2_TooltipContent = n115
const n116 = t([[13, 39],[14, 40],[15, 39],[16, 40],[17, 41],[19, 46],[20, 45],[21, 46],[22, 45],[24, 39],[25, 45],[26, 45],[27, 45],[28, 45]])

export const dark_yellow_Checkbox = n116
export const dark_yellow_Switch = n116
export const dark_yellow_SliderTrack = n116
export const dark_yellow_alt1_Card = n116
export const dark_yellow_alt1_Button = n116
export const dark_yellow_alt1_DrawerFrame = n116
export const dark_yellow_alt1_Progress = n116
export const dark_yellow_alt1_TooltipArrow = n116
export const dark_yellow_alt1_Input = n116
export const dark_yellow_alt1_Surface = n116
export const dark_yellow_alt2_ListItem = n116
export const dark_yellow_active_TooltipContent = n116
const n117 = t([[13, 0],[14, 0],[15, 0],[16, 0],[17, 0],[18, 61],[19, 37],[20, 37],[21, 37],[22, 37],[23, 61],[24, 0],[25, 19],[26, 19],[27, 19],[28, 19]])

export const dark_yellow_SwitchThumb = n117
const n118 = t([[13, 0],[14, 46],[15, 0],[16, 46],[17, 45],[18, 61],[19, 38],[20, 39],[21, 38],[22, 39],[23, 61],[24, 0],[25, 41],[26, 41],[27, 41],[28, 41]])

export const dark_yellow_SliderTrackActive = n118
export const dark_yellow_alt1_SliderThumb = n118
export const dark_yellow_alt1_Tooltip = n118
export const dark_yellow_alt1_ProgressIndicator = n118
export const dark_yellow_active_SwitchThumb = n118
const n119 = t([[13, 0],[14, 0],[15, 0],[16, 0],[17, 46],[18, 61],[19, 37],[20, 38],[21, 37],[22, 38],[23, 61],[24, 0],[25, 42],[26, 42],[27, 42],[28, 42]])

export const dark_yellow_SliderThumb = n119
export const dark_yellow_Tooltip = n119
export const dark_yellow_ProgressIndicator = n119
export const dark_yellow_alt2_SwitchThumb = n119
const n120 = t([[13, 37],[14, 38],[15, 37],[16, 38],[17, 39],[18, 6],[19, 0],[20, 0],[21, 0],[22, 0],[23, 6],[24, 38],[25, 44],[26, 44],[27, 44],[28, 19]])

export const dark_yellow_TextArea = n120
const n121 = t([[13, 5],[14, 47],[15, 5],[16, 47],[17, 24],[18, 6],[19, 0],[20, 0],[21, 0],[22, 0],[23, 6],[24, 5],[25, 10],[26, 10],[27, 10],[28, 10]])

export const dark_green_ListItem = n121
const n122 = t([[13, 47],[14, 24],[15, 47],[16, 24],[17, 48],[19, 0],[20, 0],[21, 0],[22, 0],[24, 47],[25, 24],[26, 24],[27, 24],[28, 24]])

export const dark_green_Card = n122
export const dark_green_DrawerFrame = n122
export const dark_green_Progress = n122
export const dark_green_TooltipArrow = n122
export const dark_green_Input = n122
export const dark_green_Surface = n122
export const dark_green_alt1_ListItem = n122
export const dark_green_alt2_TooltipContent = n122
const n123 = t([[13, 23],[14, 24],[15, 23],[16, 24],[17, 10],[18, 61],[19, 5],[20, 23],[21, 48],[22, 23],[23, 61],[24, 23],[25, 24],[26, 24],[27, 24],[28, 24]])

export const dark_green_Button = n123
const n124 = t([[13, 24],[14, 48],[15, 24],[16, 48],[17, 23],[19, 0],[20, 23],[21, 0],[22, 23],[24, 24],[25, 23],[26, 23],[27, 23],[28, 23]])

export const dark_green_Checkbox = n124
export const dark_green_Switch = n124
export const dark_green_SliderTrack = n124
export const dark_green_alt1_Card = n124
export const dark_green_alt1_DrawerFrame = n124
export const dark_green_alt1_Progress = n124
export const dark_green_alt1_TooltipArrow = n124
export const dark_green_alt1_Input = n124
export const dark_green_alt1_Surface = n124
export const dark_green_alt2_ListItem = n124
export const dark_green_active_TooltipContent = n124
const n125 = t([[13, 0],[14, 0],[15, 0],[16, 0],[17, 0],[18, 61],[19, 5],[20, 5],[21, 5],[22, 5],[23, 61],[24, 0],[25, 10],[26, 10],[27, 10],[28, 10]])

export const dark_green_SwitchThumb = n125
const n126 = t([[13, 0],[14, 0],[15, 0],[16, 0],[17, 23],[18, 61],[19, 47],[20, 24],[21, 47],[22, 24],[23, 61],[24, 0],[25, 23],[26, 23],[27, 23],[28, 23]])

export const dark_green_SliderTrackActive = n126
export const dark_green_alt1_SliderThumb = n126
export const dark_green_alt1_Tooltip = n126
export const dark_green_alt1_ProgressIndicator = n126
export const dark_green_active_SwitchThumb = n126
const n127 = t([[13, 0],[14, 0],[15, 0],[16, 0],[17, 0],[18, 61],[19, 5],[20, 47],[21, 5],[22, 47],[23, 61],[24, 0],[25, 5],[26, 5],[27, 5],[28, 5]])

export const dark_green_SliderThumb = n127
export const dark_green_Tooltip = n127
export const dark_green_ProgressIndicator = n127
export const dark_green_alt2_SwitchThumb = n127
const n128 = t([[13, 5],[14, 47],[15, 5],[16, 47],[17, 24],[18, 6],[19, 0],[20, 0],[21, 0],[22, 0],[23, 6],[24, 47],[25, 24],[26, 24],[27, 24],[28, 10]])

export const dark_green_TextArea = n128
const n129 = t([[13, 49],[14, 50],[15, 49],[16, 50],[17, 51],[18, 6],[19, 0],[20, 0],[21, 0],[22, 0],[23, 6],[24, 49],[25, 33],[26, 33],[27, 33],[28, 33]])

export const dark_red_ListItem = n129
const n130 = t([[13, 50],[14, 51],[15, 50],[16, 51],[17, 52],[19, 0],[20, 58],[21, 0],[22, 58],[24, 50],[25, 56],[26, 56],[27, 56],[28, 56]])

export const dark_red_Card = n130
export const dark_red_Button = n130
export const dark_red_DrawerFrame = n130
export const dark_red_Progress = n130
export const dark_red_TooltipArrow = n130
export const dark_red_Input = n130
export const dark_red_Surface = n130
export const dark_red_alt1_ListItem = n130
export const dark_red_alt2_TooltipContent = n130
const n131 = t([[13, 51],[14, 52],[15, 51],[16, 52],[17, 53],[19, 58],[20, 57],[21, 58],[22, 57],[24, 51],[25, 57],[26, 57],[27, 57],[28, 57]])

export const dark_red_Checkbox = n131
export const dark_red_Switch = n131
export const dark_red_SliderTrack = n131
export const dark_red_alt1_Card = n131
export const dark_red_alt1_Button = n131
export const dark_red_alt1_DrawerFrame = n131
export const dark_red_alt1_Progress = n131
export const dark_red_alt1_TooltipArrow = n131
export const dark_red_alt1_Input = n131
export const dark_red_alt1_Surface = n131
export const dark_red_alt2_ListItem = n131
export const dark_red_active_TooltipContent = n131
const n132 = t([[13, 0],[14, 0],[15, 0],[16, 0],[17, 0],[18, 61],[19, 49],[20, 49],[21, 49],[22, 49],[23, 61],[24, 0],[25, 33],[26, 33],[27, 33],[28, 33]])

export const dark_red_SwitchThumb = n132
const n133 = t([[13, 0],[14, 58],[15, 0],[16, 58],[17, 57],[18, 61],[19, 50],[20, 51],[21, 50],[22, 51],[23, 61],[24, 0],[25, 53],[26, 53],[27, 53],[28, 53]])

export const dark_red_SliderTrackActive = n133
export const dark_red_alt1_SliderThumb = n133
export const dark_red_alt1_Tooltip = n133
export const dark_red_alt1_ProgressIndicator = n133
export const dark_red_active_SwitchThumb = n133
const n134 = t([[13, 0],[14, 0],[15, 0],[16, 0],[17, 58],[18, 61],[19, 49],[20, 50],[21, 49],[22, 50],[23, 61],[24, 0],[25, 54],[26, 54],[27, 54],[28, 54]])

export const dark_red_SliderThumb = n134
export const dark_red_Tooltip = n134
export const dark_red_ProgressIndicator = n134
export const dark_red_alt2_SwitchThumb = n134
const n135 = t([[13, 49],[14, 50],[15, 49],[16, 50],[17, 51],[18, 6],[19, 0],[20, 0],[21, 0],[22, 0],[23, 6],[24, 50],[25, 56],[26, 56],[27, 56],[28, 33]])

export const dark_red_TextArea = n135
const n136 = t([[13, 61],[14, 61],[15, 5],[16, 5],[17, 5],[18, 61],[19, 5],[20, 0],[21, 5],[22, 0],[23, 61],[24, 5],[25, 0],[26, 0],[27, 0],[28, 0]])

export const light_ghost_SwitchThumb = n136
export const light_ghost_alt1_SwitchThumb = n136
export const light_ghost_dim_SwitchThumb = n136
export const light_ghost_dim_SliderThumb = n136
export const light_ghost_dim_Tooltip = n136
export const light_ghost_dim_ProgressIndicator = n136
const n137 = t([[13, 61],[14, 61],[15, 5],[16, 4],[17, 2],[18, 61],[19, 5],[20, 2],[21, 5],[22, 2],[23, 61],[24, 5],[25, 0],[26, 0],[27, 0],[28, 0]])

export const light_ghost_SliderTrackActive = n137
export const light_ghost_alt1_SliderThumb = n137
export const light_ghost_alt1_Tooltip = n137
export const light_ghost_alt1_ProgressIndicator = n137
export const light_ghost_active_SwitchThumb = n137
const n138 = t([[13, 61],[14, 61],[15, 5],[16, 5],[17, 4],[18, 61],[19, 5],[20, 1],[21, 5],[22, 1],[23, 61],[24, 5],[25, 0],[26, 0],[27, 0],[28, 0]])

export const light_ghost_SliderThumb = n138
export const light_ghost_Tooltip = n138
export const light_ghost_ProgressIndicator = n138
export const light_ghost_alt2_SwitchThumb = n138
export const light_ghost_dim_SliderTrackActive = n138
const n139 = t([[15, 0],[16, 0],[17, 1],[19, 0],[20, 5],[21, 0],[22, 5],[24, 1],[25, 0],[26, 0],[27, 0],[28, 0]])

export const light_ghost_TextArea = n139
const n140 = t([[13, 61],[14, 61],[15, 0],[16, 0],[17, 0],[18, 61],[19, 0],[20, 5],[21, 0],[22, 5],[23, 61],[24, 0],[25, 5],[26, 5],[27, 5],[28, 5]])

export const dark_ghost_SwitchThumb = n140
export const dark_ghost_alt1_SwitchThumb = n140
export const dark_ghost_dim_SwitchThumb = n140
export const dark_ghost_dim_SliderThumb = n140
export const dark_ghost_dim_Tooltip = n140
export const dark_ghost_dim_ProgressIndicator = n140
export const dark_green_ghost_alt1_SwitchThumb = n140
export const dark_green_ghost_dim_SliderThumb = n140
export const dark_green_ghost_dim_Tooltip = n140
export const dark_green_ghost_dim_ProgressIndicator = n140
const n141 = t([[13, 61],[14, 61],[15, 0],[16, 3],[17, 4],[18, 61],[19, 0],[20, 10],[21, 0],[22, 10],[23, 61],[24, 0],[25, 4],[26, 4],[27, 4],[28, 4]])

export const dark_ghost_SliderTrackActive = n141
export const dark_ghost_alt1_SliderThumb = n141
export const dark_ghost_alt1_Tooltip = n141
export const dark_ghost_alt1_ProgressIndicator = n141
export const dark_ghost_active_SwitchThumb = n141
const n142 = t([[13, 61],[14, 61],[15, 0],[16, 0],[17, 3],[18, 61],[19, 0],[20, 9],[21, 0],[22, 9],[23, 61],[24, 0],[25, 5],[26, 5],[27, 5],[28, 5]])

export const dark_ghost_SliderThumb = n142
export const dark_ghost_Tooltip = n142
export const dark_ghost_ProgressIndicator = n142
export const dark_ghost_alt2_SwitchThumb = n142
export const dark_ghost_dim_SliderTrackActive = n142
const n143 = t([[13, 6],[14, 6],[15, 5],[16, 9],[17, 10],[18, 6],[19, 5],[20, 0],[21, 5],[22, 0],[23, 6],[24, 9],[25, 5],[26, 5],[27, 5],[28, 5]])

export const dark_ghost_TextArea = n143
const n144 = t([[13, 61],[14, 61],[15, 5],[16, 5],[17, 5],[18, 61],[19, 22],[20, 12],[21, 5],[22, 12],[23, 61],[24, 22],[25, 21],[26, 22],[27, 22],[28, 19]])

export const light_yellow_ghost_SwitchThumb = n144
const n145 = t([[13, 61],[14, 61],[15, 5],[16, 22],[17, 21],[18, 61],[19, 19],[20, 14],[21, 5],[22, 14],[23, 61],[24, 19],[25, 18],[26, 19],[27, 19],[28, 16]])

export const light_yellow_ghost_SliderTrackActive = n145
export const light_yellow_ghost_alt1_SliderThumb = n145
export const light_yellow_ghost_alt1_Tooltip = n145
export const light_yellow_ghost_alt1_ProgressIndicator = n145
export const light_yellow_ghost_active_SwitchThumb = n145
const n146 = t([[13, 61],[14, 61],[15, 5],[16, 5],[17, 22],[18, 61],[19, 20],[20, 13],[21, 5],[22, 13],[23, 61],[24, 20],[25, 19],[26, 20],[27, 20],[28, 17]])

export const light_yellow_ghost_SliderThumb = n146
export const light_yellow_ghost_Tooltip = n146
export const light_yellow_ghost_ProgressIndicator = n146
export const light_yellow_ghost_alt2_SwitchThumb = n146
export const light_yellow_ghost_dim_SliderTrackActive = n146
const n147 = t([[15, 12],[16, 12],[17, 13],[19, 15],[20, 5],[21, 12],[22, 5],[24, 17],[25, 18],[26, 17],[27, 17],[28, 18]])

export const light_yellow_ghost_TextArea = n147
const n148 = t([[13, 61],[14, 61],[15, 5],[16, 5],[17, 5],[18, 61],[19, 5],[20, 0],[21, 5],[22, 0],[23, 61],[24, 5],[25, 25],[26, 5],[27, 5],[28, 23]])

export const light_green_ghost_SwitchThumb = n148
const n149 = t([[13, 61],[14, 61],[15, 5],[16, 5],[17, 25],[18, 61],[19, 23],[20, 24],[21, 5],[22, 24],[23, 61],[24, 23],[25, 0],[26, 23],[27, 23],[28, 23]])

export const light_green_ghost_SliderTrackActive = n149
export const light_green_ghost_alt1_SliderThumb = n149
export const light_green_ghost_alt1_Tooltip = n149
export const light_green_ghost_alt1_ProgressIndicator = n149
export const light_green_ghost_active_SwitchThumb = n149
const n150 = t([[13, 61],[14, 61],[15, 5],[16, 5],[17, 5],[18, 61],[19, 24],[20, 23],[21, 5],[22, 23],[23, 61],[24, 24],[25, 23],[26, 24],[27, 24],[28, 0]])

export const light_green_ghost_SliderThumb = n150
export const light_green_ghost_Tooltip = n150
export const light_green_ghost_ProgressIndicator = n150
export const light_green_ghost_alt2_SwitchThumb = n150
export const light_green_ghost_dim_SliderTrackActive = n150
const n151 = t([[15, 0],[16, 0],[17, 23],[19, 25],[20, 5],[21, 0],[22, 5],[24, 0],[25, 0],[26, 0],[27, 0],[28, 0]])

export const light_green_ghost_TextArea = n151
const n152 = t([[13, 61],[14, 61],[15, 5],[16, 5],[17, 5],[18, 61],[19, 36],[20, 26],[21, 5],[22, 26],[23, 61],[24, 36],[25, 35],[26, 36],[27, 36],[28, 33]])

export const light_red_ghost_SwitchThumb = n152
const n153 = t([[13, 61],[14, 61],[15, 5],[16, 36],[17, 35],[18, 61],[19, 33],[20, 28],[21, 5],[22, 28],[23, 61],[24, 33],[25, 32],[26, 33],[27, 33],[28, 30]])

export const light_red_ghost_SliderTrackActive = n153
export const light_red_ghost_alt1_SliderThumb = n153
export const light_red_ghost_alt1_Tooltip = n153
export const light_red_ghost_alt1_ProgressIndicator = n153
export const light_red_ghost_active_SwitchThumb = n153
const n154 = t([[13, 61],[14, 61],[15, 5],[16, 5],[17, 36],[18, 61],[19, 34],[20, 27],[21, 5],[22, 27],[23, 61],[24, 34],[25, 33],[26, 34],[27, 34],[28, 31]])

export const light_red_ghost_SliderThumb = n154
export const light_red_ghost_Tooltip = n154
export const light_red_ghost_ProgressIndicator = n154
export const light_red_ghost_alt2_SwitchThumb = n154
export const light_red_ghost_dim_SliderTrackActive = n154
const n155 = t([[15, 26],[16, 26],[17, 27],[19, 29],[20, 5],[21, 26],[22, 5],[24, 31],[25, 32],[26, 31],[27, 31],[28, 32]])

export const light_red_ghost_TextArea = n155
const n156 = t([[13, 61],[14, 61],[15, 0],[16, 0],[17, 0],[18, 61],[19, 0],[20, 37],[21, 0],[22, 37],[23, 61],[24, 0],[25, 19],[26, 19],[27, 19],[28, 19]])

export const dark_yellow_ghost_SwitchThumb = n156
const n157 = t([[13, 61],[14, 61],[15, 0],[16, 46],[17, 45],[18, 61],[19, 0],[20, 39],[21, 0],[22, 39],[23, 61],[24, 0],[25, 41],[26, 41],[27, 41],[28, 41]])

export const dark_yellow_ghost_SliderTrackActive = n157
export const dark_yellow_ghost_alt1_SliderThumb = n157
export const dark_yellow_ghost_alt1_Tooltip = n157
export const dark_yellow_ghost_alt1_ProgressIndicator = n157
export const dark_yellow_ghost_active_SwitchThumb = n157
const n158 = t([[13, 61],[14, 61],[15, 0],[16, 0],[17, 46],[18, 61],[19, 0],[20, 38],[21, 0],[22, 38],[23, 61],[24, 0],[25, 42],[26, 42],[27, 42],[28, 42]])

export const dark_yellow_ghost_SliderThumb = n158
export const dark_yellow_ghost_Tooltip = n158
export const dark_yellow_ghost_ProgressIndicator = n158
export const dark_yellow_ghost_alt2_SwitchThumb = n158
export const dark_yellow_ghost_dim_SliderTrackActive = n158
const n159 = t([[13, 6],[14, 6],[15, 37],[16, 38],[17, 39],[18, 6],[19, 37],[20, 0],[21, 37],[22, 0],[23, 6],[24, 38],[25, 44],[26, 44],[27, 44],[28, 19]])

export const dark_yellow_ghost_TextArea = n159
const n160 = t([[13, 61],[14, 61],[15, 23],[16, 24],[17, 10],[18, 61],[19, 5],[20, 23],[21, 23],[22, 23],[23, 61],[24, 23],[25, 24],[26, 24],[27, 24],[28, 24]])

export const dark_green_ghost_Button = n160
const n161 = t([[13, 61],[14, 61],[15, 0],[16, 0],[17, 0],[18, 61],[19, 0],[20, 5],[21, 0],[22, 5],[23, 61],[24, 0],[25, 10],[26, 10],[27, 10],[28, 10]])

export const dark_green_ghost_SwitchThumb = n161
const n162 = t([[13, 61],[14, 61],[15, 0],[16, 0],[17, 23],[18, 61],[19, 0],[20, 24],[21, 0],[22, 24],[23, 61],[24, 0],[25, 23],[26, 23],[27, 23],[28, 23]])

export const dark_green_ghost_SliderTrackActive = n162
export const dark_green_ghost_alt1_SliderThumb = n162
export const dark_green_ghost_alt1_Tooltip = n162
export const dark_green_ghost_alt1_ProgressIndicator = n162
export const dark_green_ghost_active_SwitchThumb = n162
const n163 = t([[13, 61],[14, 61],[15, 0],[16, 0],[17, 0],[18, 61],[19, 0],[20, 47],[21, 0],[22, 47],[23, 61],[24, 0],[25, 5],[26, 5],[27, 5],[28, 5]])

export const dark_green_ghost_SliderThumb = n163
export const dark_green_ghost_Tooltip = n163
export const dark_green_ghost_ProgressIndicator = n163
export const dark_green_ghost_alt2_SwitchThumb = n163
export const dark_green_ghost_dim_SliderTrackActive = n163
const n164 = t([[13, 6],[14, 6],[15, 5],[16, 47],[17, 24],[18, 6],[19, 5],[20, 0],[21, 5],[22, 0],[23, 6],[24, 47],[25, 24],[26, 24],[27, 24],[28, 10]])

export const dark_green_ghost_TextArea = n164
const n165 = t([[13, 61],[14, 61],[15, 0],[16, 0],[17, 0],[18, 61],[19, 0],[20, 49],[21, 0],[22, 49],[23, 61],[24, 0],[25, 33],[26, 33],[27, 33],[28, 33]])

export const dark_red_ghost_SwitchThumb = n165
const n166 = t([[13, 61],[14, 61],[15, 0],[16, 58],[17, 57],[18, 61],[19, 0],[20, 51],[21, 0],[22, 51],[23, 61],[24, 0],[25, 53],[26, 53],[27, 53],[28, 53]])

export const dark_red_ghost_SliderTrackActive = n166
export const dark_red_ghost_alt1_SliderThumb = n166
export const dark_red_ghost_alt1_Tooltip = n166
export const dark_red_ghost_alt1_ProgressIndicator = n166
export const dark_red_ghost_active_SwitchThumb = n166
const n167 = t([[13, 61],[14, 61],[15, 0],[16, 0],[17, 58],[18, 61],[19, 0],[20, 50],[21, 0],[22, 50],[23, 61],[24, 0],[25, 54],[26, 54],[27, 54],[28, 54]])

export const dark_red_ghost_SliderThumb = n167
export const dark_red_ghost_Tooltip = n167
export const dark_red_ghost_ProgressIndicator = n167
export const dark_red_ghost_alt2_SwitchThumb = n167
export const dark_red_ghost_dim_SliderTrackActive = n167
const n168 = t([[13, 6],[14, 6],[15, 49],[16, 50],[17, 51],[18, 6],[19, 49],[20, 0],[21, 49],[22, 0],[23, 6],[24, 50],[25, 56],[26, 56],[27, 56],[28, 33]])

export const dark_red_ghost_TextArea = n168
const n169 = t([[13, 0],[14, 1],[15, 0],[16, 1],[17, 2],[19, 5],[20, 5],[21, 5],[22, 5],[24, 0],[25, 0],[26, 0],[27, 0],[28, 0]])

export const light_alt1_ListItem = n169
export const light_alt1_TooltipContent = n169
const n170 = t([[13, 4],[14, 2],[15, 4],[16, 2],[17, 0],[19, 2],[20, 3],[21, 2],[22, 3],[24, 4],[25, 3],[26, 3],[27, 3],[28, 3]])

export const light_alt1_SliderTrackActive = n170
export const light_alt2_SliderThumb = n170
export const light_alt2_Tooltip = n170
export const light_alt2_ProgressIndicator = n170
const n171 = t([[13, 0],[14, 1],[15, 0],[16, 1],[17, 2],[19, 5],[20, 5],[21, 5],[22, 5],[24, 2],[25, 2],[26, 2],[27, 2],[28, 0]])

export const light_alt1_TextArea = n171
const n172 = t([[13, 0],[14, 0],[15, 0],[16, 0],[17, 0],[19, 0],[20, 0],[21, 0],[22, 0],[24, 0],[25, 5],[26, 5],[27, 5],[28, 5]])

export const light_alt1_Separator = n172
export const light_alt2_Checkbox = n172
export const light_alt2_Switch = n172
export const light_alt2_SliderTrack = n172
export const light_alt2_Separator = n172
export const light_active_Card = n172
export const light_active_Button = n172
export const light_active_Checkbox = n172
export const light_active_Switch = n172
export const light_active_DrawerFrame = n172
export const light_active_Progress = n172
export const light_active_TooltipArrow = n172
export const light_active_SliderTrack = n172
export const light_active_Input = n172
export const light_active_Separator = n172
export const light_active_Surface = n172
const n173 = t([[13, 2],[14, 0],[15, 2],[16, 0],[17, 0],[19, 3],[20, 0],[21, 3],[22, 0],[24, 2],[25, 2],[26, 2],[27, 2],[28, 2]])

export const light_alt2_SliderTrackActive = n173
export const light_active_SliderThumb = n173
export const light_active_Tooltip = n173
export const light_active_ProgressIndicator = n173
const n174 = t([[13, 1],[14, 2],[15, 1],[16, 2],[17, 3],[19, 5],[20, 4],[21, 5],[22, 4],[24, 3],[25, 4],[26, 4],[27, 4],[28, 0]])

export const light_alt2_TextArea = n174
const n175 = t([[13, 0],[14, 0],[15, 0],[16, 0],[17, 0],[19, 0],[20, 0],[21, 0],[22, 0],[24, 0],[25, 1],[26, 1],[27, 1],[28, 1]])

export const light_active_SliderTrackActive = n175
const n176 = t([[13, 2],[14, 3],[15, 2],[16, 3],[17, 0],[19, 4],[20, 2],[21, 4],[22, 2],[24, 0],[25, 5],[26, 5],[27, 5],[28, 2]])

export const light_active_TextArea = n176
const n177 = t([[13, 0],[14, 0],[15, 0],[16, 0],[17, 0],[19, 5],[20, 5],[21, 5],[22, 5],[24, 0],[25, 0],[26, 0],[27, 0],[28, 0]])

export const light_dim_ListItem = n177
export const light_dim_TooltipContent = n177
const n178 = t([[13, 1],[14, 1],[15, 1],[16, 1],[17, 2],[19, 5],[20, 5],[21, 5],[22, 5],[24, 1],[25, 0],[26, 0],[27, 0],[28, 0]])

export const light_dim_Card = n178
export const light_dim_Button = n178
export const light_dim_DrawerFrame = n178
export const light_dim_Progress = n178
export const light_dim_TooltipArrow = n178
export const light_dim_Input = n178
export const light_dim_Surface = n178
const n179 = t([[13, 2],[14, 2],[15, 2],[16, 2],[17, 3],[19, 4],[20, 4],[21, 4],[22, 4],[24, 2],[25, 0],[26, 0],[27, 0],[28, 0]])

export const light_dim_Checkbox = n179
export const light_dim_Switch = n179
export const light_dim_SliderTrack = n179
const n180 = t([[13, 5],[14, 5],[15, 5],[16, 5],[17, 4],[19, 1],[20, 1],[21, 1],[22, 1],[24, 5],[25, 0],[26, 0],[27, 0],[28, 0]])

export const light_dim_SliderTrackActive = n180
const n181 = t([[13, 0],[14, 0],[15, 0],[16, 0],[17, 0],[19, 5],[20, 5],[21, 5],[22, 5],[24, 1],[25, 0],[26, 0],[27, 0],[28, 0]])

export const light_dim_TextArea = n181
const n182 = t([[13, 3],[14, 3],[15, 3],[16, 3],[17, 0],[19, 2],[20, 2],[21, 2],[22, 2],[24, 3],[25, 2],[26, 2],[27, 2],[28, 2]])

export const light_dim_Separator = n182
const n183 = t([[13, 5],[14, 9],[15, 5],[16, 9],[17, 10],[19, 0],[20, 0],[21, 0],[22, 0],[24, 5],[25, 5],[26, 5],[27, 5],[28, 5]])

export const dark_alt1_TooltipContent = n183
const n184 = t([[13, 3],[14, 4],[15, 3],[16, 4],[17, 5],[19, 10],[20, 11],[21, 10],[22, 11],[24, 3],[25, 11],[26, 11],[27, 11],[28, 11]])

export const dark_alt1_SliderTrackActive = n184
export const dark_alt2_SliderThumb = n184
export const dark_alt2_Tooltip = n184
export const dark_alt2_ProgressIndicator = n184
const n185 = t([[13, 9],[14, 10],[15, 9],[16, 10],[17, 11],[19, 0],[20, 3],[21, 0],[22, 3],[24, 10],[25, 4],[26, 4],[27, 4],[28, 5]])

export const dark_alt1_TextArea = n185
const n186 = t([[13, 4],[14, 5],[15, 4],[16, 5],[17, 5],[19, 5],[20, 5],[21, 5],[22, 5],[24, 4],[25, 0],[26, 0],[27, 0],[28, 0]])

export const dark_alt1_Separator = n186
export const dark_alt2_Checkbox = n186
export const dark_alt2_Switch = n186
export const dark_alt2_SliderTrack = n186
export const dark_active_Card = n186
export const dark_active_Button = n186
export const dark_active_DrawerFrame = n186
export const dark_active_Progress = n186
export const dark_active_TooltipArrow = n186
export const dark_active_Input = n186
export const dark_active_Surface = n186
const n187 = t([[13, 4],[14, 5],[15, 4],[16, 5],[17, 5],[19, 11],[20, 4],[21, 11],[22, 4],[24, 4],[25, 10],[26, 10],[27, 10],[28, 10]])

export const dark_alt2_SliderTrackActive = n187
export const dark_active_SliderThumb = n187
export const dark_active_Tooltip = n187
export const dark_active_ProgressIndicator = n187
const n188 = t([[13, 10],[14, 11],[15, 10],[16, 11],[17, 4],[19, 3],[20, 4],[21, 3],[22, 4],[24, 11],[25, 3],[26, 3],[27, 3],[28, 4]])

export const dark_alt2_TextArea = n188
const n189 = t([[13, 5],[14, 5],[15, 5],[16, 5],[17, 5],[19, 5],[20, 5],[21, 5],[22, 5],[24, 5],[25, 0],[26, 0],[27, 0],[28, 0]])

export const dark_alt2_Separator = n189
export const dark_active_Checkbox = n189
export const dark_active_Switch = n189
export const dark_active_SliderTrack = n189
export const dark_active_Separator = n189
const n190 = t([[13, 5],[14, 5],[15, 5],[16, 5],[17, 5],[19, 4],[20, 5],[21, 4],[22, 5],[24, 5],[25, 9],[26, 9],[27, 9],[28, 9]])

export const dark_active_SliderTrackActive = n190
const n191 = t([[13, 11],[14, 4],[15, 11],[16, 4],[17, 5],[19, 4],[20, 5],[21, 4],[22, 5],[24, 4],[25, 0],[26, 0],[27, 0],[28, 3]])

export const dark_active_TextArea = n191
const n192 = t([[13, 9],[14, 9],[15, 9],[16, 9],[17, 10],[19, 0],[20, 0],[21, 0],[22, 0],[24, 9],[25, 5],[26, 5],[27, 5],[28, 5]])

export const dark_dim_Card = n192
export const dark_dim_Button = n192
export const dark_dim_DrawerFrame = n192
export const dark_dim_Progress = n192
export const dark_dim_TooltipArrow = n192
export const dark_dim_Input = n192
export const dark_dim_Surface = n192
const n193 = t([[13, 10],[14, 10],[15, 10],[16, 10],[17, 11],[19, 3],[20, 3],[21, 3],[22, 3],[24, 10],[25, 5],[26, 5],[27, 5],[28, 5]])

export const dark_dim_Checkbox = n193
export const dark_dim_Switch = n193
export const dark_dim_SliderTrack = n193
const n194 = t([[13, 5],[14, 5],[15, 5],[16, 5],[17, 5],[19, 0],[20, 0],[21, 0],[22, 0],[24, 5],[25, 5],[26, 5],[27, 5],[28, 5]])

export const dark_dim_TooltipContent = n194
export const dark_green_dim_TooltipContent = n194
const n195 = t([[13, 0],[14, 0],[15, 0],[16, 0],[17, 3],[19, 9],[20, 9],[21, 9],[22, 9],[24, 0],[25, 5],[26, 5],[27, 5],[28, 5]])

export const dark_dim_SliderTrackActive = n195
const n196 = t([[13, 5],[14, 5],[15, 5],[16, 5],[17, 9],[19, 0],[20, 0],[21, 0],[22, 0],[24, 9],[25, 5],[26, 5],[27, 5],[28, 5]])

export const dark_dim_TextArea = n196
const n197 = t([[13, 11],[14, 11],[15, 11],[16, 11],[17, 4],[19, 4],[20, 4],[21, 4],[22, 4],[24, 11],[25, 4],[26, 4],[27, 4],[28, 4]])

export const dark_dim_Separator = n197
const n198 = t([[13, 12],[14, 13],[15, 12],[16, 13],[17, 14],[19, 5],[20, 5],[21, 5],[22, 5],[24, 16],[25, 17],[26, 16],[27, 16],[28, 19]])

export const light_yellow_alt1_ListItem = n198
export const light_yellow_alt1_TooltipContent = n198
const n199 = t([[13, 5],[14, 5],[15, 5],[16, 5],[17, 5],[19, 12],[20, 12],[21, 12],[22, 12],[24, 21],[25, 20],[26, 21],[27, 21],[28, 18]])

export const light_yellow_alt1_SwitchThumb = n199
export const light_yellow_dim_SliderThumb = n199
export const light_yellow_dim_Tooltip = n199
export const light_yellow_dim_ProgressIndicator = n199
const n200 = t([[13, 22],[14, 21],[15, 22],[16, 21],[17, 20],[19, 14],[20, 15],[21, 14],[22, 15],[24, 18],[25, 17],[26, 18],[27, 18],[28, 15]])

export const light_yellow_alt1_SliderTrackActive = n200
export const light_yellow_alt2_SliderThumb = n200
export const light_yellow_alt2_Tooltip = n200
export const light_yellow_alt2_ProgressIndicator = n200
const n201 = t([[13, 12],[14, 13],[15, 12],[16, 13],[17, 14],[19, 5],[20, 5],[21, 5],[22, 5],[24, 18],[25, 19],[26, 18],[27, 18],[28, 19]])

export const light_yellow_alt1_TextArea = n201
const n202 = t([[13, 16],[14, 17],[15, 16],[16, 17],[17, 18],[19, 20],[20, 19],[21, 20],[22, 19],[24, 20],[25, 21],[26, 20],[27, 20],[28, 5]])

export const light_yellow_alt1_Separator = n202
export const light_yellow_alt2_Checkbox = n202
export const light_yellow_alt2_Switch = n202
export const light_yellow_alt2_SliderTrack = n202
export const light_yellow_active_Card = n202
export const light_yellow_active_Button = n202
export const light_yellow_active_DrawerFrame = n202
export const light_yellow_active_Progress = n202
export const light_yellow_active_TooltipArrow = n202
export const light_yellow_active_Input = n202
export const light_yellow_active_Surface = n202
const n203 = t([[13, 21],[14, 20],[15, 21],[16, 20],[17, 19],[19, 15],[20, 16],[21, 15],[22, 16],[24, 17],[25, 16],[26, 17],[27, 17],[28, 14]])

export const light_yellow_alt2_SliderTrackActive = n203
export const light_yellow_active_SliderThumb = n203
export const light_yellow_active_Tooltip = n203
export const light_yellow_active_ProgressIndicator = n203
const n204 = t([[13, 13],[14, 14],[15, 13],[16, 14],[17, 15],[19, 5],[20, 22],[21, 5],[22, 22],[24, 19],[25, 20],[26, 19],[27, 19],[28, 20]])

export const light_yellow_alt2_TextArea = n204
const n205 = t([[13, 17],[14, 18],[15, 17],[16, 18],[17, 19],[19, 19],[20, 18],[21, 19],[22, 18],[24, 21],[25, 22],[26, 21],[27, 21],[28, 5]])

export const light_yellow_alt2_Separator = n205
export const light_yellow_active_Checkbox = n205
export const light_yellow_active_Switch = n205
export const light_yellow_active_SliderTrack = n205
const n206 = t([[13, 20],[14, 19],[15, 20],[16, 19],[17, 18],[19, 16],[20, 17],[21, 16],[22, 17],[24, 16],[25, 15],[26, 16],[27, 16],[28, 13]])

export const light_yellow_active_SliderTrackActive = n206
const n207 = t([[13, 14],[14, 15],[15, 14],[16, 15],[17, 16],[19, 22],[20, 21],[21, 22],[22, 21],[24, 20],[25, 21],[26, 20],[27, 20],[28, 21]])

export const light_yellow_active_TextArea = n207
const n208 = t([[13, 18],[14, 19],[15, 18],[16, 19],[17, 20],[19, 18],[20, 17],[21, 18],[22, 17],[24, 22],[25, 5],[26, 22],[27, 22],[28, 5]])

export const light_yellow_active_Separator = n208
const n209 = t([[13, 12],[14, 12],[15, 12],[16, 12],[17, 12],[19, 5],[20, 5],[21, 5],[22, 5],[24, 14],[25, 15],[26, 14],[27, 14],[28, 17]])

export const light_yellow_dim_ListItem = n209
export const light_yellow_dim_TooltipContent = n209
const n210 = t([[13, 13],[14, 13],[15, 13],[16, 13],[17, 14],[19, 5],[20, 5],[21, 5],[22, 5],[24, 16],[25, 17],[26, 16],[27, 16],[28, 19]])

export const light_yellow_dim_Card = n210
export const light_yellow_dim_Button = n210
export const light_yellow_dim_DrawerFrame = n210
export const light_yellow_dim_Progress = n210
export const light_yellow_dim_TooltipArrow = n210
export const light_yellow_dim_Input = n210
export const light_yellow_dim_Surface = n210
const n211 = t([[13, 14],[14, 14],[15, 14],[16, 14],[17, 15],[19, 22],[20, 22],[21, 22],[22, 22],[24, 17],[25, 18],[26, 17],[27, 17],[28, 20]])

export const light_yellow_dim_Checkbox = n211
export const light_yellow_dim_Switch = n211
export const light_yellow_dim_SliderTrack = n211
const n212 = t([[13, 5],[14, 5],[15, 5],[16, 5],[17, 5],[19, 12],[20, 12],[21, 12],[22, 12],[24, 5],[25, 22],[26, 5],[27, 5],[28, 20]])

export const light_yellow_dim_SwitchThumb = n212
const n213 = t([[13, 5],[14, 5],[15, 5],[16, 5],[17, 22],[19, 13],[20, 13],[21, 13],[22, 13],[24, 20],[25, 19],[26, 20],[27, 20],[28, 17]])

export const light_yellow_dim_SliderTrackActive = n213
const n214 = t([[13, 12],[14, 12],[15, 12],[16, 12],[17, 12],[19, 5],[20, 5],[21, 5],[22, 5],[24, 16],[25, 17],[26, 16],[27, 16],[28, 17]])

export const light_yellow_dim_TextArea = n214
const n215 = t([[13, 15],[14, 15],[15, 15],[16, 15],[17, 16],[19, 21],[20, 21],[21, 21],[22, 21],[24, 18],[25, 19],[26, 18],[27, 18],[28, 21]])

export const light_yellow_dim_Separator = n215
const n216 = t([[13, 0],[14, 23],[15, 0],[16, 23],[17, 24],[19, 5],[20, 5],[21, 5],[22, 5],[24, 23],[25, 0],[26, 23],[27, 23],[28, 23]])

export const light_green_alt1_ListItem = n216
export const light_green_alt1_TooltipContent = n216
const n217 = t([[13, 5],[14, 5],[15, 5],[16, 5],[17, 5],[19, 0],[20, 0],[21, 0],[22, 0],[24, 25],[25, 24],[26, 25],[27, 25],[28, 0]])

export const light_green_alt1_SwitchThumb = n217
export const light_green_dim_SliderThumb = n217
export const light_green_dim_Tooltip = n217
export const light_green_dim_ProgressIndicator = n217
const n218 = t([[13, 5],[14, 25],[15, 5],[16, 25],[17, 24],[19, 24],[20, 25],[21, 24],[22, 25],[24, 0],[25, 0],[26, 0],[27, 0],[28, 25]])

export const light_green_alt1_SliderTrackActive = n218
export const light_green_alt2_SliderThumb = n218
export const light_green_alt2_Tooltip = n218
export const light_green_alt2_ProgressIndicator = n218
const n219 = t([[13, 0],[14, 23],[15, 0],[16, 23],[17, 24],[19, 5],[20, 5],[21, 5],[22, 5],[24, 0],[25, 23],[26, 0],[27, 0],[28, 23]])

export const light_green_alt1_TextArea = n219
const n220 = t([[13, 23],[14, 0],[15, 23],[16, 0],[17, 0],[19, 24],[20, 23],[21, 24],[22, 23],[24, 24],[25, 25],[26, 24],[27, 24],[28, 5]])

export const light_green_alt1_Separator = n220
export const light_green_alt2_Checkbox = n220
export const light_green_alt2_Switch = n220
export const light_green_alt2_SliderTrack = n220
export const light_green_active_Card = n220
export const light_green_active_Button = n220
export const light_green_active_DrawerFrame = n220
export const light_green_active_Progress = n220
export const light_green_active_TooltipArrow = n220
export const light_green_active_Input = n220
export const light_green_active_Surface = n220
const n221 = t([[13, 25],[14, 24],[15, 25],[16, 24],[17, 23],[19, 25],[20, 23],[21, 25],[22, 23],[24, 0],[25, 23],[26, 0],[27, 0],[28, 24]])

export const light_green_alt2_SliderTrackActive = n221
export const light_green_active_SliderThumb = n221
export const light_green_active_Tooltip = n221
export const light_green_active_ProgressIndicator = n221
const n222 = t([[13, 23],[14, 24],[15, 23],[16, 24],[17, 25],[19, 5],[20, 5],[21, 5],[22, 5],[24, 23],[25, 24],[26, 23],[27, 23],[28, 24]])

export const light_green_alt2_TextArea = n222
const n223 = t([[13, 0],[14, 0],[15, 0],[16, 0],[17, 23],[19, 23],[20, 0],[21, 23],[22, 0],[24, 25],[25, 5],[26, 25],[27, 25],[28, 5]])

export const light_green_alt2_Separator = n223
export const light_green_active_Checkbox = n223
export const light_green_active_Switch = n223
export const light_green_active_SliderTrack = n223
const n224 = t([[13, 24],[14, 23],[15, 24],[16, 23],[17, 0],[19, 23],[20, 0],[21, 23],[22, 0],[24, 23],[25, 25],[26, 23],[27, 23],[28, 23]])

export const light_green_active_SliderTrackActive = n224
const n225 = t([[13, 24],[14, 25],[15, 24],[16, 25],[17, 23],[19, 5],[20, 25],[21, 5],[22, 25],[24, 24],[25, 25],[26, 24],[27, 24],[28, 25]])

export const light_green_active_TextArea = n225
const n226 = t([[13, 0],[14, 23],[15, 0],[16, 23],[17, 24],[19, 0],[20, 0],[21, 0],[22, 0],[24, 5],[25, 5],[26, 5],[27, 5],[28, 5]])

export const light_green_active_Separator = n226
const n227 = t([[13, 0],[14, 0],[15, 0],[16, 0],[17, 0],[19, 5],[20, 5],[21, 5],[22, 5],[24, 24],[25, 25],[26, 24],[27, 24],[28, 0]])

export const light_green_dim_ListItem = n227
export const light_green_dim_TooltipContent = n227
const n228 = t([[13, 23],[14, 23],[15, 23],[16, 23],[17, 24],[19, 5],[20, 5],[21, 5],[22, 5],[24, 23],[25, 0],[26, 23],[27, 23],[28, 23]])

export const light_green_dim_Card = n228
export const light_green_dim_Button = n228
export const light_green_dim_DrawerFrame = n228
export const light_green_dim_Progress = n228
export const light_green_dim_TooltipArrow = n228
export const light_green_dim_Input = n228
export const light_green_dim_Surface = n228
const n229 = t([[13, 24],[14, 24],[15, 24],[16, 24],[17, 25],[19, 5],[20, 5],[21, 5],[22, 5],[24, 0],[25, 0],[26, 0],[27, 0],[28, 24]])

export const light_green_dim_Checkbox = n229
export const light_green_dim_Switch = n229
export const light_green_dim_SliderTrack = n229
const n230 = t([[13, 5],[14, 5],[15, 5],[16, 5],[17, 5],[19, 0],[20, 0],[21, 0],[22, 0],[24, 5],[25, 5],[26, 5],[27, 5],[28, 24]])

export const light_green_dim_SwitchThumb = n230
const n231 = t([[13, 5],[14, 5],[15, 5],[16, 5],[17, 5],[19, 23],[20, 23],[21, 23],[22, 23],[24, 24],[25, 23],[26, 24],[27, 24],[28, 0]])

export const light_green_dim_SliderTrackActive = n231
const n232 = t([[13, 0],[14, 0],[15, 0],[16, 0],[17, 0],[19, 5],[20, 5],[21, 5],[22, 5],[24, 23],[25, 0],[26, 23],[27, 23],[28, 0]])

export const light_green_dim_TextArea = n232
const n233 = t([[13, 25],[14, 25],[15, 25],[16, 25],[17, 23],[19, 25],[20, 25],[21, 25],[22, 25],[24, 0],[25, 23],[26, 0],[27, 0],[28, 25]])

export const light_green_dim_Separator = n233
const n234 = t([[13, 26],[14, 27],[15, 26],[16, 27],[17, 28],[19, 5],[20, 5],[21, 5],[22, 5],[24, 30],[25, 31],[26, 30],[27, 30],[28, 33]])

export const light_red_alt1_ListItem = n234
export const light_red_alt1_TooltipContent = n234
const n235 = t([[13, 5],[14, 5],[15, 5],[16, 5],[17, 5],[19, 26],[20, 26],[21, 26],[22, 26],[24, 35],[25, 34],[26, 35],[27, 35],[28, 32]])

export const light_red_alt1_SwitchThumb = n235
export const light_red_dim_SliderThumb = n235
export const light_red_dim_Tooltip = n235
export const light_red_dim_ProgressIndicator = n235
const n236 = t([[13, 36],[14, 35],[15, 36],[16, 35],[17, 34],[19, 28],[20, 29],[21, 28],[22, 29],[24, 32],[25, 31],[26, 32],[27, 32],[28, 29]])

export const light_red_alt1_SliderTrackActive = n236
export const light_red_alt2_SliderThumb = n236
export const light_red_alt2_Tooltip = n236
export const light_red_alt2_ProgressIndicator = n236
const n237 = t([[13, 26],[14, 27],[15, 26],[16, 27],[17, 28],[19, 5],[20, 5],[21, 5],[22, 5],[24, 32],[25, 33],[26, 32],[27, 32],[28, 33]])

export const light_red_alt1_TextArea = n237
const n238 = t([[13, 30],[14, 31],[15, 30],[16, 31],[17, 32],[19, 34],[20, 33],[21, 34],[22, 33],[24, 34],[25, 35],[26, 34],[27, 34],[28, 5]])

export const light_red_alt1_Separator = n238
export const light_red_alt2_Checkbox = n238
export const light_red_alt2_Switch = n238
export const light_red_alt2_SliderTrack = n238
export const light_red_active_Card = n238
export const light_red_active_Button = n238
export const light_red_active_DrawerFrame = n238
export const light_red_active_Progress = n238
export const light_red_active_TooltipArrow = n238
export const light_red_active_Input = n238
export const light_red_active_Surface = n238
const n239 = t([[13, 35],[14, 34],[15, 35],[16, 34],[17, 33],[19, 29],[20, 30],[21, 29],[22, 30],[24, 31],[25, 30],[26, 31],[27, 31],[28, 28]])

export const light_red_alt2_SliderTrackActive = n239
export const light_red_active_SliderThumb = n239
export const light_red_active_Tooltip = n239
export const light_red_active_ProgressIndicator = n239
const n240 = t([[13, 27],[14, 28],[15, 27],[16, 28],[17, 29],[19, 5],[20, 36],[21, 5],[22, 36],[24, 33],[25, 34],[26, 33],[27, 33],[28, 34]])

export const light_red_alt2_TextArea = n240
const n241 = t([[13, 31],[14, 32],[15, 31],[16, 32],[17, 33],[19, 33],[20, 32],[21, 33],[22, 32],[24, 35],[25, 36],[26, 35],[27, 35],[28, 5]])

export const light_red_alt2_Separator = n241
export const light_red_active_Checkbox = n241
export const light_red_active_Switch = n241
export const light_red_active_SliderTrack = n241
const n242 = t([[13, 34],[14, 33],[15, 34],[16, 33],[17, 32],[19, 30],[20, 31],[21, 30],[22, 31],[24, 30],[25, 29],[26, 30],[27, 30],[28, 27]])

export const light_red_active_SliderTrackActive = n242
const n243 = t([[13, 28],[14, 29],[15, 28],[16, 29],[17, 30],[19, 36],[20, 35],[21, 36],[22, 35],[24, 34],[25, 35],[26, 34],[27, 34],[28, 35]])

export const light_red_active_TextArea = n243
const n244 = t([[13, 32],[14, 33],[15, 32],[16, 33],[17, 34],[19, 32],[20, 31],[21, 32],[22, 31],[24, 36],[25, 5],[26, 36],[27, 36],[28, 5]])

export const light_red_active_Separator = n244
const n245 = t([[13, 26],[14, 26],[15, 26],[16, 26],[17, 26],[19, 5],[20, 5],[21, 5],[22, 5],[24, 28],[25, 29],[26, 28],[27, 28],[28, 31]])

export const light_red_dim_ListItem = n245
export const light_red_dim_TooltipContent = n245
const n246 = t([[13, 27],[14, 27],[15, 27],[16, 27],[17, 28],[19, 5],[20, 5],[21, 5],[22, 5],[24, 30],[25, 31],[26, 30],[27, 30],[28, 33]])

export const light_red_dim_Card = n246
export const light_red_dim_Button = n246
export const light_red_dim_DrawerFrame = n246
export const light_red_dim_Progress = n246
export const light_red_dim_TooltipArrow = n246
export const light_red_dim_Input = n246
export const light_red_dim_Surface = n246
const n247 = t([[13, 28],[14, 28],[15, 28],[16, 28],[17, 29],[19, 36],[20, 36],[21, 36],[22, 36],[24, 31],[25, 32],[26, 31],[27, 31],[28, 34]])

export const light_red_dim_Checkbox = n247
export const light_red_dim_Switch = n247
export const light_red_dim_SliderTrack = n247
const n248 = t([[13, 5],[14, 5],[15, 5],[16, 5],[17, 5],[19, 26],[20, 26],[21, 26],[22, 26],[24, 5],[25, 36],[26, 5],[27, 5],[28, 34]])

export const light_red_dim_SwitchThumb = n248
const n249 = t([[13, 5],[14, 5],[15, 5],[16, 5],[17, 36],[19, 27],[20, 27],[21, 27],[22, 27],[24, 34],[25, 33],[26, 34],[27, 34],[28, 31]])

export const light_red_dim_SliderTrackActive = n249
const n250 = t([[13, 26],[14, 26],[15, 26],[16, 26],[17, 26],[19, 5],[20, 5],[21, 5],[22, 5],[24, 30],[25, 31],[26, 30],[27, 30],[28, 31]])

export const light_red_dim_TextArea = n250
const n251 = t([[13, 29],[14, 29],[15, 29],[16, 29],[17, 30],[19, 35],[20, 35],[21, 35],[22, 35],[24, 32],[25, 33],[26, 32],[27, 32],[28, 35]])

export const light_red_dim_Separator = n251
const n252 = t([[13, 0],[14, 0],[15, 0],[16, 0],[17, 0],[19, 37],[20, 37],[21, 37],[22, 37],[24, 0],[25, 43],[26, 43],[27, 43],[28, 43]])

export const dark_yellow_alt1_SwitchThumb = n252
export const dark_yellow_dim_SliderThumb = n252
export const dark_yellow_dim_Tooltip = n252
export const dark_yellow_dim_ProgressIndicator = n252
const n253 = t([[13, 37],[14, 38],[15, 37],[16, 38],[17, 39],[19, 0],[20, 0],[21, 0],[22, 0],[24, 37],[25, 19],[26, 19],[27, 19],[28, 19]])

export const dark_yellow_alt1_TooltipContent = n253
const n254 = t([[13, 46],[14, 45],[15, 46],[16, 45],[17, 44],[19, 39],[20, 40],[21, 39],[22, 40],[24, 46],[25, 40],[26, 40],[27, 40],[28, 40]])

export const dark_yellow_alt1_SliderTrackActive = n254
export const dark_yellow_alt2_SliderThumb = n254
export const dark_yellow_alt2_Tooltip = n254
export const dark_yellow_alt2_ProgressIndicator = n254
const n255 = t([[13, 38],[14, 39],[15, 38],[16, 39],[17, 40],[19, 0],[20, 46],[21, 0],[22, 46],[24, 39],[25, 45],[26, 45],[27, 45],[28, 44]])

export const dark_yellow_alt1_TextArea = n255
const n256 = t([[13, 41],[14, 42],[15, 41],[16, 42],[17, 43],[19, 44],[20, 19],[21, 44],[22, 19],[24, 41],[25, 0],[26, 0],[27, 0],[28, 0]])

export const dark_yellow_alt1_Separator = n256
export const dark_yellow_alt2_Checkbox = n256
export const dark_yellow_alt2_Switch = n256
export const dark_yellow_alt2_SliderTrack = n256
export const dark_yellow_active_Card = n256
export const dark_yellow_active_Button = n256
export const dark_yellow_active_DrawerFrame = n256
export const dark_yellow_active_Progress = n256
export const dark_yellow_active_TooltipArrow = n256
export const dark_yellow_active_Input = n256
export const dark_yellow_active_Surface = n256
const n257 = t([[13, 45],[14, 44],[15, 45],[16, 44],[17, 19],[19, 40],[20, 41],[21, 40],[22, 41],[24, 45],[25, 39],[26, 39],[27, 39],[28, 39]])

export const dark_yellow_alt2_SliderTrackActive = n257
export const dark_yellow_active_SliderThumb = n257
export const dark_yellow_active_Tooltip = n257
export const dark_yellow_active_ProgressIndicator = n257
const n258 = t([[13, 39],[14, 40],[15, 39],[16, 40],[17, 41],[19, 46],[20, 45],[21, 46],[22, 45],[24, 40],[25, 46],[26, 46],[27, 46],[28, 45]])

export const dark_yellow_alt2_TextArea = n258
const n259 = t([[13, 42],[14, 43],[15, 42],[16, 43],[17, 19],[19, 19],[20, 43],[21, 19],[22, 43],[24, 42],[25, 0],[26, 0],[27, 0],[28, 0]])

export const dark_yellow_alt2_Separator = n259
export const dark_yellow_active_Checkbox = n259
export const dark_yellow_active_Switch = n259
export const dark_yellow_active_SliderTrack = n259
const n260 = t([[13, 44],[14, 19],[15, 44],[16, 19],[17, 43],[19, 41],[20, 42],[21, 41],[22, 42],[24, 44],[25, 38],[26, 38],[27, 38],[28, 38]])

export const dark_yellow_active_SliderTrackActive = n260
const n261 = t([[13, 40],[14, 41],[15, 40],[16, 41],[17, 42],[19, 45],[20, 44],[21, 45],[22, 44],[24, 41],[25, 0],[26, 0],[27, 0],[28, 46]])

export const dark_yellow_active_TextArea = n261
const n262 = t([[13, 43],[14, 19],[15, 43],[16, 19],[17, 44],[19, 43],[20, 42],[21, 43],[22, 42],[24, 43],[25, 0],[26, 0],[27, 0],[28, 0]])

export const dark_yellow_active_Separator = n262
const n263 = t([[13, 38],[14, 38],[15, 38],[16, 38],[17, 39],[19, 0],[20, 0],[21, 0],[22, 0],[24, 38],[25, 19],[26, 19],[27, 19],[28, 19]])

export const dark_yellow_dim_Card = n263
export const dark_yellow_dim_Button = n263
export const dark_yellow_dim_DrawerFrame = n263
export const dark_yellow_dim_Progress = n263
export const dark_yellow_dim_TooltipArrow = n263
export const dark_yellow_dim_Input = n263
export const dark_yellow_dim_Surface = n263
const n264 = t([[13, 39],[14, 39],[15, 39],[16, 39],[17, 40],[19, 46],[20, 46],[21, 46],[22, 46],[24, 39],[25, 44],[26, 44],[27, 44],[28, 44]])

export const dark_yellow_dim_Checkbox = n264
export const dark_yellow_dim_Switch = n264
export const dark_yellow_dim_SliderTrack = n264
const n265 = t([[13, 0],[14, 0],[15, 0],[16, 0],[17, 0],[19, 37],[20, 37],[21, 37],[22, 37],[24, 0],[25, 44],[26, 44],[27, 44],[28, 44]])

export const dark_yellow_dim_SwitchThumb = n265
const n266 = t([[13, 37],[14, 37],[15, 37],[16, 37],[17, 37],[19, 0],[20, 0],[21, 0],[22, 0],[24, 37],[25, 42],[26, 42],[27, 42],[28, 42]])

export const dark_yellow_dim_TooltipContent = n266
const n267 = t([[13, 0],[14, 0],[15, 0],[16, 0],[17, 46],[19, 38],[20, 38],[21, 38],[22, 38],[24, 0],[25, 42],[26, 42],[27, 42],[28, 42]])

export const dark_yellow_dim_SliderTrackActive = n267
const n268 = t([[13, 37],[14, 37],[15, 37],[16, 37],[17, 38],[19, 0],[20, 0],[21, 0],[22, 0],[24, 38],[25, 19],[26, 19],[27, 19],[28, 43]])

export const dark_yellow_dim_TextArea = n268
const n269 = t([[13, 40],[14, 40],[15, 40],[16, 40],[17, 41],[19, 45],[20, 45],[21, 45],[22, 45],[24, 40],[25, 45],[26, 45],[27, 45],[28, 45]])

export const dark_yellow_dim_Separator = n269
const n270 = t([[13, 24],[14, 10],[15, 24],[16, 10],[17, 5],[19, 47],[20, 5],[21, 23],[22, 5],[24, 24],[25, 47],[26, 47],[27, 47],[28, 47]])

export const dark_green_alt1_Button = n270
const n271 = t([[13, 5],[14, 47],[15, 5],[16, 47],[17, 24],[19, 0],[20, 0],[21, 0],[22, 0],[24, 5],[25, 10],[26, 10],[27, 10],[28, 10]])

export const dark_green_alt1_TooltipContent = n271
const n272 = t([[13, 0],[14, 23],[15, 0],[16, 23],[17, 24],[19, 24],[20, 48],[21, 24],[22, 48],[24, 0],[25, 48],[26, 48],[27, 48],[28, 48]])

export const dark_green_alt1_SliderTrackActive = n272
export const dark_green_alt2_SliderThumb = n272
export const dark_green_alt2_Tooltip = n272
export const dark_green_alt2_ProgressIndicator = n272
const n273 = t([[13, 47],[14, 24],[15, 47],[16, 24],[17, 48],[19, 0],[20, 0],[21, 0],[22, 0],[24, 24],[25, 23],[26, 23],[27, 23],[28, 24]])

export const dark_green_alt1_TextArea = n273
const n274 = t([[13, 23],[14, 5],[15, 23],[16, 5],[17, 5],[19, 24],[20, 10],[21, 24],[22, 10],[24, 23],[25, 0],[26, 0],[27, 0],[28, 0]])

export const dark_green_alt1_Separator = n274
export const dark_green_alt2_Checkbox = n274
export const dark_green_alt2_Switch = n274
export const dark_green_alt2_SliderTrack = n274
export const dark_green_active_Card = n274
export const dark_green_active_DrawerFrame = n274
export const dark_green_active_Progress = n274
export const dark_green_active_TooltipArrow = n274
export const dark_green_active_Input = n274
export const dark_green_active_Surface = n274
const n275 = t([[13, 10],[14, 5],[15, 10],[16, 5],[17, 5],[19, 24],[20, 5],[21, 5],[22, 5],[24, 10],[25, 5],[26, 5],[27, 5],[28, 5]])

export const dark_green_alt2_Button = n275
const n276 = t([[13, 23],[14, 24],[15, 23],[16, 24],[17, 10],[19, 48],[20, 23],[21, 48],[22, 23],[24, 23],[25, 24],[26, 24],[27, 24],[28, 24]])

export const dark_green_alt2_SliderTrackActive = n276
export const dark_green_active_SliderThumb = n276
export const dark_green_active_Tooltip = n276
export const dark_green_active_ProgressIndicator = n276
const n277 = t([[13, 24],[14, 48],[15, 24],[16, 48],[17, 23],[19, 0],[20, 23],[21, 0],[22, 23],[24, 48],[25, 0],[26, 0],[27, 0],[28, 23]])

export const dark_green_alt2_TextArea = n277
const n278 = t([[13, 5],[14, 5],[15, 5],[16, 5],[17, 10],[19, 10],[20, 5],[21, 10],[22, 5],[24, 5],[25, 0],[26, 0],[27, 0],[28, 0]])

export const dark_green_alt2_Separator = n278
export const dark_green_active_Checkbox = n278
export const dark_green_active_Switch = n278
export const dark_green_active_SliderTrack = n278
const n279 = t([[13, 5],[14, 5],[15, 5],[16, 5],[17, 23],[19, 48],[20, 10],[21, 5],[22, 10],[24, 5],[25, 5],[26, 5],[27, 5],[28, 5]])

export const dark_green_active_Button = n279
const n280 = t([[13, 24],[14, 10],[15, 24],[16, 10],[17, 5],[19, 23],[20, 5],[21, 23],[22, 5],[24, 24],[25, 47],[26, 47],[27, 47],[28, 47]])

export const dark_green_active_SliderTrackActive = n280
const n281 = t([[13, 48],[14, 23],[15, 48],[16, 23],[17, 5],[19, 23],[20, 24],[21, 23],[22, 24],[24, 23],[25, 0],[26, 0],[27, 0],[28, 0]])

export const dark_green_active_TextArea = n281
const n282 = t([[13, 5],[14, 10],[15, 5],[16, 10],[17, 24],[19, 5],[20, 5],[21, 5],[22, 5],[24, 5],[25, 0],[26, 0],[27, 0],[28, 0]])

export const dark_green_active_Separator = n282
const n283 = t([[13, 47],[14, 47],[15, 47],[16, 47],[17, 24],[19, 0],[20, 0],[21, 0],[22, 0],[24, 47],[25, 10],[26, 10],[27, 10],[28, 10]])

export const dark_green_dim_Card = n283
export const dark_green_dim_DrawerFrame = n283
export const dark_green_dim_Progress = n283
export const dark_green_dim_TooltipArrow = n283
export const dark_green_dim_Input = n283
export const dark_green_dim_Surface = n283
const n284 = t([[13, 23],[14, 23],[15, 23],[16, 23],[17, 24],[19, 5],[20, 48],[21, 48],[22, 48],[24, 23],[25, 48],[26, 48],[27, 48],[28, 48]])

export const dark_green_dim_Button = n284
const n285 = t([[13, 24],[14, 24],[15, 24],[16, 24],[17, 48],[19, 0],[20, 0],[21, 0],[22, 0],[24, 24],[25, 24],[26, 24],[27, 24],[28, 24]])

export const dark_green_dim_Checkbox = n285
export const dark_green_dim_Switch = n285
export const dark_green_dim_SliderTrack = n285
const n286 = t([[13, 0],[14, 0],[15, 0],[16, 0],[17, 0],[19, 5],[20, 5],[21, 5],[22, 5],[24, 0],[25, 24],[26, 24],[27, 24],[28, 24]])

export const dark_green_dim_SwitchThumb = n286
const n287 = t([[13, 0],[14, 0],[15, 0],[16, 0],[17, 0],[19, 47],[20, 47],[21, 47],[22, 47],[24, 0],[25, 5],[26, 5],[27, 5],[28, 5]])

export const dark_green_dim_SliderTrackActive = n287
const n288 = t([[13, 5],[14, 5],[15, 5],[16, 5],[17, 47],[19, 0],[20, 0],[21, 0],[22, 0],[24, 47],[25, 10],[26, 10],[27, 10],[28, 5]])

export const dark_green_dim_TextArea = n288
const n289 = t([[13, 48],[14, 48],[15, 48],[16, 48],[17, 23],[19, 23],[20, 23],[21, 23],[22, 23],[24, 48],[25, 23],[26, 23],[27, 23],[28, 23]])

export const dark_green_dim_Separator = n289
const n290 = t([[13, 0],[14, 0],[15, 0],[16, 0],[17, 0],[19, 49],[20, 49],[21, 49],[22, 49],[24, 0],[25, 55],[26, 55],[27, 55],[28, 55]])

export const dark_red_alt1_SwitchThumb = n290
export const dark_red_dim_SliderThumb = n290
export const dark_red_dim_Tooltip = n290
export const dark_red_dim_ProgressIndicator = n290
const n291 = t([[13, 49],[14, 50],[15, 49],[16, 50],[17, 51],[19, 0],[20, 0],[21, 0],[22, 0],[24, 49],[25, 33],[26, 33],[27, 33],[28, 33]])

export const dark_red_alt1_TooltipContent = n291
const n292 = t([[13, 58],[14, 57],[15, 58],[16, 57],[17, 56],[19, 51],[20, 52],[21, 51],[22, 52],[24, 58],[25, 52],[26, 52],[27, 52],[28, 52]])

export const dark_red_alt1_SliderTrackActive = n292
export const dark_red_alt2_SliderThumb = n292
export const dark_red_alt2_Tooltip = n292
export const dark_red_alt2_ProgressIndicator = n292
const n293 = t([[13, 50],[14, 51],[15, 50],[16, 51],[17, 52],[19, 0],[20, 58],[21, 0],[22, 58],[24, 51],[25, 57],[26, 57],[27, 57],[28, 56]])

export const dark_red_alt1_TextArea = n293
const n294 = t([[13, 53],[14, 54],[15, 53],[16, 54],[17, 55],[19, 56],[20, 33],[21, 56],[22, 33],[24, 53],[25, 0],[26, 0],[27, 0],[28, 0]])

export const dark_red_alt1_Separator = n294
export const dark_red_alt2_Checkbox = n294
export const dark_red_alt2_Switch = n294
export const dark_red_alt2_SliderTrack = n294
export const dark_red_active_Card = n294
export const dark_red_active_Button = n294
export const dark_red_active_DrawerFrame = n294
export const dark_red_active_Progress = n294
export const dark_red_active_TooltipArrow = n294
export const dark_red_active_Input = n294
export const dark_red_active_Surface = n294
const n295 = t([[13, 57],[14, 56],[15, 57],[16, 56],[17, 33],[19, 52],[20, 53],[21, 52],[22, 53],[24, 57],[25, 51],[26, 51],[27, 51],[28, 51]])

export const dark_red_alt2_SliderTrackActive = n295
export const dark_red_active_SliderThumb = n295
export const dark_red_active_Tooltip = n295
export const dark_red_active_ProgressIndicator = n295
const n296 = t([[13, 51],[14, 52],[15, 51],[16, 52],[17, 53],[19, 58],[20, 57],[21, 58],[22, 57],[24, 52],[25, 58],[26, 58],[27, 58],[28, 57]])

export const dark_red_alt2_TextArea = n296
const n297 = t([[13, 54],[14, 55],[15, 54],[16, 55],[17, 33],[19, 33],[20, 55],[21, 33],[22, 55],[24, 54],[25, 0],[26, 0],[27, 0],[28, 0]])

export const dark_red_alt2_Separator = n297
export const dark_red_active_Checkbox = n297
export const dark_red_active_Switch = n297
export const dark_red_active_SliderTrack = n297
const n298 = t([[13, 56],[14, 33],[15, 56],[16, 33],[17, 55],[19, 53],[20, 54],[21, 53],[22, 54],[24, 56],[25, 50],[26, 50],[27, 50],[28, 50]])

export const dark_red_active_SliderTrackActive = n298
const n299 = t([[13, 52],[14, 53],[15, 52],[16, 53],[17, 54],[19, 57],[20, 56],[21, 57],[22, 56],[24, 53],[25, 0],[26, 0],[27, 0],[28, 58]])

export const dark_red_active_TextArea = n299
const n300 = t([[13, 55],[14, 33],[15, 55],[16, 33],[17, 56],[19, 55],[20, 54],[21, 55],[22, 54],[24, 55],[25, 0],[26, 0],[27, 0],[28, 0]])

export const dark_red_active_Separator = n300
const n301 = t([[13, 50],[14, 50],[15, 50],[16, 50],[17, 51],[19, 0],[20, 0],[21, 0],[22, 0],[24, 50],[25, 33],[26, 33],[27, 33],[28, 33]])

export const dark_red_dim_Card = n301
export const dark_red_dim_Button = n301
export const dark_red_dim_DrawerFrame = n301
export const dark_red_dim_Progress = n301
export const dark_red_dim_TooltipArrow = n301
export const dark_red_dim_Input = n301
export const dark_red_dim_Surface = n301
const n302 = t([[13, 51],[14, 51],[15, 51],[16, 51],[17, 52],[19, 58],[20, 58],[21, 58],[22, 58],[24, 51],[25, 56],[26, 56],[27, 56],[28, 56]])

export const dark_red_dim_Checkbox = n302
export const dark_red_dim_Switch = n302
export const dark_red_dim_SliderTrack = n302
const n303 = t([[13, 0],[14, 0],[15, 0],[16, 0],[17, 0],[19, 49],[20, 49],[21, 49],[22, 49],[24, 0],[25, 56],[26, 56],[27, 56],[28, 56]])

export const dark_red_dim_SwitchThumb = n303
const n304 = t([[13, 49],[14, 49],[15, 49],[16, 49],[17, 49],[19, 0],[20, 0],[21, 0],[22, 0],[24, 49],[25, 54],[26, 54],[27, 54],[28, 54]])

export const dark_red_dim_TooltipContent = n304
const n305 = t([[13, 0],[14, 0],[15, 0],[16, 0],[17, 58],[19, 50],[20, 50],[21, 50],[22, 50],[24, 0],[25, 54],[26, 54],[27, 54],[28, 54]])

export const dark_red_dim_SliderTrackActive = n305
const n306 = t([[13, 49],[14, 49],[15, 49],[16, 49],[17, 50],[19, 0],[20, 0],[21, 0],[22, 0],[24, 50],[25, 33],[26, 33],[27, 33],[28, 55]])

export const dark_red_dim_TextArea = n306
const n307 = t([[13, 52],[14, 52],[15, 52],[16, 52],[17, 53],[19, 57],[20, 57],[21, 57],[22, 57],[24, 52],[25, 57],[26, 57],[27, 57],[28, 57]])

export const dark_red_dim_Separator = n307
const n308 = t([[15, 0],[16, 1],[17, 2],[19, 0],[20, 5],[21, 0],[22, 5],[24, 0],[25, 0],[26, 0],[27, 0],[28, 0]])

export const light_ghost_alt1_ListItem = n308
export const light_ghost_alt1_TooltipContent = n308
const n309 = t([[15, 4],[16, 2],[17, 0],[19, 4],[20, 3],[21, 4],[22, 3],[24, 4],[25, 3],[26, 3],[27, 3],[28, 3]])

export const light_ghost_alt1_SliderTrackActive = n309
export const light_ghost_alt2_SliderThumb = n309
export const light_ghost_alt2_Tooltip = n309
export const light_ghost_alt2_ProgressIndicator = n309
const n310 = t([[15, 0],[16, 1],[17, 2],[19, 0],[20, 5],[21, 0],[22, 5],[24, 2],[25, 2],[26, 2],[27, 2],[28, 0]])

export const light_ghost_alt1_TextArea = n310
const n311 = t([[15, 0],[16, 0],[17, 0],[19, 0],[20, 0],[21, 0],[22, 0],[24, 0],[25, 5],[26, 5],[27, 5],[28, 5]])

export const light_ghost_alt1_Separator = n311
export const light_ghost_alt2_Checkbox = n311
export const light_ghost_alt2_Switch = n311
export const light_ghost_alt2_SliderTrack = n311
export const light_ghost_alt2_Separator = n311
export const light_ghost_active_Card = n311
export const light_ghost_active_Button = n311
export const light_ghost_active_Checkbox = n311
export const light_ghost_active_Switch = n311
export const light_ghost_active_DrawerFrame = n311
export const light_ghost_active_Progress = n311
export const light_ghost_active_TooltipArrow = n311
export const light_ghost_active_SliderTrack = n311
export const light_ghost_active_Input = n311
export const light_ghost_active_Separator = n311
export const light_ghost_active_Surface = n311
const n312 = t([[15, 2],[16, 0],[17, 0],[19, 2],[20, 0],[21, 2],[22, 0],[24, 2],[25, 2],[26, 2],[27, 2],[28, 2]])

export const light_ghost_alt2_SliderTrackActive = n312
export const light_ghost_active_SliderThumb = n312
export const light_ghost_active_Tooltip = n312
export const light_ghost_active_ProgressIndicator = n312
const n313 = t([[15, 1],[16, 2],[17, 3],[19, 1],[20, 4],[21, 1],[22, 4],[24, 3],[25, 4],[26, 4],[27, 4],[28, 0]])

export const light_ghost_alt2_TextArea = n313
const n314 = t([[15, 0],[16, 0],[17, 0],[19, 0],[20, 0],[21, 0],[22, 0],[24, 0],[25, 1],[26, 1],[27, 1],[28, 1]])

export const light_ghost_active_SliderTrackActive = n314
const n315 = t([[15, 2],[16, 3],[17, 0],[19, 2],[20, 2],[21, 2],[22, 2],[24, 0],[25, 5],[26, 5],[27, 5],[28, 2]])

export const light_ghost_active_TextArea = n315
const n316 = t([[15, 0],[16, 0],[17, 0],[19, 0],[20, 5],[21, 0],[22, 5],[24, 0],[25, 0],[26, 0],[27, 0],[28, 0]])

export const light_ghost_dim_ListItem = n316
export const light_ghost_dim_TooltipContent = n316
const n317 = t([[15, 1],[16, 1],[17, 2],[19, 1],[20, 5],[21, 1],[22, 5],[24, 1],[25, 0],[26, 0],[27, 0],[28, 0]])

export const light_ghost_dim_Card = n317
export const light_ghost_dim_Button = n317
export const light_ghost_dim_DrawerFrame = n317
export const light_ghost_dim_Progress = n317
export const light_ghost_dim_TooltipArrow = n317
export const light_ghost_dim_Input = n317
export const light_ghost_dim_Surface = n317
const n318 = t([[15, 2],[16, 2],[17, 3],[19, 2],[20, 4],[21, 2],[22, 4],[24, 2],[25, 0],[26, 0],[27, 0],[28, 0]])

export const light_ghost_dim_Checkbox = n318
export const light_ghost_dim_Switch = n318
export const light_ghost_dim_SliderTrack = n318
const n319 = t([[15, 0],[16, 0],[17, 0],[19, 0],[20, 5],[21, 0],[22, 5],[24, 1],[25, 0],[26, 0],[27, 0],[28, 0]])

export const light_ghost_dim_TextArea = n319
const n320 = t([[15, 3],[16, 3],[17, 0],[19, 3],[20, 2],[21, 3],[22, 2],[24, 3],[25, 2],[26, 2],[27, 2],[28, 2]])

export const light_ghost_dim_Separator = n320
const n321 = t([[15, 5],[16, 9],[17, 10],[19, 5],[20, 0],[21, 5],[22, 0],[24, 5],[25, 5],[26, 5],[27, 5],[28, 5]])

export const dark_ghost_alt1_TooltipContent = n321
const n322 = t([[15, 3],[16, 4],[17, 5],[19, 3],[20, 11],[21, 3],[22, 11],[24, 3],[25, 11],[26, 11],[27, 11],[28, 11]])

export const dark_ghost_alt1_SliderTrackActive = n322
export const dark_ghost_alt2_SliderThumb = n322
export const dark_ghost_alt2_Tooltip = n322
export const dark_ghost_alt2_ProgressIndicator = n322
const n323 = t([[15, 9],[16, 10],[17, 11],[19, 9],[20, 3],[21, 9],[22, 3],[24, 10],[25, 4],[26, 4],[27, 4],[28, 5]])

export const dark_ghost_alt1_TextArea = n323
const n324 = t([[15, 4],[16, 5],[17, 5],[19, 4],[20, 5],[21, 4],[22, 5],[24, 4],[25, 0],[26, 0],[27, 0],[28, 0]])

export const dark_ghost_alt1_Separator = n324
export const dark_ghost_alt2_Checkbox = n324
export const dark_ghost_alt2_Switch = n324
export const dark_ghost_alt2_SliderTrack = n324
export const dark_ghost_active_Card = n324
export const dark_ghost_active_Button = n324
export const dark_ghost_active_DrawerFrame = n324
export const dark_ghost_active_Progress = n324
export const dark_ghost_active_TooltipArrow = n324
export const dark_ghost_active_Input = n324
export const dark_ghost_active_Surface = n324
const n325 = t([[15, 4],[16, 5],[17, 5],[19, 4],[20, 4],[21, 4],[22, 4],[24, 4],[25, 10],[26, 10],[27, 10],[28, 10]])

export const dark_ghost_alt2_SliderTrackActive = n325
export const dark_ghost_active_SliderThumb = n325
export const dark_ghost_active_Tooltip = n325
export const dark_ghost_active_ProgressIndicator = n325
const n326 = t([[15, 10],[16, 11],[17, 4],[19, 10],[20, 4],[21, 10],[22, 4],[24, 11],[25, 3],[26, 3],[27, 3],[28, 4]])

export const dark_ghost_alt2_TextArea = n326
const n327 = t([[15, 5],[16, 5],[17, 5],[19, 5],[20, 5],[21, 5],[22, 5],[24, 5],[25, 0],[26, 0],[27, 0],[28, 0]])

export const dark_ghost_alt2_Separator = n327
export const dark_ghost_active_Checkbox = n327
export const dark_ghost_active_Switch = n327
export const dark_ghost_active_SliderTrack = n327
export const dark_ghost_active_Separator = n327
const n328 = t([[15, 5],[16, 5],[17, 5],[19, 5],[20, 5],[21, 5],[22, 5],[24, 5],[25, 9],[26, 9],[27, 9],[28, 9]])

export const dark_ghost_active_SliderTrackActive = n328
const n329 = t([[15, 11],[16, 4],[17, 5],[19, 11],[20, 5],[21, 11],[22, 5],[24, 4],[25, 0],[26, 0],[27, 0],[28, 3]])

export const dark_ghost_active_TextArea = n329
const n330 = t([[15, 9],[16, 9],[17, 10],[19, 9],[20, 0],[21, 9],[22, 0],[24, 9],[25, 5],[26, 5],[27, 5],[28, 5]])

export const dark_ghost_dim_Card = n330
export const dark_ghost_dim_Button = n330
export const dark_ghost_dim_DrawerFrame = n330
export const dark_ghost_dim_Progress = n330
export const dark_ghost_dim_TooltipArrow = n330
export const dark_ghost_dim_Input = n330
export const dark_ghost_dim_Surface = n330
const n331 = t([[15, 10],[16, 10],[17, 11],[19, 10],[20, 3],[21, 10],[22, 3],[24, 10],[25, 5],[26, 5],[27, 5],[28, 5]])

export const dark_ghost_dim_Checkbox = n331
export const dark_ghost_dim_Switch = n331
export const dark_ghost_dim_SliderTrack = n331
const n332 = t([[15, 5],[16, 5],[17, 5],[19, 5],[20, 0],[21, 5],[22, 0],[24, 5],[25, 5],[26, 5],[27, 5],[28, 5]])

export const dark_ghost_dim_TooltipContent = n332
export const dark_green_ghost_dim_TooltipContent = n332
const n333 = t([[15, 5],[16, 5],[17, 9],[19, 5],[20, 0],[21, 5],[22, 0],[24, 9],[25, 5],[26, 5],[27, 5],[28, 5]])

export const dark_ghost_dim_TextArea = n333
const n334 = t([[15, 11],[16, 11],[17, 4],[19, 11],[20, 4],[21, 11],[22, 4],[24, 11],[25, 4],[26, 4],[27, 4],[28, 4]])

export const dark_ghost_dim_Separator = n334
const n335 = t([[15, 12],[16, 13],[17, 14],[19, 16],[20, 5],[21, 12],[22, 5],[24, 16],[25, 17],[26, 16],[27, 16],[28, 19]])

export const light_yellow_ghost_alt1_ListItem = n335
export const light_yellow_ghost_alt1_TooltipContent = n335
const n336 = t([[15, 5],[16, 5],[17, 5],[19, 21],[20, 12],[21, 5],[22, 12],[24, 21],[25, 20],[26, 21],[27, 21],[28, 18]])

export const light_yellow_ghost_alt1_SwitchThumb = n336
export const light_yellow_ghost_dim_SliderThumb = n336
export const light_yellow_ghost_dim_Tooltip = n336
export const light_yellow_ghost_dim_ProgressIndicator = n336
const n337 = t([[15, 22],[16, 21],[17, 20],[19, 18],[20, 15],[21, 22],[22, 15],[24, 18],[25, 17],[26, 18],[27, 18],[28, 15]])

export const light_yellow_ghost_alt1_SliderTrackActive = n337
export const light_yellow_ghost_alt2_SliderThumb = n337
export const light_yellow_ghost_alt2_Tooltip = n337
export const light_yellow_ghost_alt2_ProgressIndicator = n337
const n338 = t([[15, 12],[16, 13],[17, 14],[19, 16],[20, 5],[21, 12],[22, 5],[24, 18],[25, 19],[26, 18],[27, 18],[28, 19]])

export const light_yellow_ghost_alt1_TextArea = n338
const n339 = t([[15, 16],[16, 17],[17, 18],[19, 20],[20, 19],[21, 16],[22, 19],[24, 20],[25, 21],[26, 20],[27, 20],[28, 5]])

export const light_yellow_ghost_alt1_Separator = n339
export const light_yellow_ghost_alt2_Checkbox = n339
export const light_yellow_ghost_alt2_Switch = n339
export const light_yellow_ghost_alt2_SliderTrack = n339
export const light_yellow_ghost_active_Card = n339
export const light_yellow_ghost_active_Button = n339
export const light_yellow_ghost_active_DrawerFrame = n339
export const light_yellow_ghost_active_Progress = n339
export const light_yellow_ghost_active_TooltipArrow = n339
export const light_yellow_ghost_active_Input = n339
export const light_yellow_ghost_active_Surface = n339
const n340 = t([[15, 21],[16, 20],[17, 19],[19, 17],[20, 16],[21, 21],[22, 16],[24, 17],[25, 16],[26, 17],[27, 17],[28, 14]])

export const light_yellow_ghost_alt2_SliderTrackActive = n340
export const light_yellow_ghost_active_SliderThumb = n340
export const light_yellow_ghost_active_Tooltip = n340
export const light_yellow_ghost_active_ProgressIndicator = n340
const n341 = t([[15, 13],[16, 14],[17, 15],[19, 17],[20, 22],[21, 13],[22, 22],[24, 19],[25, 20],[26, 19],[27, 19],[28, 20]])

export const light_yellow_ghost_alt2_TextArea = n341
const n342 = t([[15, 17],[16, 18],[17, 19],[19, 21],[20, 18],[21, 17],[22, 18],[24, 21],[25, 22],[26, 21],[27, 21],[28, 5]])

export const light_yellow_ghost_alt2_Separator = n342
export const light_yellow_ghost_active_Checkbox = n342
export const light_yellow_ghost_active_Switch = n342
export const light_yellow_ghost_active_SliderTrack = n342
const n343 = t([[15, 20],[16, 19],[17, 18],[19, 16],[20, 17],[21, 20],[22, 17],[24, 16],[25, 15],[26, 16],[27, 16],[28, 13]])

export const light_yellow_ghost_active_SliderTrackActive = n343
const n344 = t([[15, 14],[16, 15],[17, 16],[19, 18],[20, 21],[21, 14],[22, 21],[24, 20],[25, 21],[26, 20],[27, 20],[28, 21]])

export const light_yellow_ghost_active_TextArea = n344
const n345 = t([[15, 18],[16, 19],[17, 20],[19, 22],[20, 17],[21, 18],[22, 17],[24, 22],[25, 5],[26, 22],[27, 22],[28, 5]])

export const light_yellow_ghost_active_Separator = n345
const n346 = t([[15, 12],[16, 12],[17, 12],[19, 14],[20, 5],[21, 12],[22, 5],[24, 14],[25, 15],[26, 14],[27, 14],[28, 17]])

export const light_yellow_ghost_dim_ListItem = n346
export const light_yellow_ghost_dim_TooltipContent = n346
const n347 = t([[15, 13],[16, 13],[17, 14],[19, 16],[20, 5],[21, 13],[22, 5],[24, 16],[25, 17],[26, 16],[27, 16],[28, 19]])

export const light_yellow_ghost_dim_Card = n347
export const light_yellow_ghost_dim_Button = n347
export const light_yellow_ghost_dim_DrawerFrame = n347
export const light_yellow_ghost_dim_Progress = n347
export const light_yellow_ghost_dim_TooltipArrow = n347
export const light_yellow_ghost_dim_Input = n347
export const light_yellow_ghost_dim_Surface = n347
const n348 = t([[15, 14],[16, 14],[17, 15],[19, 17],[20, 22],[21, 14],[22, 22],[24, 17],[25, 18],[26, 17],[27, 17],[28, 20]])

export const light_yellow_ghost_dim_Checkbox = n348
export const light_yellow_ghost_dim_Switch = n348
export const light_yellow_ghost_dim_SliderTrack = n348
const n349 = t([[15, 5],[16, 5],[17, 5],[19, 5],[20, 12],[21, 5],[22, 12],[24, 5],[25, 22],[26, 5],[27, 5],[28, 20]])

export const light_yellow_ghost_dim_SwitchThumb = n349
const n350 = t([[15, 12],[16, 12],[17, 12],[19, 14],[20, 5],[21, 12],[22, 5],[24, 16],[25, 17],[26, 16],[27, 16],[28, 17]])

export const light_yellow_ghost_dim_TextArea = n350
const n351 = t([[15, 15],[16, 15],[17, 16],[19, 18],[20, 21],[21, 15],[22, 21],[24, 18],[25, 19],[26, 18],[27, 18],[28, 21]])

export const light_yellow_ghost_dim_Separator = n351
const n352 = t([[15, 0],[16, 23],[17, 24],[19, 23],[20, 5],[21, 0],[22, 5],[24, 23],[25, 0],[26, 23],[27, 23],[28, 23]])

export const light_green_ghost_alt1_ListItem = n352
export const light_green_ghost_alt1_TooltipContent = n352
const n353 = t([[15, 5],[16, 5],[17, 5],[19, 25],[20, 0],[21, 5],[22, 0],[24, 25],[25, 24],[26, 25],[27, 25],[28, 0]])

export const light_green_ghost_alt1_SwitchThumb = n353
export const light_green_ghost_dim_SliderThumb = n353
export const light_green_ghost_dim_Tooltip = n353
export const light_green_ghost_dim_ProgressIndicator = n353
const n354 = t([[15, 5],[16, 25],[17, 24],[19, 0],[20, 25],[21, 5],[22, 25],[24, 0],[25, 0],[26, 0],[27, 0],[28, 25]])

export const light_green_ghost_alt1_SliderTrackActive = n354
export const light_green_ghost_alt2_SliderThumb = n354
export const light_green_ghost_alt2_Tooltip = n354
export const light_green_ghost_alt2_ProgressIndicator = n354
const n355 = t([[15, 0],[16, 23],[17, 24],[19, 23],[20, 5],[21, 0],[22, 5],[24, 0],[25, 23],[26, 0],[27, 0],[28, 23]])

export const light_green_ghost_alt1_TextArea = n355
const n356 = t([[15, 23],[16, 0],[17, 0],[19, 24],[20, 23],[21, 23],[22, 23],[24, 24],[25, 25],[26, 24],[27, 24],[28, 5]])

export const light_green_ghost_alt1_Separator = n356
export const light_green_ghost_alt2_Checkbox = n356
export const light_green_ghost_alt2_Switch = n356
export const light_green_ghost_alt2_SliderTrack = n356
export const light_green_ghost_active_Card = n356
export const light_green_ghost_active_Button = n356
export const light_green_ghost_active_DrawerFrame = n356
export const light_green_ghost_active_Progress = n356
export const light_green_ghost_active_TooltipArrow = n356
export const light_green_ghost_active_Input = n356
export const light_green_ghost_active_Surface = n356
const n357 = t([[15, 25],[16, 24],[17, 23],[19, 0],[20, 23],[21, 25],[22, 23],[24, 0],[25, 23],[26, 0],[27, 0],[28, 24]])

export const light_green_ghost_alt2_SliderTrackActive = n357
export const light_green_ghost_active_SliderThumb = n357
export const light_green_ghost_active_Tooltip = n357
export const light_green_ghost_active_ProgressIndicator = n357
const n358 = t([[15, 23],[16, 24],[17, 25],[19, 0],[20, 5],[21, 23],[22, 5],[24, 23],[25, 24],[26, 23],[27, 23],[28, 24]])

export const light_green_ghost_alt2_TextArea = n358
const n359 = t([[15, 0],[16, 0],[17, 23],[19, 25],[20, 0],[21, 0],[22, 0],[24, 25],[25, 5],[26, 25],[27, 25],[28, 5]])

export const light_green_ghost_alt2_Separator = n359
export const light_green_ghost_active_Checkbox = n359
export const light_green_ghost_active_Switch = n359
export const light_green_ghost_active_SliderTrack = n359
const n360 = t([[15, 24],[16, 23],[17, 0],[19, 23],[20, 0],[21, 24],[22, 0],[24, 23],[25, 25],[26, 23],[27, 23],[28, 23]])

export const light_green_ghost_active_SliderTrackActive = n360
const n361 = t([[15, 24],[16, 25],[17, 23],[19, 0],[20, 25],[21, 24],[22, 25],[24, 24],[25, 25],[26, 24],[27, 24],[28, 25]])

export const light_green_ghost_active_TextArea = n361
const n362 = t([[15, 0],[16, 23],[17, 24],[19, 5],[20, 0],[21, 0],[22, 0],[24, 5],[25, 5],[26, 5],[27, 5],[28, 5]])

export const light_green_ghost_active_Separator = n362
const n363 = t([[15, 0],[16, 0],[17, 0],[19, 24],[20, 5],[21, 0],[22, 5],[24, 24],[25, 25],[26, 24],[27, 24],[28, 0]])

export const light_green_ghost_dim_ListItem = n363
export const light_green_ghost_dim_TooltipContent = n363
const n364 = t([[15, 23],[16, 23],[17, 24],[19, 23],[20, 5],[21, 23],[22, 5],[24, 23],[25, 0],[26, 23],[27, 23],[28, 23]])

export const light_green_ghost_dim_Card = n364
export const light_green_ghost_dim_Button = n364
export const light_green_ghost_dim_DrawerFrame = n364
export const light_green_ghost_dim_Progress = n364
export const light_green_ghost_dim_TooltipArrow = n364
export const light_green_ghost_dim_Input = n364
export const light_green_ghost_dim_Surface = n364
const n365 = t([[15, 24],[16, 24],[17, 25],[19, 0],[20, 5],[21, 24],[22, 5],[24, 0],[25, 0],[26, 0],[27, 0],[28, 24]])

export const light_green_ghost_dim_Checkbox = n365
export const light_green_ghost_dim_Switch = n365
export const light_green_ghost_dim_SliderTrack = n365
const n366 = t([[15, 5],[16, 5],[17, 5],[19, 5],[20, 0],[21, 5],[22, 0],[24, 5],[25, 5],[26, 5],[27, 5],[28, 24]])

export const light_green_ghost_dim_SwitchThumb = n366
const n367 = t([[15, 0],[16, 0],[17, 0],[19, 24],[20, 5],[21, 0],[22, 5],[24, 23],[25, 0],[26, 23],[27, 23],[28, 0]])

export const light_green_ghost_dim_TextArea = n367
const n368 = t([[15, 25],[16, 25],[17, 23],[19, 0],[20, 25],[21, 25],[22, 25],[24, 0],[25, 23],[26, 0],[27, 0],[28, 25]])

export const light_green_ghost_dim_Separator = n368
const n369 = t([[15, 26],[16, 27],[17, 28],[19, 30],[20, 5],[21, 26],[22, 5],[24, 30],[25, 31],[26, 30],[27, 30],[28, 33]])

export const light_red_ghost_alt1_ListItem = n369
export const light_red_ghost_alt1_TooltipContent = n369
const n370 = t([[15, 5],[16, 5],[17, 5],[19, 35],[20, 26],[21, 5],[22, 26],[24, 35],[25, 34],[26, 35],[27, 35],[28, 32]])

export const light_red_ghost_alt1_SwitchThumb = n370
export const light_red_ghost_dim_SliderThumb = n370
export const light_red_ghost_dim_Tooltip = n370
export const light_red_ghost_dim_ProgressIndicator = n370
const n371 = t([[15, 36],[16, 35],[17, 34],[19, 32],[20, 29],[21, 36],[22, 29],[24, 32],[25, 31],[26, 32],[27, 32],[28, 29]])

export const light_red_ghost_alt1_SliderTrackActive = n371
export const light_red_ghost_alt2_SliderThumb = n371
export const light_red_ghost_alt2_Tooltip = n371
export const light_red_ghost_alt2_ProgressIndicator = n371
const n372 = t([[15, 26],[16, 27],[17, 28],[19, 30],[20, 5],[21, 26],[22, 5],[24, 32],[25, 33],[26, 32],[27, 32],[28, 33]])

export const light_red_ghost_alt1_TextArea = n372
const n373 = t([[15, 30],[16, 31],[17, 32],[19, 34],[20, 33],[21, 30],[22, 33],[24, 34],[25, 35],[26, 34],[27, 34],[28, 5]])

export const light_red_ghost_alt1_Separator = n373
export const light_red_ghost_alt2_Checkbox = n373
export const light_red_ghost_alt2_Switch = n373
export const light_red_ghost_alt2_SliderTrack = n373
export const light_red_ghost_active_Card = n373
export const light_red_ghost_active_Button = n373
export const light_red_ghost_active_DrawerFrame = n373
export const light_red_ghost_active_Progress = n373
export const light_red_ghost_active_TooltipArrow = n373
export const light_red_ghost_active_Input = n373
export const light_red_ghost_active_Surface = n373
const n374 = t([[15, 35],[16, 34],[17, 33],[19, 31],[20, 30],[21, 35],[22, 30],[24, 31],[25, 30],[26, 31],[27, 31],[28, 28]])

export const light_red_ghost_alt2_SliderTrackActive = n374
export const light_red_ghost_active_SliderThumb = n374
export const light_red_ghost_active_Tooltip = n374
export const light_red_ghost_active_ProgressIndicator = n374
const n375 = t([[15, 27],[16, 28],[17, 29],[19, 31],[20, 36],[21, 27],[22, 36],[24, 33],[25, 34],[26, 33],[27, 33],[28, 34]])

export const light_red_ghost_alt2_TextArea = n375
const n376 = t([[15, 31],[16, 32],[17, 33],[19, 35],[20, 32],[21, 31],[22, 32],[24, 35],[25, 36],[26, 35],[27, 35],[28, 5]])

export const light_red_ghost_alt2_Separator = n376
export const light_red_ghost_active_Checkbox = n376
export const light_red_ghost_active_Switch = n376
export const light_red_ghost_active_SliderTrack = n376
const n377 = t([[15, 34],[16, 33],[17, 32],[19, 30],[20, 31],[21, 34],[22, 31],[24, 30],[25, 29],[26, 30],[27, 30],[28, 27]])

export const light_red_ghost_active_SliderTrackActive = n377
const n378 = t([[15, 28],[16, 29],[17, 30],[19, 32],[20, 35],[21, 28],[22, 35],[24, 34],[25, 35],[26, 34],[27, 34],[28, 35]])

export const light_red_ghost_active_TextArea = n378
const n379 = t([[15, 32],[16, 33],[17, 34],[19, 36],[20, 31],[21, 32],[22, 31],[24, 36],[25, 5],[26, 36],[27, 36],[28, 5]])

export const light_red_ghost_active_Separator = n379
const n380 = t([[15, 26],[16, 26],[17, 26],[19, 28],[20, 5],[21, 26],[22, 5],[24, 28],[25, 29],[26, 28],[27, 28],[28, 31]])

export const light_red_ghost_dim_ListItem = n380
export const light_red_ghost_dim_TooltipContent = n380
const n381 = t([[15, 27],[16, 27],[17, 28],[19, 30],[20, 5],[21, 27],[22, 5],[24, 30],[25, 31],[26, 30],[27, 30],[28, 33]])

export const light_red_ghost_dim_Card = n381
export const light_red_ghost_dim_Button = n381
export const light_red_ghost_dim_DrawerFrame = n381
export const light_red_ghost_dim_Progress = n381
export const light_red_ghost_dim_TooltipArrow = n381
export const light_red_ghost_dim_Input = n381
export const light_red_ghost_dim_Surface = n381
const n382 = t([[15, 28],[16, 28],[17, 29],[19, 31],[20, 36],[21, 28],[22, 36],[24, 31],[25, 32],[26, 31],[27, 31],[28, 34]])

export const light_red_ghost_dim_Checkbox = n382
export const light_red_ghost_dim_Switch = n382
export const light_red_ghost_dim_SliderTrack = n382
const n383 = t([[15, 5],[16, 5],[17, 5],[19, 5],[20, 26],[21, 5],[22, 26],[24, 5],[25, 36],[26, 5],[27, 5],[28, 34]])

export const light_red_ghost_dim_SwitchThumb = n383
const n384 = t([[15, 26],[16, 26],[17, 26],[19, 28],[20, 5],[21, 26],[22, 5],[24, 30],[25, 31],[26, 30],[27, 30],[28, 31]])

export const light_red_ghost_dim_TextArea = n384
const n385 = t([[15, 29],[16, 29],[17, 30],[19, 32],[20, 35],[21, 29],[22, 35],[24, 32],[25, 33],[26, 32],[27, 32],[28, 35]])

export const light_red_ghost_dim_Separator = n385
const n386 = t([[15, 0],[16, 0],[17, 0],[19, 0],[20, 37],[21, 0],[22, 37],[24, 0],[25, 43],[26, 43],[27, 43],[28, 43]])

export const dark_yellow_ghost_alt1_SwitchThumb = n386
export const dark_yellow_ghost_dim_SliderThumb = n386
export const dark_yellow_ghost_dim_Tooltip = n386
export const dark_yellow_ghost_dim_ProgressIndicator = n386
const n387 = t([[15, 37],[16, 38],[17, 39],[19, 37],[20, 0],[21, 37],[22, 0],[24, 37],[25, 19],[26, 19],[27, 19],[28, 19]])

export const dark_yellow_ghost_alt1_TooltipContent = n387
const n388 = t([[15, 46],[16, 45],[17, 44],[19, 46],[20, 40],[21, 46],[22, 40],[24, 46],[25, 40],[26, 40],[27, 40],[28, 40]])

export const dark_yellow_ghost_alt1_SliderTrackActive = n388
export const dark_yellow_ghost_alt2_SliderThumb = n388
export const dark_yellow_ghost_alt2_Tooltip = n388
export const dark_yellow_ghost_alt2_ProgressIndicator = n388
const n389 = t([[15, 38],[16, 39],[17, 40],[19, 38],[20, 46],[21, 38],[22, 46],[24, 39],[25, 45],[26, 45],[27, 45],[28, 44]])

export const dark_yellow_ghost_alt1_TextArea = n389
const n390 = t([[15, 41],[16, 42],[17, 43],[19, 41],[20, 19],[21, 41],[22, 19],[24, 41],[25, 0],[26, 0],[27, 0],[28, 0]])

export const dark_yellow_ghost_alt1_Separator = n390
export const dark_yellow_ghost_alt2_Checkbox = n390
export const dark_yellow_ghost_alt2_Switch = n390
export const dark_yellow_ghost_alt2_SliderTrack = n390
export const dark_yellow_ghost_active_Card = n390
export const dark_yellow_ghost_active_Button = n390
export const dark_yellow_ghost_active_DrawerFrame = n390
export const dark_yellow_ghost_active_Progress = n390
export const dark_yellow_ghost_active_TooltipArrow = n390
export const dark_yellow_ghost_active_Input = n390
export const dark_yellow_ghost_active_Surface = n390
const n391 = t([[15, 45],[16, 44],[17, 19],[19, 45],[20, 41],[21, 45],[22, 41],[24, 45],[25, 39],[26, 39],[27, 39],[28, 39]])

export const dark_yellow_ghost_alt2_SliderTrackActive = n391
export const dark_yellow_ghost_active_SliderThumb = n391
export const dark_yellow_ghost_active_Tooltip = n391
export const dark_yellow_ghost_active_ProgressIndicator = n391
const n392 = t([[15, 39],[16, 40],[17, 41],[19, 39],[20, 45],[21, 39],[22, 45],[24, 40],[25, 46],[26, 46],[27, 46],[28, 45]])

export const dark_yellow_ghost_alt2_TextArea = n392
const n393 = t([[15, 42],[16, 43],[17, 19],[19, 42],[20, 43],[21, 42],[22, 43],[24, 42],[25, 0],[26, 0],[27, 0],[28, 0]])

export const dark_yellow_ghost_alt2_Separator = n393
export const dark_yellow_ghost_active_Checkbox = n393
export const dark_yellow_ghost_active_Switch = n393
export const dark_yellow_ghost_active_SliderTrack = n393
const n394 = t([[15, 44],[16, 19],[17, 43],[19, 44],[20, 42],[21, 44],[22, 42],[24, 44],[25, 38],[26, 38],[27, 38],[28, 38]])

export const dark_yellow_ghost_active_SliderTrackActive = n394
const n395 = t([[15, 40],[16, 41],[17, 42],[19, 40],[20, 44],[21, 40],[22, 44],[24, 41],[25, 0],[26, 0],[27, 0],[28, 46]])

export const dark_yellow_ghost_active_TextArea = n395
const n396 = t([[15, 43],[16, 19],[17, 44],[19, 43],[20, 42],[21, 43],[22, 42],[24, 43],[25, 0],[26, 0],[27, 0],[28, 0]])

export const dark_yellow_ghost_active_Separator = n396
const n397 = t([[15, 38],[16, 38],[17, 39],[19, 38],[20, 0],[21, 38],[22, 0],[24, 38],[25, 19],[26, 19],[27, 19],[28, 19]])

export const dark_yellow_ghost_dim_Card = n397
export const dark_yellow_ghost_dim_Button = n397
export const dark_yellow_ghost_dim_DrawerFrame = n397
export const dark_yellow_ghost_dim_Progress = n397
export const dark_yellow_ghost_dim_TooltipArrow = n397
export const dark_yellow_ghost_dim_Input = n397
export const dark_yellow_ghost_dim_Surface = n397
const n398 = t([[15, 39],[16, 39],[17, 40],[19, 39],[20, 46],[21, 39],[22, 46],[24, 39],[25, 44],[26, 44],[27, 44],[28, 44]])

export const dark_yellow_ghost_dim_Checkbox = n398
export const dark_yellow_ghost_dim_Switch = n398
export const dark_yellow_ghost_dim_SliderTrack = n398
const n399 = t([[15, 0],[16, 0],[17, 0],[19, 0],[20, 37],[21, 0],[22, 37],[24, 0],[25, 44],[26, 44],[27, 44],[28, 44]])

export const dark_yellow_ghost_dim_SwitchThumb = n399
const n400 = t([[15, 37],[16, 37],[17, 37],[19, 37],[20, 0],[21, 37],[22, 0],[24, 37],[25, 42],[26, 42],[27, 42],[28, 42]])

export const dark_yellow_ghost_dim_TooltipContent = n400
const n401 = t([[15, 37],[16, 37],[17, 38],[19, 37],[20, 0],[21, 37],[22, 0],[24, 38],[25, 19],[26, 19],[27, 19],[28, 43]])

export const dark_yellow_ghost_dim_TextArea = n401
const n402 = t([[15, 40],[16, 40],[17, 41],[19, 40],[20, 45],[21, 40],[22, 45],[24, 40],[25, 45],[26, 45],[27, 45],[28, 45]])

export const dark_yellow_ghost_dim_Separator = n402
const n403 = t([[15, 24],[16, 10],[17, 5],[19, 0],[20, 5],[21, 24],[22, 5],[24, 24],[25, 47],[26, 47],[27, 47],[28, 47]])

export const dark_green_ghost_alt1_Button = n403
const n404 = t([[15, 5],[16, 47],[17, 24],[19, 5],[20, 0],[21, 5],[22, 0],[24, 5],[25, 10],[26, 10],[27, 10],[28, 10]])

export const dark_green_ghost_alt1_TooltipContent = n404
const n405 = t([[15, 0],[16, 23],[17, 24],[19, 0],[20, 48],[21, 0],[22, 48],[24, 0],[25, 48],[26, 48],[27, 48],[28, 48]])

export const dark_green_ghost_alt1_SliderTrackActive = n405
export const dark_green_ghost_alt2_SliderThumb = n405
export const dark_green_ghost_alt2_Tooltip = n405
export const dark_green_ghost_alt2_ProgressIndicator = n405
const n406 = t([[15, 47],[16, 24],[17, 48],[19, 47],[20, 0],[21, 47],[22, 0],[24, 24],[25, 23],[26, 23],[27, 23],[28, 24]])

export const dark_green_ghost_alt1_TextArea = n406
const n407 = t([[15, 23],[16, 5],[17, 5],[19, 23],[20, 10],[21, 23],[22, 10],[24, 23],[25, 0],[26, 0],[27, 0],[28, 0]])

export const dark_green_ghost_alt1_Separator = n407
export const dark_green_ghost_alt2_Checkbox = n407
export const dark_green_ghost_alt2_Switch = n407
export const dark_green_ghost_alt2_SliderTrack = n407
export const dark_green_ghost_active_Card = n407
export const dark_green_ghost_active_DrawerFrame = n407
export const dark_green_ghost_active_Progress = n407
export const dark_green_ghost_active_TooltipArrow = n407
export const dark_green_ghost_active_Input = n407
export const dark_green_ghost_active_Surface = n407
const n408 = t([[15, 10],[16, 5],[17, 5],[19, 0],[20, 5],[21, 10],[22, 5],[24, 10],[25, 5],[26, 5],[27, 5],[28, 5]])

export const dark_green_ghost_alt2_Button = n408
const n409 = t([[15, 23],[16, 24],[17, 10],[19, 23],[20, 23],[21, 23],[22, 23],[24, 23],[25, 24],[26, 24],[27, 24],[28, 24]])

export const dark_green_ghost_alt2_SliderTrackActive = n409
export const dark_green_ghost_active_SliderThumb = n409
export const dark_green_ghost_active_Tooltip = n409
export const dark_green_ghost_active_ProgressIndicator = n409
const n410 = t([[15, 24],[16, 48],[17, 23],[19, 24],[20, 23],[21, 24],[22, 23],[24, 48],[25, 0],[26, 0],[27, 0],[28, 23]])

export const dark_green_ghost_alt2_TextArea = n410
const n411 = t([[15, 5],[16, 5],[17, 10],[19, 5],[20, 5],[21, 5],[22, 5],[24, 5],[25, 0],[26, 0],[27, 0],[28, 0]])

export const dark_green_ghost_alt2_Separator = n411
export const dark_green_ghost_active_Checkbox = n411
export const dark_green_ghost_active_Switch = n411
export const dark_green_ghost_active_SliderTrack = n411
const n412 = t([[15, 5],[16, 5],[17, 23],[19, 23],[20, 10],[21, 5],[22, 10],[24, 5],[25, 5],[26, 5],[27, 5],[28, 5]])

export const dark_green_ghost_active_Button = n412
const n413 = t([[15, 24],[16, 10],[17, 5],[19, 24],[20, 5],[21, 24],[22, 5],[24, 24],[25, 47],[26, 47],[27, 47],[28, 47]])

export const dark_green_ghost_active_SliderTrackActive = n413
const n414 = t([[15, 48],[16, 23],[17, 5],[19, 48],[20, 24],[21, 48],[22, 24],[24, 23],[25, 0],[26, 0],[27, 0],[28, 0]])

export const dark_green_ghost_active_TextArea = n414
const n415 = t([[15, 5],[16, 10],[17, 24],[19, 5],[20, 5],[21, 5],[22, 5],[24, 5],[25, 0],[26, 0],[27, 0],[28, 0]])

export const dark_green_ghost_active_Separator = n415
const n416 = t([[15, 47],[16, 47],[17, 24],[19, 47],[20, 0],[21, 47],[22, 0],[24, 47],[25, 10],[26, 10],[27, 10],[28, 10]])

export const dark_green_ghost_dim_Card = n416
export const dark_green_ghost_dim_DrawerFrame = n416
export const dark_green_ghost_dim_Progress = n416
export const dark_green_ghost_dim_TooltipArrow = n416
export const dark_green_ghost_dim_Input = n416
export const dark_green_ghost_dim_Surface = n416
const n417 = t([[15, 23],[16, 23],[17, 24],[19, 5],[20, 48],[21, 23],[22, 48],[24, 23],[25, 48],[26, 48],[27, 48],[28, 48]])

export const dark_green_ghost_dim_Button = n417
const n418 = t([[15, 24],[16, 24],[17, 48],[19, 24],[20, 0],[21, 24],[22, 0],[24, 24],[25, 24],[26, 24],[27, 24],[28, 24]])

export const dark_green_ghost_dim_Checkbox = n418
export const dark_green_ghost_dim_Switch = n418
export const dark_green_ghost_dim_SliderTrack = n418
const n419 = t([[15, 0],[16, 0],[17, 0],[19, 0],[20, 5],[21, 0],[22, 5],[24, 0],[25, 24],[26, 24],[27, 24],[28, 24]])

export const dark_green_ghost_dim_SwitchThumb = n419
const n420 = t([[15, 5],[16, 5],[17, 47],[19, 5],[20, 0],[21, 5],[22, 0],[24, 47],[25, 10],[26, 10],[27, 10],[28, 5]])

export const dark_green_ghost_dim_TextArea = n420
const n421 = t([[15, 48],[16, 48],[17, 23],[19, 48],[20, 23],[21, 48],[22, 23],[24, 48],[25, 23],[26, 23],[27, 23],[28, 23]])

export const dark_green_ghost_dim_Separator = n421
const n422 = t([[15, 0],[16, 0],[17, 0],[19, 0],[20, 49],[21, 0],[22, 49],[24, 0],[25, 55],[26, 55],[27, 55],[28, 55]])

export const dark_red_ghost_alt1_SwitchThumb = n422
export const dark_red_ghost_dim_SliderThumb = n422
export const dark_red_ghost_dim_Tooltip = n422
export const dark_red_ghost_dim_ProgressIndicator = n422
const n423 = t([[15, 49],[16, 50],[17, 51],[19, 49],[20, 0],[21, 49],[22, 0],[24, 49],[25, 33],[26, 33],[27, 33],[28, 33]])

export const dark_red_ghost_alt1_TooltipContent = n423
const n424 = t([[15, 58],[16, 57],[17, 56],[19, 58],[20, 52],[21, 58],[22, 52],[24, 58],[25, 52],[26, 52],[27, 52],[28, 52]])

export const dark_red_ghost_alt1_SliderTrackActive = n424
export const dark_red_ghost_alt2_SliderThumb = n424
export const dark_red_ghost_alt2_Tooltip = n424
export const dark_red_ghost_alt2_ProgressIndicator = n424
const n425 = t([[15, 50],[16, 51],[17, 52],[19, 50],[20, 58],[21, 50],[22, 58],[24, 51],[25, 57],[26, 57],[27, 57],[28, 56]])

export const dark_red_ghost_alt1_TextArea = n425
const n426 = t([[15, 53],[16, 54],[17, 55],[19, 53],[20, 33],[21, 53],[22, 33],[24, 53],[25, 0],[26, 0],[27, 0],[28, 0]])

export const dark_red_ghost_alt1_Separator = n426
export const dark_red_ghost_alt2_Checkbox = n426
export const dark_red_ghost_alt2_Switch = n426
export const dark_red_ghost_alt2_SliderTrack = n426
export const dark_red_ghost_active_Card = n426
export const dark_red_ghost_active_Button = n426
export const dark_red_ghost_active_DrawerFrame = n426
export const dark_red_ghost_active_Progress = n426
export const dark_red_ghost_active_TooltipArrow = n426
export const dark_red_ghost_active_Input = n426
export const dark_red_ghost_active_Surface = n426
const n427 = t([[15, 57],[16, 56],[17, 33],[19, 57],[20, 53],[21, 57],[22, 53],[24, 57],[25, 51],[26, 51],[27, 51],[28, 51]])

export const dark_red_ghost_alt2_SliderTrackActive = n427
export const dark_red_ghost_active_SliderThumb = n427
export const dark_red_ghost_active_Tooltip = n427
export const dark_red_ghost_active_ProgressIndicator = n427
const n428 = t([[15, 51],[16, 52],[17, 53],[19, 51],[20, 57],[21, 51],[22, 57],[24, 52],[25, 58],[26, 58],[27, 58],[28, 57]])

export const dark_red_ghost_alt2_TextArea = n428
const n429 = t([[15, 54],[16, 55],[17, 33],[19, 54],[20, 55],[21, 54],[22, 55],[24, 54],[25, 0],[26, 0],[27, 0],[28, 0]])

export const dark_red_ghost_alt2_Separator = n429
export const dark_red_ghost_active_Checkbox = n429
export const dark_red_ghost_active_Switch = n429
export const dark_red_ghost_active_SliderTrack = n429
const n430 = t([[15, 56],[16, 33],[17, 55],[19, 56],[20, 54],[21, 56],[22, 54],[24, 56],[25, 50],[26, 50],[27, 50],[28, 50]])

export const dark_red_ghost_active_SliderTrackActive = n430
const n431 = t([[15, 52],[16, 53],[17, 54],[19, 52],[20, 56],[21, 52],[22, 56],[24, 53],[25, 0],[26, 0],[27, 0],[28, 58]])

export const dark_red_ghost_active_TextArea = n431
const n432 = t([[15, 55],[16, 33],[17, 56],[19, 55],[20, 54],[21, 55],[22, 54],[24, 55],[25, 0],[26, 0],[27, 0],[28, 0]])

export const dark_red_ghost_active_Separator = n432
const n433 = t([[15, 50],[16, 50],[17, 51],[19, 50],[20, 0],[21, 50],[22, 0],[24, 50],[25, 33],[26, 33],[27, 33],[28, 33]])

export const dark_red_ghost_dim_Card = n433
export const dark_red_ghost_dim_Button = n433
export const dark_red_ghost_dim_DrawerFrame = n433
export const dark_red_ghost_dim_Progress = n433
export const dark_red_ghost_dim_TooltipArrow = n433
export const dark_red_ghost_dim_Input = n433
export const dark_red_ghost_dim_Surface = n433
const n434 = t([[15, 51],[16, 51],[17, 52],[19, 51],[20, 58],[21, 51],[22, 58],[24, 51],[25, 56],[26, 56],[27, 56],[28, 56]])

export const dark_red_ghost_dim_Checkbox = n434
export const dark_red_ghost_dim_Switch = n434
export const dark_red_ghost_dim_SliderTrack = n434
const n435 = t([[15, 0],[16, 0],[17, 0],[19, 0],[20, 49],[21, 0],[22, 49],[24, 0],[25, 56],[26, 56],[27, 56],[28, 56]])

export const dark_red_ghost_dim_SwitchThumb = n435
const n436 = t([[15, 49],[16, 49],[17, 49],[19, 49],[20, 0],[21, 49],[22, 0],[24, 49],[25, 54],[26, 54],[27, 54],[28, 54]])

export const dark_red_ghost_dim_TooltipContent = n436
const n437 = t([[15, 49],[16, 49],[17, 50],[19, 49],[20, 0],[21, 49],[22, 0],[24, 50],[25, 33],[26, 33],[27, 33],[28, 55]])

export const dark_red_ghost_dim_TextArea = n437
const n438 = t([[15, 52],[16, 52],[17, 53],[19, 52],[20, 57],[21, 52],[22, 57],[24, 52],[25, 57],[26, 57],[27, 57],[28, 57]])

export const dark_red_ghost_dim_Separator = n438