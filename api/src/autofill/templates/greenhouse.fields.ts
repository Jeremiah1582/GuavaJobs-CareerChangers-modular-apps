import { AtsFieldMap } from '../../shared/schemas/autofill.schema';

export const greenhouseFieldMap: AtsFieldMap = {
  atsType: 'greenhouse',
  version: '1.0.0',
  fields: [
    {
      logicalKey: 'firstName',
      name: 'job_application[first_name]',
      selectors: ['#first_name', 'input[name="job_application[first_name]"]'],
      autocomplete: 'given-name',
      inputType: 'text',
    },
    {
      logicalKey: 'lastName',
      name: 'job_application[last_name]',
      selectors: ['#last_name', 'input[name="job_application[last_name]"]'],
      autocomplete: 'family-name',
      inputType: 'text',
    },
    {
      logicalKey: 'email',
      name: 'job_application[email]',
      selectors: ['#email', 'input[name="job_application[email]"]'],
      autocomplete: 'email',
      inputType: 'email',
    },
    {
      logicalKey: 'phone',
      name: 'job_application[phone]',
      selectors: ['#phone', 'input[name="job_application[phone]"]'],
      autocomplete: 'tel',
      inputType: 'tel',
    },
    {
      logicalKey: 'linkedinUrl',
      selectors: [
        'input[name*="linkedin"]',
        'input[placeholder*="LinkedIn" i]',
      ],
      inputType: 'url',
    },
    {
      logicalKey: 'githubUrl',
      selectors: [
        'input[name*="github"]',
        'input[placeholder*="GitHub" i]',
      ],
      inputType: 'url',
    },
    {
      logicalKey: 'coverLetter',
      selectors: [
        '#cover_letter',
        'textarea[name="job_application[cover_letter]"]',
        'textarea[name*="cover_letter"]',
      ],
      inputType: 'textarea',
    },
    {
      logicalKey: 'workAuthorization',
      selectors: [
        'textarea[name*="authorization" i]',
        'input[name*="authorization" i]',
      ],
      inputType: 'text',
    },
    {
      logicalKey: 'requiresSponsorship',
      selectors: ['input[name*="sponsorship" i]'],
      inputType: 'checkbox',
    },
  ],
};
