import { jest } from '@jest/globals';

global.chrome = {
  runtime: {
    sendMessage: jest.fn()
  },
  identity: {
    getAuthToken: jest.fn((opts, cb) => cb('fake-token'))
  },
  tabs: {
    create: jest.fn().mockResolvedValue({ id: 1, url: 'https://preiss.entrata.com/?module=customers_systemxxx', status: 'complete' }),
    get: jest.fn().mockImplementation((tabId, cb) => cb({ id: tabId, url: 'https://preiss.entrata.com/?module=customers_systemxxx', status: 'complete' })), 
    sendMessage: jest.fn().mockImplementation((tabId, msg, cb) => {
      if (msg && msg.action === 'ping') {
        cb && cb({ success: true });
      } else if (msg && msg.action === 'setupAudit') {
        cb && cb({ success: true });
      } else {
        cb && cb({ success: true });
      }
    })
  }
};
global.alert = jest.fn();

import AuditController from "../src/js/AuditController";

jest.mock('../src/js/sheets', () => ({
  fetchSheetData: jest.fn().mockResolvedValue({ headers: ['A', 'B'], records: [{ _row: '2', A: '1', B: '2' }] }),
  updateSheetCell: jest.fn(),
  addSheetComment: jest.fn()
}));

// Stub LeaseAudit and RenewalAudit to skip real browser interactions
jest.mock('../src/js/audit-types/lease-audit', () => {
  return jest.fn().mockImplementation(() => ({
    setUp: jest.fn().mockResolvedValue({ success: true, tabId: 1 }),
    nextFields: () => [],
    runField: jest.fn(),
    sheetName: 'Lease Audit'
  }));
});
jest.mock('../src/js/audit-types/renewal-audit', () => {
  return jest.fn().mockImplementation(() => ({
    setUp: jest.fn().mockResolvedValue({ success: true, tabId: 1 }),
    nextFields: () => [],
    runField: jest.fn(),
    sheetName: 'Lease Audit'
  }));
});

describe('AuditController', () => {
  it('starts and completes without errors', async () => {
    const controller = AuditController;
    await controller.start({ spreadsheetId: 'sheet123', auditType: 'lease' });
    const state = controller.getState();
    expect(state.status).toBe('complete');
  }, 20000);

  it('handles stop request', async () => {
    const controller = AuditController;
    controller.stop();
    expect(controller.getState().status).toBe('stopped');
  });
});
