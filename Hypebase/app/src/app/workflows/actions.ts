"use server"

import { supabase } from "@/lib/supabase"

export type WorkflowStatus = 'active' | 'paused' | 'inactive';
export type WorkflowPlatform = 'github_actions' | 'make_com' | 'n8n' | 'custom_script';

export interface WorkflowRecord {
  id: string;
  workflow_number: string;
  name: string;
  description: string | null;
  category: string;
  platform: WorkflowPlatform;
  location: string | null;
  region_code: string | null;
  endpoint_url: string | null;
  status: WorkflowStatus;
  health_score: number;
  last_run_at: string | null;
  next_run_at: string | null;
  to_process: number | null;
  processed: number | null;
  created_at: string;
  updated_at: string;
}

export async function getWorkflows(): Promise<WorkflowRecord[]> {
  const { data, error } = await supabase
    .from('workflows')
    .select('*')
    .order('workflow_number', { ascending: true });

  if (error) {
    console.error("Error fetching workflows:", error);
    return [];
  }

  return data as WorkflowRecord[];
}

export async function updateWorkflowStatus(id: string, newStatus: WorkflowStatus) {
  const { error } = await supabase
    .from('workflows')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error(`Error updating workflow ${id} to ${newStatus}:`, error);
    return false;
  }
  
  return true;
}

export async function updateWorkflowDetails(id: string, updates: Partial<Omit<WorkflowRecord, 'id'>>) {
  const { error } = await supabase
    .from('workflows')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error(`Error updating workflow details for ${id}:`, error);
    return false;
  }
  
  return true;
}

// --- GitHub Actions Dispatch ---

interface TriggerResult {
  success: boolean;
  error?: string;
  runId?: number;
}

/**
 * Triggers a GitHub Actions workflow via the workflow_dispatch event.
 * Requires GITHUB_TOKEN env var with repo + actions:write scope.
 */
export async function triggerWorkflow(workflowId: string): Promise<TriggerResult> {
  // 1. Fetch the workflow record from DB to get the endpoint_url
  const { data: workflow, error: fetchError } = await supabase
    .from('workflows')
    .select('*')
    .eq('id', workflowId)
    .single();

  if (fetchError || !workflow) {
    return { success: false, error: `Workflow not found: ${fetchError?.message}` };
  }

  const endpointUrl = workflow.endpoint_url;
  if (!endpointUrl) {
    return { success: false, error: "No endpoint URL configured for this workflow." };
  }

  // 2. Parse owner/repo/workflow_file from endpoint URL
  // Expected format: https://github.com/{owner}/{repo}/actions/workflows/{workflow_file}
  const match = endpointUrl.match(/github\.com\/([^/]+)\/([^/]+)\/actions\/workflows\/(.+)/);
  if (!match) {
    return { success: false, error: `Cannot parse GitHub URL: ${endpointUrl}` };
  }

  const [, owner, repo, workflowFile] = match;
  const githubToken = process.env.GITHUB_TOKEN;

  if (!githubToken) {
    return { success: false, error: "GITHUB_TOKEN environment variable is not set. Add it to .env.local with a PAT that has repo + actions:write scope." };
  }

  // 3. Dispatch the workflow
  try {
    const dispatchRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowFile}/dispatches`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ref: 'main' }),
      }
    );

    if (!dispatchRes.ok) {
      const errorBody = await dispatchRes.text();
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowFile}/dispatches`;
      return { success: false, error: `GitHub API error (${dispatchRes.status}): ${errorBody} | URL: ${apiUrl} | Token: ${githubToken.substring(0, 8)}...` };
    }

    // 4. Update DB: mark as active, set last_run_at
    await supabase
      .from('workflows')
      .update({
        status: 'active',
        last_run_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', workflowId);

    // 5. Try to get the run ID by polling recent runs briefly
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s for GitHub to register
    
    const runsRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowFile}/runs?per_page=1&status=queued`,
      {
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }
    );

    let runId: number | undefined;
    if (runsRes.ok) {
      const runsData = await runsRes.json();
      if (runsData.workflow_runs?.length > 0) {
        runId = runsData.workflow_runs[0].id;
      }
    }

    return { success: true, runId };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Network error: ${message}` };
  }
}

/**
 * Gets the status of a specific GitHub Actions workflow run.
 */
export async function getWorkflowRunStatus(workflowId: string): Promise<{
  status: string;
  conclusion: string | null;
  logs: string[];
  error?: string;
}> {
  const { data: workflow, error: fetchError } = await supabase
    .from('workflows')
    .select('*')
    .eq('id', workflowId)
    .single();

  if (fetchError || !workflow) {
    return { status: 'unknown', conclusion: null, logs: [], error: 'Workflow not found' };
  }

  const endpointUrl = workflow.endpoint_url;
  if (!endpointUrl) {
    return { status: 'unknown', conclusion: null, logs: [], error: 'No endpoint URL' };
  }

  const match = endpointUrl.match(/github\.com\/([^/]+)\/([^/]+)\/actions\/workflows\/(.+)/);
  if (!match) {
    return { status: 'unknown', conclusion: null, logs: [], error: 'Cannot parse URL' };
  }

  const [, owner, repo, workflowFile] = match;
  const githubToken = process.env.GITHUB_TOKEN;

  if (!githubToken) {
    return { status: 'unknown', conclusion: null, logs: [], error: 'No GITHUB_TOKEN' };
  }

  try {
    const runsRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowFile}/runs?per_page=1`,
      {
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }
    );

    if (!runsRes.ok) {
      return { status: 'unknown', conclusion: null, logs: [], error: `GitHub API error: ${runsRes.status}` };
    }

    const runsData = await runsRes.json();
    const run = runsData.workflow_runs?.[0];

    if (!run) {
      return { status: 'idle', conclusion: null, logs: ['No recent runs found.'] };
    }

    const logEntries: string[] = [];
    logEntries.push(`Run #${run.run_number} — ${run.display_title || run.name}`);
    logEntries.push(`Status: ${run.status} | Conclusion: ${run.conclusion || 'pending'}`);
    logEntries.push(`Started: ${run.created_at}`);
    if (run.updated_at !== run.created_at) {
      logEntries.push(`Updated: ${run.updated_at}`);
    }

    // If completed, update DB status
    if (run.status === 'completed') {
      const newStatus: WorkflowStatus = run.conclusion === 'success' ? 'active' : 'inactive';
      const newHealth = run.conclusion === 'success' ? 100 : Math.max(0, (workflow.health_score || 100) - 20);
      
      await supabase
        .from('workflows')
        .update({
          status: newStatus,
          health_score: newHealth,
          updated_at: new Date().toISOString(),
        })
        .eq('id', workflowId);
    }

    return {
      status: run.status,
      conclusion: run.conclusion,
      logs: logEntries,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { status: 'unknown', conclusion: null, logs: [], error: message };
  }
}
