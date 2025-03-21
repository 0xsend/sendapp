---
You are an expert in cross-platform development with React Native, Expo, TypeScript, React, PostgreSQL, Tamagui, Expo Router, tRPC, Solito, Supabase, and more. You possess deep knowledge of best practices and performance optimization techniques across these technologies. Our codebase is a shared Turborepo called "sendapp".

- Context:
  1. If the question explicitly mentions any of the tools or technologies listed above or pertains to the sendapp codebase, ensure your answer incorporates best practices relevant to the mentioned technologies.
  2. If the question is about frontend/backend without specific mentions, apply general best practices relevant to the context.
  3. If the question involves general TypeScript or other unrelated tasks, stick to general best practices.
  4. For follow-up questions unrelated to the technologies or content specified in these rules, the rules do not apply. Focus on answering the question without considering the specified best practices unless explicitly requested.

- Scope Consideration:
  - Avoid mixing best practices across domains (e.g., frontend best practices for backend questions and vice versa).
---

# Send App Monorepo Guidelines

## Table of Contents

### Introduction

- Purpose of the Document
- How to Use These Guidelines

### Shared Guidelines

- **Security**
- **Code Style and Structure**
- **Naming Conventions**
- **TypeScript Usage**
   - Function Parameters
   - TypeScript Configuration
- **Documentation Standards**
   - TSDoc Comments
   - Business Logic and Rules
- **Error Handling and Logging**

### Frontend Guidelines

- **React Native & Expo Best Practices**
   - Expo Best Practices
   - React Native Rendering Safety Rules
   - Using React Native With Tamagui
- **UI Components with Tamagui**
   - Tamagui UI Components (@my/ui)
   - Tamagui Props
   - Tamagui Styling
   - Styling with Tamagui Shorthands
   - Icon Usage with Lucide Icons
- **Tamagui Component Design Guidelines**
   - Tamagui Config
   - Compound Component Pattern
   - Cross-Platform Compatibility
   - Code Style and Structure
   - Example Component Structure
   - Best Practices
   - Guidelines for Code Generation
   - Inspiration from Radix UI
   - Additional Resources
- **Design System**
   - Typography
   - Text Alignment
   - Spacing Principles
   - Color
   - Button Semantics
   - Design Philosophy
- **Data Fetching with tRPC and React Query**
    - 10.1 Backend Definitions
    - 10.2 Frontend Consumption
    - 10.3 Caching and Performance
    - 10.4 Serverless Considerations
- **Project Structure and Feature Organization**
    - Organizing Code by Feature
    - Database Access and Type Safety
- **Routing**
    - Unified Routing with Solito
    - Handling Modals and Complex Navigation
    - Platform Specific Code With Solito

## Backend Guidelines

- **Server**

    - Serverless Considerations
    - Backend Definitions

- **Server Performance and Scalability**

    - Algorithm Complexity and Big O Notation
    - Linear Scaling

- **Serverless Best Practices**

    - Execution Limits

- **Security Best Practices**

    - Input Validation and Sanitization
    - Secure Data Handling
    - Enforcing Data Access Control

- **Testing and Quality Assurance**

    - Automated Testing
    - Integration Testing
    - End-to-End Testing

- **Database**
    - Relational Table Design Philosophy
    - Database Access and Type Safety
    - Naming Conventions
    - Functions
    - Constraints
    - Additional Resources

## Introduction

### Purpose of the Document

This document serves as a comprehensive guide for programming in this project. It outlines the coding standards, best practices, and architectural guidelines for the "sendapp" codebase. By adhering to these guidelines, the assistant can generate accurate, maintainable, and scalable code that aligns with our project's requirements.

### How to Use These Guidelines

- **For the Assistant (LLM)**: Use this document as a reference when generating code or providing suggestions. When a specific topic is discussed, refer to the relevant sections to ensure compliance with our standards and anticipate further needs.

- **Full-Stack Considerations**: As this is a full-stack project, features may involve both frontend and backend code. Be prepared to address and integrate guidelines from multiple sections as needed.

- **Continuous Reference**: Regularly consult this document during our interactions to provide precise solutions and maintain consistency throughout the codebase.

---

## Shared Guidelines

### Security

#### Sensitive Files

DO NOT read or modify:

-   .env files
-   \*_/config/secrets._
-   \*_/_.pem
-   Any file containing API keys, tokens, or credentials

#### Security Practices

-   Never commit sensitive files
-   Use environment variables for secrets
-   Keep credentials out of logs and output

### Code Style and Structure

- **TypeScript First**: Write clean, maintainable, and technically accurate TypeScript code.
- **Functional Programming**: Prioritize functional and declarative programming patterns; avoid using classes.
- **Modularization**: Emphasize iteration and modularization to follow DRY principles and minimize code duplication.
- **Readability**: Prioritize readability and simplicity over premature optimization.
- **No Placeholders**: Leave no to-do's, placeholders, or missing pieces in your code.
- **Clarify When Necessary**: Ask clarifying questions when necessary.

### Naming Conventions

- **PascalCase**: For components and screens (e.g., `MyComponent`).
- **kebab-case**: For routes (e.g., `reset-password.tsx`).
- **camelCase**: For functions and variables (e.g., `formatPriceToCents`).
- **Named Exports**: Prefer named exports for functions to maintain consistency and readability.

### TypeScript Usage

- **Full Typing**: Always show TypeScript types fully typed to enhance clarity and maintainability.
- **Types Over Interfaces**: Use `type` instead of `interface` for defining types for better extendability.
- **Type Inference**: Utilize type inference and avoid unnecessary type annotations where possible.

#### Function Parameters

- **Single Parameter Object**: When a function has multiple parameters, especially if they are of the same type or optional, use an object as a single parameter.
- **Destructure Parameters**: Destructure the object in the function signature.
- **Define Parameter Types**: Define an explicit type for the parameters.

Example:

```ts
type FetchUserParams = {
  userId: string
  includePosts?: boolean
}

async function fetchUser({ userId, includePosts = false }: FetchUserParams): Promise<User> {
  // Function implementation
}
```

#### TypeScript Configuration

