import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AfterViewChecked, Component, ElementRef, ViewChild, inject } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { apiUrl } from '../../api-url';

type TravelDetails = {
  destination: string | null; durationDays: number | null; startDate: string | null; endDate: string | null; dateNotes: string | null;
  adults: number; children: number; departureCity: string | null; budget: number | null; currency: string;
  interests: string[]; travelStyle: string | null; accommodationPreferences: string[];
  transportPreferences: string[]; specialRequirements: string[];
};
type ContactDetails = { country: string; phoneNumber: string };
type CountryCallingCode = { country: string; code: string };
type CurrencyOption = { code: string; label: string };
type ChatMessage = { role: 'assistant' | 'user'; text: string };
type Stage = 'chat' | 'summary' | 'checkout' | 'done';

const emptyTrip = (): TravelDetails => ({ destination: null, durationDays: null, startDate: null, endDate: null, dateNotes: null,
  adults: 0, children: 0, departureCity: null, budget: null, currency: 'EUR', interests: [], travelStyle: null,
  accommodationPreferences: [], transportPreferences: [], specialRequirements: [] });
const emptyContact = (): ContactDetails => ({ country: '', phoneNumber: '' });

@Component({
  selector: 'app-landing', standalone: true, imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './landing.component.html', styleUrl: './landing.component.scss',
})
export class LandingComponent implements AfterViewChecked {
  private readonly http = inject(HttpClient);
  @ViewChild('chatInput') chatInput?: ElementRef<HTMLTextAreaElement>;
  @ViewChild('chatBody') private chatBody?: ElementRef<HTMLElement>;
  private pendingChatScroll = false;
  private chatIsPinnedToBottom = true;
  readonly messageControl = new FormControl('', { nonNullable: true, validators: [Validators.maxLength(2000)] });
  messages: ChatMessage[] = [{ role: 'assistant', text: "Hey there! 👋 I'm your travel planning assistant. Where are you dreaming of travelling?" }];
  details = emptyTrip();
  contact = emptyContact();
  readonly countryCallingCodes: CountryCallingCode[] = [
    { country: 'India', code: '+91' }, { country: 'United States', code: '+1' }, { country: 'Canada', code: '+1' },
    { country: 'United Kingdom', code: '+44' }, { country: 'Australia', code: '+61' }, { country: 'New Zealand', code: '+64' },
    { country: 'Singapore', code: '+65' }, { country: 'United Arab Emirates', code: '+971' }, { country: 'Nepal', code: '+977' },
    { country: 'Sri Lanka', code: '+94' }, { country: 'Bangladesh', code: '+880' }, { country: 'Pakistan', code: '+92' },
    { country: 'Germany', code: '+49' }, { country: 'France', code: '+33' }, { country: 'Italy', code: '+39' },
    { country: 'Spain', code: '+34' }, { country: 'Ireland', code: '+353' }, { country: 'Netherlands', code: '+31' },
    { country: 'Switzerland', code: '+41' }, { country: 'Japan', code: '+81' }, { country: 'South Korea', code: '+82' },
    { country: 'Thailand', code: '+66' }, { country: 'Malaysia', code: '+60' }, { country: 'Indonesia', code: '+62' },
    { country: 'South Africa', code: '+27' }, { country: 'Brazil', code: '+55' }, { country: 'Mexico', code: '+52' },
  ];
  readonly currencies: CurrencyOption[] = [
    { code: 'EUR', label: 'EUR (€)' }, { code: 'USD', label: 'USD ($)' }, { code: 'GBP', label: 'GBP (£)' },
    { code: 'INR', label: 'INR (₹)' }, { code: 'CAD', label: 'CAD ($)' }, { code: 'AUD', label: 'AUD ($)' },
  ];
  stage: Stage = 'chat';
  chatOpen = false;
  loading = false;
  error = '';
  summaryError = '';
  phoneTouched = false;
  phoneAttempted = false;
  selectedContact: 'whatsapp' | 'email' | 'both' = 'both';
  paymentComplete = false;
  heroImageFailed = false;
  consultationPrice = 9.99;
  consultationCurrency = 'EUR';
  guidePhone = '';
  guideEmail = '';
  guideName = 'Your Travel Guide';
  readonly prompts = ['Plan a weekend getaway', 'Help me plan a family holiday', 'I want an adventure trip'];

