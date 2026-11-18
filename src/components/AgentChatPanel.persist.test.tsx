// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render } from '@testing-library/react';
import { createDefaultAgentChatSlots } from '../lib/agent/chatSessions';
import type { LlmConfig } from '../lib/agent/types';
import type { ServerEntry } from '../types';

const { patchAppData, getAppData } = vi.hoisted(() => {
  const patchAppData = vi.fn();
  const getAppData = vi.fn();
  return { patchAppData, getAppData };
});

getAppData.mockImplementation(() => ({
  version: 3,
  bookmarks: [],
  history: [],
  observationJournals: {},
  agentRuns: {},
  agentChatSlots: createDefaultAgentChatSlots(),
}));

vi.mock('../lib/appData', () => ({
  getAppData,
  patchAppData,
}));

vi.mock('./useProtocolTraces', () => ({
  useProtocolTraces: () => [],
}));

vi.mock('./WindowControls', () => ({
  WindowControls: () => null,
}));

vi.mock('./AgentModelPicker', () => ({
  AgentModelPicker: () => <div data-testid="agent-model-picker-mock" />,
}));

vi.mock('./AgentTranscript', () => ({
  AgentTranscript: () => null,
}));

vi.mock('./ToolCallApproval', () => ({
  ToolCallApproval: () => null,
}));

vi.mock('./AgentChatExportMenu', () => ({
  AgentChatExportMenu: () => null,
}));

vi.mock('./useAgentRun', () => ({
  useAgentRun: () => ({
    messages: [],
    streamingText: '',
    pending: null,
    running: false,
    error: null,
    toolCount: 0,
    collisions: [],
    send: vi.fn(),
    reset: vi.fn(),
    stop: vi.fn(),
    retry: vi.fn(),
    decide: vi.fn(),
    captureAsSuite: vi.fn(() => 0),
  }),
}));

import { AgentChatPanel } from './AgentChatPanel';

const llmConfigs: LlmConfig[] = [
  {
    id: 'llm-1',
    label: 'Fixture',
    provider: 'openai',
    baseUrl: 'http://127.0.0.1:3003/v1',
    model: 'test-model',
    apiKey: 'k',
  },
];

const servers: ServerEntry[] = [
  {
    id: 'srv-1',
    name: 'Fixture',
    url: 'http://127.0.0.1:3001/mcp',
    status: 'connected',
    transport: 'http',
    tools: [{ name: 'echo', description: '', inputSchema: { type: 'object', properties: {} } }],
    discovered: [],
    resources: [],
    prompts: [],
    proxyThroughLocal: true,
  },
];

describe('AgentChatPanel persistence', () => {
  beforeEach(() => {
    patchAppData.mockClear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not loop patchAppData on mount when scope sync runs once', async () => {
    render(
      <AgentChatPanel
        servers={servers}
        llmConfigs={llmConfigs}
        onSaveLlmConfigs={vi.fn()}
        activeServerId="srv-1"
        onClose={vi.fn()}
      />,
    );

    await act(async () => {
      vi.advanceTimersByTime(1200);
    });

    expect(patchAppData.mock.calls.length).toBeLessThanOrEqual(3);

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    const callsAfterSettle = patchAppData.mock.calls.length;
    expect(callsAfterSettle).toBeLessThanOrEqual(3);

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    expect(patchAppData.mock.calls.length).toBe(callsAfterSettle);
  });
});