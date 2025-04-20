import LeaseAudit from "./audit-types/lease-audit";
import RenewalAudit from "./audit-types/renewal-audit";
import { fetchSheetData, updateSheetCell, addSheetComment } from "./sheets";
import updateStatus from "./updateStatus";

class AuditController {
  constructor() {
    this.state = {
      status: "idle",
      progress: 0,
      currentRecord: null,
      currentField: null,
      error: null,
    };
    this._stopRequested = false;
  }

  getState() {
    return this.state;
  }

  async start({ spreadsheetId, auditType }) {
    this.state = {
      status: "starting",
      progress: 0,
      currentRecord: null,
      currentField: null,
      error: null,
    };
    updateStatus(
      this.state.status,
      this.state.progress,
      this.state.status,
      { currentRecord: this.state.currentRecord, currentField: this.state.currentField, error: this.state.error }
    );
    try {
      const { headers, records } = await fetchSheetData(spreadsheetId);
      const Engine = auditType === "renewal" ? RenewalAudit : LeaseAudit;
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
          updateStatus(
            this.state.status,
            this.state.progress,
            this.state.status,
            { currentRecord: this.state.currentRecord, currentField: this.state.currentField, error: this.state.error }
          );
          const result = await this.auditEngine.runField(record, field);
          if (result.match) {
            await updateSheetCell(
              spreadsheetId,
              this.auditEngine.sheetName,
              `${field}${record._row}`,
              "✓",
            );
          } else {
            await addSheetComment(
              spreadsheetId,
              this.auditEngine.sheetName,
              `${field}${record._row}`,
              result.comment || "Discrepancy",
            );
          }
          this.state.progress = Math.round(
            ((i * fields.length + fields.indexOf(field) + 1) /
              (records.length * fields.length)) *
              100,
          );
          updateStatus(
            this.state.status,
            this.state.progress,
            this.state.status,
            { currentRecord: this.state.currentRecord, currentField: this.state.currentField, error: this.state.error }
          );
        }
      }
      this.state.status = "complete";
      updateStatus(
        this.state.status,
        this.state.progress,
        this.state.status,
        { currentRecord: this.state.currentRecord, currentField: this.state.currentField, error: this.state.error }
      );
    } catch (e) {
      this.state.status = "error";
      this.state.error = e.message;
      updateStatus(
        this.state.error,
        this.state.progress,
        this.state.status,
        { currentRecord: this.state.currentRecord, currentField: this.state.currentField, error: this.state.error }
      );
    }
  }

  stop() {
    this._stopRequested = true;
    this.state.status = "stopped";
    updateStatus(
      this.state.status,
      this.state.progress,
      this.state.status,
      { currentRecord: this.state.currentRecord, currentField: this.state.currentField }
    );
  }
}

export default new AuditController();
