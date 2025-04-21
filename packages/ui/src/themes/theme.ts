import { masks } from './masks'
import { createThemeBuilder } from '@tamagui/theme-builder'
import { maskOptions, templates } from './templates'
import { componentThemeDefinitions } from './componentThemeDefinitions'
import { shadows } from './shadows'
import { palettes } from './palettes'

const colorThemeDefinition = (colorName: string) => [
  {
    parent: 'light',
    palette: colorName,
    template: 'colorLight',
  },
  {
    parent: 'dark',
    palette: colorName,
    template: 'base',
  },
]

const themesBuilder = createThemeBuilder()
  .addPalettes(palettes)
  .addTemplates(templates)
  .addMasks(masks)
  .addThemes({
    light: {
      template: 'base',
      palette: 'light',
      nonInheritedValues: {
        ...shadows.light,
      },
    },
    dark: {
      template: 'base',
      palette: 'dark',
      nonInheritedValues: {
        ...shadows.dark,
      },
    },
  })
  .addChildThemes({
    yellow: colorThemeDefinition('yellow'),
    green: colorThemeDefinition('green'),
    red: colorThemeDefinition('red'),
    gray: colorThemeDefinition('gray'),
  })
  .addChildThemes({
    ghost: {
      mask: 'ghost',
      ...maskOptions.component,
    },
  })
  .addChildThemes({
    alt1: {
      mask: 'soften',
      ...maskOptions.alt,
    },
    alt2: {
      mask: 'soften2',
      ...maskOptions.alt,
    },
    active: {
      mask: 'soften3',
      ...maskOptions.component,
    },
    dim: {
      mask: 'strengthen',
      ...maskOptions.component,
    },
  })
  .addChildThemes(componentThemeDefinitions)

// biome-ignore lint/suspicious/noExplicitAny: type is too large
export const themes: any = themesBuilder.build()
