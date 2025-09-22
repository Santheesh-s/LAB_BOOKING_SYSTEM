import { RequestHandler } from "express";
import { ObjectId } from "mongodb";
import { getDatabase } from "../db";
import { Club, User, ApiResponse } from "@shared/types";

export const getClubs: RequestHandler = async (req, res) => {
  try {
    const db = await getDatabase();
    const clubs = await db.collection<Club>('clubs').find({}).toArray();
    
    res.json({ success: true, data: clubs } as ApiResponse<Club[]>);
  } catch (error) {
    console.error('Get clubs error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' } as ApiResponse);
  }
};

export const createClub: RequestHandler = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    const db = await getDatabase();
    
    // Check if club name already exists
    const existingClub = await db.collection<Club>('clubs').findOne({ name });
    if (existingClub) {
      return res.status(400).json({ 
        success: false, 
        message: 'Club name already exists' 
      } as ApiResponse);
    }
    
    const newClub: Club = {
      name,
      description,
      members: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection<Club>('clubs').insertOne(newClub);
    
    res.status(201).json({ 
      success: true, 
      data: { ...newClub, _id: result.insertedId } 
    } as ApiResponse<Club>);
    
  } catch (error) {
    console.error('Create club error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' } as ApiResponse);
  }
};

export const updateClub: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    
    const db = await getDatabase();
    
    const updateData: Partial<Club> = {
      name,
      description,
      updatedAt: new Date()
    };
    
    const result = await db.collection<Club>('clubs').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Club not found' } as ApiResponse);
    }
    
    res.json({ success: true, message: 'Club updated successfully' } as ApiResponse);
    
  } catch (error) {
    console.error('Update club error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' } as ApiResponse);
  }
};

export const deleteClub: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    
    const db = await getDatabase();
    
    const result = await db.collection<Club>('clubs').deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Club not found' } as ApiResponse);
    }
    
    res.json({ success: true, message: 'Club deleted successfully' } as ApiResponse);
    
  } catch (error) {
    console.error('Delete club error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' } as ApiResponse);
  }
};

export const addClubMember: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    const db = await getDatabase();
    
    const result = await db.collection<Club>('clubs').updateOne(
      { _id: new ObjectId(id) },
      { $addToSet: { members: userId } }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Club not found' } as ApiResponse);
    }
    
    res.json({ success: true, message: 'Member added successfully' } as ApiResponse);
    
  } catch (error) {
    console.error('Add club member error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' } as ApiResponse);
  }
};

export const removeClubMember: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    const db = await getDatabase();
    
    const result = await db.collection<Club>('clubs').updateOne(
      { _id: new ObjectId(id) },
      { $pull: { members: userId } }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Club not found' } as ApiResponse);
    }
    
    res.json({ success: true, message: 'Member removed successfully' } as ApiResponse);
    
  } catch (error) {
    console.error('Remove club member error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' } as ApiResponse);
  }
};
