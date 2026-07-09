"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ashbyFieldMap = void 0;
exports.ashbyFieldMap = {
    atsType: 'ashby',
    version: '1.0.0',
    fields: [
        {
            logicalKey: 'firstName',
            selectors: [
                'input[name="_systemfield_name_first"]',
                'input[autocomplete="given-name"]',
            ],
            autocomplete: 'given-name',
            inputType: 'text',
        },
        {
            logicalKey: 'lastName',
            selectors: [
                'input[name="_systemfield_name_last"]',
                'input[autocomplete="family-name"]',
            ],
            autocomplete: 'family-name',
            inputType: 'text',
        },
        {
            logicalKey: 'email',
            selectors: [
                'input[name="_systemfield_email"]',
                'input[type="email"]',
            ],
            autocomplete: 'email',
            inputType: 'email',
        },
        {
            logicalKey: 'phone',
            selectors: [
                'input[name="_systemfield_phone"]',
                'input[type="tel"]',
            ],
            autocomplete: 'tel',
            inputType: 'tel',
        },
        {
            logicalKey: 'linkedinUrl',
            selectors: ['input[name*="linkedin" i]'],
            inputType: 'url',
        },
        {
            logicalKey: 'githubUrl',
            selectors: ['input[name*="github" i]'],
            inputType: 'url',
        },
        {
            logicalKey: 'coverLetter',
            selectors: ['textarea[name*="cover" i]'],
            inputType: 'textarea',
        },
        {
            logicalKey: 'workAuthorization',
            selectors: ['textarea[name*="authorization" i]'],
            inputType: 'textarea',
        },
    ],
};
//# sourceMappingURL=ashby.fields.js.map