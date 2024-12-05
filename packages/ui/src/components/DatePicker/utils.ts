export function swapOnClick<Component>(component: Component) {
  // @ts-expect-error rehookify internally return `onClick` and that's incompatible with native
  component.onPress = component.onClick
  return component
}
