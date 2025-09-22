/**
 * @typedef {Object} User
 * @property {string} [_id] - User ID
 * @property {string} email - User email
 * @property {string} [password] - User password (optional for updates)
 * @property {string} name - User name
 * @property {UserRole} role - User role
 * @property {string} [labId] - For Lab Incharge role - which lab they manage
 * @property {string} [clubId] - For club members - which club they belong to
 * @property {Date} [createdAt] - Creation date
 * @property {Date} [updatedAt] - Update date
 */

/**
 * @typedef {'admin'|'faculty'|'lab_incharge'|'club_member'|'club_executive'|'club_secretary'|'club_incharge'} UserRole
 */

/**
 * @typedef {Object} Club
 * @property {string} [_id] - Club ID
 * @property {string} name - Club name
 * @property {string} [description] - Club description
 * @property {string} [clubInchargeId] - Club incharge user ID
 * @property {string[]} [members] - User IDs of members
 * @property {Date} [createdAt] - Creation date
 * @property {Date} [updatedAt] - Update date
 */

/**
 * @typedef {Object} Lab
 * @property {string} [_id] - Lab ID
 * @property {string} name - Lab name
 * @property {number} capacity - Lab capacity
 * @property {string[]} [equipment] - Equipment list
 * @property {boolean} isActive - Whether lab is active
 * @property {Date} [createdAt] - Creation date
 * @property {Date} [updatedAt] - Update date
 */

/**
 * @typedef {Object} Booking
 * @property {string} [_id] - Booking ID
 * @property {string} labId - Lab ID
 * @property {string} userId - User ID
 * @property {string} [clubId] - Club ID (for club bookings)
 * @property {string} date - Booking date
 * @property {string} startTime - Start time
 * @property {string} endTime - End time
 * @property {string} purpose - Booking purpose
 * @property {BookingStatus} status - Booking status
 * @property {ClubApprovalStatus} [clubApprovalStatus] - Club approval status
 * @property {string} [clubApprovedBy] - Club incharge who approved
 * @property {Date} [clubApprovedAt] - Club approval date
 * @property {string} [labApprovedBy] - Lab incharge who approved
 * @property {Date} [labApprovedAt] - Lab approval date
 * @property {string} [rejectionReason] - Rejection reason
 * @property {Date} [createdAt] - Creation date
 * @property {Date} [updatedAt] - Update date
 */

/**
 * @typedef {'pending_club_approval'|'pending_lab_approval'|'approved'|'rejected_by_club'|'rejected_by_lab'|'cancelled'} BookingStatus
 */

/**
 * @typedef {'pending'|'approved'|'rejected'} ClubApprovalStatus
 */

/**
 * @typedef {Object} AuthResponse
 * @property {boolean} success - Success status
 * @property {User} [user] - User data
 * @property {string} [token] - JWT token
 * @property {string} [message] - Response message
 */

/**
 * @template T
 * @typedef {Object} ApiResponse
 * @property {boolean} success - Success status
 * @property {T} [data] - Response data
 * @property {string} [message] - Response message
 */

// Export empty object for compatibility
export {};
