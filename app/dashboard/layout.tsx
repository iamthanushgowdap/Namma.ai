import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import DashboardShell from '@/components/dashboard-shell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // 1. Get current authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  // Fetch user profile
  let { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const profileName = profile?.name || user.email?.split('@')[0] || 'User'
  const profileAvatar = profile?.avatar_url || ''

  // Safe Fallback: If profile doesn't exist (e.g. signup trigger did not run), create it using Admin Client
  if (!profile) {
    const adminSupabase = createAdminClient()
    const { data: newProfile, error: profileCreateError } = await adminSupabase
      .from('profiles')
      .insert({
        id: user.id,
        name: profileName,
      })
      .select()
      .single()

    if (newProfile) {
      profile = newProfile
    } else {
      console.error('Failed to create profile via admin client:', profileCreateError)
    }
  }

  // 2. Fetch user's workspaces
  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('*')
    .eq('owner_id', user.id)

  let userWorkspaces = workspaces || []

  // Safe Fallback: If no workspace exists, provision one using Admin Client
  if (userWorkspaces.length === 0) {
    const adminSupabase = createAdminClient()
    const { data: newWorkspace, error: createError } = await adminSupabase
      .from('workspaces')
      .upsert(
        {
          owner_id: user.id,
          name: `${profileName}'s Workspace`,
        },
        { onConflict: 'owner_id,name' }
      )
      .select()

    if (newWorkspace && newWorkspace.length > 0) {
      userWorkspaces = newWorkspace

      // Also create default AI settings for the workspace (using upsert to avoid duplicate keys)
      await adminSupabase
        .from('ai_settings')
        .upsert(
          {
            workspace_id: newWorkspace[0].id,
          },
          { onConflict: 'workspace_id' }
        )
    } else {
      console.error('Failed to create workspace via admin client:', createError)
      // Extreme fallback to prevent crash in UI, generate a mock UUID
      userWorkspaces = [{ 
        id: '00000000-0000-0000-0000-000000000000', 
        name: `${profileName}'s Workspace (Fallback)`, 
        owner_id: user.id,
        created_at: new Date().toISOString()
      }]
    }
  }

  return (
    <DashboardShell 
      profile={{ name: profileName, avatarUrl: profileAvatar, email: user.email || '' }}
      workspaces={userWorkspaces}
    >
      {children}
    </DashboardShell>
  )
}
