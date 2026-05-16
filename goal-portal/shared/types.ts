export enum Role {
  EMPLOYEE = 'EMPLOYEE',
  MANAGER = 'MANAGER',
  ADMIN = 'ADMIN',
}

export enum UomType {
  NUMERIC = 'NUMERIC',
  PERCENTAGE = 'PERCENTAGE',
  TIMELINE = 'TIMELINE',
  ZERO_BASED = 'ZERO_BASED',
}

export enum GoalStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  RETURNED = 'RETURNED',
  COMPLETED = 'COMPLETED',
}

export enum ProgressStatus {
  NOT_STARTED = 'NOT_STARTED',
  ON_TRACK = 'ON_TRACK',
  COMPLETED = 'COMPLETED',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  managerId?: string;
}

export interface Goal {
  id: string;
  employeeId: string;
  thrustArea: string;
  title: string;
  description?: string;
  uom: UomType;
  target: number;
  weightage: number;
  status: GoalStatus;
  locked: boolean;
  isShared: boolean;
}

export interface GoalUpdate {
  id: string;
  goalId: string;
  quarter: string;
  achievement: number;
  statusUpdate: ProgressStatus;
  comment?: string;
  progressScore?: number;
  createdAt: Date;
}
