type Theme = {
  accentBackground: string;
  accentColor: string;
  background0: string;
  background025: string;
  background05: string;
  background075: string;
  color0: string;
  color025: string;
  color05: string;
  color075: string;
  background: string;
  backgroundHover: string;
  backgroundPress: string;
  backgroundFocus: string;
  color: string;
  colorHover: string;
  colorPress: string;
  colorFocus: string;
  placeholderColor: string;
  borderColor: string;
  borderColorHover: string;
  borderColorFocus: string;
  borderColorPress: string;
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

}

function t(a: [number, number][]) {
  let res: Record<string,string> = {}
  for (const [ki, vi] of a) {
    res[ks[ki] as string] = vs[vi] as string
  }
  return res as Theme
}
const vs = [
  'hsla(125, 96%, 40%, 1)',
  'hsla(191, 32%, 10%, 1)',
  'hsla(180, 20%, 99%, 0.25)',
  'hsla(180, 20%, 99%, 0.5)',
  'hsla(180, 20%, 99%, 0.75)',
  'hsla(191, 32%, 99%, 1)',
  'hsla(112, 22%, 0%, 1)',
  'hsla(0, 0%, 0%, 0.75)',
  'hsla(0, 0%, 0%, 0.5)',
  'hsla(0, 0%, 0%, 0.25)',
  'hsla(191, 32%, 93%, 1)',
  'hsla(191, 32%, 88%, 1)',
  'hsla(191, 32%, 83%, 1)',
  'hsla(96, 16%, 25%, 1)',
  'hsla(191, 32%, 50%, 1)',
  'hsla(191, 32%, 77%, 1)',
  'hsla(191, 32%, 72%, 1)',
  'hsla(191, 32%, 66%, 1)',
  'hsla(191, 32%, 61%, 1)',
  'hsla(191, 32%, 55%, 1)',
  'hsla(191, 33%, 10%, 0.25)',
  'hsla(191, 33%, 10%, 0.5)',
  'hsla(191, 33%, 10%, 0.75)',
  'hsla(112, 22%, 100%, 1)',
  'hsla(0, 0%, 100%, 0.75)',
  'hsla(0, 0%, 100%, 0.5)',
  'hsla(0, 0%, 100%, 0.25)',
  'hsla(191, 32%, 15%, 1)',
  'hsla(191, 32%, 19%, 1)',
  'hsla(191, 32%, 24%, 1)',
  'hsla(112, 22%, 59%, 1)',
  'hsla(191, 32%, 28%, 1)',
  'hsla(191, 32%, 32%, 1)',
  'hsla(191, 32%, 37%, 1)',
  'hsla(191, 32%, 41%, 1)',
  'hsla(191, 32%, 46%, 1)',
  'hsla(0, 60%, 99%, 0.25)',
  'hsla(0, 60%, 99%, 0.5)',
  'hsla(0, 60%, 99%, 0.75)',
  'hsla(0, 70%, 99%, 1)',
  'hsla(0, 70%, 10%, 1)',
  'hsla(0, 69%, 10%, 0.75)',
  'hsla(0, 69%, 10%, 0.5)',
  'hsla(0, 69%, 10%, 0.25)',
  'hsla(0, 70%, 93%, 1)',
  'hsla(0, 70%, 88%, 1)',
  'hsla(0, 70%, 82%, 1)',
  'hsla(0, 70%, 15%, 1)',
  'hsla(0, 70%, 50%, 1)',
  'hsla(0, 70%, 77%, 1)',
  'hsla(0, 70%, 72%, 1)',
  'hsla(0, 70%, 66%, 1)',
  'hsla(0, 70%, 61%, 1)',
  'hsla(0, 70%, 55%, 1)',
  'hsla(60, 60%, 99%, 0.25)',
  'hsla(60, 60%, 99%, 0.5)',
  'hsla(60, 60%, 99%, 0.75)',
  'hsla(48, 70%, 99%, 1)',
  'hsla(48, 70%, 10%, 1)',
  'hsla(48, 69%, 10%, 0.75)',
  'hsla(48, 69%, 10%, 0.5)',
  'hsla(48, 69%, 10%, 0.25)',
  'hsla(48, 70%, 93%, 1)',
  'hsla(48, 70%, 88%, 1)',
  'hsla(48, 70%, 82%, 1)',
  'hsla(48, 70%, 15%, 1)',
  'hsla(48, 70%, 50%, 1)',
  'hsla(48, 70%, 77%, 1)',
  'hsla(48, 70%, 72%, 1)',
  'hsla(48, 70%, 66%, 1)',
  'hsla(48, 70%, 61%, 1)',
  'hsla(48, 70%, 55%, 1)',
  'hsla(160, 60%, 99%, 0.25)',
  'hsla(160, 60%, 99%, 0.5)',
  'hsla(160, 60%, 99%, 0.75)',
  'hsla(153, 70%, 99%, 1)',
  'hsla(153, 70%, 10%, 1)',
  'hsla(153, 69%, 10%, 0.75)',
  'hsla(153, 69%, 10%, 0.5)',
  'hsla(153, 69%, 10%, 0.25)',
  'hsla(153, 70%, 93%, 1)',
  'hsla(153, 70%, 88%, 1)',
  'hsla(153, 70%, 82%, 1)',
  'hsla(153, 70%, 15%, 1)',
  'hsla(153, 70%, 50%, 1)',
  'hsla(153, 70%, 77%, 1)',
  'hsla(153, 70%, 72%, 1)',
  'hsla(153, 70%, 66%, 1)',
  'hsla(153, 70%, 61%, 1)',
  'hsla(153, 70%, 55%, 1)',
  'hsla(0, 70%, 95%, 1)',
  'hsla(0, 69%, 95%, 0.75)',
  'hsla(0, 69%, 95%, 0.5)',
  'hsla(0, 69%, 95%, 0.25)',
  'hsla(0, 70%, 14%, 1)',
  'hsla(0, 70%, 19%, 1)',
  'hsla(0, 70%, 23%, 1)',
  'hsla(0, 70%, 28%, 1)',
  'hsla(0, 70%, 32%, 1)',
  'hsla(0, 70%, 37%, 1)',
  'hsla(0, 70%, 41%, 1)',
  'hsla(0, 70%, 46%, 1)',
  'hsla(48, 70%, 95%, 1)',
  'hsla(50, 69%, 95%, 0.75)',
  'hsla(50, 69%, 95%, 0.5)',
  'hsla(50, 69%, 95%, 0.25)',
  'hsla(48, 70%, 14%, 1)',
  'hsla(48, 70%, 19%, 1)',
  'hsla(48, 70%, 23%, 1)',
  'hsla(48, 70%, 28%, 1)',
  'hsla(48, 70%, 32%, 1)',
  'hsla(48, 70%, 37%, 1)',
  'hsla(48, 70%, 41%, 1)',
  'hsla(48, 70%, 46%, 1)',
  'hsla(153, 70%, 95%, 1)',
  'hsla(153, 69%, 95%, 0.75)',
  'hsla(153, 69%, 95%, 0.5)',
  'hsla(153, 69%, 95%, 0.25)',
  'hsla(153, 70%, 14%, 1)',
  'hsla(153, 70%, 19%, 1)',
  'hsla(153, 70%, 23%, 1)',
  'hsla(153, 70%, 28%, 1)',
  'hsla(153, 70%, 32%, 1)',
  'hsla(153, 70%, 37%, 1)',
  'hsla(153, 70%, 41%, 1)',
  'hsla(153, 70%, 46%, 1)',
  'hsla(125, 96%, 40%, 0.25)',
  'hsla(125, 96%, 40%, 0.5)',
  'hsla(125, 96%, 40%, 0.75)',
  'hsla(125, 96%, 42%, 1)',
  'hsla(125, 96%, 45%, 1)',
  'hsla(125, 96%, 47%, 1)',
  'hsla(125, 96%, 62%, 1)',
  'hsla(125, 96%, 50%, 1)',
  'hsla(125, 96%, 52%, 1)',
  'hsla(125, 96%, 55%, 1)',
  'hsla(125, 96%, 57%, 1)',
  'hsla(125, 96%, 59%, 1)',
  'rgba(0,0,0,0.5)',
  'rgba(0,0,0,0.9)',
  'hsla(180, 20%, 99%, 0)',
  'hsla(0, 0%, 0%, 0)',
  'hsla(191, 33%, 10%, 0)',
  'hsla(0, 0%, 100%, 0)',
  'hsla(0, 60%, 99%, 0)',
  'hsla(60, 60%, 99%, 0)',
  'hsla(160, 60%, 99%, 0)',
  'hsla(0, 69%, 10%, 0)',
  'hsla(48, 69%, 10%, 0)',
  'hsla(153, 69%, 10%, 0)',
  'hsla(125, 96%, 40%, 0)',
]

const ks = [
'accentBackground',
'accentColor',
'background0',
'background025',
'background05',
'background075',
'color0',
'color025',
'color05',
'color075',
'background',
'backgroundHover',
'backgroundPress',
'backgroundFocus',
'color',
'colorHover',
'colorPress',
'colorFocus',
'placeholderColor',
'borderColor',
'borderColorHover',
'borderColorFocus',
'borderColorPress',
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
'color12']


const n1 = t([[0, 0],[1, 1],[2, 2],[3, 3],[4, 4],[5, 5],[6, 6],[7, 7],[8, 8],[9, 9],[10, 5],[11, 10],[12, 11],[13, 12],[14, 13],[15, 14],[16, 13],[17, 14],[18, 14],[19, 12],[20, 15],[21, 16],[22, 15],[23, 5],[24, 10],[25, 11],[26, 12],[27, 15],[28, 16],[29, 17],[30, 18],[31, 19],[32, 14],[33, 13],[34, 6]])

export const light = n1
const n2 = t([[0, 0],[1, 1],[2, 20],[3, 21],[4, 22],[5, 1],[6, 23],[7, 24],[8, 25],[9, 26],[10, 1],[11, 27],[12, 28],[13, 29],[14, 30],[15, 14],[16, 30],[17, 14],[18, 14],[19, 29],[20, 31],[21, 32],[22, 31],[23, 1],[24, 27],[25, 28],[26, 29],[27, 31],[28, 32],[29, 33],[30, 34],[31, 35],[32, 14],[33, 30],[34, 23]])

