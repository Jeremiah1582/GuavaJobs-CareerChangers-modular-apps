import { AtsFieldMap } from '../../shared/schemas/autofill.schema';

export const leverFieldMap: AtsFieldMap = {
  atsType: 'lever',
  version: '1.0.0',
  fields: [
    {
      logicalKey: 'fullName',
      name: 'name',
      selectors: ['input[name="name"]', 'input[data-qa="name-input"]'],
      autocomplete: 'name',
      inputType: 'text',
    },
    {
      logicalKey: 'email',
      name: 'email',
      selectors: ['input[name="email"]', 'input[data-qa="email-input"]'],
      autocomplete: 'email',
      inputType: 'email',
    },
    {
      logicalKey: 'phone',
      name: 'phone',
      selectors: ['input[name="phone"]', 'input[data-qa="phone-input"]'],
      autocomplete: 'tel',
      inputType: 'tel',
    },
    {
      logicalKey: 'linkedinUrl',
      selectors: [
        'input[name*="urls[LinkedIn]"]',
        'input[name*="linkedin" i]',
      ],
      inputType: 'url',
    },
    {
      logicalKey: 'githubUrl',
      selectors: [
        'input[name*="urls[GitHub]"]',
        'input[name*="github" i]',
      ],
      inputType: 'url',
    },
    {
      logicalKey: 'coverLetter',
      selectors: [
        'textarea[name="comments"]',
        'textarea[data-qa="comments-input"]',
      ],
      inputType: 'textarea',
    },
    {
      logicalKey: 'workAuthorization',
      selectors: ['textarea[name*="authorization" i]'],
      inputType: 'textarea',
    },
  ],
};