Here is our base `tsconfig.base.json` for the entire project:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "rootDir": ".",
    "paths": {
      "@0xsend/webauthn-authenticator/*": ["./packages/webauthn-authenticator/src/*"],
      "@daimo/expo-passkeys/*": ["./packages/daimo-expo-passkeys/src/*"],
      "@my/contracts/*": ["./packages/contracts/out/*", "./packages/contracts/broadcast/*"],
      "@my/playwright/*": ["./packages/playwright/tests/*"],
      "@my/snaplet/*": ["./packages/snaplet/*"],
      "@my/supabase/*": ["./supabase/*"],
      "@my/ui/*": ["./packages/ui/src/*"],
      "@my/wagmi": ["./packages/wagmi/src"],
      "@my/wagmi/*": ["./packages/wagmi/src/*"],
      "@my/workflows/*": ["./packages/workflows/src/*"],
      "app/*": ["packages/app/*"]
    },
    "importHelpers": true,
    "allowJs": false,
    "allowSyntheticDefaultImports": true,
    "downlevelIteration": true,
    "esModuleInterop": true,
    "preserveSymlinks": true,
    "incremental": true,
    "module": "ESNext",
    "moduleResolution": "node",
    "forceConsistentCasingInFileNames": true,
    "noEmitOnError": false,
    "noImplicitAny": false,
    "noImplicitReturns": false,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "experimentalDecorators": true,
    "useUnknownInCatchVariables": false,
    "preserveConstEnums": true,
    "noUncheckedIndexedAccess": true,
    "strictNullChecks": true,
    // DONT DO THIS so jsdoc will remain
    "removeComments": false,
    "strict": true,
    "skipLibCheck": true,
    "typeRoots": ["node_modules/@types", "environment.d.ts", "globals.d.ts"],
    "sourceMap": false,
    "target": "ESNext",
    "types": ["node"],
    "jsx": "react-jsx",
    "lib": ["dom", "dom.iterable", "esnext"],
    "resolveJsonModule": true,
    "plugins": [
      {
        // docs: https://github.com/nderscore/tamagui-typescript-plugin#readme
        "name": "@nderscore/tamagui-typescript-plugin",
        "pathToApp": "apps/next"
      }
    ]
  },
  "exclude": ["_"],
  "typeAcquisition": {
    "enable": true
  }
}
```

### Documentation Standards

#### TSDoc Comments

Add TSDoc comments in the following scenarios:

- **Functions with Non-Obvious Purpose**: When a function's purpose isn't immediately clear from its name or implementation.
- **Functions Involving Business Logic**: Any function that contains business rules or processes specific to the application domain.
- **Complex Type Definitions**: For custom TypeScript types that are intricate or represent significant data structures.
- **Zod Schemas with Validation Logic**: When Zod schemas include important validation rules or business logic constraints.
- **Enums Representing Business States**: Enums that define states or conditions crucial to the application's operations.
- **Utility Functions and Custom Hooks**: Widely used utilities or hooks that have complex behavior or side effects.
- **Modules with Significant Logic**: Modules that handle critical operations or integrate with external services.
- **Important Constants and Configurations**: Constants or configuration objects that have a substantial impact on the application's behavior.
- **Edge Cases and Limitations**: Anywhere in the code where there are known edge cases, limitations, or assumptions to be aware of.
- **Functions Handling Errors or Exceptions**: Functions that implement custom error handling, retries, or exception management.
- **Performance-Critical Code**: Sections optimized for performance or with non-trivial algorithmic complexity.
- **Deprecated Code**: Code marked for deprecation, including reasons and suggested alternatives.
- **Third-Party Integrations**: Code interfacing with external APIs or services where specific implementation details are important.
- **Security-Sensitive Code**: Areas involving authentication, authorization, encryption, or other security-related logic.
- **Cross-Cutting Concerns**: Code that affects multiple parts of the application, such as logging, auditing, or event handling.
- **Concurrency and Asynchronous Operations**: Functions that involve threading, concurrency, or complex asynchronous flows.
- **Algorithm Implementations**: Functions implementing specific algorithms or mathematical computations.
- **Platform-Specific Behaviors**: Code that behaves differently across platforms (e.g., web vs. native).
- **Complex State Management**: In stateful components where the state logic is intricate.
- **Public APIs and Libraries**: If parts of your codebase are exposed as libraries or APIs for others to use.

When the TSDoc comment is not exposed to the public, include:

- **Purpose and Context**: Describe the purpose of the function and any relevant context.
- **Business Logic and Rules**: Document any business logic and rules discovered in our conversation, tagged as `@businessLogic`.
- **Edge Cases and Limitations**: Note any edge cases and limitations, tagged as `@edgeCases`.
- **Usage Examples**: Provide examples of usage where helpful.
- **Improvements**: Suggest potential improvements, tagged as `@improvements` (e.g., implement SAGA pattern, consider using Temporal in the future, or when using Supabase raw queries for example: use Drizzle ORM).

```ts
/**
- Fetches user data by ID.
-
- @param params - Object containing the user ID.
- @returns The user data.
-
- @businessLogic
- Retrieves user information from the database based on the provided ID.
-
- @edgeCases
- - Throws an error if the user ID is not provided.
- - Returns null if the user is not found.
-
- @improvements
- Future optimization could include caching user data to reduce database load.

async function fetchUser({ userId }: { userId: string }): Promise<User | null> {
// Function implementation
}
```

#### Business Logic and Rules

- **Document Specific Limits**: Include specific limits in documentation (e.g., "100 barcode limit due to 4MB serverless function constraint").
- **Note Decisions**: Clearly document any business logic decisions made (e.g., "As of 09/11/2024, we only deal with one variant per product. This could change in the future.").
- **Facilitate Future Searches**: Use consistent tags like `@businessLogic` to make future codebase searches easier.
- **User Experience Decisions**: Document any user experience decisions, including reasoning and expected outcomes.
- **Platform-Specific Behaviors**: Note any platform-specific behaviors or differences between native app and web implementations.

### Error Handling and Logging

- **Error Handling**: Always add proper error handling in your code to handle edge cases and unexpected inputs.
- **Logging**: Use our consistent logging structure for debugging and monitoring.

```ts
import debug from 'debug';

const log = debug('app:my-business-logic');

log('This is a log message');
```

---

## Frontend Guidelines

### React Native & Expo Best Practices

We use Expo - React Native for our mobile app.

#### Expo Best Practices

- **Functional Components**: Use functional components with hooks.
- **Expo SDK**: Utilize Expo SDK features and APIs.
- **Navigation**: Implement proper navigation using Expo Router.
- **Push Notifications**: Utilize Expo's push notification system. For improvement: suggest Knock a SaaS for push notifications.

#### React Native Rendering Safety Rules

All our code is shared; therefore, we need to be careful with rendering. What works on web might not work on mobile.

##### Conditional Rendering

- **Avoid Using `&&`**: Never use `&&` for conditional rendering.
- **Use Ternary Operator**: Always use the ternary operator (`condition ? <Component /> : null`).
- **Complex**: Use a `switch(true)` to handle all cases.

##### Text Wrapping Requirements

- **Wrap Text**: Always wrap raw strings or numbers in a `<Text>` component.

##### Edge Cases to Watch

- Numbers that might be `0` or `NaN`.
- Empty strings.
- Undefined or null values.
- Boolean expressions.

##### Common Patterns

- **Dangerous Pattern**: `{count && <Text>{count} items</Text>}` may crash when `count` is `0`.
- **Safe Pattern**: `{count > 0 ? <Text>{count} items</Text> : null}`.

#### Using React Native With Tamagui:

- **Non-working React Native views**: You can assume all "utility" views in React Native are not supported: Pressable, TouchableOpacity, and others. They have specific logic for handling events that conflicts with Tamagui. You can get all of Pressable functionality for the most part within Tamagui itself, and if you need something outside of it, you can use Pressable directly.

### UI Components with Tamagui

Our project leverages Tamagui UI, a collection of fully open-source, cross-platform compound components that can be styled or unstyled. Utilizing these pre-built components enhances consistency and accelerates development by reducing the need to design common UI elements from scratch.

All shared UI components are placed within the `ui` package:

- **Path**: `packages/ui` contains the custom UI kit created with Tamagui, optimized for cross-platform usage.

Importing works like this:

```ts
import {
  FormWrapper,
  XStack,
  Text,
  Card,
  Tabs,
  Avatar,
  Spinner,
  H2,
  ListItem,
  Card,
  TooltipSimple,
  Stack,
  Dialog,
  YStack,
  View,
  Paragraph,
  Text,
} from '@my/ui'
```

#### Tamagui UI Components (@my/ui)

Below is an overview of the available components that we should leverage whenever possible to maintain consistency and reduce development time:

- **Stacks**:

  - XStack, YStack, ZStack: Flexible layout components that extend from the View component in @tamagui/core, accepting all react-native-web View props and Tamagui style properties. Use XStack for horizontal layouts, YStack for vertical layouts, and ZStack for stacking elements on top of each other.
  - Gotcha: Ensure to use Tamagui's gap property for consistent spacing between children.

- **Typography**:

  - Headings (H1 to H6): Semantic heading components corresponding to HTML heading levels, allowing for consistent typography and accessibility.
  - Text: A versatile text component that supports rich styling and theming, extending the base Text component from @tamagui/core.

- **Forms**:

  - Button: A highly customizable button component supporting variants like size, color, and state (e.g., loading, disabled).
  - Checkbox: An accessible checkbox component with support for controlled and uncontrolled states.
  - Form: Provides a structured way to build forms with built-in validation and submission handling.
  - Input: A styled input component for text entry, supporting various input types and validation.
  - Label: An accessible label component that associates text labels with form controls.
  - Progress: A progress bar component indicating task completion, with support for determinate and indeterminate states.
  - RadioGroup: A group of radio buttons allowing the user to select one option from a set.
    - Each RadioGroup.Item must have a unique value prop for proper selection handling.
  - Select: A customizable dropdown component for single or multiple selections.
  - Slider: A component for selecting a value from a range by sliding a handle along a track.
  - Switch: A toggle switch component for binary on/off values.
  - ToggleGroup: A group of toggle buttons supporting single or multiple selection modes.

- **Panels**:
  AlertDialog: A modal dialog designed for urgent information or confirmation actions requiring user attention.

  - Dialog: A general-purpose modal for displaying content overlaying the current screen.
  - Gotcha: Manage focus appropriately when the dialog is open to ensure accessibility compliance.
  - Popover: A non-modal dialog that floats over content, typically used for contextual menus or additional information.
  - Sheet: A sliding panel component that appears from the edge of the screen, often used for options or settings.
  - Tooltip: Provides additional information when users hover over or focus on an element.
  - Toast: Displays transient notifications or messages to the user.

- **Organization**:

  - Accordion: A vertically stacked list of panels that can expand or collapse to reveal or hide content.
  - Group: A component to group related elements, often used to apply collective styling or behavior.
  - Tabs: Provides tabbed navigation, allowing users to switch between different views or sections.

- **Content**:

  - Avatar: Displays a user profile picture or icon, supporting various sizes and fallback options.
  - Card: A flexible container grouping related information, supporting images, text, and actions.
  - Image: An optimized image component with built-in support for responsive images and placeholders.
  - Gotcha: Always provide width and height props to prevent layout shifts during image loading.
  - ListItem: A component for displaying items in a list format, supporting icons, text, and interactive elements.

- **Visual Enhancements**:

  - LinearGradient: Applies a linear gradient background to its children, enhancing visual appeal.
  - Separator: A visual divider used to separate content either horizontally or vertically.
  - Shapes: Basic shape components like Circle and Square for creating geometric visuals.

- **Navigation and Links**:

  - Anchor: A link component that wraps the native a tag on web and supports navigation on native platforms.
  - Gotcha: Use Anchor for cross-platform linking to maintain consistent navigation behavior.
  - ScrollView: Provides scrollable content areas, supporting both vertical and horizontal scrolling.

- **Miscellaneous**:

  - Spinner: An animated loading indicator for asynchronous operations.
  - Unspaced: A utility component that removes spacing between its children, useful within Stack components with a gap.
  - VisuallyHidden: Renders content that is visually hidden but accessible to screen readers, enhancing accessibility.
  - HtmlElements: Access to common HTML elements with Tamagui styling applied.

          Notes

    When using these components, refer to the Tamagui documentation for detailed usage instructions and best practices. Leveraging these pre-built components ensures consistency in the UI and saves development time by avoiding the need to build common elements from scratch.

---

#### Tamagui Props

Tamagui components support a superset of the React Native props, adding additional style and utility props that enhance the styling capabilities and customization options.

#### Base Components

- **View and Text**: Start with Tamagui's View and Text components, which extend the base React Native components with additional styling properties.

#### Extended Props

Below are the additional non-style props that Tamagui adds to enhance styling and behavior:

- animation (string): Apply an animation defined in your createTamagui configuration.
- animateOnly (string[]): Specify a list of properties to animate. Note that flat transforms can only be controlled via transform.
- theme (string): Apply a theme or sub-theme to the component and its descendants.
- themeInverse (boolean): Invert the light or dark theme for the component's subtree.
- themeShallow (boolean): Use in combination with the theme prop to prevent the theme from passing down to children.
- forceStyle ('hover' | 'press' | 'focus' | 'focusVisible'): Force a pseudo style state to be active.
- hitSlop (number | { top: number; bottom: number; left: number; right: number }): Extend the touchable area beyond the component's bounds.
- group (boolean | string): Marks the component as a group for styling purposes, allowing child components to style based on the parent group.
- componentName (string): Equivalent to the name property on styled(), used for automatically applying a theme.
- className (string): (Web Only) An escape hatch to set a custom className. Tamagui's compiler will concatenate your className with generated ones.
- disableClassName (boolean): (Web Only) Disables className output, using only inline styles.
- tag (string): (Web Only) Renders the component as a specific HTML tag. Note that React Native Web doesn't support the tag prop with certain animation drivers.
- debug (boolean | 'verbose' | 'break'): Outputs debugging information during rendering. 'verbose' provides more details, 'break' triggers a debugger breakpoint at the start of rendering in development mode.
- untilMeasured ('hide' | 'show'): Works with group to control visibility until the parent is measured.
- disableOptimization (boolean): Disables all compiler optimizations for the component.
- tabIndex (string | number): Controls the keyboard navigation order.
- role (string): Indicates the accessibility role of the component for assistive technologies.
- asChild (boolean | 'except-style' | 'except-style-web' | 'web'): When true, Tamagui expects a single child element, and will pass all props to that child instead of rendering its own element. The except-style variants control how styles are passed down.

#### Styling Enhancements

Tamagui allows style props to be added directly to components, integrating them closely with the component's behavior and appearance. This includes all the standard React Native style properties, along with Tamagui's extended styling capabilities.

Key Points:

- Direct Styling: Apply styles directly as props on components without needing separate style sheets.
- Responsive Styles: Use Tamagui's media query hooks and responsive styling props to adapt components to different screen sizes.
- Theming: Utilize the theme prop and theming capabilities to maintain visual consistency and easily switch themes across the application.

```tsx
import { Button } from '@my/ui'

export const ThemedButton = () => (
  <Button theme="dark" animation="bouncy" onPress={() => console.log('Button pressed')}>
    Click Me
  </Button>
)
```

In this example:

- The Button component uses the dark theme.
- An animation called bouncy is applied when interacting with the button.
  Event handlers like onPress function as expected.

#### Tamagui Styling

- **Responsive and Parent-Based Styling**: Tamagui supports various ways to style components based on parent properties like media queries, themes, platforms, and groups.

- **Media Queries**: Based on the media queries defined in your createTamagui configuration, you can use them to apply responsive styles using the `$` prefix.

Example:

```tsx
<Text col="red" $sm={{ col: 'blue' }} />
```

- **Theme-Based Styles**: Apply styles based on the current theme using the `$theme` prefix.

Example:

```tsx
<Text $theme-dark={{ color: 'white' }} />
```

- **Platform-Based Styles**: Apply styles based on the current platform using the `$platform` prefix.

Example:

```tsx
<Text $platform-web={{ color: 'red' }} />
```

- **Group-Based Styles**: Apply styles based on the parent group using the `$group` prefix.

Example:

```tsx
<View group="header">
  <Text $group-header={{ color: 'white' }} />
</View>
```

- The Text component will have color: white when it's inside a parent View with group="header".
- You can also target parent pseudo states:

```tsx
<View group>
  <Text $group-hover={{ color: 'green' }} />
</View>
```

Group Container Queries

- **Style components based on the size of their parent container**.

Example:

```tsx
<View group>
  <Text $group-sm={{ color: 'white' }} $group-sm-hover={{ color: 'green' }} />
</View>
```

- The Text component will have color: white when the parent View matches the sm media query.
- It changes to color: green when the parent View is hovered in the sm media query range.
- Note: On Native platforms, use the untilMeasured prop to handle measurement timing for group container queries.

#### Style Order and Overrides

- In Tamagui, the order of style props is important because later props can override earlier ones. This order-sensitive approach allows for precise control over styles and helps avoid conflicts.

Example:

```tsx
const CalHeader = styled(Text, {
  variants: {
    isHero: {
      true: {
        fontSize: 36,
        backgroundColor: 'blue',
        color: 'white',
      },
    },
  },
})

export const MyCalendar = (props: { isHero?: boolean; headerFontSize?: number }) => {
  return (
    <>
      {/* ... other components ... */}
      <CalHeader isHero={props.isHero} fontSize={props.headerFontSize}>
        {monthName}
      </CalHeader>
    </>
  )
}
```

In this example:

- The CalHeader component has an isHero variant that sets multiple styles.
- The fontSize prop is applied after isHero, allowing it to override the fontSize defined in the isHero variant.

- The order of props determines which styles take precedence.

#### Best Practices

- Consistency: Use shorthands defined in your Tamagui configuration to maintain consistency.
- Order Matters: Be mindful of the order of props to control style overrides effectively.
- Responsive Design: Leverage media queries and responsive styling to adapt to different screen sizes.

---

Refer to the next section for details on using Tamagui's styling shorthands to write more concise and readable style definitions.

---

#### Styling with Tamagui Shorthands

Use Tamagui's shorthands to make style definitions more concise and expressive.

- **Purpose**: Shorthands represent common style properties with shorter aliases.
- **Benefits**: Enhances code readability and consistency across the codebase.

```ts
// Common Shorthands
export const shorthands = {
  // web-only
  ussel: 'userSelect',
  cur: 'cursor',

  // tamagui
  pe: 'pointerEvents',

  // text
  col: 'color',
  ff: 'fontFamily',
  fos: 'fontSize',
  fost: 'fontStyle',
  fow: 'fontWeight',
  ls: 'letterSpacing',
  lh: 'lineHeight',
  ta: 'textAlign',
  tt: 'textTransform',
  ww: 'wordWrap',

  // view
  ac: 'alignContent',
  ai: 'alignItems',
  als: 'alignSelf',
  b: 'bottom',
  bc: 'backgroundColor',
  bg: 'backgroundColor',
  bbc: 'borderBottomColor',
  bblr: 'borderBottomLeftRadius',
  bbrr: 'borderBottomRightRadius',
  bbw: 'borderBottomWidth',
  blc: 'borderLeftColor',
  blw: 'borderLeftWidth',
  boc: 'borderColor',
  br: 'borderRadius',
  bs: 'borderStyle',
  brw: 'borderRightWidth',
  brc: 'borderRightColor',
  btc: 'borderTopColor',
  btlr: 'borderTopLeftRadius',
  btrr: 'borderTopRightRadius',
  btw: 'borderTopWidth',
  bw: 'borderWidth',
  dsp: 'display',
  f: 'flex',
  fb: 'flexBasis',
  fd: 'flexDirection',
  fg: 'flexGrow',
  fs: 'flexShrink',
  fw: 'flexWrap',
  h: 'height',
  jc: 'justifyContent',
  l: 'left',
  m: 'margin',
  mah: 'maxHeight',
  maw: 'maxWidth',
  mb: 'marginBottom',
  mih: 'minHeight',
  miw: 'minWidth',
  ml: 'marginLeft',
  mr: 'marginRight',
  mt: 'marginTop',
  mx: 'marginHorizontal',
  my: 'marginVertical',
  o: 'opacity',
  ov: 'overflow',
  p: 'padding',
  pb: 'paddingBottom',
  pl: 'paddingLeft',
  pos: 'position',
  pr: 'paddingRight',
  pt: 'paddingTop',
  px: 'paddingHorizontal',
  py: 'paddingVertical',
  r: 'right',
  shac: 'shadowColor',
  shar: 'shadowRadius',
  shof: 'shadowOffset',
  shop: 'shadowOpacity',
  t: 'top',
  w: 'width',
  zi: 'zIndex',
} as const
```

Best Practices

- Consistency: Always use the defined shorthands when styling components to maintain consistency.
- Platform Specificity: Use platform-specific styles when necessary, leveraging Tamagui's platform targeting ($platform-web, $platform-native).
- Prop Ordering and Overrides:
  - Order Matters: In Tamagui, the order of props is important because later props can override earlier ones.

```tsx
<Stack
  w="100%"
  gap="$4"
  mt="$6"
  mx="auto"
  $gtSm={{
    fd: 'row',
    ai: 'center',
    jc: 'center',
    gap: '$4',
  }}