export const dark = n2
const n3 = t([[0, 0],[1, 1],[2, 36],[3, 37],[4, 38],[5, 39],[6, 40],[7, 41],[8, 42],[9, 43],[10, 39],[11, 44],[12, 45],[13, 46],[14, 47],[15, 48],[16, 47],[17, 48],[18, 48],[19, 46],[20, 49],[21, 50],[22, 49],[23, 39],[24, 44],[25, 45],[26, 46],[27, 49],[28, 50],[29, 51],[30, 52],[31, 53],[32, 48],[33, 47],[34, 40]])

export const light_error = n3
export const light_red = n3
const n4 = t([[0, 0],[1, 1],[2, 54],[3, 55],[4, 56],[5, 57],[6, 58],[7, 59],[8, 60],[9, 61],[10, 57],[11, 62],[12, 63],[13, 64],[14, 65],[15, 66],[16, 65],[17, 66],[18, 66],[19, 64],[20, 67],[21, 68],[22, 67],[23, 57],[24, 62],[25, 63],[26, 64],[27, 67],[28, 68],[29, 69],[30, 70],[31, 71],[32, 66],[33, 65],[34, 58]])

export const light_warning = n4
const n5 = t([[0, 0],[1, 1],[2, 72],[3, 73],[4, 74],[5, 75],[6, 76],[7, 77],[8, 78],[9, 79],[10, 75],[11, 80],[12, 81],[13, 82],[14, 83],[15, 84],[16, 83],[17, 84],[18, 84],[19, 82],[20, 85],[21, 86],[22, 85],[23, 75],[24, 80],[25, 81],[26, 82],[27, 85],[28, 86],[29, 87],[30, 88],[31, 89],[32, 84],[33, 83],[34, 76]])

export const light_success = n5
const n6 = t([[0, 0],[1, 1],[2, 43],[3, 42],[4, 41],[5, 40],[6, 90],[7, 91],[8, 92],[9, 93],[10, 40],[11, 94],[12, 95],[13, 96],[14, 44],[15, 48],[16, 44],[17, 48],[18, 48],[19, 96],[20, 97],[21, 98],[22, 97],[23, 40],[24, 94],[25, 95],[26, 96],[27, 97],[28, 98],[29, 99],[30, 100],[31, 101],[32, 48],[33, 44],[34, 90]])

export const dark_error = n6
export const dark_red = n6
const n7 = t([[0, 0],[1, 1],[2, 61],[3, 60],[4, 59],[5, 58],[6, 102],[7, 103],[8, 104],[9, 105],[10, 58],[11, 106],[12, 107],[13, 108],[14, 62],[15, 66],[16, 62],[17, 66],[18, 66],[19, 108],[20, 109],[21, 110],[22, 109],[23, 58],[24, 106],[25, 107],[26, 108],[27, 109],[28, 110],[29, 111],[30, 112],[31, 113],[32, 66],[33, 62],[34, 102]])

export const dark_warning = n7
const n8 = t([[0, 0],[1, 1],[2, 79],[3, 78],[4, 77],[5, 76],[6, 114],[7, 115],[8, 116],[9, 117],[10, 76],[11, 118],[12, 119],[13, 120],[14, 80],[15, 84],[16, 80],[17, 84],[18, 84],[19, 120],[20, 121],[21, 122],[22, 121],[23, 76],[24, 118],[25, 119],[26, 120],[27, 121],[28, 122],[29, 123],[30, 124],[31, 125],[32, 84],[33, 80],[34, 114]])

export const dark_success = n8
const n9 = t([[0, 0],[1, 1],[2, 126],[3, 127],[4, 128],[5, 0],[6, 1],[7, 22],[8, 21],[9, 20],[10, 0],[11, 129],[12, 130],[13, 131],[14, 1],[15, 132],[16, 1],[17, 132],[18, 132],[19, 131],[20, 133],[21, 134],[22, 133],[23, 0],[24, 129],[25, 130],[26, 131],[27, 133],[28, 134],[29, 135],[30, 136],[31, 137],[32, 132],[33, 1],[34, 1]])

export const light_accent = n9
export const dark_accent = n9
export const light_disabled_accent = n9
export const light_dim_accent = n9
export const light_alt1_accent = n9
export const light_alt2_accent = n9
export const light_active_accent = n9
export const light_error_accent = n9
export const light_red_accent = n9
export const light_warning_accent = n9
export const light_success_accent = n9
export const dark_disabled_accent = n9
export const dark_dim_accent = n9
export const dark_alt1_accent = n9
export const dark_alt2_accent = n9
export const dark_active_accent = n9
export const dark_error_accent = n9
export const dark_red_accent = n9
export const dark_warning_accent = n9
export const dark_success_accent = n9
const n10 = t([[10, 138]])

export const light_SheetOverlay = n10
export const light_DialogOverlay = n10
export const light_ModalOverlay = n10
export const light_disabled_SheetOverlay = n10
export const light_disabled_DialogOverlay = n10
export const light_disabled_ModalOverlay = n10
export const light_dim_SheetOverlay = n10
export const light_dim_DialogOverlay = n10
export const light_dim_ModalOverlay = n10
export const light_alt1_SheetOverlay = n10
export const light_alt1_DialogOverlay = n10
export const light_alt1_ModalOverlay = n10
export const light_alt2_SheetOverlay = n10
export const light_alt2_DialogOverlay = n10
export const light_alt2_ModalOverlay = n10
export const light_active_SheetOverlay = n10
export const light_active_DialogOverlay = n10
export const light_active_ModalOverlay = n10
export const light_error_SheetOverlay = n10
export const light_error_DialogOverlay = n10
export const light_error_ModalOverlay = n10
export const light_red_SheetOverlay = n10
export const light_red_DialogOverlay = n10
export const light_red_ModalOverlay = n10
export const light_warning_SheetOverlay = n10
export const light_warning_DialogOverlay = n10
export const light_warning_ModalOverlay = n10
export const light_success_SheetOverlay = n10
export const light_success_DialogOverlay = n10
export const light_success_ModalOverlay = n10
export const light_accent_SheetOverlay = n10
export const light_accent_DialogOverlay = n10
export const light_accent_ModalOverlay = n10
export const light_disabled_accent_SheetOverlay = n10
export const light_disabled_accent_DialogOverlay = n10
export const light_disabled_accent_ModalOverlay = n10
export const light_dim_accent_SheetOverlay = n10
export const light_dim_accent_DialogOverlay = n10
export const light_dim_accent_ModalOverlay = n10
export const light_alt1_accent_SheetOverlay = n10
export const light_alt1_accent_DialogOverlay = n10
export const light_alt1_accent_ModalOverlay = n10
export const light_alt2_accent_SheetOverlay = n10
export const light_alt2_accent_DialogOverlay = n10
export const light_alt2_accent_ModalOverlay = n10
export const light_active_accent_SheetOverlay = n10
export const light_active_accent_DialogOverlay = n10
export const light_active_accent_ModalOverlay = n10
export const light_error_accent_SheetOverlay = n10
export const light_error_accent_DialogOverlay = n10
export const light_error_accent_ModalOverlay = n10
export const light_red_accent_SheetOverlay = n10
export const light_red_accent_DialogOverlay = n10
export const light_red_accent_ModalOverlay = n10
export const light_warning_accent_SheetOverlay = n10
export const light_warning_accent_DialogOverlay = n10
export const light_warning_accent_ModalOverlay = n10
export const light_success_accent_SheetOverlay = n10
export const light_success_accent_DialogOverlay = n10
export const light_success_accent_ModalOverlay = n10
const n11 = t([[10, 139]])

export const dark_SheetOverlay = n11
export const dark_DialogOverlay = n11
export const dark_ModalOverlay = n11
export const dark_disabled_SheetOverlay = n11
export const dark_disabled_DialogOverlay = n11
export const dark_disabled_ModalOverlay = n11
export const dark_dim_SheetOverlay = n11
export const dark_dim_DialogOverlay = n11
export const dark_dim_ModalOverlay = n11
export const dark_alt1_SheetOverlay = n11
export const dark_alt1_DialogOverlay = n11
export const dark_alt1_ModalOverlay = n11
export const dark_alt2_SheetOverlay = n11
export const dark_alt2_DialogOverlay = n11
export const dark_alt2_ModalOverlay = n11
export const dark_active_SheetOverlay = n11
export const dark_active_DialogOverlay = n11
export const dark_active_ModalOverlay = n11
export const dark_error_SheetOverlay = n11
export const dark_error_DialogOverlay = n11
export const dark_error_ModalOverlay = n11
export const dark_red_SheetOverlay = n11
export const dark_red_DialogOverlay = n11
export const dark_red_ModalOverlay = n11
export const dark_warning_SheetOverlay = n11
export const dark_warning_DialogOverlay = n11
export const dark_warning_ModalOverlay = n11
export const dark_success_SheetOverlay = n11
export const dark_success_DialogOverlay = n11
export const dark_success_ModalOverlay = n11
export const dark_accent_SheetOverlay = n11
export const dark_accent_DialogOverlay = n11
export const dark_accent_ModalOverlay = n11
export const dark_disabled_accent_SheetOverlay = n11
export const dark_disabled_accent_DialogOverlay = n11
export const dark_disabled_accent_ModalOverlay = n11
export const dark_dim_accent_SheetOverlay = n11
export const dark_dim_accent_DialogOverlay = n11
export const dark_dim_accent_ModalOverlay = n11
export const dark_alt1_accent_SheetOverlay = n11
export const dark_alt1_accent_DialogOverlay = n11
export const dark_alt1_accent_ModalOverlay = n11
export const dark_alt2_accent_SheetOverlay = n11
export const dark_alt2_accent_DialogOverlay = n11
export const dark_alt2_accent_ModalOverlay = n11
export const dark_active_accent_SheetOverlay = n11
export const dark_active_accent_DialogOverlay = n11
export const dark_active_accent_ModalOverlay = n11
export const dark_error_accent_SheetOverlay = n11
export const dark_error_accent_DialogOverlay = n11
export const dark_error_accent_ModalOverlay = n11
export const dark_red_accent_SheetOverlay = n11
export const dark_red_accent_DialogOverlay = n11
export const dark_red_accent_ModalOverlay = n11
export const dark_warning_accent_SheetOverlay = n11
export const dark_warning_accent_DialogOverlay = n11
export const dark_warning_accent_ModalOverlay = n11
export const dark_success_accent_SheetOverlay = n11
export const dark_success_accent_DialogOverlay = n11
export const dark_success_accent_ModalOverlay = n11
const n12 = t([[0, 0],[1, 1],[2, 126],[3, 127],[4, 128],[5, 0],[6, 1],[7, 22],[8, 21],[9, 20],[10, 131],[11, 133],[12, 134],[13, 135],[14, 1],[15, 132],[16, 1],[17, 132],[18, 132],[19, 135],[20, 136],[21, 137],[22, 136],[23, 0],[24, 129],[25, 130],[26, 131],[27, 133],[28, 134],[29, 135],[30, 136],[31, 137],[32, 132],[33, 1],[34, 1]])

