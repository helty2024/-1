export const leadTypes = ['agent', 'investment', 'consult'] as const;
export type LeadType = (typeof leadTypes)[number];

export const leadStatuses = ['new', 'contacted', 'qualified', 'closed', 'invalid'] as const;
export type LeadStatus = (typeof leadStatuses)[number];

export const publishStatuses = ['draft', 'published', 'offline'] as const;
export type PublishStatus = (typeof publishStatuses)[number];

export const formFieldTypes = [
  'text',
  'number',
  'phone',
  'textarea',
  'select',
  'radio',
  'checkbox',
  'file',
] as const;
export type FormFieldType = (typeof formFieldTypes)[number];
