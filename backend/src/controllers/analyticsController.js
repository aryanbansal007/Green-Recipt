import mongoose from "mongoose";
import Receipt from "../models/Receipt.js";

// Helper to get date ranges
const getDateRanges = () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfLastWeek = new Date(startOfWeek);
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
  const endOfLastWeek = new Date(startOfWeek);
  endOfLastWeek.setMilliseconds(-1);
  
  return {
    now,
    startOfMonth,
    startOfLastMonth,
    endOfLastMonth,
    startOfYear,
    startOfWeek,
    startOfLastWeek,
    endOfLastWeek,
  };
};

export const getCustomerAnalytics = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const { startOfMonth, startOfLastMonth, endOfLastMonth, startOfYear, startOfWeek, startOfLastWeek, endOfLastWeek, now } = getDateRanges();

    const baseMatch = { 
      userId, 
      $or: [{ excludeFromStats: { $exists: false } }, { excludeFromStats: false }] 
    };

    // Run all aggregations in parallel for performance
    const [
      totalAll,
      thisMonth,
      lastMonth,
      thisWeek,
      lastWeek,
      thisYear,
      categoryBreakdown,
      paymentMethodBreakdown,
      merchantBreakdown,
      dailySpending,
      monthlyTrend,
      recentReceipts,
      topItems,
    ] = await Promise.all([
      // Total all time
      Receipt.aggregate([
        { $match: baseMatch },
        { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
      ]),

      // This month
      Receipt.aggregate([
        { $match: { ...baseMatch, transactionDate: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
      ]),

      // Last month
      Receipt.aggregate([
        { $match: { ...baseMatch, transactionDate: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
        { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
      ]),

      // This week
      Receipt.aggregate([
        { $match: { ...baseMatch, transactionDate: { $gte: startOfWeek } } },
        { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
      ]),

      // Last week
      Receipt.aggregate([
        { $match: { ...baseMatch, transactionDate: { $gte: startOfLastWeek, $lte: endOfLastWeek } } },
        { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
      ]),

      // This year
      Receipt.aggregate([
        { $match: { ...baseMatch, transactionDate: { $gte: startOfYear } } },
        { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
      ]),

      // Category breakdown (this month)
      Receipt.aggregate([
        { $match: { ...baseMatch, transactionDate: { $gte: startOfMonth } } },
        {
          $group: {
            _id: "$category",
            totalSpent: { $sum: "$total" },
            count: { $sum: 1 },
            avgTransaction: { $avg: "$total" },
          },
        },
        { $sort: { totalSpent: -1 } },
        { $limit: 10 },
      ]),

      // Payment method breakdown
      Receipt.aggregate([
        { $match: { ...baseMatch, transactionDate: { $gte: startOfMonth } } },
        {
          $group: {
            _id: "$paymentMethod",
            total: { $sum: "$total" },
            count: { $sum: 1 },
          },
        },
        { $sort: { total: -1 } },
      ]),

      // Top merchants (this month)
      Receipt.aggregate([
        { $match: { ...baseMatch, transactionDate: { $gte: startOfMonth } } },
        {
          $group: {
            _id: "$merchantSnapshot.shopName",
            totalSpent: { $sum: "$total" },
            count: { $sum: 1 },
            lastVisit: { $max: "$transactionDate" },
          },
        },
        { $sort: { totalSpent: -1 } },
        { $limit: 5 },
      ]),

      // Daily spending (last 30 days)
      Receipt.aggregate([
        { 
          $match: { 
            ...baseMatch, 
            transactionDate: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } 
          } 
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$transactionDate" } },
            total: { $sum: "$total" },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Monthly trend (last 6 months)
      Receipt.aggregate([
        { 
          $match: { 
            ...baseMatch, 
            transactionDate: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) } 
          } 
        },
        {
          $group: {
            _id: { 
              year: { $year: "$transactionDate" }, 
              month: { $month: "$transactionDate" } 
            },
            total: { $sum: "$total" },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),

      // Recent receipts for activity feed
      Receipt.find(baseMatch)
        .sort({ transactionDate: -1 })
        .limit(5)
        .select("merchantSnapshot.shopName total transactionDate category paymentMethod")
        .lean(),

      // Top items across all receipts (this month)
      Receipt.aggregate([
        { $match: { ...baseMatch, transactionDate: { $gte: startOfMonth } } },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.name",
            totalSpent: { $sum: { $multiply: ["$items.unitPrice", "$items.quantity"] } },
            totalQuantity: { $sum: "$items.quantity" },
            avgPrice: { $avg: "$items.unitPrice" },
          },
        },
        { $sort: { totalSpent: -1 } },
        { $limit: 10 },
      ]),
    ]);

    // Calculate derived metrics
    const thisMonthTotal = thisMonth[0]?.total || 0;
    const lastMonthTotal = lastMonth[0]?.total || 0;
    const thisWeekTotal = thisWeek[0]?.total || 0;
    const lastWeekTotal = lastWeek[0]?.total || 0;
    const daysInMonth = now.getDate();
    const avgPerDay = daysInMonth > 0 ? Math.round(thisMonthTotal / daysInMonth) : 0;
    
    // Percentage changes
    const monthOverMonthChange = lastMonthTotal > 0 
      ? Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100) 
      : 0;
    const weekOverWeekChange = lastWeekTotal > 0 
      ? Math.round(((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100) 
      : 0;

    // Budget insights (simple heuristic)
    const projectedMonthEnd = avgPerDay * new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    res.json({
      // Summary stats
      summary: {
        totalAllTime: totalAll[0]?.total || 0,
        totalReceiptsAllTime: totalAll[0]?.count || 0,
        thisMonth: {
          total: thisMonthTotal,
          count: thisMonth[0]?.count || 0,
          avgPerDay,
          projectedTotal: projectedMonthEnd,
        },
        lastMonth: {
          total: lastMonthTotal,
          count: lastMonth[0]?.count || 0,
        },
        thisWeek: {
          total: thisWeekTotal,
          count: thisWeek[0]?.count || 0,
        },
        lastWeek: {
          total: lastWeekTotal,
          count: lastWeek[0]?.count || 0,
        },
        thisYear: {
          total: thisYear[0]?.total || 0,
          count: thisYear[0]?.count || 0,
        },
        changes: {
          monthOverMonth: monthOverMonthChange,
          weekOverWeek: weekOverWeekChange,
        },
      },

      // Category breakdown
      categories: categoryBreakdown.map((c) => ({
        category: c._id || "Uncategorized",
        totalSpent: c.totalSpent,
        count: c.count,
        avgTransaction: Math.round(c.avgTransaction || 0),
        percentage: thisMonthTotal > 0 ? Math.round((c.totalSpent / thisMonthTotal) * 100) : 0,
      })),

      // Payment methods
      paymentMethods: paymentMethodBreakdown.map((p) => ({
        method: p._id || "other",
        total: p.total,
        count: p.count,
        percentage: thisMonthTotal > 0 ? Math.round((p.total / thisMonthTotal) * 100) : 0,
      })),

      // Top merchants
      topMerchants: merchantBreakdown.map((m) => ({
        name: m._id || "Unknown",
        totalSpent: m.totalSpent,
        visits: m.count,
        lastVisit: m.lastVisit,
      })),

      // Spending trends
      trends: {
        daily: dailySpending.map((d) => ({
          date: d._id,
          total: d.total,
          count: d.count,
        })),
        monthly: monthlyTrend.map((m) => ({
          year: m._id.year,
          month: m._id.month,
          total: m.total,
          count: m.count,
        })),
      },

      // Recent activity
      recentActivity: recentReceipts.map((r) => ({
        merchant: r.merchantSnapshot?.shopName || "Unknown",
        amount: r.total,
        date: r.transactionDate,
        category: r.category,
        paymentMethod: r.paymentMethod,
      })),

      // Top items
      topItems: topItems.map((item) => ({
        name: item._id || "Unknown",
        totalSpent: Math.round(item.totalSpent),
        quantity: item.totalQuantity,
        avgPrice: Math.round(item.avgPrice || 0),
      })),

      // Insights metadata
      meta: {
        generatedAt: new Date().toISOString(),
        periodStart: startOfMonth.toISOString(),
        periodEnd: now.toISOString(),
      },
    });
  } catch (error) {
    console.error("getCustomerAnalytics error", error);
    res.status(500).json({ message: "Failed to load analytics" });
  }
};

export const getMerchantAnalytics = async (req, res) => {
  try {
    const merchantId = new mongoose.Types.ObjectId(req.user.id);
    const { startOfMonth, startOfLastMonth, endOfLastMonth, startOfYear, now } = getDateRanges();

    const baseMatch = { 
      merchantId, 
      $or: [{ excludeFromStats: { $exists: false } }, { excludeFromStats: false }] 
    };

    const [
      totalAll,
      thisMonth,
      lastMonth,
      thisYear,
      categoryBreakdown,
      paymentMethodBreakdown,
      dailySales,
      topCustomers,
      topItems,
    ] = await Promise.all([
      // Total all time
      Receipt.aggregate([
        { $match: baseMatch },
        { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
      ]),

      // This month
      Receipt.aggregate([
        { $match: { ...baseMatch, transactionDate: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
      ]),

      // Last month
      Receipt.aggregate([
        { $match: { ...baseMatch, transactionDate: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
        { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
      ]),

      // This year
      Receipt.aggregate([
        { $match: { ...baseMatch, transactionDate: { $gte: startOfYear } } },
        { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
      ]),

      // Category breakdown
      Receipt.aggregate([
        { $match: { ...baseMatch, transactionDate: { $gte: startOfMonth } } },
        {
          $group: {
            _id: "$category",
            totalSales: { $sum: "$total" },
            receipts: { $sum: 1 },
          },
        },
        { $sort: { totalSales: -1 } },
      ]),

      // Payment methods
      Receipt.aggregate([
        { $match: { ...baseMatch, transactionDate: { $gte: startOfMonth } } },
        {
          $group: {
            _id: "$paymentMethod",
            total: { $sum: "$total" },
            count: { $sum: 1 },
          },
        },
        { $sort: { total: -1 } },
      ]),

      // Daily sales (last 30 days)
      Receipt.aggregate([
        { 
          $match: { 
            ...baseMatch, 
            transactionDate: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } 
          } 
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$transactionDate" } },
            total: { $sum: "$total" },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Top customers
      Receipt.aggregate([
        { $match: { ...baseMatch, userId: { $exists: true, $ne: null } } },
        {
          $group: {
            _id: "$userId",
            totalSpent: { $sum: "$total" },
            visits: { $sum: 1 },
            customerName: { $first: "$customerSnapshot.name" },
          },
        },
        { $sort: { totalSpent: -1 } },
        { $limit: 5 },
      ]),

      // Top selling items
      Receipt.aggregate([
        { $match: { ...baseMatch, transactionDate: { $gte: startOfMonth } } },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.name",
            totalRevenue: { $sum: { $multiply: ["$items.unitPrice", "$items.quantity"] } },
            totalQuantity: { $sum: "$items.quantity" },
          },
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: 10 },
      ]),
    ]);

    const thisMonthTotal = thisMonth[0]?.total || 0;
    const lastMonthTotal = lastMonth[0]?.total || 0;
    const monthOverMonthChange = lastMonthTotal > 0 
      ? Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100) 
      : 0;

    res.json({
      summary: {
        totalAllTime: totalAll[0]?.total || 0,
        totalReceiptsAllTime: totalAll[0]?.count || 0,
        thisMonth: {
          total: thisMonthTotal,
          count: thisMonth[0]?.count || 0,
        },
        lastMonth: {
          total: lastMonthTotal,
          count: lastMonth[0]?.count || 0,
        },
        thisYear: {
          total: thisYear[0]?.total || 0,
          count: thisYear[0]?.count || 0,
        },
        changes: {
          monthOverMonth: monthOverMonthChange,
        },
      },
      categories: categoryBreakdown.map((b) => ({
        category: b._id || "Uncategorized",
        totalSales: b.totalSales,
        receipts: b.receipts,
      })),
      paymentMethods: paymentMethodBreakdown.map((p) => ({
        method: p._id || "other",
        total: p.total,
        count: p.count,
      })),
      dailySales: dailySales.map((d) => ({
        date: d._id,
        total: d.total,
        count: d.count,
      })),
      topCustomers: topCustomers.map((c) => ({
        name: c.customerName || "Anonymous",
        totalSpent: c.totalSpent,
        visits: c.visits,
      })),
      topItems: topItems.map((item) => ({
        name: item._id || "Unknown",
        totalRevenue: Math.round(item.totalRevenue),
        quantity: item.totalQuantity,
      })),
      meta: {
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("getMerchantAnalytics error", error);
    res.status(500).json({ message: "Failed to load analytics" });
  }
};