export const light_accent_Button = n12
export const light_accent_Switch = n12
export const dark_accent_Button = n12
export const dark_accent_Switch = n12
const n13 = t([[2, 4],[3, 5],[4, 10],[5, 11],[6, 14],[7, 13],[8, 6],[9, 7],[10, 11],[11, 12],[12, 15],[13, 16],[14, 19],[15, 18],[16, 19],[17, 18],[18, 18],[19, 16],[20, 17],[21, 18],[22, 17],[23, 11],[24, 12],[25, 15],[26, 16],[27, 17],[28, 18],[29, 19],[30, 14],[31, 13],[32, 6],[33, 7],[34, 8]])

export const light_disabled = n13
const n14 = t([[2, 3],[3, 4],[4, 5],[5, 10],[6, 13],[7, 6],[8, 7],[9, 8],[10, 10],[11, 11],[12, 12],[13, 15],[14, 14],[15, 19],[16, 14],[17, 19],[18, 19],[19, 15],[20, 16],[21, 17],[22, 16],[23, 10],[24, 11],[25, 12],[26, 15],[27, 16],[28, 17],[29, 18],[30, 19],[31, 14],[32, 13],[33, 6],[34, 7]])

export const light_dim = n14
const n15 = t([[2, 3],[3, 4],[4, 5],[5, 10],[6, 13],[7, 6],[8, 7],[9, 8],[10, 10],[11, 11],[12, 12],[13, 15],[14, 14],[15, 19],[16, 14],[17, 19],[18, 19],[19, 15],[20, 16],[21, 17],[22, 16],[23, 10],[24, 11],[25, 12],[26, 15],[27, 16],[28, 17],[29, 18],[30, 19],[31, 19],[32, 19],[33, 19],[34, 19]])

export const light_alt1 = n15
const n16 = t([[2, 4],[3, 5],[4, 10],[5, 11],[6, 14],[7, 13],[8, 6],[9, 7],[10, 11],[11, 12],[12, 15],[13, 16],[14, 19],[15, 18],[16, 19],[17, 18],[18, 18],[19, 16],[20, 17],[21, 18],[22, 17],[23, 11],[24, 12],[25, 15],[26, 16],[27, 17],[28, 18],[29, 19],[30, 19],[31, 19],[32, 19],[33, 19],[34, 19]])

export const light_alt2 = n16
const n17 = t([[2, 140],[3, 2],[4, 3],[5, 4],[6, 7],[7, 8],[8, 9],[9, 141],[10, 4],[11, 5],[12, 10],[13, 11],[15, 13],[16, 6],[17, 13],[18, 13],[19, 11],[20, 12],[21, 15],[22, 12],[23, 4],[24, 5],[25, 10],[26, 11],[27, 12],[28, 15],[29, 16],[30, 17],[31, 18],[32, 19],[33, 14],[34, 13]])

export const light_active = n17
const n18 = t([[2, 22],[3, 1],[4, 27],[5, 28],[6, 14],[7, 30],[8, 23],[9, 24],[10, 28],[11, 29],[12, 31],[13, 32],[14, 35],[15, 34],[16, 35],[17, 34],[18, 34],[19, 32],[20, 33],[21, 34],[22, 33],[23, 28],[24, 29],[25, 31],[26, 32],[27, 33],[28, 34],[29, 35],[30, 14],[31, 30],[32, 23],[33, 24],[34, 25]])

export const dark_disabled = n18
const n19 = t([[2, 21],[3, 22],[4, 1],[5, 27],[6, 30],[7, 23],[8, 24],[9, 25],[10, 27],[11, 28],[12, 29],[13, 31],[14, 14],[15, 35],[16, 14],[17, 35],[18, 35],[19, 31],[20, 32],[21, 33],[22, 32],[23, 27],[24, 28],[25, 29],[26, 31],[27, 32],[28, 33],[29, 34],[30, 35],[31, 14],[32, 30],[33, 23],[34, 24]])

export const dark_dim = n19
const n20 = t([[2, 21],[3, 22],[4, 1],[5, 27],[6, 30],[7, 23],[8, 24],[9, 25],[10, 27],[11, 28],[12, 29],[13, 31],[14, 14],[15, 35],[16, 14],[17, 35],[18, 35],[19, 31],[20, 32],[21, 33],[22, 32],[23, 27],[24, 28],[25, 29],[26, 31],[27, 32],[28, 33],[29, 34],[30, 35],[31, 35],[32, 35],[33, 35],[34, 35]])

export const dark_alt1 = n20
const n21 = t([[2, 22],[3, 1],[4, 27],[5, 28],[6, 14],[7, 30],[8, 23],[9, 24],[10, 28],[11, 29],[12, 31],[13, 32],[14, 35],[15, 34],[16, 35],[17, 34],[18, 34],[19, 32],[20, 33],[21, 34],[22, 33],[23, 28],[24, 29],[25, 31],[26, 32],[27, 33],[28, 34],[29, 35],[30, 35],[31, 35],[32, 35],[33, 35],[34, 35]])

export const dark_alt2 = n21
const n22 = t([[2, 142],[3, 20],[4, 21],[5, 22],[6, 24],[7, 25],[8, 26],[9, 143],[10, 22],[11, 1],[12, 27],[13, 28],[15, 30],[16, 23],[17, 30],[18, 30],[19, 28],[20, 29],[21, 31],[22, 29],[23, 22],[24, 1],[25, 27],[26, 28],[27, 29],[28, 31],[29, 32],[30, 33],[31, 34],[32, 35],[33, 14],[34, 30]])

export const dark_active = n22
const n23 = t([[2, 3],[3, 4],[4, 5],[5, 10],[6, 13],[7, 6],[8, 7],[9, 8],[10, 10],[11, 11],[12, 12],[13, 15],[14, 13],[15, 14],[16, 13],[17, 14],[18, 19],[19, 15],[20, 16],[21, 17],[22, 16]])

export const light_Card = n23
export const light_DrawerFrame = n23
export const light_Progress = n23
export const light_TooltipArrow = n23
const n24 = t([[2, 4],[3, 5],[4, 10],[5, 11],[6, 14],[7, 13],[8, 6],[9, 7],[10, 11],[11, 12],[12, 15],[13, 16],[14, 13],[15, 14],[16, 13],[17, 14],[18, 18],[19, 16],[20, 17],[21, 18],[22, 17]])

export const light_Button = n24
export const light_Switch = n24
export const light_TooltipContent = n24
export const light_SliderTrack = n24
const n25 = t([[0, 140],[1, 140],[2, 2],[3, 3],[4, 4],[5, 5],[6, 6],[7, 7],[8, 8],[9, 9],[10, 5],[11, 10],[12, 11],[13, 12],[14, 13],[15, 14],[16, 13],[17, 14],[18, 14],[19, 16],[20, 17],[21, 18],[22, 17]])

export const light_Checkbox = n25
export const light_RadioGroupItem = n25
export const light_Input = n25
export const light_TextArea = n25
const n26 = t([[0, 140],[1, 140],[2, 9],[3, 8],[4, 7],[5, 6],[6, 5],[7, 4],[8, 3],[9, 2],[10, 6],[11, 13],[12, 14],[13, 19],[14, 10],[15, 11],[16, 10],[17, 11],[18, 11],[19, 19],[20, 18],[21, 17],[22, 18]])

export const light_SwitchThumb = n26
export const light_SliderThumb = n26
export const light_Tooltip = n26
export const light_ProgressIndicator = n26
const n27 = t([[0, 140],[1, 140],[2, 7],[3, 6],[4, 13],[5, 14],[6, 11],[7, 10],[8, 5],[9, 4],[10, 14],[11, 19],[12, 18],[13, 17],[14, 10],[15, 11],[16, 10],[17, 11],[18, 15],[19, 17],[20, 16],[21, 15],[22, 16]])

export const light_SliderTrackActive = n27
const n28 = t([[2, 21],[3, 22],[4, 1],[5, 27],[6, 30],[7, 23],[8, 24],[9, 25],[10, 27],[11, 28],[12, 29],[13, 31],[14, 30],[15, 14],[16, 30],[17, 14],[18, 35],[19, 31],[20, 32],[21, 33],[22, 32]])

export const dark_Card = n28
export const dark_DrawerFrame = n28
export const dark_Progress = n28
export const dark_TooltipArrow = n28
const n29 = t([[2, 22],[3, 1],[4, 27],[5, 28],[6, 14],[7, 30],[8, 23],[9, 24],[10, 28],[11, 29],[12, 31],[13, 32],[14, 30],[15, 14],[16, 30],[17, 14],[18, 34],[19, 32],[20, 33],[21, 34],[22, 33]])

export const dark_Button = n29
export const dark_Switch = n29
export const dark_TooltipContent = n29
export const dark_SliderTrack = n29
const n30 = t([[0, 142],[1, 142],[2, 20],[3, 21],[4, 22],[5, 1],[6, 23],[7, 24],[8, 25],[9, 26],[10, 1],[11, 27],[12, 28],[13, 29],[14, 30],[15, 14],[16, 30],[17, 14],[18, 14],[19, 32],[20, 33],[21, 34],[22, 33]])

export const dark_Checkbox = n30
export const dark_RadioGroupItem = n30
export const dark_Input = n30
export const dark_TextArea = n30
const n31 = t([[0, 142],[1, 142],[2, 26],[3, 25],[4, 24],[5, 23],[6, 1],[7, 22],[8, 21],[9, 20],[10, 23],[11, 30],[12, 14],[13, 35],[14, 27],[15, 28],[16, 27],[17, 28],[18, 28],[19, 35],[20, 34],[21, 33],[22, 34]])

