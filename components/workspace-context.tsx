'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface Workspace {
  id: string
  name: string
  owner_id: string
  created_at: string
}

interface WorkspaceContextType {
  workspaces: Workspace[]
  activeWorkspace: Workspace | null
  setActiveWorkspace: (workspace: Workspace) => void
  isLoading: boolean
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

export function WorkspaceProvider({
  children,
  initialWorkspaces,
}: {
  children: React.ReactNode
  initialWorkspaces: Workspace[]
}) {
  const [activeWorkspace, setActiveWorkspaceState] = useState<Workspace | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (initialWorkspaces.length > 0) {
      // Look in localStorage first
      const savedWorkspaceId = localStorage.getItem('autoengage_active_workspace_id')
      const matched = initialWorkspaces.find((w) => w.id === savedWorkspaceId)
      
      if (matched) {
        setActiveWorkspaceState(matched)
      } else {
        setActiveWorkspaceState(initialWorkspaces[0])
      }
    }
    setIsLoading(false)
  }, [initialWorkspaces])

  const setActiveWorkspace = (workspace: Workspace) => {
    setActiveWorkspaceState(workspace)
    localStorage.setItem('autoengage_active_workspace_id', workspace.id)
  }

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces: initialWorkspaces,
        activeWorkspace,
        setActiveWorkspace,
        isLoading,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider')
  }
  return context
}
