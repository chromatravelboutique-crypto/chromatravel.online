declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

type EventCategory = 
  | 'engagement'
  | 'lead_generation'
  | 'booking'
  | 'content'
  | 'navigation'
  | 'social';

interface TrackEventParams {
  category: EventCategory;
  action: string;
  label?: string;
  value?: number;
  customParams?: Record<string, any>;
}

export function trackEvent({ category, action, label, value, customParams }: TrackEventParams) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
      ...customParams
    });
  }
}

export function trackPageView(pagePath: string, pageTitle?: string) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'page_view', {
      page_path: pagePath,
      page_title: pageTitle
    });
  }
}

export function trackLeadSubmit(formName: string, leadSource?: string) {
  trackEvent({
    category: 'lead_generation',
    action: 'lead_submit',
    label: formName,
    customParams: {
      lead_source: leadSource || 'website'
    }
  });
  
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'conversion', {
      send_to: 'AW-CONVERSION_ID/LABEL',
      event_callback: () => {}
    });
  }
}

export function trackBookingStart(hotelName: string, destination: string) {
  trackEvent({
    category: 'booking',
    action: 'booking_start',
    label: hotelName,
    customParams: {
      destination: destination
    }
  });
}

export function trackBookingComplete(bookingValue: number, currency: string = 'MXN') {
  trackEvent({
    category: 'booking',
    action: 'booking_complete',
    value: bookingValue,
    customParams: {
      currency: currency
    }
  });
  
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'purchase', {
      transaction_id: `TXN_${Date.now()}`,
      value: bookingValue,
      currency: currency
    });
  }
}

export function trackWhatsAppClick(context: string) {
  trackEvent({
    category: 'engagement',
    action: 'whatsapp_click',
    label: context
  });
}

export function trackCTAClick(ctaName: string, ctaLocation: string) {
  trackEvent({
    category: 'engagement',
    action: 'cta_click',
    label: ctaName,
    customParams: {
      cta_location: ctaLocation
    }
  });
}

export function trackBlogRead(postSlug: string, postCategory: string, readPercentage?: number) {
  trackEvent({
    category: 'content',
    action: 'blog_read',
    label: postSlug,
    customParams: {
      post_category: postCategory,
      read_percentage: readPercentage
    }
  });
}

export function trackAffiliateClick(productName: string, affiliateSource: string) {
  trackEvent({
    category: 'engagement',
    action: 'affiliate_click',
    label: productName,
    customParams: {
      affiliate_source: affiliateSource
    }
  });
}

export function trackDestinationView(destinationName: string) {
  trackEvent({
    category: 'content',
    action: 'destination_view',
    label: destinationName
  });
}

export function trackHotelSearch(destination: string, checkIn: string, checkOut: string, guests: number) {
  trackEvent({
    category: 'booking',
    action: 'hotel_search',
    label: destination,
    customParams: {
      check_in: checkIn,
      check_out: checkOut,
      guests: guests
    }
  });
}

export function trackSocialShare(platform: string, contentType: string) {
  trackEvent({
    category: 'social',
    action: 'share',
    label: platform,
    customParams: {
      content_type: contentType
    }
  });
}
