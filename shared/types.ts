export interface User {
  _id?: string;
  email: string;
  password?: string;
  name: string;
  role: UserRole;
  labId?: string; // For Lab Incharge role - which lab they manage
  clubId?: string; // For club members - which club they belong to
  createdAt?: Date;
  updatedAt?: Date;
}

export type UserRole = 
  | 'admin'
  | 'faculty'
  | 'lab_incharge'
  | 'club_member'
  | 'club_executive'
  | 'club_secretary'
  | 'club_incharge';

export interface Club {
  _id?: string;
  name: string;
  description?: string;
  clubInchargeId?: string; // Club incharge user ID
  members?: string[]; // User IDs
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Lab {
  _id?: string;
  name: string;
  capacity: number;
  equipment?: string[];
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Booking {
  _id?: string;
  labId: string;
  userId: string;
  clubId?: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  status: BookingStatus;
  clubApprovalStatus?: ClubApprovalStatus; // For club bookings
  clubApprovedBy?: string; // Club incharge who approved
  clubApprovedAt?: Date;
  labApprovedBy?: string; // Lab incharge who approved
  labApprovedAt?: Date;
  rejectionReason?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type BookingStatus = 
  | 'pending_club_approval'     // Waiting for club incharge approval
  | 'pending_lab_approval'      // Waiting for lab incharge approval  
  | 'approved'                  // Fully approved
  | 'rejected_by_club'          // Rejected by club incharge
  | 'rejected_by_lab'           // Rejected by lab incharge
  | 'cancelled';                // Cancelled by user

export type ClubApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}