>
  {/* Children */}
</Stack>
```

In this example:

- The base props (`w`, `gap`, `mt`, `mx`) set the default styles.
- The `$gtSm` media query applies styles when the screen size is greater than small.
- Properties inside `$gtSm` can override base props. For instance, `$gtSm={{ gap: '$4' }}` will set `gap` to `$4` on larger screens, even if `gap` was set previously.

#### Icon Usage with Lucide Icons

Use Lucide Icons for consistent and visually appealing iconography across the application.

```tsx
import { Button } from 'tamagui'
import { Plus } from '@tamagui/lucide-icons'

export const ExampleButton = () => <Button icon={Plus}>Add Item</Button>
```

### Tamagui Component Design Guidelines

When developing UI components with Tamagui, adhere to the following guidelines.

#### Tamagui Config

Our Tamagui Config:

```ts
export const config = createTamagui({
  themes,
  defaultFont: 'body',
  animations,
  shouldAddPrefersColorThemes: true,
  themeClassNameOnRoot: true,
  shorthands,
  fonts: {
    heading: headingFont,
    body: bodyFont,
    mono: process.env.NODE_ENV === 'test' && monoFont === undefined ? bodyFont : monoFont, // monoFont doesn't work in jest tests for some reason
  },
  tokens: createTokens({
    color,
    radius,
    zIndex,
    space,
    size,
  }),
  media,
})
```

The createTamagui function receives a configuration object, some explanations:

```ts
tokens: Variables for our theme and app
theme: A design theme which map to CSS properties. D
media: Reusable responsive media queries.
shorthands: Props that expand to style value
onlyAllowShorthands: We ony allow shorthands for consistency, overwriting existing long-form style props.
```

#### Compound Component Pattern

- **Structure Components**: Build components using the compound component pattern, similar to Radix UI primitives.
- **Benefits**:
  - Promotes reusability and composability.
  - Allows for better organization and scalability.
  - Facilitates advanced features like context sharing between sub-components.

#### Cross-Platform Compatibility

- **Design for Multiple Platforms**: Ensure components work seamlessly across web and React Native platforms.
- **Native Optimization**: Official Tamagui components might be optimized for native use by using a `native` prop.

##### Tamagui Component Code Style and Structure

When developing UI components with Tamagui, adhere to the following guidelines to maintain consistency, enhance modularity, and ensure cross-platform compatibility.

##### Extending Components with styled()

- **Use styled() Function**: Utilize Tamagui's styled() function to create new components by extending existing ones. This promotes code reuse and ensures consistent styling across the application.

Example:

```tsx
import { styled, View } from '@tamagui/core'

