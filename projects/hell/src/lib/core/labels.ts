import { InjectionToken, inject, type Provider } from '@angular/core';

export interface HellAppShellLabels {
  readonly expandSidebar: string;
  readonly collapseSidebar: string;
  readonly showSecondaryPanel: string;
  readonly hideSecondaryPanel: string;
}

export interface HellAudioPlayerLabels {
  readonly play: string;
  readonly pause: string;
  readonly seek: string;
  readonly mute: string;
  readonly unmute: string;
  readonly volume: string;
  readonly showLiveCaptions: string;
  readonly hideLiveCaptions: string;
  readonly download: string;
  readonly playbackSpeed: (rate: number) => string;
  readonly copyTranscript: string;
  readonly clearTranscript: string;
  readonly errorStatus: string;
  readonly liveStatus: string;
  readonly pausedStatus: string;
  readonly copied: string;
  readonly copy: string;
  readonly clear: string;
  readonly listening: string;
  readonly pressPlayForCaptions: string;
}

export interface HellDialpadLabels {
  readonly dialpad: string;
  readonly backspace: string;
  readonly call: string;
}

export interface HellOmnibarLabels {
  readonly clearSearch: string;
}

export interface HellDataTableLabels {
  readonly resizeColumn: string;
}

export interface HellDateInputLabels {
  readonly chooseDate: string;
  readonly chooseDateFor: (label: string) => string;
}

export interface HellDatePickerLabels {
  readonly previousYear: string;
  readonly nextYear: string;
  readonly previousMonth: string;
  readonly nextMonth: string;
}

export interface HellPaginationLabels {
  readonly navigation: string;
  readonly firstPage: string;
  readonly previousPage: string;
  readonly nextPage: string;
  readonly lastPage: string;
  readonly page: (page: number) => string;
}

export interface HellPdfViewerLabels {
  readonly togglePageOverview: string;
  readonly previousPage: string;
  readonly nextPage: string;
  readonly page: string;
  readonly findInDocument: string;
  readonly download: string;
  readonly print: string;
  readonly zoomOut: string;
  readonly zoomIn: string;
  readonly zoomLevel: string;
  readonly automaticZoom: string;
  readonly actualSize: string;
  readonly pageFit: string;
  readonly pageWidth: string;
  readonly findPlaceholder: string;
  readonly findQuery: string;
  readonly searching: string;
  readonly notFound: string;
  readonly previousMatch: string;
  readonly nextMatch: string;
  readonly closeFindBar: string;
  readonly pageOverview: string;
  readonly goToPage: (page: number) => string;
}

export interface HellTimeInputLabels {
  readonly chooseTime: string;
  readonly chooseTimeFor: (label: string) => string;
  readonly subtractFiveMinutes: string;
  readonly addFiveMinutes: string;
  readonly hours: string;
  readonly minutes: string;
  readonly seconds: string;
}

export interface HellToastLabels {
  readonly notifications: string;
  readonly notification: string;
  readonly dismiss: string;
}

export interface HellLabels {
  readonly loading: string;
  readonly appShell: HellAppShellLabels;
  readonly audioPlayer: HellAudioPlayerLabels;
  readonly dialpad: HellDialpadLabels;
  readonly dataTable: HellDataTableLabels;
  readonly dateInput: HellDateInputLabels;
  readonly datePicker: HellDatePickerLabels;
  readonly omnibar: HellOmnibarLabels;
  readonly pagination: HellPaginationLabels;
  readonly pdfViewer: HellPdfViewerLabels;
  readonly timeInput: HellTimeInputLabels;
  readonly toast: HellToastLabels;
}

export interface HellLabelOverrides {
  readonly loading?: string;
  readonly appShell?: Partial<HellAppShellLabels>;
  readonly audioPlayer?: Partial<HellAudioPlayerLabels>;
  readonly dialpad?: Partial<HellDialpadLabels>;
  readonly dataTable?: Partial<HellDataTableLabels>;
  readonly dateInput?: Partial<HellDateInputLabels>;
  readonly datePicker?: Partial<HellDatePickerLabels>;
  readonly omnibar?: Partial<HellOmnibarLabels>;
  readonly pagination?: Partial<HellPaginationLabels>;
  readonly pdfViewer?: Partial<HellPdfViewerLabels>;
  readonly timeInput?: Partial<HellTimeInputLabels>;
  readonly toast?: Partial<HellToastLabels>;
}

