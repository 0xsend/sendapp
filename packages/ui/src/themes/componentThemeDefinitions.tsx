import { combineMasks, type ThemeDefinitions } from '@tamagui/create-theme'
import { maskOptions } from './templates'
import type { masks } from './masks'

type Masks = typeof masks

const overlayThemes = {
  light: {
    background: 'rgba(0,0,0,0.5)',
  },
  dark: {
    background: 'rgba(0,0,0,0.9)',
  },
}

export const overlayThemeDefinitions = [
  {
    parent: 'light',
    theme: overlayThemes.light,
  },
  {
    parent: 'dark',
    theme: overlayThemes.dark,
  },
]

export const componentThemeDefinitions = {
  ListItem: [
    {
      parent: 'light',
      mask: 'strengthen',
      ...maskOptions.component,
    },
    {
      parent: 'dark',
      mask: 'identity',
      ...maskOptions.component,
    },
  ],
  Card: {
    mask: 'soften',
    ...maskOptions.component,
  },
  Button: [
    {
      parent: 'dark_green',
      mask: 'inverseSoften3',
      ...maskOptions.button,
      override: {
        color: 0,
      },
    },
    {
      parent: '',
      mask: 'soften',
      ...maskOptions.button,
    },
  ],
  Checkbox: {
    mask: 'soften2',
    ...maskOptions.component,
  },

  Switch: {
    mask: 'soften2',
    ...maskOptions.component,
  },

  SwitchThumb: {
    mask: 'inverseStrengthen2',
    ...maskOptions.component,
  },

  TooltipContent: {
    mask: 'strengthen',
    ...maskOptions.component,
  },

  DrawerFrame: {
    mask: 'soften',
    ...maskOptions.component,
  },

  Progress: {
    mask: 'soften',
    ...maskOptions.component,
  },

  TooltipArrow: {
    mask: 'soften',
    ...maskOptions.component,
  },

  SliderTrackActive: {
    mask: 'inverseSoften',
    ...maskOptions.component,
  },

  SliderTrack: {
    mask: 'soften2',
    ...maskOptions.component,
  },

  SliderThumb: {
    mask: 'inverse',
    ...maskOptions.component,
  },

  Tooltip: {
    mask: 'inverse',
    ...maskOptions.component,
  },
  ProgressIndicator: {
    mask: 'inverse',
    ...maskOptions.component,
  },
  SheetOverlay: overlayThemeDefinitions,
  DialogOverlay: overlayThemeDefinitions,
  ModalOverlay: overlayThemeDefinitions,
  Input: {
    mask: 'soften',
    ...maskOptions.component,
  },

  TextArea: [
    {
      parent: 'light',
      mask: 'strengthenButSoftenBorder',
      ...maskOptions.component,
    },
    {
      parent: 'dark',
      mask: 'softenBorder',
      ...maskOptions.component,
    },
  ],
  Separator: { mask: 'soften3', ...maskOptions.component },
  Surface: {
    mask: 'soften',
    ...maskOptions.component,
  },
} satisfies ThemeDefinitions<keyof Masks>
