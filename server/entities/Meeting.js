 "use strict";
const { EntitySchema } = require("@mikro-orm/core");
const { BaseEntity } = require("./BaseEntity");

class Meeting extends BaseEntity {
  constructor(title, organizerId, startTime, endTime) {
    super();
    this.title = title; // Meeting title
    this.organizerId = organizerId; // Employee ID organizing the meeting
    this.startTime = startTime; // Meeting start time
    this.endTime = endTime; // Meeting end time
    this.description = ''; // Meeting description
    this.location = ''; // Meeting location (physical or virtual)
    this.meetingType = 'internal'; // 'internal', 'interview', 'external'
    this.requiredAttendees = [organizerId]; // Array of required attendee IDs
    this.optionalAttendees = []; // Array of optional attendee IDs
    this.status = 'scheduled'; // 'scheduled', 'in_progress', 'completed', 'cancelled'
    this.googleMeetLink = null; // Google Meet link if virtual
    this.chatId = null; // Associated chat ID
    this.agenda = []; // Meeting agenda items
    this.notes = ''; // Meeting notes
    this.reminderSent = false; // Whether reminder was sent
    this.reminderSentAt = null; // When reminder was sent
    this.metadata = {
      meetingPurpose: '',
      actionItems: [],
      followUpRequired: false,
      followUpDate: null,
      attachments: []
    };
  }
}

const schema = new EntitySchema({
  class: Meeting,
  extends: "BaseEntity",
  properties: {
    title: { type: "string" },
    organizerId: { type: "number" },
    startTime: { type: "Date" },
    endTime: { type: "Date" },
    description: { type: "text", default: "" },
    location: { type: "string", default: "" },
    meetingType: { type: "string", default: "internal" },
    requiredAttendees: { type: "json", default: [] },
    optionalAttendees: { type: "json", default: [] },
    status: { type: "string", default: "scheduled" },
    googleMeetLink: { type: "string", nullable: true },
    chatId: { type: "number", nullable: true },
    agenda: { type: "json", default: [] },
    notes: { type: "text", default: "" },
    reminderSent: { type: "boolean", default: false },
    reminderSentAt: { type: "Date", nullable: true },
    metadata: { type: "json", default: {} },
  },
});

module.exports = {
  Meeting,
  entity: Meeting,
  schema,
  label: "meetingRepository",
};