export const RoundedSquare = styled(View, {
  borderRadius: 20,
})
```

In this example, RoundedSquare is a new component that extends the base View component, adding a borderRadius of 20.

- **Add Variants for Flexibility**: Enhance components by adding variants to handle different styling scenarios based on props.

Example:

```tsx
import { styled, View } from '@tamagui/core'

export const RoundedSquare = styled(View, {
  borderRadius: 20,

  variants: {
    size: {
      small: {
        width: 50,
        height: 50,
      },
      medium: {
        width: 100,
        height: 100,
      },
      large: {
        width: 150,
        height: 150,
      },
    },
    color: {
      red: { backgroundColor: 'red' },
      blue: { backgroundColor: 'blue' },
      green: { backgroundColor: 'green' },
    },
  },

  defaultVariants: {
    size: 'medium',
    color: 'blue',
  },
})
```

Usage:

```tsx
<RoundedSquare size="large" color="red" />
```

Here, RoundedSquare uses variants to adjust its size and color based on the provided props.

Order of Style Props is Important: Be mindful of the order in which style props and variants are applied.

- Later props override earlier ones.
- This is crucial when variants expand into multiple style properties.

```tsx
<RoundedSquare size="large" width={200} />
```

In the example above, the explicit `width={200}` prop overrides the width set by the size variant.

##### Creating Compound Components

- **Compound Component Pattern**: Structure components using the compound component pattern, allowing multiple sub-components to share context and variants.

```tsx
import { createStyledContext, styled, YStack, Text, withStaticProperties } from '@tamagui/core'

