const prisma = require("../db/prisma");

exports.getUserAnalytics = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      res.status(400).json({ error: "Invalid user ID" });
      return;
    }

    // Use groupBy to count tasks by completion status
    const taskStats = await prisma.task.groupBy({
      by: ['isCompleted'],
      where: { userId },
      _count: {
        id: true
      }
    });

    // Include recent task activity with eager loading
    const recentTasks = await prisma.task.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
        createdAt: true,
        userId: true,
        User: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Calculate weekly progress using groupBy
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const weeklyProgress = await prisma.task.groupBy({
      by: ['createdAt'],
      where: {
        userId,
        createdAt: {
          gte: oneWeekAgo
        }
      },
      _count: {
        id: true
      }
    });

    res.status(200);
    res.json({
      taskStats,
      recentTasks,
      weeklyProgress
    });
    return;
  } catch (err) {
    if (next && typeof next === 'function') {
      return next(err);
    }
    // If next is not provided (like in tests), send error response directly
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error", message: err.message });
    }
  }
};

exports.getUsersWithStats = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get users with task counts using _count aggregation
    // Use include for relations, then manually select fields we need
    const usersRaw = await prisma.user.findMany({
      include: {
        Task: {
          where: { isCompleted: false },
          select: { id: true },
          take: 5
        },
        _count: {
          select: {
            Task: true
          }
        }
      },
      skip: skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    // Transform to only include the fields we want
    const users = usersRaw.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      _count: user._count,
      Task: user.Task
    }));

    // Get total count for pagination
    const totalUsers = await prisma.user.count();

    const pagination = {
      page,
      limit,
      total: totalUsers,
      pages: Math.ceil(totalUsers / limit),
      hasNext: page * limit < totalUsers,
      hasPrev: page > 1
    };

    res.status(200);
    res.json({
      users,
      pagination
    });
    return;
  } catch (err) {
    if (next && typeof next === 'function') {
      return next(err);
    }
    // If next is not provided (like in tests), send error response directly
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error", message: err.message });
    }
  }
};

exports.searchTasks = async (req, res, next) => {
  try {
    const { q: searchQuery, limit = 20 } = req.query;

    if (!searchQuery || searchQuery.trim().length < 2) {
      res.status(400).json({ 
        error: "Search query must be at least 2 characters long" 
      });
      return;
    }

    // Use raw SQL for complex text search with parameterized queries
    // Construct search patterns outside the query for proper parameterization
    const searchPattern = `%${searchQuery}%`;
    const exactMatch = searchQuery;
    const startsWith = `${searchQuery}%`;
    
    const searchResults = await prisma.$queryRaw`
      SELECT 
        t.id,
        t.title,
        t.is_completed as "isCompleted",
        t.priority,
        t.created_at as "createdAt",
        t.user_id as "userId",
        u.name as "user_name"
      FROM tasks t
      JOIN users u ON t.user_id = u.id
      WHERE t.title ILIKE ${searchPattern} 
         OR u.name ILIKE ${searchPattern}
      ORDER BY 
        CASE 
          WHEN t.title ILIKE ${exactMatch} THEN 1
          WHEN t.title ILIKE ${startsWith} THEN 2
          WHEN t.title ILIKE ${searchPattern} THEN 3
          ELSE 4
        END,
        t.created_at DESC
      LIMIT ${parseInt(limit)}
    `;

    res.status(200);
    res.json({
      results: searchResults,
      query: searchQuery,
      count: searchResults.length
    });
    return;
  } catch (err) {
    if (next && typeof next === 'function') {
      return next(err);
    }
    // If next is not provided (like in tests), send error response directly
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error", message: err.message });
    }
  }
};