export const dark_SwitchThumb = n31
export const dark_SliderThumb = n31
export const dark_Tooltip = n31
export const dark_ProgressIndicator = n31
const n32 = t([[0, 142],[1, 142],[2, 24],[3, 23],[4, 30],[5, 14],[6, 28],[7, 27],[8, 1],[9, 22],[10, 14],[11, 35],[12, 34],[13, 33],[14, 27],[15, 28],[16, 27],[17, 28],[18, 31],[19, 33],[20, 32],[21, 31],[22, 32]])

export const dark_SliderTrackActive = n32
const n33 = t([[2, 5],[3, 10],[4, 11],[5, 12],[6, 19],[7, 14],[8, 13],[9, 6],[10, 12],[11, 15],[12, 16],[13, 17],[14, 19],[15, 18],[16, 19],[17, 18],[18, 17],[19, 17],[20, 18],[21, 19],[22, 18]])

export const light_disabled_Card = n33
export const light_disabled_DrawerFrame = n33
export const light_disabled_Progress = n33
export const light_disabled_TooltipArrow = n33
export const light_alt2_Card = n33
export const light_alt2_DrawerFrame = n33
export const light_alt2_Progress = n33
export const light_alt2_TooltipArrow = n33
const n34 = t([[2, 10],[3, 11],[4, 12],[5, 15],[6, 18],[7, 19],[8, 14],[9, 13],[10, 15],[11, 16],[12, 17],[13, 18],[14, 19],[15, 18],[16, 19],[17, 18],[18, 16],[19, 18],[20, 19],[21, 14],[22, 19]])

export const light_disabled_Button = n34
export const light_disabled_Switch = n34
export const light_disabled_TooltipContent = n34
export const light_disabled_SliderTrack = n34
export const light_alt2_Button = n34
export const light_alt2_Switch = n34
export const light_alt2_TooltipContent = n34
export const light_alt2_SliderTrack = n34
const n35 = t([[2, 4],[3, 5],[4, 10],[5, 11],[6, 14],[7, 13],[8, 6],[9, 7],[10, 11],[11, 12],[12, 15],[13, 16],[14, 19],[15, 18],[16, 19],[17, 18],[18, 18],[19, 18],[20, 19],[21, 14],[22, 19]])

export const light_disabled_Checkbox = n35
export const light_disabled_RadioGroupItem = n35
export const light_disabled_Input = n35
export const light_disabled_TextArea = n35
export const light_alt2_Checkbox = n35
export const light_alt2_RadioGroupItem = n35
export const light_alt2_Input = n35
export const light_alt2_TextArea = n35
const n36 = t([[2, 7],[3, 6],[4, 13],[5, 14],[6, 11],[7, 10],[8, 5],[9, 4],[10, 14],[11, 19],[12, 18],[13, 17],[14, 12],[15, 15],[16, 12],[17, 15],[18, 15],[19, 17],[20, 16],[21, 15],[22, 16]])

export const light_disabled_SwitchThumb = n36
export const light_disabled_SliderThumb = n36
export const light_disabled_Tooltip = n36
export const light_disabled_ProgressIndicator = n36
export const light_alt2_SwitchThumb = n36
export const light_alt2_SliderThumb = n36
export const light_alt2_Tooltip = n36
export const light_alt2_ProgressIndicator = n36
const n37 = t([[2, 13],[3, 14],[4, 19],[5, 18],[6, 15],[7, 12],[8, 11],[9, 10],[10, 18],[11, 17],[12, 16],[13, 15],[14, 12],[15, 15],[16, 12],[17, 15],[18, 17],[19, 15],[20, 12],[21, 11],[22, 12]])

export const light_disabled_SliderTrackActive = n37
export const light_alt2_SliderTrackActive = n37
const n38 = t([[2, 4],[3, 5],[4, 10],[5, 11],[6, 14],[7, 13],[8, 6],[9, 7],[10, 11],[11, 12],[12, 15],[13, 16],[14, 14],[15, 19],[16, 14],[17, 19],[18, 18],[19, 16],[20, 17],[21, 18],[22, 17]])

export const light_dim_Card = n38
export const light_dim_DrawerFrame = n38
export const light_dim_Progress = n38
export const light_dim_TooltipArrow = n38
export const light_alt1_Card = n38
export const light_alt1_DrawerFrame = n38
export const light_alt1_Progress = n38
export const light_alt1_TooltipArrow = n38
const n39 = t([[2, 5],[3, 10],[4, 11],[5, 12],[6, 19],[7, 14],[8, 13],[9, 6],[10, 12],[11, 15],[12, 16],[13, 17],[14, 14],[15, 19],[16, 14],[17, 19],[18, 17],[19, 17],[20, 18],[21, 19],[22, 18]])

export const light_dim_Button = n39
export const light_dim_Switch = n39
export const light_dim_TooltipContent = n39
export const light_dim_SliderTrack = n39
export const light_alt1_Button = n39
export const light_alt1_Switch = n39
export const light_alt1_TooltipContent = n39
export const light_alt1_SliderTrack = n39
const n40 = t([[2, 3],[3, 4],[4, 5],[5, 10],[6, 13],[7, 6],[8, 7],[9, 8],[10, 10],[11, 11],[12, 12],[13, 15],[14, 14],[15, 19],[16, 14],[17, 19],[18, 19],[19, 17],[20, 18],[21, 19],[22, 18]])

export const light_dim_Checkbox = n40
export const light_dim_RadioGroupItem = n40
export const light_dim_Input = n40
export const light_dim_TextArea = n40
export const light_alt1_Checkbox = n40
export const light_alt1_RadioGroupItem = n40
export const light_alt1_Input = n40
export const light_alt1_TextArea = n40
const n41 = t([[2, 8],[3, 7],[4, 6],[5, 13],[6, 10],[7, 5],[8, 4],[9, 3],[10, 13],[11, 14],[12, 19],[13, 18],[14, 11],[15, 12],[16, 11],[17, 12],[18, 12],[19, 18],[20, 17],[21, 16],[22, 17]])

export const light_dim_SwitchThumb = n41
export const light_dim_SliderThumb = n41
export const light_dim_Tooltip = n41
export const light_dim_ProgressIndicator = n41
export const light_alt1_SwitchThumb = n41
export const light_alt1_SliderThumb = n41
export const light_alt1_Tooltip = n41
export const light_alt1_ProgressIndicator = n41
const n42 = t([[2, 6],[3, 13],[4, 14],[5, 19],[6, 12],[7, 11],[8, 10],[9, 5],[10, 19],[11, 18],[12, 17],[13, 16],[14, 11],[15, 12],[16, 11],[17, 12],[18, 16],[19, 16],[20, 15],[21, 12],[22, 15]])

export const light_dim_SliderTrackActive = n42
export const light_alt1_SliderTrackActive = n42
const n43 = t([[2, 2],[3, 3],[4, 4],[5, 5],[6, 6],[7, 7],[8, 8],[9, 9],[10, 5],[11, 10],[12, 11],[13, 12],[15, 13],[16, 6],[17, 13],[18, 14],[19, 12],[20, 15],[21, 16],[22, 15]])

export const light_active_Card = n43
export const light_active_DrawerFrame = n43
export const light_active_Progress = n43
export const light_active_TooltipArrow = n43
const n44 = t([[2, 3],[3, 4],[4, 5],[5, 10],[6, 13],[7, 6],[8, 7],[9, 8],[10, 10],[11, 11],[12, 12],[13, 15],[15, 13],[16, 6],[17, 13],[18, 19],[19, 15],[20, 16],[21, 17],[22, 16]])

export const light_active_Button = n44
export const light_active_Switch = n44
export const light_active_TooltipContent = n44
export const light_active_SliderTrack = n44
const n45 = t([[2, 140],[3, 2],[4, 3],[5, 4],[6, 7],[7, 8],[8, 9],[9, 141],[10, 4],[11, 5],[12, 10],[13, 11],[15, 13],[16, 6],[17, 13],[18, 13],[19, 15],[20, 16],[21, 17],[22, 16]])

export const light_active_Checkbox = n45
export const light_active_RadioGroupItem = n45
export const light_active_Input = n45
export const light_active_TextArea = n45
const n46 = t([[2, 141],[3, 9],[4, 8],[5, 7],[6, 4],[7, 3],[8, 2],[9, 140],[10, 7],[11, 6],[12, 13],[13, 14],[15, 10],[16, 5],[17, 10],[18, 10],[19, 14],[20, 19],[21, 18],[22, 19]])

export const light_active_SwitchThumb = n46
export const light_active_SliderThumb = n46
export const light_active_Tooltip = n46
export const light_active_ProgressIndicator = n46
const n47 = t([[2, 8],[3, 7],[4, 6],[5, 13],[6, 10],[7, 5],[8, 4],[9, 3],[10, 13],[11, 14],[12, 19],[13, 18],[15, 10],[16, 5],[17, 10],[18, 12],[19, 18],[20, 17],[21, 16],[22, 17]])

export const light_active_SliderTrackActive = n47
const n48 = t([[2, 37],[3, 38],[4, 39],[5, 44],[6, 47],[7, 40],[8, 41],[9, 42],[10, 44],[11, 45],[12, 46],[13, 49],[14, 47],[15, 48],[16, 47],[17, 48],[18, 53],[19, 49],[20, 50],[21, 51],[22, 50]])

export const light_error_Card = n48
export const light_error_DrawerFrame = n48
export const light_error_Progress = n48
export const light_error_TooltipArrow = n48
export const light_red_Card = n48
export const light_red_DrawerFrame = n48
export const light_red_Progress = n48
export const light_red_TooltipArrow = n48
const n49 = t([[2, 38],[3, 39],[4, 44],[5, 45],[6, 48],[7, 47],[8, 40],[9, 41],[10, 45],[11, 46],[12, 49],[13, 50],[14, 47],[15, 48],[16, 47],[17, 48],[18, 52],[19, 50],[20, 51],[21, 52],[22, 51]])