export const HELL_DEFAULT_LABELS: HellLabels = {
  loading: 'Loading',
  appShell: {
    expandSidebar: 'Expand sidebar',
    collapseSidebar: 'Collapse sidebar',
    showSecondaryPanel: 'Show secondary panel',
    hideSecondaryPanel: 'Hide secondary panel',
  },
  audioPlayer: {
    play: 'Play',
    pause: 'Pause',
    seek: 'Seek',
    mute: 'Mute',
    unmute: 'Unmute',
    volume: 'Volume',
    showLiveCaptions: 'Show live captions',
    hideLiveCaptions: 'Hide live captions',
    download: 'Download',
    playbackSpeed: (rate) => `Playback speed ${rate}x`,
    copyTranscript: 'Copy transcript',
    clearTranscript: 'Clear transcript',
    errorStatus: 'Error',
    liveStatus: 'Live',
    pausedStatus: 'Paused',
    copied: 'Copied',
    copy: 'Copy',
    clear: 'Clear',
    listening: 'Listening…',
    pressPlayForCaptions: 'Press play to capture captions.',
  },
  dialpad: {
    dialpad: 'Dial pad',
    backspace: 'Backspace',
    call: 'Call',
  },
  omnibar: {
    clearSearch: 'Clear search',
  },
  dataTable: {
    resizeColumn: 'Resize column',
  },
  dateInput: {
    chooseDate: 'Choose date',
    chooseDateFor: (label) => `Choose date for ${label}`,
  },
  datePicker: {
    previousYear: 'Previous year',
    nextYear: 'Next year',
    previousMonth: 'Previous month',
    nextMonth: 'Next month',
  },
  pagination: {
    navigation: 'Pagination',
    firstPage: 'First page',
    previousPage: 'Previous page',
    nextPage: 'Next page',
    lastPage: 'Last page',
    page: (page) => `Page ${page}`,
  },
  pdfViewer: {
    togglePageOverview: 'Toggle page overview',
    previousPage: 'Previous page',
    nextPage: 'Next page',
    page: 'Page',
    findInDocument: 'Find in document (Ctrl/Cmd+F)',
    download: 'Download',
    print: 'Print',
    zoomOut: 'Zoom out',
    zoomIn: 'Zoom in',
    zoomLevel: 'Zoom level',
    automaticZoom: 'Automatic',
    actualSize: 'Actual size',
    pageFit: 'Page fit',
    pageWidth: 'Page width',
    findPlaceholder: 'Find in document…',
    findQuery: 'Find query',
    searching: 'Searching…',
    notFound: 'Not found',
    previousMatch: 'Previous match',
    nextMatch: 'Next match',
    closeFindBar: 'Close find bar (Esc)',
    pageOverview: 'Page overview',
    goToPage: (page) => `Go to page ${page}`,
  },
  timeInput: {
    chooseTime: 'Choose time',
    chooseTimeFor: (label) => `Choose time for ${label}`,
    subtractFiveMinutes: 'Subtract 5 minutes',
    addFiveMinutes: 'Add 5 minutes',
    hours: 'Hours',
    minutes: 'Minutes',
    seconds: 'Seconds',
  },
  toast: {
    notifications: 'Notifications',
    notification: 'Notification',
    dismiss: 'Dismiss',
  },
};

export const HELL_LABELS = new InjectionToken<HellLabels>('HELL_LABELS', {
  providedIn: 'root',
  factory: () => HELL_DEFAULT_LABELS,
});

export function provideHellLabels(overrides: HellLabelOverrides): Provider {
  return {
    provide: HELL_LABELS,
    useFactory: () =>
      hellMergeLabels(
        inject(HELL_LABELS, { optional: true, skipSelf: true }) ?? HELL_DEFAULT_LABELS,
        overrides,
      ),
  };
}

function hellMergeLabels(base: HellLabels, overrides: HellLabelOverrides): HellLabels {
  return {
    loading: overrides.loading ?? base.loading,
    appShell: { ...base.appShell, ...overrides.appShell },
    audioPlayer: { ...base.audioPlayer, ...overrides.audioPlayer },
    dialpad: { ...base.dialpad, ...overrides.dialpad },
    dataTable: { ...base.dataTable, ...overrides.dataTable },
    dateInput: { ...base.dateInput, ...overrides.dateInput },
    datePicker: { ...base.datePicker, ...overrides.datePicker },
    omnibar: { ...base.omnibar, ...overrides.omnibar },
    pagination: { ...base.pagination, ...overrides.pagination },
    pdfViewer: { ...base.pdfViewer, ...overrides.pdfViewer },
    timeInput: { ...base.timeInput, ...overrides.timeInput },
    toast: { ...base.toast, ...overrides.toast },
  };
}
