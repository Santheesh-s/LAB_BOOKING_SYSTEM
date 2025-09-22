import { getDatabase } from './db';
import { User, Club } from '@shared/types';

async function fixClubInchargeAssignment() {
  try {
    const db = await getDatabase();
    
    console.log('🔧 FIXING CLUB INCHARGE ASSIGNMENT\n');
    
    // Find the club incharge user
    const clubIncharge = await db.collection<User>('users').findOne({ 
      role: 'club_incharge',
      email: 'santheesh24@gmail.com'
    });
    
    if (!clubIncharge) {
      console.log('❌ Club incharge not found');
      return;
    }
    
    console.log(`✅ Found club incharge: ${clubIncharge.name} (ID: ${clubIncharge._id})`);
    
    // Find the club that needs assignment
    const club = await db.collection<Club>('clubs').findOne({ 
      name: 'AI Coding Club'
    });
    
    if (!club) {
      console.log('❌ Club not found');
      return;
    }
    
    console.log(`✅ Found club: ${club.name} (ID: ${club._id})`);
    console.log(`   Current clubInchargeId: ${club.clubInchargeId || 'NOT SET'}`);
    
    // Update the club with the correct incharge
    const result = await db.collection<Club>('clubs').updateOne(
      { _id: club._id },
      { 
        $set: { 
          clubInchargeId: clubIncharge._id?.toString(),
          updatedAt: new Date()
        }
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log('✅ Successfully updated club incharge assignment');
      
      // Verify the fix
      const updatedClub = await db.collection<Club>('clubs').findOne({ _id: club._id });
      console.log(`   New clubInchargeId: ${updatedClub?.clubInchargeId}`);
      
      // Test the pending bookings query
      console.log('\n🧪 TESTING PENDING BOOKINGS QUERY:');
      const pendingBookings = await db.collection('bookings').find({
        clubId: club._id?.toString(),
        status: 'pending_club_approval'
      }).toArray();
      
      console.log(`   Found ${pendingBookings.length} pending booking(s) for this club`);
      pendingBookings.forEach(booking => {
        console.log(`   - ${booking.date} ${booking.startTime}-${booking.endTime}`);
      });
      
    } else {
      console.log('❌ Failed to update club incharge assignment');
    }
    
  } catch (error) {
    console.error('❌ Fix error:', error);
  }
}

// Run fix if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fixClubInchargeAssignment().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { fixClubInchargeAssignment };
