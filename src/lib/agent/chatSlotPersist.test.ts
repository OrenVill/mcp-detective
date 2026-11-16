import { describe, it, expect } from 'vitest';
import { createDefaultAgentChatSlots } from './chatSessions';
import {
  agentMessagesEqual,
  applyAgentChatSlotPatch,
  selectedServerIdsEqual,
} from './chatSlotPersist';
import type { AgentMessage } from './types';

describe('chatSlotPersist', () => {
  const base = createDefaultAgentChatSlots()[0];

  it('selectedServerIdsEqual treats order as significant', () => {
    expect(selectedServerIdsEqual(['a', 'b'], ['a', 'b'])).toBe(true);
    expect(selectedServerIdsEqual(['a'], ['b'])).toBe(false);
    expect(selectedServerIdsEqual(['a', 'b'], ['b', 'a'])).toBe(false);
  });

  it('applyAgentChatSlotPatch returns null when nothing changes', () => {
    const withScope = { ...base, activeConfigId: 'cfg-1', selectedServerIds: ['s1'] };
    expect(
      applyAgentChatSlotPatch(withScope, {
        activeConfigId: 'cfg-1',
        selectedServerIds: ['s1'],
        inputDraft: '',
      }),
    ).toBeNull();
  });

  it('applyAgentChatSlotPatch trims message history to maxMessages', () => {
    const messages: AgentMessage[] = Array.from({ length: 5 }, (_, i) => ({
      role: 'user',
      text: `m${i}`,
    }));
    const merged = applyAgentChatSlotPatch(base, { messages }, 3);
    expect(merged).not.toBeNull();
    expect(merged!.messages).toHaveLength(3);
    expect(merged!.messages[0].text).toBe('m2');
  });

  it('agentMessagesEqual compares tool call args', () => {
    const a: AgentMessage[] = [
      {
        role: 'assistant',
        text: '',
        toolCalls: [{ id: '1', llmName: 't', serverId: 's', toolName: 't', args: { x: 1 } }],
      },
    ];
    const b: AgentMessage[] = [
      {
        role: 'assistant',
        text: '',
        toolCalls: [{ id: '1', llmName: 't', serverId: 's', toolName: 't', args: { x: 2 } }],
      },
    ];
    expect(agentMessagesEqual(a, a)).toBe(true);
    expect(agentMessagesEqual(a, b)).toBe(false);
  });
});