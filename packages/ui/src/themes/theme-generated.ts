type Theme = {
  color1: string
  color2: string
  color3: string
  color4: string
  color5: string
  color6: string
  color7: string
  color8: string
  color9: string
  color10: string
  color11: string
  color12: string
  background: string
  backgroundHover: string
  backgroundPress: string
  backgroundFocus: string
  backgroundStrong: string
  backgroundTransparent: string
  color: string
  colorHover: string
  colorPress: string
  colorFocus: string
  colorTransparent: string
  borderColor: string
  borderColorHover: string
  borderColorFocus: string
  borderColorPress: string
  placeholderColor: string
  blue1: string
  blue2: string
  blue3: string
  blue4: string
  blue5: string
  blue6: string
  blue7: string
  blue8: string
  blue9: string
  blue10: string
  blue11: string
  blue12: string
  gray1: string
  gray2: string
  gray3: string
  gray4: string
  gray5: string
  gray6: string
  gray7: string
  gray8: string
  gray9: string
  gray10: string
  gray11: string
  gray12: string
  green1: string
  green2: string
  green3: string
  green4: string
  green5: string
  green6: string
  green7: string
  green8: string
  green9: string
  green10: string
  green11: string
  green12: string
  orange1: string
  orange2: string
  orange3: string
  orange4: string
  orange5: string
  orange6: string
  orange7: string
  orange8: string
  orange9: string
  orange10: string
  orange11: string
  orange12: string
  pink1: string
  pink2: string
  pink3: string
  pink4: string
  pink5: string
  pink6: string
  pink7: string
  pink8: string
  pink9: string
  pink10: string
  pink11: string
  pink12: string
  purple1: string
  purple2: string
  purple3: string
  purple4: string
  purple5: string
  purple6: string
  purple7: string
  purple8: string
  purple9: string
  purple10: string
  purple11: string
  purple12: string
  red1: string
  red2: string
  red3: string
  red4: string
  red5: string
  red6: string
  red7: string
  red8: string
  red9: string
  red10: string
  red11: string
  red12: string
  yellow1: string
  yellow2: string
  yellow3: string
  yellow4: string
  yellow5: string
  yellow6: string
  yellow7: string
  yellow8: string
  yellow9: string
  yellow10: string
  yellow11: string
  yellow12: string
  gold1: string
  gold2: string
  gold3: string
  gold4: string
  gold5: string
  gold6: string
  gold7: string
  gold8: string
  gold9: string
  gold10: string
  gold11: string
  gold12: string
  send1: string
  send2: string
  send3: string
  send4: string
  send5: string
  send6: string
  send7: string
  send8: string
  send9: string
  send10: string
  send11: string
  send12: string
  shadowColor: string
  shadowColorHover: string
  shadowColorPress: string
  shadowColorFocus: string
}

function t(a) {
  const res: Record<string, string> = {}
  for (const [ki, vi] of a) {
    // @ts-ignore
    res[ks[ki]] = vs[vi]
  }
  return res
}
const vs = [
  '#fff',
  '#f9f9f9',
  'hsl(0, 0%, 97.3%)',
  'hsl(0, 0%, 95.1%)',
  'hsl(0, 0%, 94.0%)',
  'hsl(0, 0%, 92.0%)',
  'hsl(0, 0%, 89.5%)',
  'hsl(0, 0%, 81.0%)',
  'hsl(0, 0%, 56.1%)',
  'hsl(0, 0%, 50.3%)',
  'hsl(0, 0%, 42.5%)',
  'rgba(22, 22, 25, 1)',
  'rgba(22, 22, 25, 0)',
  'rgba(241, 241, 238, 0)',
  'hsl(206, 100%, 99.2%)',
  'hsl(210, 100%, 98.0%)',
  'hsl(209, 100%, 96.5%)',
  'hsl(210, 98.8%, 94.0%)',
  'hsl(209, 95.0%, 90.1%)',
  'hsl(209, 81.2%, 84.5%)',
  'hsl(208, 77.5%, 76.9%)',
  'hsl(206, 81.9%, 65.3%)',
  'hsl(206, 100%, 50.0%)',
  'hsl(208, 100%, 47.3%)',
  'hsl(211, 100%, 43.2%)',
  'hsl(211, 100%, 15.0%)',
  'hsl(0, 0%, 99.0%)',
  'hsl(0, 0%, 93.0%)',
  'hsl(0, 0%, 90.9%)',
  'hsl(0, 0%, 88.7%)',
  'hsl(0, 0%, 85.8%)',
  'hsl(0, 0%, 78.0%)',
  'hsl(0, 0%, 52.3%)',
  'hsl(0, 0%, 43.5%)',
  'hsl(0, 0%, 9.0%)',
  'hsl(136, 50.0%, 98.9%)',
  'hsl(138, 62.5%, 96.9%)',
  'hsl(139, 55.2%, 94.5%)',
  'hsl(140, 48.7%, 91.0%)',
  'hsl(141, 43.7%, 86.0%)',
  'hsl(143, 40.3%, 79.0%)',
  'hsl(146, 38.5%, 69.0%)',
  'hsl(151, 40.2%, 54.1%)',
  'hsl(151, 55.0%, 41.5%)',
  'hsl(152, 57.5%, 37.6%)',
  'hsl(153, 67.0%, 28.5%)',
  'hsl(155, 40.0%, 14.0%)',
  'hsl(24, 70.0%, 99.0%)',
  'hsl(24, 83.3%, 97.6%)',
  'hsl(24, 100%, 95.3%)',
  'hsl(25, 100%, 92.2%)',
  'hsl(25, 100%, 88.2%)',
  'hsl(25, 100%, 82.8%)',
  'hsl(24, 100%, 75.3%)',
  'hsl(24, 94.5%, 64.3%)',
  'hsl(24, 94.0%, 50.0%)',
  'hsl(24, 100%, 46.5%)',
  'hsl(24, 100%, 37.0%)',
  'hsl(15, 60.0%, 17.0%)',
  'hsl(322, 100%, 99.4%)',
  'hsl(323, 100%, 98.4%)',
  'hsl(323, 86.3%, 96.5%)',
  'hsl(323, 78.7%, 94.2%)',
  'hsl(323, 72.2%, 91.1%)',
  'hsl(323, 66.3%, 86.6%)',
  'hsl(323, 62.0%, 80.1%)',
  'hsl(323, 60.3%, 72.4%)',
  'hsl(322, 65.0%, 54.5%)',
  'hsl(322, 63.9%, 50.7%)',
  'hsl(322, 75.0%, 46.0%)',
  'hsl(320, 70.0%, 13.5%)',
  'hsl(280, 65.0%, 99.4%)',
  'hsl(276, 100%, 99.0%)',
  'hsl(276, 83.1%, 97.0%)',
  'hsl(275, 76.4%, 94.7%)',
  'hsl(275, 70.8%, 91.8%)',
  'hsl(274, 65.4%, 87.8%)',
  'hsl(273, 61.0%, 81.7%)',
  'hsl(272, 60.0%, 73.5%)',
  'hsl(272, 51.0%, 54.0%)',
  'hsl(272, 46.8%, 50.3%)',
  'hsl(272, 50.0%, 45.8%)',
  'hsl(272, 66.0%, 16.0%)',
  'hsl(359, 100%, 99.4%)',
  'hsl(359, 100%, 98.6%)',
  'hsl(360, 100%, 96.8%)',
  'hsl(360, 97.9%, 94.8%)',
  'hsl(360, 90.2%, 91.9%)',
  'hsl(360, 81.7%, 87.8%)',
  'hsl(359, 74.2%, 81.7%)',
  'hsl(359, 69.5%, 74.3%)',
  'hsl(358, 75.0%, 59.0%)',
  'hsl(358, 69.4%, 55.2%)',
  'hsl(358, 65.0%, 48.7%)',
  'hsl(354, 50.0%, 14.6%)',
  'hsl(60, 54.0%, 98.5%)',
  'hsl(52, 100%, 95.5%)',
  'hsl(55, 100%, 90.9%)',
  'hsl(54, 100%, 86.6%)',
  'hsl(52, 97.9%, 82.0%)',
  'hsl(50, 89.4%, 76.1%)',
  'hsl(47, 80.4%, 68.0%)',
  'hsl(48, 100%, 46.1%)',
  'hsl(53, 92.0%, 50.0%)',
  'hsl(50, 100%, 48.5%)',
  'hsl(42, 100%, 29.0%)',
  'hsl(40, 55.0%, 13.5%)',
  'hsl(50, 20.0%, 99.1%)',
  'hsl(47, 52.9%, 96.7%)',
  'hsl(46, 38.2%, 93.7%)',
  'hsl(44, 32.7%, 90.1%)',
  'hsl(43, 29.9%, 85.7%)',
  'hsl(41, 28.3%, 79.8%)',
  'hsl(39, 27.6%, 71.9%)',
  'hsl(36, 27.2%, 61.8%)',
  'hsl(36, 20.0%, 49.5%)',
  'hsl(36, 19.8%, 45.7%)',
  'hsl(36, 20.0%, 39.0%)',
  'hsl(36, 16.0%, 20.0%)',
  '#C3AB8E',
  'hsl(357, 34.4%, 12.0%)',
  '#1D1D20',
  '#151515',
  '#5E4A31',
  '#352A1C',
  '#282015',
  '#1B150E',
  'hsl(358, 100%, 69.5%)',
  'hsl(351, 89.0%, 96.0%)',
  'rgba(0,0,0,0.2)',
  'rgba(0,0,0,0.1)',
  '#101010',
  '#191919',
  '#212121',
  '#282828',
  '#323232',
  '#424242',
  '#494949',
  '#545454',
  '#626262',
  '#a5a5a5',
  'rgba(241, 241, 238, 1)',
  'hsl(212, 35.0%, 9.2%)',
  'hsl(216, 50.0%, 11.8%)',
  'hsl(214, 59.4%, 15.3%)',
  'hsl(214, 65.8%, 17.9%)',
  'hsl(213, 71.2%, 20.2%)',
  'hsl(212, 77.4%, 23.1%)',
  'hsl(211, 85.1%, 27.4%)',
  'hsl(211, 89.7%, 34.1%)',
  'hsl(209, 100%, 60.6%)',
  'hsl(210, 100%, 66.1%)',
  'hsl(206, 98.0%, 95.8%)',
  'hsl(0, 0%, 8.5%)',
  'hsl(0, 0%, 11.0%)',
  'hsl(0, 0%, 13.6%)',
  'hsl(0, 0%, 15.8%)',
  'hsl(0, 0%, 17.9%)',
  'hsl(0, 0%, 20.5%)',
  'hsl(0, 0%, 24.3%)',
  'hsl(0, 0%, 31.2%)',
  'hsl(0, 0%, 43.9%)',
  'hsl(0, 0%, 49.4%)',
  'hsl(0, 0%, 62.8%)',
  'hsl(146, 30.0%, 7.4%)',
  'hsl(155, 44.2%, 8.4%)',
  'hsl(155, 46.7%, 10.9%)',
  'hsl(154, 48.4%, 12.9%)',
  'hsl(154, 49.7%, 14.9%)',
  'hsl(154, 50.9%, 17.6%)',
  'hsl(153, 51.8%, 21.8%)',
  'hsl(151, 51.7%, 28.4%)',
  'hsl(151, 49.3%, 46.5%)',
  'hsl(151, 50.0%, 53.2%)',
  'hsl(137, 72.0%, 94.0%)',
  'hsl(30, 70.0%, 7.2%)',
  'hsl(28, 100%, 8.4%)',
  'hsl(26, 91.1%, 11.6%)',
  'hsl(25, 88.3%, 14.1%)',
  'hsl(24, 87.6%, 16.6%)',
  'hsl(24, 88.6%, 19.8%)',
  'hsl(24, 92.4%, 24.0%)',
  'hsl(25, 100%, 29.0%)',
  'hsl(24, 100%, 58.5%)',
  'hsl(24, 100%, 62.2%)',
  'hsl(24, 97.0%, 93.2%)',
  'hsl(318, 25.0%, 9.6%)',
  'hsl(319, 32.2%, 11.6%)',
  'hsl(319, 41.0%, 16.0%)',
  'hsl(320, 45.4%, 18.7%)',
  'hsl(320, 49.0%, 21.1%)',
  'hsl(321, 53.6%, 24.4%)',
  'hsl(321, 61.1%, 29.7%)',
  'hsl(322, 74.9%, 37.5%)',
  'hsl(323, 72.8%, 59.2%)',
  'hsl(325, 90.0%, 66.4%)',
  'hsl(322, 90.0%, 95.8%)',
  'hsl(284, 20.0%, 9.6%)',
  'hsl(283, 30.0%, 11.8%)',
  'hsl(281, 37.5%, 16.5%)',
  'hsl(280, 41.2%, 20.0%)',
  'hsl(279, 43.8%, 23.3%)',
  'hsl(277, 46.4%, 27.5%)',
  'hsl(275, 49.3%, 34.6%)',
  'hsl(272, 52.1%, 45.9%)',
  'hsl(273, 57.3%, 59.1%)',
  'hsl(275, 80.0%, 71.0%)',
  'hsl(279, 75.0%, 95.7%)',
  'hsl(353, 23.0%, 9.8%)',
  'hsl(356, 43.4%, 16.4%)',
  'hsl(356, 47.6%, 19.2%)',
  'hsl(356, 51.1%, 21.9%)',
  'hsl(356, 55.2%, 25.9%)',
  'hsl(357, 60.2%, 31.8%)',
  'hsl(358, 65.0%, 40.4%)',
  'hsl(358, 85.3%, 64.0%)',
  'hsl(45, 100%, 5.5%)',
  'hsl(46, 100%, 6.7%)',
  'hsl(45, 100%, 8.7%)',
  'hsl(45, 100%, 10.4%)',
  'hsl(47, 100%, 12.1%)',
  'hsl(49, 100%, 14.3%)',
  'hsl(49, 90.3%, 18.4%)',
  'hsl(50, 100%, 22.0%)',
  'hsl(54, 100%, 68.0%)',
  'hsl(48, 100%, 47.0%)',
  'hsl(53, 100%, 91.0%)',
  'hsl(44, 9.0%, 8.3%)',
  'hsl(43, 14.3%, 9.6%)',
  'hsl(42, 15.5%, 13.0%)',
  'hsl(41, 16.4%, 15.6%)',
  'hsl(41, 16.9%, 17.8%)',
  'hsl(40, 17.6%, 20.8%)',
  'hsl(38, 18.5%, 26.4%)',
  'hsl(36, 19.6%, 35.1%)',
  'hsl(36, 22.3%, 54.5%)',
  'hsl(35, 30.0%, 64.0%)',
  'hsl(49, 52.0%, 93.8%)',
  'hsla(24, 70.0%, 99.0%, 0)',
  'hsla(15, 60.0%, 17.0%, 0)',
  'hsla(60, 54.0%, 98.5%, 0)',
  'hsla(40, 55.0%, 13.5%, 0)',
  'hsla(136, 50.0%, 98.9%, 0)',
  'hsla(155, 40.0%, 14.0%, 0)',
  'hsla(206, 100%, 99.2%, 0)',
  'hsla(211, 100%, 15.0%, 0)',
  'hsla(280, 65.0%, 99.4%, 0)',
  'hsla(272, 66.0%, 16.0%, 0)',
  'hsla(322, 100%, 99.4%, 0)',
  'hsla(320, 70.0%, 13.5%, 0)',
  'hsla(359, 100%, 99.4%, 0)',
  'hsla(354, 50.0%, 14.6%, 0)',
  'hsla(50, 20.0%, 99.1%, 0)',
  'hsla(36, 16.0%, 20.0%, 0)',
  'hsla(351, 89.0%, 96.0%, 0)',
  'hsla(30, 70.0%, 7.2%, 0)',
  'hsla(24, 97.0%, 93.2%, 0)',
  'hsla(45, 100%, 5.5%, 0)',
  'hsla(53, 100%, 91.0%, 0)',
  'hsla(146, 30.0%, 7.4%, 0)',
  'hsla(137, 72.0%, 94.0%, 0)',
  'hsla(212, 35.0%, 9.2%, 0)',
  'hsla(206, 98.0%, 95.8%, 0)',
  'hsla(284, 20.0%, 9.6%, 0)',
  'hsla(279, 75.0%, 95.7%, 0)',
  'hsla(318, 25.0%, 9.6%, 0)',
  'hsla(322, 90.0%, 95.8%, 0)',
  'hsla(353, 23.0%, 9.8%, 0)',
  'hsla(44, 9.0%, 8.3%, 0)',
  'hsla(49, 52.0%, 93.8%, 0)',
  'rgba(0,0,0,0.5)',
  'rgba(0,0,0,0.9)',
  'transparent',
]

const ks = [
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
  'blue1',
  'blue2',
  'blue3',
  'blue4',
  'blue5',
  'blue6',
  'blue7',
  'blue8',
  'blue9',
  'blue10',
  'blue11',
  'blue12',
  'gray1',
  'gray2',
  'gray3',
  'gray4',
  'gray5',
  'gray6',
  'gray7',
  'gray8',
  'gray9',
  'gray10',
  'gray11',
  'gray12',
  'green1',
  'green2',
  'green3',
  'green4',
  'green5',
  'green6',
  'green7',
  'green8',
  'green9',
  'green10',
  'green11',
  'green12',
  'orange1',
  'orange2',
  'orange3',
  'orange4',
  'orange5',
  'orange6',
  'orange7',
  'orange8',
  'orange9',
  'orange10',
  'orange11',
  'orange12',
  'pink1',
  'pink2',
  'pink3',
  'pink4',
  'pink5',
  'pink6',
  'pink7',
  'pink8',
  'pink9',
  'pink10',
  'pink11',
  'pink12',
  'purple1',
  'purple2',
  'purple3',
  'purple4',
  'purple5',
  'purple6',
  'purple7',
  'purple8',
  'purple9',
  'purple10',
  'purple11',
  'purple12',
  'red1',
  'red2',
  'red3',
  'red4',
  'red5',
  'red6',
  'red7',
  'red8',
  'red9',
  'red10',
  'red11',
  'red12',
  'yellow1',
  'yellow2',
  'yellow3',
  'yellow4',
  'yellow5',
  'yellow6',
  'yellow7',
  'yellow8',
  'yellow9',
  'yellow10',
  'yellow11',
  'yellow12',
  'gold1',
  'gold2',
  'gold3',
  'gold4',
  'gold5',
  'gold6',
  'gold7',
  'gold8',
  'gold9',
  'gold10',
  'gold11',
  'gold12',
  'send1',
  'send2',
  'send3',
  'send4',
  'send5',
  'send6',
  'send7',
  'send8',
  'send9',
  'send10',
  'send11',
  'send12',
  'shadowColor',
  'shadowColorHover',
  'shadowColorPress',
  'shadowColorFocus',
]

const n1 = t([
  [0, 0],
  [1, 1],
  [2, 2],
  [3, 3],
  [4, 4],
  [5, 5],
  [6, 6],
  [7, 7],
  [8, 8],
  [9, 9],
  [10, 10],
  [11, 11],
  [12, 1],
  [13, 1],
  [14, 1],
  [15, 1],
  [16, 0],
  [17, 12],
  [18, 0],
  [19, 10],
  [20, 11],
  [21, 10],
  [22, 13],
  [23, 0],
  [24, 5],
  [25, 1],
  [26, 1],
  [27, 8],
  [28, 14],
  [29, 15],
  [30, 16],
  [31, 17],
  [32, 18],
  [33, 19],
  [34, 20],
  [35, 21],
  [36, 22],
  [37, 23],
  [38, 24],
  [39, 25],
  [40, 26],
  [41, 2],
  [42, 3],
  [43, 27],
  [44, 28],
  [45, 29],
  [46, 30],
  [47, 31],
  [48, 8],
  [49, 32],
  [50, 33],
  [51, 34],
  [52, 35],
  [53, 36],
  [54, 37],
  [55, 38],
  [56, 39],
  [57, 40],
  [58, 41],
  [59, 42],
  [60, 43],
  [61, 44],
  [62, 45],
  [63, 46],
  [64, 47],
  [65, 48],
  [66, 49],
  [67, 50],
  [68, 51],
  [69, 52],
  [70, 53],
  [71, 54],
  [72, 55],
  [73, 56],
  [74, 57],
  [75, 58],
  [76, 59],
  [77, 60],
  [78, 61],
  [79, 62],
  [80, 63],
  [81, 64],
  [82, 65],
  [83, 66],
  [84, 67],
  [85, 68],
  [86, 69],
  [87, 70],
  [88, 71],
  [89, 72],
  [90, 73],
  [91, 74],
  [92, 75],
  [93, 76],
  [94, 77],
  [95, 78],
  [96, 79],
  [97, 80],
  [98, 81],
  [99, 82],
  [100, 83],
  [101, 84],
  [102, 85],
  [103, 86],
  [104, 87],
  [105, 88],
  [106, 89],
  [107, 90],
  [108, 91],
  [109, 92],
  [110, 93],
  [111, 94],
  [112, 95],
  [113, 96],
  [114, 97],
  [115, 98],
  [116, 99],
  [117, 100],
  [118, 101],
  [119, 102],
  [120, 103],
  [121, 104],
  [122, 105],
  [123, 106],
  [124, 107],
  [125, 108],
  [126, 109],
  [127, 110],
  [128, 111],
  [129, 112],
  [130, 113],
  [131, 114],
  [132, 115],
  [133, 116],
  [134, 117],
  [135, 118],
  [136, 119],
  [137, 120],
  [138, 121],
  [139, 122],
  [140, 121],
  [141, 119],
  [142, 123],
  [143, 124],
  [144, 125],
  [145, 126],
  [146, 127],
  [147, 128],
  [148, 129],
  [149, 129],
  [150, 130],
  [151, 130],
]) as Theme

export const light = n1 as Theme
const n2 = t([
  [0, 131],
  [1, 122],
  [2, 132],
  [3, 133],
  [4, 134],
  [5, 135],
  [6, 136],
  [7, 137],
  [8, 138],
  [9, 139],
  [10, 140],
  [11, 141],
  [12, 122],
  [13, 122],
  [14, 122],
  [15, 122],
  [16, 131],
  [17, 13],
  [18, 131],
  [19, 140],
  [20, 141],
  [21, 140],
  [22, 12],
  [23, 131],
  [24, 135],
  [25, 122],
  [26, 122],
  [27, 138],
  [28, 142],
  [29, 143],
  [30, 144],
  [31, 145],
  [32, 146],
  [33, 147],
  [34, 148],
  [35, 149],
  [36, 22],
  [37, 150],
  [38, 151],
  [39, 152],
  [40, 153],
  [41, 154],
  [42, 155],
  [43, 156],
  [44, 157],
  [45, 158],
  [46, 159],
  [47, 160],
  [48, 161],
  [49, 162],
  [50, 163],
  [51, 27],
  [52, 164],
  [53, 165],
  [54, 166],
  [55, 167],
  [56, 168],
  [57, 169],
  [58, 170],
  [59, 171],
  [60, 43],
  [61, 172],
  [62, 173],
  [63, 174],
  [64, 175],
  [65, 176],
  [66, 177],
  [67, 178],
  [68, 179],
  [69, 180],
  [70, 181],
  [71, 182],
  [72, 55],
  [73, 183],
  [74, 184],
  [75, 185],
  [76, 186],
  [77, 187],
  [78, 188],
  [79, 189],
  [80, 190],
  [81, 191],
  [82, 192],
  [83, 193],
  [84, 67],
  [85, 194],
  [86, 195],
  [87, 196],
  [88, 197],
  [89, 198],
  [90, 199],
  [91, 200],
  [92, 201],
  [93, 202],
  [94, 203],
  [95, 204],
  [96, 79],
  [97, 205],
  [98, 206],
  [99, 207],
  [100, 208],
  [101, 120],
  [102, 209],
  [103, 210],
  [104, 211],
  [105, 212],
  [106, 213],
  [107, 214],
  [108, 91],
  [109, 215],
  [110, 127],
  [111, 128],
  [112, 216],
  [113, 217],
  [114, 218],
  [115, 219],
  [116, 220],
  [117, 221],
  [118, 222],
  [119, 223],
  [120, 103],
  [121, 224],
  [122, 225],
  [123, 226],
  [124, 227],
  [125, 228],
  [126, 229],
  [127, 230],
  [128, 231],
  [129, 232],
  [130, 233],
  [131, 234],
  [132, 115],
  [133, 235],
  [134, 236],
  [135, 237],
  [136, 119],
  [137, 120],
  [138, 121],
  [139, 122],
  [140, 121],
  [141, 119],
  [142, 123],
  [143, 124],
  [144, 125],
  [145, 126],
  [146, 127],
  [147, 128],
  [148, 129],
  [149, 129],
  [150, 130],
  [151, 130],
]) as Theme

export const dark = n2 as Theme
const n3 = t([
  [0, 47],
  [1, 48],
  [2, 49],
  [3, 50],
  [4, 51],
  [5, 52],
  [6, 54],
  [7, 55],
  [8, 56],
  [9, 57],
  [10, 58],
  [11, 11],
  [12, 48],
  [13, 48],
  [14, 48],
  [15, 48],
  [16, 47],
  [17, 238],
  [18, 47],
  [19, 58],
  [20, 11],
  [21, 58],
  [22, 239],
  [23, 50],
  [24, 51],
  [25, 50],
  [26, 50],
  [27, 56],
]) as Theme

export const light_orange = n3 as Theme
const n4 = t([
  [0, 95],
  [1, 96],
  [2, 97],
  [3, 98],
  [4, 99],
  [5, 100],
  [6, 102],
  [7, 103],
  [8, 104],
  [9, 105],
  [10, 106],
  [11, 11],
  [12, 96],
  [13, 96],
  [14, 96],
  [15, 96],
  [16, 95],
  [17, 240],
  [18, 95],
  [19, 106],
  [20, 11],
  [21, 106],
  [22, 241],
  [23, 98],
  [24, 99],
  [25, 98],
  [26, 98],
  [27, 104],
]) as Theme

export const light_yellow = n4 as Theme
const n5 = t([
  [0, 35],
  [1, 36],
  [2, 37],
  [3, 38],
  [4, 39],
  [5, 40],
  [6, 42],
  [7, 43],
  [8, 44],
  [9, 45],
  [10, 46],
  [11, 11],
  [12, 36],
  [13, 36],
  [14, 36],
  [15, 36],
  [16, 35],
  [17, 242],
  [18, 35],
  [19, 46],
  [20, 11],
  [21, 46],
  [22, 243],
  [23, 38],
  [24, 39],
  [25, 38],
  [26, 38],
  [27, 44],
]) as Theme

export const light_green = n5 as Theme
const n6 = t([
  [0, 14],
  [1, 15],
  [2, 16],
  [3, 17],
  [4, 18],
  [5, 19],
  [6, 21],
  [7, 22],
  [8, 23],
  [9, 24],
  [10, 25],
  [11, 11],
  [12, 15],
  [13, 15],
  [14, 15],
  [15, 15],
  [16, 14],
  [17, 244],
  [18, 14],
  [19, 25],
  [20, 11],
  [21, 25],
  [22, 245],
  [23, 17],
  [24, 18],
  [25, 17],
  [26, 17],
  [27, 23],
]) as Theme

export const light_blue = n6 as Theme
const n7 = t([
  [0, 71],
  [1, 72],
  [2, 73],
  [3, 74],
  [4, 75],
  [5, 76],
  [6, 78],
  [7, 79],
  [8, 80],
  [9, 81],
  [10, 82],
  [11, 11],
  [12, 72],
  [13, 72],
  [14, 72],
  [15, 72],
  [16, 71],
  [17, 246],
  [18, 71],
  [19, 82],
  [20, 11],
  [21, 82],
  [22, 247],
  [23, 74],
  [24, 75],
  [25, 74],
  [26, 74],
  [27, 80],
]) as Theme

export const light_purple = n7 as Theme
const n8 = t([
  [0, 59],
  [1, 60],
  [2, 61],
  [3, 62],
  [4, 63],
  [5, 64],
  [6, 66],
  [7, 67],
  [8, 68],
  [9, 69],
  [10, 70],
  [11, 11],
  [12, 60],
  [13, 60],
  [14, 60],
  [15, 60],
  [16, 59],
  [17, 248],
  [18, 59],
  [19, 70],
  [20, 11],
  [21, 70],
  [22, 249],
  [23, 62],
  [24, 63],
  [25, 62],
  [26, 62],
  [27, 68],
]) as Theme

export const light_pink = n8 as Theme
const n9 = t([
  [0, 83],
  [1, 84],
  [2, 85],
  [3, 86],
  [4, 87],
  [5, 88],
  [6, 90],
  [7, 91],
  [8, 92],
  [9, 93],
  [10, 94],
  [11, 11],
  [12, 84],
  [13, 84],
  [14, 84],
  [15, 84],
  [16, 83],
  [17, 250],
  [18, 83],
  [19, 94],
  [20, 11],
  [21, 94],
  [22, 251],
  [23, 86],
  [24, 87],
  [25, 86],
  [26, 86],
  [27, 92],
]) as Theme

export const light_red = n9 as Theme
const n10 = t([
  [0, 107],
  [1, 108],
  [2, 109],
  [3, 110],
  [4, 111],
  [5, 112],
  [6, 114],
  [7, 115],
  [8, 116],
  [9, 117],
  [10, 118],
  [11, 11],
  [12, 108],
  [13, 108],
  [14, 108],
  [15, 108],
  [16, 107],
  [17, 252],
  [18, 107],
  [19, 118],
  [20, 11],
  [21, 118],
  [22, 253],
  [23, 110],
  [24, 111],
  [25, 110],
  [26, 110],
  [27, 116],
]) as Theme

export const light_gold = n10 as Theme
const n11 = t([
  [0, 119],
  [1, 120],
  [2, 0],
  [3, 122],
  [4, 121],
  [5, 119],
  [6, 124],
  [7, 125],
  [8, 126],
  [9, 127],
  [10, 128],
  [11, 11],
  [12, 120],
  [13, 120],
  [14, 120],
  [15, 120],
  [16, 119],
  [17, 119],
  [18, 119],
  [19, 128],
  [20, 11],
  [21, 128],
  [22, 254],
  [23, 122],
  [24, 121],
  [25, 122],
  [26, 122],
  [27, 126],
]) as Theme

export const light_send = n11 as Theme
const n12 = t([
  [0, 175],
  [1, 176],
  [2, 177],
  [3, 178],
  [4, 179],
  [5, 180],
  [6, 182],
  [7, 55],
  [8, 183],
  [9, 184],
  [10, 185],
  [11, 141],
  [12, 176],
  [13, 176],
  [14, 176],
  [15, 176],
  [16, 175],
  [17, 255],
  [18, 175],
  [19, 185],
  [20, 141],
  [21, 185],
  [22, 256],
  [23, 175],
  [24, 180],
  [25, 176],
  [26, 176],
  [27, 183],
]) as Theme

export const dark_orange = n12 as Theme
const n13 = t([
  [0, 216],
  [1, 217],
  [2, 218],
  [3, 219],
  [4, 220],
  [5, 221],
  [6, 223],
  [7, 103],
  [8, 224],
  [9, 225],
  [10, 226],
  [11, 141],
  [12, 217],
  [13, 217],
  [14, 217],
  [15, 217],
  [16, 216],
  [17, 257],
  [18, 216],
  [19, 226],
  [20, 141],
  [21, 226],
  [22, 258],
  [23, 216],
  [24, 221],
  [25, 217],
  [26, 217],
  [27, 224],
]) as Theme

export const dark_yellow = n13 as Theme
const n14 = t([
  [0, 164],
  [1, 165],
  [2, 166],
  [3, 167],
  [4, 168],
  [5, 169],
  [6, 171],
  [7, 43],
  [8, 172],
  [9, 173],
  [10, 174],
  [11, 141],
  [12, 165],
  [13, 165],
  [14, 165],
  [15, 165],
  [16, 164],
  [17, 259],
  [18, 164],
  [19, 174],
  [20, 141],
  [21, 174],
  [22, 260],
  [23, 164],
  [24, 169],
  [25, 165],
  [26, 165],
  [27, 172],
]) as Theme

export const dark_green = n14 as Theme
const n15 = t([
  [0, 142],
  [1, 143],
  [2, 144],
  [3, 145],
  [4, 146],
  [5, 147],
  [6, 149],
  [7, 22],
  [8, 150],
  [9, 151],
  [10, 152],
  [11, 141],
  [12, 143],
  [13, 143],
  [14, 143],
  [15, 143],
  [16, 142],
  [17, 261],
  [18, 142],
  [19, 152],
  [20, 141],
  [21, 152],
  [22, 262],
  [23, 142],
  [24, 147],
  [25, 143],
  [26, 143],
  [27, 150],
]) as Theme

export const dark_blue = n15 as Theme
const n16 = t([
  [0, 197],
  [1, 198],
  [2, 199],
  [3, 200],
  [4, 201],
  [5, 202],
  [6, 204],
  [7, 79],
  [8, 205],
  [9, 206],
  [10, 207],
  [11, 141],
  [12, 198],
  [13, 198],
  [14, 198],
  [15, 198],
  [16, 197],
  [17, 263],
  [18, 197],
  [19, 207],
  [20, 141],
  [21, 207],
  [22, 264],
  [23, 197],
  [24, 202],
  [25, 198],
  [26, 198],
  [27, 205],
]) as Theme

export const dark_purple = n16 as Theme
const n17 = t([
  [0, 186],
  [1, 187],
  [2, 188],
  [3, 189],
  [4, 190],
  [5, 191],
  [6, 193],
  [7, 67],
  [8, 194],
  [9, 195],
  [10, 196],
  [11, 141],
  [12, 187],
  [13, 187],
  [14, 187],
  [15, 187],
  [16, 186],
  [17, 265],
  [18, 186],
  [19, 196],
  [20, 141],
  [21, 196],
  [22, 266],
  [23, 186],
  [24, 191],
  [25, 187],
  [26, 187],
  [27, 194],
]) as Theme

export const dark_pink = n17 as Theme
const n18 = t([
  [0, 208],
  [1, 120],
  [2, 209],
  [3, 210],
  [4, 211],
  [5, 212],
  [6, 214],
  [7, 91],
  [8, 215],
  [9, 127],
  [10, 128],
  [11, 141],
  [12, 120],
  [13, 120],
  [14, 120],
  [15, 120],
  [16, 208],
  [17, 267],
  [18, 208],
  [19, 128],
  [20, 141],
  [21, 128],
  [22, 254],
  [23, 208],
  [24, 212],
  [25, 120],
  [26, 120],
  [27, 215],
]) as Theme

export const dark_red = n18 as Theme
const n19 = t([
  [0, 227],
  [1, 228],
  [2, 229],
  [3, 230],
  [4, 231],
  [5, 232],
  [6, 234],
  [7, 115],
  [8, 235],
  [9, 236],
  [10, 237],
  [11, 141],
  [12, 228],
  [13, 228],
  [14, 228],
  [15, 228],
  [16, 227],
  [17, 268],
  [18, 227],
  [19, 237],
  [20, 141],
  [21, 237],
  [22, 269],
  [23, 227],
  [24, 232],
  [25, 228],
  [26, 228],
  [27, 235],
]) as Theme

export const dark_gold = n19 as Theme
const n20 = t([
  [0, 119],
  [1, 120],
  [2, 121],
  [3, 122],
  [4, 121],
  [5, 119],
  [6, 124],
  [7, 125],
  [8, 126],
  [9, 127],
  [10, 128],
  [11, 141],
  [12, 120],
  [13, 120],
  [14, 120],
  [15, 120],
  [16, 119],
  [17, 119],
  [18, 119],
  [19, 128],
  [20, 141],
  [21, 128],
  [22, 254],
  [23, 119],
  [24, 119],
  [25, 120],
  [26, 120],
  [27, 126],
]) as Theme

export const dark_send = n20 as Theme
const n21 = t([[12, 270]]) as Theme

export const light_SheetOverlay = n21 as Theme
export const light_DialogOverlay = n21 as Theme
export const light_ModalOverlay = n21 as Theme
export const light_orange_SheetOverlay = n21 as Theme
export const light_orange_DialogOverlay = n21 as Theme
export const light_orange_ModalOverlay = n21 as Theme
export const light_yellow_SheetOverlay = n21 as Theme
export const light_yellow_DialogOverlay = n21 as Theme
export const light_yellow_ModalOverlay = n21 as Theme
export const light_green_SheetOverlay = n21 as Theme
export const light_green_DialogOverlay = n21 as Theme
export const light_green_ModalOverlay = n21 as Theme
export const light_blue_SheetOverlay = n21 as Theme
export const light_blue_DialogOverlay = n21 as Theme
export const light_blue_ModalOverlay = n21 as Theme
export const light_purple_SheetOverlay = n21 as Theme
export const light_purple_DialogOverlay = n21 as Theme
export const light_purple_ModalOverlay = n21 as Theme
export const light_pink_SheetOverlay = n21 as Theme
export const light_pink_DialogOverlay = n21 as Theme
export const light_pink_ModalOverlay = n21 as Theme
export const light_red_SheetOverlay = n21 as Theme
export const light_red_DialogOverlay = n21 as Theme
export const light_red_ModalOverlay = n21 as Theme
export const light_gold_SheetOverlay = n21 as Theme
export const light_gold_DialogOverlay = n21 as Theme
export const light_gold_ModalOverlay = n21 as Theme
export const light_send_SheetOverlay = n21 as Theme
export const light_send_DialogOverlay = n21 as Theme
export const light_send_ModalOverlay = n21 as Theme
export const light_alt1_SheetOverlay = n21 as Theme
export const light_alt1_DialogOverlay = n21 as Theme
export const light_alt1_ModalOverlay = n21 as Theme
export const light_alt2_SheetOverlay = n21 as Theme
export const light_alt2_DialogOverlay = n21 as Theme
export const light_alt2_ModalOverlay = n21 as Theme
export const light_active_SheetOverlay = n21 as Theme
export const light_active_DialogOverlay = n21 as Theme
export const light_active_ModalOverlay = n21 as Theme
export const light_orange_alt1_SheetOverlay = n21 as Theme
export const light_orange_alt1_DialogOverlay = n21 as Theme
export const light_orange_alt1_ModalOverlay = n21 as Theme
export const light_orange_alt2_SheetOverlay = n21 as Theme
export const light_orange_alt2_DialogOverlay = n21 as Theme
export const light_orange_alt2_ModalOverlay = n21 as Theme
export const light_orange_active_SheetOverlay = n21 as Theme
export const light_orange_active_DialogOverlay = n21 as Theme
export const light_orange_active_ModalOverlay = n21 as Theme
export const light_yellow_alt1_SheetOverlay = n21 as Theme
export const light_yellow_alt1_DialogOverlay = n21 as Theme
export const light_yellow_alt1_ModalOverlay = n21 as Theme
export const light_yellow_alt2_SheetOverlay = n21 as Theme
export const light_yellow_alt2_DialogOverlay = n21 as Theme
export const light_yellow_alt2_ModalOverlay = n21 as Theme
export const light_yellow_active_SheetOverlay = n21 as Theme
export const light_yellow_active_DialogOverlay = n21 as Theme
export const light_yellow_active_ModalOverlay = n21 as Theme
export const light_green_alt1_SheetOverlay = n21 as Theme
export const light_green_alt1_DialogOverlay = n21 as Theme
export const light_green_alt1_ModalOverlay = n21 as Theme
export const light_green_alt2_SheetOverlay = n21 as Theme
export const light_green_alt2_DialogOverlay = n21 as Theme
export const light_green_alt2_ModalOverlay = n21 as Theme
export const light_green_active_SheetOverlay = n21 as Theme
export const light_green_active_DialogOverlay = n21 as Theme
export const light_green_active_ModalOverlay = n21 as Theme
export const light_blue_alt1_SheetOverlay = n21 as Theme
export const light_blue_alt1_DialogOverlay = n21 as Theme
export const light_blue_alt1_ModalOverlay = n21 as Theme
export const light_blue_alt2_SheetOverlay = n21 as Theme
export const light_blue_alt2_DialogOverlay = n21 as Theme
export const light_blue_alt2_ModalOverlay = n21 as Theme
export const light_blue_active_SheetOverlay = n21 as Theme
export const light_blue_active_DialogOverlay = n21 as Theme
export const light_blue_active_ModalOverlay = n21 as Theme
export const light_purple_alt1_SheetOverlay = n21 as Theme
export const light_purple_alt1_DialogOverlay = n21 as Theme
export const light_purple_alt1_ModalOverlay = n21 as Theme
export const light_purple_alt2_SheetOverlay = n21 as Theme
export const light_purple_alt2_DialogOverlay = n21 as Theme
export const light_purple_alt2_ModalOverlay = n21 as Theme
export const light_purple_active_SheetOverlay = n21 as Theme
export const light_purple_active_DialogOverlay = n21 as Theme
export const light_purple_active_ModalOverlay = n21 as Theme
export const light_pink_alt1_SheetOverlay = n21 as Theme
export const light_pink_alt1_DialogOverlay = n21 as Theme
export const light_pink_alt1_ModalOverlay = n21 as Theme
export const light_pink_alt2_SheetOverlay = n21 as Theme
export const light_pink_alt2_DialogOverlay = n21 as Theme
export const light_pink_alt2_ModalOverlay = n21 as Theme
export const light_pink_active_SheetOverlay = n21 as Theme
export const light_pink_active_DialogOverlay = n21 as Theme
export const light_pink_active_ModalOverlay = n21 as Theme
export const light_red_alt1_SheetOverlay = n21 as Theme
export const light_red_alt1_DialogOverlay = n21 as Theme
export const light_red_alt1_ModalOverlay = n21 as Theme
export const light_red_alt2_SheetOverlay = n21 as Theme
export const light_red_alt2_DialogOverlay = n21 as Theme
export const light_red_alt2_ModalOverlay = n21 as Theme
export const light_red_active_SheetOverlay = n21 as Theme
export const light_red_active_DialogOverlay = n21 as Theme
export const light_red_active_ModalOverlay = n21 as Theme
export const light_gold_alt1_SheetOverlay = n21 as Theme
export const light_gold_alt1_DialogOverlay = n21 as Theme
export const light_gold_alt1_ModalOverlay = n21 as Theme
export const light_gold_alt2_SheetOverlay = n21 as Theme
export const light_gold_alt2_DialogOverlay = n21 as Theme
export const light_gold_alt2_ModalOverlay = n21 as Theme
export const light_gold_active_SheetOverlay = n21 as Theme
export const light_gold_active_DialogOverlay = n21 as Theme
export const light_gold_active_ModalOverlay = n21 as Theme
export const light_send_alt1_SheetOverlay = n21 as Theme
export const light_send_alt1_DialogOverlay = n21 as Theme
export const light_send_alt1_ModalOverlay = n21 as Theme
export const light_send_alt2_SheetOverlay = n21 as Theme
export const light_send_alt2_DialogOverlay = n21 as Theme
export const light_send_alt2_ModalOverlay = n21 as Theme
export const light_send_active_SheetOverlay = n21 as Theme
export const light_send_active_DialogOverlay = n21 as Theme
export const light_send_active_ModalOverlay = n21 as Theme
const n22 = t([[12, 271]]) as Theme

export const dark_SheetOverlay = n22 as Theme
export const dark_DialogOverlay = n22 as Theme
export const dark_ModalOverlay = n22 as Theme
export const dark_orange_SheetOverlay = n22 as Theme
export const dark_orange_DialogOverlay = n22 as Theme
export const dark_orange_ModalOverlay = n22 as Theme
export const dark_yellow_SheetOverlay = n22 as Theme
export const dark_yellow_DialogOverlay = n22 as Theme
export const dark_yellow_ModalOverlay = n22 as Theme
export const dark_green_SheetOverlay = n22 as Theme
export const dark_green_DialogOverlay = n22 as Theme
export const dark_green_ModalOverlay = n22 as Theme
export const dark_blue_SheetOverlay = n22 as Theme
export const dark_blue_DialogOverlay = n22 as Theme
export const dark_blue_ModalOverlay = n22 as Theme
export const dark_purple_SheetOverlay = n22 as Theme
export const dark_purple_DialogOverlay = n22 as Theme
export const dark_purple_ModalOverlay = n22 as Theme
export const dark_pink_SheetOverlay = n22 as Theme
export const dark_pink_DialogOverlay = n22 as Theme
export const dark_pink_ModalOverlay = n22 as Theme
export const dark_red_SheetOverlay = n22 as Theme
export const dark_red_DialogOverlay = n22 as Theme
export const dark_red_ModalOverlay = n22 as Theme
export const dark_gold_SheetOverlay = n22 as Theme
export const dark_gold_DialogOverlay = n22 as Theme
export const dark_gold_ModalOverlay = n22 as Theme
export const dark_send_SheetOverlay = n22 as Theme
export const dark_send_DialogOverlay = n22 as Theme
export const dark_send_ModalOverlay = n22 as Theme
export const dark_alt1_SheetOverlay = n22 as Theme
export const dark_alt1_DialogOverlay = n22 as Theme
export const dark_alt1_ModalOverlay = n22 as Theme
export const dark_alt2_SheetOverlay = n22 as Theme
export const dark_alt2_DialogOverlay = n22 as Theme
export const dark_alt2_ModalOverlay = n22 as Theme
export const dark_active_SheetOverlay = n22 as Theme
export const dark_active_DialogOverlay = n22 as Theme
export const dark_active_ModalOverlay = n22 as Theme
export const dark_orange_alt1_SheetOverlay = n22 as Theme
export const dark_orange_alt1_DialogOverlay = n22 as Theme
export const dark_orange_alt1_ModalOverlay = n22 as Theme
export const dark_orange_alt2_SheetOverlay = n22 as Theme
export const dark_orange_alt2_DialogOverlay = n22 as Theme
export const dark_orange_alt2_ModalOverlay = n22 as Theme
export const dark_orange_active_SheetOverlay = n22 as Theme
export const dark_orange_active_DialogOverlay = n22 as Theme
export const dark_orange_active_ModalOverlay = n22 as Theme
export const dark_yellow_alt1_SheetOverlay = n22 as Theme
export const dark_yellow_alt1_DialogOverlay = n22 as Theme
export const dark_yellow_alt1_ModalOverlay = n22 as Theme
export const dark_yellow_alt2_SheetOverlay = n22 as Theme
export const dark_yellow_alt2_DialogOverlay = n22 as Theme
export const dark_yellow_alt2_ModalOverlay = n22 as Theme
export const dark_yellow_active_SheetOverlay = n22 as Theme
export const dark_yellow_active_DialogOverlay = n22 as Theme
export const dark_yellow_active_ModalOverlay = n22 as Theme
export const dark_green_alt1_SheetOverlay = n22 as Theme
export const dark_green_alt1_DialogOverlay = n22 as Theme
export const dark_green_alt1_ModalOverlay = n22 as Theme
export const dark_green_alt2_SheetOverlay = n22 as Theme
export const dark_green_alt2_DialogOverlay = n22 as Theme
export const dark_green_alt2_ModalOverlay = n22 as Theme
export const dark_green_active_SheetOverlay = n22 as Theme
export const dark_green_active_DialogOverlay = n22 as Theme
export const dark_green_active_ModalOverlay = n22 as Theme
export const dark_blue_alt1_SheetOverlay = n22 as Theme
export const dark_blue_alt1_DialogOverlay = n22 as Theme
export const dark_blue_alt1_ModalOverlay = n22 as Theme
export const dark_blue_alt2_SheetOverlay = n22 as Theme
export const dark_blue_alt2_DialogOverlay = n22 as Theme
export const dark_blue_alt2_ModalOverlay = n22 as Theme
export const dark_blue_active_SheetOverlay = n22 as Theme
export const dark_blue_active_DialogOverlay = n22 as Theme
export const dark_blue_active_ModalOverlay = n22 as Theme
export const dark_purple_alt1_SheetOverlay = n22 as Theme
export const dark_purple_alt1_DialogOverlay = n22 as Theme
export const dark_purple_alt1_ModalOverlay = n22 as Theme
export const dark_purple_alt2_SheetOverlay = n22 as Theme
export const dark_purple_alt2_DialogOverlay = n22 as Theme
export const dark_purple_alt2_ModalOverlay = n22 as Theme
export const dark_purple_active_SheetOverlay = n22 as Theme
export const dark_purple_active_DialogOverlay = n22 as Theme
export const dark_purple_active_ModalOverlay = n22 as Theme
export const dark_pink_alt1_SheetOverlay = n22 as Theme
export const dark_pink_alt1_DialogOverlay = n22 as Theme
export const dark_pink_alt1_ModalOverlay = n22 as Theme
export const dark_pink_alt2_SheetOverlay = n22 as Theme
export const dark_pink_alt2_DialogOverlay = n22 as Theme
export const dark_pink_alt2_ModalOverlay = n22 as Theme
export const dark_pink_active_SheetOverlay = n22 as Theme
export const dark_pink_active_DialogOverlay = n22 as Theme
export const dark_pink_active_ModalOverlay = n22 as Theme
export const dark_red_alt1_SheetOverlay = n22 as Theme
export const dark_red_alt1_DialogOverlay = n22 as Theme
export const dark_red_alt1_ModalOverlay = n22 as Theme
export const dark_red_alt2_SheetOverlay = n22 as Theme
export const dark_red_alt2_DialogOverlay = n22 as Theme
export const dark_red_alt2_ModalOverlay = n22 as Theme
export const dark_red_active_SheetOverlay = n22 as Theme
export const dark_red_active_DialogOverlay = n22 as Theme
export const dark_red_active_ModalOverlay = n22 as Theme
export const dark_gold_alt1_SheetOverlay = n22 as Theme
export const dark_gold_alt1_DialogOverlay = n22 as Theme
export const dark_gold_alt1_ModalOverlay = n22 as Theme
export const dark_gold_alt2_SheetOverlay = n22 as Theme
export const dark_gold_alt2_DialogOverlay = n22 as Theme
export const dark_gold_alt2_ModalOverlay = n22 as Theme
export const dark_gold_active_SheetOverlay = n22 as Theme
export const dark_gold_active_DialogOverlay = n22 as Theme
export const dark_gold_active_ModalOverlay = n22 as Theme
export const dark_send_alt1_SheetOverlay = n22 as Theme
export const dark_send_alt1_DialogOverlay = n22 as Theme
export const dark_send_alt1_ModalOverlay = n22 as Theme
export const dark_send_alt2_SheetOverlay = n22 as Theme
export const dark_send_alt2_DialogOverlay = n22 as Theme
export const dark_send_alt2_ModalOverlay = n22 as Theme
export const dark_send_active_SheetOverlay = n22 as Theme
export const dark_send_active_DialogOverlay = n22 as Theme
export const dark_send_active_ModalOverlay = n22 as Theme
const n23 = t([
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [8, 9],
  [9, 10],
  [10, 11],
  [11, 11],
  [12, 2],
  [13, 2],
  [14, 2],
  [15, 2],
  [16, 1],
  [17, 0],
  [18, 1],
  [19, 9],
  [20, 10],
  [21, 9],
  [22, 11],
  [23, 1],
  [24, 6],
  [25, 2],
  [26, 2],
  [27, 7],
]) as Theme

export const light_alt1 = n23 as Theme
const n24 = t([
  [0, 2],
  [1, 3],
  [2, 4],
  [3, 5],
  [4, 6],
  [5, 7],
  [6, 8],
  [7, 9],
  [8, 10],
  [9, 11],
  [10, 11],
  [11, 11],
  [12, 3],
  [13, 3],
  [14, 3],
  [15, 3],
  [16, 2],
  [17, 1],
  [18, 2],
  [19, 8],
  [20, 9],
  [21, 8],
  [22, 10],
  [23, 2],
  [24, 7],
  [25, 3],
  [26, 3],
  [27, 6],
]) as Theme

export const light_alt2 = n24 as Theme
const n25 = t([
  [0, 3],
  [1, 4],
  [2, 5],
  [3, 6],
  [4, 7],
  [5, 8],
  [6, 9],
  [7, 10],
  [8, 11],
  [9, 13],
  [10, 13],
  [11, 13],
  [12, 4],
  [13, 4],
  [14, 4],
  [15, 4],
  [16, 3],
  [17, 2],
  [19, 7],
  [20, 8],
  [21, 7],
  [22, 9],
  [23, 3],
  [24, 8],
  [25, 4],
  [26, 4],
  [27, 5],
]) as Theme

export const light_active = n25 as Theme
const n26 = t([
  [0, 122],
  [1, 132],
  [2, 133],
  [3, 134],
  [4, 135],
  [5, 136],
  [6, 137],
  [7, 138],
  [8, 139],
  [9, 140],
  [10, 141],
  [11, 141],
  [12, 132],
  [13, 132],
  [14, 132],
  [15, 132],
  [16, 122],
  [17, 131],
  [18, 122],
  [19, 139],
  [20, 140],
  [21, 139],
  [22, 141],
  [23, 122],
  [24, 136],
  [25, 132],
  [26, 132],
  [27, 137],
]) as Theme

export const dark_alt1 = n26 as Theme
const n27 = t([
  [0, 132],
  [1, 133],
  [2, 134],
  [3, 135],
  [4, 136],
  [5, 137],
  [6, 138],
  [7, 139],
  [8, 140],
  [9, 141],
  [10, 141],
  [11, 141],
  [12, 133],
  [13, 133],
  [14, 133],
  [15, 133],
  [16, 132],
  [17, 122],
  [18, 132],
  [19, 138],
  [20, 139],
  [21, 138],
  [22, 140],
  [23, 132],
  [24, 137],
  [25, 133],
  [26, 133],
  [27, 136],
]) as Theme

export const dark_alt2 = n27 as Theme
const n28 = t([
  [0, 133],
  [1, 134],
  [2, 135],
  [3, 136],
  [4, 137],
  [5, 138],
  [6, 139],
  [7, 140],
  [8, 141],
  [9, 12],
  [10, 12],
  [11, 12],
  [12, 134],
  [13, 134],
  [14, 134],
  [15, 134],
  [16, 133],
  [17, 132],
  [19, 137],
  [20, 138],
  [21, 137],
  [22, 139],
  [23, 133],
  [24, 138],
  [25, 134],
  [26, 134],
  [27, 135],
]) as Theme

export const dark_active = n28 as Theme
const n29 = t([
  [0, 48],
  [1, 49],
  [2, 50],
  [3, 51],
  [4, 52],
  [5, 54],
  [6, 55],
  [7, 56],
  [8, 57],
  [9, 58],
  [10, 11],
  [11, 11],
  [12, 49],
  [13, 49],
  [14, 49],
  [15, 49],
  [16, 48],
  [17, 47],
  [18, 48],
  [19, 57],
  [20, 58],
  [21, 57],
  [22, 11],
  [23, 51],
  [24, 52],
  [25, 51],
  [26, 51],
  [27, 55],
]) as Theme

export const light_orange_alt1 = n29 as Theme
const n30 = t([
  [0, 49],
  [1, 50],
  [2, 51],
  [3, 52],
  [4, 54],
  [5, 55],
  [6, 56],
  [7, 57],
  [8, 58],
  [9, 11],
  [10, 11],
  [11, 11],
  [12, 50],
  [13, 50],
  [14, 50],
  [15, 50],
  [16, 49],
  [17, 48],
  [18, 49],
  [19, 56],
  [20, 57],
  [21, 56],
  [22, 58],
  [23, 52],
  [24, 54],
  [25, 52],
  [26, 52],
  [27, 54],
]) as Theme

export const light_orange_alt2 = n30 as Theme
const n31 = t([
  [0, 50],
  [1, 51],
  [2, 52],
  [3, 54],
  [4, 55],
  [5, 56],
  [6, 57],
  [7, 58],
  [8, 11],
  [9, 239],
  [10, 239],
  [11, 239],
  [12, 51],
  [13, 51],
  [14, 51],
  [15, 51],
  [16, 50],
  [17, 49],
  [19, 55],
  [20, 56],
  [21, 55],
  [22, 57],
  [23, 54],
  [24, 55],
  [25, 54],
  [26, 54],
  [27, 52],
]) as Theme

export const light_orange_active = n31 as Theme
const n32 = t([
  [0, 96],
  [1, 97],
  [2, 98],
  [3, 99],
  [4, 100],
  [5, 102],
  [6, 103],
  [7, 104],
  [8, 105],
  [9, 106],
  [10, 11],
  [11, 11],
  [12, 97],
  [13, 97],
  [14, 97],
  [15, 97],
  [16, 96],
  [17, 95],
  [18, 96],
  [19, 105],
  [20, 106],
  [21, 105],
  [22, 11],
  [23, 99],
  [24, 100],
  [25, 99],
  [26, 99],
  [27, 103],
]) as Theme

export const light_yellow_alt1 = n32 as Theme
const n33 = t([
  [0, 97],
  [1, 98],
  [2, 99],
  [3, 100],
  [4, 102],
  [5, 103],
  [6, 104],
  [7, 105],
  [8, 106],
  [9, 11],
  [10, 11],
  [11, 11],
  [12, 98],
  [13, 98],
  [14, 98],
  [15, 98],
  [16, 97],
  [17, 96],
  [18, 97],
  [19, 104],
  [20, 105],
  [21, 104],
  [22, 106],
  [23, 100],
  [24, 102],
  [25, 100],
  [26, 100],
  [27, 102],
]) as Theme

export const light_yellow_alt2 = n33 as Theme
const n34 = t([
  [0, 98],
  [1, 99],
  [2, 100],
  [3, 102],
  [4, 103],
  [5, 104],
  [6, 105],
  [7, 106],
  [8, 11],
  [9, 241],
  [10, 241],
  [11, 241],
  [12, 99],
  [13, 99],
  [14, 99],
  [15, 99],
  [16, 98],
  [17, 97],
  [19, 103],
  [20, 104],
  [21, 103],
  [22, 105],
  [23, 102],
  [24, 103],
  [25, 102],
  [26, 102],
  [27, 100],
]) as Theme

export const light_yellow_active = n34 as Theme
const n35 = t([
  [0, 36],
  [1, 37],
  [2, 38],
  [3, 39],
  [4, 40],
  [5, 42],
  [6, 43],
  [7, 44],
  [8, 45],
  [9, 46],
  [10, 11],
  [11, 11],
  [12, 37],
  [13, 37],
  [14, 37],
  [15, 37],
  [16, 36],
  [17, 35],
  [18, 36],
  [19, 45],
  [20, 46],
  [21, 45],
  [22, 11],
  [23, 39],
  [24, 40],
  [25, 39],
  [26, 39],
  [27, 43],
]) as Theme

export const light_green_alt1 = n35 as Theme
const n36 = t([
  [0, 37],
  [1, 38],
  [2, 39],
  [3, 40],
  [4, 42],
  [5, 43],
  [6, 44],
  [7, 45],
  [8, 46],
  [9, 11],
  [10, 11],
  [11, 11],
  [12, 38],
  [13, 38],
  [14, 38],
  [15, 38],
  [16, 37],
  [17, 36],
  [18, 37],
  [19, 44],
  [20, 45],
  [21, 44],
  [22, 46],
  [23, 40],
  [24, 42],
  [25, 40],
  [26, 40],
  [27, 42],
]) as Theme

export const light_green_alt2 = n36 as Theme
const n37 = t([
  [0, 38],
  [1, 39],
  [2, 40],
  [3, 42],
  [4, 43],
  [5, 44],
  [6, 45],
  [7, 46],
  [8, 11],
  [9, 243],
  [10, 243],
  [11, 243],
  [12, 39],
  [13, 39],
  [14, 39],
  [15, 39],
  [16, 38],
  [17, 37],
  [19, 43],
  [20, 44],
  [21, 43],
  [22, 45],
  [23, 42],
  [24, 43],
  [25, 42],
  [26, 42],
  [27, 40],
]) as Theme

export const light_green_active = n37 as Theme
const n38 = t([
  [0, 15],
  [1, 16],
  [2, 17],
  [3, 18],
  [4, 19],
  [5, 21],
  [6, 22],
  [7, 23],
  [8, 24],
  [9, 25],
  [10, 11],
  [11, 11],
  [12, 16],
  [13, 16],
  [14, 16],
  [15, 16],
  [16, 15],
  [17, 14],
  [18, 15],
  [19, 24],
  [20, 25],
  [21, 24],
  [22, 11],
  [23, 18],
  [24, 19],
  [25, 18],
  [26, 18],
  [27, 22],
]) as Theme

export const light_blue_alt1 = n38 as Theme
const n39 = t([
  [0, 16],
  [1, 17],
  [2, 18],
  [3, 19],
  [4, 21],
  [5, 22],
  [6, 23],
  [7, 24],
  [8, 25],
  [9, 11],
  [10, 11],
  [11, 11],
  [12, 17],
  [13, 17],
  [14, 17],
  [15, 17],
  [16, 16],
  [17, 15],
  [18, 16],
  [19, 23],
  [20, 24],
  [21, 23],
  [22, 25],
  [23, 19],
  [24, 21],
  [25, 19],
  [26, 19],
  [27, 21],
]) as Theme

export const light_blue_alt2 = n39 as Theme
const n40 = t([
  [0, 17],
  [1, 18],
  [2, 19],
  [3, 21],
  [4, 22],
  [5, 23],
  [6, 24],
  [7, 25],
  [8, 11],
  [9, 245],
  [10, 245],
  [11, 245],
  [12, 18],
  [13, 18],
  [14, 18],
  [15, 18],
  [16, 17],
  [17, 16],
  [19, 22],
  [20, 23],
  [21, 22],
  [22, 24],
  [23, 21],
  [24, 22],
  [25, 21],
  [26, 21],
  [27, 19],
]) as Theme

export const light_blue_active = n40 as Theme
const n41 = t([
  [0, 72],
  [1, 73],
  [2, 74],
  [3, 75],
  [4, 76],
  [5, 78],
  [6, 79],
  [7, 80],
  [8, 81],
  [9, 82],
  [10, 11],
  [11, 11],
  [12, 73],
  [13, 73],
  [14, 73],
  [15, 73],
  [16, 72],
  [17, 71],
  [18, 72],
  [19, 81],
  [20, 82],
  [21, 81],
  [22, 11],
  [23, 75],
  [24, 76],
  [25, 75],
  [26, 75],
  [27, 79],
]) as Theme

export const light_purple_alt1 = n41 as Theme
const n42 = t([
  [0, 73],
  [1, 74],
  [2, 75],
  [3, 76],
  [4, 78],
  [5, 79],
  [6, 80],
  [7, 81],
  [8, 82],
  [9, 11],
  [10, 11],
  [11, 11],
  [12, 74],
  [13, 74],
  [14, 74],
  [15, 74],
  [16, 73],
  [17, 72],
  [18, 73],
  [19, 80],
  [20, 81],
  [21, 80],
  [22, 82],
  [23, 76],
  [24, 78],
  [25, 76],
  [26, 76],
  [27, 78],
]) as Theme

export const light_purple_alt2 = n42 as Theme
const n43 = t([
  [0, 74],
  [1, 75],
  [2, 76],
  [3, 78],
  [4, 79],
  [5, 80],
  [6, 81],
  [7, 82],
  [8, 11],
  [9, 247],
  [10, 247],
  [11, 247],
  [12, 75],
  [13, 75],
  [14, 75],
  [15, 75],
  [16, 74],
  [17, 73],
  [19, 79],
  [20, 80],
  [21, 79],
  [22, 81],
  [23, 78],
  [24, 79],
  [25, 78],
  [26, 78],
  [27, 76],
]) as Theme

export const light_purple_active = n43 as Theme
const n44 = t([
  [0, 60],
  [1, 61],
  [2, 62],
  [3, 63],
  [4, 64],
  [5, 66],
  [6, 67],
  [7, 68],
  [8, 69],
  [9, 70],
  [10, 11],
  [11, 11],
  [12, 61],
  [13, 61],
  [14, 61],
  [15, 61],
  [16, 60],
  [17, 59],
  [18, 60],
  [19, 69],
  [20, 70],
  [21, 69],
  [22, 11],
  [23, 63],
  [24, 64],
  [25, 63],
  [26, 63],
  [27, 67],
]) as Theme

export const light_pink_alt1 = n44 as Theme
const n45 = t([
  [0, 61],
  [1, 62],
  [2, 63],
  [3, 64],
  [4, 66],
  [5, 67],
  [6, 68],
  [7, 69],
  [8, 70],
  [9, 11],
  [10, 11],
  [11, 11],
  [12, 62],
  [13, 62],
  [14, 62],
  [15, 62],
  [16, 61],
  [17, 60],
  [18, 61],
  [19, 68],
  [20, 69],
  [21, 68],
  [22, 70],
  [23, 64],
  [24, 66],
  [25, 64],
  [26, 64],
  [27, 66],
]) as Theme

export const light_pink_alt2 = n45 as Theme
const n46 = t([
  [0, 62],
  [1, 63],
  [2, 64],
  [3, 66],
  [4, 67],
  [5, 68],
  [6, 69],
  [7, 70],
  [8, 11],
  [9, 249],
  [10, 249],
  [11, 249],
  [12, 63],
  [13, 63],
  [14, 63],
  [15, 63],
  [16, 62],
  [17, 61],
  [19, 67],
  [20, 68],
  [21, 67],
  [22, 69],
  [23, 66],
  [24, 67],
  [25, 66],
  [26, 66],
  [27, 64],
]) as Theme

export const light_pink_active = n46 as Theme
const n47 = t([
  [0, 84],
  [1, 85],
  [2, 86],
  [3, 87],
  [4, 88],
  [5, 90],
  [6, 91],
  [7, 92],
  [8, 93],
  [9, 94],
  [10, 11],
  [11, 11],
  [12, 85],
  [13, 85],
  [14, 85],
  [15, 85],
  [16, 84],
  [17, 83],
  [18, 84],
  [19, 93],
  [20, 94],
  [21, 93],
  [22, 11],
  [23, 87],
  [24, 88],
  [25, 87],
  [26, 87],
  [27, 91],
]) as Theme

export const light_red_alt1 = n47 as Theme
const n48 = t([
  [0, 85],
  [1, 86],
  [2, 87],
  [3, 88],
  [4, 90],
  [5, 91],
  [6, 92],
  [7, 93],
  [8, 94],
  [9, 11],
  [10, 11],
  [11, 11],
  [12, 86],
  [13, 86],
  [14, 86],
  [15, 86],
  [16, 85],
  [17, 84],
  [18, 85],
  [19, 92],
  [20, 93],
  [21, 92],
  [22, 94],
  [23, 88],
  [24, 90],
  [25, 88],
  [26, 88],
  [27, 90],
]) as Theme

export const light_red_alt2 = n48 as Theme
const n49 = t([
  [0, 86],
  [1, 87],
  [2, 88],
  [3, 90],
  [4, 91],
  [5, 92],
  [6, 93],
  [7, 94],
  [8, 11],
  [9, 251],
  [10, 251],
  [11, 251],
  [12, 87],
  [13, 87],
  [14, 87],
  [15, 87],
  [16, 86],
  [17, 85],
  [19, 91],
  [20, 92],
  [21, 91],
  [22, 93],
  [23, 90],
  [24, 91],
  [25, 90],
  [26, 90],
  [27, 88],
]) as Theme

export const light_red_active = n49 as Theme
const n50 = t([
  [0, 108],
  [1, 109],
  [2, 110],
  [3, 111],
  [4, 112],
  [5, 114],
  [6, 115],
  [7, 116],
  [8, 117],
  [9, 118],
  [10, 11],
  [11, 11],
  [12, 109],
  [13, 109],
  [14, 109],
  [15, 109],
  [16, 108],
  [17, 107],
  [18, 108],
  [19, 117],
  [20, 118],
  [21, 117],
  [22, 11],
  [23, 111],
  [24, 112],
  [25, 111],
  [26, 111],
  [27, 115],
]) as Theme

export const light_gold_alt1 = n50 as Theme
const n51 = t([
  [0, 109],
  [1, 110],
  [2, 111],
  [3, 112],
  [4, 114],
  [5, 115],
  [6, 116],
  [7, 117],
  [8, 118],
  [9, 11],
  [10, 11],
  [11, 11],
  [12, 110],
  [13, 110],
  [14, 110],
  [15, 110],
  [16, 109],
  [17, 108],
  [18, 109],
  [19, 116],
  [20, 117],
  [21, 116],
  [22, 118],
  [23, 112],
  [24, 114],
  [25, 112],
  [26, 112],
  [27, 114],
]) as Theme

export const light_gold_alt2 = n51 as Theme
const n52 = t([
  [0, 110],
  [1, 111],
  [2, 112],
  [3, 114],
  [4, 115],
  [5, 116],
  [6, 117],
  [7, 118],
  [8, 11],
  [9, 253],
  [10, 253],
  [11, 253],
  [12, 111],
  [13, 111],
  [14, 111],
  [15, 111],
  [16, 110],
  [17, 109],
  [19, 115],
  [20, 116],
  [21, 115],
  [22, 117],
  [23, 114],
  [24, 115],
  [25, 114],
  [26, 114],
  [27, 112],
]) as Theme

export const light_gold_active = n52 as Theme
const n53 = t([
  [0, 120],
  [1, 0],
  [2, 122],
  [3, 121],
  [4, 119],
  [5, 124],
  [6, 125],
  [7, 126],
  [8, 127],
  [9, 128],
  [10, 11],
  [11, 11],
  [12, 0],
  [13, 0],
  [14, 0],
  [15, 0],
  [16, 120],
  [17, 119],
  [18, 120],
  [19, 127],
  [20, 128],
  [21, 127],
  [22, 11],
  [23, 121],
  [24, 119],
  [25, 121],
  [26, 121],
  [27, 125],
]) as Theme

export const light_send_alt1 = n53 as Theme
const n54 = t([
  [0, 0],
  [1, 122],
  [2, 121],
  [3, 119],
  [4, 124],
  [5, 125],
  [6, 126],
  [7, 127],
  [8, 128],
  [9, 11],
  [10, 11],
  [11, 11],
  [12, 122],
  [13, 122],
  [14, 122],
  [15, 122],
  [16, 0],
  [17, 120],
  [18, 0],
  [19, 126],
  [20, 127],
  [21, 126],
  [22, 128],
  [23, 119],
  [24, 124],
  [25, 119],
  [26, 119],
  [27, 124],
]) as Theme

export const light_send_alt2 = n54 as Theme
const n55 = t([
  [0, 122],
  [1, 121],
  [2, 119],
  [3, 124],
  [4, 125],
  [5, 126],
  [6, 127],
  [7, 128],
  [8, 11],
  [9, 254],
  [10, 254],
  [11, 254],
  [12, 121],
  [13, 121],
  [14, 121],
  [15, 121],
  [16, 122],
  [17, 0],
  [19, 125],
  [20, 126],
  [21, 125],
  [22, 127],
  [23, 124],
  [24, 125],
  [25, 124],
  [26, 124],
  [27, 119],
]) as Theme

export const light_send_active = n55 as Theme
const n56 = t([
  [0, 176],
  [1, 177],
  [2, 178],
  [3, 179],
  [4, 180],
  [5, 182],
  [6, 55],
  [7, 183],
  [8, 184],
  [9, 185],
  [10, 141],
  [11, 141],
  [12, 177],
  [13, 177],
  [14, 177],
  [15, 177],
  [16, 176],
  [17, 175],
  [18, 176],
  [19, 184],
  [20, 185],
  [21, 184],
  [22, 141],
  [23, 176],
  [24, 182],
  [25, 177],
  [26, 177],
  [27, 55],
]) as Theme

export const dark_orange_alt1 = n56 as Theme
const n57 = t([
  [0, 177],
  [1, 178],
  [2, 179],
  [3, 180],
  [4, 182],
  [5, 55],
  [6, 183],
  [7, 184],
  [8, 185],
  [9, 141],
  [10, 141],
  [11, 141],
  [12, 178],
  [13, 178],
  [14, 178],
  [15, 178],
  [16, 177],
  [17, 176],
  [18, 177],
  [19, 183],
  [20, 184],
  [21, 183],
  [22, 185],
  [23, 177],
  [24, 55],
  [25, 178],
  [26, 178],
  [27, 182],
]) as Theme

export const dark_orange_alt2 = n57 as Theme
const n58 = t([
  [0, 178],
  [1, 179],
  [2, 180],
  [3, 182],
  [4, 55],
  [5, 183],
  [6, 184],
  [7, 185],
  [8, 141],
  [9, 256],
  [10, 256],
  [11, 256],
  [12, 179],
  [13, 179],
  [14, 179],
  [15, 179],
  [16, 178],
  [17, 177],
  [19, 55],
  [20, 183],
  [21, 55],
  [22, 184],
  [23, 178],
  [24, 183],
  [25, 179],
  [26, 179],
  [27, 180],
]) as Theme

export const dark_orange_active = n58 as Theme
const n59 = t([
  [0, 217],
  [1, 218],
  [2, 219],
  [3, 220],
  [4, 221],
  [5, 223],
  [6, 103],
  [7, 224],
  [8, 225],
  [9, 226],
  [10, 141],
  [11, 141],
  [12, 218],
  [13, 218],
  [14, 218],
  [15, 218],
  [16, 217],
  [17, 216],
  [18, 217],
  [19, 225],
  [20, 226],
  [21, 225],
  [22, 141],
  [23, 217],
  [24, 223],
  [25, 218],
  [26, 218],
  [27, 103],
]) as Theme

export const dark_yellow_alt1 = n59 as Theme
const n60 = t([
  [0, 218],
  [1, 219],
  [2, 220],
  [3, 221],
  [4, 223],
  [5, 103],
  [6, 224],
  [7, 225],
  [8, 226],
  [9, 141],
  [10, 141],
  [11, 141],
  [12, 219],
  [13, 219],
  [14, 219],
  [15, 219],
  [16, 218],
  [17, 217],
  [18, 218],
  [19, 224],
  [20, 225],
  [21, 224],
  [22, 226],
  [23, 218],
  [24, 103],
  [25, 219],
  [26, 219],
  [27, 223],
]) as Theme

export const dark_yellow_alt2 = n60 as Theme
const n61 = t([
  [0, 219],
  [1, 220],
  [2, 221],
  [3, 223],
  [4, 103],
  [5, 224],
  [6, 225],
  [7, 226],
  [8, 141],
  [9, 258],
  [10, 258],
  [11, 258],
  [12, 220],
  [13, 220],
  [14, 220],
  [15, 220],
  [16, 219],
  [17, 218],
  [19, 103],
  [20, 224],
  [21, 103],
  [22, 225],
  [23, 219],
  [24, 224],
  [25, 220],
  [26, 220],
  [27, 221],
]) as Theme

export const dark_yellow_active = n61 as Theme
const n62 = t([
  [0, 165],
  [1, 166],
  [2, 167],
  [3, 168],
  [4, 169],
  [5, 171],
  [6, 43],
  [7, 172],
  [8, 173],
  [9, 174],
  [10, 141],
  [11, 141],
  [12, 166],
  [13, 166],
  [14, 166],
  [15, 166],
  [16, 165],
  [17, 164],
  [18, 165],
  [19, 173],
  [20, 174],
  [21, 173],
  [22, 141],
  [23, 165],
  [24, 171],
  [25, 166],
  [26, 166],
  [27, 43],
]) as Theme

export const dark_green_alt1 = n62 as Theme
const n63 = t([
  [0, 166],
  [1, 167],
  [2, 168],
  [3, 169],
  [4, 171],
  [5, 43],
  [6, 172],
  [7, 173],
  [8, 174],
  [9, 141],
  [10, 141],
  [11, 141],
  [12, 167],
  [13, 167],
  [14, 167],
  [15, 167],
  [16, 166],
  [17, 165],
  [18, 166],
  [19, 172],
  [20, 173],
  [21, 172],
  [22, 174],
  [23, 166],
  [24, 43],
  [25, 167],
  [26, 167],
  [27, 171],
]) as Theme

export const dark_green_alt2 = n63 as Theme
const n64 = t([
  [0, 167],
  [1, 168],
  [2, 169],
  [3, 171],
  [4, 43],
  [5, 172],
  [6, 173],
  [7, 174],
  [8, 141],
  [9, 260],
  [10, 260],
  [11, 260],
  [12, 168],
  [13, 168],
  [14, 168],
  [15, 168],
  [16, 167],
  [17, 166],
  [19, 43],
  [20, 172],
  [21, 43],
  [22, 173],
  [23, 167],
  [24, 172],
  [25, 168],
  [26, 168],
  [27, 169],
]) as Theme

export const dark_green_active = n64 as Theme
const n65 = t([
  [0, 143],
  [1, 144],
  [2, 145],
  [3, 146],
  [4, 147],
  [5, 149],
  [6, 22],
  [7, 150],
  [8, 151],
  [9, 152],
  [10, 141],
  [11, 141],
  [12, 144],
  [13, 144],
  [14, 144],
  [15, 144],
  [16, 143],
  [17, 142],
  [18, 143],
  [19, 151],
  [20, 152],
  [21, 151],
  [22, 141],
  [23, 143],
  [24, 149],
  [25, 144],
  [26, 144],
  [27, 22],
]) as Theme

export const dark_blue_alt1 = n65 as Theme
const n66 = t([
  [0, 144],
  [1, 145],
  [2, 146],
  [3, 147],
  [4, 149],
  [5, 22],
  [6, 150],
  [7, 151],
  [8, 152],
  [9, 141],
  [10, 141],
  [11, 141],
  [12, 145],
  [13, 145],
  [14, 145],
  [15, 145],
  [16, 144],
  [17, 143],
  [18, 144],
  [19, 150],
  [20, 151],
  [21, 150],
  [22, 152],
  [23, 144],
  [24, 22],
  [25, 145],
  [26, 145],
  [27, 149],
]) as Theme

export const dark_blue_alt2 = n66 as Theme
const n67 = t([
  [0, 145],
  [1, 146],
  [2, 147],
  [3, 149],
  [4, 22],
  [5, 150],
  [6, 151],
  [7, 152],
  [8, 141],
  [9, 262],
  [10, 262],
  [11, 262],
  [12, 146],
  [13, 146],
  [14, 146],
  [15, 146],
  [16, 145],
  [17, 144],
  [19, 22],
  [20, 150],
  [21, 22],
  [22, 151],
  [23, 145],
  [24, 150],
  [25, 146],
  [26, 146],
  [27, 147],
]) as Theme

export const dark_blue_active = n67 as Theme
const n68 = t([
  [0, 198],
  [1, 199],
  [2, 200],
  [3, 201],
  [4, 202],
  [5, 204],
  [6, 79],
  [7, 205],
  [8, 206],
  [9, 207],
  [10, 141],
  [11, 141],
  [12, 199],
  [13, 199],
  [14, 199],
  [15, 199],
  [16, 198],
  [17, 197],
  [18, 198],
  [19, 206],
  [20, 207],
  [21, 206],
  [22, 141],
  [23, 198],
  [24, 204],
  [25, 199],
  [26, 199],
  [27, 79],
]) as Theme

export const dark_purple_alt1 = n68 as Theme
const n69 = t([
  [0, 199],
  [1, 200],
  [2, 201],
  [3, 202],
  [4, 204],
  [5, 79],
  [6, 205],
  [7, 206],
  [8, 207],
  [9, 141],
  [10, 141],
  [11, 141],
  [12, 200],
  [13, 200],
  [14, 200],
  [15, 200],
  [16, 199],
  [17, 198],
  [18, 199],
  [19, 205],
  [20, 206],
  [21, 205],
  [22, 207],
  [23, 199],
  [24, 79],
  [25, 200],
  [26, 200],
  [27, 204],
]) as Theme

export const dark_purple_alt2 = n69 as Theme
const n70 = t([
  [0, 200],
  [1, 201],
  [2, 202],
  [3, 204],
  [4, 79],
  [5, 205],
  [6, 206],
  [7, 207],
  [8, 141],
  [9, 264],
  [10, 264],
  [11, 264],
  [12, 201],
  [13, 201],
  [14, 201],
  [15, 201],
  [16, 200],
  [17, 199],
  [19, 79],
  [20, 205],
  [21, 79],
  [22, 206],
  [23, 200],
  [24, 205],
  [25, 201],
  [26, 201],
  [27, 202],
]) as Theme

export const dark_purple_active = n70 as Theme
const n71 = t([
  [0, 187],
  [1, 188],
  [2, 189],
  [3, 190],
  [4, 191],
  [5, 193],
  [6, 67],
  [7, 194],
  [8, 195],
  [9, 196],
  [10, 141],
  [11, 141],
  [12, 188],
  [13, 188],
  [14, 188],
  [15, 188],
  [16, 187],
  [17, 186],
  [18, 187],
  [19, 195],
  [20, 196],
  [21, 195],
  [22, 141],
  [23, 187],
  [24, 193],
  [25, 188],
  [26, 188],
  [27, 67],
]) as Theme

export const dark_pink_alt1 = n71 as Theme
const n72 = t([
  [0, 188],
  [1, 189],
  [2, 190],
  [3, 191],
  [4, 193],
  [5, 67],
  [6, 194],
  [7, 195],
  [8, 196],
  [9, 141],
  [10, 141],
  [11, 141],
  [12, 189],
  [13, 189],
  [14, 189],
  [15, 189],
  [16, 188],
  [17, 187],
  [18, 188],
  [19, 194],
  [20, 195],
  [21, 194],
  [22, 196],
  [23, 188],
  [24, 67],
  [25, 189],
  [26, 189],
  [27, 193],
]) as Theme

export const dark_pink_alt2 = n72 as Theme
const n73 = t([
  [0, 189],
  [1, 190],
  [2, 191],
  [3, 193],
  [4, 67],
  [5, 194],
  [6, 195],
  [7, 196],
  [8, 141],
  [9, 266],
  [10, 266],
  [11, 266],
  [12, 190],
  [13, 190],
  [14, 190],
  [15, 190],
  [16, 189],
  [17, 188],
  [19, 67],
  [20, 194],
  [21, 67],
  [22, 195],
  [23, 189],
  [24, 194],
  [25, 190],
  [26, 190],
  [27, 191],
]) as Theme

export const dark_pink_active = n73 as Theme
const n74 = t([
  [0, 120],
  [1, 209],
  [2, 210],
  [3, 211],
  [4, 212],
  [5, 214],
  [6, 91],
  [7, 215],
  [8, 127],
  [9, 128],
  [10, 141],
  [11, 141],
  [12, 209],
  [13, 209],
  [14, 209],
  [15, 209],
  [16, 120],
  [17, 208],
  [18, 120],
  [19, 127],
  [20, 128],
  [21, 127],
  [22, 141],
  [23, 120],
  [24, 214],
  [25, 209],
  [26, 209],
  [27, 91],
]) as Theme

export const dark_red_alt1 = n74 as Theme
const n75 = t([
  [0, 209],
  [1, 210],
  [2, 211],
  [3, 212],
  [4, 214],
  [5, 91],
  [6, 215],
  [7, 127],
  [8, 128],
  [9, 141],
  [10, 141],
  [11, 141],
  [12, 210],
  [13, 210],
  [14, 210],
  [15, 210],
  [16, 209],
  [17, 120],
  [18, 209],
  [19, 215],
  [20, 127],
  [21, 215],
  [22, 128],
  [23, 209],
  [24, 91],
  [25, 210],
  [26, 210],
  [27, 214],
]) as Theme

export const dark_red_alt2 = n75 as Theme
const n76 = t([
  [0, 210],
  [1, 211],
  [2, 212],
  [3, 214],
  [4, 91],
  [5, 215],
  [6, 127],
  [7, 128],
  [8, 141],
  [9, 254],
  [10, 254],
  [11, 254],
  [12, 211],
  [13, 211],
  [14, 211],
  [15, 211],
  [16, 210],
  [17, 209],
  [19, 91],
  [20, 215],
  [21, 91],
  [22, 127],
  [23, 210],
  [24, 215],
  [25, 211],
  [26, 211],
  [27, 212],
]) as Theme

export const dark_red_active = n76 as Theme
const n77 = t([
  [0, 228],
  [1, 229],
  [2, 230],
  [3, 231],
  [4, 232],
  [5, 234],
  [6, 115],
  [7, 235],
  [8, 236],
  [9, 237],
  [10, 141],
  [11, 141],
  [12, 229],
  [13, 229],
  [14, 229],
  [15, 229],
  [16, 228],
  [17, 227],
  [18, 228],
  [19, 236],
  [20, 237],
  [21, 236],
  [22, 141],
  [23, 228],
  [24, 234],
  [25, 229],
  [26, 229],
  [27, 115],
]) as Theme

export const dark_gold_alt1 = n77 as Theme
const n78 = t([
  [0, 229],
  [1, 230],
  [2, 231],
  [3, 232],
  [4, 234],
  [5, 115],
  [6, 235],
  [7, 236],
  [8, 237],
  [9, 141],
  [10, 141],
  [11, 141],
  [12, 230],
  [13, 230],
  [14, 230],
  [15, 230],
  [16, 229],
  [17, 228],
  [18, 229],
  [19, 235],
  [20, 236],
  [21, 235],
  [22, 237],
  [23, 229],
  [24, 115],
  [25, 230],
  [26, 230],
  [27, 234],
]) as Theme

export const dark_gold_alt2 = n78 as Theme
const n79 = t([
  [0, 230],
  [1, 231],
  [2, 232],
  [3, 234],
  [4, 115],
  [5, 235],
  [6, 236],
  [7, 237],
  [8, 141],
  [9, 269],
  [10, 269],
  [11, 269],
  [12, 231],
  [13, 231],
  [14, 231],
  [15, 231],
  [16, 230],
  [17, 229],
  [19, 115],
  [20, 235],
  [21, 115],
  [22, 236],
  [23, 230],
  [24, 235],
  [25, 231],
  [26, 231],
  [27, 232],
]) as Theme

export const dark_gold_active = n79 as Theme
const n80 = t([
  [0, 120],
  [1, 121],
  [2, 122],
  [3, 121],
  [4, 119],
  [5, 124],
  [6, 125],
  [7, 126],
  [8, 127],
  [9, 128],
  [10, 141],
  [11, 141],
  [12, 121],
  [13, 121],
  [14, 121],
  [15, 121],
  [16, 120],
  [17, 119],
  [18, 120],
  [19, 127],
  [20, 128],
  [21, 127],
  [22, 141],
  [23, 120],
  [24, 124],
  [25, 121],
  [26, 121],
  [27, 125],
]) as Theme

export const dark_send_alt1 = n80 as Theme
const n81 = t([
  [0, 121],
  [1, 122],
  [2, 121],
  [3, 119],
  [4, 124],
  [5, 125],
  [6, 126],
  [7, 127],
  [8, 128],
  [9, 141],
  [10, 141],
  [11, 141],
  [12, 122],
  [13, 122],
  [14, 122],
  [15, 122],
  [16, 121],
  [17, 120],
  [18, 121],
  [19, 126],
  [20, 127],
  [21, 126],
  [22, 128],
  [23, 121],
  [24, 125],
  [25, 122],
  [26, 122],
  [27, 124],
]) as Theme

export const dark_send_alt2 = n81 as Theme
const n82 = t([
  [0, 122],
  [1, 121],
  [2, 119],
  [3, 124],
  [4, 125],
  [5, 126],
  [6, 127],
  [7, 128],
  [8, 141],
  [9, 254],
  [10, 254],
  [11, 254],
  [12, 121],
  [13, 121],
  [14, 121],
  [15, 121],
  [16, 122],
  [17, 121],
  [19, 125],
  [20, 126],
  [21, 125],
  [22, 127],
  [23, 122],
  [24, 126],
  [25, 121],
  [26, 121],
  [27, 119],
]) as Theme

export const dark_send_active = n82 as Theme
const n83 = t([
  [12, 0],
  [13, 0],
  [14, 0],
  [15, 0],
  [16, 0],
  [17, 0],
  [18, 0],
  [19, 10],
  [20, 11],
  [21, 10],
  [22, 11],
  [23, 0],
  [24, 4],
  [25, 0],
  [26, 0],
  [27, 9],
]) as Theme

export const light_ListItem = n83 as Theme
const n84 = t([
  [12, 2],
  [13, 2],
  [14, 2],
  [15, 2],
  [16, 1],
  [17, 0],
  [18, 0],
  [19, 10],
  [20, 11],
  [21, 10],
  [22, 11],
  [23, 1],
  [24, 6],
  [25, 2],
  [26, 2],
  [27, 7],
]) as Theme

export const light_Card = n84 as Theme
export const light_DrawerFrame = n84 as Theme
export const light_Progress = n84 as Theme
export const light_TooltipArrow = n84 as Theme
const n85 = t([
  [12, 3],
  [13, 3],
  [14, 3],
  [15, 3],
  [16, 1],
  [17, 12],
  [18, 0],
  [19, 8],
  [20, 10],
  [21, 8],
  [22, 13],
  [23, 272],
  [24, 272],
  [25, 2],
  [26, 3],
  [27, 6],
]) as Theme

export const light_Button = n85 as Theme
const n86 = t([
  [12, 3],
  [13, 3],
  [14, 3],
  [15, 3],
  [16, 2],
  [17, 1],
  [18, 0],
  [19, 10],
  [20, 11],
  [21, 10],
  [22, 10],
  [23, 2],
  [24, 7],
  [25, 3],
  [26, 3],
  [27, 6],
]) as Theme

export const light_Checkbox = n86 as Theme
export const light_Switch = n86 as Theme
export const light_TooltipContent = n86 as Theme
export const light_SliderTrack = n86 as Theme
const n87 = t([
  [12, 11],
  [13, 11],
  [14, 11],
  [15, 11],
  [16, 11],
  [17, 11],
  [18, 11],
  [19, 1],
  [20, 0],
  [21, 1],
  [22, 0],
  [23, 11],
  [24, 8],
  [25, 11],
  [26, 11],
  [27, 1],
]) as Theme

export const light_SwitchThumb = n87 as Theme
const n88 = t([
  [12, 8],
  [13, 8],
  [14, 8],
  [15, 8],
  [16, 9],
  [17, 10],
  [18, 11],
  [19, 1],
  [20, 0],
  [21, 1],
  [22, 1],
  [23, 9],
  [24, 4],
  [25, 8],
  [26, 8],
  [27, 5],
]) as Theme

export const light_SliderTrackActive = n88 as Theme
const n89 = t([
  [12, 10],
  [13, 10],
  [14, 10],
  [15, 10],
  [16, 11],
  [17, 13],
  [18, 11],
  [19, 1],
  [20, 0],
  [21, 1],
  [22, 12],
  [23, 11],
  [24, 6],
  [25, 10],
  [26, 10],
  [27, 3],
]) as Theme

export const light_SliderThumb = n89 as Theme
export const light_Tooltip = n89 as Theme
export const light_ProgressIndicator = n89 as Theme
const n90 = t([
  [12, 0],
  [13, 0],
  [14, 0],
  [15, 0],
  [16, 0],
  [17, 0],
  [18, 0],
  [19, 10],
  [20, 11],
  [21, 10],
  [22, 11],
  [23, 1],
  [24, 6],
  [25, 2],
  [26, 2],
  [27, 9],
]) as Theme

export const light_Input = n90 as Theme
export const light_TextArea = n90 as Theme
const n91 = t([
  [12, 122],
  [13, 122],
  [14, 122],
  [15, 122],
  [16, 131],
  [17, 13],
  [18, 131],
  [19, 140],
  [20, 141],
  [21, 140],
  [22, 12],
  [23, 131],
  [24, 135],
  [25, 122],
  [26, 122],
  [27, 138],
]) as Theme

export const dark_ListItem = n91 as Theme
const n92 = t([
  [12, 132],
  [13, 132],
  [14, 132],
  [15, 132],
  [16, 122],
  [17, 131],
  [18, 131],
  [19, 140],
  [20, 141],
  [21, 140],
  [22, 141],
  [23, 122],
  [24, 136],
  [25, 132],
  [26, 132],
  [27, 137],
]) as Theme

export const dark_Card = n92 as Theme
export const dark_DrawerFrame = n92 as Theme
export const dark_Progress = n92 as Theme
export const dark_TooltipArrow = n92 as Theme
const n93 = t([
  [12, 133],
  [13, 133],
  [14, 133],
  [15, 133],
  [16, 122],
  [17, 13],
  [18, 131],
  [19, 138],
  [20, 140],
  [21, 138],
  [22, 12],
  [23, 272],
  [24, 272],
  [25, 132],
  [26, 133],
  [27, 136],
]) as Theme

export const dark_Button = n93 as Theme
const n94 = t([
  [12, 133],
  [13, 133],
  [14, 133],
  [15, 133],
  [16, 132],
  [17, 122],
  [18, 131],
  [19, 140],
  [20, 141],
  [21, 140],
  [22, 140],
  [23, 132],
  [24, 137],
  [25, 133],
  [26, 133],
  [27, 136],
]) as Theme

export const dark_Checkbox = n94 as Theme
export const dark_Switch = n94 as Theme
export const dark_TooltipContent = n94 as Theme
export const dark_SliderTrack = n94 as Theme
const n95 = t([
  [12, 141],
  [13, 141],
  [14, 141],
  [15, 141],
  [16, 141],
  [17, 141],
  [18, 141],
  [19, 122],
  [20, 131],
  [21, 122],
  [22, 131],
  [23, 141],
  [24, 138],
  [25, 141],
  [26, 141],
  [27, 122],
]) as Theme

export const dark_SwitchThumb = n95 as Theme
const n96 = t([
  [12, 138],
  [13, 138],
  [14, 138],
  [15, 138],
  [16, 139],
  [17, 140],
  [18, 141],
  [19, 122],
  [20, 131],
  [21, 122],
  [22, 122],
  [23, 139],
  [24, 134],
  [25, 138],
  [26, 138],
  [27, 135],
]) as Theme

export const dark_SliderTrackActive = n96 as Theme
const n97 = t([
  [12, 140],
  [13, 140],
  [14, 140],
  [15, 140],
  [16, 141],
  [17, 12],
  [18, 141],
  [19, 122],
  [20, 131],
  [21, 122],
  [22, 13],
  [23, 141],
  [24, 136],
  [25, 140],
  [26, 140],
  [27, 133],
]) as Theme

export const dark_SliderThumb = n97 as Theme
export const dark_Tooltip = n97 as Theme
export const dark_ProgressIndicator = n97 as Theme
const n98 = t([
  [12, 122],
  [13, 122],
  [14, 122],
  [15, 122],
  [16, 131],
  [17, 13],
  [18, 131],
  [19, 140],
  [20, 141],
  [21, 140],
  [22, 12],
  [23, 122],
  [24, 136],
  [25, 132],
  [26, 132],
  [27, 138],
]) as Theme

export const dark_Input = n98 as Theme
export const dark_TextArea = n98 as Theme
const n99 = t([
  [12, 47],
  [13, 47],
  [14, 47],
  [15, 47],
  [16, 47],
  [17, 47],
  [18, 47],
  [19, 58],
  [20, 11],
  [21, 58],
  [22, 11],
  [23, 49],
  [24, 50],
  [25, 49],
  [26, 49],
  [27, 57],
]) as Theme

export const light_orange_ListItem = n99 as Theme
const n100 = t([
  [12, 49],
  [13, 49],
  [14, 49],
  [15, 49],
  [16, 48],
  [17, 47],
  [18, 47],
  [19, 58],
  [20, 11],
  [21, 58],
  [22, 11],
  [23, 51],
  [24, 52],
  [25, 51],
  [26, 51],
  [27, 55],
]) as Theme

export const light_orange_Card = n100 as Theme
export const light_orange_DrawerFrame = n100 as Theme
export const light_orange_Progress = n100 as Theme
export const light_orange_TooltipArrow = n100 as Theme
const n101 = t([
  [12, 50],
  [13, 50],
  [14, 50],
  [15, 50],
  [16, 48],
  [17, 238],
  [18, 47],
  [19, 56],
  [20, 58],
  [21, 56],
  [22, 239],
  [23, 272],
  [24, 272],
  [25, 51],
  [26, 52],
  [27, 54],
]) as Theme

export const light_orange_Button = n101 as Theme
const n102 = t([
  [12, 50],
  [13, 50],
  [14, 50],
  [15, 50],
  [16, 49],
  [17, 48],
  [18, 47],
  [19, 58],
  [20, 11],
  [21, 58],
  [22, 58],
  [23, 52],
  [24, 54],
  [25, 52],
  [26, 52],
  [27, 54],
]) as Theme

export const light_orange_Checkbox = n102 as Theme
export const light_orange_Switch = n102 as Theme
export const light_orange_TooltipContent = n102 as Theme
export const light_orange_SliderTrack = n102 as Theme
const n103 = t([
  [12, 11],
  [13, 11],
  [14, 11],
  [15, 11],
  [16, 11],
  [17, 11],
  [18, 11],
  [19, 48],
  [20, 47],
  [21, 48],
  [22, 47],
  [23, 58],
  [24, 57],
  [25, 58],
  [26, 58],
  [27, 48],
]) as Theme

export const light_orange_SwitchThumb = n103 as Theme
const n104 = t([
  [12, 56],
  [13, 56],
  [14, 56],
  [15, 56],
  [16, 57],
  [17, 58],
  [18, 11],
  [19, 48],
  [20, 47],
  [21, 48],
  [22, 48],
  [23, 54],
  [24, 52],
  [25, 54],
  [26, 54],
  [27, 52],
]) as Theme

export const light_orange_SliderTrackActive = n104 as Theme
const n105 = t([
  [12, 58],
  [13, 58],
  [14, 58],
  [15, 58],
  [16, 11],
  [17, 239],
  [18, 11],
  [19, 48],
  [20, 47],
  [21, 48],
  [22, 238],
  [23, 56],
  [24, 55],
  [25, 56],
  [26, 56],
  [27, 50],
]) as Theme

export const light_orange_SliderThumb = n105 as Theme
export const light_orange_Tooltip = n105 as Theme
export const light_orange_ProgressIndicator = n105 as Theme
const n106 = t([
  [12, 47],
  [13, 47],
  [14, 47],
  [15, 47],
  [16, 47],
  [17, 47],
  [18, 47],
  [19, 58],
  [20, 11],
  [21, 58],
  [22, 11],
  [23, 51],
  [24, 52],
  [25, 51],
  [26, 51],
  [27, 57],
]) as Theme

export const light_orange_Input = n106 as Theme
export const light_orange_TextArea = n106 as Theme
const n107 = t([
  [12, 95],
  [13, 95],
  [14, 95],
  [15, 95],
  [16, 95],
  [17, 95],
  [18, 95],
  [19, 106],
  [20, 11],
  [21, 106],
  [22, 11],
  [23, 97],
  [24, 98],
  [25, 97],
  [26, 97],
  [27, 105],
]) as Theme

export const light_yellow_ListItem = n107 as Theme
const n108 = t([
  [12, 97],
  [13, 97],
  [14, 97],
  [15, 97],
  [16, 96],
  [17, 95],
  [18, 95],
  [19, 106],
  [20, 11],
  [21, 106],
  [22, 11],
  [23, 99],
  [24, 100],
  [25, 99],
  [26, 99],
  [27, 103],
]) as Theme

export const light_yellow_Card = n108 as Theme
export const light_yellow_DrawerFrame = n108 as Theme
export const light_yellow_Progress = n108 as Theme
export const light_yellow_TooltipArrow = n108 as Theme
const n109 = t([
  [12, 98],
  [13, 98],
  [14, 98],
  [15, 98],
  [16, 96],
  [17, 240],
  [18, 95],
  [19, 104],
  [20, 106],
  [21, 104],
  [22, 241],
  [23, 272],
  [24, 272],
  [25, 99],
  [26, 100],
  [27, 102],
]) as Theme

export const light_yellow_Button = n109 as Theme
const n110 = t([
  [12, 98],
  [13, 98],
  [14, 98],
  [15, 98],
  [16, 97],
  [17, 96],
  [18, 95],
  [19, 106],
  [20, 11],
  [21, 106],
  [22, 106],
  [23, 100],
  [24, 102],
  [25, 100],
  [26, 100],
  [27, 102],
]) as Theme

export const light_yellow_Checkbox = n110 as Theme
export const light_yellow_Switch = n110 as Theme
export const light_yellow_TooltipContent = n110 as Theme
export const light_yellow_SliderTrack = n110 as Theme
const n111 = t([
  [12, 11],
  [13, 11],
  [14, 11],
  [15, 11],
  [16, 11],
  [17, 11],
  [18, 11],
  [19, 96],
  [20, 95],
  [21, 96],
  [22, 95],
  [23, 106],
  [24, 105],
  [25, 106],
  [26, 106],
  [27, 96],
]) as Theme

export const light_yellow_SwitchThumb = n111 as Theme
const n112 = t([
  [12, 104],
  [13, 104],
  [14, 104],
  [15, 104],
  [16, 105],
  [17, 106],
  [18, 11],
  [19, 96],
  [20, 95],
  [21, 96],
  [22, 96],
  [23, 102],
  [24, 100],
  [25, 102],
  [26, 102],
  [27, 100],
]) as Theme

export const light_yellow_SliderTrackActive = n112 as Theme
const n113 = t([
  [12, 106],
  [13, 106],
  [14, 106],
  [15, 106],
  [16, 11],
  [17, 241],
  [18, 11],
  [19, 96],
  [20, 95],
  [21, 96],
  [22, 240],
  [23, 104],
  [24, 103],
  [25, 104],
  [26, 104],
  [27, 98],
]) as Theme

export const light_yellow_SliderThumb = n113 as Theme
export const light_yellow_Tooltip = n113 as Theme
export const light_yellow_ProgressIndicator = n113 as Theme
const n114 = t([
  [12, 95],
  [13, 95],
  [14, 95],
  [15, 95],
  [16, 95],
  [17, 95],
  [18, 95],
  [19, 106],
  [20, 11],
  [21, 106],
  [22, 11],
  [23, 99],
  [24, 100],
  [25, 99],
  [26, 99],
  [27, 105],
]) as Theme

export const light_yellow_Input = n114 as Theme
export const light_yellow_TextArea = n114 as Theme
const n115 = t([
  [12, 35],
  [13, 35],
  [14, 35],
  [15, 35],
  [16, 35],
  [17, 35],
  [18, 35],
  [19, 46],
  [20, 11],
  [21, 46],
  [22, 11],
  [23, 37],
  [24, 38],
  [25, 37],
  [26, 37],
  [27, 45],
]) as Theme

export const light_green_ListItem = n115 as Theme
const n116 = t([
  [12, 37],
  [13, 37],
  [14, 37],
  [15, 37],
  [16, 36],
  [17, 35],
  [18, 35],
  [19, 46],
  [20, 11],
  [21, 46],
  [22, 11],
  [23, 39],
  [24, 40],
  [25, 39],
  [26, 39],
  [27, 43],
]) as Theme

export const light_green_Card = n116 as Theme
export const light_green_DrawerFrame = n116 as Theme
export const light_green_Progress = n116 as Theme
export const light_green_TooltipArrow = n116 as Theme
const n117 = t([
  [12, 38],
  [13, 38],
  [14, 38],
  [15, 38],
  [16, 36],
  [17, 242],
  [18, 35],
  [19, 44],
  [20, 46],
  [21, 44],
  [22, 243],
  [23, 272],
  [24, 272],
  [25, 39],
  [26, 40],
  [27, 42],
]) as Theme

export const light_green_Button = n117 as Theme
const n118 = t([
  [12, 38],
  [13, 38],
  [14, 38],
  [15, 38],
  [16, 37],
  [17, 36],
  [18, 35],
  [19, 46],
  [20, 11],
  [21, 46],
  [22, 46],
  [23, 40],
  [24, 42],
  [25, 40],
  [26, 40],
  [27, 42],
]) as Theme

export const light_green_Checkbox = n118 as Theme
export const light_green_Switch = n118 as Theme
export const light_green_TooltipContent = n118 as Theme
export const light_green_SliderTrack = n118 as Theme
const n119 = t([
  [12, 11],
  [13, 11],
  [14, 11],
  [15, 11],
  [16, 11],
  [17, 11],
  [18, 11],
  [19, 36],
  [20, 35],
  [21, 36],
  [22, 35],
  [23, 46],
  [24, 45],
  [25, 46],
  [26, 46],
  [27, 36],
]) as Theme

export const light_green_SwitchThumb = n119 as Theme
const n120 = t([
  [12, 44],
  [13, 44],
  [14, 44],
  [15, 44],
  [16, 45],
  [17, 46],
  [18, 11],
  [19, 36],
  [20, 35],
  [21, 36],
  [22, 36],
  [23, 42],
  [24, 40],
  [25, 42],
  [26, 42],
  [27, 40],
]) as Theme

export const light_green_SliderTrackActive = n120 as Theme
const n121 = t([
  [12, 46],
  [13, 46],
  [14, 46],
  [15, 46],
  [16, 11],
  [17, 243],
  [18, 11],
  [19, 36],
  [20, 35],
  [21, 36],
  [22, 242],
  [23, 44],
  [24, 43],
  [25, 44],
  [26, 44],
  [27, 38],
]) as Theme

export const light_green_SliderThumb = n121 as Theme
export const light_green_Tooltip = n121 as Theme
export const light_green_ProgressIndicator = n121 as Theme
const n122 = t([
  [12, 35],
  [13, 35],
  [14, 35],
  [15, 35],
  [16, 35],
  [17, 35],
  [18, 35],
  [19, 46],
  [20, 11],
  [21, 46],
  [22, 11],
  [23, 39],
  [24, 40],
  [25, 39],
  [26, 39],
  [27, 45],
]) as Theme

export const light_green_Input = n122 as Theme
export const light_green_TextArea = n122 as Theme
const n123 = t([
  [12, 14],
  [13, 14],
  [14, 14],
  [15, 14],
  [16, 14],
  [17, 14],
  [18, 14],
  [19, 25],
  [20, 11],
  [21, 25],
  [22, 11],
  [23, 16],
  [24, 17],
  [25, 16],
  [26, 16],
  [27, 24],
]) as Theme

export const light_blue_ListItem = n123 as Theme
const n124 = t([
  [12, 16],
  [13, 16],
  [14, 16],
  [15, 16],
  [16, 15],
  [17, 14],
  [18, 14],
  [19, 25],
  [20, 11],
  [21, 25],
  [22, 11],
  [23, 18],
  [24, 19],
  [25, 18],
  [26, 18],
  [27, 22],
]) as Theme

export const light_blue_Card = n124 as Theme
export const light_blue_DrawerFrame = n124 as Theme
export const light_blue_Progress = n124 as Theme
export const light_blue_TooltipArrow = n124 as Theme
const n125 = t([
  [12, 17],
  [13, 17],
  [14, 17],
  [15, 17],
  [16, 15],
  [17, 244],
  [18, 14],
  [19, 23],
  [20, 25],
  [21, 23],
  [22, 245],
  [23, 272],
  [24, 272],
  [25, 18],
  [26, 19],
  [27, 21],
]) as Theme

export const light_blue_Button = n125 as Theme
const n126 = t([
  [12, 17],
  [13, 17],
  [14, 17],
  [15, 17],
  [16, 16],
  [17, 15],
  [18, 14],
  [19, 25],
  [20, 11],
  [21, 25],
  [22, 25],
  [23, 19],
  [24, 21],
  [25, 19],
  [26, 19],
  [27, 21],
]) as Theme

export const light_blue_Checkbox = n126 as Theme
export const light_blue_Switch = n126 as Theme
export const light_blue_TooltipContent = n126 as Theme
export const light_blue_SliderTrack = n126 as Theme
const n127 = t([
  [12, 11],
  [13, 11],
  [14, 11],
  [15, 11],
  [16, 11],
  [17, 11],
  [18, 11],
  [19, 15],
  [20, 14],
  [21, 15],
  [22, 14],
  [23, 25],
  [24, 24],
  [25, 25],
  [26, 25],
  [27, 15],
]) as Theme

export const light_blue_SwitchThumb = n127 as Theme
const n128 = t([
  [12, 23],
  [13, 23],
  [14, 23],
  [15, 23],
  [16, 24],
  [17, 25],
  [18, 11],
  [19, 15],
  [20, 14],
  [21, 15],
  [22, 15],
  [23, 21],
  [24, 19],
  [25, 21],
  [26, 21],
  [27, 19],
]) as Theme

export const light_blue_SliderTrackActive = n128 as Theme
const n129 = t([
  [12, 25],
  [13, 25],
  [14, 25],
  [15, 25],
  [16, 11],
  [17, 245],
  [18, 11],
  [19, 15],
  [20, 14],
  [21, 15],
  [22, 244],
  [23, 23],
  [24, 22],
  [25, 23],
  [26, 23],
  [27, 17],
]) as Theme

export const light_blue_SliderThumb = n129 as Theme
export const light_blue_Tooltip = n129 as Theme
export const light_blue_ProgressIndicator = n129 as Theme
const n130 = t([
  [12, 14],
  [13, 14],
  [14, 14],
  [15, 14],
  [16, 14],
  [17, 14],
  [18, 14],
  [19, 25],
  [20, 11],
  [21, 25],
  [22, 11],
  [23, 18],
  [24, 19],
  [25, 18],
  [26, 18],
  [27, 24],
]) as Theme

export const light_blue_Input = n130 as Theme
export const light_blue_TextArea = n130 as Theme
const n131 = t([
  [12, 71],
  [13, 71],
  [14, 71],
  [15, 71],
  [16, 71],
  [17, 71],
  [18, 71],
  [19, 82],
  [20, 11],
  [21, 82],
  [22, 11],
  [23, 73],
  [24, 74],
  [25, 73],
  [26, 73],
  [27, 81],
]) as Theme

export const light_purple_ListItem = n131 as Theme
const n132 = t([
  [12, 73],
  [13, 73],
  [14, 73],
  [15, 73],
  [16, 72],
  [17, 71],
  [18, 71],
  [19, 82],
  [20, 11],
  [21, 82],
  [22, 11],
  [23, 75],
  [24, 76],
  [25, 75],
  [26, 75],
  [27, 79],
]) as Theme

export const light_purple_Card = n132 as Theme
export const light_purple_DrawerFrame = n132 as Theme
export const light_purple_Progress = n132 as Theme
export const light_purple_TooltipArrow = n132 as Theme
const n133 = t([
  [12, 74],
  [13, 74],
  [14, 74],
  [15, 74],
  [16, 72],
  [17, 246],
  [18, 71],
  [19, 80],
  [20, 82],
  [21, 80],
  [22, 247],
  [23, 272],
  [24, 272],
  [25, 75],
  [26, 76],
  [27, 78],
]) as Theme

export const light_purple_Button = n133 as Theme
const n134 = t([
  [12, 74],
  [13, 74],
  [14, 74],
  [15, 74],
  [16, 73],
  [17, 72],
  [18, 71],
  [19, 82],
  [20, 11],
  [21, 82],
  [22, 82],
  [23, 76],
  [24, 78],
  [25, 76],
  [26, 76],
  [27, 78],
]) as Theme

export const light_purple_Checkbox = n134 as Theme
export const light_purple_Switch = n134 as Theme
export const light_purple_TooltipContent = n134 as Theme
export const light_purple_SliderTrack = n134 as Theme
const n135 = t([
  [12, 11],
  [13, 11],
  [14, 11],
  [15, 11],
  [16, 11],
  [17, 11],
  [18, 11],
  [19, 72],
  [20, 71],
  [21, 72],
  [22, 71],
  [23, 82],
  [24, 81],
  [25, 82],
  [26, 82],
  [27, 72],
]) as Theme

export const light_purple_SwitchThumb = n135 as Theme
const n136 = t([
  [12, 80],
  [13, 80],
  [14, 80],
  [15, 80],
  [16, 81],
  [17, 82],
  [18, 11],
  [19, 72],
  [20, 71],
  [21, 72],
  [22, 72],
  [23, 78],
  [24, 76],
  [25, 78],
  [26, 78],
  [27, 76],
]) as Theme

export const light_purple_SliderTrackActive = n136 as Theme
const n137 = t([
  [12, 82],
  [13, 82],
  [14, 82],
  [15, 82],
  [16, 11],
  [17, 247],
  [18, 11],
  [19, 72],
  [20, 71],
  [21, 72],
  [22, 246],
  [23, 80],
  [24, 79],
  [25, 80],
  [26, 80],
  [27, 74],
]) as Theme

export const light_purple_SliderThumb = n137 as Theme
export const light_purple_Tooltip = n137 as Theme
export const light_purple_ProgressIndicator = n137 as Theme
const n138 = t([
  [12, 71],
  [13, 71],
  [14, 71],
  [15, 71],
  [16, 71],
  [17, 71],
  [18, 71],
  [19, 82],
  [20, 11],
  [21, 82],
  [22, 11],
  [23, 75],
  [24, 76],
  [25, 75],
  [26, 75],
  [27, 81],
]) as Theme

export const light_purple_Input = n138 as Theme
export const light_purple_TextArea = n138 as Theme
const n139 = t([
  [12, 59],
  [13, 59],
  [14, 59],
  [15, 59],
  [16, 59],
  [17, 59],
  [18, 59],
  [19, 70],
  [20, 11],
  [21, 70],
  [22, 11],
  [23, 61],
  [24, 62],
  [25, 61],
  [26, 61],
  [27, 69],
]) as Theme

export const light_pink_ListItem = n139 as Theme
const n140 = t([
  [12, 61],
  [13, 61],
  [14, 61],
  [15, 61],
  [16, 60],
  [17, 59],
  [18, 59],
  [19, 70],
  [20, 11],
  [21, 70],
  [22, 11],
  [23, 63],
  [24, 64],
  [25, 63],
  [26, 63],
  [27, 67],
]) as Theme

export const light_pink_Card = n140 as Theme
export const light_pink_DrawerFrame = n140 as Theme
export const light_pink_Progress = n140 as Theme
export const light_pink_TooltipArrow = n140 as Theme
const n141 = t([
  [12, 62],
  [13, 62],
  [14, 62],
  [15, 62],
  [16, 60],
  [17, 248],
  [18, 59],
  [19, 68],
  [20, 70],
  [21, 68],
  [22, 249],
  [23, 272],
  [24, 272],
  [25, 63],
  [26, 64],
  [27, 66],
]) as Theme

export const light_pink_Button = n141 as Theme
const n142 = t([
  [12, 62],
  [13, 62],
  [14, 62],
  [15, 62],
  [16, 61],
  [17, 60],
  [18, 59],
  [19, 70],
  [20, 11],
  [21, 70],
  [22, 70],
  [23, 64],
  [24, 66],
  [25, 64],
  [26, 64],
  [27, 66],
]) as Theme

export const light_pink_Checkbox = n142 as Theme
export const light_pink_Switch = n142 as Theme
export const light_pink_TooltipContent = n142 as Theme
export const light_pink_SliderTrack = n142 as Theme
const n143 = t([
  [12, 11],
  [13, 11],
  [14, 11],
  [15, 11],
  [16, 11],
  [17, 11],
  [18, 11],
  [19, 60],
  [20, 59],
  [21, 60],
  [22, 59],
  [23, 70],
  [24, 69],
  [25, 70],
  [26, 70],
  [27, 60],
]) as Theme

export const light_pink_SwitchThumb = n143 as Theme
const n144 = t([
  [12, 68],
  [13, 68],
  [14, 68],
  [15, 68],
  [16, 69],
  [17, 70],
  [18, 11],
  [19, 60],
  [20, 59],
  [21, 60],
  [22, 60],
  [23, 66],
  [24, 64],
  [25, 66],
  [26, 66],
  [27, 64],
]) as Theme

export const light_pink_SliderTrackActive = n144 as Theme
const n145 = t([
  [12, 70],
  [13, 70],
  [14, 70],
  [15, 70],
  [16, 11],
  [17, 249],
  [18, 11],
  [19, 60],
  [20, 59],
  [21, 60],
  [22, 248],
  [23, 68],
  [24, 67],
  [25, 68],
  [26, 68],
  [27, 62],
]) as Theme

export const light_pink_SliderThumb = n145 as Theme
export const light_pink_Tooltip = n145 as Theme
export const light_pink_ProgressIndicator = n145 as Theme
const n146 = t([
  [12, 59],
  [13, 59],
  [14, 59],
  [15, 59],
  [16, 59],
  [17, 59],
  [18, 59],
  [19, 70],
  [20, 11],
  [21, 70],
  [22, 11],
  [23, 63],
  [24, 64],
  [25, 63],
  [26, 63],
  [27, 69],
]) as Theme

export const light_pink_Input = n146 as Theme
export const light_pink_TextArea = n146 as Theme
const n147 = t([
  [12, 83],
  [13, 83],
  [14, 83],
  [15, 83],
  [16, 83],
  [17, 83],
  [18, 83],
  [19, 94],
  [20, 11],
  [21, 94],
  [22, 11],
  [23, 85],
  [24, 86],
  [25, 85],
  [26, 85],
  [27, 93],
]) as Theme

export const light_red_ListItem = n147 as Theme
const n148 = t([
  [12, 85],
  [13, 85],
  [14, 85],
  [15, 85],
  [16, 84],
  [17, 83],
  [18, 83],
  [19, 94],
  [20, 11],
  [21, 94],
  [22, 11],
  [23, 87],
  [24, 88],
  [25, 87],
  [26, 87],
  [27, 91],
]) as Theme

export const light_red_Card = n148 as Theme
export const light_red_DrawerFrame = n148 as Theme
export const light_red_Progress = n148 as Theme
export const light_red_TooltipArrow = n148 as Theme
const n149 = t([
  [12, 86],
  [13, 86],
  [14, 86],
  [15, 86],
  [16, 84],
  [17, 250],
  [18, 83],
  [19, 92],
  [20, 94],
  [21, 92],
  [22, 251],
  [23, 272],
  [24, 272],
  [25, 87],
  [26, 88],
  [27, 90],
]) as Theme

export const light_red_Button = n149 as Theme
const n150 = t([
  [12, 86],
  [13, 86],
  [14, 86],
  [15, 86],
  [16, 85],
  [17, 84],
  [18, 83],
  [19, 94],
  [20, 11],
  [21, 94],
  [22, 94],
  [23, 88],
  [24, 90],
  [25, 88],
  [26, 88],
  [27, 90],
]) as Theme

export const light_red_Checkbox = n150 as Theme
export const light_red_Switch = n150 as Theme
export const light_red_TooltipContent = n150 as Theme
export const light_red_SliderTrack = n150 as Theme
const n151 = t([
  [12, 11],
  [13, 11],
  [14, 11],
  [15, 11],
  [16, 11],
  [17, 11],
  [18, 11],
  [19, 84],
  [20, 83],
  [21, 84],
  [22, 83],
  [23, 94],
  [24, 93],
  [25, 94],
  [26, 94],
  [27, 84],
]) as Theme

export const light_red_SwitchThumb = n151 as Theme
const n152 = t([
  [12, 92],
  [13, 92],
  [14, 92],
  [15, 92],
  [16, 93],
  [17, 94],
  [18, 11],
  [19, 84],
  [20, 83],
  [21, 84],
  [22, 84],
  [23, 90],
  [24, 88],
  [25, 90],
  [26, 90],
  [27, 88],
]) as Theme

export const light_red_SliderTrackActive = n152 as Theme
const n153 = t([
  [12, 94],
  [13, 94],
  [14, 94],
  [15, 94],
  [16, 11],
  [17, 251],
  [18, 11],
  [19, 84],
  [20, 83],
  [21, 84],
  [22, 250],
  [23, 92],
  [24, 91],
  [25, 92],
  [26, 92],
  [27, 86],
]) as Theme

export const light_red_SliderThumb = n153 as Theme
export const light_red_Tooltip = n153 as Theme
export const light_red_ProgressIndicator = n153 as Theme
const n154 = t([
  [12, 83],
  [13, 83],
  [14, 83],
  [15, 83],
  [16, 83],
  [17, 83],
  [18, 83],
  [19, 94],
  [20, 11],
  [21, 94],
  [22, 11],
  [23, 87],
  [24, 88],
  [25, 87],
  [26, 87],
  [27, 93],
]) as Theme

export const light_red_Input = n154 as Theme
export const light_red_TextArea = n154 as Theme
const n155 = t([
  [12, 107],
  [13, 107],
  [14, 107],
  [15, 107],
  [16, 107],
  [17, 107],
  [18, 107],
  [19, 118],
  [20, 11],
  [21, 118],
  [22, 11],
  [23, 109],
  [24, 110],
  [25, 109],
  [26, 109],
  [27, 117],
]) as Theme

export const light_gold_ListItem = n155 as Theme
const n156 = t([
  [12, 109],
  [13, 109],
  [14, 109],
  [15, 109],
  [16, 108],
  [17, 107],
  [18, 107],
  [19, 118],
  [20, 11],
  [21, 118],
  [22, 11],
  [23, 111],
  [24, 112],
  [25, 111],
  [26, 111],
  [27, 115],
]) as Theme

export const light_gold_Card = n156 as Theme
export const light_gold_DrawerFrame = n156 as Theme
export const light_gold_Progress = n156 as Theme
export const light_gold_TooltipArrow = n156 as Theme
const n157 = t([
  [12, 110],
  [13, 110],
  [14, 110],
  [15, 110],
  [16, 108],
  [17, 252],
  [18, 107],
  [19, 116],
  [20, 118],
  [21, 116],
  [22, 253],
  [23, 272],
  [24, 272],
  [25, 111],
  [26, 112],
  [27, 114],
]) as Theme

export const light_gold_Button = n157 as Theme
const n158 = t([
  [12, 110],
  [13, 110],
  [14, 110],
  [15, 110],
  [16, 109],
  [17, 108],
  [18, 107],
  [19, 118],
  [20, 11],
  [21, 118],
  [22, 118],
  [23, 112],
  [24, 114],
  [25, 112],
  [26, 112],
  [27, 114],
]) as Theme

export const light_gold_Checkbox = n158 as Theme
export const light_gold_Switch = n158 as Theme
export const light_gold_TooltipContent = n158 as Theme
export const light_gold_SliderTrack = n158 as Theme
const n159 = t([
  [12, 11],
  [13, 11],
  [14, 11],
  [15, 11],
  [16, 11],
  [17, 11],
  [18, 11],
  [19, 108],
  [20, 107],
  [21, 108],
  [22, 107],
  [23, 118],
  [24, 117],
  [25, 118],
  [26, 118],
  [27, 108],
]) as Theme

export const light_gold_SwitchThumb = n159 as Theme
const n160 = t([
  [12, 116],
  [13, 116],
  [14, 116],
  [15, 116],
  [16, 117],
  [17, 118],
  [18, 11],
  [19, 108],
  [20, 107],
  [21, 108],
  [22, 108],
  [23, 114],
  [24, 112],
  [25, 114],
  [26, 114],
  [27, 112],
]) as Theme

export const light_gold_SliderTrackActive = n160 as Theme
const n161 = t([
  [12, 118],
  [13, 118],
  [14, 118],
  [15, 118],
  [16, 11],
  [17, 253],
  [18, 11],
  [19, 108],
  [20, 107],
  [21, 108],
  [22, 252],
  [23, 116],
  [24, 115],
  [25, 116],
  [26, 116],
  [27, 110],
]) as Theme

export const light_gold_SliderThumb = n161 as Theme
export const light_gold_Tooltip = n161 as Theme
export const light_gold_ProgressIndicator = n161 as Theme
const n162 = t([
  [12, 107],
  [13, 107],
  [14, 107],
  [15, 107],
  [16, 107],
  [17, 107],
  [18, 107],
  [19, 118],
  [20, 11],
  [21, 118],
  [22, 11],
  [23, 111],
  [24, 112],
  [25, 111],
  [26, 111],
  [27, 117],
]) as Theme

export const light_gold_Input = n162 as Theme
export const light_gold_TextArea = n162 as Theme
const n163 = t([
  [12, 119],
  [13, 119],
  [14, 119],
  [15, 119],
  [16, 119],
  [17, 119],
  [18, 119],
  [19, 128],
  [20, 11],
  [21, 128],
  [22, 11],
  [23, 0],
  [24, 122],
  [25, 0],
  [26, 0],
  [27, 127],
]) as Theme

export const light_send_ListItem = n163 as Theme
const n164 = t([
  [12, 0],
  [13, 0],
  [14, 0],
  [15, 0],
  [16, 120],
  [17, 119],
  [18, 119],
  [19, 128],
  [20, 11],
  [21, 128],
  [22, 11],
  [23, 121],
  [24, 119],
  [25, 121],
  [26, 121],
  [27, 125],
]) as Theme

export const light_send_Card = n164 as Theme
export const light_send_DrawerFrame = n164 as Theme
export const light_send_Progress = n164 as Theme
export const light_send_TooltipArrow = n164 as Theme
const n165 = t([
  [12, 122],
  [13, 122],
  [14, 122],
  [15, 122],
  [16, 120],
  [17, 119],
  [18, 119],
  [19, 126],
  [20, 128],
  [21, 126],
  [22, 254],
  [23, 272],
  [24, 272],
  [25, 121],
  [26, 119],
  [27, 124],
]) as Theme

export const light_send_Button = n165 as Theme
const n166 = t([
  [12, 122],
  [13, 122],
  [14, 122],
  [15, 122],
  [16, 0],
  [17, 120],
  [18, 119],
  [19, 128],
  [20, 11],
  [21, 128],
  [22, 128],
  [23, 119],
  [24, 124],
  [25, 119],
  [26, 119],
  [27, 124],
]) as Theme

export const light_send_Checkbox = n166 as Theme
export const light_send_Switch = n166 as Theme
export const light_send_TooltipContent = n166 as Theme
export const light_send_SliderTrack = n166 as Theme
const n167 = t([
  [12, 11],
  [13, 11],
  [14, 11],
  [15, 11],
  [16, 11],
  [17, 11],
  [18, 11],
  [19, 120],
  [20, 119],
  [21, 120],
  [22, 119],
  [23, 128],
  [24, 127],
  [25, 128],
  [26, 128],
  [27, 120],
]) as Theme

export const light_send_SwitchThumb = n167 as Theme
const n168 = t([
  [12, 126],
  [13, 126],
  [14, 126],
  [15, 126],
  [16, 127],
  [17, 128],
  [18, 11],
  [19, 120],
  [20, 119],
  [21, 120],
  [22, 120],
  [23, 124],
  [24, 119],
  [25, 124],
  [26, 124],
  [27, 119],
]) as Theme

export const light_send_SliderTrackActive = n168 as Theme
const n169 = t([
  [12, 128],
  [13, 128],
  [14, 128],
  [15, 128],
  [16, 11],
  [17, 254],
  [18, 11],
  [19, 120],
  [20, 119],
  [21, 120],
  [22, 119],
  [23, 126],
  [24, 125],
  [25, 126],
  [26, 126],
  [27, 122],
]) as Theme

export const light_send_SliderThumb = n169 as Theme
export const light_send_Tooltip = n169 as Theme
export const light_send_ProgressIndicator = n169 as Theme
const n170 = t([
  [12, 119],
  [13, 119],
  [14, 119],
  [15, 119],
  [16, 119],
  [17, 119],
  [18, 119],
  [19, 128],
  [20, 11],
  [21, 128],
  [22, 11],
  [23, 121],
  [24, 119],
  [25, 121],
  [26, 121],
  [27, 127],
]) as Theme

export const light_send_Input = n170 as Theme
export const light_send_TextArea = n170 as Theme
const n171 = t([
  [12, 176],
  [13, 176],
  [14, 176],
  [15, 176],
  [16, 175],
  [17, 255],
  [18, 175],
  [19, 185],
  [20, 141],
  [21, 185],
  [22, 256],
  [23, 175],
  [24, 180],
  [25, 176],
  [26, 176],
  [27, 183],
]) as Theme

export const dark_orange_ListItem = n171 as Theme
const n172 = t([
  [12, 177],
  [13, 177],
  [14, 177],
  [15, 177],
  [16, 176],
  [17, 175],
  [18, 175],
  [19, 185],
  [20, 141],
  [21, 185],
  [22, 141],
  [23, 176],
  [24, 182],
  [25, 177],
  [26, 177],
  [27, 55],
]) as Theme

export const dark_orange_Card = n172 as Theme
export const dark_orange_DrawerFrame = n172 as Theme
export const dark_orange_Progress = n172 as Theme
export const dark_orange_TooltipArrow = n172 as Theme
const n173 = t([
  [12, 178],
  [13, 178],
  [14, 178],
  [15, 178],
  [16, 176],
  [17, 255],
  [18, 175],
  [19, 183],
  [20, 185],
  [21, 183],
  [22, 256],
  [23, 272],
  [24, 272],
  [25, 177],
  [26, 178],
  [27, 182],
]) as Theme

export const dark_orange_Button = n173 as Theme
const n174 = t([
  [12, 178],
  [13, 178],
  [14, 178],
  [15, 178],
  [16, 177],
  [17, 176],
  [18, 175],
  [19, 185],
  [20, 141],
  [21, 185],
  [22, 185],
  [23, 177],
  [24, 55],
  [25, 178],
  [26, 178],
  [27, 182],
]) as Theme

export const dark_orange_Checkbox = n174 as Theme
export const dark_orange_Switch = n174 as Theme
export const dark_orange_TooltipContent = n174 as Theme
export const dark_orange_SliderTrack = n174 as Theme
const n175 = t([
  [12, 141],
  [13, 141],
  [14, 141],
  [15, 141],
  [16, 141],
  [17, 141],
  [18, 141],
  [19, 176],
  [20, 175],
  [21, 176],
  [22, 175],
  [23, 141],
  [24, 183],
  [25, 141],
  [26, 141],
  [27, 176],
]) as Theme

export const dark_orange_SwitchThumb = n175 as Theme
const n176 = t([
  [12, 183],
  [13, 183],
  [14, 183],
  [15, 183],
  [16, 184],
  [17, 185],
  [18, 141],
  [19, 176],
  [20, 175],
  [21, 176],
  [22, 176],
  [23, 184],
  [24, 179],
  [25, 183],
  [26, 183],
  [27, 180],
]) as Theme

export const dark_orange_SliderTrackActive = n176 as Theme
const n177 = t([
  [12, 185],
  [13, 185],
  [14, 185],
  [15, 185],
  [16, 141],
  [17, 256],
  [18, 141],
  [19, 176],
  [20, 175],
  [21, 176],
  [22, 255],
  [23, 141],
  [24, 182],
  [25, 185],
  [26, 185],
  [27, 178],
]) as Theme

export const dark_orange_SliderThumb = n177 as Theme
export const dark_orange_Tooltip = n177 as Theme
export const dark_orange_ProgressIndicator = n177 as Theme
const n178 = t([
  [12, 176],
  [13, 176],
  [14, 176],
  [15, 176],
  [16, 175],
  [17, 255],
  [18, 175],
  [19, 185],
  [20, 141],
  [21, 185],
  [22, 256],
  [23, 176],
  [24, 182],
  [25, 177],
  [26, 177],
  [27, 183],
]) as Theme

export const dark_orange_Input = n178 as Theme
export const dark_orange_TextArea = n178 as Theme
const n179 = t([
  [12, 217],
  [13, 217],
  [14, 217],
  [15, 217],
  [16, 216],
  [17, 257],
  [18, 216],
  [19, 226],
  [20, 141],
  [21, 226],
  [22, 258],
  [23, 216],
  [24, 221],
  [25, 217],
  [26, 217],
  [27, 224],
]) as Theme

export const dark_yellow_ListItem = n179 as Theme
const n180 = t([
  [12, 218],
  [13, 218],
  [14, 218],
  [15, 218],
  [16, 217],
  [17, 216],
  [18, 216],
  [19, 226],
  [20, 141],
  [21, 226],
  [22, 141],
  [23, 217],
  [24, 223],
  [25, 218],
  [26, 218],
  [27, 103],
]) as Theme

export const dark_yellow_Card = n180 as Theme
export const dark_yellow_DrawerFrame = n180 as Theme
export const dark_yellow_Progress = n180 as Theme
export const dark_yellow_TooltipArrow = n180 as Theme
const n181 = t([
  [12, 219],
  [13, 219],
  [14, 219],
  [15, 219],
  [16, 217],
  [17, 257],
  [18, 216],
  [19, 224],
  [20, 226],
  [21, 224],
  [22, 258],
  [23, 272],
  [24, 272],
  [25, 218],
  [26, 219],
  [27, 223],
]) as Theme

export const dark_yellow_Button = n181 as Theme
const n182 = t([
  [12, 219],
  [13, 219],
  [14, 219],
  [15, 219],
  [16, 218],
  [17, 217],
  [18, 216],
  [19, 226],
  [20, 141],
  [21, 226],
  [22, 226],
  [23, 218],
  [24, 103],
  [25, 219],
  [26, 219],
  [27, 223],
]) as Theme

export const dark_yellow_Checkbox = n182 as Theme
export const dark_yellow_Switch = n182 as Theme
export const dark_yellow_TooltipContent = n182 as Theme
export const dark_yellow_SliderTrack = n182 as Theme
const n183 = t([
  [12, 141],
  [13, 141],
  [14, 141],
  [15, 141],
  [16, 141],
  [17, 141],
  [18, 141],
  [19, 217],
  [20, 216],
  [21, 217],
  [22, 216],
  [23, 141],
  [24, 224],
  [25, 141],
  [26, 141],
  [27, 217],
]) as Theme

export const dark_yellow_SwitchThumb = n183 as Theme
const n184 = t([
  [12, 224],
  [13, 224],
  [14, 224],
  [15, 224],
  [16, 225],
  [17, 226],
  [18, 141],
  [19, 217],
  [20, 216],
  [21, 217],
  [22, 217],
  [23, 225],
  [24, 220],
  [25, 224],
  [26, 224],
  [27, 221],
]) as Theme

export const dark_yellow_SliderTrackActive = n184 as Theme
const n185 = t([
  [12, 226],
  [13, 226],
  [14, 226],
  [15, 226],
  [16, 141],
  [17, 258],
  [18, 141],
  [19, 217],
  [20, 216],
  [21, 217],
  [22, 257],
  [23, 141],
  [24, 223],
  [25, 226],
  [26, 226],
  [27, 219],
]) as Theme

export const dark_yellow_SliderThumb = n185 as Theme
export const dark_yellow_Tooltip = n185 as Theme
export const dark_yellow_ProgressIndicator = n185 as Theme
const n186 = t([
  [12, 217],
  [13, 217],
  [14, 217],
  [15, 217],
  [16, 216],
  [17, 257],
  [18, 216],
  [19, 226],
  [20, 141],
  [21, 226],
  [22, 258],
  [23, 217],
  [24, 223],
  [25, 218],
  [26, 218],
  [27, 224],
]) as Theme

export const dark_yellow_Input = n186 as Theme
export const dark_yellow_TextArea = n186 as Theme
const n187 = t([
  [12, 165],
  [13, 165],
  [14, 165],
  [15, 165],
  [16, 164],
  [17, 259],
  [18, 164],
  [19, 174],
  [20, 141],
  [21, 174],
  [22, 260],
  [23, 164],
  [24, 169],
  [25, 165],
  [26, 165],
  [27, 172],
]) as Theme

export const dark_green_ListItem = n187 as Theme
const n188 = t([
  [12, 166],
  [13, 166],
  [14, 166],
  [15, 166],
  [16, 165],
  [17, 164],
  [18, 164],
  [19, 174],
  [20, 141],
  [21, 174],
  [22, 141],
  [23, 165],
  [24, 171],
  [25, 166],
  [26, 166],
  [27, 43],
]) as Theme

export const dark_green_Card = n188 as Theme
export const dark_green_DrawerFrame = n188 as Theme
export const dark_green_Progress = n188 as Theme
export const dark_green_TooltipArrow = n188 as Theme
const n189 = t([
  [12, 167],
  [13, 167],
  [14, 167],
  [15, 167],
  [16, 165],
  [17, 259],
  [18, 164],
  [19, 172],
  [20, 174],
  [21, 172],
  [22, 260],
  [23, 272],
  [24, 272],
  [25, 166],
  [26, 167],
  [27, 171],
]) as Theme

export const dark_green_Button = n189 as Theme
const n190 = t([
  [12, 167],
  [13, 167],
  [14, 167],
  [15, 167],
  [16, 166],
  [17, 165],
  [18, 164],
  [19, 174],
  [20, 141],
  [21, 174],
  [22, 174],
  [23, 166],
  [24, 43],
  [25, 167],
  [26, 167],
  [27, 171],
]) as Theme

export const dark_green_Checkbox = n190 as Theme
export const dark_green_Switch = n190 as Theme
export const dark_green_TooltipContent = n190 as Theme
export const dark_green_SliderTrack = n190 as Theme
const n191 = t([
  [12, 141],
  [13, 141],
  [14, 141],
  [15, 141],
  [16, 141],
  [17, 141],
  [18, 141],
  [19, 165],
  [20, 164],
  [21, 165],
  [22, 164],
  [23, 141],
  [24, 172],
  [25, 141],
  [26, 141],
  [27, 165],
]) as Theme

export const dark_green_SwitchThumb = n191 as Theme
const n192 = t([
  [12, 172],
  [13, 172],
  [14, 172],
  [15, 172],
  [16, 173],
  [17, 174],
  [18, 141],
  [19, 165],
  [20, 164],
  [21, 165],
  [22, 165],
  [23, 173],
  [24, 168],
  [25, 172],
  [26, 172],
  [27, 169],
]) as Theme

export const dark_green_SliderTrackActive = n192 as Theme
const n193 = t([
  [12, 174],
  [13, 174],
  [14, 174],
  [15, 174],
  [16, 141],
  [17, 260],
  [18, 141],
  [19, 165],
  [20, 164],
  [21, 165],
  [22, 259],
  [23, 141],
  [24, 171],
  [25, 174],
  [26, 174],
  [27, 167],
]) as Theme

export const dark_green_SliderThumb = n193 as Theme
export const dark_green_Tooltip = n193 as Theme
export const dark_green_ProgressIndicator = n193 as Theme
const n194 = t([
  [12, 165],
  [13, 165],
  [14, 165],
  [15, 165],
  [16, 164],
  [17, 259],
  [18, 164],
  [19, 174],
  [20, 141],
  [21, 174],
  [22, 260],
  [23, 165],
  [24, 171],
  [25, 166],
  [26, 166],
  [27, 172],
]) as Theme

export const dark_green_Input = n194 as Theme
export const dark_green_TextArea = n194 as Theme
const n195 = t([
  [12, 143],
  [13, 143],
  [14, 143],
  [15, 143],
  [16, 142],
  [17, 261],
  [18, 142],
  [19, 152],
  [20, 141],
  [21, 152],
  [22, 262],
  [23, 142],
  [24, 147],
  [25, 143],
  [26, 143],
  [27, 150],
]) as Theme

export const dark_blue_ListItem = n195 as Theme
const n196 = t([
  [12, 144],
  [13, 144],
  [14, 144],
  [15, 144],
  [16, 143],
  [17, 142],
  [18, 142],
  [19, 152],
  [20, 141],
  [21, 152],
  [22, 141],
  [23, 143],
  [24, 149],
  [25, 144],
  [26, 144],
  [27, 22],
]) as Theme

export const dark_blue_Card = n196 as Theme
export const dark_blue_DrawerFrame = n196 as Theme
export const dark_blue_Progress = n196 as Theme
export const dark_blue_TooltipArrow = n196 as Theme
const n197 = t([
  [12, 145],
  [13, 145],
  [14, 145],
  [15, 145],
  [16, 143],
  [17, 261],
  [18, 142],
  [19, 150],
  [20, 152],
  [21, 150],
  [22, 262],
  [23, 272],
  [24, 272],
  [25, 144],
  [26, 145],
  [27, 149],
]) as Theme

export const dark_blue_Button = n197 as Theme
const n198 = t([
  [12, 145],
  [13, 145],
  [14, 145],
  [15, 145],
  [16, 144],
  [17, 143],
  [18, 142],
  [19, 152],
  [20, 141],
  [21, 152],
  [22, 152],
  [23, 144],
  [24, 22],
  [25, 145],
  [26, 145],
  [27, 149],
]) as Theme

export const dark_blue_Checkbox = n198 as Theme
export const dark_blue_Switch = n198 as Theme
export const dark_blue_TooltipContent = n198 as Theme
export const dark_blue_SliderTrack = n198 as Theme
const n199 = t([
  [12, 141],
  [13, 141],
  [14, 141],
  [15, 141],
  [16, 141],
  [17, 141],
  [18, 141],
  [19, 143],
  [20, 142],
  [21, 143],
  [22, 142],
  [23, 141],
  [24, 150],
  [25, 141],
  [26, 141],
  [27, 143],
]) as Theme

export const dark_blue_SwitchThumb = n199 as Theme
const n200 = t([
  [12, 150],
  [13, 150],
  [14, 150],
  [15, 150],
  [16, 151],
  [17, 152],
  [18, 141],
  [19, 143],
  [20, 142],
  [21, 143],
  [22, 143],
  [23, 151],
  [24, 146],
  [25, 150],
  [26, 150],
  [27, 147],
]) as Theme

export const dark_blue_SliderTrackActive = n200 as Theme
const n201 = t([
  [12, 152],
  [13, 152],
  [14, 152],
  [15, 152],
  [16, 141],
  [17, 262],
  [18, 141],
  [19, 143],
  [20, 142],
  [21, 143],
  [22, 261],
  [23, 141],
  [24, 149],
  [25, 152],
  [26, 152],
  [27, 145],
]) as Theme

export const dark_blue_SliderThumb = n201 as Theme
export const dark_blue_Tooltip = n201 as Theme
export const dark_blue_ProgressIndicator = n201 as Theme
const n202 = t([
  [12, 143],
  [13, 143],
  [14, 143],
  [15, 143],
  [16, 142],
  [17, 261],
  [18, 142],
  [19, 152],
  [20, 141],
  [21, 152],
  [22, 262],
  [23, 143],
  [24, 149],
  [25, 144],
  [26, 144],
  [27, 150],
]) as Theme

export const dark_blue_Input = n202 as Theme
export const dark_blue_TextArea = n202 as Theme
const n203 = t([
  [12, 198],
  [13, 198],
  [14, 198],
  [15, 198],
  [16, 197],
  [17, 263],
  [18, 197],
  [19, 207],
  [20, 141],
  [21, 207],
  [22, 264],
  [23, 197],
  [24, 202],
  [25, 198],
  [26, 198],
  [27, 205],
]) as Theme

export const dark_purple_ListItem = n203 as Theme
const n204 = t([
  [12, 199],
  [13, 199],
  [14, 199],
  [15, 199],
  [16, 198],
  [17, 197],
  [18, 197],
  [19, 207],
  [20, 141],
  [21, 207],
  [22, 141],
  [23, 198],
  [24, 204],
  [25, 199],
  [26, 199],
  [27, 79],
]) as Theme

export const dark_purple_Card = n204 as Theme
export const dark_purple_DrawerFrame = n204 as Theme
export const dark_purple_Progress = n204 as Theme
export const dark_purple_TooltipArrow = n204 as Theme
const n205 = t([
  [12, 200],
  [13, 200],
  [14, 200],
  [15, 200],
  [16, 198],
  [17, 263],
  [18, 197],
  [19, 205],
  [20, 207],
  [21, 205],
  [22, 264],
  [23, 272],
  [24, 272],
  [25, 199],
  [26, 200],
  [27, 204],
]) as Theme

export const dark_purple_Button = n205 as Theme
const n206 = t([
  [12, 200],
  [13, 200],
  [14, 200],
  [15, 200],
  [16, 199],
  [17, 198],
  [18, 197],
  [19, 207],
  [20, 141],
  [21, 207],
  [22, 207],
  [23, 199],
  [24, 79],
  [25, 200],
  [26, 200],
  [27, 204],
]) as Theme

export const dark_purple_Checkbox = n206 as Theme
export const dark_purple_Switch = n206 as Theme
export const dark_purple_TooltipContent = n206 as Theme
export const dark_purple_SliderTrack = n206 as Theme
const n207 = t([
  [12, 141],
  [13, 141],
  [14, 141],
  [15, 141],
  [16, 141],
  [17, 141],
  [18, 141],
  [19, 198],
  [20, 197],
  [21, 198],
  [22, 197],
  [23, 141],
  [24, 205],
  [25, 141],
  [26, 141],
  [27, 198],
]) as Theme

export const dark_purple_SwitchThumb = n207 as Theme
const n208 = t([
  [12, 205],
  [13, 205],
  [14, 205],
  [15, 205],
  [16, 206],
  [17, 207],
  [18, 141],
  [19, 198],
  [20, 197],
  [21, 198],
  [22, 198],
  [23, 206],
  [24, 201],
  [25, 205],
  [26, 205],
  [27, 202],
]) as Theme

export const dark_purple_SliderTrackActive = n208 as Theme
const n209 = t([
  [12, 207],
  [13, 207],
  [14, 207],
  [15, 207],
  [16, 141],
  [17, 264],
  [18, 141],
  [19, 198],
  [20, 197],
  [21, 198],
  [22, 263],
  [23, 141],
  [24, 204],
  [25, 207],
  [26, 207],
  [27, 200],
]) as Theme

export const dark_purple_SliderThumb = n209 as Theme
export const dark_purple_Tooltip = n209 as Theme
export const dark_purple_ProgressIndicator = n209 as Theme
const n210 = t([
  [12, 198],
  [13, 198],
  [14, 198],
  [15, 198],
  [16, 197],
  [17, 263],
  [18, 197],
  [19, 207],
  [20, 141],
  [21, 207],
  [22, 264],
  [23, 198],
  [24, 204],
  [25, 199],
  [26, 199],
  [27, 205],
]) as Theme

export const dark_purple_Input = n210 as Theme
export const dark_purple_TextArea = n210 as Theme
const n211 = t([
  [12, 187],
  [13, 187],
  [14, 187],
  [15, 187],
  [16, 186],
  [17, 265],
  [18, 186],
  [19, 196],
  [20, 141],
  [21, 196],
  [22, 266],
  [23, 186],
  [24, 191],
  [25, 187],
  [26, 187],
  [27, 194],
]) as Theme

export const dark_pink_ListItem = n211 as Theme
const n212 = t([
  [12, 188],
  [13, 188],
  [14, 188],
  [15, 188],
  [16, 187],
  [17, 186],
  [18, 186],
  [19, 196],
  [20, 141],
  [21, 196],
  [22, 141],
  [23, 187],
  [24, 193],
  [25, 188],
  [26, 188],
  [27, 67],
]) as Theme

export const dark_pink_Card = n212 as Theme
export const dark_pink_DrawerFrame = n212 as Theme
export const dark_pink_Progress = n212 as Theme
export const dark_pink_TooltipArrow = n212 as Theme
const n213 = t([
  [12, 189],
  [13, 189],
  [14, 189],
  [15, 189],
  [16, 187],
  [17, 265],
  [18, 186],
  [19, 194],
  [20, 196],
  [21, 194],
  [22, 266],
  [23, 272],
  [24, 272],
  [25, 188],
  [26, 189],
  [27, 193],
]) as Theme

export const dark_pink_Button = n213 as Theme
const n214 = t([
  [12, 189],
  [13, 189],
  [14, 189],
  [15, 189],
  [16, 188],
  [17, 187],
  [18, 186],
  [19, 196],
  [20, 141],
  [21, 196],
  [22, 196],
  [23, 188],
  [24, 67],
  [25, 189],
  [26, 189],
  [27, 193],
]) as Theme

export const dark_pink_Checkbox = n214 as Theme
export const dark_pink_Switch = n214 as Theme
export const dark_pink_TooltipContent = n214 as Theme
export const dark_pink_SliderTrack = n214 as Theme
const n215 = t([
  [12, 141],
  [13, 141],
  [14, 141],
  [15, 141],
  [16, 141],
  [17, 141],
  [18, 141],
  [19, 187],
  [20, 186],
  [21, 187],
  [22, 186],
  [23, 141],
  [24, 194],
  [25, 141],
  [26, 141],
  [27, 187],
]) as Theme

export const dark_pink_SwitchThumb = n215 as Theme
const n216 = t([
  [12, 194],
  [13, 194],
  [14, 194],
  [15, 194],
  [16, 195],
  [17, 196],
  [18, 141],
  [19, 187],
  [20, 186],
  [21, 187],
  [22, 187],
  [23, 195],
  [24, 190],
  [25, 194],
  [26, 194],
  [27, 191],
]) as Theme

export const dark_pink_SliderTrackActive = n216 as Theme
const n217 = t([
  [12, 196],
  [13, 196],
  [14, 196],
  [15, 196],
  [16, 141],
  [17, 266],
  [18, 141],
  [19, 187],
  [20, 186],
  [21, 187],
  [22, 265],
  [23, 141],
  [24, 193],
  [25, 196],
  [26, 196],
  [27, 189],
]) as Theme

export const dark_pink_SliderThumb = n217 as Theme
export const dark_pink_Tooltip = n217 as Theme
export const dark_pink_ProgressIndicator = n217 as Theme
const n218 = t([
  [12, 187],
  [13, 187],
  [14, 187],
  [15, 187],
  [16, 186],
  [17, 265],
  [18, 186],
  [19, 196],
  [20, 141],
  [21, 196],
  [22, 266],
  [23, 187],
  [24, 193],
  [25, 188],
  [26, 188],
  [27, 194],
]) as Theme

export const dark_pink_Input = n218 as Theme
export const dark_pink_TextArea = n218 as Theme
const n219 = t([
  [12, 120],
  [13, 120],
  [14, 120],
  [15, 120],
  [16, 208],
  [17, 267],
  [18, 208],
  [19, 128],
  [20, 141],
  [21, 128],
  [22, 254],
  [23, 208],
  [24, 212],
  [25, 120],
  [26, 120],
  [27, 215],
]) as Theme

export const dark_red_ListItem = n219 as Theme
const n220 = t([
  [12, 209],
  [13, 209],
  [14, 209],
  [15, 209],
  [16, 120],
  [17, 208],
  [18, 208],
  [19, 128],
  [20, 141],
  [21, 128],
  [22, 141],
  [23, 120],
  [24, 214],
  [25, 209],
  [26, 209],
  [27, 91],
]) as Theme

export const dark_red_Card = n220 as Theme
export const dark_red_DrawerFrame = n220 as Theme
export const dark_red_Progress = n220 as Theme
export const dark_red_TooltipArrow = n220 as Theme
const n221 = t([
  [12, 210],
  [13, 210],
  [14, 210],
  [15, 210],
  [16, 120],
  [17, 267],
  [18, 208],
  [19, 215],
  [20, 128],
  [21, 215],
  [22, 254],
  [23, 272],
  [24, 272],
  [25, 209],
  [26, 210],
  [27, 214],
]) as Theme

export const dark_red_Button = n221 as Theme
const n222 = t([
  [12, 210],
  [13, 210],
  [14, 210],
  [15, 210],
  [16, 209],
  [17, 120],
  [18, 208],
  [19, 128],
  [20, 141],
  [21, 128],
  [22, 128],
  [23, 209],
  [24, 91],
  [25, 210],
  [26, 210],
  [27, 214],
]) as Theme

export const dark_red_Checkbox = n222 as Theme
export const dark_red_Switch = n222 as Theme
export const dark_red_TooltipContent = n222 as Theme
export const dark_red_SliderTrack = n222 as Theme
const n223 = t([
  [12, 141],
  [13, 141],
  [14, 141],
  [15, 141],
  [16, 141],
  [17, 141],
  [18, 141],
  [19, 120],
  [20, 208],
  [21, 120],
  [22, 208],
  [23, 141],
  [24, 215],
  [25, 141],
  [26, 141],
  [27, 120],
]) as Theme

export const dark_red_SwitchThumb = n223 as Theme
const n224 = t([
  [12, 215],
  [13, 215],
  [14, 215],
  [15, 215],
  [16, 127],
  [17, 128],
  [18, 141],
  [19, 120],
  [20, 208],
  [21, 120],
  [22, 120],
  [23, 127],
  [24, 211],
  [25, 215],
  [26, 215],
  [27, 212],
]) as Theme

export const dark_red_SliderTrackActive = n224 as Theme
const n225 = t([
  [12, 128],
  [13, 128],
  [14, 128],
  [15, 128],
  [16, 141],
  [17, 254],
  [18, 141],
  [19, 120],
  [20, 208],
  [21, 120],
  [22, 267],
  [23, 141],
  [24, 214],
  [25, 128],
  [26, 128],
  [27, 210],
]) as Theme

export const dark_red_SliderThumb = n225 as Theme
export const dark_red_Tooltip = n225 as Theme
export const dark_red_ProgressIndicator = n225 as Theme
const n226 = t([
  [12, 120],
  [13, 120],
  [14, 120],
  [15, 120],
  [16, 208],
  [17, 267],
  [18, 208],
  [19, 128],
  [20, 141],
  [21, 128],
  [22, 254],
  [23, 120],
  [24, 214],
  [25, 209],
  [26, 209],
  [27, 215],
]) as Theme

export const dark_red_Input = n226 as Theme
export const dark_red_TextArea = n226 as Theme
const n227 = t([
  [12, 228],
  [13, 228],
  [14, 228],
  [15, 228],
  [16, 227],
  [17, 268],
  [18, 227],
  [19, 237],
  [20, 141],
  [21, 237],
  [22, 269],
  [23, 227],
  [24, 232],
  [25, 228],
  [26, 228],
  [27, 235],
]) as Theme

export const dark_gold_ListItem = n227 as Theme
const n228 = t([
  [12, 229],
  [13, 229],
  [14, 229],
  [15, 229],
  [16, 228],
  [17, 227],
  [18, 227],
  [19, 237],
  [20, 141],
  [21, 237],
  [22, 141],
  [23, 228],
  [24, 234],
  [25, 229],
  [26, 229],
  [27, 115],
]) as Theme

export const dark_gold_Card = n228 as Theme
export const dark_gold_DrawerFrame = n228 as Theme
export const dark_gold_Progress = n228 as Theme
export const dark_gold_TooltipArrow = n228 as Theme
const n229 = t([
  [12, 230],
  [13, 230],
  [14, 230],
  [15, 230],
  [16, 228],
  [17, 268],
  [18, 227],
  [19, 235],
  [20, 237],
  [21, 235],
  [22, 269],
  [23, 272],
  [24, 272],
  [25, 229],
  [26, 230],
  [27, 234],
]) as Theme

export const dark_gold_Button = n229 as Theme
const n230 = t([
  [12, 230],
  [13, 230],
  [14, 230],
  [15, 230],
  [16, 229],
  [17, 228],
  [18, 227],
  [19, 237],
  [20, 141],
  [21, 237],
  [22, 237],
  [23, 229],
  [24, 115],
  [25, 230],
  [26, 230],
  [27, 234],
]) as Theme

export const dark_gold_Checkbox = n230 as Theme
export const dark_gold_Switch = n230 as Theme
export const dark_gold_TooltipContent = n230 as Theme
export const dark_gold_SliderTrack = n230 as Theme
const n231 = t([
  [12, 141],
  [13, 141],
  [14, 141],
  [15, 141],
  [16, 141],
  [17, 141],
  [18, 141],
  [19, 228],
  [20, 227],
  [21, 228],
  [22, 227],
  [23, 141],
  [24, 235],
  [25, 141],
  [26, 141],
  [27, 228],
]) as Theme

export const dark_gold_SwitchThumb = n231 as Theme
const n232 = t([
  [12, 235],
  [13, 235],
  [14, 235],
  [15, 235],
  [16, 236],
  [17, 237],
  [18, 141],
  [19, 228],
  [20, 227],
  [21, 228],
  [22, 228],
  [23, 236],
  [24, 231],
  [25, 235],
  [26, 235],
  [27, 232],
]) as Theme

export const dark_gold_SliderTrackActive = n232 as Theme
const n233 = t([
  [12, 237],
  [13, 237],
  [14, 237],
  [15, 237],
  [16, 141],
  [17, 269],
  [18, 141],
  [19, 228],
  [20, 227],
  [21, 228],
  [22, 268],
  [23, 141],
  [24, 234],
  [25, 237],
  [26, 237],
  [27, 230],
]) as Theme

export const dark_gold_SliderThumb = n233 as Theme
export const dark_gold_Tooltip = n233 as Theme
export const dark_gold_ProgressIndicator = n233 as Theme
const n234 = t([
  [12, 228],
  [13, 228],
  [14, 228],
  [15, 228],
  [16, 227],
  [17, 268],
  [18, 227],
  [19, 237],
  [20, 141],
  [21, 237],
  [22, 269],
  [23, 228],
  [24, 234],
  [25, 229],
  [26, 229],
  [27, 235],
]) as Theme

export const dark_gold_Input = n234 as Theme
export const dark_gold_TextArea = n234 as Theme
const n235 = t([
  [12, 120],
  [13, 120],
  [14, 120],
  [15, 120],
  [16, 119],
  [17, 119],
  [18, 119],
  [19, 128],
  [20, 141],
  [21, 128],
  [22, 254],
  [23, 119],
  [24, 119],
  [25, 120],
  [26, 120],
  [27, 126],
]) as Theme

export const dark_send_ListItem = n235 as Theme
const n236 = t([
  [12, 121],
  [13, 121],
  [14, 121],
  [15, 121],
  [16, 120],
  [17, 119],
  [18, 119],
  [19, 128],
  [20, 141],
  [21, 128],
  [22, 141],
  [23, 120],
  [24, 124],
  [25, 121],
  [26, 121],
  [27, 125],
]) as Theme

export const dark_send_Card = n236 as Theme
export const dark_send_DrawerFrame = n236 as Theme
export const dark_send_Progress = n236 as Theme
export const dark_send_TooltipArrow = n236 as Theme
const n237 = t([
  [12, 122],
  [13, 122],
  [14, 122],
  [15, 122],
  [16, 120],
  [17, 119],
  [18, 119],
  [19, 126],
  [20, 128],
  [21, 126],
  [22, 254],
  [23, 272],
  [24, 272],
  [25, 121],
  [26, 122],
  [27, 124],
]) as Theme

export const dark_send_Button = n237 as Theme
const n238 = t([
  [12, 122],
  [13, 122],
  [14, 122],
  [15, 122],
  [16, 121],
  [17, 120],
  [18, 119],
  [19, 128],
  [20, 141],
  [21, 128],
  [22, 128],
  [23, 121],
  [24, 125],
  [25, 122],
  [26, 122],
  [27, 124],
]) as Theme

export const dark_send_Checkbox = n238 as Theme
export const dark_send_Switch = n238 as Theme
export const dark_send_TooltipContent = n238 as Theme
export const dark_send_SliderTrack = n238 as Theme
const n239 = t([
  [12, 141],
  [13, 141],
  [14, 141],
  [15, 141],
  [16, 141],
  [17, 141],
  [18, 141],
  [19, 120],
  [20, 119],
  [21, 120],
  [22, 119],
  [23, 141],
  [24, 126],
  [25, 141],
  [26, 141],
  [27, 120],
]) as Theme

export const dark_send_SwitchThumb = n239 as Theme
const n240 = t([
  [12, 126],
  [13, 126],
  [14, 126],
  [15, 126],
  [16, 127],
  [17, 128],
  [18, 141],
  [19, 120],
  [20, 119],
  [21, 120],
  [22, 120],
  [23, 127],
  [24, 121],
  [25, 126],
  [26, 126],
  [27, 119],
]) as Theme

export const dark_send_SliderTrackActive = n240 as Theme
const n241 = t([
  [12, 128],
  [13, 128],
  [14, 128],
  [15, 128],
  [16, 141],
  [17, 254],
  [18, 141],
  [19, 120],
  [20, 119],
  [21, 120],
  [22, 119],
  [23, 141],
  [24, 124],
  [25, 128],
  [26, 128],
  [27, 122],
]) as Theme

export const dark_send_SliderThumb = n241 as Theme
export const dark_send_Tooltip = n241 as Theme
export const dark_send_ProgressIndicator = n241 as Theme
const n242 = t([
  [12, 120],
  [13, 120],
  [14, 120],
  [15, 120],
  [16, 119],
  [17, 119],
  [18, 119],
  [19, 128],
  [20, 141],
  [21, 128],
  [22, 254],
  [23, 120],
  [24, 124],
  [25, 121],
  [26, 121],
  [27, 126],
]) as Theme

export const dark_send_Input = n242 as Theme
export const dark_send_TextArea = n242 as Theme
const n243 = t([
  [12, 1],
  [13, 1],
  [14, 1],
  [15, 1],
  [16, 0],
  [17, 0],
  [18, 1],
  [19, 9],
  [20, 10],
  [21, 9],
  [22, 11],
  [23, 0],
  [24, 5],
  [25, 1],
  [26, 1],
  [27, 8],
]) as Theme

export const light_alt1_ListItem = n243 as Theme
const n244 = t([
  [12, 3],
  [13, 3],
  [14, 3],
  [15, 3],
  [16, 2],
  [17, 1],
  [18, 1],
  [19, 9],
  [20, 10],
  [21, 9],
  [22, 10],
  [23, 2],
  [24, 7],
  [25, 3],
  [26, 3],
  [27, 6],
]) as Theme

export const light_alt1_Card = n244 as Theme
export const light_alt1_DrawerFrame = n244 as Theme
export const light_alt1_Progress = n244 as Theme
export const light_alt1_TooltipArrow = n244 as Theme
const n245 = t([
  [12, 4],
  [13, 4],
  [14, 4],
  [15, 4],
  [16, 2],
  [17, 0],
  [18, 1],
  [19, 7],
  [20, 9],
  [21, 7],
  [22, 11],
  [23, 272],
  [24, 272],
  [25, 3],
  [26, 4],
  [27, 5],
]) as Theme

export const light_alt1_Button = n245 as Theme
const n246 = t([
  [12, 4],
  [13, 4],
  [14, 4],
  [15, 4],
  [16, 3],
  [17, 2],
  [18, 1],
  [19, 9],
  [20, 10],
  [21, 9],
  [22, 9],
  [23, 3],
  [24, 8],
  [25, 4],
  [26, 4],
  [27, 5],
]) as Theme

export const light_alt1_Checkbox = n246 as Theme
export const light_alt1_Switch = n246 as Theme
export const light_alt1_TooltipContent = n246 as Theme
export const light_alt1_SliderTrack = n246 as Theme
const n247 = t([
  [12, 11],
  [13, 11],
  [14, 11],
  [15, 11],
  [16, 11],
  [17, 11],
  [18, 10],
  [19, 2],
  [20, 1],
  [21, 2],
  [22, 0],
  [23, 11],
  [24, 7],
  [25, 11],
  [26, 11],
  [27, 2],
]) as Theme

export const light_alt1_SwitchThumb = n247 as Theme
const n248 = t([
  [12, 7],
  [13, 7],
  [14, 7],
  [15, 7],
  [16, 8],
  [17, 9],
  [18, 10],
  [19, 2],
  [20, 1],
  [21, 2],
  [22, 2],
  [23, 8],
  [24, 3],
  [25, 7],
  [26, 7],
  [27, 6],
]) as Theme

export const light_alt1_SliderTrackActive = n248 as Theme
const n249 = t([
  [12, 9],
  [13, 9],
  [14, 9],
  [15, 9],
  [16, 10],
  [17, 11],
  [18, 10],
  [19, 2],
  [20, 1],
  [21, 2],
  [22, 0],
  [23, 10],
  [24, 5],
  [25, 9],
  [26, 9],
  [27, 4],
]) as Theme

export const light_alt1_SliderThumb = n249 as Theme
export const light_alt1_Tooltip = n249 as Theme
export const light_alt1_ProgressIndicator = n249 as Theme
const n250 = t([
  [12, 1],
  [13, 1],
  [14, 1],
  [15, 1],
  [16, 0],
  [17, 0],
  [18, 1],
  [19, 9],
  [20, 10],
  [21, 9],
  [22, 11],
  [23, 2],
  [24, 7],
  [25, 3],
  [26, 3],
  [27, 8],
]) as Theme

export const light_alt1_Input = n250 as Theme
export const light_alt1_TextArea = n250 as Theme
const n251 = t([
  [12, 2],
  [13, 2],
  [14, 2],
  [15, 2],
  [16, 1],
  [17, 0],
  [18, 2],
  [19, 8],
  [20, 9],
  [21, 8],
  [22, 11],
  [23, 1],
  [24, 6],
  [25, 2],
  [26, 2],
  [27, 7],
]) as Theme

export const light_alt2_ListItem = n251 as Theme
const n252 = t([
  [12, 4],
  [13, 4],
  [14, 4],
  [15, 4],
  [16, 3],
  [17, 2],
  [18, 2],
  [19, 8],
  [20, 9],
  [21, 8],
  [22, 9],
  [23, 3],
  [24, 8],
  [25, 4],
  [26, 4],
  [27, 5],
]) as Theme

export const light_alt2_Card = n252 as Theme
export const light_alt2_DrawerFrame = n252 as Theme
export const light_alt2_Progress = n252 as Theme
export const light_alt2_TooltipArrow = n252 as Theme
const n253 = t([
  [12, 5],
  [13, 5],
  [14, 5],
  [15, 5],
  [16, 3],
  [17, 1],
  [18, 2],
  [19, 6],
  [20, 8],
  [21, 6],
  [22, 10],
  [23, 272],
  [24, 272],
  [25, 4],
  [26, 5],
  [27, 4],
]) as Theme

export const light_alt2_Button = n253 as Theme
const n254 = t([
  [12, 5],
  [13, 5],
  [14, 5],
  [15, 5],
  [16, 4],
  [17, 3],
  [18, 2],
  [19, 8],
  [20, 9],
  [21, 8],
  [22, 8],
  [23, 4],
  [24, 9],
  [25, 5],
  [26, 5],
  [27, 4],
]) as Theme

export const light_alt2_Checkbox = n254 as Theme
export const light_alt2_Switch = n254 as Theme
export const light_alt2_TooltipContent = n254 as Theme
export const light_alt2_SliderTrack = n254 as Theme
const n255 = t([
  [12, 10],
  [13, 10],
  [14, 10],
  [15, 10],
  [16, 11],
  [17, 11],
  [18, 9],
  [19, 3],
  [20, 2],
  [21, 3],
  [22, 0],
  [23, 11],
  [24, 6],
  [25, 10],
  [26, 10],
  [27, 3],
]) as Theme

export const light_alt2_SwitchThumb = n255 as Theme
const n256 = t([
  [12, 6],
  [13, 6],
  [14, 6],
  [15, 6],
  [16, 7],
  [17, 8],
  [18, 9],
  [19, 3],
  [20, 2],
  [21, 3],
  [22, 3],
  [23, 7],
  [24, 2],
  [25, 6],
  [26, 6],
  [27, 7],
]) as Theme

export const light_alt2_SliderTrackActive = n256 as Theme
const n257 = t([
  [12, 8],
  [13, 8],
  [14, 8],
  [15, 8],
  [16, 9],
  [17, 10],
  [18, 9],
  [19, 3],
  [20, 2],
  [21, 3],
  [22, 1],
  [23, 9],
  [24, 4],
  [25, 8],
  [26, 8],
  [27, 5],
]) as Theme

export const light_alt2_SliderThumb = n257 as Theme
export const light_alt2_Tooltip = n257 as Theme
export const light_alt2_ProgressIndicator = n257 as Theme
const n258 = t([
  [12, 2],
  [13, 2],
  [14, 2],
  [15, 2],
  [16, 1],
  [17, 0],
  [18, 2],
  [19, 8],
  [20, 9],
  [21, 8],
  [22, 11],
  [23, 3],
  [24, 8],
  [25, 4],
  [26, 4],
  [27, 7],
]) as Theme

export const light_alt2_Input = n258 as Theme
export const light_alt2_TextArea = n258 as Theme
const n259 = t([
  [12, 3],
  [13, 3],
  [14, 3],
  [15, 3],
  [16, 2],
  [17, 1],
  [19, 7],
  [20, 8],
  [21, 7],
  [22, 10],
  [23, 2],
  [24, 7],
  [25, 3],
  [26, 3],
  [27, 6],
]) as Theme

export const light_active_ListItem = n259 as Theme
const n260 = t([
  [12, 5],
  [13, 5],
  [14, 5],
  [15, 5],
  [16, 4],
  [17, 3],
  [19, 7],
  [20, 8],
  [21, 7],
  [22, 8],
  [23, 4],
  [24, 9],
  [25, 5],
  [26, 5],
  [27, 4],
]) as Theme

export const light_active_Card = n260 as Theme
export const light_active_DrawerFrame = n260 as Theme
export const light_active_Progress = n260 as Theme
export const light_active_TooltipArrow = n260 as Theme
const n261 = t([
  [12, 6],
  [13, 6],
  [14, 6],
  [15, 6],
  [16, 4],
  [17, 2],
  [19, 5],
  [20, 7],
  [21, 5],
  [22, 9],
  [23, 272],
  [24, 272],
  [25, 5],
  [26, 6],
  [27, 3],
]) as Theme

export const light_active_Button = n261 as Theme
const n262 = t([
  [12, 6],
  [13, 6],
  [14, 6],
  [15, 6],
  [16, 5],
  [17, 4],
  [19, 7],
  [20, 8],
  [21, 7],
  [22, 7],
  [23, 5],
  [24, 10],
  [25, 6],
  [26, 6],
  [27, 3],
]) as Theme

export const light_active_Checkbox = n262 as Theme
export const light_active_Switch = n262 as Theme
export const light_active_TooltipContent = n262 as Theme
export const light_active_SliderTrack = n262 as Theme
const n263 = t([
  [12, 9],
  [13, 9],
  [14, 9],
  [15, 9],
  [16, 10],
  [17, 11],
  [19, 4],
  [20, 3],
  [21, 4],
  [22, 0],
  [23, 10],
  [24, 5],
  [25, 9],
  [26, 9],
  [27, 4],
]) as Theme

export const light_active_SwitchThumb = n263 as Theme
const n264 = t([
  [12, 5],
  [13, 5],
  [14, 5],
  [15, 5],
  [16, 6],
  [17, 7],
  [19, 4],
  [20, 3],
  [21, 4],
  [22, 4],
  [23, 6],
  [24, 1],
  [25, 5],
  [26, 5],
  [27, 8],
]) as Theme

export const light_active_SliderTrackActive = n264 as Theme
const n265 = t([
  [12, 7],
  [13, 7],
  [14, 7],
  [15, 7],
  [16, 8],
  [17, 9],
  [19, 4],
  [20, 3],
  [21, 4],
  [22, 2],
  [23, 8],
  [24, 3],
  [25, 7],
  [26, 7],
  [27, 6],
]) as Theme

export const light_active_SliderThumb = n265 as Theme
export const light_active_Tooltip = n265 as Theme
export const light_active_ProgressIndicator = n265 as Theme
const n266 = t([
  [12, 3],
  [13, 3],
  [14, 3],
  [15, 3],
  [16, 2],
  [17, 1],
  [19, 7],
  [20, 8],
  [21, 7],
  [22, 10],
  [23, 4],
  [24, 9],
  [25, 5],
  [26, 5],
  [27, 6],
]) as Theme

export const light_active_Input = n266 as Theme
export const light_active_TextArea = n266 as Theme
const n267 = t([
  [12, 132],
  [13, 132],
  [14, 132],
  [15, 132],
  [16, 122],
  [17, 131],
  [18, 122],
  [19, 139],
  [20, 140],
  [21, 139],
  [22, 141],
  [23, 122],
  [24, 136],
  [25, 132],
  [26, 132],
  [27, 137],
]) as Theme

export const dark_alt1_ListItem = n267 as Theme
const n268 = t([
  [12, 133],
  [13, 133],
  [14, 133],
  [15, 133],
  [16, 132],
  [17, 122],
  [18, 122],
  [19, 139],
  [20, 140],
  [21, 139],
  [22, 140],
  [23, 132],
  [24, 137],
  [25, 133],
  [26, 133],
  [27, 136],
]) as Theme

export const dark_alt1_Card = n268 as Theme
export const dark_alt1_DrawerFrame = n268 as Theme
export const dark_alt1_Progress = n268 as Theme
export const dark_alt1_TooltipArrow = n268 as Theme
const n269 = t([
  [12, 134],
  [13, 134],
  [14, 134],
  [15, 134],
  [16, 132],
  [17, 131],
  [18, 122],
  [19, 137],
  [20, 139],
  [21, 137],
  [22, 141],
  [23, 272],
  [24, 272],
  [25, 133],
  [26, 134],
  [27, 135],
]) as Theme

export const dark_alt1_Button = n269 as Theme
const n270 = t([
  [12, 134],
  [13, 134],
  [14, 134],
  [15, 134],
  [16, 133],
  [17, 132],
  [18, 122],
  [19, 139],
  [20, 140],
  [21, 139],
  [22, 139],
  [23, 133],
  [24, 138],
  [25, 134],
  [26, 134],
  [27, 135],
]) as Theme

export const dark_alt1_Checkbox = n270 as Theme
export const dark_alt1_Switch = n270 as Theme
export const dark_alt1_TooltipContent = n270 as Theme
export const dark_alt1_SliderTrack = n270 as Theme
const n271 = t([
  [12, 141],
  [13, 141],
  [14, 141],
  [15, 141],
  [16, 141],
  [17, 141],
  [18, 140],
  [19, 132],
  [20, 122],
  [21, 132],
  [22, 131],
  [23, 141],
  [24, 137],
  [25, 141],
  [26, 141],
  [27, 132],
]) as Theme

export const dark_alt1_SwitchThumb = n271 as Theme
const n272 = t([
  [12, 137],
  [13, 137],
  [14, 137],
  [15, 137],
  [16, 138],
  [17, 139],
  [18, 140],
  [19, 132],
  [20, 122],
  [21, 132],
  [22, 132],
  [23, 138],
  [24, 133],
  [25, 137],
  [26, 137],
  [27, 136],
]) as Theme

export const dark_alt1_SliderTrackActive = n272 as Theme
const n273 = t([
  [12, 139],
  [13, 139],
  [14, 139],
  [15, 139],
  [16, 140],
  [17, 141],
  [18, 140],
  [19, 132],
  [20, 122],
  [21, 132],
  [22, 131],
  [23, 140],
  [24, 135],
  [25, 139],
  [26, 139],
  [27, 134],
]) as Theme

export const dark_alt1_SliderThumb = n273 as Theme
export const dark_alt1_Tooltip = n273 as Theme
export const dark_alt1_ProgressIndicator = n273 as Theme
const n274 = t([
  [12, 132],
  [13, 132],
  [14, 132],
  [15, 132],
  [16, 122],
  [17, 131],
  [18, 122],
  [19, 139],
  [20, 140],
  [21, 139],
  [22, 141],
  [23, 132],
  [24, 137],
  [25, 133],
  [26, 133],
  [27, 137],
]) as Theme

export const dark_alt1_Input = n274 as Theme
export const dark_alt1_TextArea = n274 as Theme
const n275 = t([
  [12, 133],
  [13, 133],
  [14, 133],
  [15, 133],
  [16, 132],
  [17, 122],
  [18, 132],
  [19, 138],
  [20, 139],
  [21, 138],
  [22, 140],
  [23, 132],
  [24, 137],
  [25, 133],
  [26, 133],
  [27, 136],
]) as Theme

export const dark_alt2_ListItem = n275 as Theme
const n276 = t([
  [12, 134],
  [13, 134],
  [14, 134],
  [15, 134],
  [16, 133],
  [17, 132],
  [18, 132],
  [19, 138],
  [20, 139],
  [21, 138],
  [22, 139],
  [23, 133],
  [24, 138],
  [25, 134],
  [26, 134],
  [27, 135],
]) as Theme

export const dark_alt2_Card = n276 as Theme
export const dark_alt2_DrawerFrame = n276 as Theme
export const dark_alt2_Progress = n276 as Theme
export const dark_alt2_TooltipArrow = n276 as Theme
const n277 = t([
  [12, 135],
  [13, 135],
  [14, 135],
  [15, 135],
  [16, 133],
  [17, 122],
  [18, 132],
  [19, 136],
  [20, 138],
  [21, 136],
  [22, 140],
  [23, 272],
  [24, 272],
  [25, 134],
  [26, 135],
  [27, 134],
]) as Theme

export const dark_alt2_Button = n277 as Theme
const n278 = t([
  [12, 135],
  [13, 135],
  [14, 135],
  [15, 135],
  [16, 134],
  [17, 133],
  [18, 132],
  [19, 138],
  [20, 139],
  [21, 138],
  [22, 138],
  [23, 134],
  [24, 139],
  [25, 135],
  [26, 135],
  [27, 134],
]) as Theme

export const dark_alt2_Checkbox = n278 as Theme
export const dark_alt2_Switch = n278 as Theme
export const dark_alt2_TooltipContent = n278 as Theme
export const dark_alt2_SliderTrack = n278 as Theme
const n279 = t([
  [12, 140],
  [13, 140],
  [14, 140],
  [15, 140],
  [16, 141],
  [17, 141],
  [18, 139],
  [19, 133],
  [20, 132],
  [21, 133],
  [22, 131],
  [23, 141],
  [24, 136],
  [25, 140],
  [26, 140],
  [27, 133],
]) as Theme

export const dark_alt2_SwitchThumb = n279 as Theme
const n280 = t([
  [12, 136],
  [13, 136],
  [14, 136],
  [15, 136],
  [16, 137],
  [17, 138],
  [18, 139],
  [19, 133],
  [20, 132],
  [21, 133],
  [22, 133],
  [23, 137],
  [24, 132],
  [25, 136],
  [26, 136],
  [27, 137],
]) as Theme

export const dark_alt2_SliderTrackActive = n280 as Theme
const n281 = t([
  [12, 138],
  [13, 138],
  [14, 138],
  [15, 138],
  [16, 139],
  [17, 140],
  [18, 139],
  [19, 133],
  [20, 132],
  [21, 133],
  [22, 122],
  [23, 139],
  [24, 134],
  [25, 138],
  [26, 138],
  [27, 135],
]) as Theme

export const dark_alt2_SliderThumb = n281 as Theme
export const dark_alt2_Tooltip = n281 as Theme
export const dark_alt2_ProgressIndicator = n281 as Theme
const n282 = t([
  [12, 133],
  [13, 133],
  [14, 133],
  [15, 133],
  [16, 132],
  [17, 122],
  [18, 132],
  [19, 138],
  [20, 139],
  [21, 138],
  [22, 140],
  [23, 133],
  [24, 138],
  [25, 134],
  [26, 134],
  [27, 136],
]) as Theme

export const dark_alt2_Input = n282 as Theme
export const dark_alt2_TextArea = n282 as Theme
const n283 = t([
  [12, 134],
  [13, 134],
  [14, 134],
  [15, 134],
  [16, 133],
  [17, 132],
  [19, 137],
  [20, 138],
  [21, 137],
  [22, 139],
  [23, 133],
  [24, 138],
  [25, 134],
  [26, 134],
  [27, 135],
]) as Theme

export const dark_active_ListItem = n283 as Theme
const n284 = t([
  [12, 135],
  [13, 135],
  [14, 135],
  [15, 135],
  [16, 134],
  [17, 133],
  [19, 137],
  [20, 138],
  [21, 137],
  [22, 138],
  [23, 134],
  [24, 139],
  [25, 135],
  [26, 135],
  [27, 134],
]) as Theme

export const dark_active_Card = n284 as Theme
export const dark_active_DrawerFrame = n284 as Theme
export const dark_active_Progress = n284 as Theme
export const dark_active_TooltipArrow = n284 as Theme
const n285 = t([
  [12, 136],
  [13, 136],
  [14, 136],
  [15, 136],
  [16, 134],
  [17, 132],
  [19, 135],
  [20, 137],
  [21, 135],
  [22, 139],
  [23, 272],
  [24, 272],
  [25, 135],
  [26, 136],
  [27, 133],
]) as Theme

export const dark_active_Button = n285 as Theme
const n286 = t([
  [12, 136],
  [13, 136],
  [14, 136],
  [15, 136],
  [16, 135],
  [17, 134],
  [19, 137],
  [20, 138],
  [21, 137],
  [22, 137],
  [23, 135],
  [24, 140],
  [25, 136],
  [26, 136],
  [27, 133],
]) as Theme

export const dark_active_Checkbox = n286 as Theme
export const dark_active_Switch = n286 as Theme
export const dark_active_TooltipContent = n286 as Theme
export const dark_active_SliderTrack = n286 as Theme
const n287 = t([
  [12, 139],
  [13, 139],
  [14, 139],
  [15, 139],
  [16, 140],
  [17, 141],
  [19, 134],
  [20, 133],
  [21, 134],
  [22, 131],
  [23, 140],
  [24, 135],
  [25, 139],
  [26, 139],
  [27, 134],
]) as Theme

export const dark_active_SwitchThumb = n287 as Theme
const n288 = t([
  [12, 135],
  [13, 135],
  [14, 135],
  [15, 135],
  [16, 136],
  [17, 137],
  [19, 134],
  [20, 133],
  [21, 134],
  [22, 134],
  [23, 136],
  [24, 122],
  [25, 135],
  [26, 135],
  [27, 138],
]) as Theme

export const dark_active_SliderTrackActive = n288 as Theme
const n289 = t([
  [12, 137],
  [13, 137],
  [14, 137],
  [15, 137],
  [16, 138],
  [17, 139],
  [19, 134],
  [20, 133],
  [21, 134],
  [22, 132],
  [23, 138],
  [24, 133],
  [25, 137],
  [26, 137],
  [27, 136],
]) as Theme

export const dark_active_SliderThumb = n289 as Theme
export const dark_active_Tooltip = n289 as Theme
export const dark_active_ProgressIndicator = n289 as Theme
const n290 = t([
  [12, 134],
  [13, 134],
  [14, 134],
  [15, 134],
  [16, 133],
  [17, 132],
  [19, 137],
  [20, 138],
  [21, 137],
  [22, 139],
  [23, 134],
  [24, 139],
  [25, 135],
  [26, 135],
  [27, 135],
]) as Theme

export const dark_active_Input = n290 as Theme
export const dark_active_TextArea = n290 as Theme
const n291 = t([
  [12, 48],
  [13, 48],
  [14, 48],
  [15, 48],
  [16, 47],
  [17, 47],
  [18, 48],
  [19, 57],
  [20, 58],
  [21, 57],
  [22, 11],
  [23, 50],
  [24, 51],
  [25, 50],
  [26, 50],
  [27, 56],
]) as Theme

export const light_orange_alt1_ListItem = n291 as Theme
const n292 = t([
  [12, 50],
  [13, 50],
  [14, 50],
  [15, 50],
  [16, 49],
  [17, 48],
  [18, 48],
  [19, 57],
  [20, 58],
  [21, 57],
  [22, 58],
  [23, 52],
  [24, 54],
  [25, 52],
  [26, 52],
  [27, 54],
]) as Theme

export const light_orange_alt1_Card = n292 as Theme
export const light_orange_alt1_DrawerFrame = n292 as Theme
export const light_orange_alt1_Progress = n292 as Theme
export const light_orange_alt1_TooltipArrow = n292 as Theme
const n293 = t([
  [12, 51],
  [13, 51],
  [14, 51],
  [15, 51],
  [16, 49],
  [17, 47],
  [18, 48],
  [19, 55],
  [20, 57],
  [21, 55],
  [22, 11],
  [23, 272],
  [24, 272],
  [25, 52],
  [26, 54],
  [27, 52],
]) as Theme

export const light_orange_alt1_Button = n293 as Theme
const n294 = t([
  [12, 51],
  [13, 51],
  [14, 51],
  [15, 51],
  [16, 50],
  [17, 49],
  [18, 48],
  [19, 57],
  [20, 58],
  [21, 57],
  [22, 57],
  [23, 54],
  [24, 55],
  [25, 54],
  [26, 54],
  [27, 52],
]) as Theme

export const light_orange_alt1_Checkbox = n294 as Theme
export const light_orange_alt1_Switch = n294 as Theme
export const light_orange_alt1_TooltipContent = n294 as Theme
export const light_orange_alt1_SliderTrack = n294 as Theme
const n295 = t([
  [12, 11],
  [13, 11],
  [14, 11],
  [15, 11],
  [16, 11],
  [17, 11],
  [18, 58],
  [19, 49],
  [20, 48],
  [21, 49],
  [22, 47],
  [23, 57],
  [24, 56],
  [25, 57],
  [26, 57],
  [27, 49],
]) as Theme

export const light_orange_alt1_SwitchThumb = n295 as Theme
const n296 = t([
  [12, 55],
  [13, 55],
  [14, 55],
  [15, 55],
  [16, 56],
  [17, 57],
  [18, 58],
  [19, 49],
  [20, 48],
  [21, 49],
  [22, 49],
  [23, 52],
  [24, 51],
  [25, 52],
  [26, 52],
  [27, 54],
]) as Theme

export const light_orange_alt1_SliderTrackActive = n296 as Theme
const n297 = t([
  [12, 57],
  [13, 57],
  [14, 57],
  [15, 57],
  [16, 58],
  [17, 11],
  [18, 58],
  [19, 49],
  [20, 48],
  [21, 49],
  [22, 47],
  [23, 55],
  [24, 54],
  [25, 55],
  [26, 55],
  [27, 51],
]) as Theme

export const light_orange_alt1_SliderThumb = n297 as Theme
export const light_orange_alt1_Tooltip = n297 as Theme
export const light_orange_alt1_ProgressIndicator = n297 as Theme
const n298 = t([
  [12, 48],
  [13, 48],
  [14, 48],
  [15, 48],
  [16, 47],
  [17, 47],
  [18, 48],
  [19, 57],
  [20, 58],
  [21, 57],
  [22, 11],
  [23, 52],
  [24, 54],
  [25, 52],
  [26, 52],
  [27, 56],
]) as Theme

export const light_orange_alt1_Input = n298 as Theme
export const light_orange_alt1_TextArea = n298 as Theme
const n299 = t([
  [12, 49],
  [13, 49],
  [14, 49],
  [15, 49],
  [16, 48],
  [17, 47],
  [18, 49],
  [19, 56],
  [20, 57],
  [21, 56],
  [22, 11],
  [23, 51],
  [24, 52],
  [25, 51],
  [26, 51],
  [27, 55],
]) as Theme

export const light_orange_alt2_ListItem = n299 as Theme
const n300 = t([
  [12, 51],
  [13, 51],
  [14, 51],
  [15, 51],
  [16, 50],
  [17, 49],
  [18, 49],
  [19, 56],
  [20, 57],
  [21, 56],
  [22, 57],
  [23, 54],
  [24, 55],
  [25, 54],
  [26, 54],
  [27, 52],
]) as Theme

export const light_orange_alt2_Card = n300 as Theme
export const light_orange_alt2_DrawerFrame = n300 as Theme
export const light_orange_alt2_Progress = n300 as Theme
export const light_orange_alt2_TooltipArrow = n300 as Theme
const n301 = t([
  [12, 52],
  [13, 52],
  [14, 52],
  [15, 52],
  [16, 50],
  [17, 48],
  [18, 49],
  [19, 54],
  [20, 56],
  [21, 54],
  [22, 58],
  [23, 272],
  [24, 272],
  [25, 54],
  [26, 55],
  [27, 51],
]) as Theme

export const light_orange_alt2_Button = n301 as Theme
const n302 = t([
  [12, 52],
  [13, 52],
  [14, 52],
  [15, 52],
  [16, 51],
  [17, 50],
  [18, 49],
  [19, 56],
  [20, 57],
  [21, 56],
  [22, 56],
  [23, 55],
  [24, 56],
  [25, 55],
  [26, 55],
  [27, 51],
]) as Theme

export const light_orange_alt2_Checkbox = n302 as Theme
export const light_orange_alt2_Switch = n302 as Theme
export const light_orange_alt2_TooltipContent = n302 as Theme
export const light_orange_alt2_SliderTrack = n302 as Theme
const n303 = t([
  [12, 58],
  [13, 58],
  [14, 58],
  [15, 58],
  [16, 11],
  [17, 11],
  [18, 57],
  [19, 50],
  [20, 49],
  [21, 50],
  [22, 47],
  [23, 56],
  [24, 55],
  [25, 56],
  [26, 56],
  [27, 50],
]) as Theme

export const light_orange_alt2_SwitchThumb = n303 as Theme
const n304 = t([
  [12, 54],
  [13, 54],
  [14, 54],
  [15, 54],
  [16, 55],
  [17, 56],
  [18, 57],
  [19, 50],
  [20, 49],
  [21, 50],
  [22, 50],
  [23, 51],
  [24, 50],
  [25, 51],
  [26, 51],
  [27, 55],
]) as Theme

export const light_orange_alt2_SliderTrackActive = n304 as Theme
const n305 = t([
  [12, 56],
  [13, 56],
  [14, 56],
  [15, 56],
  [16, 57],
  [17, 58],
  [18, 57],
  [19, 50],
  [20, 49],
  [21, 50],
  [22, 48],
  [23, 54],
  [24, 52],
  [25, 54],
  [26, 54],
  [27, 52],
]) as Theme

export const light_orange_alt2_SliderThumb = n305 as Theme
export const light_orange_alt2_Tooltip = n305 as Theme
export const light_orange_alt2_ProgressIndicator = n305 as Theme
const n306 = t([
  [12, 49],
  [13, 49],
  [14, 49],
  [15, 49],
  [16, 48],
  [17, 47],
  [18, 49],
  [19, 56],
  [20, 57],
  [21, 56],
  [22, 11],
  [23, 54],
  [24, 55],
  [25, 54],
  [26, 54],
  [27, 55],
]) as Theme

export const light_orange_alt2_Input = n306 as Theme
export const light_orange_alt2_TextArea = n306 as Theme
const n307 = t([
  [12, 50],
  [13, 50],
  [14, 50],
  [15, 50],
  [16, 49],
  [17, 48],
  [19, 55],
  [20, 56],
  [21, 55],
  [22, 58],
  [23, 52],
  [24, 54],
  [25, 52],
  [26, 52],
  [27, 54],
]) as Theme

export const light_orange_active_ListItem = n307 as Theme
const n308 = t([
  [12, 52],
  [13, 52],
  [14, 52],
  [15, 52],
  [16, 51],
  [17, 50],
  [19, 55],
  [20, 56],
  [21, 55],
  [22, 56],
  [23, 55],
  [24, 56],
  [25, 55],
  [26, 55],
  [27, 51],
]) as Theme

export const light_orange_active_Card = n308 as Theme
export const light_orange_active_DrawerFrame = n308 as Theme
export const light_orange_active_Progress = n308 as Theme
export const light_orange_active_TooltipArrow = n308 as Theme
const n309 = t([
  [12, 54],
  [13, 54],
  [14, 54],
  [15, 54],
  [16, 51],
  [17, 49],
  [19, 52],
  [20, 55],
  [21, 52],
  [22, 57],
  [23, 272],
  [24, 272],
  [25, 55],
  [26, 56],
  [27, 50],
]) as Theme

export const light_orange_active_Button = n309 as Theme
const n310 = t([
  [12, 54],
  [13, 54],
  [14, 54],
  [15, 54],
  [16, 52],
  [17, 51],
  [19, 55],
  [20, 56],
  [21, 55],
  [22, 55],
  [23, 56],
  [24, 57],
  [25, 56],
  [26, 56],
  [27, 50],
]) as Theme

export const light_orange_active_Checkbox = n310 as Theme
export const light_orange_active_Switch = n310 as Theme
export const light_orange_active_TooltipContent = n310 as Theme
export const light_orange_active_SliderTrack = n310 as Theme
const n311 = t([
  [12, 57],
  [13, 57],
  [14, 57],
  [15, 57],
  [16, 58],
  [17, 11],
  [19, 51],
  [20, 50],
  [21, 51],
  [22, 47],
  [23, 55],
  [24, 54],
  [25, 55],
  [26, 55],
  [27, 51],
]) as Theme

export const light_orange_active_SwitchThumb = n311 as Theme
const n312 = t([
  [12, 52],
  [13, 52],
  [14, 52],
  [15, 52],
  [16, 54],
  [17, 55],
  [19, 51],
  [20, 50],
  [21, 51],
  [22, 51],
  [23, 50],
  [24, 49],
  [25, 50],
  [26, 50],
  [27, 56],
]) as Theme

export const light_orange_active_SliderTrackActive = n312 as Theme
const n313 = t([
  [12, 55],
  [13, 55],
  [14, 55],
  [15, 55],
  [16, 56],
  [17, 57],
  [19, 51],
  [20, 50],
  [21, 51],
  [22, 49],
  [23, 52],
  [24, 51],
  [25, 52],
  [26, 52],
  [27, 54],
]) as Theme

export const light_orange_active_SliderThumb = n313 as Theme
export const light_orange_active_Tooltip = n313 as Theme
export const light_orange_active_ProgressIndicator = n313 as Theme
const n314 = t([
  [12, 50],
  [13, 50],
  [14, 50],
  [15, 50],
  [16, 49],
  [17, 48],
  [19, 55],
  [20, 56],
  [21, 55],
  [22, 58],
  [23, 55],
  [24, 56],
  [25, 55],
  [26, 55],
  [27, 54],
]) as Theme

export const light_orange_active_Input = n314 as Theme
export const light_orange_active_TextArea = n314 as Theme
const n315 = t([
  [12, 96],
  [13, 96],
  [14, 96],
  [15, 96],
  [16, 95],
  [17, 95],
  [18, 96],
  [19, 105],
  [20, 106],
  [21, 105],
  [22, 11],
  [23, 98],
  [24, 99],
  [25, 98],
  [26, 98],
  [27, 104],
]) as Theme

export const light_yellow_alt1_ListItem = n315 as Theme
const n316 = t([
  [12, 98],
  [13, 98],
  [14, 98],
  [15, 98],
  [16, 97],
  [17, 96],
  [18, 96],
  [19, 105],
  [20, 106],
  [21, 105],
  [22, 106],
  [23, 100],
  [24, 102],
  [25, 100],
  [26, 100],
  [27, 102],
]) as Theme

export const light_yellow_alt1_Card = n316 as Theme
export const light_yellow_alt1_DrawerFrame = n316 as Theme
export const light_yellow_alt1_Progress = n316 as Theme
export const light_yellow_alt1_TooltipArrow = n316 as Theme
const n317 = t([
  [12, 99],
  [13, 99],
  [14, 99],
  [15, 99],
  [16, 97],
  [17, 95],
  [18, 96],
  [19, 103],
  [20, 105],
  [21, 103],
  [22, 11],
  [23, 272],
  [24, 272],
  [25, 100],
  [26, 102],
  [27, 100],
]) as Theme

export const light_yellow_alt1_Button = n317 as Theme
const n318 = t([
  [12, 99],
  [13, 99],
  [14, 99],
  [15, 99],
  [16, 98],
  [17, 97],
  [18, 96],
  [19, 105],
  [20, 106],
  [21, 105],
  [22, 105],
  [23, 102],
  [24, 103],
  [25, 102],
  [26, 102],
  [27, 100],
]) as Theme

export const light_yellow_alt1_Checkbox = n318 as Theme
export const light_yellow_alt1_Switch = n318 as Theme
export const light_yellow_alt1_TooltipContent = n318 as Theme
export const light_yellow_alt1_SliderTrack = n318 as Theme
const n319 = t([
  [12, 11],
  [13, 11],
  [14, 11],
  [15, 11],
  [16, 11],
  [17, 11],
  [18, 106],
  [19, 97],
  [20, 96],
  [21, 97],
  [22, 95],
  [23, 105],
  [24, 104],
  [25, 105],
  [26, 105],
  [27, 97],
]) as Theme

export const light_yellow_alt1_SwitchThumb = n319 as Theme
const n320 = t([
  [12, 103],
  [13, 103],
  [14, 103],
  [15, 103],
  [16, 104],
  [17, 105],
  [18, 106],
  [19, 97],
  [20, 96],
  [21, 97],
  [22, 97],
  [23, 100],
  [24, 99],
  [25, 100],
  [26, 100],
  [27, 102],
]) as Theme

export const light_yellow_alt1_SliderTrackActive = n320 as Theme
const n321 = t([
  [12, 105],
  [13, 105],
  [14, 105],
  [15, 105],
  [16, 106],
  [17, 11],
  [18, 106],
  [19, 97],
  [20, 96],
  [21, 97],
  [22, 95],
  [23, 103],
  [24, 102],
  [25, 103],
  [26, 103],
  [27, 99],
]) as Theme

export const light_yellow_alt1_SliderThumb = n321 as Theme
export const light_yellow_alt1_Tooltip = n321 as Theme
export const light_yellow_alt1_ProgressIndicator = n321 as Theme
const n322 = t([
  [12, 96],
  [13, 96],
  [14, 96],
  [15, 96],
  [16, 95],
  [17, 95],
  [18, 96],
  [19, 105],
  [20, 106],
  [21, 105],
  [22, 11],
  [23, 100],
  [24, 102],
  [25, 100],
  [26, 100],
  [27, 104],
]) as Theme

export const light_yellow_alt1_Input = n322 as Theme
export const light_yellow_alt1_TextArea = n322 as Theme
const n323 = t([
  [12, 97],
  [13, 97],
  [14, 97],
  [15, 97],
  [16, 96],
  [17, 95],
  [18, 97],
  [19, 104],
  [20, 105],
  [21, 104],
  [22, 11],
  [23, 99],
  [24, 100],
  [25, 99],
  [26, 99],
  [27, 103],
]) as Theme

export const light_yellow_alt2_ListItem = n323 as Theme
const n324 = t([
  [12, 99],
  [13, 99],
  [14, 99],
  [15, 99],
  [16, 98],
  [17, 97],
  [18, 97],
  [19, 104],
  [20, 105],
  [21, 104],
  [22, 105],
  [23, 102],
  [24, 103],
  [25, 102],
  [26, 102],
  [27, 100],
]) as Theme

export const light_yellow_alt2_Card = n324 as Theme
export const light_yellow_alt2_DrawerFrame = n324 as Theme
export const light_yellow_alt2_Progress = n324 as Theme
export const light_yellow_alt2_TooltipArrow = n324 as Theme
const n325 = t([
  [12, 100],
  [13, 100],
  [14, 100],
  [15, 100],
  [16, 98],
  [17, 96],
  [18, 97],
  [19, 102],
  [20, 104],
  [21, 102],
  [22, 106],
  [23, 272],
  [24, 272],
  [25, 102],
  [26, 103],
  [27, 99],
]) as Theme

export const light_yellow_alt2_Button = n325 as Theme
const n326 = t([
  [12, 100],
  [13, 100],
  [14, 100],
  [15, 100],
  [16, 99],
  [17, 98],
  [18, 97],
  [19, 104],
  [20, 105],
  [21, 104],
  [22, 104],
  [23, 103],
  [24, 104],
  [25, 103],
  [26, 103],
  [27, 99],
]) as Theme

export const light_yellow_alt2_Checkbox = n326 as Theme
export const light_yellow_alt2_Switch = n326 as Theme
export const light_yellow_alt2_TooltipContent = n326 as Theme
export const light_yellow_alt2_SliderTrack = n326 as Theme
const n327 = t([
  [12, 106],
  [13, 106],
  [14, 106],
  [15, 106],
  [16, 11],
  [17, 11],
  [18, 105],
  [19, 98],
  [20, 97],
  [21, 98],
  [22, 95],
  [23, 104],
  [24, 103],
  [25, 104],
  [26, 104],
  [27, 98],
]) as Theme

export const light_yellow_alt2_SwitchThumb = n327 as Theme
const n328 = t([
  [12, 102],
  [13, 102],
  [14, 102],
  [15, 102],
  [16, 103],
  [17, 104],
  [18, 105],
  [19, 98],
  [20, 97],
  [21, 98],
  [22, 98],
  [23, 99],
  [24, 98],
  [25, 99],
  [26, 99],
  [27, 103],
]) as Theme

export const light_yellow_alt2_SliderTrackActive = n328 as Theme
const n329 = t([
  [12, 104],
  [13, 104],
  [14, 104],
  [15, 104],
  [16, 105],
  [17, 106],
  [18, 105],
  [19, 98],
  [20, 97],
  [21, 98],
  [22, 96],
  [23, 102],
  [24, 100],
  [25, 102],
  [26, 102],
  [27, 100],
]) as Theme

export const light_yellow_alt2_SliderThumb = n329 as Theme
export const light_yellow_alt2_Tooltip = n329 as Theme
export const light_yellow_alt2_ProgressIndicator = n329 as Theme
const n330 = t([
  [12, 97],
  [13, 97],
  [14, 97],
  [15, 97],
  [16, 96],
  [17, 95],
  [18, 97],
  [19, 104],
  [20, 105],
  [21, 104],
  [22, 11],
  [23, 102],
  [24, 103],
  [25, 102],
  [26, 102],
  [27, 103],
]) as Theme

export const light_yellow_alt2_Input = n330 as Theme
export const light_yellow_alt2_TextArea = n330 as Theme
const n331 = t([
  [12, 98],
  [13, 98],
  [14, 98],
  [15, 98],
  [16, 97],
  [17, 96],
  [19, 103],
  [20, 104],
  [21, 103],
  [22, 106],
  [23, 100],
  [24, 102],
  [25, 100],
  [26, 100],
  [27, 102],
]) as Theme

export const light_yellow_active_ListItem = n331 as Theme
const n332 = t([
  [12, 100],
  [13, 100],
  [14, 100],
  [15, 100],
  [16, 99],
  [17, 98],
  [19, 103],
  [20, 104],
  [21, 103],
  [22, 104],
  [23, 103],
  [24, 104],
  [25, 103],
  [26, 103],
  [27, 99],
]) as Theme

export const light_yellow_active_Card = n332 as Theme
export const light_yellow_active_DrawerFrame = n332 as Theme
export const light_yellow_active_Progress = n332 as Theme
export const light_yellow_active_TooltipArrow = n332 as Theme
const n333 = t([
  [12, 102],
  [13, 102],
  [14, 102],
  [15, 102],
  [16, 99],
  [17, 97],
  [19, 100],
  [20, 103],
  [21, 100],
  [22, 105],
  [23, 272],
  [24, 272],
  [25, 103],
  [26, 104],
  [27, 98],
]) as Theme

export const light_yellow_active_Button = n333 as Theme
const n334 = t([
  [12, 102],
  [13, 102],
  [14, 102],
  [15, 102],
  [16, 100],
  [17, 99],
  [19, 103],
  [20, 104],
  [21, 103],
  [22, 103],
  [23, 104],
  [24, 105],
  [25, 104],
  [26, 104],
  [27, 98],
]) as Theme

export const light_yellow_active_Checkbox = n334 as Theme
export const light_yellow_active_Switch = n334 as Theme
export const light_yellow_active_TooltipContent = n334 as Theme
export const light_yellow_active_SliderTrack = n334 as Theme
const n335 = t([
  [12, 105],
  [13, 105],
  [14, 105],
  [15, 105],
  [16, 106],
  [17, 11],
  [19, 99],
  [20, 98],
  [21, 99],
  [22, 95],
  [23, 103],
  [24, 102],
  [25, 103],
  [26, 103],
  [27, 99],
]) as Theme

export const light_yellow_active_SwitchThumb = n335 as Theme
const n336 = t([
  [12, 100],
  [13, 100],
  [14, 100],
  [15, 100],
  [16, 102],
  [17, 103],
  [19, 99],
  [20, 98],
  [21, 99],
  [22, 99],
  [23, 98],
  [24, 97],
  [25, 98],
  [26, 98],
  [27, 104],
]) as Theme

export const light_yellow_active_SliderTrackActive = n336 as Theme
const n337 = t([
  [12, 103],
  [13, 103],
  [14, 103],
  [15, 103],
  [16, 104],
  [17, 105],
  [19, 99],
  [20, 98],
  [21, 99],
  [22, 97],
  [23, 100],
  [24, 99],
  [25, 100],
  [26, 100],
  [27, 102],
]) as Theme

export const light_yellow_active_SliderThumb = n337 as Theme
export const light_yellow_active_Tooltip = n337 as Theme
export const light_yellow_active_ProgressIndicator = n337 as Theme
const n338 = t([
  [12, 98],
  [13, 98],
  [14, 98],
  [15, 98],
  [16, 97],
  [17, 96],
  [19, 103],
  [20, 104],
  [21, 103],
  [22, 106],
  [23, 103],
  [24, 104],
  [25, 103],
  [26, 103],
  [27, 102],
]) as Theme

export const light_yellow_active_Input = n338 as Theme
export const light_yellow_active_TextArea = n338 as Theme
const n339 = t([
  [12, 36],
  [13, 36],
  [14, 36],
  [15, 36],
  [16, 35],
  [17, 35],
  [18, 36],
  [19, 45],
  [20, 46],
  [21, 45],
  [22, 11],
  [23, 38],
  [24, 39],
  [25, 38],
  [26, 38],
  [27, 44],
]) as Theme

export const light_green_alt1_ListItem = n339 as Theme
const n340 = t([
  [12, 38],
  [13, 38],
  [14, 38],
  [15, 38],
  [16, 37],
  [17, 36],
  [18, 36],
  [19, 45],
  [20, 46],
  [21, 45],
  [22, 46],
  [23, 40],
  [24, 42],
  [25, 40],
  [26, 40],
  [27, 42],
]) as Theme

export const light_green_alt1_Card = n340 as Theme
export const light_green_alt1_DrawerFrame = n340 as Theme
export const light_green_alt1_Progress = n340 as Theme
export const light_green_alt1_TooltipArrow = n340 as Theme
const n341 = t([
  [12, 39],
  [13, 39],
  [14, 39],
  [15, 39],
  [16, 37],
  [17, 35],
  [18, 36],
  [19, 43],
  [20, 45],
  [21, 43],
  [22, 11],
  [23, 272],
  [24, 272],
  [25, 40],
  [26, 42],
  [27, 40],
]) as Theme

export const light_green_alt1_Button = n341 as Theme
const n342 = t([
  [12, 39],
  [13, 39],
  [14, 39],
  [15, 39],
  [16, 38],
  [17, 37],
  [18, 36],
  [19, 45],
  [20, 46],
  [21, 45],
  [22, 45],
  [23, 42],
  [24, 43],
  [25, 42],
  [26, 42],
  [27, 40],
]) as Theme

export const light_green_alt1_Checkbox = n342 as Theme
export const light_green_alt1_Switch = n342 as Theme
export const light_green_alt1_TooltipContent = n342 as Theme
export const light_green_alt1_SliderTrack = n342 as Theme
const n343 = t([
  [12, 11],
  [13, 11],
  [14, 11],
  [15, 11],
  [16, 11],
  [17, 11],
  [18, 46],
  [19, 37],
  [20, 36],
  [21, 37],
  [22, 35],
  [23, 45],
  [24, 44],
  [25, 45],
  [26, 45],
  [27, 37],
]) as Theme

export const light_green_alt1_SwitchThumb = n343 as Theme
const n344 = t([
  [12, 43],
  [13, 43],
  [14, 43],
  [15, 43],
  [16, 44],
  [17, 45],
  [18, 46],
  [19, 37],
  [20, 36],
  [21, 37],
  [22, 37],
  [23, 40],
  [24, 39],
  [25, 40],
  [26, 40],
  [27, 42],
]) as Theme

export const light_green_alt1_SliderTrackActive = n344 as Theme
const n345 = t([
  [12, 45],
  [13, 45],
  [14, 45],
  [15, 45],
  [16, 46],
  [17, 11],
  [18, 46],
  [19, 37],
  [20, 36],
  [21, 37],
  [22, 35],
  [23, 43],
  [24, 42],
  [25, 43],
  [26, 43],
  [27, 39],
]) as Theme

export const light_green_alt1_SliderThumb = n345 as Theme
export const light_green_alt1_Tooltip = n345 as Theme
export const light_green_alt1_ProgressIndicator = n345 as Theme
const n346 = t([
  [12, 36],
  [13, 36],
  [14, 36],
  [15, 36],
  [16, 35],
  [17, 35],
  [18, 36],
  [19, 45],
  [20, 46],
  [21, 45],
  [22, 11],
  [23, 40],
  [24, 42],
  [25, 40],
  [26, 40],
  [27, 44],
]) as Theme

export const light_green_alt1_Input = n346 as Theme
export const light_green_alt1_TextArea = n346 as Theme
const n347 = t([
  [12, 37],
  [13, 37],
  [14, 37],
  [15, 37],
  [16, 36],
  [17, 35],
  [18, 37],
  [19, 44],
  [20, 45],
  [21, 44],
  [22, 11],
  [23, 39],
  [24, 40],
  [25, 39],
  [26, 39],
  [27, 43],
]) as Theme

export const light_green_alt2_ListItem = n347 as Theme
const n348 = t([
  [12, 39],
  [13, 39],
  [14, 39],
  [15, 39],
  [16, 38],
  [17, 37],
  [18, 37],
  [19, 44],
  [20, 45],
  [21, 44],
  [22, 45],
  [23, 42],
  [24, 43],
  [25, 42],
  [26, 42],
  [27, 40],
]) as Theme

export const light_green_alt2_Card = n348 as Theme
export const light_green_alt2_DrawerFrame = n348 as Theme
export const light_green_alt2_Progress = n348 as Theme
export const light_green_alt2_TooltipArrow = n348 as Theme
const n349 = t([
  [12, 40],
  [13, 40],
  [14, 40],
  [15, 40],
  [16, 38],
  [17, 36],
  [18, 37],
  [19, 42],
  [20, 44],
  [21, 42],
  [22, 46],
  [23, 272],
  [24, 272],
  [25, 42],
  [26, 43],
  [27, 39],
]) as Theme

export const light_green_alt2_Button = n349 as Theme
const n350 = t([
  [12, 40],
  [13, 40],
  [14, 40],
  [15, 40],
  [16, 39],
  [17, 38],
  [18, 37],
  [19, 44],
  [20, 45],
  [21, 44],
  [22, 44],
  [23, 43],
  [24, 44],
  [25, 43],
  [26, 43],
  [27, 39],
]) as Theme

export const light_green_alt2_Checkbox = n350 as Theme
export const light_green_alt2_Switch = n350 as Theme
export const light_green_alt2_TooltipContent = n350 as Theme
export const light_green_alt2_SliderTrack = n350 as Theme
const n351 = t([
  [12, 46],
  [13, 46],
  [14, 46],
  [15, 46],
  [16, 11],
  [17, 11],
  [18, 45],
  [19, 38],
  [20, 37],
  [21, 38],
  [22, 35],
  [23, 44],
  [24, 43],
  [25, 44],
  [26, 44],
  [27, 38],
]) as Theme

export const light_green_alt2_SwitchThumb = n351 as Theme
const n352 = t([
  [12, 42],
  [13, 42],
  [14, 42],
  [15, 42],
  [16, 43],
  [17, 44],
  [18, 45],
  [19, 38],
  [20, 37],
  [21, 38],
  [22, 38],
  [23, 39],
  [24, 38],
  [25, 39],
  [26, 39],
  [27, 43],
]) as Theme

export const light_green_alt2_SliderTrackActive = n352 as Theme
const n353 = t([
  [12, 44],
  [13, 44],
  [14, 44],
  [15, 44],
  [16, 45],
  [17, 46],
  [18, 45],
  [19, 38],
  [20, 37],
  [21, 38],
  [22, 36],
  [23, 42],
  [24, 40],
  [25, 42],
  [26, 42],
  [27, 40],
]) as Theme

export const light_green_alt2_SliderThumb = n353 as Theme
export const light_green_alt2_Tooltip = n353 as Theme
export const light_green_alt2_ProgressIndicator = n353 as Theme
const n354 = t([
  [12, 37],
  [13, 37],
  [14, 37],
  [15, 37],
  [16, 36],
  [17, 35],
  [18, 37],
  [19, 44],
  [20, 45],
  [21, 44],
  [22, 11],
  [23, 42],
  [24, 43],
  [25, 42],
  [26, 42],
  [27, 43],
]) as Theme

export const light_green_alt2_Input = n354 as Theme
export const light_green_alt2_TextArea = n354 as Theme
const n355 = t([
  [12, 38],
  [13, 38],
  [14, 38],
  [15, 38],
  [16, 37],
  [17, 36],
  [19, 43],
  [20, 44],
  [21, 43],
  [22, 46],
  [23, 40],
  [24, 42],
  [25, 40],
  [26, 40],
  [27, 42],
]) as Theme

export const light_green_active_ListItem = n355 as Theme
const n356 = t([
  [12, 40],
  [13, 40],
  [14, 40],
  [15, 40],
  [16, 39],
  [17, 38],
  [19, 43],
  [20, 44],
  [21, 43],
  [22, 44],
  [23, 43],
  [24, 44],
  [25, 43],
  [26, 43],
  [27, 39],
]) as Theme

export const light_green_active_Card = n356 as Theme
export const light_green_active_DrawerFrame = n356 as Theme
export const light_green_active_Progress = n356 as Theme
export const light_green_active_TooltipArrow = n356 as Theme
const n357 = t([
  [12, 42],
  [13, 42],
  [14, 42],
  [15, 42],
  [16, 39],
  [17, 37],
  [19, 40],
  [20, 43],
  [21, 40],
  [22, 45],
  [23, 272],
  [24, 272],
  [25, 43],
  [26, 44],
  [27, 38],
]) as Theme

export const light_green_active_Button = n357 as Theme
const n358 = t([
  [12, 42],
  [13, 42],
  [14, 42],
  [15, 42],
  [16, 40],
  [17, 39],
  [19, 43],
  [20, 44],
  [21, 43],
  [22, 43],
  [23, 44],
  [24, 45],
  [25, 44],
  [26, 44],
  [27, 38],
]) as Theme

export const light_green_active_Checkbox = n358 as Theme
export const light_green_active_Switch = n358 as Theme
export const light_green_active_TooltipContent = n358 as Theme
export const light_green_active_SliderTrack = n358 as Theme
const n359 = t([
  [12, 45],
  [13, 45],
  [14, 45],
  [15, 45],
  [16, 46],
  [17, 11],
  [19, 39],
  [20, 38],
  [21, 39],
  [22, 35],
  [23, 43],
  [24, 42],
  [25, 43],
  [26, 43],
  [27, 39],
]) as Theme

export const light_green_active_SwitchThumb = n359 as Theme
const n360 = t([
  [12, 40],
  [13, 40],
  [14, 40],
  [15, 40],
  [16, 42],
  [17, 43],
  [19, 39],
  [20, 38],
  [21, 39],
  [22, 39],
  [23, 38],
  [24, 37],
  [25, 38],
  [26, 38],
  [27, 44],
]) as Theme

export const light_green_active_SliderTrackActive = n360 as Theme
const n361 = t([
  [12, 43],
  [13, 43],
  [14, 43],
  [15, 43],
  [16, 44],
  [17, 45],
  [19, 39],
  [20, 38],
  [21, 39],
  [22, 37],
  [23, 40],
  [24, 39],
  [25, 40],
  [26, 40],
  [27, 42],
]) as Theme

export const light_green_active_SliderThumb = n361 as Theme
export const light_green_active_Tooltip = n361 as Theme
export const light_green_active_ProgressIndicator = n361 as Theme
const n362 = t([
  [12, 38],
  [13, 38],
  [14, 38],
  [15, 38],
  [16, 37],
  [17, 36],
  [19, 43],
  [20, 44],
  [21, 43],
  [22, 46],
  [23, 43],
  [24, 44],
  [25, 43],
  [26, 43],
  [27, 42],
]) as Theme

export const light_green_active_Input = n362 as Theme
export const light_green_active_TextArea = n362 as Theme
const n363 = t([
  [12, 15],
  [13, 15],
  [14, 15],
  [15, 15],
  [16, 14],
  [17, 14],
  [18, 15],
  [19, 24],
  [20, 25],
  [21, 24],
  [22, 11],
  [23, 17],
  [24, 18],
  [25, 17],
  [26, 17],
  [27, 23],
]) as Theme

export const light_blue_alt1_ListItem = n363 as Theme
const n364 = t([
  [12, 17],
  [13, 17],
  [14, 17],
  [15, 17],
  [16, 16],
  [17, 15],
  [18, 15],
  [19, 24],
  [20, 25],
  [21, 24],
  [22, 25],
  [23, 19],
  [24, 21],
  [25, 19],
  [26, 19],
  [27, 21],
]) as Theme

export const light_blue_alt1_Card = n364 as Theme
export const light_blue_alt1_DrawerFrame = n364 as Theme
export const light_blue_alt1_Progress = n364 as Theme
export const light_blue_alt1_TooltipArrow = n364 as Theme
const n365 = t([
  [12, 18],
  [13, 18],
  [14, 18],
  [15, 18],
  [16, 16],
  [17, 14],
  [18, 15],
  [19, 22],
  [20, 24],
  [21, 22],
  [22, 11],
  [23, 272],
  [24, 272],
  [25, 19],
  [26, 21],
  [27, 19],
]) as Theme

export const light_blue_alt1_Button = n365 as Theme
const n366 = t([
  [12, 18],
  [13, 18],
  [14, 18],
  [15, 18],
  [16, 17],
  [17, 16],
  [18, 15],
  [19, 24],
  [20, 25],
  [21, 24],
  [22, 24],
  [23, 21],
  [24, 22],
  [25, 21],
  [26, 21],
  [27, 19],
]) as Theme

export const light_blue_alt1_Checkbox = n366 as Theme
export const light_blue_alt1_Switch = n366 as Theme
export const light_blue_alt1_TooltipContent = n366 as Theme
export const light_blue_alt1_SliderTrack = n366 as Theme
const n367 = t([
  [12, 11],
  [13, 11],
  [14, 11],
  [15, 11],
  [16, 11],
  [17, 11],
  [18, 25],
  [19, 16],
  [20, 15],
  [21, 16],
  [22, 14],
  [23, 24],
  [24, 23],
  [25, 24],
  [26, 24],
  [27, 16],
]) as Theme

export const light_blue_alt1_SwitchThumb = n367 as Theme
const n368 = t([
  [12, 22],
  [13, 22],
  [14, 22],
  [15, 22],
  [16, 23],
  [17, 24],
  [18, 25],
  [19, 16],
  [20, 15],
  [21, 16],
  [22, 16],
  [23, 19],
  [24, 18],
  [25, 19],
  [26, 19],
  [27, 21],
]) as Theme

export const light_blue_alt1_SliderTrackActive = n368 as Theme
const n369 = t([
  [12, 24],
  [13, 24],
  [14, 24],
  [15, 24],
  [16, 25],
  [17, 11],
  [18, 25],
  [19, 16],
  [20, 15],
  [21, 16],
  [22, 14],
  [23, 22],
  [24, 21],
  [25, 22],
  [26, 22],
  [27, 18],
]) as Theme

export const light_blue_alt1_SliderThumb = n369 as Theme
export const light_blue_alt1_Tooltip = n369 as Theme
export const light_blue_alt1_ProgressIndicator = n369 as Theme
const n370 = t([
  [12, 15],
  [13, 15],
  [14, 15],
  [15, 15],
  [16, 14],
  [17, 14],
  [18, 15],
  [19, 24],
  [20, 25],
  [21, 24],
  [22, 11],
  [23, 19],
  [24, 21],
  [25, 19],
  [26, 19],
  [27, 23],
]) as Theme

export const light_blue_alt1_Input = n370 as Theme
export const light_blue_alt1_TextArea = n370 as Theme
const n371 = t([
  [12, 16],
  [13, 16],
  [14, 16],
  [15, 16],
  [16, 15],
  [17, 14],
  [18, 16],
  [19, 23],
  [20, 24],
  [21, 23],
  [22, 11],
  [23, 18],
  [24, 19],
  [25, 18],
  [26, 18],
  [27, 22],
]) as Theme

export const light_blue_alt2_ListItem = n371 as Theme
const n372 = t([
  [12, 18],
  [13, 18],
  [14, 18],
  [15, 18],
  [16, 17],
  [17, 16],
  [18, 16],
  [19, 23],
  [20, 24],
  [21, 23],
  [22, 24],
  [23, 21],
  [24, 22],
  [25, 21],
  [26, 21],
  [27, 19],
]) as Theme

export const light_blue_alt2_Card = n372 as Theme
export const light_blue_alt2_DrawerFrame = n372 as Theme
export const light_blue_alt2_Progress = n372 as Theme
export const light_blue_alt2_TooltipArrow = n372 as Theme
const n373 = t([
  [12, 19],
  [13, 19],
  [14, 19],
  [15, 19],
  [16, 17],
  [17, 15],
  [18, 16],
  [19, 21],
  [20, 23],
  [21, 21],
  [22, 25],
  [23, 272],
  [24, 272],
  [25, 21],
  [26, 22],
  [27, 18],
]) as Theme

export const light_blue_alt2_Button = n373 as Theme
const n374 = t([
  [12, 19],
  [13, 19],
  [14, 19],
  [15, 19],
  [16, 18],
  [17, 17],
  [18, 16],
  [19, 23],
  [20, 24],
  [21, 23],
  [22, 23],
  [23, 22],
  [24, 23],
  [25, 22],
  [26, 22],
  [27, 18],
]) as Theme

export const light_blue_alt2_Checkbox = n374 as Theme
export const light_blue_alt2_Switch = n374 as Theme
export const light_blue_alt2_TooltipContent = n374 as Theme
export const light_blue_alt2_SliderTrack = n374 as Theme
const n375 = t([
  [12, 25],
  [13, 25],
  [14, 25],
  [15, 25],
  [16, 11],
  [17, 11],
  [18, 24],
  [19, 17],
  [20, 16],
  [21, 17],
  [22, 14],
  [23, 23],
  [24, 22],
  [25, 23],
  [26, 23],
  [27, 17],
]) as Theme

export const light_blue_alt2_SwitchThumb = n375 as Theme
const n376 = t([
  [12, 21],
  [13, 21],
  [14, 21],
  [15, 21],
  [16, 22],
  [17, 23],
  [18, 24],
  [19, 17],
  [20, 16],
  [21, 17],
  [22, 17],
  [23, 18],
  [24, 17],
  [25, 18],
  [26, 18],
  [27, 22],
]) as Theme

export const light_blue_alt2_SliderTrackActive = n376 as Theme
const n377 = t([
  [12, 23],
  [13, 23],
  [14, 23],
  [15, 23],
  [16, 24],
  [17, 25],
  [18, 24],
  [19, 17],
  [20, 16],
  [21, 17],
  [22, 15],
  [23, 21],
  [24, 19],
  [25, 21],
  [26, 21],
  [27, 19],
]) as Theme

export const light_blue_alt2_SliderThumb = n377 as Theme
export const light_blue_alt2_Tooltip = n377 as Theme
export const light_blue_alt2_ProgressIndicator = n377 as Theme
const n378 = t([
  [12, 16],
  [13, 16],
  [14, 16],
  [15, 16],
  [16, 15],
  [17, 14],
  [18, 16],
  [19, 23],
  [20, 24],
  [21, 23],
  [22, 11],
  [23, 21],
  [24, 22],
  [25, 21],
  [26, 21],
  [27, 22],
]) as Theme

export const light_blue_alt2_Input = n378 as Theme
export const light_blue_alt2_TextArea = n378 as Theme
const n379 = t([
  [12, 17],
  [13, 17],
  [14, 17],
  [15, 17],
  [16, 16],
  [17, 15],
  [19, 22],
  [20, 23],
  [21, 22],
  [22, 25],
  [23, 19],
  [24, 21],
  [25, 19],
  [26, 19],
  [27, 21],
]) as Theme

export const light_blue_active_ListItem = n379 as Theme
const n380 = t([
  [12, 19],
  [13, 19],
  [14, 19],
  [15, 19],
  [16, 18],
  [17, 17],
  [19, 22],
  [20, 23],
  [21, 22],
  [22, 23],
  [23, 22],
  [24, 23],
  [25, 22],
  [26, 22],
  [27, 18],
]) as Theme

export const light_blue_active_Card = n380 as Theme
export const light_blue_active_DrawerFrame = n380 as Theme
export const light_blue_active_Progress = n380 as Theme
export const light_blue_active_TooltipArrow = n380 as Theme
const n381 = t([
  [12, 21],
  [13, 21],
  [14, 21],
  [15, 21],
  [16, 18],
  [17, 16],
  [19, 19],
  [20, 22],
  [21, 19],
  [22, 24],
  [23, 272],
  [24, 272],
  [25, 22],
  [26, 23],
  [27, 17],
]) as Theme

export const light_blue_active_Button = n381 as Theme
const n382 = t([
  [12, 21],
  [13, 21],
  [14, 21],
  [15, 21],
  [16, 19],
  [17, 18],
  [19, 22],
  [20, 23],
  [21, 22],
  [22, 22],
  [23, 23],
  [24, 24],
  [25, 23],
  [26, 23],
  [27, 17],
]) as Theme

export const light_blue_active_Checkbox = n382 as Theme
export const light_blue_active_Switch = n382 as Theme
export const light_blue_active_TooltipContent = n382 as Theme
export const light_blue_active_SliderTrack = n382 as Theme
const n383 = t([
  [12, 24],
  [13, 24],
  [14, 24],
  [15, 24],
  [16, 25],
  [17, 11],
  [19, 18],
  [20, 17],
  [21, 18],
  [22, 14],
  [23, 22],
  [24, 21],
  [25, 22],
  [26, 22],
  [27, 18],
]) as Theme

export const light_blue_active_SwitchThumb = n383 as Theme
const n384 = t([
  [12, 19],
  [13, 19],
  [14, 19],
  [15, 19],
  [16, 21],
  [17, 22],
  [19, 18],
  [20, 17],
  [21, 18],
  [22, 18],
  [23, 17],
  [24, 16],
  [25, 17],
  [26, 17],
  [27, 23],
]) as Theme

export const light_blue_active_SliderTrackActive = n384 as Theme
const n385 = t([
  [12, 22],
  [13, 22],
  [14, 22],
  [15, 22],
  [16, 23],
  [17, 24],
  [19, 18],
  [20, 17],
  [21, 18],
  [22, 16],
  [23, 19],
  [24, 18],
  [25, 19],
  [26, 19],
  [27, 21],
]) as Theme

export const light_blue_active_SliderThumb = n385 as Theme
export const light_blue_active_Tooltip = n385 as Theme
export const light_blue_active_ProgressIndicator = n385 as Theme
const n386 = t([
  [12, 17],
  [13, 17],
  [14, 17],
  [15, 17],
  [16, 16],
  [17, 15],
  [19, 22],
  [20, 23],
  [21, 22],
  [22, 25],
  [23, 22],
  [24, 23],
  [25, 22],
  [26, 22],
  [27, 21],
]) as Theme

export const light_blue_active_Input = n386 as Theme
export const light_blue_active_TextArea = n386 as Theme
const n387 = t([
  [12, 72],
  [13, 72],
  [14, 72],
  [15, 72],
  [16, 71],
  [17, 71],
  [18, 72],
  [19, 81],
  [20, 82],
  [21, 81],
  [22, 11],
  [23, 74],
  [24, 75],
  [25, 74],
  [26, 74],
  [27, 80],
]) as Theme

export const light_purple_alt1_ListItem = n387 as Theme
const n388 = t([
  [12, 74],
  [13, 74],
  [14, 74],
  [15, 74],
  [16, 73],
  [17, 72],
  [18, 72],
  [19, 81],
  [20, 82],
  [21, 81],
  [22, 82],
  [23, 76],
  [24, 78],
  [25, 76],
  [26, 76],
  [27, 78],
]) as Theme

export const light_purple_alt1_Card = n388 as Theme
export const light_purple_alt1_DrawerFrame = n388 as Theme
export const light_purple_alt1_Progress = n388 as Theme
export const light_purple_alt1_TooltipArrow = n388 as Theme
const n389 = t([
  [12, 75],
  [13, 75],
  [14, 75],
  [15, 75],
  [16, 73],
  [17, 71],
  [18, 72],
  [19, 79],
  [20, 81],
  [21, 79],
  [22, 11],
  [23, 272],
  [24, 272],
  [25, 76],
  [26, 78],
  [27, 76],
]) as Theme

export const light_purple_alt1_Button = n389 as Theme
const n390 = t([
  [12, 75],
  [13, 75],
  [14, 75],
  [15, 75],
  [16, 74],
  [17, 73],
  [18, 72],
  [19, 81],
  [20, 82],
  [21, 81],
  [22, 81],
  [23, 78],
  [24, 79],
  [25, 78],
  [26, 78],
  [27, 76],
]) as Theme

export const light_purple_alt1_Checkbox = n390 as Theme
export const light_purple_alt1_Switch = n390 as Theme
export const light_purple_alt1_TooltipContent = n390 as Theme
export const light_purple_alt1_SliderTrack = n390 as Theme
const n391 = t([
  [12, 11],
  [13, 11],
  [14, 11],
  [15, 11],
  [16, 11],
  [17, 11],
  [18, 82],
  [19, 73],
  [20, 72],
  [21, 73],
  [22, 71],
  [23, 81],
  [24, 80],
  [25, 81],
  [26, 81],
  [27, 73],
]) as Theme

export const light_purple_alt1_SwitchThumb = n391 as Theme
const n392 = t([
  [12, 79],
  [13, 79],
  [14, 79],
  [15, 79],
  [16, 80],
  [17, 81],
  [18, 82],
  [19, 73],
  [20, 72],
  [21, 73],
  [22, 73],
  [23, 76],
  [24, 75],
  [25, 76],
  [26, 76],
  [27, 78],
]) as Theme

export const light_purple_alt1_SliderTrackActive = n392 as Theme
const n393 = t([
  [12, 81],
  [13, 81],
  [14, 81],
  [15, 81],
  [16, 82],
  [17, 11],
  [18, 82],
  [19, 73],
  [20, 72],
  [21, 73],
  [22, 71],
  [23, 79],
  [24, 78],
  [25, 79],
  [26, 79],
  [27, 75],
]) as Theme

export const light_purple_alt1_SliderThumb = n393 as Theme
export const light_purple_alt1_Tooltip = n393 as Theme
export const light_purple_alt1_ProgressIndicator = n393 as Theme
const n394 = t([
  [12, 72],
  [13, 72],
  [14, 72],
  [15, 72],
  [16, 71],
  [17, 71],
  [18, 72],
  [19, 81],
  [20, 82],
  [21, 81],
  [22, 11],
  [23, 76],
  [24, 78],
  [25, 76],
  [26, 76],
  [27, 80],
]) as Theme

export const light_purple_alt1_Input = n394 as Theme
export const light_purple_alt1_TextArea = n394 as Theme
const n395 = t([
  [12, 73],
  [13, 73],
  [14, 73],
  [15, 73],
  [16, 72],
  [17, 71],
  [18, 73],
  [19, 80],
  [20, 81],
  [21, 80],
  [22, 11],
  [23, 75],
  [24, 76],
  [25, 75],
  [26, 75],
  [27, 79],
]) as Theme

export const light_purple_alt2_ListItem = n395 as Theme
const n396 = t([
  [12, 75],
  [13, 75],
  [14, 75],
  [15, 75],
  [16, 74],
  [17, 73],
  [18, 73],
  [19, 80],
  [20, 81],
  [21, 80],
  [22, 81],
  [23, 78],
  [24, 79],
  [25, 78],
  [26, 78],
  [27, 76],
]) as Theme

export const light_purple_alt2_Card = n396 as Theme
export const light_purple_alt2_DrawerFrame = n396 as Theme
export const light_purple_alt2_Progress = n396 as Theme
export const light_purple_alt2_TooltipArrow = n396 as Theme
const n397 = t([
  [12, 76],
  [13, 76],
  [14, 76],
  [15, 76],
  [16, 74],
  [17, 72],
  [18, 73],
  [19, 78],
  [20, 80],
  [21, 78],
  [22, 82],
  [23, 272],
  [24, 272],
  [25, 78],
  [26, 79],
  [27, 75],
]) as Theme

export const light_purple_alt2_Button = n397 as Theme
const n398 = t([
  [12, 76],
  [13, 76],
  [14, 76],
  [15, 76],
  [16, 75],
  [17, 74],
  [18, 73],
  [19, 80],
  [20, 81],
  [21, 80],
  [22, 80],
  [23, 79],
  [24, 80],
  [25, 79],
  [26, 79],
  [27, 75],
]) as Theme

export const light_purple_alt2_Checkbox = n398 as Theme
export const light_purple_alt2_Switch = n398 as Theme
export const light_purple_alt2_TooltipContent = n398 as Theme
export const light_purple_alt2_SliderTrack = n398 as Theme
const n399 = t([
  [12, 82],
  [13, 82],
  [14, 82],
  [15, 82],
  [16, 11],
  [17, 11],
  [18, 81],
  [19, 74],
  [20, 73],
  [21, 74],
  [22, 71],
  [23, 80],
  [24, 79],
  [25, 80],
  [26, 80],
  [27, 74],
]) as Theme

export const light_purple_alt2_SwitchThumb = n399 as Theme
const n400 = t([
  [12, 78],
  [13, 78],
  [14, 78],
  [15, 78],
  [16, 79],
  [17, 80],
  [18, 81],
  [19, 74],
  [20, 73],
  [21, 74],
  [22, 74],
  [23, 75],
  [24, 74],
  [25, 75],
  [26, 75],
  [27, 79],
]) as Theme

export const light_purple_alt2_SliderTrackActive = n400 as Theme
const n401 = t([
  [12, 80],
  [13, 80],
  [14, 80],
  [15, 80],
  [16, 81],
  [17, 82],
  [18, 81],
  [19, 74],
  [20, 73],
  [21, 74],
  [22, 72],
  [23, 78],
  [24, 76],
  [25, 78],
  [26, 78],
  [27, 76],
]) as Theme

export const light_purple_alt2_SliderThumb = n401 as Theme
export const light_purple_alt2_Tooltip = n401 as Theme
export const light_purple_alt2_ProgressIndicator = n401 as Theme
const n402 = t([
  [12, 73],
  [13, 73],
  [14, 73],
  [15, 73],
  [16, 72],
  [17, 71],
  [18, 73],
  [19, 80],
  [20, 81],
  [21, 80],
  [22, 11],
  [23, 78],
  [24, 79],
  [25, 78],
  [26, 78],
  [27, 79],
]) as Theme

export const light_purple_alt2_Input = n402 as Theme
export const light_purple_alt2_TextArea = n402 as Theme
const n403 = t([
  [12, 74],
  [13, 74],
  [14, 74],
  [15, 74],
  [16, 73],
  [17, 72],
  [19, 79],
  [20, 80],
  [21, 79],
  [22, 82],
  [23, 76],
  [24, 78],
  [25, 76],
  [26, 76],
  [27, 78],
]) as Theme

export const light_purple_active_ListItem = n403 as Theme
const n404 = t([
  [12, 76],
  [13, 76],
  [14, 76],
  [15, 76],
  [16, 75],
  [17, 74],
  [19, 79],
  [20, 80],
  [21, 79],
  [22, 80],
  [23, 79],
  [24, 80],
  [25, 79],
  [26, 79],
  [27, 75],
]) as Theme

export const light_purple_active_Card = n404 as Theme
export const light_purple_active_DrawerFrame = n404 as Theme
export const light_purple_active_Progress = n404 as Theme
export const light_purple_active_TooltipArrow = n404 as Theme
const n405 = t([
  [12, 78],
  [13, 78],
  [14, 78],
  [15, 78],
  [16, 75],
  [17, 73],
  [19, 76],
  [20, 79],
  [21, 76],
  [22, 81],
  [23, 272],
  [24, 272],
  [25, 79],
  [26, 80],
  [27, 74],
]) as Theme

export const light_purple_active_Button = n405 as Theme
const n406 = t([
  [12, 78],
  [13, 78],
  [14, 78],
  [15, 78],
  [16, 76],
  [17, 75],
  [19, 79],
  [20, 80],
  [21, 79],
  [22, 79],
  [23, 80],
  [24, 81],
  [25, 80],
  [26, 80],
  [27, 74],
]) as Theme

export const light_purple_active_Checkbox = n406 as Theme
export const light_purple_active_Switch = n406 as Theme
export const light_purple_active_TooltipContent = n406 as Theme
export const light_purple_active_SliderTrack = n406 as Theme
const n407 = t([
  [12, 81],
  [13, 81],
  [14, 81],
  [15, 81],
  [16, 82],
  [17, 11],
  [19, 75],
  [20, 74],
  [21, 75],
  [22, 71],
  [23, 79],
  [24, 78],
  [25, 79],
  [26, 79],
  [27, 75],
]) as Theme

export const light_purple_active_SwitchThumb = n407 as Theme
const n408 = t([
  [12, 76],
  [13, 76],
  [14, 76],
  [15, 76],
  [16, 78],
  [17, 79],
  [19, 75],
  [20, 74],
  [21, 75],
  [22, 75],
  [23, 74],
  [24, 73],
  [25, 74],
  [26, 74],
  [27, 80],
]) as Theme

export const light_purple_active_SliderTrackActive = n408 as Theme
const n409 = t([
  [12, 79],
  [13, 79],
  [14, 79],
  [15, 79],
  [16, 80],
  [17, 81],
  [19, 75],
  [20, 74],
  [21, 75],
  [22, 73],
  [23, 76],
  [24, 75],
  [25, 76],
  [26, 76],
  [27, 78],
]) as Theme

export const light_purple_active_SliderThumb = n409 as Theme
export const light_purple_active_Tooltip = n409 as Theme
export const light_purple_active_ProgressIndicator = n409 as Theme
const n410 = t([
  [12, 74],
  [13, 74],
  [14, 74],
  [15, 74],
  [16, 73],
  [17, 72],
  [19, 79],
  [20, 80],
  [21, 79],
  [22, 82],
  [23, 79],
  [24, 80],
  [25, 79],
  [26, 79],
  [27, 78],
]) as Theme

export const light_purple_active_Input = n410 as Theme
export const light_purple_active_TextArea = n410 as Theme
const n411 = t([
  [12, 60],
  [13, 60],
  [14, 60],
  [15, 60],
  [16, 59],
  [17, 59],
  [18, 60],
  [19, 69],
  [20, 70],
  [21, 69],
  [22, 11],
  [23, 62],
  [24, 63],
  [25, 62],
  [26, 62],
  [27, 68],
]) as Theme

export const light_pink_alt1_ListItem = n411 as Theme
const n412 = t([
  [12, 62],
  [13, 62],
  [14, 62],
  [15, 62],
  [16, 61],
  [17, 60],
  [18, 60],
  [19, 69],
  [20, 70],
  [21, 69],
  [22, 70],
  [23, 64],
  [24, 66],
  [25, 64],
  [26, 64],
  [27, 66],
]) as Theme

export const light_pink_alt1_Card = n412 as Theme
export const light_pink_alt1_DrawerFrame = n412 as Theme
export const light_pink_alt1_Progress = n412 as Theme
export const light_pink_alt1_TooltipArrow = n412 as Theme
const n413 = t([
  [12, 63],
  [13, 63],
  [14, 63],
  [15, 63],
  [16, 61],
  [17, 59],
  [18, 60],
  [19, 67],
  [20, 69],
  [21, 67],
  [22, 11],
  [23, 272],
  [24, 272],
  [25, 64],
  [26, 66],
  [27, 64],
]) as Theme

export const light_pink_alt1_Button = n413 as Theme
const n414 = t([
  [12, 63],
  [13, 63],
  [14, 63],
  [15, 63],
  [16, 62],
  [17, 61],
  [18, 60],
  [19, 69],
  [20, 70],
  [21, 69],
  [22, 69],
  [23, 66],
  [24, 67],
  [25, 66],
  [26, 66],
  [27, 64],
]) as Theme

export const light_pink_alt1_Checkbox = n414 as Theme
export const light_pink_alt1_Switch = n414 as Theme
export const light_pink_alt1_TooltipContent = n414 as Theme
export const light_pink_alt1_SliderTrack = n414 as Theme
const n415 = t([
  [12, 11],
  [13, 11],
  [14, 11],
  [15, 11],
  [16, 11],
  [17, 11],
  [18, 70],
  [19, 61],
  [20, 60],
  [21, 61],
  [22, 59],
  [23, 69],
  [24, 68],
  [25, 69],
  [26, 69],
  [27, 61],
]) as Theme

export const light_pink_alt1_SwitchThumb = n415 as Theme
const n416 = t([
  [12, 67],
  [13, 67],
  [14, 67],
  [15, 67],
  [16, 68],
  [17, 69],
  [18, 70],
  [19, 61],
  [20, 60],
  [21, 61],
  [22, 61],
  [23, 64],
  [24, 63],
  [25, 64],
  [26, 64],
  [27, 66],
]) as Theme

export const light_pink_alt1_SliderTrackActive = n416 as Theme
const n417 = t([
  [12, 69],
  [13, 69],
  [14, 69],
  [15, 69],
  [16, 70],
  [17, 11],
  [18, 70],
  [19, 61],
  [20, 60],
  [21, 61],
  [22, 59],
  [23, 67],
  [24, 66],
  [25, 67],
  [26, 67],
  [27, 63],
]) as Theme

export const light_pink_alt1_SliderThumb = n417 as Theme
export const light_pink_alt1_Tooltip = n417 as Theme
export const light_pink_alt1_ProgressIndicator = n417 as Theme
const n418 = t([
  [12, 60],
  [13, 60],
  [14, 60],
  [15, 60],
  [16, 59],
  [17, 59],
  [18, 60],
  [19, 69],
  [20, 70],
  [21, 69],
  [22, 11],
  [23, 64],
  [24, 66],
  [25, 64],
  [26, 64],
  [27, 68],
]) as Theme

export const light_pink_alt1_Input = n418 as Theme
export const light_pink_alt1_TextArea = n418 as Theme
const n419 = t([
  [12, 61],
  [13, 61],
  [14, 61],
  [15, 61],
  [16, 60],
  [17, 59],
  [18, 61],
  [19, 68],
  [20, 69],
  [21, 68],
  [22, 11],
  [23, 63],
  [24, 64],
  [25, 63],
  [26, 63],
  [27, 67],
]) as Theme

export const light_pink_alt2_ListItem = n419 as Theme
const n420 = t([
  [12, 63],
  [13, 63],
  [14, 63],
  [15, 63],
  [16, 62],
  [17, 61],
  [18, 61],
  [19, 68],
  [20, 69],
  [21, 68],
  [22, 69],
  [23, 66],
  [24, 67],
  [25, 66],
  [26, 66],
  [27, 64],
]) as Theme

export const light_pink_alt2_Card = n420 as Theme
export const light_pink_alt2_DrawerFrame = n420 as Theme
export const light_pink_alt2_Progress = n420 as Theme
export const light_pink_alt2_TooltipArrow = n420 as Theme
const n421 = t([
  [12, 64],
  [13, 64],
  [14, 64],
  [15, 64],
  [16, 62],
  [17, 60],
  [18, 61],
  [19, 66],
  [20, 68],
  [21, 66],
  [22, 70],
  [23, 272],
  [24, 272],
  [25, 66],
  [26, 67],
  [27, 63],
]) as Theme

export const light_pink_alt2_Button = n421 as Theme
const n422 = t([
  [12, 64],
  [13, 64],
  [14, 64],
  [15, 64],
  [16, 63],
  [17, 62],
  [18, 61],
  [19, 68],
  [20, 69],
  [21, 68],
  [22, 68],
  [23, 67],
  [24, 68],
  [25, 67],
  [26, 67],
  [27, 63],
]) as Theme

export const light_pink_alt2_Checkbox = n422 as Theme
export const light_pink_alt2_Switch = n422 as Theme
export const light_pink_alt2_TooltipContent = n422 as Theme
export const light_pink_alt2_SliderTrack = n422 as Theme
const n423 = t([
  [12, 70],
  [13, 70],
  [14, 70],
  [15, 70],
  [16, 11],
  [17, 11],
  [18, 69],
  [19, 62],
  [20, 61],
  [21, 62],
  [22, 59],
  [23, 68],
  [24, 67],
  [25, 68],
  [26, 68],
  [27, 62],
]) as Theme

export const light_pink_alt2_SwitchThumb = n423 as Theme
const n424 = t([
  [12, 66],
  [13, 66],
  [14, 66],
  [15, 66],
  [16, 67],
  [17, 68],
  [18, 69],
  [19, 62],
  [20, 61],
  [21, 62],
  [22, 62],
  [23, 63],
  [24, 62],
  [25, 63],
  [26, 63],
  [27, 67],
]) as Theme

export const light_pink_alt2_SliderTrackActive = n424 as Theme
const n425 = t([
  [12, 68],
  [13, 68],
  [14, 68],
  [15, 68],
  [16, 69],
  [17, 70],
  [18, 69],
  [19, 62],
  [20, 61],
  [21, 62],
  [22, 60],
  [23, 66],
  [24, 64],
  [25, 66],
  [26, 66],
  [27, 64],
]) as Theme

export const light_pink_alt2_SliderThumb = n425 as Theme
export const light_pink_alt2_Tooltip = n425 as Theme
export const light_pink_alt2_ProgressIndicator = n425 as Theme
const n426 = t([
  [12, 61],
  [13, 61],
  [14, 61],
  [15, 61],
  [16, 60],
  [17, 59],
  [18, 61],
  [19, 68],
  [20, 69],
  [21, 68],
  [22, 11],
  [23, 66],
  [24, 67],
  [25, 66],
  [26, 66],
  [27, 67],
]) as Theme

export const light_pink_alt2_Input = n426 as Theme
export const light_pink_alt2_TextArea = n426 as Theme
const n427 = t([
  [12, 62],
  [13, 62],
  [14, 62],
  [15, 62],
  [16, 61],
  [17, 60],
  [19, 67],
  [20, 68],
  [21, 67],
  [22, 70],
  [23, 64],
  [24, 66],
  [25, 64],
  [26, 64],
  [27, 66],
]) as Theme

export const light_pink_active_ListItem = n427 as Theme
const n428 = t([
  [12, 64],
  [13, 64],
  [14, 64],
  [15, 64],
  [16, 63],
  [17, 62],
  [19, 67],
  [20, 68],
  [21, 67],
  [22, 68],
  [23, 67],
  [24, 68],
  [25, 67],
  [26, 67],
  [27, 63],
]) as Theme

export const light_pink_active_Card = n428 as Theme
export const light_pink_active_DrawerFrame = n428 as Theme
export const light_pink_active_Progress = n428 as Theme
export const light_pink_active_TooltipArrow = n428 as Theme
const n429 = t([
  [12, 66],
  [13, 66],
  [14, 66],
  [15, 66],
  [16, 63],
  [17, 61],
  [19, 64],
  [20, 67],
  [21, 64],
  [22, 69],
  [23, 272],
  [24, 272],
  [25, 67],
  [26, 68],
  [27, 62],
]) as Theme

export const light_pink_active_Button = n429 as Theme
const n430 = t([
  [12, 66],
  [13, 66],
  [14, 66],
  [15, 66],
  [16, 64],
  [17, 63],
  [19, 67],
  [20, 68],
  [21, 67],
  [22, 67],
  [23, 68],
  [24, 69],
  [25, 68],
  [26, 68],
  [27, 62],
]) as Theme

export const light_pink_active_Checkbox = n430 as Theme
export const light_pink_active_Switch = n430 as Theme
export const light_pink_active_TooltipContent = n430 as Theme
export const light_pink_active_SliderTrack = n430 as Theme
const n431 = t([
  [12, 69],
  [13, 69],
  [14, 69],
  [15, 69],
  [16, 70],
  [17, 11],
  [19, 63],
  [20, 62],
  [21, 63],
  [22, 59],
  [23, 67],
  [24, 66],
  [25, 67],
  [26, 67],
  [27, 63],
]) as Theme

export const light_pink_active_SwitchThumb = n431 as Theme
const n432 = t([
  [12, 64],
  [13, 64],
  [14, 64],
  [15, 64],
  [16, 66],
  [17, 67],
  [19, 63],
  [20, 62],
  [21, 63],
  [22, 63],
  [23, 62],
  [24, 61],
  [25, 62],
  [26, 62],
  [27, 68],
]) as Theme

export const light_pink_active_SliderTrackActive = n432 as Theme
const n433 = t([
  [12, 67],
  [13, 67],
  [14, 67],
  [15, 67],
  [16, 68],
  [17, 69],
  [19, 63],
  [20, 62],
  [21, 63],
  [22, 61],
  [23, 64],
  [24, 63],
  [25, 64],
  [26, 64],
  [27, 66],
]) as Theme

export const light_pink_active_SliderThumb = n433 as Theme
export const light_pink_active_Tooltip = n433 as Theme
export const light_pink_active_ProgressIndicator = n433 as Theme
const n434 = t([
  [12, 62],
  [13, 62],
  [14, 62],
  [15, 62],
  [16, 61],
  [17, 60],
  [19, 67],
  [20, 68],
  [21, 67],
  [22, 70],
  [23, 67],
  [24, 68],
  [25, 67],
  [26, 67],
  [27, 66],
]) as Theme

export const light_pink_active_Input = n434 as Theme
export const light_pink_active_TextArea = n434 as Theme
const n435 = t([
  [12, 84],
  [13, 84],
  [14, 84],
  [15, 84],
  [16, 83],
  [17, 83],
  [18, 84],
  [19, 93],
  [20, 94],
  [21, 93],
  [22, 11],
  [23, 86],
  [24, 87],
  [25, 86],
  [26, 86],
  [27, 92],
]) as Theme

export const light_red_alt1_ListItem = n435 as Theme
const n436 = t([
  [12, 86],
  [13, 86],
  [14, 86],
  [15, 86],
  [16, 85],
  [17, 84],
  [18, 84],
  [19, 93],
  [20, 94],
  [21, 93],
  [22, 94],
  [23, 88],
  [24, 90],
  [25, 88],
  [26, 88],
  [27, 90],
]) as Theme

export const light_red_alt1_Card = n436 as Theme
export const light_red_alt1_DrawerFrame = n436 as Theme
export const light_red_alt1_Progress = n436 as Theme
export const light_red_alt1_TooltipArrow = n436 as Theme
const n437 = t([
  [12, 87],
  [13, 87],
  [14, 87],
  [15, 87],
  [16, 85],
  [17, 83],
  [18, 84],
  [19, 91],
  [20, 93],
  [21, 91],
  [22, 11],
  [23, 272],
  [24, 272],
  [25, 88],
  [26, 90],
  [27, 88],
]) as Theme

export const light_red_alt1_Button = n437 as Theme
const n438 = t([
  [12, 87],
  [13, 87],
  [14, 87],
  [15, 87],
  [16, 86],
  [17, 85],
  [18, 84],
  [19, 93],
  [20, 94],
  [21, 93],
  [22, 93],
  [23, 90],
  [24, 91],
  [25, 90],
  [26, 90],
  [27, 88],
]) as Theme

export const light_red_alt1_Checkbox = n438 as Theme
export const light_red_alt1_Switch = n438 as Theme
export const light_red_alt1_TooltipContent = n438 as Theme
export const light_red_alt1_SliderTrack = n438 as Theme
const n439 = t([
  [12, 11],
  [13, 11],
  [14, 11],
  [15, 11],
  [16, 11],
  [17, 11],
  [18, 94],
  [19, 85],
  [20, 84],
  [21, 85],
  [22, 83],
  [23, 93],
  [24, 92],
  [25, 93],
  [26, 93],
  [27, 85],
]) as Theme

export const light_red_alt1_SwitchThumb = n439 as Theme
const n440 = t([
  [12, 91],
  [13, 91],
  [14, 91],
  [15, 91],
  [16, 92],
  [17, 93],
  [18, 94],
  [19, 85],
  [20, 84],
  [21, 85],
  [22, 85],
  [23, 88],
  [24, 87],
  [25, 88],
  [26, 88],
  [27, 90],
]) as Theme

export const light_red_alt1_SliderTrackActive = n440 as Theme
const n441 = t([
  [12, 93],
  [13, 93],
  [14, 93],
  [15, 93],
  [16, 94],
  [17, 11],
  [18, 94],
  [19, 85],
  [20, 84],
  [21, 85],
  [22, 83],
  [23, 91],
  [24, 90],
  [25, 91],
  [26, 91],
  [27, 87],
]) as Theme

export const light_red_alt1_SliderThumb = n441 as Theme
export const light_red_alt1_Tooltip = n441 as Theme
export const light_red_alt1_ProgressIndicator = n441 as Theme
const n442 = t([
  [12, 84],
  [13, 84],
  [14, 84],
  [15, 84],
  [16, 83],
  [17, 83],
  [18, 84],
  [19, 93],
  [20, 94],
  [21, 93],
  [22, 11],
  [23, 88],
  [24, 90],
  [25, 88],
  [26, 88],
  [27, 92],
]) as Theme

export const light_red_alt1_Input = n442 as Theme
export const light_red_alt1_TextArea = n442 as Theme
const n443 = t([
  [12, 85],
  [13, 85],
  [14, 85],
  [15, 85],
  [16, 84],
  [17, 83],
  [18, 85],
  [19, 92],
  [20, 93],
  [21, 92],
  [22, 11],
  [23, 87],
  [24, 88],
  [25, 87],
  [26, 87],
  [27, 91],
]) as Theme

export const light_red_alt2_ListItem = n443 as Theme
const n444 = t([
  [12, 87],
  [13, 87],
  [14, 87],
  [15, 87],
  [16, 86],
  [17, 85],
  [18, 85],
  [19, 92],
  [20, 93],
  [21, 92],
  [22, 93],
  [23, 90],
  [24, 91],
  [25, 90],
  [26, 90],
  [27, 88],
]) as Theme

export const light_red_alt2_Card = n444 as Theme
export const light_red_alt2_DrawerFrame = n444 as Theme
export const light_red_alt2_Progress = n444 as Theme
export const light_red_alt2_TooltipArrow = n444 as Theme
const n445 = t([
  [12, 88],
  [13, 88],
  [14, 88],
  [15, 88],
  [16, 86],
  [17, 84],
  [18, 85],
  [19, 90],
  [20, 92],
  [21, 90],
  [22, 94],
  [23, 272],
  [24, 272],
  [25, 90],
  [26, 91],
  [27, 87],
]) as Theme

export const light_red_alt2_Button = n445 as Theme
const n446 = t([
  [12, 88],
  [13, 88],
  [14, 88],
  [15, 88],
  [16, 87],
  [17, 86],
  [18, 85],
  [19, 92],
  [20, 93],
  [21, 92],
  [22, 92],
  [23, 91],
  [24, 92],
  [25, 91],
  [26, 91],
  [27, 87],
]) as Theme

export const light_red_alt2_Checkbox = n446 as Theme
export const light_red_alt2_Switch = n446 as Theme
export const light_red_alt2_TooltipContent = n446 as Theme
export const light_red_alt2_SliderTrack = n446 as Theme
const n447 = t([
  [12, 94],
  [13, 94],
  [14, 94],
  [15, 94],
  [16, 11],
  [17, 11],
  [18, 93],
  [19, 86],
  [20, 85],
  [21, 86],
  [22, 83],
  [23, 92],
  [24, 91],
  [25, 92],
  [26, 92],
  [27, 86],
]) as Theme

export const light_red_alt2_SwitchThumb = n447 as Theme
const n448 = t([
  [12, 90],
  [13, 90],
  [14, 90],
  [15, 90],
  [16, 91],
  [17, 92],
  [18, 93],
  [19, 86],
  [20, 85],
  [21, 86],
  [22, 86],
  [23, 87],
  [24, 86],
  [25, 87],
  [26, 87],
  [27, 91],
]) as Theme

export const light_red_alt2_SliderTrackActive = n448 as Theme
const n449 = t([
  [12, 92],
  [13, 92],
  [14, 92],
  [15, 92],
  [16, 93],
  [17, 94],
  [18, 93],
  [19, 86],
  [20, 85],
  [21, 86],
  [22, 84],
  [23, 90],
  [24, 88],
  [25, 90],
  [26, 90],
  [27, 88],
]) as Theme

export const light_red_alt2_SliderThumb = n449 as Theme
export const light_red_alt2_Tooltip = n449 as Theme
export const light_red_alt2_ProgressIndicator = n449 as Theme
const n450 = t([
  [12, 85],
  [13, 85],
  [14, 85],
  [15, 85],
  [16, 84],
  [17, 83],
  [18, 85],
  [19, 92],
  [20, 93],
  [21, 92],
  [22, 11],
  [23, 90],
  [24, 91],
  [25, 90],
  [26, 90],
  [27, 91],
]) as Theme

export const light_red_alt2_Input = n450 as Theme
export const light_red_alt2_TextArea = n450 as Theme
const n451 = t([
  [12, 86],
  [13, 86],
  [14, 86],
  [15, 86],
  [16, 85],
  [17, 84],
  [19, 91],
  [20, 92],
  [21, 91],
  [22, 94],
  [23, 88],
  [24, 90],
  [25, 88],
  [26, 88],
  [27, 90],
]) as Theme

export const light_red_active_ListItem = n451 as Theme
const n452 = t([
  [12, 88],
  [13, 88],
  [14, 88],
  [15, 88],
  [16, 87],
  [17, 86],
  [19, 91],
  [20, 92],
  [21, 91],
  [22, 92],
  [23, 91],
  [24, 92],
  [25, 91],
  [26, 91],
  [27, 87],
]) as Theme

export const light_red_active_Card = n452 as Theme
export const light_red_active_DrawerFrame = n452 as Theme
export const light_red_active_Progress = n452 as Theme
export const light_red_active_TooltipArrow = n452 as Theme
const n453 = t([
  [12, 90],
  [13, 90],
  [14, 90],
  [15, 90],
  [16, 87],
  [17, 85],
  [19, 88],
  [20, 91],
  [21, 88],
  [22, 93],
  [23, 272],
  [24, 272],
  [25, 91],
  [26, 92],
  [27, 86],
]) as Theme

export const light_red_active_Button = n453 as Theme
const n454 = t([
  [12, 90],
  [13, 90],
  [14, 90],
  [15, 90],
  [16, 88],
  [17, 87],
  [19, 91],
  [20, 92],
  [21, 91],
  [22, 91],
  [23, 92],
  [24, 93],
  [25, 92],
  [26, 92],
  [27, 86],
]) as Theme

export const light_red_active_Checkbox = n454 as Theme
export const light_red_active_Switch = n454 as Theme
export const light_red_active_TooltipContent = n454 as Theme
export const light_red_active_SliderTrack = n454 as Theme
const n455 = t([
  [12, 93],
  [13, 93],
  [14, 93],
  [15, 93],
  [16, 94],
  [17, 11],
  [19, 87],
  [20, 86],
  [21, 87],
  [22, 83],
  [23, 91],
  [24, 90],
  [25, 91],
  [26, 91],
  [27, 87],
]) as Theme

export const light_red_active_SwitchThumb = n455 as Theme
const n456 = t([
  [12, 88],
  [13, 88],
  [14, 88],
  [15, 88],
  [16, 90],
  [17, 91],
  [19, 87],
  [20, 86],
  [21, 87],
  [22, 87],
  [23, 86],
  [24, 85],
  [25, 86],
  [26, 86],
  [27, 92],
]) as Theme

export const light_red_active_SliderTrackActive = n456 as Theme
const n457 = t([
  [12, 91],
  [13, 91],
  [14, 91],
  [15, 91],
  [16, 92],
  [17, 93],
  [19, 87],
  [20, 86],
  [21, 87],
  [22, 85],
  [23, 88],
  [24, 87],
  [25, 88],
  [26, 88],
  [27, 90],
]) as Theme

export const light_red_active_SliderThumb = n457 as Theme
export const light_red_active_Tooltip = n457 as Theme
export const light_red_active_ProgressIndicator = n457 as Theme
const n458 = t([
  [12, 86],
  [13, 86],
  [14, 86],
  [15, 86],
  [16, 85],
  [17, 84],
  [19, 91],
  [20, 92],
  [21, 91],
  [22, 94],
  [23, 91],
  [24, 92],
  [25, 91],
  [26, 91],
  [27, 90],
]) as Theme

export const light_red_active_Input = n458 as Theme
export const light_red_active_TextArea = n458 as Theme
const n459 = t([
  [12, 108],
  [13, 108],
  [14, 108],
  [15, 108],
  [16, 107],
  [17, 107],
  [18, 108],
  [19, 117],
  [20, 118],
  [21, 117],
  [22, 11],
  [23, 110],
  [24, 111],
  [25, 110],
  [26, 110],
  [27, 116],
]) as Theme

export const light_gold_alt1_ListItem = n459 as Theme
const n460 = t([
  [12, 110],
  [13, 110],
  [14, 110],
  [15, 110],
  [16, 109],
  [17, 108],
  [18, 108],
  [19, 117],
  [20, 118],
  [21, 117],
  [22, 118],
  [23, 112],
  [24, 114],
  [25, 112],
  [26, 112],
  [27, 114],
]) as Theme

export const light_gold_alt1_Card = n460 as Theme
export const light_gold_alt1_DrawerFrame = n460 as Theme
export const light_gold_alt1_Progress = n460 as Theme
export const light_gold_alt1_TooltipArrow = n460 as Theme
const n461 = t([
  [12, 111],
  [13, 111],
  [14, 111],
  [15, 111],
  [16, 109],
  [17, 107],
  [18, 108],
  [19, 115],
  [20, 117],
  [21, 115],
  [22, 11],
  [23, 272],
  [24, 272],
  [25, 112],
  [26, 114],
  [27, 112],
]) as Theme

export const light_gold_alt1_Button = n461 as Theme
const n462 = t([
  [12, 111],
  [13, 111],
  [14, 111],
  [15, 111],
  [16, 110],
  [17, 109],
  [18, 108],
  [19, 117],
  [20, 118],
  [21, 117],
  [22, 117],
  [23, 114],
  [24, 115],
  [25, 114],
  [26, 114],
  [27, 112],
]) as Theme

export const light_gold_alt1_Checkbox = n462 as Theme
export const light_gold_alt1_Switch = n462 as Theme
export const light_gold_alt1_TooltipContent = n462 as Theme
export const light_gold_alt1_SliderTrack = n462 as Theme
const n463 = t([
  [12, 11],
  [13, 11],
  [14, 11],
  [15, 11],
  [16, 11],
  [17, 11],
  [18, 118],
  [19, 109],
  [20, 108],
  [21, 109],
  [22, 107],
  [23, 117],
  [24, 116],
  [25, 117],
  [26, 117],
  [27, 109],
]) as Theme

export const light_gold_alt1_SwitchThumb = n463 as Theme
const n464 = t([
  [12, 115],
  [13, 115],
  [14, 115],
  [15, 115],
  [16, 116],
  [17, 117],
  [18, 118],
  [19, 109],
  [20, 108],
  [21, 109],
  [22, 109],
  [23, 112],
  [24, 111],
  [25, 112],
  [26, 112],
  [27, 114],
]) as Theme

export const light_gold_alt1_SliderTrackActive = n464 as Theme
const n465 = t([
  [12, 117],
  [13, 117],
  [14, 117],
  [15, 117],
  [16, 118],
  [17, 11],
  [18, 118],
  [19, 109],
  [20, 108],
  [21, 109],
  [22, 107],
  [23, 115],
  [24, 114],
  [25, 115],
  [26, 115],
  [27, 111],
]) as Theme

export const light_gold_alt1_SliderThumb = n465 as Theme
export const light_gold_alt1_Tooltip = n465 as Theme
export const light_gold_alt1_ProgressIndicator = n465 as Theme
const n466 = t([
  [12, 108],
  [13, 108],
  [14, 108],
  [15, 108],
  [16, 107],
  [17, 107],
  [18, 108],
  [19, 117],
  [20, 118],
  [21, 117],
  [22, 11],
  [23, 112],
  [24, 114],
  [25, 112],
  [26, 112],
  [27, 116],
]) as Theme

export const light_gold_alt1_Input = n466 as Theme
export const light_gold_alt1_TextArea = n466 as Theme
const n467 = t([
  [12, 109],
  [13, 109],
  [14, 109],
  [15, 109],
  [16, 108],
  [17, 107],
  [18, 109],
  [19, 116],
  [20, 117],
  [21, 116],
  [22, 11],
  [23, 111],
  [24, 112],
  [25, 111],
  [26, 111],
  [27, 115],
]) as Theme

export const light_gold_alt2_ListItem = n467 as Theme
const n468 = t([
  [12, 111],
  [13, 111],
  [14, 111],
  [15, 111],
  [16, 110],
  [17, 109],
  [18, 109],
  [19, 116],
  [20, 117],
  [21, 116],
  [22, 117],
  [23, 114],
  [24, 115],
  [25, 114],
  [26, 114],
  [27, 112],
]) as Theme

export const light_gold_alt2_Card = n468 as Theme
export const light_gold_alt2_DrawerFrame = n468 as Theme
export const light_gold_alt2_Progress = n468 as Theme
export const light_gold_alt2_TooltipArrow = n468 as Theme
const n469 = t([
  [12, 112],
  [13, 112],
  [14, 112],
  [15, 112],
  [16, 110],
  [17, 108],
  [18, 109],
  [19, 114],
  [20, 116],
  [21, 114],
  [22, 118],
  [23, 272],
  [24, 272],
  [25, 114],
  [26, 115],
  [27, 111],
]) as Theme

export const light_gold_alt2_Button = n469 as Theme
const n470 = t([
  [12, 112],
  [13, 112],
  [14, 112],
  [15, 112],
  [16, 111],
  [17, 110],
  [18, 109],
  [19, 116],
  [20, 117],
  [21, 116],
  [22, 116],
  [23, 115],
  [24, 116],
  [25, 115],
  [26, 115],
  [27, 111],
]) as Theme

export const light_gold_alt2_Checkbox = n470 as Theme
export const light_gold_alt2_Switch = n470 as Theme
export const light_gold_alt2_TooltipContent = n470 as Theme
export const light_gold_alt2_SliderTrack = n470 as Theme
const n471 = t([
  [12, 118],
  [13, 118],
  [14, 118],
  [15, 118],
  [16, 11],
  [17, 11],
  [18, 117],
  [19, 110],
  [20, 109],
  [21, 110],
  [22, 107],
  [23, 116],
  [24, 115],
  [25, 116],
  [26, 116],
  [27, 110],
]) as Theme

export const light_gold_alt2_SwitchThumb = n471 as Theme
const n472 = t([
  [12, 114],
  [13, 114],
  [14, 114],
  [15, 114],
  [16, 115],
  [17, 116],
  [18, 117],
  [19, 110],
  [20, 109],
  [21, 110],
  [22, 110],
  [23, 111],
  [24, 110],
  [25, 111],
  [26, 111],
  [27, 115],
]) as Theme

export const light_gold_alt2_SliderTrackActive = n472 as Theme
const n473 = t([
  [12, 116],
  [13, 116],
  [14, 116],
  [15, 116],
  [16, 117],
  [17, 118],
  [18, 117],
  [19, 110],
  [20, 109],
  [21, 110],
  [22, 108],
  [23, 114],
  [24, 112],
  [25, 114],
  [26, 114],
  [27, 112],
]) as Theme

export const light_gold_alt2_SliderThumb = n473 as Theme
export const light_gold_alt2_Tooltip = n473 as Theme
export const light_gold_alt2_ProgressIndicator = n473 as Theme
const n474 = t([
  [12, 109],
  [13, 109],
  [14, 109],
  [15, 109],
  [16, 108],
  [17, 107],
  [18, 109],
  [19, 116],
  [20, 117],
  [21, 116],
  [22, 11],
  [23, 114],
  [24, 115],
  [25, 114],
  [26, 114],
  [27, 115],
]) as Theme

export const light_gold_alt2_Input = n474 as Theme
export const light_gold_alt2_TextArea = n474 as Theme
const n475 = t([
  [12, 110],
  [13, 110],
  [14, 110],
  [15, 110],
  [16, 109],
  [17, 108],
  [19, 115],
  [20, 116],
  [21, 115],
  [22, 118],
  [23, 112],
  [24, 114],
  [25, 112],
  [26, 112],
  [27, 114],
]) as Theme

export const light_gold_active_ListItem = n475 as Theme
const n476 = t([
  [12, 112],
  [13, 112],
  [14, 112],
  [15, 112],
  [16, 111],
  [17, 110],
  [19, 115],
  [20, 116],
  [21, 115],
  [22, 116],
  [23, 115],
  [24, 116],
  [25, 115],
  [26, 115],
  [27, 111],
]) as Theme

export const light_gold_active_Card = n476 as Theme
export const light_gold_active_DrawerFrame = n476 as Theme
export const light_gold_active_Progress = n476 as Theme
export const light_gold_active_TooltipArrow = n476 as Theme
const n477 = t([
  [12, 114],
  [13, 114],
  [14, 114],
  [15, 114],
  [16, 111],
  [17, 109],
  [19, 112],
  [20, 115],
  [21, 112],
  [22, 117],
  [23, 272],
  [24, 272],
  [25, 115],
  [26, 116],
  [27, 110],
]) as Theme

export const light_gold_active_Button = n477 as Theme
const n478 = t([
  [12, 114],
  [13, 114],
  [14, 114],
  [15, 114],
  [16, 112],
  [17, 111],
  [19, 115],
  [20, 116],
  [21, 115],
  [22, 115],
  [23, 116],
  [24, 117],
  [25, 116],
  [26, 116],
  [27, 110],
]) as Theme

export const light_gold_active_Checkbox = n478 as Theme
export const light_gold_active_Switch = n478 as Theme
export const light_gold_active_TooltipContent = n478 as Theme
export const light_gold_active_SliderTrack = n478 as Theme
const n479 = t([
  [12, 117],
  [13, 117],
  [14, 117],
  [15, 117],
  [16, 118],
  [17, 11],
  [19, 111],
  [20, 110],
  [21, 111],
  [22, 107],
  [23, 115],
  [24, 114],
  [25, 115],
  [26, 115],
  [27, 111],
]) as Theme

export const light_gold_active_SwitchThumb = n479 as Theme
const n480 = t([
  [12, 112],
  [13, 112],
  [14, 112],
  [15, 112],
  [16, 114],
  [17, 115],
  [19, 111],
  [20, 110],
  [21, 111],
  [22, 111],
  [23, 110],
  [24, 109],
  [25, 110],
  [26, 110],
  [27, 116],
]) as Theme

export const light_gold_active_SliderTrackActive = n480 as Theme
const n481 = t([
  [12, 115],
  [13, 115],
  [14, 115],
  [15, 115],
  [16, 116],
  [17, 117],
  [19, 111],
  [20, 110],
  [21, 111],
  [22, 109],
  [23, 112],
  [24, 111],
  [25, 112],
  [26, 112],
  [27, 114],
]) as Theme

export const light_gold_active_SliderThumb = n481 as Theme
export const light_gold_active_Tooltip = n481 as Theme
export const light_gold_active_ProgressIndicator = n481 as Theme
const n482 = t([
  [12, 110],
  [13, 110],
  [14, 110],
  [15, 110],
  [16, 109],
  [17, 108],
  [19, 115],
  [20, 116],
  [21, 115],
  [22, 118],
  [23, 115],
  [24, 116],
  [25, 115],
  [26, 115],
  [27, 114],
]) as Theme

export const light_gold_active_Input = n482 as Theme
export const light_gold_active_TextArea = n482 as Theme
const n483 = t([
  [12, 120],
  [13, 120],
  [14, 120],
  [15, 120],
  [16, 119],
  [17, 119],
  [18, 120],
  [19, 127],
  [20, 128],
  [21, 127],
  [22, 11],
  [23, 122],
  [24, 121],
  [25, 122],
  [26, 122],
  [27, 126],
]) as Theme

export const light_send_alt1_ListItem = n483 as Theme
const n484 = t([
  [12, 122],
  [13, 122],
  [14, 122],
  [15, 122],
  [16, 0],
  [17, 120],
  [18, 120],
  [19, 127],
  [20, 128],
  [21, 127],
  [22, 128],
  [23, 119],
  [24, 124],
  [25, 119],
  [26, 119],
  [27, 124],
]) as Theme

export const light_send_alt1_Card = n484 as Theme
export const light_send_alt1_DrawerFrame = n484 as Theme
export const light_send_alt1_Progress = n484 as Theme
export const light_send_alt1_TooltipArrow = n484 as Theme
const n485 = t([
  [12, 121],
  [13, 121],
  [14, 121],
  [15, 121],
  [16, 0],
  [17, 119],
  [18, 120],
  [19, 125],
  [20, 127],
  [21, 125],
  [22, 11],
  [23, 272],
  [24, 272],
  [25, 119],
  [26, 124],
  [27, 119],
]) as Theme

export const light_send_alt1_Button = n485 as Theme
const n486 = t([
  [12, 121],
  [13, 121],
  [14, 121],
  [15, 121],
  [16, 122],
  [17, 0],
  [18, 120],
  [19, 127],
  [20, 128],
  [21, 127],
  [22, 127],
  [23, 124],
  [24, 125],
  [25, 124],
  [26, 124],
  [27, 119],
]) as Theme

export const light_send_alt1_Checkbox = n486 as Theme
export const light_send_alt1_Switch = n486 as Theme
export const light_send_alt1_TooltipContent = n486 as Theme
export const light_send_alt1_SliderTrack = n486 as Theme
const n487 = t([
  [12, 11],
  [13, 11],
  [14, 11],
  [15, 11],
  [16, 11],
  [17, 11],
  [18, 128],
  [19, 0],
  [20, 120],
  [21, 0],
  [22, 119],
  [23, 127],
  [24, 126],
  [25, 127],
  [26, 127],
  [27, 0],
]) as Theme

export const light_send_alt1_SwitchThumb = n487 as Theme
const n488 = t([
  [12, 125],
  [13, 125],
  [14, 125],
  [15, 125],
  [16, 126],
  [17, 127],
  [18, 128],
  [19, 0],
  [20, 120],
  [21, 0],
  [22, 0],
  [23, 119],
  [24, 121],
  [25, 119],
  [26, 119],
  [27, 124],
]) as Theme

export const light_send_alt1_SliderTrackActive = n488 as Theme
const n489 = t([
  [12, 127],
  [13, 127],
  [14, 127],
  [15, 127],
  [16, 128],
  [17, 11],
  [18, 128],
  [19, 0],
  [20, 120],
  [21, 0],
  [22, 119],
  [23, 125],
  [24, 124],
  [25, 125],
  [26, 125],
  [27, 121],
]) as Theme

export const light_send_alt1_SliderThumb = n489 as Theme
export const light_send_alt1_Tooltip = n489 as Theme
export const light_send_alt1_ProgressIndicator = n489 as Theme
const n490 = t([
  [12, 120],
  [13, 120],
  [14, 120],
  [15, 120],
  [16, 119],
  [17, 119],
  [18, 120],
  [19, 127],
  [20, 128],
  [21, 127],
  [22, 11],
  [23, 119],
  [24, 124],
  [25, 119],
  [26, 119],
  [27, 126],
]) as Theme

export const light_send_alt1_Input = n490 as Theme
export const light_send_alt1_TextArea = n490 as Theme
const n491 = t([
  [12, 0],
  [13, 0],
  [14, 0],
  [15, 0],
  [16, 120],
  [17, 119],
  [18, 0],
  [19, 126],
  [20, 127],
  [21, 126],
  [22, 11],
  [23, 121],
  [24, 119],
  [25, 121],
  [26, 121],
  [27, 125],
]) as Theme

export const light_send_alt2_ListItem = n491 as Theme
const n492 = t([
  [12, 121],
  [13, 121],
  [14, 121],
  [15, 121],
  [16, 122],
  [17, 0],
  [18, 0],
  [19, 126],
  [20, 127],
  [21, 126],
  [22, 127],
  [23, 124],
  [24, 125],
  [25, 124],
  [26, 124],
  [27, 119],
]) as Theme

export const light_send_alt2_Card = n492 as Theme
export const light_send_alt2_DrawerFrame = n492 as Theme
export const light_send_alt2_Progress = n492 as Theme
export const light_send_alt2_TooltipArrow = n492 as Theme
const n493 = t([
  [12, 119],
  [13, 119],
  [14, 119],
  [15, 119],
  [16, 122],
  [17, 120],
  [18, 0],
  [19, 124],
  [20, 126],
  [21, 124],
  [22, 128],
  [23, 272],
  [24, 272],
  [25, 124],
  [26, 125],
  [27, 121],
]) as Theme

export const light_send_alt2_Button = n493 as Theme
const n494 = t([
  [12, 119],
  [13, 119],
  [14, 119],
  [15, 119],
  [16, 121],
  [17, 122],
  [18, 0],
  [19, 126],
  [20, 127],
  [21, 126],
  [22, 126],
  [23, 125],
  [24, 126],
  [25, 125],
  [26, 125],
  [27, 121],
]) as Theme

export const light_send_alt2_Checkbox = n494 as Theme
export const light_send_alt2_Switch = n494 as Theme
export const light_send_alt2_TooltipContent = n494 as Theme
export const light_send_alt2_SliderTrack = n494 as Theme
const n495 = t([
  [12, 128],
  [13, 128],
  [14, 128],
  [15, 128],
  [16, 11],
  [17, 11],
  [18, 127],
  [19, 122],
  [20, 0],
  [21, 122],
  [22, 119],
  [23, 126],
  [24, 125],
  [25, 126],
  [26, 126],
  [27, 122],
]) as Theme

export const light_send_alt2_SwitchThumb = n495 as Theme
const n496 = t([
  [12, 124],
  [13, 124],
  [14, 124],
  [15, 124],
  [16, 125],
  [17, 126],
  [18, 127],
  [19, 122],
  [20, 0],
  [21, 122],
  [22, 122],
  [23, 121],
  [24, 122],
  [25, 121],
  [26, 121],
  [27, 125],
]) as Theme

export const light_send_alt2_SliderTrackActive = n496 as Theme
const n497 = t([
  [12, 126],
  [13, 126],
  [14, 126],
  [15, 126],
  [16, 127],
  [17, 128],
  [18, 127],
  [19, 122],
  [20, 0],
  [21, 122],
  [22, 120],
  [23, 124],
  [24, 119],
  [25, 124],
  [26, 124],
  [27, 119],
]) as Theme

export const light_send_alt2_SliderThumb = n497 as Theme
export const light_send_alt2_Tooltip = n497 as Theme
export const light_send_alt2_ProgressIndicator = n497 as Theme
const n498 = t([
  [12, 0],
  [13, 0],
  [14, 0],
  [15, 0],
  [16, 120],
  [17, 119],
  [18, 0],
  [19, 126],
  [20, 127],
  [21, 126],
  [22, 11],
  [23, 124],
  [24, 125],
  [25, 124],
  [26, 124],
  [27, 125],
]) as Theme

export const light_send_alt2_Input = n498 as Theme
export const light_send_alt2_TextArea = n498 as Theme
const n499 = t([
  [12, 122],
  [13, 122],
  [14, 122],
  [15, 122],
  [16, 0],
  [17, 120],
  [19, 125],
  [20, 126],
  [21, 125],
  [22, 128],
  [23, 119],
  [24, 124],
  [25, 119],
  [26, 119],
  [27, 124],
]) as Theme

export const light_send_active_ListItem = n499 as Theme
const n500 = t([
  [12, 119],
  [13, 119],
  [14, 119],
  [15, 119],
  [16, 121],
  [17, 122],
  [19, 125],
  [20, 126],
  [21, 125],
  [22, 126],
  [23, 125],
  [24, 126],
  [25, 125],
  [26, 125],
  [27, 121],
]) as Theme

export const light_send_active_Card = n500 as Theme
export const light_send_active_DrawerFrame = n500 as Theme
export const light_send_active_Progress = n500 as Theme
export const light_send_active_TooltipArrow = n500 as Theme
const n501 = t([
  [12, 124],
  [13, 124],
  [14, 124],
  [15, 124],
  [16, 121],
  [17, 0],
  [19, 119],
  [20, 125],
  [21, 119],
  [22, 127],
  [23, 272],
  [24, 272],
  [25, 125],
  [26, 126],
  [27, 122],
]) as Theme

export const light_send_active_Button = n501 as Theme
const n502 = t([
  [12, 124],
  [13, 124],
  [14, 124],
  [15, 124],
  [16, 119],
  [17, 121],
  [19, 125],
  [20, 126],
  [21, 125],
  [22, 125],
  [23, 126],
  [24, 127],
  [25, 126],
  [26, 126],
  [27, 122],
]) as Theme

export const light_send_active_Checkbox = n502 as Theme
export const light_send_active_Switch = n502 as Theme
export const light_send_active_TooltipContent = n502 as Theme
export const light_send_active_SliderTrack = n502 as Theme
const n503 = t([
  [12, 127],
  [13, 127],
  [14, 127],
  [15, 127],
  [16, 128],
  [17, 11],
  [19, 121],
  [20, 122],
  [21, 121],
  [22, 119],
  [23, 125],
  [24, 124],
  [25, 125],
  [26, 125],
  [27, 121],
]) as Theme

export const light_send_active_SwitchThumb = n503 as Theme
const n504 = t([
  [12, 119],
  [13, 119],
  [14, 119],
  [15, 119],
  [16, 124],
  [17, 125],
  [19, 121],
  [20, 122],
  [21, 121],
  [22, 121],
  [23, 122],
  [24, 0],
  [25, 122],
  [26, 122],
  [27, 126],
]) as Theme

export const light_send_active_SliderTrackActive = n504 as Theme
const n505 = t([
  [12, 125],
  [13, 125],
  [14, 125],
  [15, 125],
  [16, 126],
  [17, 127],
  [19, 121],
  [20, 122],
  [21, 121],
  [22, 0],
  [23, 119],
  [24, 121],
  [25, 119],
  [26, 119],
  [27, 124],
]) as Theme

export const light_send_active_SliderThumb = n505 as Theme
export const light_send_active_Tooltip = n505 as Theme
export const light_send_active_ProgressIndicator = n505 as Theme
const n506 = t([
  [12, 122],
  [13, 122],
  [14, 122],
  [15, 122],
  [16, 0],
  [17, 120],
  [19, 125],
  [20, 126],
  [21, 125],
  [22, 128],
  [23, 125],
  [24, 126],
  [25, 125],
  [26, 125],
  [27, 124],
]) as Theme

export const light_send_active_Input = n506 as Theme
export const light_send_active_TextArea = n506 as Theme
const n507 = t([
  [12, 177],
  [13, 177],
  [14, 177],
  [15, 177],
  [16, 176],
  [17, 175],
  [18, 176],
  [19, 184],
  [20, 185],
  [21, 184],
  [22, 141],
  [23, 176],
  [24, 182],
  [25, 177],
  [26, 177],
  [27, 55],
]) as Theme

export const dark_orange_alt1_ListItem = n507 as Theme
const n508 = t([
  [12, 178],
  [13, 178],
  [14, 178],
  [15, 178],
  [16, 177],
  [17, 176],
  [18, 176],
  [19, 184],
  [20, 185],
  [21, 184],
  [22, 185],
  [23, 177],
  [24, 55],
  [25, 178],
  [26, 178],
  [27, 182],
]) as Theme

export const dark_orange_alt1_Card = n508 as Theme
export const dark_orange_alt1_DrawerFrame = n508 as Theme
export const dark_orange_alt1_Progress = n508 as Theme
export const dark_orange_alt1_TooltipArrow = n508 as Theme
const n509 = t([
  [12, 179],
  [13, 179],
  [14, 179],
  [15, 179],
  [16, 177],
  [17, 175],
  [18, 176],
  [19, 55],
  [20, 184],
  [21, 55],
  [22, 141],
  [23, 272],
  [24, 272],
  [25, 178],
  [26, 179],
  [27, 180],
]) as Theme

export const dark_orange_alt1_Button = n509 as Theme
const n510 = t([
  [12, 179],
  [13, 179],
  [14, 179],
  [15, 179],
  [16, 178],
  [17, 177],
  [18, 176],
  [19, 184],
  [20, 185],
  [21, 184],
  [22, 184],
  [23, 178],
  [24, 183],
  [25, 179],
  [26, 179],
  [27, 180],
]) as Theme

export const dark_orange_alt1_Checkbox = n510 as Theme
export const dark_orange_alt1_Switch = n510 as Theme
export const dark_orange_alt1_TooltipContent = n510 as Theme
export const dark_orange_alt1_SliderTrack = n510 as Theme
const n511 = t([
  [12, 141],
  [13, 141],
  [14, 141],
  [15, 141],
  [16, 141],
  [17, 141],
  [18, 185],
  [19, 177],
  [20, 176],
  [21, 177],
  [22, 175],
  [23, 141],
  [24, 55],
  [25, 141],
  [26, 141],
  [27, 177],
]) as Theme

export const dark_orange_alt1_SwitchThumb = n511 as Theme
const n512 = t([
  [12, 55],
  [13, 55],
  [14, 55],
  [15, 55],
  [16, 183],
  [17, 184],
  [18, 185],
  [19, 177],
  [20, 176],
  [21, 177],
  [22, 177],
  [23, 183],
  [24, 178],
  [25, 55],
  [26, 55],
  [27, 182],
]) as Theme

export const dark_orange_alt1_SliderTrackActive = n512 as Theme
const n513 = t([
  [12, 184],
  [13, 184],
  [14, 184],
  [15, 184],
  [16, 185],
  [17, 141],
  [18, 185],
  [19, 177],
  [20, 176],
  [21, 177],
  [22, 175],
  [23, 185],
  [24, 180],
  [25, 184],
  [26, 184],
  [27, 179],
]) as Theme

export const dark_orange_alt1_SliderThumb = n513 as Theme
export const dark_orange_alt1_Tooltip = n513 as Theme
export const dark_orange_alt1_ProgressIndicator = n513 as Theme
const n514 = t([
  [12, 177],
  [13, 177],
  [14, 177],
  [15, 177],
  [16, 176],
  [17, 175],
  [18, 176],
  [19, 184],
  [20, 185],
  [21, 184],
  [22, 141],
  [23, 177],
  [24, 55],
  [25, 178],
  [26, 178],
  [27, 55],
]) as Theme

export const dark_orange_alt1_Input = n514 as Theme
export const dark_orange_alt1_TextArea = n514 as Theme
const n515 = t([
  [12, 178],
  [13, 178],
  [14, 178],
  [15, 178],
  [16, 177],
  [17, 176],
  [18, 177],
  [19, 183],
  [20, 184],
  [21, 183],
  [22, 185],
  [23, 177],
  [24, 55],
  [25, 178],
  [26, 178],
  [27, 182],
]) as Theme

export const dark_orange_alt2_ListItem = n515 as Theme
const n516 = t([
  [12, 179],
  [13, 179],
  [14, 179],
  [15, 179],
  [16, 178],
  [17, 177],
  [18, 177],
  [19, 183],
  [20, 184],
  [21, 183],
  [22, 184],
  [23, 178],
  [24, 183],
  [25, 179],
  [26, 179],
  [27, 180],
]) as Theme

export const dark_orange_alt2_Card = n516 as Theme
export const dark_orange_alt2_DrawerFrame = n516 as Theme
export const dark_orange_alt2_Progress = n516 as Theme
export const dark_orange_alt2_TooltipArrow = n516 as Theme
const n517 = t([
  [12, 180],
  [13, 180],
  [14, 180],
  [15, 180],
  [16, 178],
  [17, 176],
  [18, 177],
  [19, 182],
  [20, 183],
  [21, 182],
  [22, 185],
  [23, 272],
  [24, 272],
  [25, 179],
  [26, 180],
  [27, 179],
]) as Theme

export const dark_orange_alt2_Button = n517 as Theme
const n518 = t([
  [12, 180],
  [13, 180],
  [14, 180],
  [15, 180],
  [16, 179],
  [17, 178],
  [18, 177],
  [19, 183],
  [20, 184],
  [21, 183],
  [22, 183],
  [23, 179],
  [24, 184],
  [25, 180],
  [26, 180],
  [27, 179],
]) as Theme

export const dark_orange_alt2_Checkbox = n518 as Theme
export const dark_orange_alt2_Switch = n518 as Theme
export const dark_orange_alt2_TooltipContent = n518 as Theme
export const dark_orange_alt2_SliderTrack = n518 as Theme
const n519 = t([
  [12, 185],
  [13, 185],
  [14, 185],
  [15, 185],
  [16, 141],
  [17, 141],
  [18, 184],
  [19, 178],
  [20, 177],
  [21, 178],
  [22, 175],
  [23, 141],
  [24, 182],
  [25, 185],
  [26, 185],
  [27, 178],
]) as Theme

export const dark_orange_alt2_SwitchThumb = n519 as Theme
const n520 = t([
  [12, 182],
  [13, 182],
  [14, 182],
  [15, 182],
  [16, 55],
  [17, 183],
  [18, 184],
  [19, 178],
  [20, 177],
  [21, 178],
  [22, 178],
  [23, 55],
  [24, 177],
  [25, 182],
  [26, 182],
  [27, 55],
]) as Theme

export const dark_orange_alt2_SliderTrackActive = n520 as Theme
const n521 = t([
  [12, 183],
  [13, 183],
  [14, 183],
  [15, 183],
  [16, 184],
  [17, 185],
  [18, 184],
  [19, 178],
  [20, 177],
  [21, 178],
  [22, 176],
  [23, 184],
  [24, 179],
  [25, 183],
  [26, 183],
  [27, 180],
]) as Theme

export const dark_orange_alt2_SliderThumb = n521 as Theme
export const dark_orange_alt2_Tooltip = n521 as Theme
export const dark_orange_alt2_ProgressIndicator = n521 as Theme
const n522 = t([
  [12, 178],
  [13, 178],
  [14, 178],
  [15, 178],
  [16, 177],
  [17, 176],
  [18, 177],
  [19, 183],
  [20, 184],
  [21, 183],
  [22, 185],
  [23, 178],
  [24, 183],
  [25, 179],
  [26, 179],
  [27, 182],
]) as Theme

export const dark_orange_alt2_Input = n522 as Theme
export const dark_orange_alt2_TextArea = n522 as Theme
const n523 = t([
  [12, 179],
  [13, 179],
  [14, 179],
  [15, 179],
  [16, 178],
  [17, 177],
  [19, 55],
  [20, 183],
  [21, 55],
  [22, 184],
  [23, 178],
  [24, 183],
  [25, 179],
  [26, 179],
  [27, 180],
]) as Theme

export const dark_orange_active_ListItem = n523 as Theme
const n524 = t([
  [12, 180],
  [13, 180],
  [14, 180],
  [15, 180],
  [16, 179],
  [17, 178],
  [19, 55],
  [20, 183],
  [21, 55],
  [22, 183],
  [23, 179],
  [24, 184],
  [25, 180],
  [26, 180],
  [27, 179],
]) as Theme

export const dark_orange_active_Card = n524 as Theme
export const dark_orange_active_DrawerFrame = n524 as Theme
export const dark_orange_active_Progress = n524 as Theme
export const dark_orange_active_TooltipArrow = n524 as Theme
const n525 = t([
  [12, 182],
  [13, 182],
  [14, 182],
  [15, 182],
  [16, 179],
  [17, 177],
  [19, 180],
  [20, 55],
  [21, 180],
  [22, 184],
  [23, 272],
  [24, 272],
  [25, 180],
  [26, 182],
  [27, 178],
]) as Theme

export const dark_orange_active_Button = n525 as Theme
const n526 = t([
  [12, 182],
  [13, 182],
  [14, 182],
  [15, 182],
  [16, 180],
  [17, 179],
  [19, 55],
  [20, 183],
  [21, 55],
  [22, 55],
  [23, 180],
  [24, 185],
  [25, 182],
  [26, 182],
  [27, 178],
]) as Theme

export const dark_orange_active_Checkbox = n526 as Theme
export const dark_orange_active_Switch = n526 as Theme
export const dark_orange_active_TooltipContent = n526 as Theme
export const dark_orange_active_SliderTrack = n526 as Theme
const n527 = t([
  [12, 184],
  [13, 184],
  [14, 184],
  [15, 184],
  [16, 185],
  [17, 141],
  [19, 179],
  [20, 178],
  [21, 179],
  [22, 175],
  [23, 185],
  [24, 180],
  [25, 184],
  [26, 184],
  [27, 179],
]) as Theme

export const dark_orange_active_SwitchThumb = n527 as Theme
const n528 = t([
  [12, 180],
  [13, 180],
  [14, 180],
  [15, 180],
  [16, 182],
  [17, 55],
  [19, 179],
  [20, 178],
  [21, 179],
  [22, 179],
  [23, 182],
  [24, 176],
  [25, 180],
  [26, 180],
  [27, 183],
]) as Theme

export const dark_orange_active_SliderTrackActive = n528 as Theme
const n529 = t([
  [12, 55],
  [13, 55],
  [14, 55],
  [15, 55],
  [16, 183],
  [17, 184],
  [19, 179],
  [20, 178],
  [21, 179],
  [22, 177],
  [23, 183],
  [24, 178],
  [25, 55],
  [26, 55],
  [27, 182],
]) as Theme

export const dark_orange_active_SliderThumb = n529 as Theme
export const dark_orange_active_Tooltip = n529 as Theme
export const dark_orange_active_ProgressIndicator = n529 as Theme
const n530 = t([
  [12, 179],
  [13, 179],
  [14, 179],
  [15, 179],
  [16, 178],
  [17, 177],
  [19, 55],
  [20, 183],
  [21, 55],
  [22, 184],
  [23, 179],
  [24, 184],
  [25, 180],
  [26, 180],
  [27, 180],
]) as Theme

export const dark_orange_active_Input = n530 as Theme
export const dark_orange_active_TextArea = n530 as Theme
const n531 = t([
  [12, 218],
  [13, 218],
  [14, 218],
  [15, 218],
  [16, 217],
  [17, 216],
  [18, 217],
  [19, 225],
  [20, 226],
  [21, 225],
  [22, 141],
  [23, 217],
  [24, 223],
  [25, 218],
  [26, 218],
  [27, 103],
]) as Theme

export const dark_yellow_alt1_ListItem = n531 as Theme
const n532 = t([
  [12, 219],
  [13, 219],
  [14, 219],
  [15, 219],
  [16, 218],
  [17, 217],
  [18, 217],
  [19, 225],
  [20, 226],
  [21, 225],
  [22, 226],
  [23, 218],
  [24, 103],
  [25, 219],
  [26, 219],
  [27, 223],
]) as Theme

export const dark_yellow_alt1_Card = n532 as Theme
export const dark_yellow_alt1_DrawerFrame = n532 as Theme
export const dark_yellow_alt1_Progress = n532 as Theme
export const dark_yellow_alt1_TooltipArrow = n532 as Theme
const n533 = t([
  [12, 220],
  [13, 220],
  [14, 220],
  [15, 220],
  [16, 218],
  [17, 216],
  [18, 217],
  [19, 103],
  [20, 225],
  [21, 103],
  [22, 141],
  [23, 272],
  [24, 272],
  [25, 219],
  [26, 220],
  [27, 221],
]) as Theme

export const dark_yellow_alt1_Button = n533 as Theme
const n534 = t([
  [12, 220],
  [13, 220],
  [14, 220],
  [15, 220],
  [16, 219],
  [17, 218],
  [18, 217],
  [19, 225],
  [20, 226],
  [21, 225],
  [22, 225],
  [23, 219],
  [24, 224],
  [25, 220],
  [26, 220],
  [27, 221],
]) as Theme

export const dark_yellow_alt1_Checkbox = n534 as Theme
export const dark_yellow_alt1_Switch = n534 as Theme
export const dark_yellow_alt1_TooltipContent = n534 as Theme
export const dark_yellow_alt1_SliderTrack = n534 as Theme
const n535 = t([
  [12, 141],
  [13, 141],
  [14, 141],
  [15, 141],
  [16, 141],
  [17, 141],
  [18, 226],
  [19, 218],
  [20, 217],
  [21, 218],
  [22, 216],
  [23, 141],
  [24, 103],
  [25, 141],
  [26, 141],
  [27, 218],
]) as Theme

export const dark_yellow_alt1_SwitchThumb = n535 as Theme
const n536 = t([
  [12, 103],
  [13, 103],
  [14, 103],
  [15, 103],
  [16, 224],
  [17, 225],
  [18, 226],
  [19, 218],
  [20, 217],
  [21, 218],
  [22, 218],
  [23, 224],
  [24, 219],
  [25, 103],
  [26, 103],
  [27, 223],
]) as Theme

export const dark_yellow_alt1_SliderTrackActive = n536 as Theme
const n537 = t([
  [12, 225],
  [13, 225],
  [14, 225],
  [15, 225],
  [16, 226],
  [17, 141],
  [18, 226],
  [19, 218],
  [20, 217],
  [21, 218],
  [22, 216],
  [23, 226],
  [24, 221],
  [25, 225],
  [26, 225],
  [27, 220],
]) as Theme

export const dark_yellow_alt1_SliderThumb = n537 as Theme
export const dark_yellow_alt1_Tooltip = n537 as Theme
export const dark_yellow_alt1_ProgressIndicator = n537 as Theme
const n538 = t([
  [12, 218],
  [13, 218],
  [14, 218],
  [15, 218],
  [16, 217],
  [17, 216],
  [18, 217],
  [19, 225],
  [20, 226],
  [21, 225],
  [22, 141],
  [23, 218],
  [24, 103],
  [25, 219],
  [26, 219],
  [27, 103],
]) as Theme

export const dark_yellow_alt1_Input = n538 as Theme
export const dark_yellow_alt1_TextArea = n538 as Theme
const n539 = t([
  [12, 219],
  [13, 219],
  [14, 219],
  [15, 219],
  [16, 218],
  [17, 217],
  [18, 218],
  [19, 224],
  [20, 225],
  [21, 224],
  [22, 226],
  [23, 218],
  [24, 103],
  [25, 219],
  [26, 219],
  [27, 223],
]) as Theme

export const dark_yellow_alt2_ListItem = n539 as Theme
const n540 = t([
  [12, 220],
  [13, 220],
  [14, 220],
  [15, 220],
  [16, 219],
  [17, 218],
  [18, 218],
  [19, 224],
  [20, 225],
  [21, 224],
  [22, 225],
  [23, 219],
  [24, 224],
  [25, 220],
  [26, 220],
  [27, 221],
]) as Theme

export const dark_yellow_alt2_Card = n540 as Theme
export const dark_yellow_alt2_DrawerFrame = n540 as Theme
export const dark_yellow_alt2_Progress = n540 as Theme
export const dark_yellow_alt2_TooltipArrow = n540 as Theme
const n541 = t([
  [12, 221],
  [13, 221],
  [14, 221],
  [15, 221],
  [16, 219],
  [17, 217],
  [18, 218],
  [19, 223],
  [20, 224],
  [21, 223],
  [22, 226],
  [23, 272],
  [24, 272],
  [25, 220],
  [26, 221],
  [27, 220],
]) as Theme

export const dark_yellow_alt2_Button = n541 as Theme
const n542 = t([
  [12, 221],
  [13, 221],
  [14, 221],
  [15, 221],
  [16, 220],
  [17, 219],
  [18, 218],
  [19, 224],
  [20, 225],
  [21, 224],
  [22, 224],
  [23, 220],
  [24, 225],
  [25, 221],
  [26, 221],
  [27, 220],
]) as Theme

export const dark_yellow_alt2_Checkbox = n542 as Theme
export const dark_yellow_alt2_Switch = n542 as Theme
export const dark_yellow_alt2_TooltipContent = n542 as Theme
export const dark_yellow_alt2_SliderTrack = n542 as Theme
const n543 = t([
  [12, 226],
  [13, 226],
  [14, 226],
  [15, 226],
  [16, 141],
  [17, 141],
  [18, 225],
  [19, 219],
  [20, 218],
  [21, 219],
  [22, 216],
  [23, 141],
  [24, 223],
  [25, 226],
  [26, 226],
  [27, 219],
]) as Theme

export const dark_yellow_alt2_SwitchThumb = n543 as Theme
const n544 = t([
  [12, 223],
  [13, 223],
  [14, 223],
  [15, 223],
  [16, 103],
  [17, 224],
  [18, 225],
  [19, 219],
  [20, 218],
  [21, 219],
  [22, 219],
  [23, 103],
  [24, 218],
  [25, 223],
  [26, 223],
  [27, 103],
]) as Theme

export const dark_yellow_alt2_SliderTrackActive = n544 as Theme
const n545 = t([
  [12, 224],
  [13, 224],
  [14, 224],
  [15, 224],
  [16, 225],
  [17, 226],
  [18, 225],
  [19, 219],
  [20, 218],
  [21, 219],
  [22, 217],
  [23, 225],
  [24, 220],
  [25, 224],
  [26, 224],
  [27, 221],
]) as Theme

export const dark_yellow_alt2_SliderThumb = n545 as Theme
export const dark_yellow_alt2_Tooltip = n545 as Theme
export const dark_yellow_alt2_ProgressIndicator = n545 as Theme
const n546 = t([
  [12, 219],
  [13, 219],
  [14, 219],
  [15, 219],
  [16, 218],
  [17, 217],
  [18, 218],
  [19, 224],
  [20, 225],
  [21, 224],
  [22, 226],
  [23, 219],
  [24, 224],
  [25, 220],
  [26, 220],
  [27, 223],
]) as Theme

export const dark_yellow_alt2_Input = n546 as Theme
export const dark_yellow_alt2_TextArea = n546 as Theme
const n547 = t([
  [12, 220],
  [13, 220],
  [14, 220],
  [15, 220],
  [16, 219],
  [17, 218],
  [19, 103],
  [20, 224],
  [21, 103],
  [22, 225],
  [23, 219],
  [24, 224],
  [25, 220],
  [26, 220],
  [27, 221],
]) as Theme

export const dark_yellow_active_ListItem = n547 as Theme
const n548 = t([
  [12, 221],
  [13, 221],
  [14, 221],
  [15, 221],
  [16, 220],
  [17, 219],
  [19, 103],
  [20, 224],
  [21, 103],
  [22, 224],
  [23, 220],
  [24, 225],
  [25, 221],
  [26, 221],
  [27, 220],
]) as Theme

export const dark_yellow_active_Card = n548 as Theme
export const dark_yellow_active_DrawerFrame = n548 as Theme
export const dark_yellow_active_Progress = n548 as Theme
export const dark_yellow_active_TooltipArrow = n548 as Theme
const n549 = t([
  [12, 223],
  [13, 223],
  [14, 223],
  [15, 223],
  [16, 220],
  [17, 218],
  [19, 221],
  [20, 103],
  [21, 221],
  [22, 225],
  [23, 272],
  [24, 272],
  [25, 221],
  [26, 223],
  [27, 219],
]) as Theme

export const dark_yellow_active_Button = n549 as Theme
const n550 = t([
  [12, 223],
  [13, 223],
  [14, 223],
  [15, 223],
  [16, 221],
  [17, 220],
  [19, 103],
  [20, 224],
  [21, 103],
  [22, 103],
  [23, 221],
  [24, 226],
  [25, 223],
  [26, 223],
  [27, 219],
]) as Theme

export const dark_yellow_active_Checkbox = n550 as Theme
export const dark_yellow_active_Switch = n550 as Theme
export const dark_yellow_active_TooltipContent = n550 as Theme
export const dark_yellow_active_SliderTrack = n550 as Theme
const n551 = t([
  [12, 225],
  [13, 225],
  [14, 225],
  [15, 225],
  [16, 226],
  [17, 141],
  [19, 220],
  [20, 219],
  [21, 220],
  [22, 216],
  [23, 226],
  [24, 221],
  [25, 225],
  [26, 225],
  [27, 220],
]) as Theme

export const dark_yellow_active_SwitchThumb = n551 as Theme
const n552 = t([
  [12, 221],
  [13, 221],
  [14, 221],
  [15, 221],
  [16, 223],
  [17, 103],
  [19, 220],
  [20, 219],
  [21, 220],
  [22, 220],
  [23, 223],
  [24, 217],
  [25, 221],
  [26, 221],
  [27, 224],
]) as Theme

export const dark_yellow_active_SliderTrackActive = n552 as Theme
const n553 = t([
  [12, 103],
  [13, 103],
  [14, 103],
  [15, 103],
  [16, 224],
  [17, 225],
  [19, 220],
  [20, 219],
  [21, 220],
  [22, 218],
  [23, 224],
  [24, 219],
  [25, 103],
  [26, 103],
  [27, 223],
]) as Theme

export const dark_yellow_active_SliderThumb = n553 as Theme
export const dark_yellow_active_Tooltip = n553 as Theme
export const dark_yellow_active_ProgressIndicator = n553 as Theme
const n554 = t([
  [12, 220],
  [13, 220],
  [14, 220],
  [15, 220],
  [16, 219],
  [17, 218],
  [19, 103],
  [20, 224],
  [21, 103],
  [22, 225],
  [23, 220],
  [24, 225],
  [25, 221],
  [26, 221],
  [27, 221],
]) as Theme

export const dark_yellow_active_Input = n554 as Theme
export const dark_yellow_active_TextArea = n554 as Theme
const n555 = t([
  [12, 166],
  [13, 166],
  [14, 166],
  [15, 166],
  [16, 165],
  [17, 164],
  [18, 165],
  [19, 173],
  [20, 174],
  [21, 173],
  [22, 141],
  [23, 165],
  [24, 171],
  [25, 166],
  [26, 166],
  [27, 43],
]) as Theme

export const dark_green_alt1_ListItem = n555 as Theme
const n556 = t([
  [12, 167],
  [13, 167],
  [14, 167],
  [15, 167],
  [16, 166],
  [17, 165],
  [18, 165],
  [19, 173],
  [20, 174],
  [21, 173],
  [22, 174],
  [23, 166],
  [24, 43],
  [25, 167],
  [26, 167],
  [27, 171],
]) as Theme

export const dark_green_alt1_Card = n556 as Theme
export const dark_green_alt1_DrawerFrame = n556 as Theme
export const dark_green_alt1_Progress = n556 as Theme
export const dark_green_alt1_TooltipArrow = n556 as Theme
const n557 = t([
  [12, 168],
  [13, 168],
  [14, 168],
  [15, 168],
  [16, 166],
  [17, 164],
  [18, 165],
  [19, 43],
  [20, 173],
  [21, 43],
  [22, 141],
  [23, 272],
  [24, 272],
  [25, 167],
  [26, 168],
  [27, 169],
]) as Theme

export const dark_green_alt1_Button = n557 as Theme
const n558 = t([
  [12, 168],
  [13, 168],
  [14, 168],
  [15, 168],
  [16, 167],
  [17, 166],
  [18, 165],
  [19, 173],
  [20, 174],
  [21, 173],
  [22, 173],
  [23, 167],
  [24, 172],
  [25, 168],
  [26, 168],
  [27, 169],
]) as Theme

export const dark_green_alt1_Checkbox = n558 as Theme
export const dark_green_alt1_Switch = n558 as Theme
export const dark_green_alt1_TooltipContent = n558 as Theme
export const dark_green_alt1_SliderTrack = n558 as Theme
const n559 = t([
  [12, 141],
  [13, 141],
  [14, 141],
  [15, 141],
  [16, 141],
  [17, 141],
  [18, 174],
  [19, 166],
  [20, 165],
  [21, 166],
  [22, 164],
  [23, 141],
  [24, 43],
  [25, 141],
  [26, 141],
  [27, 166],
]) as Theme

export const dark_green_alt1_SwitchThumb = n559 as Theme
const n560 = t([
  [12, 43],
  [13, 43],
  [14, 43],
  [15, 43],
  [16, 172],
  [17, 173],
  [18, 174],
  [19, 166],
  [20, 165],
  [21, 166],
  [22, 166],
  [23, 172],
  [24, 167],
  [25, 43],
  [26, 43],
  [27, 171],
]) as Theme

export const dark_green_alt1_SliderTrackActive = n560 as Theme
const n561 = t([
  [12, 173],
  [13, 173],
  [14, 173],
  [15, 173],
  [16, 174],
  [17, 141],
  [18, 174],
  [19, 166],
  [20, 165],
  [21, 166],
  [22, 164],
  [23, 174],
  [24, 169],
  [25, 173],
  [26, 173],
  [27, 168],
]) as Theme

export const dark_green_alt1_SliderThumb = n561 as Theme
export const dark_green_alt1_Tooltip = n561 as Theme
export const dark_green_alt1_ProgressIndicator = n561 as Theme
const n562 = t([
  [12, 166],
  [13, 166],
  [14, 166],
  [15, 166],
  [16, 165],
  [17, 164],
  [18, 165],
  [19, 173],
  [20, 174],
  [21, 173],
  [22, 141],
  [23, 166],
  [24, 43],
  [25, 167],
  [26, 167],
  [27, 43],
]) as Theme

export const dark_green_alt1_Input = n562 as Theme
export const dark_green_alt1_TextArea = n562 as Theme
const n563 = t([
  [12, 167],
  [13, 167],
  [14, 167],
  [15, 167],
  [16, 166],
  [17, 165],
  [18, 166],
  [19, 172],
  [20, 173],
  [21, 172],
  [22, 174],
  [23, 166],
  [24, 43],
  [25, 167],
  [26, 167],
  [27, 171],
]) as Theme

export const dark_green_alt2_ListItem = n563 as Theme
const n564 = t([
  [12, 168],
  [13, 168],
  [14, 168],
  [15, 168],
  [16, 167],
  [17, 166],
  [18, 166],
  [19, 172],
  [20, 173],
  [21, 172],
  [22, 173],
  [23, 167],
  [24, 172],
  [25, 168],
  [26, 168],
  [27, 169],
]) as Theme

export const dark_green_alt2_Card = n564 as Theme
export const dark_green_alt2_DrawerFrame = n564 as Theme
export const dark_green_alt2_Progress = n564 as Theme
export const dark_green_alt2_TooltipArrow = n564 as Theme
const n565 = t([
  [12, 169],
  [13, 169],
  [14, 169],
  [15, 169],
  [16, 167],
  [17, 165],
  [18, 166],
  [19, 171],
  [20, 172],
  [21, 171],
  [22, 174],
  [23, 272],
  [24, 272],
  [25, 168],
  [26, 169],
  [27, 168],
]) as Theme

export const dark_green_alt2_Button = n565 as Theme
const n566 = t([
  [12, 169],
  [13, 169],
  [14, 169],
  [15, 169],
  [16, 168],
  [17, 167],
  [18, 166],
  [19, 172],
  [20, 173],
  [21, 172],
  [22, 172],
  [23, 168],
  [24, 173],
  [25, 169],
  [26, 169],
  [27, 168],
]) as Theme

export const dark_green_alt2_Checkbox = n566 as Theme
export const dark_green_alt2_Switch = n566 as Theme
export const dark_green_alt2_TooltipContent = n566 as Theme
export const dark_green_alt2_SliderTrack = n566 as Theme
const n567 = t([
  [12, 174],
  [13, 174],
  [14, 174],
  [15, 174],
  [16, 141],
  [17, 141],
  [18, 173],
  [19, 167],
  [20, 166],
  [21, 167],
  [22, 164],
  [23, 141],
  [24, 171],
  [25, 174],
  [26, 174],
  [27, 167],
]) as Theme

export const dark_green_alt2_SwitchThumb = n567 as Theme
const n568 = t([
  [12, 171],
  [13, 171],
  [14, 171],
  [15, 171],
  [16, 43],
  [17, 172],
  [18, 173],
  [19, 167],
  [20, 166],
  [21, 167],
  [22, 167],
  [23, 43],
  [24, 166],
  [25, 171],
  [26, 171],
  [27, 43],
]) as Theme

export const dark_green_alt2_SliderTrackActive = n568 as Theme
const n569 = t([
  [12, 172],
  [13, 172],
  [14, 172],
  [15, 172],
  [16, 173],
  [17, 174],
  [18, 173],
  [19, 167],
  [20, 166],
  [21, 167],
  [22, 165],
  [23, 173],
  [24, 168],
  [25, 172],
  [26, 172],
  [27, 169],
]) as Theme

export const dark_green_alt2_SliderThumb = n569 as Theme
export const dark_green_alt2_Tooltip = n569 as Theme
export const dark_green_alt2_ProgressIndicator = n569 as Theme
const n570 = t([
  [12, 167],
  [13, 167],
  [14, 167],
  [15, 167],
  [16, 166],
  [17, 165],
  [18, 166],
  [19, 172],
  [20, 173],
  [21, 172],
  [22, 174],
  [23, 167],
  [24, 172],
  [25, 168],
  [26, 168],
  [27, 171],
]) as Theme

export const dark_green_alt2_Input = n570 as Theme
export const dark_green_alt2_TextArea = n570 as Theme
const n571 = t([
  [12, 168],
  [13, 168],
  [14, 168],
  [15, 168],
  [16, 167],
  [17, 166],
  [19, 43],
  [20, 172],
  [21, 43],
  [22, 173],
  [23, 167],
  [24, 172],
  [25, 168],
  [26, 168],
  [27, 169],
]) as Theme

export const dark_green_active_ListItem = n571 as Theme
const n572 = t([
  [12, 169],
  [13, 169],
  [14, 169],
  [15, 169],
  [16, 168],
  [17, 167],
  [19, 43],
  [20, 172],
  [21, 43],
  [22, 172],
  [23, 168],
  [24, 173],
  [25, 169],
  [26, 169],
  [27, 168],
]) as Theme

export const dark_green_active_Card = n572 as Theme
export const dark_green_active_DrawerFrame = n572 as Theme
export const dark_green_active_Progress = n572 as Theme
export const dark_green_active_TooltipArrow = n572 as Theme
const n573 = t([
  [12, 171],
  [13, 171],
  [14, 171],
  [15, 171],
  [16, 168],
  [17, 166],
  [19, 169],
  [20, 43],
  [21, 169],
  [22, 173],
  [23, 272],
  [24, 272],
  [25, 169],
  [26, 171],
  [27, 167],
]) as Theme

export const dark_green_active_Button = n573 as Theme
const n574 = t([
  [12, 171],
  [13, 171],
  [14, 171],
  [15, 171],
  [16, 169],
  [17, 168],
  [19, 43],
  [20, 172],
  [21, 43],
  [22, 43],
  [23, 169],
  [24, 174],
  [25, 171],
  [26, 171],
  [27, 167],
]) as Theme

export const dark_green_active_Checkbox = n574 as Theme
export const dark_green_active_Switch = n574 as Theme
export const dark_green_active_TooltipContent = n574 as Theme
export const dark_green_active_SliderTrack = n574 as Theme
const n575 = t([
  [12, 173],
  [13, 173],
  [14, 173],
  [15, 173],
  [16, 174],
  [17, 141],
  [19, 168],
  [20, 167],
  [21, 168],
  [22, 164],
  [23, 174],
  [24, 169],
  [25, 173],
  [26, 173],
  [27, 168],
]) as Theme

export const dark_green_active_SwitchThumb = n575 as Theme
const n576 = t([
  [12, 169],
  [13, 169],
  [14, 169],
  [15, 169],
  [16, 171],
  [17, 43],
  [19, 168],
  [20, 167],
  [21, 168],
  [22, 168],
  [23, 171],
  [24, 165],
  [25, 169],
  [26, 169],
  [27, 172],
]) as Theme

export const dark_green_active_SliderTrackActive = n576 as Theme
const n577 = t([
  [12, 43],
  [13, 43],
  [14, 43],
  [15, 43],
  [16, 172],
  [17, 173],
  [19, 168],
  [20, 167],
  [21, 168],
  [22, 166],
  [23, 172],
  [24, 167],
  [25, 43],
  [26, 43],
  [27, 171],
]) as Theme

export const dark_green_active_SliderThumb = n577 as Theme
export const dark_green_active_Tooltip = n577 as Theme
export const dark_green_active_ProgressIndicator = n577 as Theme
const n578 = t([
  [12, 168],
  [13, 168],
  [14, 168],
  [15, 168],
  [16, 167],
  [17, 166],
  [19, 43],
  [20, 172],
  [21, 43],
  [22, 173],
  [23, 168],
  [24, 173],
  [25, 169],
  [26, 169],
  [27, 169],
]) as Theme

export const dark_green_active_Input = n578 as Theme
export const dark_green_active_TextArea = n578 as Theme
const n579 = t([
  [12, 144],
  [13, 144],
  [14, 144],
  [15, 144],
  [16, 143],
  [17, 142],
  [18, 143],
  [19, 151],
  [20, 152],
  [21, 151],
  [22, 141],
  [23, 143],
  [24, 149],
  [25, 144],
  [26, 144],
  [27, 22],
]) as Theme

export const dark_blue_alt1_ListItem = n579 as Theme
const n580 = t([
  [12, 145],
  [13, 145],
  [14, 145],
  [15, 145],
  [16, 144],
  [17, 143],
  [18, 143],
  [19, 151],
  [20, 152],
  [21, 151],
  [22, 152],
  [23, 144],
  [24, 22],
  [25, 145],
  [26, 145],
  [27, 149],
]) as Theme

export const dark_blue_alt1_Card = n580 as Theme
export const dark_blue_alt1_DrawerFrame = n580 as Theme
export const dark_blue_alt1_Progress = n580 as Theme
export const dark_blue_alt1_TooltipArrow = n580 as Theme
const n581 = t([
  [12, 146],
  [13, 146],
  [14, 146],
  [15, 146],
  [16, 144],
  [17, 142],
  [18, 143],
  [19, 22],
  [20, 151],
  [21, 22],
  [22, 141],
  [23, 272],
  [24, 272],
  [25, 145],
  [26, 146],
  [27, 147],
]) as Theme

export const dark_blue_alt1_Button = n581 as Theme
const n582 = t([
  [12, 146],
  [13, 146],
  [14, 146],
  [15, 146],
  [16, 145],
  [17, 144],
  [18, 143],
  [19, 151],
  [20, 152],
  [21, 151],
  [22, 151],
  [23, 145],
  [24, 150],
  [25, 146],
  [26, 146],
  [27, 147],
]) as Theme

export const dark_blue_alt1_Checkbox = n582 as Theme
export const dark_blue_alt1_Switch = n582 as Theme
export const dark_blue_alt1_TooltipContent = n582 as Theme
export const dark_blue_alt1_SliderTrack = n582 as Theme
const n583 = t([
  [12, 141],
  [13, 141],
  [14, 141],
  [15, 141],
  [16, 141],
  [17, 141],
  [18, 152],
  [19, 144],
  [20, 143],
  [21, 144],
  [22, 142],
  [23, 141],
  [24, 22],
  [25, 141],
  [26, 141],
  [27, 144],
]) as Theme

export const dark_blue_alt1_SwitchThumb = n583 as Theme
const n584 = t([
  [12, 22],
  [13, 22],
  [14, 22],
  [15, 22],
  [16, 150],
  [17, 151],
  [18, 152],
  [19, 144],
  [20, 143],
  [21, 144],
  [22, 144],
  [23, 150],
  [24, 145],
  [25, 22],
  [26, 22],
  [27, 149],
]) as Theme

export const dark_blue_alt1_SliderTrackActive = n584 as Theme
const n585 = t([
  [12, 151],
  [13, 151],
  [14, 151],
  [15, 151],
  [16, 152],
  [17, 141],
  [18, 152],
  [19, 144],
  [20, 143],
  [21, 144],
  [22, 142],
  [23, 152],
  [24, 147],
  [25, 151],
  [26, 151],
  [27, 146],
]) as Theme

export const dark_blue_alt1_SliderThumb = n585 as Theme
export const dark_blue_alt1_Tooltip = n585 as Theme
export const dark_blue_alt1_ProgressIndicator = n585 as Theme
const n586 = t([
  [12, 144],
  [13, 144],
  [14, 144],
  [15, 144],
  [16, 143],
  [17, 142],
  [18, 143],
  [19, 151],
  [20, 152],
  [21, 151],
  [22, 141],
  [23, 144],
  [24, 22],
  [25, 145],
  [26, 145],
  [27, 22],
]) as Theme

export const dark_blue_alt1_Input = n586 as Theme
export const dark_blue_alt1_TextArea = n586 as Theme
const n587 = t([
  [12, 145],
  [13, 145],
  [14, 145],
  [15, 145],
  [16, 144],
  [17, 143],
  [18, 144],
  [19, 150],
  [20, 151],
  [21, 150],
  [22, 152],
  [23, 144],
  [24, 22],
  [25, 145],
  [26, 145],
  [27, 149],
]) as Theme

export const dark_blue_alt2_ListItem = n587 as Theme
const n588 = t([
  [12, 146],
  [13, 146],
  [14, 146],
  [15, 146],
  [16, 145],
  [17, 144],
  [18, 144],
  [19, 150],
  [20, 151],
  [21, 150],
  [22, 151],
  [23, 145],
  [24, 150],
  [25, 146],
  [26, 146],
  [27, 147],
]) as Theme

export const dark_blue_alt2_Card = n588 as Theme
export const dark_blue_alt2_DrawerFrame = n588 as Theme
export const dark_blue_alt2_Progress = n588 as Theme
export const dark_blue_alt2_TooltipArrow = n588 as Theme
const n589 = t([
  [12, 147],
  [13, 147],
  [14, 147],
  [15, 147],
  [16, 145],
  [17, 143],
  [18, 144],
  [19, 149],
  [20, 150],
  [21, 149],
  [22, 152],
  [23, 272],
  [24, 272],
  [25, 146],
  [26, 147],
  [27, 146],
]) as Theme

export const dark_blue_alt2_Button = n589 as Theme
const n590 = t([
  [12, 147],
  [13, 147],
  [14, 147],
  [15, 147],
  [16, 146],
  [17, 145],
  [18, 144],
  [19, 150],
  [20, 151],
  [21, 150],
  [22, 150],
  [23, 146],
  [24, 151],
  [25, 147],
  [26, 147],
  [27, 146],
]) as Theme

export const dark_blue_alt2_Checkbox = n590 as Theme
export const dark_blue_alt2_Switch = n590 as Theme
export const dark_blue_alt2_TooltipContent = n590 as Theme
export const dark_blue_alt2_SliderTrack = n590 as Theme
const n591 = t([
  [12, 152],
  [13, 152],
  [14, 152],
  [15, 152],
  [16, 141],
  [17, 141],
  [18, 151],
  [19, 145],
  [20, 144],
  [21, 145],
  [22, 142],
  [23, 141],
  [24, 149],
  [25, 152],
  [26, 152],
  [27, 145],
]) as Theme

export const dark_blue_alt2_SwitchThumb = n591 as Theme
const n592 = t([
  [12, 149],
  [13, 149],
  [14, 149],
  [15, 149],
  [16, 22],
  [17, 150],
  [18, 151],
  [19, 145],
  [20, 144],
  [21, 145],
  [22, 145],
  [23, 22],
  [24, 144],
  [25, 149],
  [26, 149],
  [27, 22],
]) as Theme

export const dark_blue_alt2_SliderTrackActive = n592 as Theme
const n593 = t([
  [12, 150],
  [13, 150],
  [14, 150],
  [15, 150],
  [16, 151],
  [17, 152],
  [18, 151],
  [19, 145],
  [20, 144],
  [21, 145],
  [22, 143],
  [23, 151],
  [24, 146],
  [25, 150],
  [26, 150],
  [27, 147],
]) as Theme

export const dark_blue_alt2_SliderThumb = n593 as Theme
export const dark_blue_alt2_Tooltip = n593 as Theme
export const dark_blue_alt2_ProgressIndicator = n593 as Theme
const n594 = t([
  [12, 145],
  [13, 145],
  [14, 145],
  [15, 145],
  [16, 144],
  [17, 143],
  [18, 144],
  [19, 150],
  [20, 151],
  [21, 150],
  [22, 152],
  [23, 145],
  [24, 150],
  [25, 146],
  [26, 146],
  [27, 149],
]) as Theme

export const dark_blue_alt2_Input = n594 as Theme
export const dark_blue_alt2_TextArea = n594 as Theme
const n595 = t([
  [12, 146],
  [13, 146],
  [14, 146],
  [15, 146],
  [16, 145],
  [17, 144],
  [19, 22],
  [20, 150],
  [21, 22],
  [22, 151],
  [23, 145],
  [24, 150],
  [25, 146],
  [26, 146],
  [27, 147],
]) as Theme

export const dark_blue_active_ListItem = n595 as Theme
const n596 = t([
  [12, 147],
  [13, 147],
  [14, 147],
  [15, 147],
  [16, 146],
  [17, 145],
  [19, 22],
  [20, 150],
  [21, 22],
  [22, 150],
  [23, 146],
  [24, 151],
  [25, 147],
  [26, 147],
  [27, 146],
]) as Theme

export const dark_blue_active_Card = n596 as Theme
export const dark_blue_active_DrawerFrame = n596 as Theme
export const dark_blue_active_Progress = n596 as Theme
export const dark_blue_active_TooltipArrow = n596 as Theme
const n597 = t([
  [12, 149],
  [13, 149],
  [14, 149],
  [15, 149],
  [16, 146],
  [17, 144],
  [19, 147],
  [20, 22],
  [21, 147],
  [22, 151],
  [23, 272],
  [24, 272],
  [25, 147],
  [26, 149],
  [27, 145],
]) as Theme

export const dark_blue_active_Button = n597 as Theme
const n598 = t([
  [12, 149],
  [13, 149],
  [14, 149],
  [15, 149],
  [16, 147],
  [17, 146],
  [19, 22],
  [20, 150],
  [21, 22],
  [22, 22],
  [23, 147],
  [24, 152],
  [25, 149],
  [26, 149],
  [27, 145],
]) as Theme

export const dark_blue_active_Checkbox = n598 as Theme
export const dark_blue_active_Switch = n598 as Theme
export const dark_blue_active_TooltipContent = n598 as Theme
export const dark_blue_active_SliderTrack = n598 as Theme
const n599 = t([
  [12, 151],
  [13, 151],
  [14, 151],
  [15, 151],
  [16, 152],
  [17, 141],
  [19, 146],
  [20, 145],
  [21, 146],
  [22, 142],
  [23, 152],
  [24, 147],
  [25, 151],
  [26, 151],
  [27, 146],
]) as Theme

export const dark_blue_active_SwitchThumb = n599 as Theme
const n600 = t([
  [12, 147],
  [13, 147],
  [14, 147],
  [15, 147],
  [16, 149],
  [17, 22],
  [19, 146],
  [20, 145],
  [21, 146],
  [22, 146],
  [23, 149],
  [24, 143],
  [25, 147],
  [26, 147],
  [27, 150],
]) as Theme

export const dark_blue_active_SliderTrackActive = n600 as Theme
const n601 = t([
  [12, 22],
  [13, 22],
  [14, 22],
  [15, 22],
  [16, 150],
  [17, 151],
  [19, 146],
  [20, 145],
  [21, 146],
  [22, 144],
  [23, 150],
  [24, 145],
  [25, 22],
  [26, 22],
  [27, 149],
]) as Theme

export const dark_blue_active_SliderThumb = n601 as Theme
export const dark_blue_active_Tooltip = n601 as Theme
export const dark_blue_active_ProgressIndicator = n601 as Theme
const n602 = t([
  [12, 146],
  [13, 146],
  [14, 146],
  [15, 146],
  [16, 145],
  [17, 144],
  [19, 22],
  [20, 150],
  [21, 22],
  [22, 151],
  [23, 146],
  [24, 151],
  [25, 147],
  [26, 147],
  [27, 147],
]) as Theme

export const dark_blue_active_Input = n602 as Theme
export const dark_blue_active_TextArea = n602 as Theme
const n603 = t([
  [12, 199],
  [13, 199],
  [14, 199],
  [15, 199],
  [16, 198],
  [17, 197],
  [18, 198],
  [19, 206],
  [20, 207],
  [21, 206],
  [22, 141],
  [23, 198],
  [24, 204],
  [25, 199],
  [26, 199],
  [27, 79],
]) as Theme

export const dark_purple_alt1_ListItem = n603 as Theme
const n604 = t([
  [12, 200],
  [13, 200],
  [14, 200],
  [15, 200],
  [16, 199],
  [17, 198],
  [18, 198],
  [19, 206],
  [20, 207],
  [21, 206],
  [22, 207],
  [23, 199],
  [24, 79],
  [25, 200],
  [26, 200],
  [27, 204],
]) as Theme

export const dark_purple_alt1_Card = n604 as Theme
export const dark_purple_alt1_DrawerFrame = n604 as Theme
export const dark_purple_alt1_Progress = n604 as Theme
export const dark_purple_alt1_TooltipArrow = n604 as Theme
const n605 = t([
  [12, 201],
  [13, 201],
  [14, 201],
  [15, 201],
  [16, 199],
  [17, 197],
  [18, 198],
  [19, 79],
  [20, 206],
  [21, 79],
  [22, 141],
  [23, 272],
  [24, 272],
  [25, 200],
  [26, 201],
  [27, 202],
]) as Theme

export const dark_purple_alt1_Button = n605 as Theme
const n606 = t([
  [12, 201],
  [13, 201],
  [14, 201],
  [15, 201],
  [16, 200],
  [17, 199],
  [18, 198],
  [19, 206],
  [20, 207],
  [21, 206],
  [22, 206],
  [23, 200],
  [24, 205],
  [25, 201],
  [26, 201],
  [27, 202],
]) as Theme

export const dark_purple_alt1_Checkbox = n606 as Theme
export const dark_purple_alt1_Switch = n606 as Theme
export const dark_purple_alt1_TooltipContent = n606 as Theme
export const dark_purple_alt1_SliderTrack = n606 as Theme
const n607 = t([
  [12, 141],
  [13, 141],
  [14, 141],
  [15, 141],
  [16, 141],
  [17, 141],
  [18, 207],
  [19, 199],
  [20, 198],
  [21, 199],
  [22, 197],
  [23, 141],
  [24, 79],
  [25, 141],
  [26, 141],
  [27, 199],
]) as Theme

export const dark_purple_alt1_SwitchThumb = n607 as Theme
const n608 = t([
  [12, 79],
  [13, 79],
  [14, 79],
  [15, 79],
  [16, 205],
  [17, 206],
  [18, 207],
  [19, 199],
  [20, 198],
  [21, 199],
  [22, 199],
  [23, 205],
  [24, 200],
  [25, 79],
  [26, 79],
  [27, 204],
]) as Theme

export const dark_purple_alt1_SliderTrackActive = n608 as Theme
const n609 = t([
  [12, 206],
  [13, 206],
  [14, 206],
  [15, 206],
  [16, 207],
  [17, 141],
  [18, 207],
  [19, 199],
  [20, 198],
  [21, 199],
  [22, 197],
  [23, 207],
  [24, 202],
  [25, 206],
  [26, 206],
  [27, 201],
]) as Theme

export const dark_purple_alt1_SliderThumb = n609 as Theme
export const dark_purple_alt1_Tooltip = n609 as Theme
export const dark_purple_alt1_ProgressIndicator = n609 as Theme
const n610 = t([
  [12, 199],
  [13, 199],
  [14, 199],
  [15, 199],
  [16, 198],
  [17, 197],
  [18, 198],
  [19, 206],
  [20, 207],
  [21, 206],
  [22, 141],
  [23, 199],
  [24, 79],
  [25, 200],
  [26, 200],
  [27, 79],
]) as Theme

export const dark_purple_alt1_Input = n610 as Theme
export const dark_purple_alt1_TextArea = n610 as Theme
const n611 = t([
  [12, 200],
  [13, 200],
  [14, 200],
  [15, 200],
  [16, 199],
  [17, 198],
  [18, 199],
  [19, 205],
  [20, 206],
  [21, 205],
  [22, 207],
  [23, 199],
  [24, 79],
  [25, 200],
  [26, 200],
  [27, 204],
]) as Theme

export const dark_purple_alt2_ListItem = n611 as Theme
const n612 = t([
  [12, 201],
  [13, 201],
  [14, 201],
  [15, 201],
  [16, 200],
  [17, 199],
  [18, 199],
  [19, 205],
  [20, 206],
  [21, 205],
  [22, 206],
  [23, 200],
  [24, 205],
  [25, 201],
  [26, 201],
  [27, 202],
]) as Theme

export const dark_purple_alt2_Card = n612 as Theme
export const dark_purple_alt2_DrawerFrame = n612 as Theme
export const dark_purple_alt2_Progress = n612 as Theme
export const dark_purple_alt2_TooltipArrow = n612 as Theme
const n613 = t([
  [12, 202],
  [13, 202],
  [14, 202],
  [15, 202],
  [16, 200],
  [17, 198],
  [18, 199],
  [19, 204],
  [20, 205],
  [21, 204],
  [22, 207],
  [23, 272],
  [24, 272],
  [25, 201],
  [26, 202],
  [27, 201],
]) as Theme

export const dark_purple_alt2_Button = n613 as Theme
const n614 = t([
  [12, 202],
  [13, 202],
  [14, 202],
  [15, 202],
  [16, 201],
  [17, 200],
  [18, 199],
  [19, 205],
  [20, 206],
  [21, 205],
  [22, 205],
  [23, 201],
  [24, 206],
  [25, 202],
  [26, 202],
  [27, 201],
]) as Theme

export const dark_purple_alt2_Checkbox = n614 as Theme
export const dark_purple_alt2_Switch = n614 as Theme
export const dark_purple_alt2_TooltipContent = n614 as Theme
export const dark_purple_alt2_SliderTrack = n614 as Theme
const n615 = t([
  [12, 207],
  [13, 207],
  [14, 207],
  [15, 207],
  [16, 141],
  [17, 141],
  [18, 206],
  [19, 200],
  [20, 199],
  [21, 200],
  [22, 197],
  [23, 141],
  [24, 204],
  [25, 207],
  [26, 207],
  [27, 200],
]) as Theme

export const dark_purple_alt2_SwitchThumb = n615 as Theme
const n616 = t([
  [12, 204],
  [13, 204],
  [14, 204],
  [15, 204],
  [16, 79],
  [17, 205],
  [18, 206],
  [19, 200],
  [20, 199],
  [21, 200],
  [22, 200],
  [23, 79],
  [24, 199],
  [25, 204],
  [26, 204],
  [27, 79],
]) as Theme

export const dark_purple_alt2_SliderTrackActive = n616 as Theme
const n617 = t([
  [12, 205],
  [13, 205],
  [14, 205],
  [15, 205],
  [16, 206],
  [17, 207],
  [18, 206],
  [19, 200],
  [20, 199],
  [21, 200],
  [22, 198],
  [23, 206],
  [24, 201],
  [25, 205],
  [26, 205],
  [27, 202],
]) as Theme

export const dark_purple_alt2_SliderThumb = n617 as Theme
export const dark_purple_alt2_Tooltip = n617 as Theme
export const dark_purple_alt2_ProgressIndicator = n617 as Theme
const n618 = t([
  [12, 200],
  [13, 200],
  [14, 200],
  [15, 200],
  [16, 199],
  [17, 198],
  [18, 199],
  [19, 205],
  [20, 206],
  [21, 205],
  [22, 207],
  [23, 200],
  [24, 205],
  [25, 201],
  [26, 201],
  [27, 204],
]) as Theme

export const dark_purple_alt2_Input = n618 as Theme
export const dark_purple_alt2_TextArea = n618 as Theme
const n619 = t([
  [12, 201],
  [13, 201],
  [14, 201],
  [15, 201],
  [16, 200],
  [17, 199],
  [19, 79],
  [20, 205],
  [21, 79],
  [22, 206],
  [23, 200],
  [24, 205],
  [25, 201],
  [26, 201],
  [27, 202],
]) as Theme

export const dark_purple_active_ListItem = n619 as Theme
const n620 = t([
  [12, 202],
  [13, 202],
  [14, 202],
  [15, 202],
  [16, 201],
  [17, 200],
  [19, 79],
  [20, 205],
  [21, 79],
  [22, 205],
  [23, 201],
  [24, 206],
  [25, 202],
  [26, 202],
  [27, 201],
]) as Theme

export const dark_purple_active_Card = n620 as Theme
export const dark_purple_active_DrawerFrame = n620 as Theme
export const dark_purple_active_Progress = n620 as Theme
export const dark_purple_active_TooltipArrow = n620 as Theme
const n621 = t([
  [12, 204],
  [13, 204],
  [14, 204],
  [15, 204],
  [16, 201],
  [17, 199],
  [19, 202],
  [20, 79],
  [21, 202],
  [22, 206],
  [23, 272],
  [24, 272],
  [25, 202],
  [26, 204],
  [27, 200],
]) as Theme

export const dark_purple_active_Button = n621 as Theme
const n622 = t([
  [12, 204],
  [13, 204],
  [14, 204],
  [15, 204],
  [16, 202],
  [17, 201],
  [19, 79],
  [20, 205],
  [21, 79],
  [22, 79],
  [23, 202],
  [24, 207],
  [25, 204],
  [26, 204],
  [27, 200],
]) as Theme

export const dark_purple_active_Checkbox = n622 as Theme
export const dark_purple_active_Switch = n622 as Theme
export const dark_purple_active_TooltipContent = n622 as Theme
export const dark_purple_active_SliderTrack = n622 as Theme
const n623 = t([
  [12, 206],
  [13, 206],
  [14, 206],
  [15, 206],
  [16, 207],
  [17, 141],
  [19, 201],
  [20, 200],
  [21, 201],
  [22, 197],
  [23, 207],
  [24, 202],
  [25, 206],
  [26, 206],
  [27, 201],
]) as Theme

export const dark_purple_active_SwitchThumb = n623 as Theme
const n624 = t([
  [12, 202],
  [13, 202],
  [14, 202],
  [15, 202],
  [16, 204],
  [17, 79],
  [19, 201],
  [20, 200],
  [21, 201],
  [22, 201],
  [23, 204],
  [24, 198],
  [25, 202],
  [26, 202],
  [27, 205],
]) as Theme

export const dark_purple_active_SliderTrackActive = n624 as Theme
const n625 = t([
  [12, 79],
  [13, 79],
  [14, 79],
  [15, 79],
  [16, 205],
  [17, 206],
  [19, 201],
  [20, 200],
  [21, 201],
  [22, 199],
  [23, 205],
  [24, 200],
  [25, 79],
  [26, 79],
  [27, 204],
]) as Theme

export const dark_purple_active_SliderThumb = n625 as Theme
export const dark_purple_active_Tooltip = n625 as Theme
export const dark_purple_active_ProgressIndicator = n625 as Theme
const n626 = t([
  [12, 201],
  [13, 201],
  [14, 201],
  [15, 201],
  [16, 200],
  [17, 199],
  [19, 79],
  [20, 205],
  [21, 79],
  [22, 206],
  [23, 201],
  [24, 206],
  [25, 202],
  [26, 202],
  [27, 202],
]) as Theme

export const dark_purple_active_Input = n626 as Theme
export const dark_purple_active_TextArea = n626 as Theme
const n627 = t([
  [12, 188],
  [13, 188],
  [14, 188],
  [15, 188],
  [16, 187],
  [17, 186],
  [18, 187],
  [19, 195],
  [20, 196],
  [21, 195],
  [22, 141],
  [23, 187],
  [24, 193],
  [25, 188],
  [26, 188],
  [27, 67],
]) as Theme

export const dark_pink_alt1_ListItem = n627 as Theme
const n628 = t([
  [12, 189],
  [13, 189],
  [14, 189],
  [15, 189],
  [16, 188],
  [17, 187],
  [18, 187],
  [19, 195],
  [20, 196],
  [21, 195],
  [22, 196],
  [23, 188],
  [24, 67],
  [25, 189],
  [26, 189],
  [27, 193],
]) as Theme

export const dark_pink_alt1_Card = n628 as Theme
export const dark_pink_alt1_DrawerFrame = n628 as Theme
export const dark_pink_alt1_Progress = n628 as Theme
export const dark_pink_alt1_TooltipArrow = n628 as Theme
const n629 = t([
  [12, 190],
  [13, 190],
  [14, 190],
  [15, 190],
  [16, 188],
  [17, 186],
  [18, 187],
  [19, 67],
  [20, 195],
  [21, 67],
  [22, 141],
  [23, 272],
  [24, 272],
  [25, 189],
  [26, 190],
  [27, 191],
]) as Theme

export const dark_pink_alt1_Button = n629 as Theme
const n630 = t([
  [12, 190],
  [13, 190],
  [14, 190],
  [15, 190],
  [16, 189],
  [17, 188],
  [18, 187],
  [19, 195],
  [20, 196],
  [21, 195],
  [22, 195],
  [23, 189],
  [24, 194],
  [25, 190],
  [26, 190],
  [27, 191],
]) as Theme

export const dark_pink_alt1_Checkbox = n630 as Theme
export const dark_pink_alt1_Switch = n630 as Theme
export const dark_pink_alt1_TooltipContent = n630 as Theme
export const dark_pink_alt1_SliderTrack = n630 as Theme
const n631 = t([
  [12, 141],
  [13, 141],
  [14, 141],
  [15, 141],
  [16, 141],
  [17, 141],
  [18, 196],
  [19, 188],
  [20, 187],
  [21, 188],
  [22, 186],
  [23, 141],
  [24, 67],
  [25, 141],
  [26, 141],
  [27, 188],
]) as Theme

export const dark_pink_alt1_SwitchThumb = n631 as Theme
const n632 = t([
  [12, 67],
  [13, 67],
  [14, 67],
  [15, 67],
  [16, 194],
  [17, 195],
  [18, 196],
  [19, 188],
  [20, 187],
  [21, 188],
  [22, 188],
  [23, 194],
  [24, 189],
  [25, 67],
  [26, 67],
  [27, 193],
]) as Theme

export const dark_pink_alt1_SliderTrackActive = n632 as Theme
const n633 = t([
  [12, 195],
  [13, 195],
  [14, 195],
  [15, 195],
  [16, 196],
  [17, 141],
  [18, 196],
  [19, 188],
  [20, 187],
  [21, 188],
  [22, 186],
  [23, 196],
  [24, 191],
  [25, 195],
  [26, 195],
  [27, 190],
]) as Theme

export const dark_pink_alt1_SliderThumb = n633 as Theme
export const dark_pink_alt1_Tooltip = n633 as Theme
export const dark_pink_alt1_ProgressIndicator = n633 as Theme
const n634 = t([
  [12, 188],
  [13, 188],
  [14, 188],
  [15, 188],
  [16, 187],
  [17, 186],
  [18, 187],
  [19, 195],
  [20, 196],
  [21, 195],
  [22, 141],
  [23, 188],
  [24, 67],
  [25, 189],
  [26, 189],
  [27, 67],
]) as Theme

export const dark_pink_alt1_Input = n634 as Theme
export const dark_pink_alt1_TextArea = n634 as Theme
const n635 = t([
  [12, 189],
  [13, 189],
  [14, 189],
  [15, 189],
  [16, 188],
  [17, 187],
  [18, 188],
  [19, 194],
  [20, 195],
  [21, 194],
  [22, 196],
  [23, 188],
  [24, 67],
  [25, 189],
  [26, 189],
  [27, 193],
]) as Theme

export const dark_pink_alt2_ListItem = n635 as Theme
const n636 = t([
  [12, 190],
  [13, 190],
  [14, 190],
  [15, 190],
  [16, 189],
  [17, 188],
  [18, 188],
  [19, 194],
  [20, 195],
  [21, 194],
  [22, 195],
  [23, 189],
  [24, 194],
  [25, 190],
  [26, 190],
  [27, 191],
]) as Theme

export const dark_pink_alt2_Card = n636 as Theme
export const dark_pink_alt2_DrawerFrame = n636 as Theme
export const dark_pink_alt2_Progress = n636 as Theme
export const dark_pink_alt2_TooltipArrow = n636 as Theme
const n637 = t([
  [12, 191],
  [13, 191],
  [14, 191],
  [15, 191],
  [16, 189],
  [17, 187],
  [18, 188],
  [19, 193],
  [20, 194],
  [21, 193],
  [22, 196],
  [23, 272],
  [24, 272],
  [25, 190],
  [26, 191],
  [27, 190],
]) as Theme

export const dark_pink_alt2_Button = n637 as Theme
const n638 = t([
  [12, 191],
  [13, 191],
  [14, 191],
  [15, 191],
  [16, 190],
  [17, 189],
  [18, 188],
  [19, 194],
  [20, 195],
  [21, 194],
  [22, 194],
  [23, 190],
  [24, 195],
  [25, 191],
  [26, 191],
  [27, 190],
]) as Theme

export const dark_pink_alt2_Checkbox = n638 as Theme
export const dark_pink_alt2_Switch = n638 as Theme
export const dark_pink_alt2_TooltipContent = n638 as Theme
export const dark_pink_alt2_SliderTrack = n638 as Theme
const n639 = t([
  [12, 196],
  [13, 196],
  [14, 196],
  [15, 196],
  [16, 141],
  [17, 141],
  [18, 195],
  [19, 189],
  [20, 188],
  [21, 189],
  [22, 186],
  [23, 141],
  [24, 193],
  [25, 196],
  [26, 196],
  [27, 189],
]) as Theme

export const dark_pink_alt2_SwitchThumb = n639 as Theme
const n640 = t([
  [12, 193],
  [13, 193],
  [14, 193],
  [15, 193],
  [16, 67],
  [17, 194],
  [18, 195],
  [19, 189],
  [20, 188],
  [21, 189],
  [22, 189],
  [23, 67],
  [24, 188],
  [25, 193],
  [26, 193],
  [27, 67],
]) as Theme

export const dark_pink_alt2_SliderTrackActive = n640 as Theme
const n641 = t([
  [12, 194],
  [13, 194],
  [14, 194],
  [15, 194],
  [16, 195],
  [17, 196],
  [18, 195],
  [19, 189],
  [20, 188],
  [21, 189],
  [22, 187],
  [23, 195],
  [24, 190],
  [25, 194],
  [26, 194],
  [27, 191],
]) as Theme

export const dark_pink_alt2_SliderThumb = n641 as Theme
export const dark_pink_alt2_Tooltip = n641 as Theme
export const dark_pink_alt2_ProgressIndicator = n641 as Theme
const n642 = t([
  [12, 189],
  [13, 189],
  [14, 189],
  [15, 189],
  [16, 188],
  [17, 187],
  [18, 188],
  [19, 194],
  [20, 195],
  [21, 194],
  [22, 196],
  [23, 189],
  [24, 194],
  [25, 190],
  [26, 190],
  [27, 193],
]) as Theme

export const dark_pink_alt2_Input = n642 as Theme
export const dark_pink_alt2_TextArea = n642 as Theme
const n643 = t([
  [12, 190],
  [13, 190],
  [14, 190],
  [15, 190],
  [16, 189],
  [17, 188],
  [19, 67],
  [20, 194],
  [21, 67],
  [22, 195],
  [23, 189],
  [24, 194],
  [25, 190],
  [26, 190],
  [27, 191],
]) as Theme

export const dark_pink_active_ListItem = n643 as Theme
const n644 = t([
  [12, 191],
  [13, 191],
  [14, 191],
  [15, 191],
  [16, 190],
  [17, 189],
  [19, 67],
  [20, 194],
  [21, 67],
  [22, 194],
  [23, 190],
  [24, 195],
  [25, 191],
  [26, 191],
  [27, 190],
]) as Theme

export const dark_pink_active_Card = n644 as Theme
export const dark_pink_active_DrawerFrame = n644 as Theme
export const dark_pink_active_Progress = n644 as Theme
export const dark_pink_active_TooltipArrow = n644 as Theme
const n645 = t([
  [12, 193],
  [13, 193],
  [14, 193],
  [15, 193],
  [16, 190],
  [17, 188],
  [19, 191],
  [20, 67],
  [21, 191],
  [22, 195],
  [23, 272],
  [24, 272],
  [25, 191],
  [26, 193],
  [27, 189],
]) as Theme

export const dark_pink_active_Button = n645 as Theme
const n646 = t([
  [12, 193],
  [13, 193],
  [14, 193],
  [15, 193],
  [16, 191],
  [17, 190],
  [19, 67],
  [20, 194],
  [21, 67],
  [22, 67],
  [23, 191],
  [24, 196],
  [25, 193],
  [26, 193],
  [27, 189],
]) as Theme

export const dark_pink_active_Checkbox = n646 as Theme
export const dark_pink_active_Switch = n646 as Theme
export const dark_pink_active_TooltipContent = n646 as Theme
export const dark_pink_active_SliderTrack = n646 as Theme
const n647 = t([
  [12, 195],
  [13, 195],
  [14, 195],
  [15, 195],
  [16, 196],
  [17, 141],
  [19, 190],
  [20, 189],
  [21, 190],
  [22, 186],
  [23, 196],
  [24, 191],
  [25, 195],
  [26, 195],
  [27, 190],
]) as Theme

export const dark_pink_active_SwitchThumb = n647 as Theme
const n648 = t([
  [12, 191],
  [13, 191],
  [14, 191],
  [15, 191],
  [16, 193],
  [17, 67],
  [19, 190],
  [20, 189],
  [21, 190],
  [22, 190],
  [23, 193],
  [24, 187],
  [25, 191],
  [26, 191],
  [27, 194],
]) as Theme

export const dark_pink_active_SliderTrackActive = n648 as Theme
const n649 = t([
  [12, 67],
  [13, 67],
  [14, 67],
  [15, 67],
  [16, 194],
  [17, 195],
  [19, 190],
  [20, 189],
  [21, 190],
  [22, 188],
  [23, 194],
  [24, 189],
  [25, 67],
  [26, 67],
  [27, 193],
]) as Theme

export const dark_pink_active_SliderThumb = n649 as Theme
export const dark_pink_active_Tooltip = n649 as Theme
export const dark_pink_active_ProgressIndicator = n649 as Theme
const n650 = t([
  [12, 190],
  [13, 190],
  [14, 190],
  [15, 190],
  [16, 189],
  [17, 188],
  [19, 67],
  [20, 194],
  [21, 67],
  [22, 195],
  [23, 190],
  [24, 195],
  [25, 191],
  [26, 191],
  [27, 191],
]) as Theme

export const dark_pink_active_Input = n650 as Theme
export const dark_pink_active_TextArea = n650 as Theme
const n651 = t([
  [12, 209],
  [13, 209],
  [14, 209],
  [15, 209],
  [16, 120],
  [17, 208],
  [18, 120],
  [19, 127],
  [20, 128],
  [21, 127],
  [22, 141],
  [23, 120],
  [24, 214],
  [25, 209],
  [26, 209],
  [27, 91],
]) as Theme

export const dark_red_alt1_ListItem = n651 as Theme
const n652 = t([
  [12, 210],
  [13, 210],
  [14, 210],
  [15, 210],
  [16, 209],
  [17, 120],
  [18, 120],
  [19, 127],
  [20, 128],
  [21, 127],
  [22, 128],
  [23, 209],
  [24, 91],
  [25, 210],
  [26, 210],
  [27, 214],
]) as Theme

export const dark_red_alt1_Card = n652 as Theme
export const dark_red_alt1_DrawerFrame = n652 as Theme
export const dark_red_alt1_Progress = n652 as Theme
export const dark_red_alt1_TooltipArrow = n652 as Theme
const n653 = t([
  [12, 211],
  [13, 211],
  [14, 211],
  [15, 211],
  [16, 209],
  [17, 208],
  [18, 120],
  [19, 91],
  [20, 127],
  [21, 91],
  [22, 141],
  [23, 272],
  [24, 272],
  [25, 210],
  [26, 211],
  [27, 212],
]) as Theme

export const dark_red_alt1_Button = n653 as Theme
const n654 = t([
  [12, 211],
  [13, 211],
  [14, 211],
  [15, 211],
  [16, 210],
  [17, 209],
  [18, 120],
  [19, 127],
  [20, 128],
  [21, 127],
  [22, 127],
  [23, 210],
  [24, 215],
  [25, 211],
  [26, 211],
  [27, 212],
]) as Theme

export const dark_red_alt1_Checkbox = n654 as Theme
export const dark_red_alt1_Switch = n654 as Theme
export const dark_red_alt1_TooltipContent = n654 as Theme
export const dark_red_alt1_SliderTrack = n654 as Theme
const n655 = t([
  [12, 141],
  [13, 141],
  [14, 141],
  [15, 141],
  [16, 141],
  [17, 141],
  [18, 128],
  [19, 209],
  [20, 120],
  [21, 209],
  [22, 208],
  [23, 141],
  [24, 91],
  [25, 141],
  [26, 141],
  [27, 209],
]) as Theme

export const dark_red_alt1_SwitchThumb = n655 as Theme
const n656 = t([
  [12, 91],
  [13, 91],
  [14, 91],
  [15, 91],
  [16, 215],
  [17, 127],
  [18, 128],
  [19, 209],
  [20, 120],
  [21, 209],
  [22, 209],
  [23, 215],
  [24, 210],
  [25, 91],
  [26, 91],
  [27, 214],
]) as Theme

export const dark_red_alt1_SliderTrackActive = n656 as Theme
const n657 = t([
  [12, 127],
  [13, 127],
  [14, 127],
  [15, 127],
  [16, 128],
  [17, 141],
  [18, 128],
  [19, 209],
  [20, 120],
  [21, 209],
  [22, 208],
  [23, 128],
  [24, 212],
  [25, 127],
  [26, 127],
  [27, 211],
]) as Theme

export const dark_red_alt1_SliderThumb = n657 as Theme
export const dark_red_alt1_Tooltip = n657 as Theme
export const dark_red_alt1_ProgressIndicator = n657 as Theme
const n658 = t([
  [12, 209],
  [13, 209],
  [14, 209],
  [15, 209],
  [16, 120],
  [17, 208],
  [18, 120],
  [19, 127],
  [20, 128],
  [21, 127],
  [22, 141],
  [23, 209],
  [24, 91],
  [25, 210],
  [26, 210],
  [27, 91],
]) as Theme

export const dark_red_alt1_Input = n658 as Theme
export const dark_red_alt1_TextArea = n658 as Theme
const n659 = t([
  [12, 210],
  [13, 210],
  [14, 210],
  [15, 210],
  [16, 209],
  [17, 120],
  [18, 209],
  [19, 215],
  [20, 127],
  [21, 215],
  [22, 128],
  [23, 209],
  [24, 91],
  [25, 210],
  [26, 210],
  [27, 214],
]) as Theme

export const dark_red_alt2_ListItem = n659 as Theme
const n660 = t([
  [12, 211],
  [13, 211],
  [14, 211],
  [15, 211],
  [16, 210],
  [17, 209],
  [18, 209],
  [19, 215],
  [20, 127],
  [21, 215],
  [22, 127],
  [23, 210],
  [24, 215],
  [25, 211],
  [26, 211],
  [27, 212],
]) as Theme

export const dark_red_alt2_Card = n660 as Theme
export const dark_red_alt2_DrawerFrame = n660 as Theme
export const dark_red_alt2_Progress = n660 as Theme
export const dark_red_alt2_TooltipArrow = n660 as Theme
const n661 = t([
  [12, 212],
  [13, 212],
  [14, 212],
  [15, 212],
  [16, 210],
  [17, 120],
  [18, 209],
  [19, 214],
  [20, 215],
  [21, 214],
  [22, 128],
  [23, 272],
  [24, 272],
  [25, 211],
  [26, 212],
  [27, 211],
]) as Theme

export const dark_red_alt2_Button = n661 as Theme
const n662 = t([
  [12, 212],
  [13, 212],
  [14, 212],
  [15, 212],
  [16, 211],
  [17, 210],
  [18, 209],
  [19, 215],
  [20, 127],
  [21, 215],
  [22, 215],
  [23, 211],
  [24, 127],
  [25, 212],
  [26, 212],
  [27, 211],
]) as Theme

export const dark_red_alt2_Checkbox = n662 as Theme
export const dark_red_alt2_Switch = n662 as Theme
export const dark_red_alt2_TooltipContent = n662 as Theme
export const dark_red_alt2_SliderTrack = n662 as Theme
const n663 = t([
  [12, 128],
  [13, 128],
  [14, 128],
  [15, 128],
  [16, 141],
  [17, 141],
  [18, 127],
  [19, 210],
  [20, 209],
  [21, 210],
  [22, 208],
  [23, 141],
  [24, 214],
  [25, 128],
  [26, 128],
  [27, 210],
]) as Theme

export const dark_red_alt2_SwitchThumb = n663 as Theme
const n664 = t([
  [12, 214],
  [13, 214],
  [14, 214],
  [15, 214],
  [16, 91],
  [17, 215],
  [18, 127],
  [19, 210],
  [20, 209],
  [21, 210],
  [22, 210],
  [23, 91],
  [24, 209],
  [25, 214],
  [26, 214],
  [27, 91],
]) as Theme

export const dark_red_alt2_SliderTrackActive = n664 as Theme
const n665 = t([
  [12, 215],
  [13, 215],
  [14, 215],
  [15, 215],
  [16, 127],
  [17, 128],
  [18, 127],
  [19, 210],
  [20, 209],
  [21, 210],
  [22, 120],
  [23, 127],
  [24, 211],
  [25, 215],
  [26, 215],
  [27, 212],
]) as Theme

export const dark_red_alt2_SliderThumb = n665 as Theme
export const dark_red_alt2_Tooltip = n665 as Theme
export const dark_red_alt2_ProgressIndicator = n665 as Theme
const n666 = t([
  [12, 210],
  [13, 210],
  [14, 210],
  [15, 210],
  [16, 209],
  [17, 120],
  [18, 209],
  [19, 215],
  [20, 127],
  [21, 215],
  [22, 128],
  [23, 210],
  [24, 215],
  [25, 211],
  [26, 211],
  [27, 214],
]) as Theme

export const dark_red_alt2_Input = n666 as Theme
export const dark_red_alt2_TextArea = n666 as Theme
const n667 = t([
  [12, 211],
  [13, 211],
  [14, 211],
  [15, 211],
  [16, 210],
  [17, 209],
  [19, 91],
  [20, 215],
  [21, 91],
  [22, 127],
  [23, 210],
  [24, 215],
  [25, 211],
  [26, 211],
  [27, 212],
]) as Theme

export const dark_red_active_ListItem = n667 as Theme
const n668 = t([
  [12, 212],
  [13, 212],
  [14, 212],
  [15, 212],
  [16, 211],
  [17, 210],
  [19, 91],
  [20, 215],
  [21, 91],
  [22, 215],
  [23, 211],
  [24, 127],
  [25, 212],
  [26, 212],
  [27, 211],
]) as Theme

export const dark_red_active_Card = n668 as Theme
export const dark_red_active_DrawerFrame = n668 as Theme
export const dark_red_active_Progress = n668 as Theme
export const dark_red_active_TooltipArrow = n668 as Theme
const n669 = t([
  [12, 214],
  [13, 214],
  [14, 214],
  [15, 214],
  [16, 211],
  [17, 209],
  [19, 212],
  [20, 91],
  [21, 212],
  [22, 127],
  [23, 272],
  [24, 272],
  [25, 212],
  [26, 214],
  [27, 210],
]) as Theme

export const dark_red_active_Button = n669 as Theme
const n670 = t([
  [12, 214],
  [13, 214],
  [14, 214],
  [15, 214],
  [16, 212],
  [17, 211],
  [19, 91],
  [20, 215],
  [21, 91],
  [22, 91],
  [23, 212],
  [24, 128],
  [25, 214],
  [26, 214],
  [27, 210],
]) as Theme

export const dark_red_active_Checkbox = n670 as Theme
export const dark_red_active_Switch = n670 as Theme
export const dark_red_active_TooltipContent = n670 as Theme
export const dark_red_active_SliderTrack = n670 as Theme
const n671 = t([
  [12, 127],
  [13, 127],
  [14, 127],
  [15, 127],
  [16, 128],
  [17, 141],
  [19, 211],
  [20, 210],
  [21, 211],
  [22, 208],
  [23, 128],
  [24, 212],
  [25, 127],
  [26, 127],
  [27, 211],
]) as Theme

export const dark_red_active_SwitchThumb = n671 as Theme
const n672 = t([
  [12, 212],
  [13, 212],
  [14, 212],
  [15, 212],
  [16, 214],
  [17, 91],
  [19, 211],
  [20, 210],
  [21, 211],
  [22, 211],
  [23, 214],
  [24, 120],
  [25, 212],
  [26, 212],
  [27, 215],
]) as Theme

export const dark_red_active_SliderTrackActive = n672 as Theme
const n673 = t([
  [12, 91],
  [13, 91],
  [14, 91],
  [15, 91],
  [16, 215],
  [17, 127],
  [19, 211],
  [20, 210],
  [21, 211],
  [22, 209],
  [23, 215],
  [24, 210],
  [25, 91],
  [26, 91],
  [27, 214],
]) as Theme

export const dark_red_active_SliderThumb = n673 as Theme
export const dark_red_active_Tooltip = n673 as Theme
export const dark_red_active_ProgressIndicator = n673 as Theme
const n674 = t([
  [12, 211],
  [13, 211],
  [14, 211],
  [15, 211],
  [16, 210],
  [17, 209],
  [19, 91],
  [20, 215],
  [21, 91],
  [22, 127],
  [23, 211],
  [24, 127],
  [25, 212],
  [26, 212],
  [27, 212],
]) as Theme

export const dark_red_active_Input = n674 as Theme
export const dark_red_active_TextArea = n674 as Theme
const n675 = t([
  [12, 229],
  [13, 229],
  [14, 229],
  [15, 229],
  [16, 228],
  [17, 227],
  [18, 228],
  [19, 236],
  [20, 237],
  [21, 236],
  [22, 141],
  [23, 228],
  [24, 234],
  [25, 229],
  [26, 229],
  [27, 115],
]) as Theme

export const dark_gold_alt1_ListItem = n675 as Theme
const n676 = t([
  [12, 230],
  [13, 230],
  [14, 230],
  [15, 230],
  [16, 229],
  [17, 228],
  [18, 228],
  [19, 236],
  [20, 237],
  [21, 236],
  [22, 237],
  [23, 229],
  [24, 115],
  [25, 230],
  [26, 230],
  [27, 234],
]) as Theme

export const dark_gold_alt1_Card = n676 as Theme
export const dark_gold_alt1_DrawerFrame = n676 as Theme
export const dark_gold_alt1_Progress = n676 as Theme
export const dark_gold_alt1_TooltipArrow = n676 as Theme
const n677 = t([
  [12, 231],
  [13, 231],
  [14, 231],
  [15, 231],
  [16, 229],
  [17, 227],
  [18, 228],
  [19, 115],
  [20, 236],
  [21, 115],
  [22, 141],
  [23, 272],
  [24, 272],
  [25, 230],
  [26, 231],
  [27, 232],
]) as Theme

export const dark_gold_alt1_Button = n677 as Theme
const n678 = t([
  [12, 231],
  [13, 231],
  [14, 231],
  [15, 231],
  [16, 230],
  [17, 229],
  [18, 228],
  [19, 236],
  [20, 237],
  [21, 236],
  [22, 236],
  [23, 230],
  [24, 235],
  [25, 231],
  [26, 231],
  [27, 232],
]) as Theme

export const dark_gold_alt1_Checkbox = n678 as Theme
export const dark_gold_alt1_Switch = n678 as Theme
export const dark_gold_alt1_TooltipContent = n678 as Theme
export const dark_gold_alt1_SliderTrack = n678 as Theme
const n679 = t([
  [12, 141],
  [13, 141],
  [14, 141],
  [15, 141],
  [16, 141],
  [17, 141],
  [18, 237],
  [19, 229],
  [20, 228],
  [21, 229],
  [22, 227],
  [23, 141],
  [24, 115],
  [25, 141],
  [26, 141],
  [27, 229],
]) as Theme

export const dark_gold_alt1_SwitchThumb = n679 as Theme
const n680 = t([
  [12, 115],
  [13, 115],
  [14, 115],
  [15, 115],
  [16, 235],
  [17, 236],
  [18, 237],
  [19, 229],
  [20, 228],
  [21, 229],
  [22, 229],
  [23, 235],
  [24, 230],
  [25, 115],
  [26, 115],
  [27, 234],
]) as Theme

export const dark_gold_alt1_SliderTrackActive = n680 as Theme
const n681 = t([
  [12, 236],
  [13, 236],
  [14, 236],
  [15, 236],
  [16, 237],
  [17, 141],
  [18, 237],
  [19, 229],
  [20, 228],
  [21, 229],
  [22, 227],
  [23, 237],
  [24, 232],
  [25, 236],
  [26, 236],
  [27, 231],
]) as Theme

export const dark_gold_alt1_SliderThumb = n681 as Theme
export const dark_gold_alt1_Tooltip = n681 as Theme
export const dark_gold_alt1_ProgressIndicator = n681 as Theme
const n682 = t([
  [12, 229],
  [13, 229],
  [14, 229],
  [15, 229],
  [16, 228],
  [17, 227],
  [18, 228],
  [19, 236],
  [20, 237],
  [21, 236],
  [22, 141],
  [23, 229],
  [24, 115],
  [25, 230],
  [26, 230],
  [27, 115],
]) as Theme

export const dark_gold_alt1_Input = n682 as Theme
export const dark_gold_alt1_TextArea = n682 as Theme
const n683 = t([
  [12, 230],
  [13, 230],
  [14, 230],
  [15, 230],
  [16, 229],
  [17, 228],
  [18, 229],
  [19, 235],
  [20, 236],
  [21, 235],
  [22, 237],
  [23, 229],
  [24, 115],
  [25, 230],
  [26, 230],
  [27, 234],
]) as Theme

export const dark_gold_alt2_ListItem = n683 as Theme
const n684 = t([
  [12, 231],
  [13, 231],
  [14, 231],
  [15, 231],
  [16, 230],
  [17, 229],
  [18, 229],
  [19, 235],
  [20, 236],
  [21, 235],
  [22, 236],
  [23, 230],
  [24, 235],
  [25, 231],
  [26, 231],
  [27, 232],
]) as Theme

export const dark_gold_alt2_Card = n684 as Theme
export const dark_gold_alt2_DrawerFrame = n684 as Theme
export const dark_gold_alt2_Progress = n684 as Theme
export const dark_gold_alt2_TooltipArrow = n684 as Theme
const n685 = t([
  [12, 232],
  [13, 232],
  [14, 232],
  [15, 232],
  [16, 230],
  [17, 228],
  [18, 229],
  [19, 234],
  [20, 235],
  [21, 234],
  [22, 237],
  [23, 272],
  [24, 272],
  [25, 231],
  [26, 232],
  [27, 231],
]) as Theme

export const dark_gold_alt2_Button = n685 as Theme
const n686 = t([
  [12, 232],
  [13, 232],
  [14, 232],
  [15, 232],
  [16, 231],
  [17, 230],
  [18, 229],
  [19, 235],
  [20, 236],
  [21, 235],
  [22, 235],
  [23, 231],
  [24, 236],
  [25, 232],
  [26, 232],
  [27, 231],
]) as Theme

export const dark_gold_alt2_Checkbox = n686 as Theme
export const dark_gold_alt2_Switch = n686 as Theme
export const dark_gold_alt2_TooltipContent = n686 as Theme
export const dark_gold_alt2_SliderTrack = n686 as Theme
const n687 = t([
  [12, 237],
  [13, 237],
  [14, 237],
  [15, 237],
  [16, 141],
  [17, 141],
  [18, 236],
  [19, 230],
  [20, 229],
  [21, 230],
  [22, 227],
  [23, 141],
  [24, 234],
  [25, 237],
  [26, 237],
  [27, 230],
]) as Theme

export const dark_gold_alt2_SwitchThumb = n687 as Theme
const n688 = t([
  [12, 234],
  [13, 234],
  [14, 234],
  [15, 234],
  [16, 115],
  [17, 235],
  [18, 236],
  [19, 230],
  [20, 229],
  [21, 230],
  [22, 230],
  [23, 115],
  [24, 229],
  [25, 234],
  [26, 234],
  [27, 115],
]) as Theme

export const dark_gold_alt2_SliderTrackActive = n688 as Theme
const n689 = t([
  [12, 235],
  [13, 235],
  [14, 235],
  [15, 235],
  [16, 236],
  [17, 237],
  [18, 236],
  [19, 230],
  [20, 229],
  [21, 230],
  [22, 228],
  [23, 236],
  [24, 231],
  [25, 235],
  [26, 235],
  [27, 232],
]) as Theme

export const dark_gold_alt2_SliderThumb = n689 as Theme
export const dark_gold_alt2_Tooltip = n689 as Theme
export const dark_gold_alt2_ProgressIndicator = n689 as Theme
const n690 = t([
  [12, 230],
  [13, 230],
  [14, 230],
  [15, 230],
  [16, 229],
  [17, 228],
  [18, 229],
  [19, 235],
  [20, 236],
  [21, 235],
  [22, 237],
  [23, 230],
  [24, 235],
  [25, 231],
  [26, 231],
  [27, 234],
]) as Theme

export const dark_gold_alt2_Input = n690 as Theme
export const dark_gold_alt2_TextArea = n690 as Theme
const n691 = t([
  [12, 231],
  [13, 231],
  [14, 231],
  [15, 231],
  [16, 230],
  [17, 229],
  [19, 115],
  [20, 235],
  [21, 115],
  [22, 236],
  [23, 230],
  [24, 235],
  [25, 231],
  [26, 231],
  [27, 232],
]) as Theme

export const dark_gold_active_ListItem = n691 as Theme
const n692 = t([
  [12, 232],
  [13, 232],
  [14, 232],
  [15, 232],
  [16, 231],
  [17, 230],
  [19, 115],
  [20, 235],
  [21, 115],
  [22, 235],
  [23, 231],
  [24, 236],
  [25, 232],
  [26, 232],
  [27, 231],
]) as Theme

export const dark_gold_active_Card = n692 as Theme
export const dark_gold_active_DrawerFrame = n692 as Theme
export const dark_gold_active_Progress = n692 as Theme
export const dark_gold_active_TooltipArrow = n692 as Theme
const n693 = t([
  [12, 234],
  [13, 234],
  [14, 234],
  [15, 234],
  [16, 231],
  [17, 229],
  [19, 232],
  [20, 115],
  [21, 232],
  [22, 236],
  [23, 272],
  [24, 272],
  [25, 232],
  [26, 234],
  [27, 230],
]) as Theme

export const dark_gold_active_Button = n693 as Theme
const n694 = t([
  [12, 234],
  [13, 234],
  [14, 234],
  [15, 234],
  [16, 232],
  [17, 231],
  [19, 115],
  [20, 235],
  [21, 115],
  [22, 115],
  [23, 232],
  [24, 237],
  [25, 234],
  [26, 234],
  [27, 230],
]) as Theme

export const dark_gold_active_Checkbox = n694 as Theme
export const dark_gold_active_Switch = n694 as Theme
export const dark_gold_active_TooltipContent = n694 as Theme
export const dark_gold_active_SliderTrack = n694 as Theme
const n695 = t([
  [12, 236],
  [13, 236],
  [14, 236],
  [15, 236],
  [16, 237],
  [17, 141],
  [19, 231],
  [20, 230],
  [21, 231],
  [22, 227],
  [23, 237],
  [24, 232],
  [25, 236],
  [26, 236],
  [27, 231],
]) as Theme

export const dark_gold_active_SwitchThumb = n695 as Theme
const n696 = t([
  [12, 232],
  [13, 232],
  [14, 232],
  [15, 232],
  [16, 234],
  [17, 115],
  [19, 231],
  [20, 230],
  [21, 231],
  [22, 231],
  [23, 234],
  [24, 228],
  [25, 232],
  [26, 232],
  [27, 235],
]) as Theme

export const dark_gold_active_SliderTrackActive = n696 as Theme
const n697 = t([
  [12, 115],
  [13, 115],
  [14, 115],
  [15, 115],
  [16, 235],
  [17, 236],
  [19, 231],
  [20, 230],
  [21, 231],
  [22, 229],
  [23, 235],
  [24, 230],
  [25, 115],
  [26, 115],
  [27, 234],
]) as Theme

export const dark_gold_active_SliderThumb = n697 as Theme
export const dark_gold_active_Tooltip = n697 as Theme
export const dark_gold_active_ProgressIndicator = n697 as Theme
const n698 = t([
  [12, 231],
  [13, 231],
  [14, 231],
  [15, 231],
  [16, 230],
  [17, 229],
  [19, 115],
  [20, 235],
  [21, 115],
  [22, 236],
  [23, 231],
  [24, 236],
  [25, 232],
  [26, 232],
  [27, 232],
]) as Theme

export const dark_gold_active_Input = n698 as Theme
export const dark_gold_active_TextArea = n698 as Theme
const n699 = t([
  [12, 121],
  [13, 121],
  [14, 121],
  [15, 121],
  [16, 120],
  [17, 119],
  [18, 120],
  [19, 127],
  [20, 128],
  [21, 127],
  [22, 141],
  [23, 120],
  [24, 124],
  [25, 121],
  [26, 121],
  [27, 125],
]) as Theme

export const dark_send_alt1_ListItem = n699 as Theme
const n700 = t([
  [12, 122],
  [13, 122],
  [14, 122],
  [15, 122],
  [16, 121],
  [17, 120],
  [18, 120],
  [19, 127],
  [20, 128],
  [21, 127],
  [22, 128],
  [23, 121],
  [24, 125],
  [25, 122],
  [26, 122],
  [27, 124],
]) as Theme

export const dark_send_alt1_Card = n700 as Theme
export const dark_send_alt1_DrawerFrame = n700 as Theme
export const dark_send_alt1_Progress = n700 as Theme
export const dark_send_alt1_TooltipArrow = n700 as Theme
const n701 = t([
  [12, 121],
  [13, 121],
  [14, 121],
  [15, 121],
  [16, 121],
  [17, 119],
  [18, 120],
  [19, 125],
  [20, 127],
  [21, 125],
  [22, 141],
  [23, 272],
  [24, 272],
  [25, 122],
  [26, 121],
  [27, 119],
]) as Theme

export const dark_send_alt1_Button = n701 as Theme
const n702 = t([
  [12, 121],
  [13, 121],
  [14, 121],
  [15, 121],
  [16, 122],
  [17, 121],
  [18, 120],
  [19, 127],
  [20, 128],
  [21, 127],
  [22, 127],
  [23, 122],
  [24, 126],
  [25, 121],
  [26, 121],
  [27, 119],
]) as Theme

export const dark_send_alt1_Checkbox = n702 as Theme
export const dark_send_alt1_Switch = n702 as Theme
export const dark_send_alt1_TooltipContent = n702 as Theme
export const dark_send_alt1_SliderTrack = n702 as Theme
const n703 = t([
  [12, 141],
  [13, 141],
  [14, 141],
  [15, 141],
  [16, 141],
  [17, 141],
  [18, 128],
  [19, 121],
  [20, 120],
  [21, 121],
  [22, 119],
  [23, 141],
  [24, 125],
  [25, 141],
  [26, 141],
  [27, 121],
]) as Theme

export const dark_send_alt1_SwitchThumb = n703 as Theme
const n704 = t([
  [12, 125],
  [13, 125],
  [14, 125],
  [15, 125],
  [16, 126],
  [17, 127],
  [18, 128],
  [19, 121],
  [20, 120],
  [21, 121],
  [22, 121],
  [23, 126],
  [24, 122],
  [25, 125],
  [26, 125],
  [27, 124],
]) as Theme

export const dark_send_alt1_SliderTrackActive = n704 as Theme
const n705 = t([
  [12, 127],
  [13, 127],
  [14, 127],
  [15, 127],
  [16, 128],
  [17, 141],
  [18, 128],
  [19, 121],
  [20, 120],
  [21, 121],
  [22, 119],
  [23, 128],
  [24, 119],
  [25, 127],
  [26, 127],
  [27, 121],
]) as Theme

export const dark_send_alt1_SliderThumb = n705 as Theme
export const dark_send_alt1_Tooltip = n705 as Theme
export const dark_send_alt1_ProgressIndicator = n705 as Theme
const n706 = t([
  [12, 121],
  [13, 121],
  [14, 121],
  [15, 121],
  [16, 120],
  [17, 119],
  [18, 120],
  [19, 127],
  [20, 128],
  [21, 127],
  [22, 141],
  [23, 121],
  [24, 125],
  [25, 122],
  [26, 122],
  [27, 125],
]) as Theme

export const dark_send_alt1_Input = n706 as Theme
export const dark_send_alt1_TextArea = n706 as Theme
const n707 = t([
  [12, 122],
  [13, 122],
  [14, 122],
  [15, 122],
  [16, 121],
  [17, 120],
  [18, 121],
  [19, 126],
  [20, 127],
  [21, 126],
  [22, 128],
  [23, 121],
  [24, 125],
  [25, 122],
  [26, 122],
  [27, 124],
]) as Theme

export const dark_send_alt2_ListItem = n707 as Theme
const n708 = t([
  [12, 121],
  [13, 121],
  [14, 121],
  [15, 121],
  [16, 122],
  [17, 121],
  [18, 121],
  [19, 126],
  [20, 127],
  [21, 126],
  [22, 127],
  [23, 122],
  [24, 126],
  [25, 121],
  [26, 121],
  [27, 119],
]) as Theme

export const dark_send_alt2_Card = n708 as Theme
export const dark_send_alt2_DrawerFrame = n708 as Theme
export const dark_send_alt2_Progress = n708 as Theme
export const dark_send_alt2_TooltipArrow = n708 as Theme
const n709 = t([
  [12, 119],
  [13, 119],
  [14, 119],
  [15, 119],
  [16, 122],
  [17, 120],
  [18, 121],
  [19, 124],
  [20, 126],
  [21, 124],
  [22, 128],
  [23, 272],
  [24, 272],
  [25, 121],
  [26, 119],
  [27, 121],
]) as Theme

export const dark_send_alt2_Button = n709 as Theme
const n710 = t([
  [12, 119],
  [13, 119],
  [14, 119],
  [15, 119],
  [16, 121],
  [17, 122],
  [18, 121],
  [19, 126],
  [20, 127],
  [21, 126],
  [22, 126],
  [23, 121],
  [24, 127],
  [25, 119],
  [26, 119],
  [27, 121],
]) as Theme

export const dark_send_alt2_Checkbox = n710 as Theme
export const dark_send_alt2_Switch = n710 as Theme
export const dark_send_alt2_TooltipContent = n710 as Theme
export const dark_send_alt2_SliderTrack = n710 as Theme
const n711 = t([
  [12, 128],
  [13, 128],
  [14, 128],
  [15, 128],
  [16, 141],
  [17, 141],
  [18, 127],
  [19, 122],
  [20, 121],
  [21, 122],
  [22, 119],
  [23, 141],
  [24, 124],
  [25, 128],
  [26, 128],
  [27, 122],
]) as Theme

export const dark_send_alt2_SwitchThumb = n711 as Theme
const n712 = t([
  [12, 124],
  [13, 124],
  [14, 124],
  [15, 124],
  [16, 125],
  [17, 126],
  [18, 127],
  [19, 122],
  [20, 121],
  [21, 122],
  [22, 122],
  [23, 125],
  [24, 121],
  [25, 124],
  [26, 124],
  [27, 125],
]) as Theme

export const dark_send_alt2_SliderTrackActive = n712 as Theme
const n713 = t([
  [12, 126],
  [13, 126],
  [14, 126],
  [15, 126],
  [16, 127],
  [17, 128],
  [18, 127],
  [19, 122],
  [20, 121],
  [21, 122],
  [22, 120],
  [23, 127],
  [24, 121],
  [25, 126],
  [26, 126],
  [27, 119],
]) as Theme

export const dark_send_alt2_SliderThumb = n713 as Theme
export const dark_send_alt2_Tooltip = n713 as Theme
export const dark_send_alt2_ProgressIndicator = n713 as Theme
const n714 = t([
  [12, 122],
  [13, 122],
  [14, 122],
  [15, 122],
  [16, 121],
  [17, 120],
  [18, 121],
  [19, 126],
  [20, 127],
  [21, 126],
  [22, 128],
  [23, 122],
  [24, 126],
  [25, 121],
  [26, 121],
  [27, 124],
]) as Theme

export const dark_send_alt2_Input = n714 as Theme
export const dark_send_alt2_TextArea = n714 as Theme
const n715 = t([
  [12, 121],
  [13, 121],
  [14, 121],
  [15, 121],
  [16, 122],
  [17, 121],
  [19, 125],
  [20, 126],
  [21, 125],
  [22, 127],
  [23, 122],
  [24, 126],
  [25, 121],
  [26, 121],
  [27, 119],
]) as Theme

export const dark_send_active_ListItem = n715 as Theme
const n716 = t([
  [12, 119],
  [13, 119],
  [14, 119],
  [15, 119],
  [16, 121],
  [17, 122],
  [19, 125],
  [20, 126],
  [21, 125],
  [22, 126],
  [23, 121],
  [24, 127],
  [25, 119],
  [26, 119],
  [27, 121],
]) as Theme

export const dark_send_active_Card = n716 as Theme
export const dark_send_active_DrawerFrame = n716 as Theme
export const dark_send_active_Progress = n716 as Theme
export const dark_send_active_TooltipArrow = n716 as Theme
const n717 = t([
  [12, 124],
  [13, 124],
  [14, 124],
  [15, 124],
  [16, 121],
  [17, 121],
  [19, 119],
  [20, 125],
  [21, 119],
  [22, 127],
  [23, 272],
  [24, 272],
  [25, 119],
  [26, 124],
  [27, 122],
]) as Theme

export const dark_send_active_Button = n717 as Theme
const n718 = t([
  [12, 124],
  [13, 124],
  [14, 124],
  [15, 124],
  [16, 119],
  [17, 121],
  [19, 125],
  [20, 126],
  [21, 125],
  [22, 125],
  [23, 119],
  [24, 128],
  [25, 124],
  [26, 124],
  [27, 122],
]) as Theme

export const dark_send_active_Checkbox = n718 as Theme
export const dark_send_active_Switch = n718 as Theme
export const dark_send_active_TooltipContent = n718 as Theme
export const dark_send_active_SliderTrack = n718 as Theme
const n719 = t([
  [12, 127],
  [13, 127],
  [14, 127],
  [15, 127],
  [16, 128],
  [17, 141],
  [19, 121],
  [20, 122],
  [21, 121],
  [22, 119],
  [23, 128],
  [24, 119],
  [25, 127],
  [26, 127],
  [27, 121],
]) as Theme

export const dark_send_active_SwitchThumb = n719 as Theme
const n720 = t([
  [12, 119],
  [13, 119],
  [14, 119],
  [15, 119],
  [16, 124],
  [17, 125],
  [19, 121],
  [20, 122],
  [21, 121],
  [22, 121],
  [23, 124],
  [24, 120],
  [25, 119],
  [26, 119],
  [27, 126],
]) as Theme

export const dark_send_active_SliderTrackActive = n720 as Theme
const n721 = t([
  [12, 125],
  [13, 125],
  [14, 125],
  [15, 125],
  [16, 126],
  [17, 127],
  [19, 121],
  [20, 122],
  [21, 121],
  [22, 121],
  [23, 126],
  [24, 122],
  [25, 125],
  [26, 125],
  [27, 124],
]) as Theme

export const dark_send_active_SliderThumb = n721 as Theme
export const dark_send_active_Tooltip = n721 as Theme
export const dark_send_active_ProgressIndicator = n721 as Theme
const n722 = t([
  [12, 121],
  [13, 121],
  [14, 121],
  [15, 121],
  [16, 122],
  [17, 121],
  [19, 125],
  [20, 126],
  [21, 125],
  [22, 127],
  [23, 121],
  [24, 127],
  [25, 119],
  [26, 119],
  [27, 119],
]) as Theme

export const dark_send_active_Input = n722 as Theme
export const dark_send_active_TextArea = n722 as Theme
