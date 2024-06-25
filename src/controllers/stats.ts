import { Request } from "express";
import { myCache } from "../index.js";
import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  calculateCompleteOrderTotal,
  getTotalOrderCountByStatus,
} from "../utils/calculateTotal.js";
import {
  getDataByFirstAndLastMonthWise,
  getDataByFirstAndLastDateWise,
} from "../utils/getDataByFirstAndLastDate.js";

const calculatePercentage = (today: number, lastWeek: number) => {
  if (lastWeek === 0) return today * 100;
  return Math.round(((today - lastWeek) / lastWeek) * 100);
};

const calculateAverage = (num: number) => {
  return Math.round(num / 7);
};

const getDashboardStats = asyncHandler(async (req, res) => {
  let stats = {};

  if (myCache.has("admin-stats")) {
    stats = JSON.parse(myCache.get("admin-stats") as string);
  } else {
    const today = new Date();

    const tenDaysAgo = new Date(today);
    tenDaysAgo.setDate(today.getDate() - 10);

    const twelveMonthAgo = new Date(
      today.getFullYear(),
      today.getMonth() - 11,
      1
    );

    const lastWeek = {
      start: new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - 7
      ),
      end: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1),
    };

    const todayHours = {
      start: new Date(new Date().setHours(0, 0, 0, 0)),
      end: new Date(new Date().setHours(23, 59, 59, 999)),
    };

    const todayUsersPromise = User.countDocuments({
      createdAt: {
        $gte: todayHours.start,
        $lte: todayHours.end,
      },
    });

    const lastWeekUsersPromise = User.countDocuments({
      createdAt: {
        $gte: lastWeek.start,
        $lte: lastWeek.end,
      },
    });

    const todayOrdersPromise = Order.countDocuments({
      createdAt: {
        $gte: todayHours.start,
        $lte: todayHours.end,
      },
    });

    const lastWeekOrdersPromise = Order.countDocuments({
      createdAt: {
        $gte: lastWeek.start,
        $lte: lastWeek.end,
      },
    });

    const lastTwelveMonthsTotalOrdersPromise = getDataByFirstAndLastMonthWise(
      Order,
      {
        createdAt: {
          $gte: twelveMonthAgo,
          $lte: today,
        },
      }
    );

    const lastTwelveMonthsTotalCompleteOrdersPromise =
      getDataByFirstAndLastMonthWise(Order, {
        $and: [
          { status: "Delivered" },
          {
            createdAt: {
              $gte: twelveMonthAgo,
              $lte: today,
            },
          },
        ],
      });

    const [
      todayUsers,
      lastWeekUsers,
      todayOrders,
      lastWeekOrders,
      todayTotalRevenue,
      lastWeekTotalRevenue,
      lastTenDaysOrders,
      lastTenDaysOrdersStatus,
      lastTwelveMonthsTotalOrders,
      lastTwelveMonthsTotalCompleteOrders,
    ] = await Promise.all([
      todayUsersPromise,
      lastWeekUsersPromise,
      todayOrdersPromise,
      lastWeekOrdersPromise,
      calculateCompleteOrderTotal(Order, todayHours.start, todayHours.end),
      calculateCompleteOrderTotal(Order, lastWeek.start, lastWeek.end),
      getDataByFirstAndLastDateWise(Order),
      getTotalOrderCountByStatus(Order, "status", tenDaysAgo, today),
      lastTwelveMonthsTotalOrdersPromise,
      lastTwelveMonthsTotalCompleteOrdersPromise,
    ]);

    const percent = {
      revenue: calculatePercentage(
        todayTotalRevenue,
        calculateAverage(lastWeekTotalRevenue)
      ),
      userPercent: calculatePercentage(
        todayUsers,
        calculateAverage(lastWeekUsers)
      ),
      orderPercent: calculatePercentage(
        todayOrders,
        calculateAverage(lastWeekOrders)
      ),
    };

    const count = {
      totalRevenue: todayTotalRevenue,
      totalUsers: todayUsers,
      totalOrders: todayOrders,
    };

    const previous12MonthsAgo = new Date(
      today.getFullYear(),
      today.getMonth() - 11,
      1
    );

    const previous12MonthsNumber: number[] = new Array(12).fill(0).map((_) => {
      previous12MonthsAgo.setMonth(previous12MonthsAgo.getMonth() + 1);
      return previous12MonthsAgo.getMonth() || 12;
    });

    const orderMonthCounts = previous12MonthsNumber.map((el) => {
      const orderIndex = lastTwelveMonthsTotalOrders.find(
        (item) => item.month === el
      );
      return orderIndex?.count ?? 0;
    });

    const orderMonthRevenue = previous12MonthsNumber.map((el) => {
      const orderIndex = lastTwelveMonthsTotalCompleteOrders.find(
        (item) => item.month === el
      );
      return orderIndex?.count ?? 0;
    });

    const previous10daysAgo = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - 10
    );

    const previous10daysNumber = new Array(10).fill(0).map((_) => {
      previous10daysAgo.setDate(previous10daysAgo.getDate() + 1);
      return previous10daysAgo.getDate();
    });

    const lastTenDaysCompleteOrders = previous10daysNumber.map((el) => {
      const orderIndex = lastTenDaysOrders.find((item) => item.date === el);
      return orderIndex?.count ?? 0;
    });

    stats = {
      count,
      percent,
      lastTenDaysCompleteOrders,
      lastTenDaysOrdersStatus,
      lastTwelveMonthsTotalOrders: orderMonthCounts,
      lastTwelveMonthsTotalCompleteOrders: orderMonthRevenue,
    };

    myCache.set("admin-stats", JSON.stringify(stats));
  }

  res.status(200).json(new ApiResponse(200, stats, "Dashboard Stats"));
});

