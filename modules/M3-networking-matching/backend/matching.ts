/**
 * Matching Routes
 * Endpoints for user matching and recommendations
 */

import express, { Request, Response } from 'express';
import authenticateUser from '../middleware/auth';

const router = express.Router();

// This would typically call the ai-service
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

interface UserProfile {
  id: number;
  sector: string;
  subSectors: string[];
  yearsExperience: number;
  location: string;
  interests: string[];
  name: string;
  email: string;
}

interface MatchResult {
  userId: number;
  name: string;
  sector: string;
  matchScore: number;
  commonSectors: string[];
  reason: string;
}

/**
 * Get personalized matches for the current user
 */
router.get('/recommendations', authenticateUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const limit = (req.query.limit as string) ? parseInt(req.query.limit as string) : 10;

    // TODO: Fetch user profile from database using Prisma
    // const userProfile = await prisma.user.findUnique({
    //   where: { id: parseInt(userId) },
    //   include: { profile: true }
    // });

    // Mock user profile for now
    const userProfile: UserProfile = {
      id: parseInt(userId || '1'),
      sector: 'Technology',
      subSectors: ['SaaS', 'AI'],
      yearsExperience: 5,
      location: 'Casablanca',
      interests: ['innovation', 'startups'],
      name: 'Ahmed',
      email: req.user?.email || '',
    };

    // Call AI matching service
    const response = await fetch(`${AI_SERVICE_URL}/api/matching/sector-based`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user: userProfile,
        candidates: [], // Would be fetched from database
        limit,
      }),
    });

    if (!response.ok) {
      throw new Error('AI service error');
    }

    const matches = await response.json();

    res.json({
      success: true,
      count: matches.length,
      matches,
    });
  } catch (error) {
    console.error('Matching error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get recommendations',
    });
  }
});

/**
 * Get available sectors for filtering
 */
router.get('/sectors', async (req: Request, res: Response) => {
  try {
    const response = await fetch(`${AI_SERVICE_URL}/api/matching/sectors-available`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('AI service error');
    }

    const data = await response.json();

    res.json({
      success: true,
      sectors: data.sectors,
    });
  } catch (error) {
    console.error('Sectors error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sectors',
    });
  }
});

/**
 * Calculate detailed match score between two users
 */
router.post('/calculate-score', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { targetUserId } = req.body;

    // TODO: Fetch both user profiles from database
    // const currentUser = await prisma.user.findUnique({ where: { id: parseInt(req.user?.id || '0') } });
    // const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });

    // Mock calculation for now
    const mockScore = {
      totalScore: 75.5,
      sectorScore: 80,
      experienceBonus: 10,
      locationBonus: 15,
      commonSectors: ['Technology', 'SaaS'],
      breakdown: {
        sectorMatch: '80%',
        experienceCompatibility: 'Mentor/Mentee',
        location: 'Same City',
      },
    };

    res.json({
      success: true,
      data: mockScore,
    });
  } catch (error) {
    console.error('Score calculation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate score',
    });
  }
});

/**
 * Filter matches by sector
 */
router.post('/filter-by-sector', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { sectors, location, minExperience, maxExperience, limit = 20 } = req.body;

    // TODO: Query database with filters
    // const matches = await prisma.user.findMany({
    //   where: {
    //     profile: {
    //       sector: { in: sectors },
    //       location: location ? { contains: location } : undefined,
    //       yearsExperience: {
    //         gte: minExperience,
    //         lte: maxExperience
    //       }
    //     }
    //   },
    //   take: limit
    // });

    res.json({
      success: true,
      count: 0,
      matches: [],
      filters: {
        sectors,
        location,
        experience: `${minExperience}-${maxExperience} years`,
      },
    });
  } catch (error) {
    console.error('Filter error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to filter matches',
    });
  }
});

/**
 * Get match statistics for the current user
 */
router.get('/stats', authenticateUser, async (req: Request, res: Response) => {
  try {
    // TODO: Calculate real statistics from database
    const stats = {
      totalMatches: 42,
      acceptedMatches: 12,
      pendingMatches: 8,
      rejectedMatches: 5,
      viewedProfiles: 35,
      messageSent: 8,
      messageReceived: 15,
      topSector: 'Technology',
      topLocation: 'Casablanca',
    };

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get statistics',
    });
  }
});

export default router;
