const prisma = require('../prisma/db');

/**
 * Get comprehensive user productivity analytics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getUserAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const taskStats = await prisma.task.groupBy({
      by: ['isCompleted'],
      where: { userId },
      _count: { id: true }
    });

    const recentTasks = await prisma.task.findMany({
      where: { userId },
      include: {
        user: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const weeklyProgress = await prisma.task.groupBy({
      by: ['createdAt'],
      where: {
        userId,
        createdAt: { gte: fourWeeksAgo }
      },
      _count: { id: true }
    });

    
    const weeklyStats = weeklyProgress.reduce((acc, item) => {
      const weekStart = new Date(item.createdAt);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); 
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!acc[weekKey]) {
        acc[weekKey] = { createdAt: weekKey, _count: { id: 0 } };
      }
      acc[weekKey]._count.id += item._count.id;
      return acc;
    }, {});

    const weeklyProgressArray = Object.values(weeklyStats);

    res.status(200).json({
      taskStats,
      recentTasks,
      weeklyProgress: weeklyProgressArray
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get all users with task statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getUsersWithTaskStats = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;


    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        _count: {
          select: { tasks: true }
        },
        tasks: {
          where: { isCompleted: false },
          select: { id: true },
          take: 5
        }
      },
      skip: offset,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    const totalUsers = await prisma.user.count();

    const pagination = {
      page,
      limit,
      total: totalUsers,
      pages: Math.ceil(totalUsers / limit),
      hasNext: page * limit < totalUsers,
      hasPrev: page > 1
    };

    res.status(200).json({
      users,
      pagination
    });
  } catch (err) {
    console.error('Users with stats error:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get task search results using raw SQL
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.searchTasks = async (req, res) => {
  try {
    const { q: searchQuery, limit = 20 } = req.query;

    if (!searchQuery || searchQuery.trim().length < 2) {
      return res.status(400).json({ error: "Search query must be at least 2 characters long" });
    }

    const searchResults = await prisma.$queryRaw`
      SELECT 
        t.id,
        t.title,
        t.is_completed as "isCompleted",
        t.priority,
        t.created_at as "createdAt",
        u.id as "userId",
        u.name as "user_name"
      FROM tasks t
      JOIN users u ON t.user_id = u.id
      WHERE t.title ILIKE ${`%${searchQuery}%`} OR u.name ILIKE ${`%${searchQuery}%`}
      ORDER BY 
        CASE 
          WHEN t.title ILIKE ${searchQuery} THEN 1
          WHEN t.title ILIKE ${`${searchQuery}%`} THEN 2
          WHEN t.title ILIKE ${`%${searchQuery}%`} THEN 3
          ELSE 4
        END,
        t.created_at DESC
      LIMIT ${parseInt(limit)}
    `;

    res.status(200).json({
      results: searchResults,
      query: searchQuery,
      count: searchResults.length
    });
  } catch (err) {
    console.error('Task search error:', err);
    res.status(500).json({ error: err.message });
  }
};
