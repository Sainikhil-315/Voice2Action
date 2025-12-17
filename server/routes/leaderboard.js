// routes/leaderboard.js - REFACTORED
const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Contribution = require('../models/Contribution');
const Issue = require('../models/Issue');
const { protect, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @desc    Get monthly leaderboard
// @route   GET /api/leaderboard/monthly
// @access  Public
router.get('/monthly', optionalAuth, async (req, res) => {
  try {
    const { month, year, category, limit = 20 } = req.query;
    
    const currentDate = new Date();
    const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();

    // Build match criteria
    const matchCriteria = {
      month: targetMonth,
      year: targetYear
    };

    if (category && category !== 'all') {
      matchCriteria.category = category;
    }

    // Single optimized aggregation pipeline
    const leaderboard = await Contribution.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: '$user',
          totalPoints: { $sum: '$points' },
          issueCount: { $sum: { $cond: [{ $eq: ['$type', 'issue_reported'] }, 1, 0] } },
          resolvedCount: { $sum: { $cond: [{ $eq: ['$type', 'issue_resolved'] }, 1, 0] } },
          upvoteCount: { $sum: { $cond: [{ $eq: ['$type', 'upvote_given'] }, 1, 0] } },
          commentCount: { $sum: { $cond: [{ $eq: ['$type', 'comment_added'] }, 1, 0] } },
          firstContribution: { $min: '$createdAt' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          userId: '$_id',
          name: '$user.name',
          avatar: '$user.avatar',
          points: '$totalPoints',
          issueCount: 1,
          resolvedCount: 1,
          upvoteCount: 1,
          commentCount: 1,
          monthlyGrowth: '$totalPoints',
          joinedAt: '$user.createdAt',
          title: { $ifNull: ['$user.title', 'Community Member'] }
        }
      },
      { $sort: { points: -1, issueCount: -1 } },
      { $limit: parseInt(limit) }
    ]);

    // Get total issues for the category/timeframe
    const issueMatchCriteria = {
      createdAt: {
        $gte: new Date(targetYear, targetMonth - 1, 1),
        $lt: new Date(targetYear, targetMonth, 1)
      }
    };

    if (category && category !== 'all') {
      issueMatchCriteria.category = category;
    }

    const [issueStats] = await Issue.aggregate([
      { $match: issueMatchCriteria },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
          uniqueUsers: { $addToSet: '$reporter' }
        }
      }
    ]);

    // Get user's position if authenticated
    let userPosition = null;
    if (req.user) {
      const userIndex = leaderboard.findIndex(
        entry => entry.userId.toString() === req.user._id.toString()
      );
      
      if (userIndex !== -1) {
        userPosition = {
          rank: userIndex + 1,
          ...leaderboard[userIndex]
        };
      } else {
        // User not in top list, fetch their data
        const [userData] = await Contribution.aggregate([
          { 
            $match: { 
              ...matchCriteria, 
              user: req.user._id 
            } 
          },
          {
            $group: {
              _id: null,
              totalPoints: { $sum: '$points' },
              issueCount: { $sum: { $cond: [{ $eq: ['$type', 'issue_reported'] }, 1, 0] } }
            }
          }
        ]);

        if (userData) {
          // Count users with more points
          const rank = await Contribution.aggregate([
            { $match: matchCriteria },
            { $group: { _id: '$user', totalPoints: { $sum: '$points' } } },
            { $match: { totalPoints: { $gt: userData.totalPoints } } },
            { $count: 'count' }
          ]);

          userPosition = {
            rank: (rank[0]?.count || 0) + 1,
            points: userData.totalPoints,
            issueCount: userData.issueCount,
            name: req.user.name,
            avatar: req.user.avatar
          };
        }
      }
    }

    res.json({
      success: true,
      data: {
        leaderboard,
        stats: {
          totalIssues: issueStats?.total || 0,
          resolvedIssues: issueStats?.resolved || 0,
          activeContributors: issueStats?.uniqueUsers?.length || 0,
          overview: {
            total: issueStats?.total || 0,
            resolved: issueStats?.resolved || 0,
            uniqueUsers: issueStats?.uniqueUsers || []
          }
        },
        userPosition,
        filters: {
          month: targetMonth,
          year: targetYear,
          category: category || 'all'
        }
      }
    });

  } catch (error) {
    console.error('Monthly leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch monthly leaderboard',
      error: error.message
    });
  }
});

