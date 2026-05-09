// UTM Parameter Builder for Social Media Automation
// Structure: utm_source=<network>, utm_medium=social, utm_campaign=<brand>-blog-<yyyy>

export interface UtmParams {
  source: string;       // facebook, instagram, twitter, linkedin, tiktok
  medium: string;       // social, email, cpc, organic
  campaign: string;     // brand-blog-2025, brand-promo-verano-2025
  content?: string;     // post-slug, button-cta
  term?: string;        // search term (for paid)
}

export interface SocialNetwork {
  code: string;
  name: string;
  utmSource: string;
  hashtagLimit: number;
  charLimit: number;
  linkStyle: 'inline' | 'bio' | 'story';
  bestPostTime: { weekday: number; hour: number };
}

// Supported social networks configuration
export const socialNetworks: Record<string, SocialNetwork> = {
  facebook: {
    code: 'fb',
    name: 'Facebook',
    utmSource: 'facebook',
    hashtagLimit: 5,
    charLimit: 2000,
    linkStyle: 'inline',
    bestPostTime: { weekday: 3, hour: 13 } // Wednesday 1pm
  },
  instagram: {
    code: 'ig',
    name: 'Instagram',
    utmSource: 'instagram',
    hashtagLimit: 30,
    charLimit: 2200,
    linkStyle: 'bio',
    bestPostTime: { weekday: 2, hour: 11 } // Tuesday 11am
  },
  twitter: {
    code: 'tw',
    name: 'Twitter/X',
    utmSource: 'twitter',
    hashtagLimit: 3,
    charLimit: 280,
    linkStyle: 'inline',
    bestPostTime: { weekday: 4, hour: 9 } // Thursday 9am
  },
  linkedin: {
    code: 'li',
    name: 'LinkedIn',
    utmSource: 'linkedin',
    hashtagLimit: 5,
    charLimit: 3000,
    linkStyle: 'inline',
    bestPostTime: { weekday: 2, hour: 10 } // Tuesday 10am
  },
  tiktok: {
    code: 'tt',
    name: 'TikTok',
    utmSource: 'tiktok',
    hashtagLimit: 5,
    charLimit: 2200,
    linkStyle: 'bio',
    bestPostTime: { weekday: 5, hour: 19 } // Friday 7pm
  },
  pinterest: {
    code: 'pin',
    name: 'Pinterest',
    utmSource: 'pinterest',
    hashtagLimit: 20,
    charLimit: 500,
    linkStyle: 'inline',
    bestPostTime: { weekday: 0, hour: 20 } // Sunday 8pm
  }
};

// Generate UTM tagged URL
export function buildUtmUrl(
  baseUrl: string,
  brandCode: string,
  networkCode: string,
  postSlug?: string,
  customCampaign?: string
): string {
  const network = socialNetworks[networkCode];
  if (!network) {
    throw new Error(`Unknown social network: ${networkCode}`);
  }

  const year = new Date().getFullYear();
  const campaign = customCampaign || `${brandCode}-blog-${year}`;
  
  const params = new URLSearchParams({
    utm_source: network.utmSource,
    utm_medium: 'social',
    utm_campaign: campaign,
    ...(postSlug && { utm_content: postSlug })
  });

  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}${params.toString()}`;
}

// Generate all social URLs for a blog post
export function generateSocialUrls(
  baseUrl: string,
  brandCode: string,
  postSlug: string,
  networks: string[] = ['facebook', 'instagram', 'twitter', 'linkedin']
): Record<string, string> {
  const urls: Record<string, string> = {};
  
  for (const network of networks) {
    urls[network] = buildUtmUrl(baseUrl, brandCode, network, postSlug);
  }
  
  return urls;
}

// Parse UTM parameters from URL
export function parseUtmFromUrl(url: string): UtmParams | null {
  try {
    const urlObj = new URL(url);
    const source = urlObj.searchParams.get('utm_source');
    const medium = urlObj.searchParams.get('utm_medium');
    const campaign = urlObj.searchParams.get('utm_campaign');
    
    if (!source || !medium || !campaign) {
      return null;
    }
    
    return {
      source,
      medium,
      campaign,
      content: urlObj.searchParams.get('utm_content') || undefined,
      term: urlObj.searchParams.get('utm_term') || undefined
    };
  } catch {
    return null;
  }
}

// Validate UTM parameters
export function validateUtmParams(params: Partial<UtmParams>): boolean {
  if (!params.source || !params.medium || !params.campaign) {
    return false;
  }
  
  // Validate source is a known network or generic
  const validSources = [...Object.values(socialNetworks).map(n => n.utmSource), 'email', 'google', 'bing', 'direct'];
  if (!validSources.includes(params.source)) {
    return false;
  }
  
  // Validate medium
  const validMediums = ['social', 'email', 'cpc', 'organic', 'referral', 'display'];
  if (!validMediums.includes(params.medium)) {
    return false;
  }
  
  return true;
}

// Format hashtags for a specific network
export function formatHashtags(
  hashtags: string[],
  networkCode: string
): string[] {
  const network = socialNetworks[networkCode];
  if (!network) return hashtags;
  
  // Limit hashtags to network maximum
  const limited = hashtags.slice(0, network.hashtagLimit);
  
  // Ensure all start with #
  return limited.map(tag => tag.startsWith('#') ? tag : `#${tag}`);
}

// Generate social post text optimized for each network
export function generateSocialPost(
  title: string,
  excerpt: string,
  url: string,
  hashtags: string[],
  networkCode: string
): string {
  const network = socialNetworks[networkCode];
  if (!network) return `${title}\n\n${excerpt}\n\n${url}`;
  
  const formattedHashtags = formatHashtags(hashtags, networkCode);
  const hashtagsText = formattedHashtags.join(' ');
  
  let post = '';
  
  switch (networkCode) {
    case 'twitter':
      // Twitter: Keep it short
      const tweetContent = excerpt.length > 180 ? excerpt.substring(0, 177) + '...' : excerpt;
      post = `${tweetContent}\n\n${url}\n\n${hashtagsText}`;
      break;
      
    case 'instagram':
      // Instagram: Hashtags at the end, link in bio
      post = `${title}\n\n${excerpt}\n\n.\n.\n.\n${hashtagsText}`;
      break;
      
    case 'linkedin':
      // LinkedIn: Professional, fewer hashtags
      post = `${title}\n\n${excerpt}\n\n${url}\n\n${hashtagsText}`;
      break;
      
    case 'facebook':
    default:
      post = `${title}\n\n${excerpt}\n\n${url}\n\n${hashtagsText}`;
      break;
  }
  
  // Truncate if over limit
  if (post.length > network.charLimit) {
    post = post.substring(0, network.charLimit - 3) + '...';
  }
  
  return post;
}