export const light_error_Button = n49
export const light_error_Switch = n49
export const light_error_TooltipContent = n49
export const light_error_SliderTrack = n49
export const light_red_Button = n49
export const light_red_Switch = n49
export const light_red_TooltipContent = n49
export const light_red_SliderTrack = n49
const n50 = t([[0, 144],[1, 144],[2, 36],[3, 37],[4, 38],[5, 39],[6, 40],[7, 41],[8, 42],[9, 43],[10, 39],[11, 44],[12, 45],[13, 46],[14, 47],[15, 48],[16, 47],[17, 48],[18, 48],[19, 50],[20, 51],[21, 52],[22, 51]])

export const light_error_Checkbox = n50
export const light_error_RadioGroupItem = n50
export const light_error_Input = n50
export const light_error_TextArea = n50
export const light_red_Checkbox = n50
export const light_red_RadioGroupItem = n50
export const light_red_Input = n50
export const light_red_TextArea = n50
const n51 = t([[0, 144],[1, 144],[2, 43],[3, 42],[4, 41],[5, 40],[6, 39],[7, 38],[8, 37],[9, 36],[10, 40],[11, 47],[12, 48],[13, 53],[14, 44],[15, 45],[16, 44],[17, 45],[18, 45],[19, 53],[20, 52],[21, 51],[22, 52]])

export const light_error_SwitchThumb = n51
export const light_error_SliderThumb = n51
export const light_error_Tooltip = n51
export const light_error_ProgressIndicator = n51
export const light_red_SwitchThumb = n51
export const light_red_SliderThumb = n51
export const light_red_Tooltip = n51
export const light_red_ProgressIndicator = n51
const n52 = t([[0, 144],[1, 144],[2, 41],[3, 40],[4, 47],[5, 48],[6, 45],[7, 44],[8, 39],[9, 38],[10, 48],[11, 53],[12, 52],[13, 51],[14, 44],[15, 45],[16, 44],[17, 45],[18, 49],[19, 51],[20, 50],[21, 49],[22, 50]])

export const light_error_SliderTrackActive = n52
export const light_red_SliderTrackActive = n52
const n53 = t([[2, 55],[3, 56],[4, 57],[5, 62],[6, 65],[7, 58],[8, 59],[9, 60],[10, 62],[11, 63],[12, 64],[13, 67],[14, 65],[15, 66],[16, 65],[17, 66],[18, 71],[19, 67],[20, 68],[21, 69],[22, 68]])

export const light_warning_Card = n53
export const light_warning_DrawerFrame = n53
export const light_warning_Progress = n53
export const light_warning_TooltipArrow = n53
const n54 = t([[2, 56],[3, 57],[4, 62],[5, 63],[6, 66],[7, 65],[8, 58],[9, 59],[10, 63],[11, 64],[12, 67],[13, 68],[14, 65],[15, 66],[16, 65],[17, 66],[18, 70],[19, 68],[20, 69],[21, 70],[22, 69]])

export const light_warning_Button = n54
export const light_warning_Switch = n54
export const light_warning_TooltipContent = n54
export const light_warning_SliderTrack = n54
const n55 = t([[0, 145],[1, 145],[2, 54],[3, 55],[4, 56],[5, 57],[6, 58],[7, 59],[8, 60],[9, 61],[10, 57],[11, 62],[12, 63],[13, 64],[14, 65],[15, 66],[16, 65],[17, 66],[18, 66],[19, 68],[20, 69],[21, 70],[22, 69]])

export const light_warning_Checkbox = n55
export const light_warning_RadioGroupItem = n55
export const light_warning_Input = n55
export const light_warning_TextArea = n55
const n56 = t([[0, 145],[1, 145],[2, 61],[3, 60],[4, 59],[5, 58],[6, 57],[7, 56],[8, 55],[9, 54],[10, 58],[11, 65],[12, 66],[13, 71],[14, 62],[15, 63],[16, 62],[17, 63],[18, 63],[19, 71],[20, 70],[21, 69],[22, 70]])

export const light_warning_SwitchThumb = n56
export const light_warning_SliderThumb = n56
export const light_warning_Tooltip = n56
export const light_warning_ProgressIndicator = n56
const n57 = t([[0, 145],[1, 145],[2, 59],[3, 58],[4, 65],[5, 66],[6, 63],[7, 62],[8, 57],[9, 56],[10, 66],[11, 71],[12, 70],[13, 69],[14, 62],[15, 63],[16, 62],[17, 63],[18, 67],[19, 69],[20, 68],[21, 67],[22, 68]])

export const light_warning_SliderTrackActive = n57
const n58 = t([[2, 73],[3, 74],[4, 75],[5, 80],[6, 83],[7, 76],[8, 77],[9, 78],[10, 80],[11, 81],[12, 82],[13, 85],[14, 83],[15, 84],[16, 83],[17, 84],[18, 89],[19, 85],[20, 86],[21, 87],[22, 86]])

export const light_success_Card = n58
export const light_success_DrawerFrame = n58
export const light_success_Progress = n58
export const light_success_TooltipArrow = n58
const n59 = t([[2, 74],[3, 75],[4, 80],[5, 81],[6, 84],[7, 83],[8, 76],[9, 77],[10, 81],[11, 82],[12, 85],[13, 86],[14, 83],[15, 84],[16, 83],[17, 84],[18, 88],[19, 86],[20, 87],[21, 88],[22, 87]])

export const light_success_Button = n59
export const light_success_Switch = n59
export const light_success_TooltipContent = n59
export const light_success_SliderTrack = n59
const n60 = t([[0, 146],[1, 146],[2, 72],[3, 73],[4, 74],[5, 75],[6, 76],[7, 77],[8, 78],[9, 79],[10, 75],[11, 80],[12, 81],[13, 82],[14, 83],[15, 84],[16, 83],[17, 84],[18, 84],[19, 86],[20, 87],[21, 88],[22, 87]])

export const light_success_Checkbox = n60
export const light_success_RadioGroupItem = n60
export const light_success_Input = n60
export const light_success_TextArea = n60
const n61 = t([[0, 146],[1, 146],[2, 79],[3, 78],[4, 77],[5, 76],[6, 75],[7, 74],[8, 73],[9, 72],[10, 76],[11, 83],[12, 84],[13, 89],[14, 80],[15, 81],[16, 80],[17, 81],[18, 81],[19, 89],[20, 88],[21, 87],[22, 88]])

export const light_success_SwitchThumb = n61
export const light_success_SliderThumb = n61
export const light_success_Tooltip = n61
export const light_success_ProgressIndicator = n61
const n62 = t([[0, 146],[1, 146],[2, 77],[3, 76],[4, 83],[5, 84],[6, 81],[7, 80],[8, 75],[9, 74],[10, 84],[11, 89],[12, 88],[13, 87],[14, 80],[15, 81],[16, 80],[17, 81],[18, 85],[19, 87],[20, 86],[21, 85],[22, 86]])

export const light_success_SliderTrackActive = n62
const n63 = t([[2, 1],[3, 27],[4, 28],[5, 29],[6, 35],[7, 14],[8, 30],[9, 23],[10, 29],[11, 31],[12, 32],[13, 33],[14, 35],[15, 34],[16, 35],[17, 34],[18, 33],[19, 33],[20, 34],[21, 35],[22, 34]])

export const dark_disabled_Card = n63
export const dark_disabled_DrawerFrame = n63
export const dark_disabled_Progress = n63
export const dark_disabled_TooltipArrow = n63
export const dark_alt2_Card = n63
export const dark_alt2_DrawerFrame = n63
export const dark_alt2_Progress = n63
export const dark_alt2_TooltipArrow = n63
const n64 = t([[2, 27],[3, 28],[4, 29],[5, 31],[6, 34],[7, 35],[8, 14],[9, 30],[10, 31],[11, 32],[12, 33],[13, 34],[14, 35],[15, 34],[16, 35],[17, 34],[18, 32],[19, 34],[20, 35],[21, 14],[22, 35]])

export const dark_disabled_Button = n64
export const dark_disabled_Switch = n64
export const dark_disabled_TooltipContent = n64
export const dark_disabled_SliderTrack = n64
export const dark_alt2_Button = n64
export const dark_alt2_Switch = n64
export const dark_alt2_TooltipContent = n64
export const dark_alt2_SliderTrack = n64
const n65 = t([[2, 22],[3, 1],[4, 27],[5, 28],[6, 14],[7, 30],[8, 23],[9, 24],[10, 28],[11, 29],[12, 31],[13, 32],[14, 35],[15, 34],[16, 35],[17, 34],[18, 34],[19, 34],[20, 35],[21, 14],[22, 35]])

export const dark_disabled_Checkbox = n65
export const dark_disabled_RadioGroupItem = n65
export const dark_disabled_Input = n65
export const dark_disabled_TextArea = n65
export const dark_alt2_Checkbox = n65
export const dark_alt2_RadioGroupItem = n65
export const dark_alt2_Input = n65
export const dark_alt2_TextArea = n65
const n66 = t([[2, 24],[3, 23],[4, 30],[5, 14],[6, 28],[7, 27],[8, 1],[9, 22],[10, 14],[11, 35],[12, 34],[13, 33],[14, 29],[15, 31],[16, 29],[17, 31],[18, 31],[19, 33],[20, 32],[21, 31],[22, 32]])

export const dark_disabled_SwitchThumb = n66
export const dark_disabled_SliderThumb = n66
export const dark_disabled_Tooltip = n66
export const dark_disabled_ProgressIndicator = n66
export const dark_alt2_SwitchThumb = n66
export const dark_alt2_SliderThumb = n66
export const dark_alt2_Tooltip = n66
export const dark_alt2_ProgressIndicator = n66
const n67 = t([[2, 30],[3, 14],[4, 35],[5, 34],[6, 31],[7, 29],[8, 28],[9, 27],[10, 34],[11, 33],[12, 32],[13, 31],[14, 29],[15, 31],[16, 29],[17, 31],[18, 33],[19, 31],[20, 29],[21, 28],[22, 29]])

export const dark_disabled_SliderTrackActive = n67
export const dark_alt2_SliderTrackActive = n67
const n68 = t([[2, 22],[3, 1],[4, 27],[5, 28],[6, 14],[7, 30],[8, 23],[9, 24],[10, 28],[11, 29],[12, 31],[13, 32],[14, 14],[15, 35],[16, 14],[17, 35],[18, 34],[19, 32],[20, 33],[21, 34],[22, 33]])

