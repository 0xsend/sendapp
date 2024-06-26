import { createTsForm, createUniqueFieldSchema } from '@ts-react/form'

import { FieldError, Form, FormWrapper, type FormProps, Theme } from '@my/ui'
import {
  BooleanCheckboxField,
  BooleanField,
  BooleanSwitchField,
  CoinField,
  CountryCodeField,
  NumberField,
  OTPField,
  SelectField,
  TextAreaField,
  TextField,
} from '../components/FormFields'
import type { ComponentProps } from 'react'
import { useFormContext } from 'react-hook-form'
import { z } from 'zod'

export const formFields = {
  text: z.string(),
  textarea: createUniqueFieldSchema(z.string(), 'textarea'),
  /**
   * input that takes number
   */
  number: z.number(),
  /**
   * adapts to native switch on native, and native checkbox on web
   */
  boolean: z.boolean(),
  /**
   * switch field on all platforms
   */
  boolean_switch: createUniqueFieldSchema(z.boolean(), 'boolean_switch'),
  /**
   * checkbox field on all platforms
   */
  boolean_checkbox: createUniqueFieldSchema(z.boolean(), 'boolean_checkbox'),
  /**
   * make sure to pass options={} to props for this
   */
  select: createUniqueFieldSchema(z.string(), 'select'),
  /**
   * country code field
   */
  countrycode: createUniqueFieldSchema(z.string(), 'countrycode_select'),
  otp: createUniqueFieldSchema(z.string(), 'otp'),
  coin: createUniqueFieldSchema(z.string(), 'coin'),
}

const mapping = [
  [formFields.text, TextField] as const,
  [formFields.textarea, TextAreaField] as const,
  [formFields.number, NumberField] as const,
  [formFields.boolean, BooleanField] as const,
  [formFields.boolean_switch, BooleanSwitchField] as const,
  [formFields.boolean_checkbox, BooleanCheckboxField] as const,
  [formFields.select, SelectField] as const,
  [formFields.countrycode, CountryCodeField] as const,
  [formFields.otp, OTPField] as const,
  [formFields.coin, CoinField],
] as const

const FormComponent = (props: FormProps) => {
  return (
    <Form asChild {...props}>
      <FormWrapper tag="form">{props.children}</FormWrapper>
    </Form>
  )
}

const _SchemaForm = createTsForm(mapping, {
  FormComponent: FormComponent,
})

export const SchemaForm: typeof _SchemaForm = ({ ...props }) => {
  const renderAfter: ComponentProps<typeof _SchemaForm>['renderAfter'] = props.renderAfter
    ? (vars) => <FormWrapper.Footer>{props.renderAfter?.(vars)}</FormWrapper.Footer>
    : undefined

  return (
    <_SchemaForm {...props} renderAfter={renderAfter}>
      {(fields) =>
        props.children ? (
          props.children(fields) // render children if provided allowing full customization of the form body and fields
        ) : (
          <FormWrapper.Body>{Object.values(fields)}</FormWrapper.Body>
        )
      }
    </_SchemaForm>
  )
}

// handle manual errors (most commonly coming from a server) for cases where it's not for a specific field - make sure to wrap inside a provider first
// stopped using it cause of state issues it introduced - set the errors to specific fields instead of root for now
export const RootError = () => {
  const context = useFormContext()
  const errorMessage = context?.formState?.errors?.root?.message

  return (
    <Theme name="red">
      <FieldError message={errorMessage} />
    </Theme>
  )
}
