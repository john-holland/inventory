"use strict";
const { EntitySchema } = require("@mikro-orm/core");
const { BaseEntity } = require("./BaseEntity");

class Employee extends BaseEntity {
  constructor(userId, jobTitle, department, salary) {
    super();
    this.userId = userId; // Associated user ID
    this.employeeId = this.generateEmployeeId(); // Unique employee ID
    this.jobTitle = jobTitle; // Job title
    this.department = department; // Department
    this.salary = salary; // Annual salary
    this.payRate = salary / 12; // Monthly pay rate
    this.hireDate = new Date(); // When employee was hired
    this.timeEmployed = 0; // Time employed in days (calculated)
    this.address = {}; // Employee address
    this.phone = ''; // Phone number
    this.emergencyContacts = []; // Array of emergency contacts
    this.accessLevel = 'EMPLOYEE'; // 'EMPLOYEE', 'COMPANY_HR_EMPLOYEE', 'COMPANY_HR_ADMIN', 'IT_EMPLOYEE'
    this.isActive = true; // Whether employee is active
    this.managerId = null; // Manager's employee ID
    this.reports = []; // Array of employee IDs who report to this employee
    this.taxInformation = {
      withholding: 'SINGLE', // 'SINGLE', 'MARRIED', 'HEAD_OF_HOUSEHOLD'
      exemptions: 1,
      additionalWithholding: 0
    };
    this.metadata = {
      performanceReviews: [],
      promotions: [],
      salaryHistory: [],
      trainingCompleted: [],
      certifications: []
    };
  }

  generateEmployeeId() {
    return 'EMP' + Date.now().toString().slice(-6) + Math.random().toString(36).substr(2, 3).toUpperCase();
  }
}

const schema = new EntitySchema({
  class: Employee,
  extends: "BaseEntity",
  properties: {
    userId: { type: "number" },
    employeeId: { type: "string" },
    jobTitle: { type: "string" },
    department: { type: "string" },
    salary: { type: "number" },
    payRate: { type: "number" },
    hireDate: { type: "Date" },
    timeEmployed: { type: "number", default: 0 },
    address: { type: "json", default: {} },
    phone: { type: "string", default: "" },
    emergencyContacts: { type: "json", default: [] },
    accessLevel: { type: "string", default: "EMPLOYEE" },
    isActive: { type: "boolean", default: true },
    managerId: { type: "number", nullable: true },
    reports: { type: "json", default: [] },
    taxInformation: { type: "json", default: {} },
    metadata: { type: "json", default: {} },
  },
});

module.exports = {
  Employee,
  entity: Employee,
  schema,
  label: "employeeRepository",
}; 