export const dark_dim_Card = n68
export const dark_dim_DrawerFrame = n68
export const dark_dim_Progress = n68
export const dark_dim_TooltipArrow = n68
export const dark_alt1_Card = n68
export const dark_alt1_DrawerFrame = n68
export const dark_alt1_Progress = n68
export const dark_alt1_TooltipArrow = n68
const n69 = t([[2, 1],[3, 27],[4, 28],[5, 29],[6, 35],[7, 14],[8, 30],[9, 23],[10, 29],[11, 31],[12, 32],[13, 33],[14, 14],[15, 35],[16, 14],[17, 35],[18, 33],[19, 33],[20, 34],[21, 35],[22, 34]])

export const dark_dim_Button = n69
export const dark_dim_Switch = n69
export const dark_dim_TooltipContent = n69
export const dark_dim_SliderTrack = n69
export const dark_alt1_Button = n69
export const dark_alt1_Switch = n69
export const dark_alt1_TooltipContent = n69
export const dark_alt1_SliderTrack = n69
const n70 = t([[2, 21],[3, 22],[4, 1],[5, 27],[6, 30],[7, 23],[8, 24],[9, 25],[10, 27],[11, 28],[12, 29],[13, 31],[14, 14],[15, 35],[16, 14],[17, 35],[18, 35],[19, 33],[20, 34],[21, 35],[22, 34]])

export const dark_dim_Checkbox = n70
export const dark_dim_RadioGroupItem = n70
export const dark_dim_Input = n70
export const dark_dim_TextArea = n70
export const dark_alt1_Checkbox = n70
export const dark_alt1_RadioGroupItem = n70
export const dark_alt1_Input = n70
export const dark_alt1_TextArea = n70
const n71 = t([[2, 25],[3, 24],[4, 23],[5, 30],[6, 27],[7, 1],[8, 22],[9, 21],[10, 30],[11, 14],[12, 35],[13, 34],[14, 28],[15, 29],[16, 28],[17, 29],[18, 29],[19, 34],[20, 33],[21, 32],[22, 33]])

export const dark_dim_SwitchThumb = n71
export const dark_dim_SliderThumb = n71
export const dark_dim_Tooltip = n71
export const dark_dim_ProgressIndicator = n71
export const dark_alt1_SwitchThumb = n71
export const dark_alt1_SliderThumb = n71
export const dark_alt1_Tooltip = n71
export const dark_alt1_ProgressIndicator = n71
const n72 = t([[2, 23],[3, 30],[4, 14],[5, 35],[6, 29],[7, 28],[8, 27],[9, 1],[10, 35],[11, 34],[12, 33],[13, 32],[14, 28],[15, 29],[16, 28],[17, 29],[18, 32],[19, 32],[20, 31],[21, 29],[22, 31]])

export const dark_dim_SliderTrackActive = n72
export const dark_alt1_SliderTrackActive = n72
const n73 = t([[2, 20],[3, 21],[4, 22],[5, 1],[6, 23],[7, 24],[8, 25],[9, 26],[10, 1],[11, 27],[12, 28],[13, 29],[15, 30],[16, 23],[17, 30],[18, 14],[19, 29],[20, 31],[21, 32],[22, 31]])

export const dark_active_Card = n73
export const dark_active_DrawerFrame = n73
export const dark_active_Progress = n73
export const dark_active_TooltipArrow = n73
const n74 = t([[2, 21],[3, 22],[4, 1],[5, 27],[6, 30],[7, 23],[8, 24],[9, 25],[10, 27],[11, 28],[12, 29],[13, 31],[15, 30],[16, 23],[17, 30],[18, 35],[19, 31],[20, 32],[21, 33],[22, 32]])

export const dark_active_Button = n74
export const dark_active_Switch = n74
export const dark_active_TooltipContent = n74
export const dark_active_SliderTrack = n74
const n75 = t([[2, 142],[3, 20],[4, 21],[5, 22],[6, 24],[7, 25],[8, 26],[9, 143],[10, 22],[11, 1],[12, 27],[13, 28],[15, 30],[16, 23],[17, 30],[18, 30],[19, 31],[20, 32],[21, 33],[22, 32]])

export const dark_active_Checkbox = n75
export const dark_active_RadioGroupItem = n75
export const dark_active_Input = n75
export const dark_active_TextArea = n75
const n76 = t([[2, 143],[3, 26],[4, 25],[5, 24],[6, 22],[7, 21],[8, 20],[9, 142],[10, 24],[11, 23],[12, 30],[13, 14],[15, 27],[16, 1],[17, 27],[18, 27],[19, 14],[20, 35],[21, 34],[22, 35]])

export const dark_active_SwitchThumb = n76
export const dark_active_SliderThumb = n76
export const dark_active_Tooltip = n76
export const dark_active_ProgressIndicator = n76
const n77 = t([[2, 25],[3, 24],[4, 23],[5, 30],[6, 27],[7, 1],[8, 22],[9, 21],[10, 30],[11, 14],[12, 35],[13, 34],[15, 27],[16, 1],[17, 27],[18, 29],[19, 34],[20, 33],[21, 32],[22, 33]])

export const dark_active_SliderTrackActive = n77
const n78 = t([[2, 42],[3, 41],[4, 40],[5, 94],[6, 44],[7, 90],[8, 91],[9, 92],[10, 94],[11, 95],[12, 96],[13, 97],[14, 44],[15, 48],[16, 44],[17, 48],[18, 101],[19, 97],[20, 98],[21, 99],[22, 98]])

export const dark_error_Card = n78
export const dark_error_DrawerFrame = n78
export const dark_error_Progress = n78
export const dark_error_TooltipArrow = n78
export const dark_red_Card = n78
export const dark_red_DrawerFrame = n78
export const dark_red_Progress = n78
export const dark_red_TooltipArrow = n78
const n79 = t([[2, 41],[3, 40],[4, 94],[5, 95],[6, 48],[7, 44],[8, 90],[9, 91],[10, 95],[11, 96],[12, 97],[13, 98],[14, 44],[15, 48],[16, 44],[17, 48],[18, 100],[19, 98],[20, 99],[21, 100],[22, 99]])

export const dark_error_Button = n79
export const dark_error_Switch = n79
export const dark_error_TooltipContent = n79
export const dark_error_SliderTrack = n79
export const dark_red_Button = n79
export const dark_red_Switch = n79
export const dark_red_TooltipContent = n79
export const dark_red_SliderTrack = n79
const n80 = t([[0, 147],[1, 147],[2, 43],[3, 42],[4, 41],[5, 40],[6, 90],[7, 91],[8, 92],[9, 93],[10, 40],[11, 94],[12, 95],[13, 96],[14, 44],[15, 48],[16, 44],[17, 48],[18, 48],[19, 98],[20, 99],[21, 100],[22, 99]])

export const dark_error_Checkbox = n80
export const dark_error_RadioGroupItem = n80
export const dark_error_Input = n80
export const dark_error_TextArea = n80
export const dark_red_Checkbox = n80
export const dark_red_RadioGroupItem = n80
export const dark_red_Input = n80
export const dark_red_TextArea = n80
const n81 = t([[0, 147],[1, 147],[2, 93],[3, 92],[4, 91],[5, 90],[6, 40],[7, 41],[8, 42],[9, 43],[10, 90],[11, 44],[12, 48],[13, 101],[14, 94],[15, 95],[16, 94],[17, 95],[18, 95],[19, 101],[20, 100],[21, 99],[22, 100]])

export const dark_error_SwitchThumb = n81
export const dark_error_SliderThumb = n81
export const dark_error_Tooltip = n81
export const dark_error_ProgressIndicator = n81
export const dark_red_SwitchThumb = n81
export const dark_red_SliderThumb = n81
export const dark_red_Tooltip = n81
export const dark_red_ProgressIndicator = n81
const n82 = t([[0, 147],[1, 147],[2, 91],[3, 90],[4, 44],[5, 48],[6, 95],[7, 94],[8, 40],[9, 41],[10, 48],[11, 101],[12, 100],[13, 99],[14, 94],[15, 95],[16, 94],[17, 95],[18, 97],[19, 99],[20, 98],[21, 97],[22, 98]])

export const dark_error_SliderTrackActive = n82
export const dark_red_SliderTrackActive = n82
const n83 = t([[2, 60],[3, 59],[4, 58],[5, 106],[6, 62],[7, 102],[8, 103],[9, 104],[10, 106],[11, 107],[12, 108],[13, 109],[14, 62],[15, 66],[16, 62],[17, 66],[18, 113],[19, 109],[20, 110],[21, 111],[22, 110]])

export const dark_warning_Card = n83
export const dark_warning_DrawerFrame = n83
export const dark_warning_Progress = n83
export const dark_warning_TooltipArrow = n83
const n84 = t([[2, 59],[3, 58],[4, 106],[5, 107],[6, 66],[7, 62],[8, 102],[9, 103],[10, 107],[11, 108],[12, 109],[13, 110],[14, 62],[15, 66],[16, 62],[17, 66],[18, 112],[19, 110],[20, 111],[21, 112],[22, 111]])

export const dark_warning_Button = n84
export const dark_warning_Switch = n84
export const dark_warning_TooltipContent = n84
export const dark_warning_SliderTrack = n84
const n85 = t([[0, 148],[1, 148],[2, 61],[3, 60],[4, 59],[5, 58],[6, 102],[7, 103],[8, 104],[9, 105],[10, 58],[11, 106],[12, 107],[13, 108],[14, 62],[15, 66],[16, 62],[17, 66],[18, 66],[19, 110],[20, 111],[21, 112],[22, 111]])

export const dark_warning_Checkbox = n85
export const dark_warning_RadioGroupItem = n85
export const dark_warning_Input = n85
export const dark_warning_TextArea = n85
const n86 = t([[0, 148],[1, 148],[2, 105],[3, 104],[4, 103],[5, 102],[6, 58],[7, 59],[8, 60],[9, 61],[10, 102],[11, 62],[12, 66],[13, 113],[14, 106],[15, 107],[16, 106],[17, 107],[18, 107],[19, 113],[20, 112],[21, 111],[22, 112]])

export const dark_warning_SwitchThumb = n86
export const dark_warning_SliderThumb = n86
export const dark_warning_Tooltip = n86
export const dark_warning_ProgressIndicator = n86
const n87 = t([[0, 148],[1, 148],[2, 103],[3, 102],[4, 62],[5, 66],[6, 107],[7, 106],[8, 58],[9, 59],[10, 66],[11, 113],[12, 112],[13, 111],[14, 106],[15, 107],[16, 106],[17, 107],[18, 109],[19, 111],[20, 110],[21, 109],[22, 110]])

