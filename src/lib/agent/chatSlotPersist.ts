import type { AgentMessage } from './types';
import type { AgentChatSlotPersisted } from './chatSessions';

export function selectedServerIdsEqual(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((id, i) => id === b[i]);
}

export function agentMessagesEqual(a: AgentMessage[], b: AgentMessage[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const ma = a[i];
    const mb = b[i];
    if (ma === mb) continue;
    if (ma.role !== mb.role || ma.text !== mb.text || ma.isError !== mb.isError) return false;
    if (ma.toolCallId !== mb.toolCallId) return false;
    if (Boolean(ma.toolCalls) !== Boolean(mb.toolCalls)) return false;
    const tca = ma.toolCalls;
    const tcb = mb.toolCalls;
    if (tca && tcb) {
      if (tca.length !== tcb.length) return false;
      for (let j = 0; j < tca.length; j++) {
        const ta = tca[j];
        const tb = tcb[j];
        if (
          ta.id !== tb.id ||
          ta.serverId !== tb.serverId ||
          ta.toolName !== tb.toolName ||
          ta.llmName !== tb.llmName
        ) {
          return false;
        }
        if (JSON.stringify(ta.args) !== JSON.stringify(tb.args)) return false;
      }
    }
  }
  return true;
}

/**
 * Merge a patch into a slot. Returns null when the patch would not change persisted
 * fields — callers should skip React state updates and disk writes.
 */
export function applyAgentChatSlotPatch(
  prev: AgentChatSlotPersisted,
  patch: Partial<AgentChatSlotPersisted>,
  maxMessages?: number,
): AgentChatSlotPersisted | null {
  let next = prev;
  let changed = false;

  if (patch.id !== undefined && patch.id !== prev.id) {
    next = { ...next, id: patch.id };
    changed = true;
  }
  if (patch.label !== undefined && patch.label !== prev.label) {
    next = { ...next, label: patch.label };
    changed = true;
  }
  if (patch.activeConfigId !== undefined && patch.activeConfigId !== prev.activeConfigId) {
    next = { ...next, activeConfigId: patch.activeConfigId };
    changed = true;
  }
  if (
    patch.selectedServerIds !== undefined &&
    !selectedServerIdsEqual(patch.selectedServerIds, prev.selectedServerIds)
  ) {
    next = { ...next, selectedServerIds: patch.selectedServerIds };
    changed = true;
  }
  if (patch.inputDraft !== undefined && patch.inputDraft !== prev.inputDraft) {
    next = { ...next, inputDraft: patch.inputDraft };
    changed = true;
  }
  if (patch.messages !== undefined && !agentMessagesEqual(patch.messages, prev.messages)) {
    let messages = patch.messages;
    if (maxMessages !== undefined && messages.length > maxMessages) {
      messages = messages.slice(-maxMessages);
    }
    next = { ...next, messages };
    changed = true;
  }

  if (!changed) return null;
  return { ...next, updatedAt: Date.now() };
}