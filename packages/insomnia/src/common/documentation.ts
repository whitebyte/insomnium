const insomniaDocs = (slug: string) => `https://docs.insomnia.rest${slug}`;

export const docsBase = insomniaDocs('/');
export const docsTemplateTags = insomniaDocs('/insomnia/template-tags');
export const docsVersionControl = insomniaDocs('/insomnia/version-control-sync');
export const docsPlugins = insomniaDocs('/insomnia/introduction-to-plugins');
export const docsImportExport = insomniaDocs('/insomnia/import-export-data');
export const docsKeyMaps = insomniaDocs('/insomnia/key-maps');
export const docsIntroductionInsomnia = insomniaDocs('/insomnia/get-started');
export const docsWorkingWithDesignDocs = insomniaDocs('/insomnia/design-documents');
export const docsUnitTesting = insomniaDocs('/insomnia/unit-testing');
export const docsIntroductionToInsoCLI = insomniaDocs('/inso-cli/introduction');

export const documentationLinks = {
  introductionToInsomnia: {
    title: 'Introduction to Insomnium',
    url: docsIntroductionInsomnia,
  },
  workingWithDesignDocs: {
    title: 'Working with Design Documents',
    url: docsWorkingWithDesignDocs,
  },
  unitTesting: {
    title: 'Unit Testing',
    url: docsUnitTesting,
  },
  introductionToInsoCLI: {
    title: 'Introduction to Inso CLI',
    url: docsIntroductionToInsoCLI,
  },
} as const;
