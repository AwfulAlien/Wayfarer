import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { LandingComponent } from './landing.component';

describe('LandingComponent travel flow', () => {
  let http: HttpTestingController;
  let fixture: ComponentFixture<LandingComponent>;
  let component: LandingComponent;
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [LandingComponent], providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(LandingComponent);
    component = fixture.componentInstance;
    http.expectOne('/api/public-config').flush({ guideName: 'Your Travel Guide', guideWhatsapp: '919876543210', guideEmail: 'guide@example.com', consultationPrice: 9.99, consultationCurrency: 'EUR' });
  });
  afterEach(() => http.verify());

  it('requests structured AI details and stores the backend response', () => {
    component.send('Ooty for three days, two adults, EUR 25000');
    const request = http.expectOne('/api/chat');
    expect(request.request.method).toBe('POST');
    expect(request.request.body.travelDetails.travellers).toEqual({ adults: 0, children: 0 });
    request.flush({ reply: 'That sounds lovely. When would you like to go?', travelDetails: { destination: 'Ooty', durationDays: 3, startDate: null, endDate: null, travellers: { adults: 2, children: 0 }, departureCity: null, budget: 25000, currency: 'EUR', interests: [], travelStyle: null, accommodationPreferences: [], transportPreferences: [], specialRequirements: [] } });
    expect(component.details.destination).toBe('Ooty');
    expect(component.details.currency).toBe('EUR');
    expect(component.details.adults).toBe(2);
    expect(component.ready).toBeTrue();
  });
  it('turns an API failure into a visible retry state', () => {
    component.send('Plan a trip');
    http.expectOne('/api/chat').flush({ message: 'Unavailable' }, { status: 503, statusText: 'Service Unavailable' });
    expect(component.error).toContain('couldn’t reach');
    expect(component.loading).toBeFalse();
  });
  it('scrolls new messages into view and respects the reader when they scroll upward', () => {
    component.chatOpen = true;
    fixture.detectChanges();
    const history = fixture.nativeElement.querySelector('.chat-body') as HTMLElement;
    Object.defineProperty(history, 'clientHeight', { configurable: true, value: 300 });
    Object.defineProperty(history, 'scrollHeight', { configurable: true, get: () => 500 + component.messages.length * 120 });
    let simulatedScrollTop = 0;
    Object.defineProperty(history, 'scrollTop', {
      configurable: true,
      get: () => simulatedScrollTop,
      set: (value: number) => { simulatedScrollTop = Math.max(0, Math.min(value, history.scrollHeight - history.clientHeight)); },
    });

    component.send('Plan a long weekend trip');
    fixture.detectChanges();
    expect(history.scrollTop + history.clientHeight).toBeGreaterThanOrEqual(history.scrollHeight);

    history.scrollTop = 0;
    history.dispatchEvent(new Event('scroll'));
    const request = http.expectOne('/api/chat');
    request.flush({ reply: 'A detailed itinerary response.', travelDetails: { destination: null, durationDays: null, startDate: null, endDate: null, travellers: { adults: 0, children: 0 }, departureCity: null, budget: null, currency: 'EUR', interests: [], travelStyle: null, accommodationPreferences: [], transportPreferences: [], specialRequirements: [] } });
    fixture.detectChanges();
    expect(history.scrollTop).toBe(0);

    history.scrollTop = history.scrollHeight - history.clientHeight;
    history.dispatchEvent(new Event('scroll'));
    component.send('Add one more detail');
    fixture.detectChanges();
    expect(history.scrollTop + history.clientHeight).toBeGreaterThanOrEqual(history.scrollHeight);
    http.expectOne('/api/chat').flush({ reply: 'Here is the updated plan.', travelDetails: { currency: 'EUR' } });
    fixture.detectChanges();
    expect(history.scrollTop + history.clientHeight).toBeGreaterThanOrEqual(history.scrollHeight);
  });
  it('keeps an invalid travel brief in the review step', () => {
    component.stage = 'summary'; component.details.destination = ''; component.details.budget = -20;
    component.startCheckout();
    expect(component.stage).toBe('summary');
    expect(component.summaryError).toContain('Please check');
  });
  it('updates contact preference and simulated payment stage', () => {
    component.setContact('email');
    expect(component.selectedContact).toBe('email');
    component.details.destination = 'Ooty'; component.details.durationDays = 3; component.details.adults = 2; component.details.budget = 25000;
    component.startCheckout();
    expect(component.stage).toBe('checkout');
    component.completePayment();
    expect(component.stage).toBe('done');
    expect(component.paymentComplete).toBeTrue();
  });
  it('requires a valid visitor phone for WhatsApp and keeps it through checkout edits', () => {
    component.details.destination = 'Ooty'; component.details.durationDays = 3; component.details.adults = 2; component.details.budget = 25000;
    component.contact.country = 'India';
    component.stage = 'summary';
    component.startCheckout();
    expect(component.stage).toBe('summary');
    expect(component.showPhoneError).toBeTrue();
    expect(component.phoneError).toContain('required');

    component.contact.phoneNumber = 'call me';
    expect(component.phoneError).toContain('valid phone number');
    component.contact.country = 'India';
    component.contact.phoneNumber = '98765 43210';
    expect(component.phoneError).toBe('');
    component.startCheckout();
    expect(component.stage).toBe('checkout');
    component.stage = 'summary';
    expect(component.contact.phoneNumber).toBe('98765 43210');
    expect(component.validVisitorPhone).toBe('+91 9876543210');
  });
  it('starts with EUR and requires explicit country calling code selection', () => {
    expect(component.details.currency).toBe('EUR');
    expect(component.contact.country).toBe('');
    component.contact.phoneNumber = '9876543210';
    expect(component.phoneError).toContain('Select a country calling code');
    component.contact.country = 'Germany';
    expect(component.validVisitorPhone).toBe('+49 9876543210');
  });
  it('formats the configurable consultation fee in its configured currency', () => {
    expect(component.consultationPrice).toBe(9.99);
    expect(component.consultationCurrency).toBe('EUR');
    expect(component.formattedConsultationPrice).toContain('9.99');
    expect(component.formattedConsultationPrice).toContain('€');
    component.details.budget = 1234.5;
    expect(component.summaryText).toContain('Budget: €1,234.50');
  });
  it('does not require a phone number for email-only contact', () => {
    component.setContact('email');
    component.details.destination = 'Ooty'; component.details.durationDays = 3; component.details.adults = 2; component.details.budget = 25000;
    component.contact.phoneNumber = 'arbitrary text';
    component.startCheckout();
    expect(component.stage).toBe('checkout');
    expect(component.showPhoneError).toBeFalse();
    expect(component.summaryText).not.toContain('arbitrary text');
  });
  it('encodes the travel summary into WhatsApp and email handover links', () => {
    component.details.destination = 'Ooty & Coorg';
    component.contact.country = 'India';
    component.contact.phoneNumber = '98765 43210';
    const whatsapp = new URL(component.whatsappUrl());
    expect(whatsapp.hostname).toBe('wa.me');
    expect(whatsapp.pathname).toBe('/919876543210');
    expect(whatsapp.searchParams.get('text')).toContain('Ooty & Coorg');
    expect(whatsapp.searchParams.get('text')).toContain('Visitor phone: +91 9876543210');
    const email = component.emailUrl();
    expect(email).toContain('mailto:guide@example.com');
    expect(decodeURIComponent(email)).toContain('Travel consultation enquiry');
    expect(decodeURIComponent(email)).toContain('Ooty & Coorg');
  });
});