  constructor() {
    this.http.get<{ guideName: string; guideWhatsapp: string; guideEmail: string; consultationPrice: number; consultationCurrency: string }>(apiUrl('/api/public-config'))
      .subscribe({ next: config => { this.guideName = config.guideName || this.guideName; this.guidePhone = config.guideWhatsapp || ''; this.guideEmail = config.guideEmail || ''; this.consultationPrice = config.consultationPrice ?? 9.99; this.consultationCurrency = config.consultationCurrency || 'EUR'; }, error: () => undefined });
  }

  ngAfterViewChecked(): void {
    if (!this.pendingChatScroll || !this.chatBody) return;
    this.pendingChatScroll = false;
    const element = this.chatBody.nativeElement;
    element.scrollTop = Math.max(0, element.scrollHeight - element.clientHeight);
  }

  onChatScroll(): void {
    const element = this.chatBody?.nativeElement;
    if (!element) return;
    this.chatIsPinnedToBottom = element.scrollHeight - element.scrollTop - element.clientHeight <= 80;
  }

  private scrollChatToLatest(force = false): void {
    if (force || this.chatIsPinnedToBottom) this.pendingChatScroll = true;
  }

  openChat(): void { this.chatOpen = true; setTimeout(() => this.chatInput?.nativeElement.focus(), 50); }
  send(text = this.messageControl.value): void {
    const message = text.trim();
    if (!message || this.loading || message.length > 2000) return;
    this.messages.push({ role: 'user', text: message }); this.scrollChatToLatest(true); this.messageControl.setValue(''); this.error = ''; this.loading = true;
    const { adults, children, ...trip } = this.details;
    this.http.post<{ reply: string; travelDetails: TravelDetails }>(apiUrl('/api/chat'), {
      conversationId: 'demo-' + (sessionStorage.getItem('travel-demo-id') ?? this.newId()), message,
      travelDetails: { ...trip, travellers: { adults, children } },
      history: this.messages.slice(0, -1).slice(-12),
    }).pipe(finalize(() => this.loading = false)).subscribe({
      next: response => { this.messages.push({ role: 'assistant', text: response.reply }); this.scrollChatToLatest(); this.details = this.normalize(response.travelDetails); },
      error: () => { this.error = 'I couldn’t reach the planning assistant. Please try again in a moment.'; this.scrollChatToLatest(); }
    });
  }
  private newId(): string { const id = crypto.randomUUID(); sessionStorage.setItem('travel-demo-id', id); return id; }
  private normalize(d: TravelDetails & { travellers?: { adults: number; children: number } }): TravelDetails { return { ...emptyTrip(), ...d, currency: d.currency || 'EUR', adults: d.travellers?.adults ?? d.adults ?? 0, children: d.travellers?.children ?? d.children ?? 0, interests: d.interests ?? [], accommodationPreferences: d.accommodationPreferences ?? [], transportPreferences: d.transportPreferences ?? [], specialRequirements: d.specialRequirements ?? [] }; }
  restart(): void { this.messages = [{ role: 'assistant', text: "Hey there! 👋 I'm your travel planning assistant. Where are you dreaming of travelling?" }]; this.details = emptyTrip(); this.contact = emptyContact(); this.phoneTouched = false; this.phoneAttempted = false; this.stage = 'chat'; this.error = ''; this.summaryError = ''; sessionStorage.removeItem('travel-demo-id'); }
  get ready(): boolean { return !!this.details.destination?.trim() && (this.details.durationDays != null || !!this.details.startDate || !!this.details.dateNotes?.trim()) && this.details.adults + this.details.children > 0 && this.details.budget != null; }
  get canContactOnWhatsApp(): boolean { const digits = this.guidePhone.replace(/\D/g, ''); return digits.length >= 8 && digits.length <= 15; }
  get canContactByEmail(): boolean { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.guideEmail); }
  startSummary(): void { this.stage = 'summary'; this.chatOpen = false; }
  startCheckout(): void {
    const start = this.details.startDate ? new Date(this.details.startDate).getTime() : null;
    const end = this.details.endDate ? new Date(this.details.endDate).getTime() : null;
    if (!this.ready || this.details.adults < 0 || this.details.children < 0 || (this.details.durationDays != null && this.details.durationDays < 1) || this.details.budget == null || this.details.budget < 0 || !/^[A-Z]{3}$/.test(this.details.currency) || (start != null && end != null && end < start)) {
      this.summaryError = 'Please check the destination, dates, traveller count, duration, budget, and currency.';
      return;
    }
    this.phoneAttempted = this.requiresVisitorPhone;
    if (this.phoneError) { this.summaryError = ''; return; }
    this.summaryError = ''; this.stage = 'checkout';
  }
  completePayment(): void { this.paymentComplete = true; this.stage = 'done'; }
  get requiresVisitorPhone(): boolean { return this.selectedContact !== 'email'; }
  get validVisitorPhone(): string | null {
    const national = this.contact.phoneNumber.trim();
    if (!national || !/^[0-9().\s-]+$/.test(national)) return null;
    const nationalDigits = national.replace(/\D/g, '');
    const selectedCountry = this.countryCallingCodes.find(item => item.country === this.contact.country);
    if (!selectedCountry) return null;
    const countryDigits = selectedCountry.code.replace(/\D/g, '');
    const fullDigits = countryDigits + nationalDigits;
    return fullDigits.length >= 7 && fullDigits.length <= 15 ? `+${countryDigits} ${nationalDigits}` : null;
  }
  get phoneError(): string {
    if (!this.requiresVisitorPhone) return '';
    if (!this.contact.country) return 'Select a country calling code to continue with WhatsApp.';
    if (!this.contact.phoneNumber.trim()) return 'Phone number is required to continue with WhatsApp.';
    return this.validVisitorPhone ? '' : 'Enter a valid phone number using digits and common separators.';
  }
  get showPhoneError(): boolean { return !!this.phoneError && (this.phoneTouched || this.phoneAttempted); }
  get summaryText(): string {
    return [`Travel enquiry for ${this.details.destination || 'destination undecided'}`, `Dates: ${this.details.startDate || (this.details.durationDays ? `${this.details.durationDays} days, dates flexible` : 'to be decided')}${this.details.endDate ? ` to ${this.details.endDate}` : ''}${this.details.dateNotes ? ` (${this.details.dateNotes})` : ''}`, `Travellers: ${this.details.adults} adult(s), ${this.details.children} child(ren)`, `Budget: ${this.details.budget != null ? this.formatCurrency(this.details.budget, this.details.currency) : 'to be discussed'}`, `Departure: ${this.details.departureCity || 'not specified'}`, ...(this.validVisitorPhone ? [`Visitor phone: ${this.validVisitorPhone}`] : []), `Travel style: ${this.details.travelStyle || 'not specified'}`, `Interests: ${this.details.interests.join(', ') || 'not specified'}`, `Stay preferences: ${this.details.accommodationPreferences.join(', ') || 'not specified'}`, `Transport: ${this.details.transportPreferences.join(', ') || 'not specified'}`, `Special requirements: ${this.details.specialRequirements.join(', ') || 'none shared'}`].join('\n');
  }
  get formattedConsultationPrice(): string { return this.formatCurrency(this.consultationPrice, this.consultationCurrency); }
  private formatCurrency(amount: number, currency: string): string {
    try { return new Intl.NumberFormat('en-IE', { style: 'currency', currency }).format(amount); }
    catch { return `${currency} ${amount.toLocaleString()}`; }
  }
  whatsappUrl(): string { return `https://wa.me/${this.guidePhone.replace(/\D/g, '')}?text=${encodeURIComponent(this.summaryText)}`; }
  emailUrl(): string { return `mailto:${encodeURIComponent(this.guideEmail).replace(/%40/gi, '@')}?subject=${encodeURIComponent('Travel consultation enquiry')}&body=${encodeURIComponent(this.summaryText)}`; }
  onEnter(event: KeyboardEvent): void { if (!event.shiftKey) { event.preventDefault(); this.send(); } }
  setContact(value: 'whatsapp' | 'email' | 'both'): void { this.selectedContact = value; }
  updateList(field: 'interests' | 'accommodationPreferences' | 'transportPreferences' | 'specialRequirements', value: string): void {
    this.details[field] = value.split(',').map(item => item.trim()).filter(Boolean);
  }
}
