import { getDatabase } from './db';
import { User, Lab, Club } from '@shared/types';
import bcrypt from 'bcrypt';

async function seedDatabase() {
  try {
    const db = await getDatabase();

    // Create default admin user
    const adminEmail = 'admin@ai.college.edu';
    const existingAdmin = await db.collection<User>('users').findOne({ email: adminEmail });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const adminUser: User = {
        email: adminEmail,
        password: hashedPassword,
        name: 'AI Department Administrator',
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.collection<User>('users').insertOne(adminUser);
      console.log('✅ Default admin user created:', adminEmail);
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    // Create AI Labs (these serve as computer centers)
    const aiLabs = [
      {
        name: 'AI Research Lab',
        capacity: 30,
        equipment: ['High-performance GPUs', 'Deep Learning Workstations', 'Data Servers']
      },
      {
        name: 'Machine Learning Lab',
        capacity: 25,
        equipment: ['ML Workstations', 'Cloud Computing Access', 'Jupyter Notebooks']
      },
      {
        name: 'Computer Vision Lab',
        capacity: 20,
        equipment: ['Camera Systems', 'Image Processing Units', 'VR/AR Equipment']
      },
      {
        name: 'NLP & Text Analytics Lab',
        capacity: 22,
        equipment: ['Language Processing Servers', 'Text Mining Tools', 'Speech Recognition Systems']
      }
    ];

    const labIds: string[] = [];

    for (const labData of aiLabs) {
      const existingLab = await db.collection<Lab>('labs').findOne({ name: labData.name });
      if (!existingLab) {
        const lab: Lab = {
          ...labData,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        const result = await db.collection<Lab>('labs').insertOne(lab);
        labIds.push(result.insertedId.toString());
        console.log('✅ AI Lab created:', labData.name);
      } else {
        labIds.push(existingLab._id!.toString());
      }
    }

    // Create sample faculty users
    const facultyUsers = [
      { email: 'faculty1@ai.college.edu', name: 'Dr. Sarah Johnson', password: 'faculty123' },
      { email: 'faculty2@ai.college.edu', name: 'Dr. Michael Chen', password: 'faculty123' }
    ];

    const facultyIds: string[] = [];

    for (const facultyData of facultyUsers) {
      const existing = await db.collection<User>('users').findOne({ email: facultyData.email });
      if (!existing) {
        const hashedPassword = await bcrypt.hash(facultyData.password, 10);
        
        const user: User = {
          email: facultyData.email,
          password: hashedPassword,
          name: facultyData.name,
          role: 'faculty',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const result = await db.collection<User>('users').insertOne(user);
        facultyIds.push(result.insertedId.toString());
        console.log('✅ Faculty user created:', facultyData.email);
      } else {
        facultyIds.push(existing._id!.toString());
      }
    }

    // Create club incharge users
    const clubInchargeUsers = [
      { email: 'clubincharge1@ai.college.edu', name: 'Prof. Alex Wilson', password: 'club123' },
      { email: 'clubincharge2@ai.college.edu', name: 'Dr. Lisa Garcia', password: 'club123' }
    ];

    const clubInchargeIds: string[] = [];

    for (const clubInchargeData of clubInchargeUsers) {
      const existing = await db.collection<User>('users').findOne({ email: clubInchargeData.email });
      if (!existing) {
        const hashedPassword = await bcrypt.hash(clubInchargeData.password, 10);
        
        const user: User = {
          email: clubInchargeData.email,
          password: hashedPassword,
          name: clubInchargeData.name,
          role: 'club_incharge',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const result = await db.collection<User>('users').insertOne(user);
        clubInchargeIds.push(result.insertedId.toString());
        console.log('✅ Club incharge user created:', clubInchargeData.email);
      } else {
        clubInchargeIds.push(existing._id!.toString());
      }
    }

    // Create lab incharge user
    const labInchargeEmail = 'labincharge@ai.college.edu';
    const existingLabIncharge = await db.collection<User>('users').findOne({ email: labInchargeEmail });

    if (!existingLabIncharge && labIds.length > 0) {
      const hashedPassword = await bcrypt.hash('lab123', 10);
      
      const user: User = {
        email: labInchargeEmail,
        password: hashedPassword,
        name: 'Prof. Robert Wilson',
        role: 'lab_incharge',
        labId: labIds[0], // Assign to first lab
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.collection<User>('users').insertOne(user);
      console.log('✅ Lab incharge user created:', labInchargeEmail);
    }

    // Create AI Department Clubs (with club incharges)
    const aiClubs = [
      {
        name: 'AI Enthusiasts Club',
        description: 'Student club for AI research and innovation',
        clubInchargeId: clubInchargeIds[0] || facultyIds[0] || ''
      },
      {
        name: 'Machine Learning Society',
        description: 'Community for ML practitioners and learners',
        clubInchargeId: clubInchargeIds[1] || facultyIds[1] || facultyIds[0] || ''
      },
      {
        name: 'Data Science Club',
        description: 'Exploring data science and analytics',
        clubInchargeId: facultyIds[0] || ''
      }
    ];

    const clubIds: string[] = [];

    for (const clubData of aiClubs) {
      const existingClub = await db.collection<Club>('clubs').findOne({ name: clubData.name });
      if (!existingClub && clubData.clubInchargeId) {
        const club: Club = {
          ...clubData,
          members: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        const result = await db.collection<Club>('clubs').insertOne(club);
        clubIds.push(result.insertedId.toString());
        console.log('✅ AI Club created:', clubData.name);
      } else if (existingClub) {
        clubIds.push(existingClub._id!.toString());
      }
    }

    // Create sample students with club assignments
    const studentUsers = [
      { email: 'student1@ai.college.edu', name: 'Alice Kumar', role: 'club_member', clubIndex: 0 },
      { email: 'student2@ai.college.edu', name: 'Bob Patel', role: 'club_executive', clubIndex: 1 },
      { email: 'student3@ai.college.edu', name: 'Carol Singh', role: 'club_secretary', clubIndex: 0 }
    ];

    for (const studentData of studentUsers) {
      const existing = await db.collection<User>('users').findOne({ email: studentData.email });
      if (!existing && clubIds[studentData.clubIndex]) {
        const hashedPassword = await bcrypt.hash('student123', 10);
        
        const user: User = {
          email: studentData.email,
          password: hashedPassword,
          name: studentData.name,
          role: studentData.role as any,
          clubId: clubIds[studentData.clubIndex],
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const result = await db.collection<User>('users').insertOne(user);
        
        // Add user to club members
        await db.collection<Club>('clubs').updateOne(
          { _id: { $eq: clubIds[studentData.clubIndex] } },
          { $addToSet: { members: result.insertedId.toString() } }
        );
        
        console.log('✅ Student user created:', studentData.email);
      }
    }

    console.log('🎉 AI Department database seeding completed successfully!');
    console.log('\n📝 Default Login Credentials:');
    console.log('Admin: admin@ai.college.edu / admin123');
    console.log('Faculty: faculty1@ai.college.edu / faculty123');
    console.log('Club Incharge: clubincharge1@ai.college.edu / club123');
    console.log('Lab Incharge: labincharge@ai.college.edu / lab123');
    console.log('Student: student1@ai.college.edu / student123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
}

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { seedDatabase };
