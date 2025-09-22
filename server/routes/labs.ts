import { RequestHandler } from "express";
import { ObjectId } from "mongodb";
import { getDatabase } from "../db";
import { Lab, ApiResponse } from "@shared/types";

export const getLabs: RequestHandler = async (req, res) => {
  try {
    const db = await getDatabase();
    const labs = await db.collection<Lab>('labs').find({}).toArray();
    
    res.json({ success: true, data: labs } as ApiResponse<Lab[]>);
  } catch (error) {
    console.error('Get labs error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' } as ApiResponse);
  }
};

export const createLab: RequestHandler = async (req, res) => {
  try {
    const { name, capacity, equipment } = req.body;
    
    const db = await getDatabase();
    
    // Check if lab name already exists
    const existingLab = await db.collection<Lab>('labs').findOne({ name });
    if (existingLab) {
      return res.status(400).json({ 
        success: false, 
        message: 'Lab name already exists' 
      } as ApiResponse);
    }
    
    const newLab: Lab = {
      name,
      capacity: parseInt(capacity),
      equipment: equipment || [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection<Lab>('labs').insertOne(newLab);
    
    res.status(201).json({ 
      success: true, 
      data: { ...newLab, _id: result.insertedId } 
    } as ApiResponse<Lab>);
    
  } catch (error) {
    console.error('Create lab error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' } as ApiResponse);
  }
};

export const updateLab: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, capacity, equipment, isActive } = req.body;
    
    const db = await getDatabase();
    
    const updateData: Partial<Lab> = {
      name,
      capacity: parseInt(capacity),
      equipment,
      isActive,
      updatedAt: new Date()
    };
    
    const result = await db.collection<Lab>('labs').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Lab not found' } as ApiResponse);
    }
    
    res.json({ success: true, message: 'Lab updated successfully' } as ApiResponse);
    
  } catch (error) {
    console.error('Update lab error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' } as ApiResponse);
  }
};

export const deleteLab: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    
    const db = await getDatabase();
    
    const result = await db.collection<Lab>('labs').deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Lab not found' } as ApiResponse);
    }
    
    res.json({ success: true, message: 'Lab deleted successfully' } as ApiResponse);
    
  } catch (error) {
    console.error('Delete lab error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' } as ApiResponse);
  }
};
