import { Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HELL_DEFAULT_LABELS, HELL_LABELS, provideHellLabels } from './labels';

@Component({ template: '' })
class LabelsHost {
  readonly labels = inject(HELL_LABELS);
}

describe('Hell label contract', () => {
  it('provides the default labels from the root token', () => {
    TestBed.configureTestingModule({ imports: [LabelsHost] });

    const fixture = TestBed.createComponent(LabelsHost);

    expect(fixture.componentInstance.labels).toBe(HELL_DEFAULT_LABELS);
  });

  it('merges partial overrides without losing nested defaults', () => {
    TestBed.configureTestingModule({
      imports: [LabelsHost],
      providers: [
        provideHellLabels({
          loading: 'Loading local',
          pagination: {
            nextPage: 'Next local',
            page: (page) => `Page local ${page}`,
          },
          tableUtilities: {
            resizeColumn: 'Resize local',
          },
        }),
      ],
    });

    const fixture = TestBed.createComponent(LabelsHost);
    const labels = fixture.componentInstance.labels;

    expect(labels.loading).toBe('Loading local');
    expect(labels.appShell.expandSidebar).toBe(HELL_DEFAULT_LABELS.appShell.expandSidebar);
    expect(labels.pagination.nextPage).toBe('Next local');
    expect(labels.pagination.firstPage).toBe(HELL_DEFAULT_LABELS.pagination.firstPage);
    expect(labels.pagination.page(7)).toBe('Page local 7');
    expect(labels.tableUtilities.resizeColumn).toBe('Resize local');
    expect(labels.dataTable.resizeColumn).toBe('Resize local');
  });
});
