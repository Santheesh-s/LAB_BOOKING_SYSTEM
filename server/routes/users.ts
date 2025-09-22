import { RequestHandler } from "express";
import { ObjectId } from "mongodb";
import { getDatabase } from "../db";
import { User, Lab, Club, ApiResponse } from "@shared/types";
import bcrypt from 'bcrypt';

export const getUsers: RequestHandler = async (req, res) => {
  try {
    const db = await getDatabase();
    const users = await db.collection<User>('users')
      .find({}, { projection: { password: 0 } })
      .toArray();
    
    res.json({ success: true, data: users } as ApiResponse<User[]>);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' } as ApiResponse);
  }
};

export const createUser: RequestHandler = async (req, res) => {
  try {
    const { email, password, name, role, labId, clubId } = req.body;
    
    const db = await getDatabase();
    
    // Check if user already exists
    const existingUser = await db.collection<User>('users').findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists' 
      } as ApiResponse);
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser: User = {
      email,
      password: hashedPassword,
      name,
      role,
      ...(labId && { labId }),
      ...(clubId && { clubId }),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection<User>('users').insertOne(newUser);
    
    // If user is a club member, add them to the club's members array
    if (clubId) {
      await db.collection<Club>('clubs').updateOne(
        { _id: new ObjectId(clubId) },
        { $addToSet: { members: result.insertedId.toString() } }
      );
    }
    
    const { password: _, ...userWithoutPassword } = newUser;
    
    res.status(201).json({ 
      success: true, 
      data: { ...userWithoutPassword, _id: result.insertedId } 
    } as ApiResponse<User>);
    
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' } as ApiResponse);
  }
};

export const updateUser: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, name, role, labId, clubId, password } = req.body;
    
    const db = await getDatabase();
    
    // Get current user to check for club changes
    const currentUser = await db.collection<User>('users').findOne({ _id: new ObjectId(id) });
    
    const updateData: Partial<User> = {
      email,
      name,
      role,
      ...(labId && { labId }),
      ...(clubId !== undefined && { clubId }),
      updatedAt: new Date()
    };
    
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    
    const result = await db.collection<User>('users').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'User not found' } as ApiResponse);
    }
    
    // Handle club membership changes
    if (currentUser) {
      // Remove from old club if it changed
      if (currentUser.clubId && currentUser.clubId !== clubId) {
        await db.collection<Club>('clubs').updateOne(
          { _id: new ObjectId(currentUser.clubId) },
          { $pull: { members: id } }
        );
      }
      
      // Add to new club if specified
      if (clubId && clubId !== currentUser.clubId) {
        await db.collection<Club>('clubs').updateOne(
          { _id: new ObjectId(clubId) },
          { $addToSet: { members: id } }
        );
      }
    }
    
    res.json({ success: true, message: 'User updated successfully' } as ApiResponse);
    
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' } as ApiResponse);
  }
};

export const deleteUser: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    
    const db = await getDatabase();
    
    // Get user to check for club membership
    const user = await db.collection<User>('users').findOne({ _id: new ObjectId(id) });
    
    const result = await db.collection<User>('users').deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'User not found' } as ApiResponse);
    }
    
    // Remove from club if they were a member
    if (user?.clubId) {
      await db.collection<Club>('clubs').updateOne(
        { _id: new ObjectId(user.clubId) },
        { $pull: { members: id } }
      );
    }
    
    res.json({ success: true, message: 'User deleted successfully' } as ApiResponse);
    
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' } as ApiResponse);
  }
};

export const getLabs: RequestHandler = async (req, res) => {
  try {
    const db = await getDatabase();
    const labs = await db.collection<Lab>('labs').find({}).toArray();
    
    res.json({ success: true, data: labs } as ApiResponse<Lab[]>);
  } catch (error) {
    console.error('Get Labs error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' } as ApiResponse);
  }
};

export const getClubs: RequestHandler = async (req, res) => {
  try {
    const db = await getDatabase();
    const clubs = await db.collection<Club>('clubs').find({}).toArray();
    
    res.json({ success: true, data: clubs } as ApiResponse<Club[]>);
  } catch (error) {
    console.error('Get Clubs error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' } as ApiResponse);
  }
};
