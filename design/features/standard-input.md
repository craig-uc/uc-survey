Standard Input
==============

Overview
--------

A self-contained, translated input field. Labels and placeholders are resolved via an internal API that proxies to JOURNEY_API/standard_field. Validation errors are translated via JOURNEY_API/standard_error. Values are automatically persisted to and retrieved from localStorage, keyed by field name. Language and tenant are read from context automatically.

Component
---------

src/features/standard-input/StandardInput.tsx
Exported from src/features/standard-input/index.ts as StandardInput.

Props
-----

| Prop        | Type              | Required | Description                                                                 |
|-------------|-------------------|----------|-----------------------------------------------------------------------------|
| label       | string            | Yes      | Translation key sent to JOURNEY_API/standard_field for the field label.     |
| name        | string            | Yes      | HTML name attribute; also used as the localStorage persistence key.         |
| type        | string            | No       | Input type (default: "text").                                               |
| placeholder | string            | No       | Translation key sent to JOURNEY_API/standard_field for the placeholder.     |
| required    | boolean           | No       | Marks the field required; triggers "required" error type on blur if empty.  |
| value       | string            | No       | Seed value; takes priority over localStorage on mount.                      |
| onChange    | (v: string)=>void | No       | Called on every keystroke with the current value.                           |
| validation  | ValidationRules   | No       | Additional validation rules (see below).                                    |
| maxLength   | number            | No       | HTML maxLength attribute; triggers "max_length" error type on blur.         |
| className   | string            | No       | Extra CSS classes applied to the input element.                             |
| ref         | Ref<HTMLInputElement> | No  | Forwarded to the underlying input element via forwardRef.                   |

ValidationRules
---------------

| Rule      | Type    | Error type generated  |
|-----------|---------|-----------------------|
| required  | boolean | "required"            |
| minLength | number  | "min_length"          |
| pattern   | RegExp  | "invalid_format"      |

Top-level required and maxLength props are evaluated first, then ValidationRules.

Value lifecycle
---------------

Mount:  value prop present → use it; otherwise read localStorage[name].
Change: updates internal state; fires onChange.
Blur:   writes current value to localStorage[name]; runs validation.

Error flow
----------

1. validate() returns an error type string or null.
2. errorType state is set; triggers a fetch to /api/standard-input/error.
3. Translated error message is displayed below the input.
4. Input border switches to border-danger; message is text-danger.
5. Clearing the value and blurring again sets errorType to null and removes the message.

Error type defaults (used when JOURNEY_API is unavailable)
----------------------------------------------------------

| Type           | Default message                   |
|----------------|-----------------------------------|
| required       | This field is required            |
| max_length     | Value exceeds the maximum length  |
| min_length     | Value is too short                |
| invalid_format | Invalid format                    |

API routes
----------

POST /api/standard-input/field
  Proxies to JOURNEY_API/standard_field.
  Body: { label, language, tenant_code, application }
  Returns: { message: string }
  Cache: revalidate every 24 h.

POST /api/standard-input/error
  Proxies to JOURNEY_API/standard_error.
  Body: { type, language, tenant_code, application }
  Returns: { message: string }
  Cache: no-store.

File structure
--------------

src/features/standard-input/
  StandardInput.tsx          Component
  StandardInput.test.tsx     Unit tests
  types.ts                   Props and ValidationRules interfaces
  index.ts                   Barrel export
  api/
    field.ts                 fetchField() + POST handler for label/placeholder
    error.ts                 fetchError() + POST handler for error messages

src/app/api/standard-input/
  field/route.ts             Re-exports POST from feature/api/field
  error/route.ts             Re-exports POST from feature/api/error

Usage example
-------------

  import { StandardInput } from "@/features/standard-input";

  <StandardInput
    label="email_label"
    name="email"
    type="email"
    placeholder="email_placeholder"
    required
    validation={{ minLength: 5, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }}
    onChange={(val) => console.log(val)}
  />
