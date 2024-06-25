import { ApiError } from "./apiError.js";

const today = new Date();
const calculateCompleteOrderTotal = async (
  model: any,
  firstDate: Date = today,
  lastDate: Date = today
): Promise<number> => {
  try {
    const result = await model.aggregate([
      {
        $match: {
          $and: [
            { status: "Delivered" },
            {
              createdAt: {
                $gte: firstDate,
                $lte: lastDate,
              },
            },
          ],
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$total" },
        },
      },
    ]);

    // const total: number =
    return result.length > 0 ? result[0].total : 0;
  } catch (error) {
    throw new ApiError(500, "Error calculating total");
  }
};

const getTotalOrderCountByStatus = async (
  model: any,
  fieldName: string = "status",
  startDate: Date = today,
  endDate: Date = today
): Promise<{ [index: string]: number }[]> => {
  try {
    const result = await model.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $group: {
          _id: `$${fieldName}`,
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: null,
          counts: {
            $push: {
              status: "$_id",
              count: "$count",
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          counts: {
            $arrayToObject: {
              $map: {
                input: "$counts",
                as: "statusCount",
                in: {
                  k: "$$statusCount.status",
                  v: "$$statusCount.count",
                },
              },
            },
          },
        },
      },
    ]);

    // Default values for all statuses
    // const totalCount = {
    //   Processing: 0,
    //   Dispatched: 0,
    //   Cancelled: 0,
    //   Delivered: 0,
    // };

    // if (result.length > 0) {
    //   Object.assign(totalCount, result[0].counts);
    // }

    return result[0].counts;
  } catch (error) {
    throw new ApiError(500, "Error getting total order count by status:");
  }
};

export { calculateCompleteOrderTotal, getTotalOrderCountByStatus };
