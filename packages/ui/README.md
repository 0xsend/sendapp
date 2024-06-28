# /send UI

## User Guide v0

Send uses [Tamagui](https://tamagui.dev/) for styling and components across web and native platforms. Tamagui is a CSS-in-JS library that provides a set of primitives and components to build accessible design systems that work everywhere.

### Tamagui Components

Tamagui provides a variety of components that fit directly into its design ecosystem that help build on a greater scale, more quickly, at a greater scale.

<details><summary>Tamagui supports the following components:</summary>
<ul>
  <li><a>View</a></li>
  <li><a>Stack</a></li>
  <li><a>XStack</a></li>
  <li><a>YStack</a></li>
  <li><a>ZStack</a></li>
  <li><a>H1- H6</a></li>
  <li><a>Paragraph</a></li>
  <li><a>Button</a></li>
  <li><a>Link</a></li>
  <li><a>Text</a></li>
  <li><a>SizeableText</a></li>
  <li><a>Input</a></li>
  <li><a>Card</a></li>
  <li><a>Avatar</a></li>
  <li><a>Badge</a></li>
  <li><a>Tooltip</a></li>
  <li><a>Checkbox</a></li>
  <li><a>Form</a></li>
  <li><a>Input & TextArea</a></li>
  <li><a>Label</a></li>
  <li><a>Progress</a></li>
  <li><a>Radio</a></li>
  <li><a>Select</a></li>
  <li><a>Slider</a></li>
  <li><a>Switch</a></li>
  <li><a>Toggle</a></li>
  <li><a>Dialog</a></li>
  <li><a>AlertDialog</a></li>
  <li><a>Popover</a></li>
  <li><a>Sheet</a></li>
  <li><a>Tooltip</a></li>
  <li><a>Toast</a></li>
  <li><a>Accordion</a></li>
  <li><a>Group</a></li>
  <li><a>Tabs</a></li>
</ul>
</details>
<br>
These components can be used to take full advantage of Send's tamagui UI integrations, including color themes, fonts, media queries and cross-platform support.

Of course, not all components will fit under this umbrella, and we will need ways to extend Tamagui defaults, but that we bridge can be crossed when we need it.

### Send Color Themes

One of the best features of using Tamagui's components, is their themability. Tamagui supports light and dark switching out of the box.

Send has compiled a set of color themes that will integrate directly into the imported Tamagui Components. To do that we have to start with a few concepts.

#### Rule 1: Colors 0-12

![send palettes](./assets/send_palettes.png 'Rule 1 Colors 0-12')
Send UI takes a lot of inspiration from Radix UI. Send has sets of 12 colors for each light and dark theme.

**In the words of RadixUI:**

> There are 12 steps in each scale. Each step was designed for at least one specific use case.
> This table is a simple overview of the most common use case for each step. However, there are many exceptions and caveats to factor in, which are covered in further detail below.

 <table class="rt-Box rt-r-my-5" style="display: table; width: 100%; text-align: left; border-collapse: collapse;"><thead><tr><th class="rt-Box rt-r-px-4 rt-r-py-3" style="display: table-cell; width: 50%; border-bottom: 1px solid var(--gray-a3);"><p data-accent-color="gray" class="rt-Text rt-r-size-2 rt-r-weight-regular">Step</p></th><th class="rt-Box rt-r-px-4 rt-r-py-3" style="display: table-cell; border-bottom: 1px solid var(--gray-a3);"><p data-accent-color="gray" class="rt-Text rt-r-size-2 rt-r-weight-regular">Use Case</p></th></tr></thead><tbody><tr><td class="rt-Box rt-r-px-4 rt-r-py-2" style="display: table-cell; border-bottom: 1px solid var(--gray-a3); background-color: var(--gray-a2);"><p class="rt-Text rt-r-size-2">1</p></td><td class="rt-Box rt-r-px-4 rt-r-py-2" style="display: table-cell; border-bottom: 1px solid var(--gray-a3); background-color: var(--gray-a2);"><p class="rt-Text rt-r-size-2">App background</p></td></tr><tr><td class="rt-Box rt-r-px-4 rt-r-py-2" style="display: table-cell; border-bottom: 1px solid var(--gray-a3); background-color: transparent;"><p class="rt-Text rt-r-size-2">2</p></td><td class="rt-Box rt-r-px-4 rt-r-py-2" style="display: table-cell; border-bottom: 1px solid var(--gray-a3); background-color: transparent;"><p class="rt-Text rt-r-size-2">Subtle background</p></td></tr><tr><td class="rt-Box rt-r-px-4 rt-r-py-2" style="display: table-cell; border-bottom: 1px solid var(--gray-a3); background-color: var(--gray-a2);"><p class="rt-Text rt-r-size-2">3</p></td><td class="rt-Box rt-r-px-4 rt-r-py-2" style="display: table-cell; border-bottom: 1px solid var(--gray-a3); background-color: var(--gray-a2);"><p class="rt-Text rt-r-size-2">UI element background</p></td></tr><tr><td class="rt-Box rt-r-px-4 rt-r-py-2" style="display: table-cell; border-bottom: 1px solid var(--gray-a3); background-color: transparent;"><p class="rt-Text rt-r-size-2">4</p></td><td class="rt-Box rt-r-px-4 rt-r-py-2" style="display: table-cell; border-bottom: 1px solid var(--gray-a3); background-color: transparent;"><p class="rt-Text rt-r-size-2">Hovered UI element background</p></td></tr><tr><td class="rt-Box rt-r-px-4 rt-r-py-2" style="display: table-cell; border-bottom: 1px solid var(--gray-a3); background-color: var(--gray-a2);"><p class="rt-Text rt-r-size-2">5</p></td><td class="rt-Box rt-r-px-4 rt-r-py-2" style="display: table-cell; border-bottom: 1px solid var(--gray-a3); background-color: var(--gray-a2);"><p class="rt-Text rt-r-size-2">Active / Selected UI element background</p></td></tr><tr><td class="rt-Box rt-r-px-4 rt-r-py-2" style="display: table-cell; border-bottom: 1px solid var(--gray-a3); background-color: transparent;"><p class="rt-Text rt-r-size-2">6</p></td><td class="rt-Box rt-r-px-4 rt-r-py-2" style="display: table-cell; border-bottom: 1px solid var(--gray-a3); background-color: transparent;"><p class="rt-Text rt-r-size-2">Subtle borders and separators</p></td></tr><tr><td class="rt-Box rt-r-px-4 rt-r-py-2" style="display: table-cell; border-bottom: 1px solid var(--gray-a3); background-color: var(--gray-a2);"><p class="rt-Text rt-r-size-2">7</p></td><td class="rt-Box rt-r-px-4 rt-r-py-2" style="display: table-cell; border-bottom: 1px solid var(--gray-a3); background-color: var(--gray-a2);"><p class="rt-Text rt-r-size-2">UI element border and focus rings</p></td></tr><tr><td class="rt-Box rt-r-px-4 rt-r-py-2" style="display: table-cell; border-bottom: 1px solid var(--gray-a3); background-color: transparent;"><p class="rt-Text rt-r-size-2">8</p></td><td class="rt-Box rt-r-px-4 rt-r-py-2" style="display: table-cell; border-bottom: 1px solid var(--gray-a3); background-color: transparent;"><p class="rt-Text rt-r-size-2">Hovered UI element border</p></td></tr><tr><td class="rt-Box rt-r-px-4 rt-r-py-2" style="display: table-cell; border-bottom: 1px solid var(--gray-a3); background-color: var(--gray-a2);"><p class="rt-Text rt-r-size-2">9</p></td><td class="rt-Box rt-r-px-4 rt-r-py-2" style="display: table-cell; border-bottom: 1px solid var(--gray-a3); background-color: var(--gray-a2);"><p class="rt-Text rt-r-size-2">Solid backgrounds</p></td></tr><tr><td class="rt-Box rt-r-px-4 rt-r-py-2" style="display: table-cell; border-bottom: 1px solid var(--gray-a3); background-color: transparent;"><p class="rt-Text rt-r-size-2">10</p></td><td class="rt-Box rt-r-px-4 rt-r-py-2" style="display: table-cell; border-bottom: 1px solid var(--gray-a3); background-color: transparent;"><p class="rt-Text rt-r-size-2">Hovered solid backgrounds</p></td></tr><tr><td class="rt-Box rt-r-px-4 rt-r-py-2" style="display: table-cell; border-bottom: 1px solid var(--gray-a3); background-color: var(--gray-a2);"><p class="rt-Text rt-r-size-2">11</p></td><td class="rt-Box rt-r-px-4 rt-r-py-2" style="display: table-cell; border-bottom: 1px solid var(--gray-a3); background-color: var(--gray-a2);"><p class="rt-Text rt-r-size-2">Low-contrast text</p></td></tr><tr><td class="rt-Box rt-r-px-4 rt-r-py-2" style="display: table-cell; border-bottom: 1px solid var(--gray-a3); background-color: transparent;"><p class="rt-Text rt-r-size-2">12</p></td><td class="rt-Box rt-r-px-4 rt-r-py-2" style="display: table-cell; border-bottom: 1px solid var(--gray-a3); background-color: transparent;"><p class="rt-Text rt-r-size-2">High-contrast text</p></td></tr></tbody></table>

As Send's UI Library matures, the color palettes will likely get closer and closer to these ideals, so it's a good place to anchor your understanding.

To use themes effectively, let's take a look at an example

Let's take a look at Send's `<Card>` component

This code:

```tsx
<Card>
  <Card.Header>Send Header</Card.Header>
  Send Card Body
  <Card.Footer>Send Footer</Card.Footer>
</Card>
```

Produces this UI:

<div style="background-color: #081619; padding: 3rem; border-radius: 1rem;">
<div style="color:white;background-color: #111f22;"><div>Send Header</div>Send Card Body<div>Send Footer</div></div></div>

Nothing special, however we have a few takeaways from this.

1.  By default, the `<Card>` component softens it's background color, since mst likely, you will design a Card to stand out from the rest of the UI.
2.  The `<Card.Header>` and `<Card.Footer>` not only add padding, they also inherit the theme properties of the Card parent.

Let's see what happens when we add a theme to the Card.

```tsx
<Card theme={'green_alt2'}>
  <Card.Header>Send Header</Card.Header>
  Send Card Body
  <Card.Footer>Send Footer</Card.Footer>
</Card>
```

<div style="background-color: #081619; padding: 3rem; border-radius: 1rem;">
<div style="color:white;background-color: #12643F;color: #40FB50;"><div><div>Send Header</div></div>Send Card Body<div >Send Footer</div></div></div>

The Card now has a green background, and the text has also adapted this theme.

**SideNote:** You might notice this theme is pretty ugly. The design library is still in beta so there may be incomplete themes. This is one of those incomplete themes, put it works great as an example

Let's do another example, this time with a `<Button>`

Here's a default `<Button>`

```tsx
<Button>
  <ButtonText>Send</ButtonText>
</Button>
```

<div style="background-color: #081619; padding: 3rem; border-radius: 1rem;">
<button style="display: flex; align-items: center; flex-flow: row; flex-basis: auto; box-sizing: border-box; position: relative; min-height: 0px; min-width: 0px; flex-shrink: 0; padding-right: 18px; padding-left: 18px; height: 44px; border-top-left-radius: 16px; border-top-right-radius: 16px; border-bottom-right-radius: 16px; border-bottom-left-radius: 16px; justify-content: center; cursor: pointer; background-color: #111f22; border-color: transparent; border-width: 1px; border-style: solid;"><span style="color: white"><span>Send</span></span></button>
</div>

Adding a few themes will produce these results:

```tsx
<Button theme={'green'}>
  <ButtonText>Send</ButtonText>
</Button>
```

<div style="background-color: #081619; padding: 3rem; border-radius: 1rem;">
<button style="display: flex; align-items: center; flex-flow: row; flex-basis: auto; box-sizing: border-box; position: relative; min-height: 0px; min-width: 0px; flex-shrink: 0; padding-right: 18px; padding-left: 18px; height: 44px; border-top-left-radius: 16px; border-top-right-radius: 16px; border-bottom-right-radius: 16px; border-bottom-left-radius: 16px; justify-content: center; cursor: pointer; background-color: #40FB50; border-color: transparent; border-width: 1px; border-style: solid;"><span style="color: black"><span>Send</span></span></button>
</div>

```tsx
<Button theme={'red'}>
  <ButtonText>Send</ButtonText>
</Button>
```

<div style="background-color: #081619; padding: 3rem; border-radius: 1rem;">
<button style="display: flex; align-items: center; flex-flow: row; flex-basis: auto; box-sizing: border-box; position: relative; min-height: 0px; min-width: 0px; flex-shrink: 0; padding-right: 18px; padding-left: 18px; height: 44px; border-top-left-radius: 16px; border-top-right-radius: 16px; border-bottom-right-radius: 16px; border-bottom-left-radius: 16px; justify-content: center; cursor: pointer; background-color: #40FB50; border-color: transparent; border-width: 1px; border-style: solid;"><span style="color: hsl(357, 34.4%, 12.0%)"><span>Send</span></span></button>
</div>

```tsx
<Button theme={'ghost'} variant={'outlined'}>
  <ButtonText>Send</ButtonText>
</Button>
```

This is a great example of how themes can be used to create a consistent experience across the UI.
