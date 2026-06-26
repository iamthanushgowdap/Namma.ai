import { createAdminClient } from './supabase/server'

export type IntentType = 'greeting' | 'pricing' | 'support' | 'product' | 'unknown';

interface IntentKeywordMap {
  intent: IntentType;
  keywords: string[];
}

const DEFAULT_INTENT_KEYWORDS: IntentKeywordMap[] = [
  {
    intent: 'greeting',
    keywords: ['hi', 'hello', 'hey', 'yo', 'greetings', 'good morning', 'good afternoon', 'hola', 'xin chao', 'chao'],
  },
  {
    intent: 'pricing',
    keywords: ['price', 'pricing', 'cost', 'how much', 'fee', 'charge', 'plan', 'subscription', 'buy', 'purchase', 'gia ca', 'gia bao nhieu'],
  },
  {
    intent: 'product',
    keywords: ['product', 'features', 'what is', 'details', 'service', 'automation', 'tool', 'platform', 'namma', 'app'],
  },
  {
    intent: 'support',
    keywords: ['support', 'help', 'contact', 'agent', 'human', 'error', 'broken', 'issue', 'ticket', 'problem', 'chat with human'],
  },
];

/**
 * Classifies the user's message into one of the predefined intents, optionally using database settings.
 */
export function detectIntent(text: string, settings?: any): IntentType {
  const normalized = text.toLowerCase().trim();

  const intentMappings = [
    {
      intent: 'greeting' as IntentType,
      keywords: settings?.greeting_keywords && settings.greeting_keywords.length > 0 
        ? settings.greeting_keywords 
        : DEFAULT_INTENT_KEYWORDS.find(k => k.intent === 'greeting')?.keywords || []
    },
    {
      intent: 'pricing' as IntentType,
      keywords: settings?.pricing_keywords && settings.pricing_keywords.length > 0
        ? settings.pricing_keywords
        : DEFAULT_INTENT_KEYWORDS.find(k => k.intent === 'pricing')?.keywords || []
    },
    {
      intent: 'product' as IntentType,
      keywords: settings?.product_keywords && settings.product_keywords.length > 0
        ? settings.product_keywords
        : DEFAULT_INTENT_KEYWORDS.find(k => k.intent === 'product')?.keywords || []
    },
    {
      intent: 'support' as IntentType,
      keywords: settings?.support_keywords && settings.support_keywords.length > 0
        ? settings.support_keywords
        : DEFAULT_INTENT_KEYWORDS.find(k => k.intent === 'support')?.keywords || []
    }
  ];

  for (const mapping of intentMappings) {
    for (const keyword of mapping.keywords) {
      if (normalized.includes(keyword.toLowerCase().trim())) {
        return mapping.intent;
      }
    }
  }

  return 'unknown';
}

/**
 * Resolves the response content based on the workspace's AI settings.
 */
export async function getAIResponse(
  workspaceId: string,
  messageContent: string
): Promise<{ intent: IntentType; response: string }> {
  // Use admin client (bypasses RLS since webhook operates outside user auth session context)
  const supabase = createAdminClient();

  const { data: settings } = await supabase
    .from('ai_settings')
    .select('*')
    .eq('workspace_id', workspaceId)
    .single();

  // If AI is globally disabled in database, skip answering
  if (settings && settings.ai_enabled === false) {
    return { intent: 'unknown', response: '' };
  }

  // 1. Check custom intents first
  if (settings?.custom_intents && Array.isArray(settings.custom_intents)) {
    const normalizedMsg = messageContent.toLowerCase().trim();
    for (const custom of settings.custom_intents) {
      if (custom && typeof custom === 'object') {
        const keywords = Array.isArray(custom.keywords)
          ? custom.keywords
          : typeof custom.keywords === 'string'
            ? (custom.keywords as string).split(',').map((k: string) => k.trim())
            : [];
        
        const matched = keywords.some((kw: string) => 
          kw && normalizedMsg.includes(kw.toLowerCase().trim())
        );

        if (matched && custom.response) {
          return { intent: custom.name || 'custom', response: custom.response };
        }
      }
    }
  }

  const intent = detectIntent(messageContent, settings);
  
  let response = '';

  const defaultReplies: Record<IntentType, string> = {
    greeting: 'Hello! 👋 How can we help you today?',
    pricing: 'Thanks for asking! Our subscription starts at just $29/month. Let me know if you would like a link to our pricing plans!',
    support: 'We have logged your support request, and an agent will be with you shortly. 🛠️',
    product: 'Namma.ai is a state-of-the-art Instagram automation tool that handles your DMs and comments automatically using AI!',
    unknown: 'Thanks for reaching out! We will review your message and get back to you as soon as possible.',
  };

  if (!settings) {
    response = defaultReplies[intent];
  } else {
    switch (intent) {
      case 'greeting':
        response = settings.greeting_response || defaultReplies.greeting;
        break;
      case 'pricing':
        response = settings.pricing_response || defaultReplies.pricing;
        break;
      case 'support':
        response = settings.support_response || defaultReplies.support;
        break;
      case 'product':
        response = settings.product_response || defaultReplies.product;
        break;
      case 'unknown':
      default:
        response = settings.unknown_response || defaultReplies.unknown;
        break;
    }
  }

  return { intent, response };
}
