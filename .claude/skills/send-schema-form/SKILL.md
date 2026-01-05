---
name: send-schema-form
description: Standardize typed forms in this repo. Use whenever a feature needs a form or an existing form is being refactored. Prefer SchemaForm + formFields + zod for typed inputs and consistent UI/validation; use react-hook-form Controller only for custom fields that SchemaForm cannot render.
---

# Send Schema Form

## Overview

Use SchemaForm as the default form primitive in this repo. Define a zod schema with formFields, derive types via z.infer, and render fields through SchemaForm so validation and UI stay consistent.

## Workflow

1. Define a zod schema using formFields (text, textarea, number, boolean, select, note, date, etc.).
2. Create a form instance with useForm<z.infer<typeof Schema>>().
3. Render SchemaForm with schema, defaultValues, props, and a render function for layout.
4. Submit via form.handleSubmit and handle server errors with form.setError on a field.
5. Wrap in FormProvider only if child components use useFormContext/useController.

## SchemaForm vs Controller

- Prefer SchemaForm + formFields for standard inputs. It wires validation, error display, and UI conventions in one place.
- Use Controller/useFormContext when a field is not supported by formFields or needs custom wiring (composite inputs, third-party components, complex formatting). Keep the field in the schema and validate manually or with a form-level resolver if needed.
- Avoid local state for field values. Let react-hook-form own the field state and use form.watch for derived UI.

## Resources

- references/schema-form-example.tsx: example form using SchemaForm, zod, and typed values.
- assets/schema-form-template.tsx: skeleton to copy when starting a new form.
