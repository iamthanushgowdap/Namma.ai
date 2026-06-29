// Meta Instagram Graph Messaging API
// Documentation reference: https://developers.facebook.com/docs/messenger-platform/instagram-messaging

const META_GRAPH_VERSION = 'v19.0';
const META_GRAPH_URL = `https://graph.facebook.com/${META_GRAPH_VERSION}`;

function getGraphUrl(accessToken: string): string {
  const isDirectInstagram = accessToken && accessToken.startsWith('IGQ');
  return isDirectInstagram 
    ? `https://graph.instagram.com/${META_GRAPH_VERSION}` 
    : `https://graph.facebook.com/${META_GRAPH_VERSION}`;
}

/**
 * Custom fetch wrapper to support both graph.instagram.com and graph.facebook.com.
 * For direct Instagram tokens (starting with IGQ...), it appends the token as a query parameter.
 * For legacy Facebook Page tokens, it sends the token in the Authorization header.
 */
async function metaFetch(
  urlPath: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<Response> {
  const isDirect = accessToken && accessToken.startsWith('IGQ');
  const baseUrl = getGraphUrl(accessToken);
  const cleanPath = urlPath.startsWith('/') ? urlPath : `/${urlPath}`;
  let finalUrl = `${baseUrl}${cleanPath}`;
  
  const headers = new Headers(options.headers || {});
  
  console.log(`[Meta API Request] Path: ${cleanPath} | Token type: ${isDirect ? 'Direct Instagram (IGQ)' : 'Facebook Page (EAA)'}`);

  if (isDirect) {
    // Direct Instagram tokens require access_token in query string and do not support Authorization header
    const urlObj = new URL(finalUrl);
    urlObj.searchParams.set('access_token', accessToken);
    finalUrl = urlObj.toString();
  } else {
    // Facebook Page tokens can use the standard Authorization Bearer header
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  
  return fetch(finalUrl, {
    ...options,
    headers,
  });
}

/**
 * Sends a direct message (DM) to an Instagram user.
 * @param recipientId The Instagram scoped user ID of the recipient.
 * @param text The text content of the message.
 * @param pageAccessToken The access token of the connected Facebook Page.
 */
export async function sendInstagramMessage(
  recipientId: string,
  text: string,
  pageAccessToken: string
): Promise<{ message_id: string }> {
  const response = await metaFetch('/me/messages', pageAccessToken, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text: text },
    }),
  });

  const data = await response.json();
  
  if (data.error) {
    console.error('Meta Graph send message error:', data.error);
    throw new Error(`Failed to send Instagram message: ${data.error.message}`);
  }

  return {
    message_id: data.message_id,
  };
}

/**
 * Replies to a comment on an Instagram media post.
 * @param commentId The ID of the comment to reply to.
 * @param text The reply text content.
 * @param pageAccessToken The access token of the connected Facebook Page.
 */
export async function replyToComment(
  commentId: string,
  text: string,
  pageAccessToken: string
): Promise<{ id: string }> {
  const response = await metaFetch(`/${commentId}/replies`, pageAccessToken, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: text,
    }),
  });

  const data = await response.json();

  if (data.error) {
    console.error('Meta Graph comment reply error:', data.error);
    throw new Error(`Failed to reply to comment: ${data.error.message}`);
  }

  return {
    id: data.id,
  };
}

/**
 * Sends a private reply (DM) to an Instagram comment.
 * @param commentId The ID of the comment to reply to.
 * @param text The private reply message text.
 * @param pageAccessToken The access token of the connected Facebook Page.
 */
export async function sendInstagramPrivateReply(
  commentId: string,
  text: string,
  pageAccessToken: string
): Promise<{ message_id: string }> {
  const response = await metaFetch('/me/messages', pageAccessToken, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipient: { comment_id: commentId },
      message: { text: text },
    }),
  });

  const data = await response.json();
  
  if (data.error) {
    console.error('Meta Graph send private reply error:', data.error);
    throw new Error(`Failed to send Instagram private reply: ${data.error.message}`);
  }

  return {
    message_id: data.message_id,
  };
}

/**
 * Sends an interactive Follow-Gate card via DM using Instagram Generic Template.
 * The card includes a postback button the user taps to verify their follow.
 * @param recipientId - The Instagram scoped user ID to send the DM to
 * @param automationId - The automation ID (encoded in postback payload for stateless lookup)
 * @param igAccountUsername - The username of the business account (shown in card subtitle)
 * @param followGateMessage - Custom message text set by the workspace owner
 * @param pageAccessToken - Page access token for the connected account
 */
export async function sendFollowGateCard(
  recipientId: string,
  automationId: string,
  igAccountUsername: string,
  followGateMessage: string,
  pageAccessToken: string
): Promise<void> {
  const response = await metaFetch('/me/messages', pageAccessToken, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'generic',
            elements: [
              {
                title: '🔒 Followers-Only Access',
                subtitle: followGateMessage,
                buttons: [
                  {
                    type: 'postback',
                    title: '✅ I Have Followed!',
                    payload: `FOLLOW_GATE_CHECK::${automationId}::${recipientId}`,
                  },
                ],
              },
            ],
          },
        },
      },
    }),
  });

  const data = await response.json();
  if (data.error) {
    console.error('sendFollowGateCard error:', data.error);
    // Fallback: send plain text if template fails (e.g., account not template-approved)
    const fallbackResponse = await metaFetch('/me/messages', pageAccessToken, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: {
          text: `${followGateMessage}\n\nReply "FOLLOWED" once you have followed @${igAccountUsername} to get your exclusive link!`,
        },
      }),
    });
    const fbData = await fallbackResponse.json();
    if (fbData.error) {
      throw new Error(`Failed to send follow-gate DM: ${fbData.error.message}`);
    }
  }
}

