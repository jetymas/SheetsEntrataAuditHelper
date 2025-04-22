import { filterRecordsForLeaseAudit } from "../src/js/content-helpers.js";

describe("filterRecordsForLeaseAudit", () => {
  it("filters and sorts records for Lease Type \"New\"", () => {
    const records = [
      { "Lease Type": "New", "First Name": "Charlie", "Last Name": "Anderson" },
      { "Lease Type": "Renewal", "First Name": "Bob", "Last Name": "Brown" },
      { "Lease Type": "New", "First Name": "Alice", "Last Name": "Smith" },
      { "Lease Type": "New", "First Name": "Bob", "Last Name": "Brown" },
    ];
    const filtered = filterRecordsForLeaseAudit(records);
    expect(filtered).toHaveLength(3);
    expect(filtered[0]["First Name"]).toBe("Charlie");
    expect(filtered[1]["First Name"]).toBe("Alice");
    expect(filtered[2]["First Name"]).toBe("Bob");
    // Ensure all are Lease Type New
    expect(filtered.every(r => r["Lease Type"] === "New")).toBe(true);
  });

  it("returns empty array if no records match", () => {
    const records = [
      { "Lease Type": "Renewal", "First Name": "Bob", "Last Name": "Brown" },
      { "Lease Type": "Renewal", "First Name": "Alice", "Last Name": "Smith" },
    ];
    const filtered = filterRecordsForLeaseAudit(records);
    expect(filtered).toHaveLength(0);
  });

  it("returns empty array if input is undefined or null", () => {
    expect(filterRecordsForLeaseAudit(undefined)).toEqual([]);
    expect(filterRecordsForLeaseAudit(null)).toEqual([]);
  });
});