// @desc    Get yearly leaderboard
// @route   GET /api/leaderboard/yearly
// @access  Public
router.get('/yearly', optionalAuth, async (req, res) => {
  try {
    const { year, category, limit = 20 } = req.query;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();

    const matchCriteria = { year: targetYear };
    if (category && category !== 'all') {
      matchCriteria.category = category;
    }

    const leaderboard = await Contribution.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: '$user',
          totalPoints: { $sum: '$points' },
          issueCount: { $sum: { $cond: [{ $eq: ['$type', 'issue_reported'] }, 1, 0] } },
          resolvedCount: { $sum: { $cond: [{ $eq: ['$type', 'issue_resolved'] }, 1, 0] } },
          monthlyBreakdown: {
            $push: {
              month: '$month',
              points: '$points',
              type: '$type'
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          userId: '$_id',
          name: '$user.name',
          avatar: '$user.avatar',
          points: '$totalPoints',
          issueCount: 1,
          resolvedCount: 1,
          monthlyBreakdown: 1,
          joinedAt: '$user.createdAt',
          title: { $ifNull: ['$user.title', 'Community Member'] }
        }
      },
      { $sort: { points: -1, issueCount: -1 } },
      { $limit: parseInt(limit) }
    ]);

    // Calculate monthly growth (current month vs last month)
    const currentMonth = new Date().getMonth() + 1;
    const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    
    const enrichedLeaderboard = leaderboard.map(entry => {
      const currentMonthPoints = entry.monthlyBreakdown
        .filter(m => m.month === currentMonth)
        .reduce((sum, m) => sum + m.points, 0);
      
      const lastMonthPoints = entry.monthlyBreakdown
        .filter(m => m.month === lastMonth)
        .reduce((sum, m) => sum + m.points, 0);

      return {
        ...entry,
        monthlyGrowth: currentMonthPoints - lastMonthPoints
      };
    });

    // Get yearly stats
    const issueMatchCriteria = {
      createdAt: {
        $gte: new Date(targetYear, 0, 1),
        $lt: new Date(targetYear + 1, 0, 1)
      }
    };

    if (category && category !== 'all') {
      issueMatchCriteria.category = category;
    }

    const [yearStats] = await Issue.aggregate([
      { $match: issueMatchCriteria },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
          uniqueUsers: { $addToSet: '$reporter' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        leaderboard: enrichedLeaderboard,
        stats: {
          totalIssues: yearStats?.total || 0,
          resolvedIssues: yearStats?.resolved || 0,
          activeContributors: yearStats?.uniqueUsers?.length || 0
        },
        filters: {
          year: targetYear,
          category: category || 'all'
        }
      }
    });

  } catch (error) {
    console.error('Yearly leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch yearly leaderboard',
      error: error.message
    });
  }
});