/**
 * Sends a "Not Following Yet" DM card with a Recheck postback button.
 * Shown when the user taps "I've Followed" but is not actually following.
 * @param recipientId - The Instagram scoped user ID to send the DM to
 * @param automationId - The automation ID (encoded in postback payload)
 * @param igAccountUsername - The username of the business account
 * @param pageAccessToken - Page access token for the connected account
 */
export async function sendNotFollowingCard(
  recipientId: string,
  automationId: string,
  igAccountUsername: string,
  pageAccessToken: string
): Promise<void> {
  const response = await metaFetch('/me/messages', pageAccessToken, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'generic',
            elements: [
              {
                title: '❌ Not Following Yet',
                subtitle: `We could not verify your follow. Please follow @${igAccountUsername} on Instagram and then tap Recheck below.`,
                buttons: [
                  {
                    type: 'postback',
                    title: '🔄 Recheck',
                    payload: `FOLLOW_GATE_CHECK::${automationId}::${recipientId}`,
                  },
                ],
              },
            ],
          },
        },
      },
    }),
  });

  const data = await response.json();
  if (data.error) {
    console.error('sendNotFollowingCard error:', data.error);
    // Fallback: plain text
    const fallbackResponse = await metaFetch('/me/messages', pageAccessToken, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: {
          text: `We could not verify your follow yet. Please follow @${igAccountUsername} and reply "RECHECK" to try again!`,
        },
      }),
    });
    const fbData = await fallbackResponse.json();
    if (fbData.error) {
      throw new Error(`Failed to send not-following card: ${fbData.error.message}`);
    }
  }
}

/**
 * Sends an image/photo attachment to an Instagram user's DM.
 * @param recipientId The Instagram scoped user ID of the recipient.
 * @param imageUrl The public URL of the image/photo.
 * @param pageAccessToken The access token of the connected Facebook Page.
 */
export async function sendInstagramImageAttachment(
  recipientId: string,
  imageUrl: string,
  pageAccessToken: string
): Promise<{ message_id: string }> {
  const response = await metaFetch('/me/messages', pageAccessToken, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: {
        attachment: {
          type: 'image',
          payload: {
            url: imageUrl,
            is_reusable: true,
          },
        },
      },
    }),
  });

  const data = await response.json();

  if (data.error) {
    console.error('Meta Graph send image attachment error:', data.error);
    throw new Error(`Failed to send Instagram image: ${data.error.message}`);
  }

  return {
    message_id: data.message_id,
  };
}

/**
 * Sends a generic template carousel message.
 * Each element in `elements` can have up to 3 buttons.
 */
export async function sendInstagramGenericTemplate(
  recipientId: string,
  elements: Array<{
    title: string;
    image_url: string;
    subtitle?: string;
    buttons: Array<{
      type: 'web_url';
      url: string;
      title: string;
    }>;
  }>,
  pageAccessToken: string
): Promise<{ message_id: string }> {
  const response = await metaFetch('/me/messages', pageAccessToken, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'generic',
            image_aspect_ratio: 'horizontal', // 1.91:1 ratio
            elements: elements.map(el => ({
              title: el.title,
              image_url: el.image_url,
              subtitle: el.subtitle || '',
              buttons: el.buttons.map(btn => ({
                type: 'web_url',
                url: btn.url,
                title: btn.title,
              })),
            })),
          },
        },
      },
    }),
  });

  const data = await response.json();

  if (data.error) {
    console.error('Meta Graph send generic template error:', data.error);
    throw new Error(`Failed to send Instagram generic template: ${data.error.message}`);
  }

  return {
    message_id: data.message_id,
  };
}

/**
 * Sends a generic template carousel message as a private reply to a comment ID.
 * Each element in `elements` can have up to 3 buttons.
 */
export async function sendInstagramGenericTemplatePrivateReply(
  commentId: string,
  elements: Array<{
    title: string;
    image_url: string;
    subtitle?: string;
    buttons: Array<{
      type: 'web_url';
      url: string;
      title: string;
    }>;
  }>,
  pageAccessToken: string
): Promise<{ message_id: string }> {
  const response = await metaFetch('/me/messages', pageAccessToken, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipient: { comment_id: commentId },
      message: {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'generic',
            image_aspect_ratio: 'horizontal', // 1.91:1 ratio
            elements: elements.map(el => ({
              title: el.title,
              image_url: el.image_url,
              subtitle: el.subtitle || '',
              buttons: el.buttons.map(btn => ({
                type: 'web_url',
                url: btn.url,
                title: btn.title,
              })),
            })),
          },
        },
      },
    }),
  });

  const data = await response.json();

  if (data.error) {
    console.error('Meta Graph send generic template private reply error:', data.error);
    throw new Error(`Failed to send Instagram generic template private reply: ${data.error.message}`);
  }

  return {
    message_id: data.message_id,
  };
}