const ButtonContext = createStyledContext<{ size: 'small' | 'medium' | 'large' }>({
  size: 'medium',
})

const ButtonFrame = styled(YStack, {
  name: 'Button',
  context: ButtonContext,

  variants: {
    size: {
      small: {
        p: 8,
      },
      medium: {
        p: 12,
      },
      large: {
        p: 16,
      },
    },
  },

  defaultVariants: {
    size: 'medium',
  },
})

const ButtonText = styled(Text, {
  name: 'ButtonText',
  context: ButtonContext,

  variants: {
    size: {
      small: {
        fos: 14,
      },
      medium: {
        fos: 16,
      },
      large: {
        fos: 18,
      },
    },
  },

  defaultVariants: {
    size: 'medium',
  },
})

const Button = withStaticProperties(ButtonFrame, {
  Text: ButtonText,
})

export { Button }
```

Usage:

```tsx
<Button size="large">
  <Button.Text>Click Me</Button.Text>
</Button>
```

The size prop is shared between Button and Button.Text through ButtonContext.
Variants ensure that both components adjust their styles based on the shared size.

##### Styleable Components

- **Making Custom Components Styleable**: When creating higher-order or custom functional components, wrap them with `.styleable()` to ensure they can be styled and have variants applied correctly.

```tsx
import { styled, Text } from '@tamagui/core'

const StyledText = styled(Text, {
  color: 'black',
})

const CustomText = StyledText.styleable((props, ref) => <StyledText ref={ref} {...props} />)

const EnhancedText = styled(CustomText, {
  color: 'blue',
  variants: {
    emphasis: {
      true: {
        fontWeight: 'bold',
      },
    },
  },
})
```

- Wrapping with .styleable() allows CustomText to be further styled and have new variants added.
  -Style props and variants merge correctly across components.

##### Variants

When developing UI components with Tamagui, variants are a powerful feature that allow you to handle different styling scenarios based on props efficiently and type-safely. Variants enable you to define conditional styles that can be applied based on the values of component props, facilitating the creation of highly customizable and reusable components.

Use the variants field within the styled() function to define conditional styling based on component props.

```tsx
import { styled, YStack } from 'tamagui'

export const Button = styled(YStack, {
  name: 'Button',
  variants: {
    size: {
      small: {
        padding: '$2',
      },
      medium: {
        padding: '$4',
      },
      large: {
        padding: '$6',
      },
    },
    variant: {
      primary: {
        backgroundColor: '$blue10',
      },
      secondary: {
        backgroundColor: '$gray10',
      },
    },
    disabled: {
      true: {
        opacity: 0.5,
      },
    },
  },
  defaultVariants: {
    size: 'medium',
    variant: 'primary',
  },
})
```

In this example:

- Variants are defined for size, variant, and disabled props.
- The size variant adjusts padding based on the provided size value.
- The variant variant changes the background color.
- The disabled variant applies styles when the disabled prop is true.
- Default Variants are set to medium size and primary variant.

Types of Variants:

Boolean Variants: Use true and false keys to create variants that accept boolean props.

```tsx
const MyComponent = styled(YStack, {
  variants: {
    isActive: {
      true: {
        opacity: 1,
      },
      false: {
        opacity: 0.5,
      },
    },
  },
})
```

Value Variants: You can use a pseudo Typescript syntax for other variants:

- :string - Accepts a string
- :boolean - Accepts a boolean (less precedence than true or false)
- :number - Accepts a number

```tsx
import { View, styled } from 'tamagui' // or '@tamagui/core'

export const ColorfulView = styled(View, {
  variants: {
    color: {
      ':string': (color) => {
        // color is of type "string"
        return {
          color,
          borderColor: color,
        }
      },
    },
  } as const,
})
```

Spread Variants: Use spread variants to accept all keys from a token category. This reduces the need to define each value explicitly and ensures consistency with your theme tokens.

```tsx
const Spacer = styled(YStack, {
  variants: {
    space: {
      '...size': (size) => ({
        height: size,
        width: size,
      }),
    },
  },
})
```

In this example, Spacer accepts any value from the size tokens.

Spread variants save you from having to define hardcoded styles for every key (sm, md, lg) in your token object. They collect values from any of your top level token categories. So you can only use ...color, ...size, ...space, ...font, ...fontSize, ...lineHeight, ...radius, ...letterSpace, or ...zIndex. They must be prefixed with ... as that is how they are typed properly and assembled for runtime.

Extra properties passed to functional variants

There's a second argument passed to all variant functions that is a bag-o-goodies that help you use the current tokens, theme, props, and fonts easily.

```tsx
const SizableText = styled(Text, {
  variants: {
    size: {
      '...size': (size, { tokens, font }) => {
        return {
          fontSize: font?.size,
          lineHeight: font?.lineHeight,
          height: tokens.size[size] ?? size,
        }
      },
    },
  } as const,
})
```

Which you can use:

```tsx
<SizableText size="$md">Hello world</SizableText>
```

The Spread variant function will receive two arguments: the first is the value given to the property ("$lg"), and the second is an object with { theme, tokens, props, font }.

- Catch-all variants
  Much like a dynamic variant, except it lets you use it alongside the other typed variants you need. Use '...' and it will grab all variants that don't match:

```tsx
import { View, styled } from 'tamagui' // or '@tamagui/core'

export const ColorfulView = styled(View, {
  variants: {
    colorful: {
      true: {
        color: 'red',
      },
      '...': (val: string) => {
        // this will catch any other values that don't match
        return {
          color: val,
        }
      },
    },
  } as const,
})
```

Dynamic variants

For shorter syntax: use a single function instead of using the object syntax for variants:

```tsx
import { View, styled } from 'tamagui' // or '@tamagui/core'

export const MyView = styled(View, {
  variants: {
    doubleMargin: (val: number) => ({
      margin: val * 2,
    }),
  } as const,
})
```

defaultVariants

Sometimes you'd like to set a default value for a variant you've just set on your styled() component. Due to the way Typescript types parse from left to right, we can't properly type variants directly on the object you define them on.

```tsx
const Square = styled(View, {
  variants: {
    size: {
      '...size': (size, { tokens }) => {
        // size === '$lg'
        // tokens.size.$lg === 25
        return {
          width: tokens.size[size] ?? size,
          height: tokens.size[size] ?? size,
        }
      },
    },
  } as const,

  // <Square /> will get size '$10' from size tokens automatically
  defaultVariants: {
    size: '$10',
  },
})
```

Variants and Pseudos, Media Queries

Variants have the full power of the Tamagui styling system, including pseudo and media styles:

```tsx
const SizedText = styled(Text, {
  variants: {
    size: {
      md: {
        fontSize: '$sm',

        $gtMd: {
          fontSize: '$md',
        },

        $gt2xl: {
          fontSize: '$lg',
        },
      },
    },
  } as const,
})
```

Variants and Parent Variants

Styled components can access their parent components variants, even in their variants:

```tsx
const ColorfulText = styled(Text, {
  variants: {
    colored: {
      true: {
        color: '$color',
      },
    },

    large: {
      true: {
        fontSize: '$8',
      },
    },
  } as const,
})

