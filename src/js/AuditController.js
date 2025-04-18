// src/js/AuditController.js
const LeaseAudit = require('./audit-types/lease-audit');
const RenewalAudit = require('./audit-types/renewal-audit');
const { fetchSheetData, updateSheetCell, addSheetComment } = require('./sheets');

class AuditController {
  constructor() {
    this.state = { status: 'idle', progress: 0, currentRecord: null, currentField: null, error: null };
    this._stopRequested = false;
  }

  getState() {
    return this.state;
  }

  async start({ spreadsheetId, auditType }) {
    this.state = { status: 'starting', progress: 0, currentRecord: null, currentField: null, error: null };
    chrome.runtime.sendMessage({ type: 'status', payload: this.state });
    try {
      const { headers, records } = await fetchSheetData(spreadsheetId);
      const Engine = auditType === 'renewal' ? RenewalAudit : LeaseAudit;
      this.auditEngine = new Engine(headers, records);
      await this.auditEngine.setUp();
      for (let i = 0; i < records.length; i++) {
        if (this._stopRequested) break;
        const record = records[i];
        this.state.currentRecord = record._row;
        const fields = this.auditEngine.nextFields(record);
        for (const field of fields) {
          if (this._stopRequested) break;
          this.state.currentField = field;
          chrome.runtime.sendMessage({ type: 'status', payload: this.state });
          const result = await this.auditEngine.runField(record, field);
          if (result.match) {
            await updateSheetCell(spreadsheetId, this.auditEngine.sheetName, `${field}${record._row}`, '✓');
          } else {
            await addSheetComment(spreadsheetId, this.auditEngine.sheetName, `${field}${record._row}`, result.comment || 'Discrepancy');
          }
          this.state.progress = Math.round(((i * fields.length) + fields.indexOf(field) + 1) / (records.length * fields.length) * 100);
          chrome.runtime.sendMessage({ type: 'status', payload: this.state });
        }
      }
      this.state.status = 'complete';
      chrome.runtime.sendMessage({ type: 'status', payload: this.state });
    } catch (e) {
      this.state.status = 'error';
      this.state.error = e.message;
      chrome.runtime.sendMessage({ type: 'status', payload: this.state });
    }
  }

  stop() {
    this._stopRequested = true;
    this.state.status = 'stopped';
    chrome.runtime.sendMessage({ type: 'status', payload: this.state });
  }
}

module.exports = new AuditController();
