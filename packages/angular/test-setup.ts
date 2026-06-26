import '@angular/compiler';
import { getTestBed } from '@angular/core/testing';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';

try {
  getTestBed().initTestEnvironment(BrowserTestingModule, platformBrowserTesting(), {
    teardown: { destroyAfterEach: true },
  });
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  if (!message.includes('Cannot set base providers because it has already been called')) {
    throw error;
  }
}
