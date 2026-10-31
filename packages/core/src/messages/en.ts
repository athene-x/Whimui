/**
 * English strings of the `ui` namespace used by the registry components. Spread into the app's
 * messages: `{ ...appMessages, ui: uiEn }`.
 */
const uiEn = {
  actions: {
    add: 'Add',
    back: 'Back',
    cancel: 'Cancel',
    close: 'Close',
    confirm: 'Confirm',
    delete: 'Delete',
    edit: 'Edit',
    reset: 'Reset',
    retry: 'Try again',
    save: 'Save',
    search: 'Search',
    submit: 'Submit',
    viewDetails: 'View details',
  },
  status: {
    loading: 'Loading…',
    processing: 'Processing…',
    saving: 'Saving…',
    submitting: 'Submitting…',
  },
  empty: '-',
  noResults: 'No results.',
  errors: {
    unexpected: 'Something went wrong. Please try again.',
    loadFailed: 'Could not load this data.',
  },
  pagination: {
    total: '{count} total',
    perPage: '{size} / page',
    pageOf: 'Page {page} of {pageCount}',
    rowsPerPage: 'Rows per page',
    previous: 'Go to previous page',
    next: 'Go to next page',
    goToPage: 'Go to page {page}',
  },
  errorPage: {
    title: 'Something went wrong',
    description: 'The request could not be completed. Please try again.',
  },
  notFound: {
    title: 'Page not found',
    description: 'The page you are looking for may have been moved or deleted.',
    home: 'Back to home',
  },
  sidebar: {
    logout: 'Log out',
    loggingOut: 'Logging out…',
    profileMenu: 'Profile menu',
  },
  combobox: {
    empty: 'No results found.',
    loading: 'Loading…',
    loadingMore: 'Loading more…',
  },
  dateRange: {
    placeholder: 'Pick start and end dates',
    clear: 'Clear dates',
    presets: {
      months: '{count, plural, =1 {# month} other {# months}}',
      year: '1 year',
      endOfQuarter: 'End of quarter',
      endOfYear: 'End of year',
    },
  },
  language: 'Language',
  languages: {
    en: 'English',
    th: 'ไทย',
  },
  sessionExpired: {
    title: 'Your login has expired',
    description:
      'You have been logged out because your session ended. Log in again to continue where you left off. Unsaved changes may be lost.',
    action: 'Log in again',
    redirecting: 'Redirecting to login…',
  },
};

export type UiMessages = typeof uiEn;

export default uiEn;
