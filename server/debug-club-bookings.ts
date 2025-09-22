import { getDatabase } from './db';
import { User, Club, Booking } from '@shared/types';

async function debugClubBookings() {
  try {
    const db = await getDatabase();
    
    console.log('🔍 DEBUGGING CLUB BOOKING APPROVAL QUEUE\n');
    
    // 1. Check Club Incharges
    console.log('1️⃣ CLUB INCHARGES:');
    const clubIncharges = await db.collection<User>('users').find({ role: 'club_incharge' }).toArray();
    clubIncharges.forEach(user => {
      console.log(`   - ${user.name} (${user.email}) ID: ${user._id}`);
    });
    console.log();
    
    // 2. Check Clubs and their assignments
    console.log('2️⃣ CLUBS AND INCHARGE ASSIGNMENTS:');
    const clubs = await db.collection<Club>('clubs').find({}).toArray();
    clubs.forEach(club => {
      console.log(`   - ${club.name}`);
      console.log(`     clubInchargeId: ${club.clubInchargeId || 'NOT SET'}`);
      console.log(`     club ID: ${club._id}`);
      console.log(`     members: ${club.members?.length || 0} total`);
      if (club.members?.length) {
        console.log(`     member IDs: ${club.members.slice(0, 3).join(', ')}${club.members.length > 3 ? '...' : ''}`);
      }
    });
    console.log();
    
    // 3. Check Club Members
    console.log('3️⃣ CLUB MEMBERS:');
    const clubMembers = await db.collection<User>('users').find({ 
      role: { $in: ['club_member', 'club_executive', 'club_secretary'] }
    }).toArray();
    clubMembers.forEach(user => {
      console.log(`   - ${user.name} (${user.role})`);
      console.log(`     clubId: ${user.clubId || 'NOT SET'}`);
      console.log(`     user ID: ${user._id}`);
    });
    console.log();
    
    // 4. Check Recent Bookings
    console.log('4️⃣ RECENT BOOKINGS:');
    const bookings = await db.collection<Booking>('bookings').find({}).sort({ createdAt: -1 }).limit(10).toArray();
    if (bookings.length === 0) {
      console.log('   - No bookings found in database');
    } else {
      bookings.forEach(booking => {
        console.log(`   - Lab: ${booking.labId}`);
        console.log(`     Status: ${booking.status}`);
        console.log(`     clubId: ${booking.clubId || 'NONE'}`);
        console.log(`     User: ${booking.userId}`);
        console.log(`     Date: ${booking.date} ${booking.startTime}-${booking.endTime}`);
        console.log(`     Created: ${booking.createdAt}`);
        console.log();
      });
    }
    
    // 5. Test Club Pending Query for each incharge
    console.log('5️⃣ TESTING CLUB PENDING QUERIES:');
    for (const incharge of clubIncharges) {
      console.log(`\n   Testing for ${incharge.name} (${incharge._id}):`);
      
      // Find clubs for this incharge
      const inchargeClubs = await db.collection<Club>('clubs').find({ 
        clubInchargeId: incharge._id?.toString() 
      }).toArray();
      console.log(`     - Manages ${inchargeClubs.length} clubs:`);
      inchargeClubs.forEach(club => {
        console.log(`       * ${club.name} (ID: ${club._id})`);
      });
      
      if (inchargeClubs.length > 0) {
        const clubIds = inchargeClubs.map(club => club._id?.toString()).filter(Boolean);
        
        // Find pending bookings for these clubs
        const pendingBookings = await db.collection<Booking>('bookings').find({
          clubId: { $in: clubIds },
          status: 'pending_club_approval'
        }).toArray();
        
        console.log(`     - Pending bookings: ${pendingBookings.length}`);
        pendingBookings.forEach(booking => {
          console.log(`       * ${booking.date} ${booking.startTime}-${booking.endTime} (Lab: ${booking.labId})`);
        });
        
        // Also check all bookings for these clubs (any status)
        const allClubBookings = await db.collection<Booking>('bookings').find({
          clubId: { $in: clubIds }
        }).toArray();
        console.log(`     - Total club bookings (any status): ${allClubBookings.length}`);
      }
    }
    
    // 6. Check for any mismatched data
    console.log('\n6️⃣ DATA VALIDATION:');
    for (const member of clubMembers) {
      if (member.clubId) {
        const club = clubs.find(c => c._id?.toString() === member.clubId);
        if (!club) {
          console.log(`   ❌ ERROR: ${member.name} has clubId ${member.clubId} but no club exists with that ID`);
        } else {
          console.log(`   ✅ ${member.name} belongs to club "${club.name}"`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

// Run debug if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  debugClubBookings().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { debugClubBookings };
