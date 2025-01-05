export interface User {
    email: string;
    role: 'manager' | 'employee';
  }
  
  export interface Vacation {
    id: string;
    employeeEmail: string;
    startDate: string;
    endDate: string;
    status: 'pending' | 'approved' | 'rejected';
    requestedAt: string;
  }