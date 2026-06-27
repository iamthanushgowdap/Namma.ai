import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { decrypt } from '@/lib/crypto'
import { 
  sendInstagramMessage, 
  replyToComment, 
  sendInstagramPrivateReply, 
  sendFollowGateCard, 
  sendNotFollowingCard, 
  sendInstagramImageAttachment,
  sendInstagramGenericTemplate,
  sendInstagramGenericTemplatePrivateReply
} from '@/lib/meta/messages'
import { checkUserFollowsAccount, getMessageDetails } from '@/lib/meta/instagram'
import { getAIResponse } from '@/lib/ai-engine'
import crypto from 'crypto'

/**
 * GET Handler for Meta Webhook subscription verification.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  const verifyToken = process.env.META_VERIFY_TOKEN

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('Meta Webhook verified successfully.')
    return new Response(challenge, { status: 200 })
  }

  console.error('Meta Webhook verification failed. Tokens mismatch.')
  return new Response('Forbidden', { status: 403 })
}

/**
 * POST Handler for Meta Webhook events (incoming messages/comments).
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  console.log('--- INCOMING WEBHOOK POST PAYLOAD ---')
  console.log(rawBody)
  console.log('-------------------------------------')
  const signature = request.headers.get('x-hub-signature-256')

  // Verify Meta Request Signature for security (enforced only in production unless bypassed)
  if (process.env.META_APP_SECRET && signature && process.env.NODE_ENV !== 'development' && process.env.BYPASS_SIGNATURE_CHECK !== 'true') {
    const expectedSignature = crypto
      .createHmac('sha256', process.env.META_APP_SECRET)
      .update(rawBody)
      .digest('hex')

    const actualSignature = signature.replace('sha256=', '')

    if (expectedSignature !== actualSignature) {
      console.error('Webhook signature verification failed.')
      console.log('--- Webhook Signature Mismatch Debug ---')
      console.log(`Expected (computed): ${expectedSignature}`)
      console.log(`Actual (from Meta): ${actualSignature}`)
      console.log(`App Secret configured: ${process.env.META_APP_SECRET ? 'Yes (length: ' + process.env.META_APP_SECRET.length + ')' : 'No'}`)
      console.log('----------------------------------------')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  } else if (process.env.NODE_ENV === 'development' || process.env.BYPASS_SIGNATURE_CHECK === 'true') {
    console.log('Bypassing signature verification (development mode or BYPASS_SIGNATURE_CHECK enabled).')
  }

  let payload: any
  try {
    payload = JSON.parse(rawBody)
  } catch (err) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Ensure object type is instagram
  if (payload.object !== 'instagram') {
    return NextResponse.json({ success: true, message: 'Non-Instagram event skipped' })
  }

  const supabase = createAdminClient()

  try {
    for (const entry of payload.entry) {
      const igAccountId = entry.id // Instagram Business Account ID

      // 1. Fetch connected Instagram account from DB (bypass RLS using admin client)
      const { data: igAccount, error: dbError } = await supabase
        .from('instagram_accounts')
        .select('*')
        .eq('instagram_user_id', igAccountId)
        .single()

      if (dbError || !igAccount) {
        console.warn(`Instagram account not connected for ID: ${igAccountId}`)
        continue
      }

      const workspaceId = igAccount.workspace_id
      const pageAccessToken = decrypt(igAccount.access_token_encrypted)

      // Fetch AI Settings to check channel toggles, master toggle, and reply delay
      const { data: settings } = await supabase
        .from('ai_settings')
        .select('ai_enabled, respond_on_dms, respond_on_comments, reply_delay_seconds')
        .eq('workspace_id', workspaceId)
        .single()

      // 2. Process incoming Messages (Direct Messages) and Postback Events
      if (entry.messaging) {
        for (const messagingEvent of entry.messaging) {
          let senderId = messagingEvent.sender?.id
          const recipientId = messagingEvent.recipient?.id

          // ── 2a. Handle Follow-Gate Postback Button Taps ──────────────────────
          if (messagingEvent.postback?.payload?.startsWith('FOLLOW_GATE_CHECK::')) {
            // Ignore self-sent postbacks
            if (senderId === igAccountId) continue

            const parts = messagingEvent.postback.payload.split('::')
            const automationId = parts[1]
            const originalCommenterId = parts[2]

            console.log(`Follow-gate postback received: automation=${automationId}, commenter=${originalCommenterId}, sender=${senderId}`)

            try {
              // Fetch the automation with its rule and follow-gate settings
              const { data: automation, error: autoErr } = await supabase
                .from('automations')
                .select('*, automation_rules(*)')
                .eq('id', automationId)
                .eq('workspace_id', workspaceId)
                .single()

              if (autoErr || !automation) {
                console.error('Follow-gate: automation not found:', autoErr)
                continue
              }

              // Fetch connected account username for card subtitle
              const igUsername = igAccount.username || 'our account'

              // Check if the user who tapped is now actually following
              const isFollowing = await checkUserFollowsAccount(igAccountId, senderId, pageAccessToken)

              // Log this follow-gate check to webhook_events
              await supabase.from('webhook_events').insert({
                workspace_id: workspaceId,
                event_type: isFollowing ? 'follow_gate_passed' : 'follow_gate_blocked',
                payload: {
                  automation_id: automationId,
                  commenter_id: senderId,
                  is_following: isFollowing,
                  timestamp: new Date().toISOString(),
                },
              })

              if (isFollowing) {
                // ✅ FOLLOWING — Send the actual automation response DM
                const rule = automation.automation_rules?.[0]
                const responseCards = rule?.response_cards || []
                
                if (rule) {
                  if (Array.isArray(responseCards) && responseCards.length > 0) {
                    // Send generic template carousel
                    await sendInstagramGenericTemplate(senderId, responseCards, pageAccessToken)

                    // Record in conversations/messages
                    const { data: conv } = await supabase
                      .from('conversations')
                      .upsert(
                        { workspace_id: workspaceId, instagram_user_id: senderId, status: 'active' },
                        { onConflict: 'workspace_id, instagram_user_id' }
                      )
                      .select()
                      .single()

                    if (conv) {
                      await supabase.from('messages').insert({
                        conversation_id: conv.id,
                        sender: 'ai',
                        content: '[Interactive Cards Carousel sent]',
                      })
                    }
                  } else {
                    // Send photo attachment if configured
                    if (rule.image_url) {
                      try {
                        await sendInstagramImageAttachment(senderId, rule.image_url, pageAccessToken)
                      } catch (imgErr) {
                        console.error('Failed to send image attachment in postback:', imgErr)
                      }
                    }

                    if (rule.response_message) {
                      await sendInstagramMessage(senderId, rule.response_message, pageAccessToken)

                      // Record in conversations/messages
                      const { data: conv } = await supabase
                        .from('conversations')
                        .upsert(
                          { workspace_id: workspaceId, instagram_user_id: senderId, status: 'active' },
                          { onConflict: 'workspace_id, instagram_user_id' }
                        )
                        .select()
                        .single()

                      if (conv) {
                        await supabase.from('messages').insert({
                          conversation_id: conv.id,
                          sender: 'ai',
                          content: rule.response_message,
                        })
                      }
                    }
                  }
                }
              } else {
                // ❌ NOT FOLLOWING — Send the "Recheck" card
                await sendNotFollowingCard(senderId, automationId, igUsername, pageAccessToken)
              }
            } catch (postbackErr) {
              console.error('Failed to process follow-gate postback:', postbackErr)
            }

            continue // Done processing this postback event
          }

          // Ignore message_edit events completely to prevent double responses
          if (messagingEvent.message_edit) {
            continue
          }

          // ── 2b. Handle Regular DMs ───────────────────────────────────────────
          let messageText = messagingEvent.message?.text
          const messageId = messagingEvent.message?.mid

          if ((!messageText || !senderId) && messageId) {
            console.log(`Message text or sender ID missing from payload, fetching via Graph API for ID: ${messageId}`)
            try {
              const details = await getMessageDetails(messageId, pageAccessToken)
              if (details.text) {
                messageText = details.text
              }
              if (details.senderId) {
                senderId = details.senderId
              }
              console.log(`Successfully fetched details from Graph API - Text: "${messageText}", Sender ID: "${senderId}"`)
            } catch (fetchErr) {
              console.error('Failed to fetch message details content:', fetchErr)
            }
          }

          // Ignore self-sent webhook notifications to prevent infinite reply loops
          if (senderId === igAccountId || !messageText) {
            continue
          }

          // Log Webhook Event
          await supabase.from('webhook_events').insert({
            workspace_id: workspaceId,
            event_type: 'message_received',
            payload: messagingEvent,
          })

          // Retrieve or create conversation for the user in this workspace
          const { data: conversation, error: convError } = await supabase
            .from('conversations')
            .upsert(
              {
                workspace_id: workspaceId,
                instagram_user_id: senderId,
                status: 'active',
              },
              { onConflict: 'workspace_id, instagram_user_id' }
            )
            .select()
            .single()

          if (convError || !conversation) {
            console.error('Failed to resolve conversation:', convError)
            continue
          }

          // Insert incoming message
          await supabase.from('messages').insert({
            conversation_id: conversation.id,
            sender: 'instagram_user',
            content: messageText,
          })

          // Check Automation Triggers (Direct DM Keyword match)
          let automationMatched = false
          const { data: automations } = await supabase
            .from('automations')
            .select('*, automation_rules(*)')
            .eq('workspace_id', workspaceId)
            .eq('status', 'active')

          if (automations) {
            for (const auto of automations) {
              for (const rule of auto.automation_rules) {
                const keywords = rule.keyword.split(',').map((k: string) => k.trim().toLowerCase()).filter(Boolean)
                const matched = keywords.some((kw: string) => messageText.toLowerCase().includes(kw))
                if (matched) {
                  automationMatched = true
                  
                  // Send Instagram Message reply
                  try {
                    const responseCards = rule.response_cards || []
                    if (Array.isArray(responseCards) && responseCards.length > 0) {
                      // Send generic template carousel
                      await sendInstagramGenericTemplate(senderId, responseCards, pageAccessToken)

                      // Save outbound message to DB
                      await supabase.from('messages').insert({
                        conversation_id: conversation.id,
                        sender: 'ai',
                        content: '[Interactive Cards Carousel sent]',
                      })
                    } else {
                      // Send photo attachment if configured
                      if (rule.image_url) {
                        try {
                          await sendInstagramImageAttachment(senderId, rule.image_url, pageAccessToken)
                        } catch (imgErr) {
                          console.error('Failed to send image attachment in direct DM:', imgErr)
                        }
                      }

                      if (rule.response_message) {
                        await sendInstagramMessage(senderId, rule.response_message, pageAccessToken)

                        // Save outbound message to DB
                        await supabase.from('messages').insert({
                          conversation_id: conversation.id,
                          sender: 'ai',
                          content: rule.response_message,
                        })
                      }
                    }
                  } catch (sendErr) {
                    console.error('Failed to send Instagram DM reply for automation:', sendErr)
                  }
                  
                  break
                }
              }
              if (automationMatched) break
            }
          }

          // If no automation matched, run the AI Intent Response Engine
          if (!automationMatched && (!settings || (settings.ai_enabled !== false && settings.respond_on_dms !== false))) {
            const { intent, response } = await getAIResponse(workspaceId, messageText)

            if (response) {
              // Apply reply delay if configured
              if (settings?.reply_delay_seconds && settings.reply_delay_seconds > 0) {
                await new Promise(resolve => setTimeout(resolve, settings.reply_delay_seconds * 1000))
              }

              // Send DM
              try {
                await sendInstagramMessage(senderId, response, pageAccessToken)

                // Save outbound message to DB
                await supabase.from('messages').insert({
                  conversation_id: conversation.id,
                  sender: 'ai',
                  content: response,
                })
              } catch (sendErr) {
                console.error('Failed to send Instagram DM reply via AI Agent:', sendErr)
              }
            }
          }
        }
      }

      // 3. Process incoming Comments on media
      if (entry.changes) {
        for (const change of entry.changes) {
          if (change.field === 'comments') {
            const commentValue = change.value
            const commentId = commentValue.id
            const commentText = commentValue.text
            const commenterId = commentValue.from?.id

            // Ignore comments made by the Business page itself
            if (commenterId === igAccountId || !commentText) {
              continue
            }

            // Log Webhook Event
            await supabase.from('webhook_events').insert({
              workspace_id: workspaceId,
              event_type: 'comment_received',
              payload: commentValue,
            })

            let commentAutomated = false
            // Check if comment keyword matches any active automation triggers
            const { data: automations } = await supabase
              .from('automations')
              .select('*, automation_rules(*)')
              .eq('workspace_id', workspaceId)
              .eq('status', 'active')

            // --- SAME-FOR-NEXT POST FEATURE IMPLEMENTATION ---
            const mediaId = commentValue.media?.id
            if (mediaId && automations) {
              const hasExistingAuto = automations.some(a => a.media_id === mediaId)
              if (!hasExistingAuto) {
                // Double check DB directly to handle concurrent webhook race conditions
                const { data: dbExistingAuto } = await supabase
                  .from('automations')
                  .select('id')
                  .eq('workspace_id', workspaceId)
                  .eq('media_id', mediaId)
                  .limit(1)

                if (!dbExistingAuto || dbExistingAuto.length === 0) {
                  // Find active automation with same_for_next enabled targeting a specific post
                  const parentAuto = automations.find(a => a.media_id && a.same_for_next === true)
                  if (parentAuto) {
                    console.log(`Same-for-next: cloning automation ${parentAuto.id} for new media post ${mediaId}`)
                    try {
                      // Fetch details of the new media from Instagram Graph API
                      const mediaDetailsUrl = `https://graph.facebook.com/v19.0/${mediaId}?fields=permalink,media_url,thumbnail_url,media_type&access_token=${pageAccessToken}`
                      const mediaDetailsRes = await fetch(mediaDetailsUrl)
                      const mediaDetails = await mediaDetailsRes.json()
                      
                      if (!mediaDetails.error) {
                        const thumbnail = mediaDetails.thumbnail_url || mediaDetails.media_url
                        const permalink = mediaDetails.permalink
                        
                        // Insert new cloned automation record in database
                        const { data: newAuto } = await supabase
                          .from('automations')
                          .insert({
                            workspace_id: workspaceId,
                            name: `${parentAuto.name} (Auto-applied)`,
                            trigger_type: parentAuto.trigger_type,
                            status: 'active',
                            media_id: mediaId,
                            media_permalink: permalink || null,
                            media_thumbnail_url: thumbnail || null,
                            follow_gate_enabled: parentAuto.follow_gate_enabled,
                            follow_gate_message: parentAuto.follow_gate_message,
                            same_for_next: true, // Keep it active for the next post too (chains sequentially)
                          })
                          .select()
                          .single()

                        if (newAuto) {
                          const parentRule = parentAuto.automation_rules?.[0]
                          if (parentRule) {
                            await supabase
                              .from('automation_rules')
                              .insert({
                                automation_id: newAuto.id,
                                keyword: parentRule.keyword,
                                response_message: parentRule.response_message,
                                image_url: parentRule.image_url,
                              })
                          }

                          // Disable same_for_next on the parent to prevent future duplicate cloning triggers
                          await supabase
                            .from('automations')
                            .update({ same_for_next: false })
                            .eq('id', parentAuto.id)
                          
                          parentAuto.same_for_next = false // update local object
                          
                          // Fetch newly created automation with its rules to add to array
                          const { data: refreshedAuto } = await supabase
                            .from('automations')
                            .select('*, automation_rules(*)')
                            .eq('id', newAuto.id)
                            .single()
                            
                          if (refreshedAuto) {
                            automations.push(refreshedAuto)
                          }
                        }
                      } else {
                        console.error('Failed to fetch new media details from Meta Graph:', mediaDetails.error)
                      }
                    } catch (cloneErr) {
                      console.error('Failed to clone automation for same-for-next post:', cloneErr)
                    }
                  }
                }
              }
            }

            if (automations) {
              for (const auto of automations) {
                // Skip if this automation is configured for a specific post and it doesn't match
                if (auto.media_id && commentValue.media?.id !== auto.media_id) {
                  continue
                }

                for (const rule of auto.automation_rules) {
                  let matched = false
                  if (auto.trigger_type === 'comment_any') {
                    matched = true
                  } else {
                    const keywords = rule.keyword.split(',').map((k: string) => k.trim().toLowerCase()).filter(Boolean)
                    matched = keywords.some((kw: string) => commentText.toLowerCase().includes(kw))
                  }
                  
                  if (matched) {
                    commentAutomated = true

                    // 1. Always reply publicly to the comment
                    const commentReplyText = `Hey! 👋 We've sent you a DM — check your inbox for the details!`
                    try {
                      await replyToComment(commentId, commentReplyText, pageAccessToken)
                    } catch (commentErr) {
                      console.error('Failed to reply to comment:', commentErr)
                    }

                    // 2a. Follow-Gate enabled: send interactive card instead of direct DM
                    if (auto.follow_gate_enabled) {
                      try {
                        const igUsername = igAccount.username || 'our account'
                        // Send follow-gate card to the commenter's DM
                        await sendFollowGateCard(
                          commenterId,
                          auto.id,
                          igUsername,
                          auto.follow_gate_message || 'This link is exclusive for our followers only! Tap the button below to verify.',
                          pageAccessToken
                        )

                        // Log event
                        await supabase.from('webhook_events').insert({
                          workspace_id: workspaceId,
                          event_type: 'follow_gate_initiated',
                          payload: {
                            automation_id: auto.id,
                            commenter_id: commenterId,
                            comment_id: commentId,
                            timestamp: new Date().toISOString(),
                          },
                        })

                        // Create conversation record for inbox tracking
                        const { data: conv } = await supabase
                          .from('conversations')
                          .upsert(
                            { workspace_id: workspaceId, instagram_user_id: commenterId, status: 'active' },
                            { onConflict: 'workspace_id, instagram_user_id' }
                          )
                          .select()
                          .single()

                        if (conv) {
                          await supabase.from('messages').insert({
                            conversation_id: conv.id,
                            sender: 'ai',
                            content: '[Follow-Gate card sent — awaiting user follow verification]',
                          })
                        }
                      } catch (fgErr) {
                        console.error('Failed to send follow-gate card:', fgErr)
                      }
                    } else {
                      // 2b. No Follow-Gate: send the DM with the automated response directly
                      try {
                        const responseCards = rule.response_cards || []
                        if (Array.isArray(responseCards) && responseCards.length > 0) {
                          // Send generic template carousel as private reply
                          await sendInstagramGenericTemplatePrivateReply(commentId, responseCards, pageAccessToken)

                          // Create a conversation for reporting in the Inbox
                          const { data: conversation } = await supabase
                            .from('conversations')
                            .upsert(
                              {
                                workspace_id: workspaceId,
                                instagram_user_id: commenterId,
                                status: 'active',
                              },
                              { onConflict: 'workspace_id, instagram_user_id' }
                            )
                            .select()
                            .single()

                          if (conversation) {
                            // Store the sent message in DB
                            await supabase.from('messages').insert({
                              conversation_id: conversation.id,
                              sender: 'ai',
                              content: '[Interactive Cards Carousel sent]',
                            })
                          }
                        } else {
                          // Send the private reply text (opens the communication channel)
                          await sendInstagramPrivateReply(commentId, rule.response_message, pageAccessToken)

                          // Send photo attachment if configured
                          if (rule.image_url) {
                            try {
                              await sendInstagramImageAttachment(commenterId, rule.image_url, pageAccessToken)
                            } catch (imgErr) {
                              console.error('Failed to send image attachment in comment reply:', imgErr)
                            }
                          }

                          // Create a conversation for reporting in the Inbox
                          const { data: conversation } = await supabase
                            .from('conversations')
                            .upsert(
                              {
                                workspace_id: workspaceId,
                                instagram_user_id: commenterId,
                                status: 'active',
                              },
                              { onConflict: 'workspace_id, instagram_user_id' }
                            )
                            .select()
                            .single()

                          if (conversation) {
                            // Store the sent message in DB
                            await supabase.from('messages').insert({
                              conversation_id: conversation.id,
                              sender: 'ai',
                              content: rule.response_message,
                            })
                          }
                        }
                      } catch (dmErr) {
                        console.error('Failed to send DM to commenter:', dmErr)
                      }
                    }

                    break
                  }
                }
              }
            }

            if (!commentAutomated && (!settings || (settings.ai_enabled !== false && settings.respond_on_comments !== false))) {
              const { intent, response } = await getAIResponse(workspaceId, commentText)

              if (response) {
                // Apply reply delay if configured
                if (settings?.reply_delay_seconds && settings.reply_delay_seconds > 0) {
                  await new Promise(resolve => setTimeout(resolve, settings.reply_delay_seconds * 1000))
                }

                // 1. Reply to comment publicly
                const commentReplyText = `Hey 👋 we just sent you a DM with details!`
                try {
                  await replyToComment(commentId, commentReplyText, pageAccessToken)
                } catch (commentErr) {
                  console.error('Failed to reply to comment via AI fallback:', commentErr)
                }

                // 2. Send private reply DM
                try {
                  await sendInstagramPrivateReply(commentId, response, pageAccessToken)

                  // Create a conversation for reporting in the Inbox
                  const { data: conversation } = await supabase
                    .from('conversations')
                    .upsert(
                      {
                        workspace_id: workspaceId,
                        instagram_user_id: commenterId,
                        status: 'active',
                      },
                      { onConflict: 'workspace_id, instagram_user_id' }
                    )
                    .select()
                    .single()

                  if (conversation) {
                    // Store the sent message in DB
                    await supabase.from('messages').insert({
                      conversation_id: conversation.id,
                      sender: 'ai',
                      content: response,
                    })
                  }
                } catch (dmErr) {
                  console.error('Failed to send DM to commenter via AI fallback:', dmErr)
                }
              }
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Webhook payload processing failed:', err)
    return NextResponse.json({ error: err.message || 'Processing error' }, { status: 500 })
  }
}
