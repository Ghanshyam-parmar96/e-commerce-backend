import { ApiError } from "./apiError.js";

const today = new Date();

const twelveMonthAgo = new Date(today.getFullYear(), today.getMonth() - 11, 1);

const tenDaysAgo = new Date(today);
tenDaysAgo.setDate(today.getDate() - 10);

const getDataByFirstAndLastMonthWise = async (
  model: any,
  condition: any
): Promise<
  {
    count: number;
    year: number;
    month: number;
  }[]
> => {
  try {
    const result = await model.aggregate([
      {
        $match: condition,
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
      {
        $project: {
          _id: 0,
          year: "$_id.year",
          month: "$_id.month",
          count: 1,
        },
      },
    ]);

    return result;
  } catch (error) {
    throw new ApiError(500, "Error getting user count by month:");
  }
};

const getDataByFirstAndLastDateWise = async (
  model: any
): Promise<{ count: number; date: number }[]> => {
  try {
    const result = await model.aggregate([
      {
        $match: {
          createdAt: {
            $gte: tenDaysAgo,
            $lte: today,
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
          "_id.day": 1,
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id.day",
          count: 1,
        },
      },
    ]);

    return result;
  } catch (error) {
    throw new ApiError(500, "Error getting user count by month");
  }
};

export { getDataByFirstAndLastMonthWise, getDataByFirstAndLastDateWise };