const MyParagraph = styled(ColorfulText, {
  colored: true,

  variants: {
    hero: {
      true: {
        large: true,
      },
    },
  } as const,
})
```

#### Example Component Structure

```tsx
import { createContext, useContext, ReactNode } from 'react'
import { styled, YStack, ThemeableStackProps, withStaticProperties } from 'tamagui'

type MyComponentContextValue = {
  /* define shared context values */
}

const MyComponentContext = createContext<MyComponentContextValue | undefined>(undefined)

const MyComponentFrame = styled(YStack, {
  /* base styles */
})

type MyComponentProps = ThemeableStackProps & {
  children: ReactNode
  /* additional props */
}

const MyComponent = ({ children, ...props }: MyComponentProps) => {
  const contextValue: MyComponentContextValue = {
    /* provide context values */
  }

  return (
    <MyComponentContext.Provider value={contextValue}>
      <MyComponentFrame {...props}>{children}</MyComponentFrame>
    </MyComponentContext.Provider>
  )
}

/* Sub-components */

const MyComponentHeader = styled(YStack, {
  /* header styles */
})

const MyComponentBody = styled(YStack, {
  /* body styles */
})

const MyComponentFooter = styled(YStack, {
  /* footer styles */
})

/* Assign sub-components */

const MyCompoundComponent = withStaticProperties(MyComponent, {
  Header: MyComponentHeader,
  Body: MyComponentBody,
  Footer: MyComponentFooter,
})

export { MyCompoundComponent }
```

#### Best Practices

- **Accessibility**: Implement accessibility features, ensuring components are usable with screen readers and adhere to WAI-ARIA guidelines.
- **Theming and Tokens**: Utilize design tokens and theming to maintain visual consistency and enable easy customization.
- **Responsive Design**: Make use of `useMedia` and responsive styling props to ensure components adapt to different screen sizes and orientations.
- **Platform-Specific Code**: When necessary, use platform checks (`$platform-web`, `$platform-native`) within styled components.

#### Guidelines for Code Generation

When generating Tamagui components:

- **Emphasize Compound Components**: Structure components using the compound component pattern for enhanced modularity.
- **Leverage Tamagui Features**:
  - Use `styled()` for creating styled components.
  - Define variants to handle prop-based styling variations.
  - Apply Tamagui's shorthands for concise styling.
- **Cross-Platform Design**: Ensure components function correctly on both web and React Native.
- **Consistency**: Follow established code style guidelines.

#### Inspiration from Radix UI

- **Customizability**: Allow components to be easily customized and extended.
- **Incremental Adoption**: Structure components so they can be adopted incrementally within the codebase.

### Design System

The design system aims to systematize everything to accelerate development and reduce decision fatigue.

#### Typography

- **Standard Type Scale**: Use Tamagui's standard type scale for fonts.
- **Hierarchy Without Font Size**:
  - Avoid overusing font size for hierarchy.
  - Use font weight and color adjustments.
  - Avoid light font weights under 400 for UI elements.

#### Text Alignment

- **Left-Align Long Text**: Do not center long-form text (longer than 2-3 lines).
- **Right-Align Numbers in Tables**: For improved readability.

#### Spacing Principles

- **Consistent Spacing**: Maintain equal spacing throughout the interface.
- **Padding and Margin**:
  - **Prefer Top-Only Spacing**: Add padding and margin to the top of elements.
  - **External Spacing**: Do not include margins within components; wrap components in a `Stack` where spacing is defined.
  - **Logical Margins**: Follow logical margin values (e.g., `mt="$1"` for spacing between inputs and labels).
  - **Use of `gap`**: Prefer using the `gap` property for spacing between elements.
  - **Avoid Horizontal Margins**: Prevent layout issues on small devices.
- **Responsive Design**: Ensure spacing adjusts appropriately across different screen sizes.

```ts
// The spacing and size system is purposefully non-linear to account for different UI needs:
//
// - **Sizes < 1**: Used for fine-grained adjustments like borders and the smallest padding (paddingY).
//   - Small paddingY values (~1-4px) should align with lineHeight to maintain visual harmony.
//
// - **Sizes >= 1**: Designed with "pressability" in mind.
//   - Button and input heights, as well as other interactive elements, require larger increments for accessibility and usability.
//
// - **Sizes > 10**: These are primarily for headings (e.g., H1) and other large elements.
//   - After size 10, increments become steeper to accommodate the needs of larger-scale elements naturally.
//
// **Additional considerations**:
// - **Space and size are interdependent**: Space values are generally set as a fraction (~1/3 to 2/3) of the corresponding size.
// - This ensures consistent visual scaling between element sizes, spacing, and overall layout.
//
// The goal is to balance small adjustments, usability for interactive elements, and natural scaling for typography and spacing across the design system.
export const size = {
  $0: 0,
  '$0.25': 2,
  '$0.5': 4,
  '$0.75': 8,
  $1: 20,
  '$1.5': 24,
  $2: 28,
  '$2.5': 32,
  $3: 36,
  '$3.5': 40,
  $4: 44,
  $true: 44,
  '$4.5': 48,
  $5: 52,
  $6: 64,
  $7: 74,
  $8: 84,
  $9: 94,
  $10: 104,
  $11: 124,
  $12: 144,
  $13: 164,
  $14: 184,
  $15: 204,
  $16: 224,
  $17: 224,
  $18: 244,
  $19: 264,
  $20: 284,
}

export type SizeKeysIn = keyof typeof size
export type Sizes = {
  [Key in SizeKeysIn extends `$${infer Key}` ? Key : SizeKeysIn]: number
}
export type SizeKeys = `${keyof Sizes extends `${infer K}` ? K : never}`
```

Token Space

```ts
import { SizeKeys, Sizes, size } from './token-size'

const spaces = Object.entries(size).map(([k, v]) => {
  return [k, sizeToSpace(v)] as const
})

// a bit odd but keeping backward compat for values >8 while fixing below
function sizeToSpace(v: number) {
  if (v === 0) return 0
  if (v === 2) return 0.5
  if (v === 4) return 1
  if (v === 8) return 1.5
  if (v <= 16) return Math.round(v * 0.333)
  return Math.floor(v * 0.7 - 12)
}

const spacesNegative = spaces.slice(1).map(([k, v]) => [`-${k.slice(1)}`, -v])

type SizeKeysWithNegatives =
  | Exclude<`-${SizeKeys extends `$${infer Key}` ? Key : SizeKeys}`, '-0'>
  | SizeKeys

export const space: {
  [Key in SizeKeysWithNegatives]: Key extends keyof Sizes ? Sizes[Key] : number
} = {
  ...Object.fromEntries(spaces),
  ...Object.fromEntries(spacesNegative),
}
```

#### Colors

```ts
import {
  blue,
  blueDark,
  gray,
  grayDark,
  green,
  greenDark,
  orange,
  orangeDark,
  pink,
  pinkDark,
  purple,
  purpleDark,
  red,
  redDark,
  yellow,
  yellowDark,
} from './colors'

export {
  darkColor,
  darkPalette,
  darkTransparent,
  lightColor,
  lightPalette,
  lightTransparent,
} from './colors'

export const colorTokens = {
  light: {
    blue,
    gray,
    green,
    orange,
    pink,
    purple,
    red,
    yellow,
  },
  dark: {
    blue: blueDark,
    gray: grayDark,
    green: greenDark,
    orange: orangeDark,
    pink: pinkDark,
    purple: purpleDark,
    red: redDark,
    yellow: yellowDark,
  },
}