const pieChart = asyncHandler(
  async (
    req: Request<{}, {}, {}, { startDate?: string; endDate?: string }>,
    res
  ) => {
    let charts = {};
    if (myCache.has("pie-chart")) {
      charts = JSON.parse(myCache.get("pie-chart") as string);
    } else {
      const today = new Date();

      const { startDate: start, endDate: end } = req.query;

      const startDate = start
        ? new Date(start)
        : new Date(today.getFullYear(), today.getMonth(), 1);
      const endDate = end ? new Date(end) : today;

      const totalProductPromise = Product.countDocuments({
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      });

      const totalOutOfStockProductPromise = Product.countDocuments({
        $and: [
          {
            stock: 0,
          },
          {
            createdAt: {
              $gte: startDate,
              $lte: endDate,
            },
          },
        ],
      });

      const teenUsersCountPromise = User.countDocuments({
        DOB: {
          $gt: new Date(
            today.getFullYear() - 20,
            today.getMonth(),
            today.getDate()
          ),
        },
      });

      const adultUsersCountPromise = User.countDocuments({
        DOB: {
          $gt: new Date(
            today.getFullYear() - 40,
            today.getMonth(),
            today.getDate()
          ),
          $lte: new Date(
            today.getFullYear() - 20,
            today.getMonth(),
            today.getDate()
          ),
        },
      });

      const oldUsersCountPromise = User.countDocuments({
        DOB: {
          $lte: new Date(
            today.getFullYear() - 40,
            today.getMonth(),
            today.getDate()
          ),
        },
      });

      const [
        orderFulfillment,
        productCategories,
        totalProduct,
        outOfStockProduct,
        adminCount,
        userCount,
        teenUsersCount,
        adultUsersCount,
        oldUsersCount,
      ] = await Promise.all([
        getTotalOrderCountByStatus(Order, "status", startDate, endDate),
        getTotalOrderCountByStatus(Product, "category", startDate, endDate),
        totalProductPromise,
        totalOutOfStockProductPromise,
        User.countDocuments({ role: "admin" }),
        User.countDocuments({ role: "user" }),
        teenUsersCountPromise,
        adultUsersCountPromise,
        oldUsersCountPromise,
      ]);

      const stockAvailability = {
        inStock: totalProduct - outOfStockProduct,
        outOfStock: outOfStockProduct,
      };

      const adminUserCount = {
        admin: adminCount,
        user: userCount,
      };

      const userAgeGroup = {
        teen: teenUsersCount,
        adult: adultUsersCount,
        old: oldUsersCount,
      };

      charts = {
        orderFulfillment,
        productCategories,
        stockAvailability,
        adminUserCount,
        userAgeGroup,
      };

      myCache.set("pie-chart", JSON.stringify(charts));
    }
    res.status(200).json(new ApiResponse(200, charts, "Pie Chart"));
  }
);

const lineChart = asyncHandler(async (req, res) => {
  let charts = {};
  if (myCache.has("line-chart")) {
    charts = JSON.parse(myCache.get("line-chart") as string);
  } else {
    const today = new Date();

    const twelveMonthAgo = new Date(
      today.getFullYear(),
      today.getMonth() - 11,
      1
    );

    const baseQuery = {
      createdAt: {
        $gte: twelveMonthAgo,
        $lte: today,
      },
    };

    const [order, product, user] = await Promise.all([
      getDataByFirstAndLastMonthWise(Order, baseQuery),
      getDataByFirstAndLastMonthWise(Product, baseQuery),
      getDataByFirstAndLastMonthWise(User, baseQuery),
    ]);

    const previous12MonthsAgo = new Date(
      today.getFullYear(),
      today.getMonth() - 11,
      1
    );

    const previous12MonthsNumber: number[] = new Array(12).fill(0).map((_) => {
      previous12MonthsAgo.setMonth(previous12MonthsAgo.getMonth() + 1);
      return previous12MonthsAgo.getMonth() || 12;
    });

    const orderMonthCounts = previous12MonthsNumber.map((el) => {
      const orderIndex = order.find((item) => item.month === el);
      return orderIndex?.count ?? 0;
    });

    const productMonthCounts = previous12MonthsNumber.map((el) => {
      const orderIndex = product.find((item) => item.month === el);
      return orderIndex?.count ?? 0;
    });

    const userMonthCounts = previous12MonthsNumber.map((el) => {
      const orderIndex = user.find((item) => item.month === el);
      return orderIndex?.count ?? 0;
    });

    charts = {
      orderMonthCounts,
      productMonthCounts,
      userMonthCounts,
    };

    myCache.set("line-chart", JSON.stringify(charts));
  }
  res.status(200).json(new ApiResponse(200, charts, "Bar Chart"));
});

export { getDashboardStats, pieChart, lineChart };
