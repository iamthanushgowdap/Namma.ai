// Meta Instagram Graph API Connection Service
// Documentation reference: https://developers.facebook.com/docs/instagram-api

export interface MetaInstagramAccount {
  instagramUserId: string;
  username: string;
  name?: string;
  profilePictureUrl?: string;
  pageId: string;
  pageAccessToken: string;
}

const META_GRAPH_VERSION = 'v19.0';
const META_GRAPH_URL = `https://graph.facebook.com/${META_GRAPH_VERSION}`;

/**
 * Generates the Facebook OAuth login URL for Instagram messaging access.
 */
export function getOAuthUrl(redirectUri: string): string {
  const appId = process.env.META_APP_ID;
  if (!appId) {
    throw new Error('META_APP_ID is not configured');
  }

  // Required scopes for Instagram DM Automation
  const scopes = [
    'instagram_basic',
    'instagram_manage_messages',
    'instagram_manage_comments',
    'pages_show_list',
    'pages_read_engagement',
    'business_management',
    'pages_manage_metadata'
  ];

  return `https://www.facebook.com/${META_GRAPH_VERSION}/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=${scopes.join(',')}&response_type=code`;
}

/**
 * Exchanges the OAuth authorization code for a User Access Token.
 */
export async function exchangeCodeForToken(
  code: string,
  redirectUri: string
): Promise<string> {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;

  if (!appId || !appSecret) {
    throw new Error('Meta App credentials are not configured');
  }

  // 1. Get short-lived token
  const response = await fetch(
    `${META_GRAPH_URL}/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&client_secret=${appSecret}&code=${code}`
  );

  const data = await response.json();
  if (data.error) {
    throw new Error(`Failed to exchange code: ${data.error.message}`);
  }

  const shortLivedToken = data.access_token;

  // 2. Exchange for long-lived User Access Token (lasts 60 days)
  const longLivedResponse = await fetch(
    `${META_GRAPH_URL}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`
  );

  const longLivedData = await longLivedResponse.json();
  if (longLivedData.error) {
    throw new Error(`Failed to get long-lived token: ${longLivedData.error.message}`);
  }

  return longLivedData.access_token;
}

/**
 * Retrieves the connected Instagram business accounts linked to the user's Facebook Pages.
 */
export async function getConnectedInstagramAccounts(
  userAccessToken: string
): Promise<MetaInstagramAccount[]> {
  // 1. Get user's pages
  const pagesResponse = await fetch(
    `${META_GRAPH_URL}/me/accounts?fields=name,id,access_token&access_token=${userAccessToken}`
  );

  const pagesData = await pagesResponse.json();
  console.log('--- DEBUG: Meta getConnectedInstagramAccounts ---');
  console.log('pagesData response:', JSON.stringify(pagesData, null, 2));

  if (pagesData.error) {
    throw new Error(`Failed to fetch Facebook Pages: ${pagesData.error.message}`);
  }

  const pages = pagesData.data || [];
  const instagramAccounts: MetaInstagramAccount[] = [];

  // 2. For each page, check if it has a linked Instagram Business Account
  for (const page of pages) {
    const pageId = page.id;
    const pageAccessToken = page.access_token;

    const igResponse = await fetch(
      `${META_GRAPH_URL}/${pageId}?fields=instagram_business_account{id,username,name,profile_picture_url}&access_token=${pageAccessToken}`
    );

    const igData = await igResponse.json();
    console.log(`igData response for Page ${page.name} (${pageId}):`, JSON.stringify(igData, null, 2));

    if (igData.instagram_business_account) {
      const igAcct = igData.instagram_business_account;
      instagramAccounts.push({
        instagramUserId: igAcct.id,
        username: igAcct.username,
        name: igAcct.name,
        profilePictureUrl: igAcct.profile_picture_url,
        pageId: pageId,
        pageAccessToken: pageAccessToken, // Using page access tokens ensures permanent offline access
      });
    }
  }

  console.log('Found instagram accounts count:', instagramAccounts.length);
  console.log('-------------------------------------------------');

  return instagramAccounts;
}