export const darkColors = {
  ...colorTokens.dark.blue,
  ...colorTokens.dark.gray,
  ...colorTokens.dark.green,
  ...colorTokens.dark.orange,
  ...colorTokens.dark.pink,
  ...colorTokens.dark.purple,
  ...colorTokens.dark.red,
  ...colorTokens.dark.yellow,
}

export const lightColors = {
  ...colorTokens.light.blue,
  ...colorTokens.light.gray,
  ...colorTokens.light.green,
  ...colorTokens.light.orange,
  ...colorTokens.light.pink,
  ...colorTokens.light.purple,
  ...colorTokens.light.red,
  ...colorTokens.light.yellow,
}

export const color = {
  white0: 'rgba(255,255,255,0)',
  white075: 'rgba(255,255,255,0.75)',
  white05: 'rgba(255,255,255,0.5)',
  white025: 'rgba(255,255,255,0.25)',
  black0: 'rgba(10,10,10,0)',
  black075: 'rgba(10,10,10,0.75)',
  black05: 'rgba(10,10,10,0.5)',
  black025: 'rgba(10,10,10,0.25)',
  white1: '#fff',
  white2: '#f8f8f8',
  white3: 'hsl(0, 0%, 96.3%)',
  white4: 'hsl(0, 0%, 94.1%)',
  white5: 'hsl(0, 0%, 92.0%)',
  white6: 'hsl(0, 0%, 90.0%)',
  white7: 'hsl(0, 0%, 88.5%)',
  white8: 'hsl(0, 0%, 81.0%)',
  white9: 'hsl(0, 0%, 56.1%)',
  white10: 'hsl(0, 0%, 50.3%)',
  white11: 'hsl(0, 0%, 42.5%)',
  white12: 'hsl(0, 0%, 9.0%)',
  black1: '#1a1a1a',
  black2: '#151515',
  black3: '#191919',
  black4: '#232323',
  black5: '#282828',
  black6: '#323232',
  black7: '#424242',
  black8: '#494949',
  black9: '#545454',
  black10: '#626262',
  black11: '#a5a5a5',
  black12: '#fff',
  ...postfixObjKeys(lightColors, 'Light'),
  ...postfixObjKeys(darkColors, 'Dark'),
}

export function postfixObjKeys<A extends { [key: string]: string }, B extends string>(
  obj: A,
  postfix: B
): {
  [Key in `${keyof A extends string ? keyof A : never}${B}`]: string
} {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [`${k}${postfix}`, v])) as any
}
```

#### Button Semantics

- **Hierarchy of Actions**:
  - **Primary Actions**: Prominent with solid, high-contrast backgrounds.
  - **Secondary Actions**: Clear but less prominent, using outline styles.
  - **Tertiary Actions**: Discoverable yet unobtrusive, often styled like links.
- **Button Semantics vs. Hierarchy**: Style buttons based on their importance within the hierarchy.
- **Responsive Layout**:

  - **Adaptive Stacking**: Stack buttons based on screen size.

- **Clear Call-to-Actions**:
  - Avoid using "Yes" or "No" as button text.
  - Use explicit actions like "Delete Item" or "Save Changes".

#### Design Philosophy

- **Systematization**: Establish systems and patterns.
- **Consistency**: Maintain consistent use of components, styles, and spacing.
- **Accessibility**: Ensure compliance with accessibility standards.
- **Responsive Design**: Design components and layouts that adapt smoothly to various screen sizes.
- **Visual Hierarchy**: Use font size, weight, and color to establish clear hierarchy.
- **Avoid Clutter**: Ensure clear and understandable interfaces.

---

### Data Fetching with tRPC and React Query

Use tRPC in combination with React Query for type-safe data fetching and efficient state management. Define all queries and mutations on the backend using tRPC to maintain consistency and avoid dependency on Supabase RLS, only when necessary.

#### 10.1 Frontend Consumption

- **Generated Hooks**: Consume these queries and mutations on the frontend via generated hooks from tRPC.
- **API Client**: `packages/app/utils/api.ts` is the client for all API requests. We use a similar pattern for native, `packages/app/utils/api.native.ts`.

```ts
export const api =  createTRPCNext<AppRouter>({
  config() {
    return {
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          transformer: SuperJSON,
        }),
      ],
    }
  },
  transformer: SuperJSON,
  /**
   * @link https://trpc.io/docs/ssr
   **/
  ssr: false,
})
```

#### 10.2 Caching and Performance

- **React Query's Caching**: Utilize caching to optimize performance and enhance the user experience.
- **Cache Invalidation**: Use `api.useUtils()` to access React Query's and tRPC cache management methods. (trpc.io/docs/client/react/useUtils)
- **Performance Optimization**: Optimize data fetching strategies to reduce unnecessary network requests.

### Project Structure and Feature Organization

Our codebase follows a feature-based vertical slice architecture to enhance modularity, scalability, and maintainability.

#### Organizing Code by Feature

Features are self-contained units that encapsulate all related code.

- **Encapsulate Feature Logic**: Place all related code within the `packages/app/features` directory.
- **Avoid Global State**: Keep state management within the feature when possible.

**Example Feature Structure**:

```
packages/app/features/create/
├── constants.ts
├── hooks.ts
├── utils.ts
├── types.ts
├── screen.tsx
├── useCreateContextMenu.tsx
```

#### 12. Routing

Our application utilizes Solito to achieve unified routing across both web (Next.js) and native (Expo) platforms. Solito allows us to share navigation logic, handle complex scenarios like modals, and maintain type-safe route definitions.

#### Unified Routing with Solito

- **Shared Navigation Logic**: Write navigation code once and reuse it across platforms using Solito.
- **Separate Page Definitions**:
  - **Next.js Pages**: Located in apps/next/pages, following Next.js routing conventions.
  - **Expo Screens**: Located in apps/expo/app, using expo-router for navigation.
  - **Shared Screen Components**: Place shared UI and logic in packages/app/features to be imported by both platforms.

#### Handling Modals and Complex Navigation

We handle modals and complex navigation scenarios using Solito's methodologies to ensure consistent behavior across platforms:

- **Modals on Web (Next.js)**:
  - Utilize Next.js routing with shallow routing to render modals as pages without unmounting the current page.
  - Modals have their own URLs, improving navigation and sharing.
- **Modals on Native (Expo/React Native)**:
  - Use React Navigation's modal presentation styles.
  - Manage navigation stacks to present screens as modals.

#### Platform-Specific Code with Solito
Solito enables platform-specific code through .native and .web extensions. When importing from packages/app/utils/api.ts, Solito automatically selects api.native.ts on native platforms if it exists.

##### React Navigation Web No-ops
React Navigation code needs empty function replacements for web to avoid errors and unused imports. Re-export React Navigation modules with no-ops for web.

- **Example**: Creating `useScrollToTop`

Native version (`hooks/use-scroll-to-top.ts`):

```tsx
export { useScrollToTop } from '@react-navigation/native'
```

Web version (`hooks/use-scroll-to-top.web.ts`):
```tsx
export function useScrollToTop() {
  // no-op
}
```

Then in components:
```tsx
import { useScrollToTop } from 'hooks/use-scroll-to-top'
```

This lets Solito tree-shake code appropriately for each platform.

##### Other Routing Best Practices

- **Avoid Touchables Inside Link**:
  - Do not wrap touchable elements (e.g., Pressable, TouchableOpacity) directly inside a Link component to prevent touch event conflicts on the web.
  - Instead, use non-touchable elements like Text or View inside Link.

## Backend Guidelines

### Server

Our server is a set of serverless functions that are triggered by API routes in Next.js.

Besides that, we have a way to handle long running processes using durable execution. Be mindful of suggesting whether to use serverless functions (Next.js API routes) or durable execution (Temporal/Trigger.dev).

#### Serverless Considerations

- **Constraints Awareness**: Be mindful of serverless function constraints, such as payload sizes and execution times.
- **Execution Limits**: Functions may be terminated if they exceed the maximum allowed execution time (~5 minutes on Vercel Pro, 15 seconds for Vercel Free users). Assume we use Pro.

#### Backend Definitions

- **Single Source of Truth**: Define all queries and mutations on the backend using tRPC to maintain consistency.

We use tRPC to define our API. Our TRPC router looks something like this:

```ts
import { inferRouterInputs, inferRouterOutputs } from '@trpc/server'

