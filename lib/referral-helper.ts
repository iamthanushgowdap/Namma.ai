import { SupabaseClient } from '@supabase/supabase-js'
import crypto from 'crypto'

interface ProcessConversionOptions {
  supabase: SupabaseClient
  userId: string
  paidAmountPaise: number
  razorpayPaymentId?: string
}

export async function processReferralConversion({
  supabase,
  userId,
  paidAmountPaise,
  razorpayPaymentId
}: ProcessConversionOptions) {
  // 1. Check if user is referred and referral is still in 'joined' status
  const { data: referral, error: refError } = await supabase
    .from('referrals')
    .select('*')
    .eq('referred_id', userId)
    .eq('status', 'joined')
    .maybeSingle()

  if (refError) {
    console.error('Error fetching referral:', refError)
    return { success: false, error: refError.message }
  }

  if (!referral) {
    // No active referral conversion needed (either not referred or already converted/fraudulent)
    return { success: true, message: 'No active referral for user' }
  }

  const referrerId = referral.referrer_id
  let actualPaid = paidAmountPaise

  // 2. Perform duplicate payment method fingerprint check if razorpayPaymentId is provided
  if (razorpayPaymentId) {
    const keyId = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET

    if (keyId && keySecret) {
      try {
        const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64')
        const payRes = await fetch(`https://api.razorpay.com/v1/payments/${razorpayPaymentId}`, {
          headers: { Authorization: authHeader }
        })

        if (payRes.ok) {
          const paymentData = await payRes.json()
          if (paymentData.amount) {
            actualPaid = paymentData.amount
          }
          let paymentFingerprint = ''

          if (paymentData.method === 'card' && paymentData.card) {
            paymentFingerprint = paymentData.card.fingerprint || `${paymentData.card.last4}_${paymentData.card.network}`
          } else if (paymentData.method === 'upi') {
            paymentFingerprint = paymentData.vpa || ''
          } else {
            paymentFingerprint = paymentData.email || paymentData.contact || razorpayPaymentId
          }

          if (paymentFingerprint) {
            const paymentHash = crypto.createHash('sha256').update(paymentFingerprint).digest('hex')

            // Check if this payment method hash was already used by a DIFFERENT user
            const { data: duplicateUserMethod, error: dupError } = await supabase
              .from('user_payment_methods')
              .select('profile_id')
              .eq('payment_hash', paymentHash)
              .neq('profile_id', userId)
              .maybeSingle()

            if (dupError) {
              console.error('Error checking duplicate payment methods:', dupError)
            }

            if (duplicateUserMethod) {
              // Fraud detected! Mark referral as fraudulent
              console.warn(`FRAUD DETECTED: Payment fingerprint reused across different users (${userId} and ${duplicateUserMethod.profile_id})`)
              
              await supabase
                .from('referrals')
                .update({ status: 'fraudulent' })
                .eq('id', referral.id)

              return { success: false, error: 'Duplicate payment method detected. Referral flagged as fraudulent.' }
            }

            // Save the unique payment method fingerprint for this user
            await supabase
              .from('user_payment_methods')
              .upsert({ profile_id: userId, payment_hash: paymentHash }, { onConflict: 'payment_hash' })
          }
        } else {
          console.error('Razorpay payment fetch failed:', await payRes.text())
        }
      } catch (err) {
        console.error('Failed to perform payment fingerprint check:', err)
      }
    } else {
      console.warn('Razorpay keys not configured. Skipping payment method fingerprint check.')
    }
  }

  // 3. Get referred user profile details to include in commission ledger description
  const { data: referredProfile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', userId)
    .maybeSingle()

  const referredName = referredProfile?.name || 'Referred User'

  // 4. Calculate 10% commission
  const commissionAmount = Math.round(actualPaid * 0.10)

  // 5. Credit referrer with commission
  const { error: ledgerError } = await supabase
    .from('referral_ledger')
    .insert({
      profile_id: referrerId,
      amount: commissionAmount,
      transaction_type: 'referral_commission',
      status: 'completed',
      description: `Commission for referring ${referredName} (First subscription purchase)`
    })

  if (ledgerError) {
    console.error('Failed to credit referrer commission:', ledgerError)
    return { success: false, error: ledgerError.message }
  }

  // 6. Update referral status to 'converted'
  const { error: updateError } = await supabase
    .from('referrals')
    .update({ status: 'converted' })
    .eq('id', referral.id)

  if (updateError) {
    console.error('Failed to update referral status:', updateError)
    return { success: false, error: updateError.message }
  }

  return { success: true }
}
