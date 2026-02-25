export const siteName = 'Amanah Trust';
export const siteTagline = 'Estate Planning';

export const questions = [{
    id: 'name',
    text: 'What is your name?',
    type: 'text',
    required: true,
    bucket: 'personal',
}, {
    id: 'phone',
    text: 'What is your phone number?',
    type: 'tel',
    required: true,
    bucket: 'personal',
},
{
    id: 'date_of_birth',
    text: "What is your date of birth?",
    type: 'date',
    required: true,
    bucket: 'personal',
},
{
    id: 'gender',
    text: "What is your gender?",
    type: 'select',
    required: true,
    options: ['Male', 'Female'],
    bucket: 'personal',
},
{
    id: 'married',
    text: "Are you married?",
    type: 'boolean',
    required: true,
    bucket: 'family',
},
{
    id: 'children',
    text: "Do you have any children?",
    type: 'boolean',
    required: true,
    bucket: 'family',
},
]
