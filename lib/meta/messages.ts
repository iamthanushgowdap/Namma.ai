// Meta Instagram Graph Messaging API
// Documentation reference: https://developers.facebook.com/docs/messenger-platform/instagram-messaging

const META_GRAPH_VERSION = 'v19.0';
const META_GRAPH_URL = `https://graph.facebook.com/${META_GRAPH_VERSION}`;

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
  const url = `${META_GRAPH_URL}/me/messages?access_token=${pageAccessToken}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      recipient: {
        id: recipientId,
      },
      message: {
        text: text,
      },
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
  const url = `${META_GRAPH_URL}/${commentId}/replies?access_token=${pageAccessToken}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
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
  const url = `${META_GRAPH_URL}/me/messages?access_token=${pageAccessToken}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      recipient: {
        comment_id: commentId,
      },
      message: {
        text: text,
      },
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
  const url = `${META_GRAPH_URL}/me/messages?access_token=${pageAccessToken}`;

  const response = await fetch(url, {
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
    const fallback = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: {
          text: `${followGateMessage}\n\nReply "FOLLOWED" once you have followed @${igAccountUsername} to get your exclusive link!`,
        },
      }),
    });
    const fbData = await fallback.json();
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
  const url = `${META_GRAPH_URL}/me/messages?access_token=${pageAccessToken}`;

  const response = await fetch(url, {
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
    const fallback = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: {
          text: `We could not verify your follow yet. Please follow @${igAccountUsername} and reply "RECHECK" to try again!`,
        },
      }),
    });
    const fbData = await fallback.json();
    if (fbData.error) {
      throw new Error(`Failed to send not-following card: ${fbData.error.message}`);
    }
  }
}