export const dark_warning_SliderTrackActive = n87
const n88 = t([[2, 78],[3, 77],[4, 76],[5, 118],[6, 80],[7, 114],[8, 115],[9, 116],[10, 118],[11, 119],[12, 120],[13, 121],[14, 80],[15, 84],[16, 80],[17, 84],[18, 125],[19, 121],[20, 122],[21, 123],[22, 122]])

export const dark_success_Card = n88
export const dark_success_DrawerFrame = n88
export const dark_success_Progress = n88
export const dark_success_TooltipArrow = n88
const n89 = t([[2, 77],[3, 76],[4, 118],[5, 119],[6, 84],[7, 80],[8, 114],[9, 115],[10, 119],[11, 120],[12, 121],[13, 122],[14, 80],[15, 84],[16, 80],[17, 84],[18, 124],[19, 122],[20, 123],[21, 124],[22, 123]])

export const dark_success_Button = n89
export const dark_success_Switch = n89
export const dark_success_TooltipContent = n89
export const dark_success_SliderTrack = n89
const n90 = t([[0, 149],[1, 149],[2, 79],[3, 78],[4, 77],[5, 76],[6, 114],[7, 115],[8, 116],[9, 117],[10, 76],[11, 118],[12, 119],[13, 120],[14, 80],[15, 84],[16, 80],[17, 84],[18, 84],[19, 122],[20, 123],[21, 124],[22, 123]])

export const dark_success_Checkbox = n90
export const dark_success_RadioGroupItem = n90
export const dark_success_Input = n90
export const dark_success_TextArea = n90
const n91 = t([[0, 149],[1, 149],[2, 117],[3, 116],[4, 115],[5, 114],[6, 76],[7, 77],[8, 78],[9, 79],[10, 114],[11, 80],[12, 84],[13, 125],[14, 118],[15, 119],[16, 118],[17, 119],[18, 119],[19, 125],[20, 124],[21, 123],[22, 124]])

export const dark_success_SwitchThumb = n91
export const dark_success_SliderThumb = n91
export const dark_success_Tooltip = n91
export const dark_success_ProgressIndicator = n91
const n92 = t([[0, 149],[1, 149],[2, 115],[3, 114],[4, 80],[5, 84],[6, 119],[7, 118],[8, 76],[9, 77],[10, 84],[11, 125],[12, 124],[13, 123],[14, 118],[15, 119],[16, 118],[17, 119],[18, 121],[19, 123],[20, 122],[21, 121],[22, 122]])

export const dark_success_SliderTrackActive = n92
const n93 = t([[2, 127],[3, 128],[4, 0],[5, 129],[6, 1],[7, 1],[8, 22],[9, 21],[10, 129],[11, 130],[12, 131],[13, 133],[14, 1],[15, 132],[16, 1],[17, 132],[18, 137],[19, 133],[20, 134],[21, 135],[22, 134]])

export const light_accent_Card = n93
export const light_accent_DrawerFrame = n93
export const light_accent_Progress = n93
export const light_accent_TooltipArrow = n93
export const dark_accent_Card = n93
export const dark_accent_DrawerFrame = n93
export const dark_accent_Progress = n93
export const dark_accent_TooltipArrow = n93
export const light_disabled_accent_Card = n93
export const light_disabled_accent_DrawerFrame = n93
export const light_disabled_accent_Progress = n93
export const light_disabled_accent_TooltipArrow = n93
export const light_dim_accent_Card = n93
export const light_dim_accent_DrawerFrame = n93
export const light_dim_accent_Progress = n93
export const light_dim_accent_TooltipArrow = n93
export const light_alt1_accent_Card = n93
export const light_alt1_accent_DrawerFrame = n93
export const light_alt1_accent_Progress = n93
export const light_alt1_accent_TooltipArrow = n93
export const light_alt2_accent_Card = n93
export const light_alt2_accent_DrawerFrame = n93
export const light_alt2_accent_Progress = n93
export const light_alt2_accent_TooltipArrow = n93
export const light_active_accent_Card = n93
export const light_active_accent_DrawerFrame = n93
export const light_active_accent_Progress = n93
export const light_active_accent_TooltipArrow = n93
export const light_error_accent_Card = n93
export const light_error_accent_DrawerFrame = n93
export const light_error_accent_Progress = n93
export const light_error_accent_TooltipArrow = n93
export const light_red_accent_Card = n93
export const light_red_accent_DrawerFrame = n93
export const light_red_accent_Progress = n93
export const light_red_accent_TooltipArrow = n93
export const light_warning_accent_Card = n93
export const light_warning_accent_DrawerFrame = n93
export const light_warning_accent_Progress = n93
export const light_warning_accent_TooltipArrow = n93
export const light_success_accent_Card = n93
export const light_success_accent_DrawerFrame = n93
export const light_success_accent_Progress = n93
export const light_success_accent_TooltipArrow = n93
export const dark_disabled_accent_Card = n93
export const dark_disabled_accent_DrawerFrame = n93
export const dark_disabled_accent_Progress = n93
export const dark_disabled_accent_TooltipArrow = n93
export const dark_dim_accent_Card = n93
export const dark_dim_accent_DrawerFrame = n93
export const dark_dim_accent_Progress = n93
export const dark_dim_accent_TooltipArrow = n93
export const dark_alt1_accent_Card = n93
export const dark_alt1_accent_DrawerFrame = n93
export const dark_alt1_accent_Progress = n93
export const dark_alt1_accent_TooltipArrow = n93
export const dark_alt2_accent_Card = n93
export const dark_alt2_accent_DrawerFrame = n93
export const dark_alt2_accent_Progress = n93
export const dark_alt2_accent_TooltipArrow = n93
export const dark_active_accent_Card = n93
export const dark_active_accent_DrawerFrame = n93
export const dark_active_accent_Progress = n93
export const dark_active_accent_TooltipArrow = n93
export const dark_error_accent_Card = n93
export const dark_error_accent_DrawerFrame = n93
export const dark_error_accent_Progress = n93
export const dark_error_accent_TooltipArrow = n93
export const dark_red_accent_Card = n93
export const dark_red_accent_DrawerFrame = n93
export const dark_red_accent_Progress = n93
export const dark_red_accent_TooltipArrow = n93
export const dark_warning_accent_Card = n93
export const dark_warning_accent_DrawerFrame = n93
export const dark_warning_accent_Progress = n93
export const dark_warning_accent_TooltipArrow = n93
export const dark_success_accent_Card = n93
export const dark_success_accent_DrawerFrame = n93
export const dark_success_accent_Progress = n93
export const dark_success_accent_TooltipArrow = n93
const n94 = t([[0, 150],[1, 150],[2, 126],[3, 127],[4, 128],[5, 0],[6, 1],[7, 22],[8, 21],[9, 20],[10, 0],[11, 129],[12, 130],[13, 131],[14, 1],[15, 132],[16, 1],[17, 132],[18, 132],[19, 134],[20, 135],[21, 136],[22, 135]])

export const light_accent_Checkbox = n94
export const light_accent_RadioGroupItem = n94
export const light_accent_Input = n94
export const light_accent_TextArea = n94
export const dark_accent_Checkbox = n94
export const dark_accent_RadioGroupItem = n94
export const dark_accent_Input = n94
export const dark_accent_TextArea = n94
export const light_disabled_accent_Checkbox = n94
export const light_disabled_accent_RadioGroupItem = n94
export const light_disabled_accent_Input = n94
export const light_disabled_accent_TextArea = n94
export const light_dim_accent_Checkbox = n94
export const light_dim_accent_RadioGroupItem = n94
export const light_dim_accent_Input = n94
export const light_dim_accent_TextArea = n94
export const light_alt1_accent_Checkbox = n94
export const light_alt1_accent_RadioGroupItem = n94
export const light_alt1_accent_Input = n94
export const light_alt1_accent_TextArea = n94
export const light_alt2_accent_Checkbox = n94
export const light_alt2_accent_RadioGroupItem = n94
export const light_alt2_accent_Input = n94
export const light_alt2_accent_TextArea = n94
export const light_active_accent_Checkbox = n94
export const light_active_accent_RadioGroupItem = n94
export const light_active_accent_Input = n94
export const light_active_accent_TextArea = n94
export const light_error_accent_Checkbox = n94
export const light_error_accent_RadioGroupItem = n94
export const light_error_accent_Input = n94
export const light_error_accent_TextArea = n94
export const light_red_accent_Checkbox = n94
export const light_red_accent_RadioGroupItem = n94
export const light_red_accent_Input = n94
export const light_red_accent_TextArea = n94
export const light_warning_accent_Checkbox = n94
export const light_warning_accent_RadioGroupItem = n94
export const light_warning_accent_Input = n94
export const light_warning_accent_TextArea = n94
export const light_success_accent_Checkbox = n94
export const light_success_accent_RadioGroupItem = n94
export const light_success_accent_Input = n94
export const light_success_accent_TextArea = n94
export const dark_disabled_accent_Checkbox = n94
export const dark_disabled_accent_RadioGroupItem = n94
export const dark_disabled_accent_Input = n94
export const dark_disabled_accent_TextArea = n94
export const dark_dim_accent_Checkbox = n94
export const dark_dim_accent_RadioGroupItem = n94
export const dark_dim_accent_Input = n94
export const dark_dim_accent_TextArea = n94
export const dark_alt1_accent_Checkbox = n94
export const dark_alt1_accent_RadioGroupItem = n94
export const dark_alt1_accent_Input = n94
export const dark_alt1_accent_TextArea = n94
export const dark_alt2_accent_Checkbox = n94
export const dark_alt2_accent_RadioGroupItem = n94
export const dark_alt2_accent_Input = n94
export const dark_alt2_accent_TextArea = n94
export const dark_active_accent_Checkbox = n94
export const dark_active_accent_RadioGroupItem = n94
export const dark_active_accent_Input = n94
export const dark_active_accent_TextArea = n94
export const dark_error_accent_Checkbox = n94
export const dark_error_accent_RadioGroupItem = n94
export const dark_error_accent_Input = n94
export const dark_error_accent_TextArea = n94
export const dark_red_accent_Checkbox = n94
export const dark_red_accent_RadioGroupItem = n94
export const dark_red_accent_Input = n94
export const dark_red_accent_TextArea = n94
export const dark_warning_accent_Checkbox = n94
export const dark_warning_accent_RadioGroupItem = n94
export const dark_warning_accent_Input = n94
export const dark_warning_accent_TextArea = n94
export const dark_success_accent_Checkbox = n94
export const dark_success_accent_RadioGroupItem = n94
export const dark_success_accent_Input = n94
export const dark_success_accent_TextArea = n94
const n95 = t([[0, 150],[1, 150],[2, 20],[3, 21],[4, 22],[5, 1],[6, 0],[7, 128],[8, 127],[9, 126],[10, 1],[11, 1],[12, 132],[13, 137],[14, 129],[15, 130],[16, 129],[17, 130],[18, 130],[19, 137],[20, 136],[21, 135],[22, 136]])

