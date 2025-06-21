"use strict";
const { EntitySchema } = require("@mikro-orm/core");
const { BaseEntity } = require("./BaseEntity");

class JobChange extends BaseEntity {
  constructor(employeeId, requestedBy) {
    super();
    this.employeeId = employeeId; // Employee requesting the change
    this.requestedBy = requestedBy; // User ID requesting the change
    this.jobInformation = {}; // Current job information
    this.requestedChanges = {}; // Requested changes
    this.hrEmployees = []; // Array of HR employee IDs for quorum
    this.nonHrEmployees = []; // Array of non-HR employee IDs for quorum
    this.chatId = null; // Chat ID for discussion
    this.status = 'pending'; // 'pending', 'approved', 'denied', 'in_review'
    this.quorumAgreed = false; // Whether quorum has agreed
    this.quorumDeadline = null; // Deadline for quorum response
    this.approvedBy = []; // Array of employee IDs who approved
    this.deniedBy = []; // Array of employee IDs who denied
    this.finalDecision = null; // Final decision
    this.finalDecisionBy = null; // Employee ID who made final decision
    this.finalDecisionAt = null; // When final decision was made
    this.metadata = {
      changeReason: '',
      impactAssessment: '',
      costAnalysis: '',
      timeline: '',
      notes: ''
    };
  }
}

const schema = new EntitySchema({
  class: JobChange,
  extends: "BaseEntity",
  properties: {
    employeeId: { type: "number" },
    requestedBy: { type: "number" },
    jobInformation: { type: "json", default: {} },
    requestedChanges: { type: "json", default: {} },
    hrEmployees: { type: "json", default: [] },
    nonHrEmployees: { type: "json", default: [] },
    chatId: { type: "number", nullable: true },
    status: { type: "string", default: "pending" },
    quorumAgreed: { type: "boolean", default: false },
    quorumDeadline: { type: "Date", nullable: true },
    approvedBy: { type: "json", default: [] },
    deniedBy: { type: "json", default: [] },
    finalDecision: { type: "string", nullable: true },
    finalDecisionBy: { type: "number", nullable: true },
    finalDecisionAt: { type: "Date", nullable: true },
    metadata: { type: "json", default: {} },
  },
});

module.exports = {
  JobChange,
  entity: JobChange,
  schema,
  label: "jobChangeRepository",
}; 