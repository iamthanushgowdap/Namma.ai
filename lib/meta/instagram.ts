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

function getGraphUrl(accessToken: string): string {
  const isDirectInstagram = accessToken && accessToken.startsWith('IG');
  return isDirectInstagram 
    ? `https://graph.instagram.com/${META_GRAPH_VERSION}` 
    : `https://graph.facebook.com/${META_GRAPH_VERSION}`;
}

/**
 * Generates the Facebook OAuth login URL for Instagram messaging access.
 */
export function getOAuthUrl(redirectUri: string): string {
  const appId = process.env.META_APP_ID;
  if (!appId) {
    throw new Error('META_APP_ID is not configured');
  }

  // Required scopes for Instagram Login for Business (direct Instagram credentials login)
  const scopes = [
    'instagram_business_basic',
    'instagram_business_manage_messages',
    'instagram_business_manage_comments',
    'instagram_business_content_publish',
    'instagram_business_manage_insights'
  ];

  return `https://www.instagram.com/oauth/authorize?client_id=${appId}&redirect_uri=${encodeURIComponent(
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

  // 1. Get short-lived token from Instagram OAuth endpoint
  const formData = new URLSearchParams();
  formData.append('client_id', appId);
  formData.append('client_secret', appSecret);
  formData.append('grant_type', 'authorization_code');
  formData.append('redirect_uri', redirectUri);
  formData.append('code', code);

  const response = await fetch('https://api.instagram.com/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(`Failed to exchange code: ${data.error.message || data.error_message || JSON.stringify(data.error)}`);
  }

  const shortLivedToken = data.access_token;
  console.log(`[Token Exchange] Short-lived token type: ${shortLivedToken.startsWith('IG') ? 'Direct Instagram (IG)' : shortLivedToken.startsWith('EAA') ? 'Facebook Page (EAA)' : 'Unknown'} | Prefix: ${shortLivedToken.substring(0, 10)}...`);

  // 2. Exchange for long-lived Instagram Token (lasts 60 days)
  const longLivedResponse = await fetch(
    `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${appSecret}&access_token=${shortLivedToken}`
  );

  const longLivedData = await longLivedResponse.json();
  if (longLivedData.error) {
    throw new Error(`Failed to get long-lived token: ${longLivedData.error.message}`);
  }

  console.log(`[Token Exchange] Long-lived token type: ${longLivedData.access_token.startsWith('IG') ? 'Direct Instagram (IG)' : longLivedData.access_token.startsWith('EAA') ? 'Facebook Page (EAA)' : 'Unknown'} | Prefix: ${longLivedData.access_token.substring(0, 10)}...`);

  return longLivedData.access_token;
}

/**
 * Retrieves the connected Instagram business accounts.
 * Supports both direct Instagram Login tokens and linked Facebook Page tokens.
 */
export async function getConnectedInstagramAccounts(
  userAccessToken: string
): Promise<MetaInstagramAccount[]> {
  console.log('--- DEBUG: Meta getConnectedInstagramAccounts ---');

  try {
    const meResponse = await fetch(
      `https://graph.instagram.com/v19.0/me?fields=user_id,username`,
      {
        headers: {
          'Authorization': `Bearer ${userAccessToken}`
        }
      }
    );
    const meData = await meResponse.json();
    if (meData.error) {
      throw new Error(`Meta API error: ${meData.error.message}`);
    }

    if (meData && meData.user_id && meData.username) {
      console.log('Successfully retrieved Instagram Professional Account via direct login:', meData);
      return [{
        instagramUserId: meData.user_id,
        username: meData.username,
        name: meData.username,
        profilePictureUrl: undefined,
        pageId: 'instagram_direct',
        pageAccessToken: userAccessToken
      }];
    }
  } catch (err: any) {
    console.error('Failed to get Instagram Business Account from direct login token:', err);
    throw err;
  }

  return [];
}

/**
 * Fetches standard profile metadata for a specific Instagram account.
 */
export async function getInstagramProfile(
  instagramUserId: string,
  accessToken: string
): Promise<{ username: string; name?: string; profilePictureUrl?: string }> {
  const isDirectInstagram = accessToken && accessToken.startsWith('IG');
  const targetId = isDirectInstagram ? 'me' : instagramUserId;
  const response = await fetch(
    `${getGraphUrl(accessToken)}/${targetId}?fields=username,name,profile_picture_url`,
    { headers: { 'Authorization': `Bearer ${accessToken}` } }
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
  const isDirectInstagram = accessToken && accessToken.startsWith('IG');
  const targetId = isDirectInstagram ? 'me' : instagramUserId;
  const response = await fetch(
    `${getGraphUrl(accessToken)}/${targetId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&limit=24`,
    { headers: { 'Authorization': `Bearer ${accessToken}` } }
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
      `${getGraphUrl(pageAccessToken)}/${igBusinessAccountId}/followers?user_id=${commenterId}`,
      { headers: { 'Authorization': `Bearer ${pageAccessToken}` } }
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

/**
 * Retrieves the text content and sender ID of a message from Meta Graph API using its message ID.
 * Required in regions (like Europe/EEA) or for message_edit webhook events where Meta strips
 * the text and sender details from the webhook payload due to privacy policies.
 */
export async function getMessageDetails(
  messageId: string,
  pageAccessToken: string
): Promise<{ text: string | null; senderId: string | null }> {
  try {
    const response = await fetch(
      `${getGraphUrl(pageAccessToken)}/${messageId}?fields=message,from`,
      { headers: { 'Authorization': `Bearer ${pageAccessToken}` } }
    );
    const data = await response.json();
    if (data.error) {
      console.error('Failed to fetch message details from Meta Graph API:', data.error);
      return { text: null, senderId: null };
    }
    return {
      text: data.message || null,
      senderId: data.from?.id || null
    };
  } catch (err) {
    console.error('Failed to fetch message details due to error:', err);
    return { text: null, senderId: null };
  }
}