export const light_accent_SwitchThumb = n95
export const light_accent_SliderThumb = n95
export const light_accent_Tooltip = n95
export const light_accent_ProgressIndicator = n95
export const dark_accent_SwitchThumb = n95
export const dark_accent_SliderThumb = n95
export const dark_accent_Tooltip = n95
export const dark_accent_ProgressIndicator = n95
export const light_disabled_accent_SwitchThumb = n95
export const light_disabled_accent_SliderThumb = n95
export const light_disabled_accent_Tooltip = n95
export const light_disabled_accent_ProgressIndicator = n95
export const light_dim_accent_SwitchThumb = n95
export const light_dim_accent_SliderThumb = n95
export const light_dim_accent_Tooltip = n95
export const light_dim_accent_ProgressIndicator = n95
export const light_alt1_accent_SwitchThumb = n95
export const light_alt1_accent_SliderThumb = n95
export const light_alt1_accent_Tooltip = n95
export const light_alt1_accent_ProgressIndicator = n95
export const light_alt2_accent_SwitchThumb = n95
export const light_alt2_accent_SliderThumb = n95
export const light_alt2_accent_Tooltip = n95
export const light_alt2_accent_ProgressIndicator = n95
export const light_active_accent_SwitchThumb = n95
export const light_active_accent_SliderThumb = n95
export const light_active_accent_Tooltip = n95
export const light_active_accent_ProgressIndicator = n95
export const light_error_accent_SwitchThumb = n95
export const light_error_accent_SliderThumb = n95
export const light_error_accent_Tooltip = n95
export const light_error_accent_ProgressIndicator = n95
export const light_red_accent_SwitchThumb = n95
export const light_red_accent_SliderThumb = n95
export const light_red_accent_Tooltip = n95
export const light_red_accent_ProgressIndicator = n95
export const light_warning_accent_SwitchThumb = n95
export const light_warning_accent_SliderThumb = n95
export const light_warning_accent_Tooltip = n95
export const light_warning_accent_ProgressIndicator = n95
export const light_success_accent_SwitchThumb = n95
export const light_success_accent_SliderThumb = n95
export const light_success_accent_Tooltip = n95
export const light_success_accent_ProgressIndicator = n95
export const dark_disabled_accent_SwitchThumb = n95
export const dark_disabled_accent_SliderThumb = n95
export const dark_disabled_accent_Tooltip = n95
export const dark_disabled_accent_ProgressIndicator = n95
export const dark_dim_accent_SwitchThumb = n95
export const dark_dim_accent_SliderThumb = n95
export const dark_dim_accent_Tooltip = n95
export const dark_dim_accent_ProgressIndicator = n95
export const dark_alt1_accent_SwitchThumb = n95
export const dark_alt1_accent_SliderThumb = n95
export const dark_alt1_accent_Tooltip = n95
export const dark_alt1_accent_ProgressIndicator = n95
export const dark_alt2_accent_SwitchThumb = n95
export const dark_alt2_accent_SliderThumb = n95
export const dark_alt2_accent_Tooltip = n95
export const dark_alt2_accent_ProgressIndicator = n95
export const dark_active_accent_SwitchThumb = n95
export const dark_active_accent_SliderThumb = n95
export const dark_active_accent_Tooltip = n95
export const dark_active_accent_ProgressIndicator = n95
export const dark_error_accent_SwitchThumb = n95
export const dark_error_accent_SliderThumb = n95
export const dark_error_accent_Tooltip = n95
export const dark_error_accent_ProgressIndicator = n95
export const dark_red_accent_SwitchThumb = n95
export const dark_red_accent_SliderThumb = n95
export const dark_red_accent_Tooltip = n95
export const dark_red_accent_ProgressIndicator = n95
export const dark_warning_accent_SwitchThumb = n95
export const dark_warning_accent_SliderThumb = n95
export const dark_warning_accent_Tooltip = n95
export const dark_warning_accent_ProgressIndicator = n95
export const dark_success_accent_SwitchThumb = n95
export const dark_success_accent_SliderThumb = n95
export const dark_success_accent_Tooltip = n95
export const dark_success_accent_ProgressIndicator = n95
const n96 = t([[2, 128],[3, 0],[4, 129],[5, 130],[6, 132],[7, 1],[8, 1],[9, 22],[10, 130],[11, 131],[12, 133],[13, 134],[14, 1],[15, 132],[16, 1],[17, 132],[18, 136],[19, 134],[20, 135],[21, 136],[22, 135]])

export const light_accent_TooltipContent = n96
export const light_accent_SliderTrack = n96
export const dark_accent_TooltipContent = n96
export const dark_accent_SliderTrack = n96
export const light_disabled_accent_Button = n96
export const light_disabled_accent_Switch = n96
export const light_disabled_accent_TooltipContent = n96
export const light_disabled_accent_SliderTrack = n96
export const light_dim_accent_Button = n96
export const light_dim_accent_Switch = n96
export const light_dim_accent_TooltipContent = n96
export const light_dim_accent_SliderTrack = n96
export const light_alt1_accent_Button = n96
export const light_alt1_accent_Switch = n96
export const light_alt1_accent_TooltipContent = n96
export const light_alt1_accent_SliderTrack = n96
export const light_alt2_accent_Button = n96
export const light_alt2_accent_Switch = n96
export const light_alt2_accent_TooltipContent = n96
export const light_alt2_accent_SliderTrack = n96
export const light_active_accent_Button = n96
export const light_active_accent_Switch = n96
export const light_active_accent_TooltipContent = n96
export const light_active_accent_SliderTrack = n96
export const light_error_accent_Button = n96
export const light_error_accent_Switch = n96
export const light_error_accent_TooltipContent = n96
export const light_error_accent_SliderTrack = n96
export const light_red_accent_Button = n96
export const light_red_accent_Switch = n96
export const light_red_accent_TooltipContent = n96
export const light_red_accent_SliderTrack = n96
export const light_warning_accent_Button = n96
export const light_warning_accent_Switch = n96
export const light_warning_accent_TooltipContent = n96
export const light_warning_accent_SliderTrack = n96
export const light_success_accent_Button = n96
export const light_success_accent_Switch = n96
export const light_success_accent_TooltipContent = n96
export const light_success_accent_SliderTrack = n96
export const dark_disabled_accent_Button = n96
export const dark_disabled_accent_Switch = n96
export const dark_disabled_accent_TooltipContent = n96
export const dark_disabled_accent_SliderTrack = n96
export const dark_dim_accent_Button = n96
export const dark_dim_accent_Switch = n96
export const dark_dim_accent_TooltipContent = n96
export const dark_dim_accent_SliderTrack = n96
export const dark_alt1_accent_Button = n96
export const dark_alt1_accent_Switch = n96
export const dark_alt1_accent_TooltipContent = n96
export const dark_alt1_accent_SliderTrack = n96
export const dark_alt2_accent_Button = n96
export const dark_alt2_accent_Switch = n96
export const dark_alt2_accent_TooltipContent = n96
export const dark_alt2_accent_SliderTrack = n96
export const dark_active_accent_Button = n96
export const dark_active_accent_Switch = n96
export const dark_active_accent_TooltipContent = n96
export const dark_active_accent_SliderTrack = n96
export const dark_error_accent_Button = n96
export const dark_error_accent_Switch = n96
export const dark_error_accent_TooltipContent = n96
export const dark_error_accent_SliderTrack = n96
export const dark_red_accent_Button = n96
export const dark_red_accent_Switch = n96
export const dark_red_accent_TooltipContent = n96
export const dark_red_accent_SliderTrack = n96
export const dark_warning_accent_Button = n96
export const dark_warning_accent_Switch = n96
export const dark_warning_accent_TooltipContent = n96
export const dark_warning_accent_SliderTrack = n96
export const dark_success_accent_Button = n96
export const dark_success_accent_Switch = n96
export const dark_success_accent_TooltipContent = n96
export const dark_success_accent_SliderTrack = n96
const n97 = t([[0, 150],[1, 150],[2, 22],[3, 1],[4, 1],[5, 132],[6, 130],[7, 129],[8, 0],[9, 128],[10, 132],[11, 137],[12, 136],[13, 135],[14, 129],[15, 130],[16, 129],[17, 130],[18, 133],[19, 135],[20, 134],[21, 133],[22, 134]])

export const light_accent_SliderTrackActive = n97
export const dark_accent_SliderTrackActive = n97
export const light_disabled_accent_SliderTrackActive = n97
export const light_dim_accent_SliderTrackActive = n97
export const light_alt1_accent_SliderTrackActive = n97
export const light_alt2_accent_SliderTrackActive = n97
export const light_active_accent_SliderTrackActive = n97
export const light_error_accent_SliderTrackActive = n97
export const light_red_accent_SliderTrackActive = n97
export const light_warning_accent_SliderTrackActive = n97
export const light_success_accent_SliderTrackActive = n97
export const dark_disabled_accent_SliderTrackActive = n97
export const dark_dim_accent_SliderTrackActive = n97
export const dark_alt1_accent_SliderTrackActive = n97
export const dark_alt2_accent_SliderTrackActive = n97
export const dark_active_accent_SliderTrackActive = n97
export const dark_error_accent_SliderTrackActive = n97
export const dark_red_accent_SliderTrackActive = n97
export const dark_warning_accent_SliderTrackActive = n97
export const dark_success_accent_SliderTrackActive = n97