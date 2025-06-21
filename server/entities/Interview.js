"use strict";
const { EntitySchema } = require("@mikro-orm/core");
const { BaseEntity } = require("./BaseEntity");

class Interview extends BaseEntity {
  constructor(hiringEmployeeId, intervieweeEmail, jobTitle) {
    super();
    this.hiringEmployeeId = hiringEmployeeId; // Employee conducting the interview
    this.referredBy = null; // Optional referral employee ID
    this.intervieweeEmail = intervieweeEmail; // Interviewee email
    this.jobTitle = jobTitle; // Job title being interviewed for
    this.interviewQuestions = []; // Array of question/answer pairs
    this.jobHireInternalRequirements = []; // Internal requirements
    this.jobHireExternalRequirements = []; // External requirements
    this.interviewRounds = 1; // Number of interview rounds (1-5)
    this.availableDatetimes = []; // Array of available datetime options
    this.datetimeChosen = null; // Chosen interview datetime
    this.datetimeDecided = null; // When datetime was decided
    this.alternativeDatetime = null; // Alternative datetime if needed
    this.intervieweeAnswers = []; // Array of interviewee answers
    this.interviewDecision = 'pending'; // 'pending', 'approved', 'denied', 'needs_more_rounds'
    this.googleMeetLink = null; // Google Meet link
    this.interviewChatId = null; // Chat ID for interview discussion
    this.status = 'scheduled'; // 'scheduled', 'in_progress', 'completed', 'cancelled'
    this.metadata = {
      interviewNotes: '',
      hiringManagerNotes: '',
      hrNotes: '',
      technicalAssessment: '',
      culturalFit: '',
      overallRating: 0
    };
  }
}

const schema = new EntitySchema({
  class: Interview,
  extends: "BaseEntity",
  properties: {
    hiringEmployeeId: { type: "number" },
    referredBy: { type: "number", nullable: true },
    intervieweeEmail: { type: "string" },
    jobTitle: { type: "string" },
    interviewQuestions: { type: "json", default: [] },
    jobHireInternalRequirements: { type: "json", default: [] },
    jobHireExternalRequirements: { type: "json", default: [] },
    interviewRounds: { type: "number", default: 1 },
    availableDatetimes: { type: "json", default: [] },
    datetimeChosen: { type: "Date", nullable: true },
    datetimeDecided: { type: "Date", nullable: true },
    alternativeDatetime: { type: "Date", nullable: true },
    intervieweeAnswers: { type: "json", default: [] },
    interviewDecision: { type: "string", default: "pending" },
    googleMeetLink: { type: "string", nullable: true },
    interviewChatId: { type: "number", nullable: true },
    status: { type: "string", default: "scheduled" },
    metadata: { type: "json", default: {} },
  },
});

module.exports = {
  Interview,
  entity: Interview,
  schema,
  label: "interviewRepository",
}; 