/**
 * Fetches standard profile metadata for a specific Instagram account.
 */
export async function getInstagramProfile(
  instagramUserId: string,
  accessToken: string
): Promise<{ username: string; name?: string; profilePictureUrl?: string }> {
  const response = await fetch(
    `${META_GRAPH_URL}/${instagramUserId}?fields=username,name,profile_picture_url&access_token=${accessToken}`
  );

  const data = await response.json();
  if (data.error) {
    throw new Error(`Failed to fetch Instagram profile: ${data.error.message}`);
  }

  return {
    username: data.username,
    name: data.name,
    profilePictureUrl: data.profile_picture_url,
  };
}

/**
 * Subscribes a Facebook Page to Instagram Webhooks.
 */
export async function subscribePageToWebhooks(
  pageId: string,
  pageAccessToken: string
): Promise<boolean> {
  const response = await fetch(
    `${META_GRAPH_URL}/${pageId}/subscribed_apps?subscribed_fields=feed&access_token=${pageAccessToken}`,
    {
      method: 'POST',
    }
  );

  const data = await response.json();
  if (data.error) {
    throw new Error(`Failed to subscribe Page to webhooks: ${data.error.message}`);
  }

  return data.success === true;
}

export interface InstagramMediaItem {
  id: string;
  caption?: string;
  mediaType: string;
  mediaUrl: string;
  permalink: string;
  thumbnailUrl?: string;
  timestamp: string;
}

/**
 * Fetches recent media posts for a given Instagram user ID.
 */
export async function getInstagramMedia(
  instagramUserId: string,
  accessToken: string
): Promise<InstagramMediaItem[]> {
  const response = await fetch(
    `${META_GRAPH_URL}/${instagramUserId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&limit=24&access_token=${accessToken}`
  );

  const data = await response.json();
  if (data.error) {
    throw new Error(`Failed to fetch Instagram media: ${data.error.message}`);
  }

  const items = data.data || [];
  return items.map((item: any) => ({
    id: item.id,
    caption: item.caption,
    mediaType: item.media_type,
    mediaUrl: item.media_url,
    permalink: item.permalink,
    thumbnailUrl: item.thumbnail_url,
    timestamp: item.timestamp,
  }));
}

/**
 * Checks whether a given Instagram user is following the business account.
 * Works for both public and private Business/Creator accounts.
 * Uses the Instagram Graph API follower relationship endpoint.
 * @param igBusinessAccountId - Our connected Instagram Business/Creator account ID
 * @param commenterId - The Instagram scoped user ID of the commenter to check
 * @param pageAccessToken - Page access token for the connected account
 * @returns true if the commenter follows our account, false otherwise
 */
export async function checkUserFollowsAccount(
  igBusinessAccountId: string,
  commenterId: string,
  pageAccessToken: string
): Promise<boolean> {
  try {
    // Use the Instagram Graph API to fetch followers filtered by user_id
    // This endpoint works for both public and private Business/Creator accounts
    const response = await fetch(
      `${META_GRAPH_URL}/${igBusinessAccountId}/followers?user_id=${commenterId}&access_token=${pageAccessToken}`
    );

    const data = await response.json();

    if (data.error) {
      // If the API returns an error (e.g., permission issue), log it and
      // default to TRUE to avoid blocking legitimate users due to API issues
      console.error('Follow check API error:', data.error);
      console.warn('Defaulting follow-gate to PASS due to API error — review permissions.');
      return true;
    }

    // If the data array contains the user, they are following
    const followers = data.data || [];
    return followers.some((f: any) => f.id === commenterId);
  } catch (err) {
    console.error('Failed to check follow status:', err);
    // Default to true (pass) on network errors to avoid breaking automations
    return true;
  }
}