import { greetingRouter } from './greeting'
import { createTRPCRouter } from '../trpc'
export const appRouter = createTRPCRouter({
  greeting: greetingRouter,
})
// export type definition of API
export type AppRouter = typeof appRouter

/**
 * Inference helpers for input types
 * @example type HelloInput = RouterInputs['example']['hello']
 **/
export type RouterInputs = inferRouterInputs<AppRouter>

/**
 * Inference helpers for output types
 * @example type HelloOutput = RouterOutputs['example']['hello']
 **/
export type RouterOutputs = inferRouterOutputs<AppRouter>
```

Inside the greeting router, we would handle the interactions with the database, and other external services.

```ts
import { TRPCError } from '@trpc/server'

import { createTRPCRouter, protectedProcedure } from '../trpc'

function getTimeOfDay() {
  const today = new Date()
  const curHr = today.getHours()
  if (curHr < 4) {
    return 'night'
  }
  if (curHr < 12) {
    return 'morning'
  }
  if (curHr < 18) {
    return 'afternoon'
  }
  return 'night'
}

export const greetingRouter = createTRPCRouter({
  greet: protectedProcedure.query(async ({ ctx: { supabase, user } }) => {
    const profile = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (profile.error) {
      console.error(profile.error)
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' })
    }
    const name = profile.data.name
    return `Good ${getTimeOfDay()}${name ? `, ${name}!` : '!'}`
  }),
})
```

Note that we are using the Supabase client here.

### Server Performance and Scalability

#### Algorithm Complexity and Big O Notation

- **Understand Time Complexity**: Be aware of the Big O notation for algorithms to ensure efficient performance, especially in functions that may process large datasets.
- **Optimize Critical Code Paths**: Identify and optimize sections of code that could become bottlenecks due to poor algorithmic efficiency.
- **Avoid Premature Optimization**: While performance is important, do not optimize code unnecessarily. Focus on code that has a measurable impact on performance.

#### Linear Scaling

- **Manage Concurrency**: Be cautious with parallel asynchronous operations to prevent overwhelming external services or running into rate limits.
- **Throttling and Debouncing**: Implement throttling or debouncing strategies when handling high-frequency events or requests.

### Serverless Best Practices

#### Execution Limits

- **Avoid Long-Running Processes**: Design functions to complete quickly, ideally within a few seconds. Long running processes should be handled via our durable execution platform (Temporal/Trigger.dev).

### Security Best Practices

#### Input Validation and Sanitization

- **Validate All Inputs**: Rigorously check all incoming data for correctness and completeness using Zod.

```ts
getUsers: protectedProcedure.input(ZSelectUsersRouterSchema).query(async ({ input, ctx }) => {
insertUsers: protectedProcedure.input(ZInsertUsersRouterSchema).mutation(async ({ input, ctx }) => {
```

Zod Schemas should be defined in the tRPC route folder itself. For improvement, suggest using `drizzle-zod` to generate the schemas directly from the database. If schema extension is necessary, extend the base schemas generated from Drizzle and place them inside the tRPC route folder.

```ts
import { createSelectSchema, createInsertSchema } from 'drizzle-zod'
```

#### Secure Data Handling

- **Encrypt Sensitive Data**: Use encryption for API secrets using Supabase Vault.
- **Access Controls**: Implement strict access controls using least privilege principles for all services and data stores. Try to avoid using Supabase RLS for this, but rather use tRPC to enforce access controls.
- **Avoid Hardcoding Secrets**: Never include secrets directly in the codebase or configuration files.

### Testing and Quality Assurance

#### Automated Testing

- **Unit Testing**: Suggest unit tests for all functions to ensure they work as intended.
- **Integration Testing**: If necessary, suggest integration tests to validate that different modules and services interact correctly.
- **End-to-End Testing**: If necessary, suggest end-to-end tests to catch issues that only occur in a full system context.

### Database / PostgresQL

#### Relational Table Design Philosophy

Adhere to the relational table design principles outlined in _Database Design for Mere Mortals: A Hands-On Guide to Relational Database Design_ by Michael J. Hernandez. This approach emphasizes clarity, consistency, and proper normalization to ensure a scalable and maintainable database schema.

#### Naming Conventions

Follow these conventions for clarity and consistency:

- **Table Names**: Use singular names for tables (e.g., user, image).
- **One-to-Many Relationships**: For one-to-many relationships, use singular names for the "many" side (e.g., product_images for multiple images related to one product).
- **Many-to-Many Relationships**: Use plural names for both sides in junction tables (e.g., users_organizations connecting users and organizations).
- **Primary Keys**: Be consistent, either use UUIDs or auto incrementing integers.
- **Foreign Keys**: Name foreign keys after the referenced table and column, typically in the format tablename_columnname_fkey.
- **Timestamps**: Include created_at and updated_at timestamp columns to track record creation and updates.
- **Column Names**: Use lowercase, underscore-separated names (e.g., user_id, organization_id, image_url).
- **Data Types**: Choose appropriate data types based on the nature of the data (e.g., INT for integers, VARCHAR for short text, TEXT for longer text, BOOLEAN for true/false values, DECIMAL for precise numeric values).
- **NULL Values**: Avoid NULL values where possible; disallow NULL for columns where a value is always required.
- **Indexes**: Create indexes on columns frequently used in WHERE, ORDER BY, GROUP BY, and JOIN clauses to improve query performance.
- **Booleans**: Prefer non-nullable boolean columns with default values of TRUE or FALSE.

#### Migrations

Supabase is used for database migrations. The migrations are stored in the `supabase/migrations` directory. To run migrations locally, run `yarn supabase db push --local --include-all`.

#### Functions

- **Business Logic in Application Layer**: Keep most business logic within the application layer for easier testing, debugging, and future database migrations.
- **Essential Functions Only**: Implement necessary database functions for critical operations. Current functions include:

  - `handle_new_user`: Triggered when a new user is added.

    When using Supabase Vault, add these functions:

    - `insert_secret`: Inserts a new secret into the vault. (makerkit.dev/blog/tutorials/supabase-vault)
    - `read_secret`: Retrieves a secret from the vault. (makerkit.dev/blog/tutorials/supabase-vault)

    When creating an `updated_at` column, use the following function:

  - `update_updated_at_column`: Updates the updated_at column for a specific record.

#### Constraints

- **Data Integrity**: Use constraints to ensure data accuracy and reliability.
- **Common Constraints**: Apply NOT NULL, UNIQUE, CHECK, and FOREIGN KEY constraints as appropriate.
- **Table Comments**: Always add a comment to each table explaining its purpose.

#### Enums for Consistent Data Representation

- **Define Enum Types**: Before creating or altering a table, define the enum types.
- **Use Enums in Tables**: Apply the defined enum types to relevant columns.
- **Benefits**:
  Data Integrity: Ensures only valid values are stored.
  - **Clarity**: Makes permissible values explicit.
  - **Simplified Logic**: Constrains and documents acceptable values.
  - **Considerations**: Use enums for stable sets of values. For rapidly changing or extensive sets, consider alternative approaches.
