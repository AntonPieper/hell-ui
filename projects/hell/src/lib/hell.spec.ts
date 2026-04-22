import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Hell } from './hell';

describe('Hell', () => {
  let component: Hell;
  let fixture: ComponentFixture<Hell>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Hell]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Hell);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