// @desc    Get user's contribution history
// @route   GET /api/leaderboard/user/:userId
// @access  Public
router.get('/user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const { year } = req.query;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    const user = await User.findById(userId).select('name avatar stats createdAt');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get comprehensive user stats
    const [userStats] = await Contribution.aggregate([
      { $match: { user: user._id, year: targetYear } },
      {
        $group: {
          _id: null,
          totalPoints: { $sum: '$points' },
          totalContributions: { $sum: 1 },
          issuesReported: { $sum: { $cond: [{ $eq: ['$type', 'issue_reported'] }, 1, 0] } },
          issuesResolved: { $sum: { $cond: [{ $eq: ['$type', 'issue_resolved'] }, 1, 0] } },
          upvotesGiven: { $sum: { $cond: [{ $eq: ['$type', 'upvote_given'] }, 1, 0] } },
          commentsAdded: { $sum: { $cond: [{ $eq: ['$type', 'comment_added'] }, 1, 0] } }
        }
      }
    ]);

    // Get monthly breakdown
    const monthlyData = await Contribution.aggregate([
      { $match: { user: user._id, year: targetYear } },
      {
        $group: {
          _id: '$month',
          points: { $sum: '$points' },
          contributions: { $sum: 1 },
          categories: { $addToSet: '$category' }
        }
      },
      { $sort: { '_id': 1 } },
      {
        $project: {
          month: '$_id',
          points: 1,
          contributions: 1,
          categories: 1,
          _id: 0
        }
      }
    ]);

    // Get category breakdown
    const categoryBreakdown = await Contribution.aggregate([
      { $match: { user: user._id, year: targetYear } },
      {
        $group: {
          _id: '$category',
          points: { $sum: '$points' },
          contributions: { $sum: 1 }
        }
      },
      { $sort: { points: -1 } },
      {
        $project: {
          category: '$_id',
          points: 1,
          contributions: 1,
          _id: 0
        }
      }
    ]);

    // Calculate current rank
    const currentMonth = new Date().getMonth() + 1;
    const allUsers = await Contribution.aggregate([
      { $match: { month: currentMonth, year: targetYear } },
      { $group: { _id: '$user', totalPoints: { $sum: '$points' } } },
      { $sort: { totalPoints: -1 } }
    ]);

    const rank = allUsers.findIndex(u => u._id.toString() === userId) + 1;

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          avatar: user.avatar,
          joinedAt: user.createdAt
        },
        rank: rank || null,
        totalIssues: userStats?.issuesReported || 0,
        resolvedIssues: userStats?.issuesResolved || 0,
        totalPoints: userStats?.totalPoints || 0,
        monthlyPoints: monthlyData.find(m => m.month === currentMonth)?.points || 0,
        stats: {
          totalPoints: userStats?.totalPoints || 0,
          totalContributions: userStats?.totalContributions || 0,
          issuesReported: userStats?.issuesReported || 0,
          issuesResolved: userStats?.issuesResolved || 0,
          upvotesGiven: userStats?.upvotesGiven || 0,
          commentsAdded: userStats?.commentsAdded || 0
        },
        monthlyBreakdown: monthlyData,
        categoryBreakdown,
        year: targetYear
      }
    });

  } catch (error) {
    console.error('User history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user contribution history',
      error: error.message
    });
  }
});

// @desc    Get leaderboard statistics
// @route   GET /api/leaderboard/stats
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // Overall platform stats
    const [overallStats] = await Contribution.aggregate([
      {
        $group: {
          _id: null,
          totalContributions: { $sum: 1 },
          totalPoints: { $sum: '$points' },
          uniqueUsers: { $addToSet: '$user' }
        }
      }
    ]);

    // Current month stats
    const [monthStats] = await Contribution.aggregate([
      { $match: { month: currentMonth, year: currentYear } },
      {
        $group: {
          _id: null,
          monthlyContributions: { $sum: 1 },
          monthlyPoints: { $sum: '$points' },
          activeUsers: { $addToSet: '$user' }
        }
      }
    ]);

    // Category distribution
    const categoryStats = await Contribution.aggregate([
      { $match: { month: currentMonth, year: currentYear } },
      {
        $group: {
          _id: '$category',
          contributions: { $sum: 1 },
          points: { $sum: '$points' }
        }
      },
      { $sort: { contributions: -1 } },
      {
        $project: {
          category: '$_id',
          contributions: 1,
          points: 1,
          _id: 0
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        overall: {
          totalContributions: overallStats?.totalContributions || 0,
          totalPoints: overallStats?.totalPoints || 0,
          totalUsers: overallStats?.uniqueUsers?.length || 0
        },
        currentMonth: {
          contributions: monthStats?.monthlyContributions || 0,
          points: monthStats?.monthlyPoints || 0,
          activeUsers: monthStats?.activeUsers?.length || 0
        },
        categoryDistribution: categoryStats
      }
    });

  } catch (error) {
    console.error('Leaderboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard statistics',
      error: error.message
    });
  }
});

module.exports = router;