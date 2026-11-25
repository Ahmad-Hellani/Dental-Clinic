import { asyncHandler } from "../../shared/async-handler";
import { statsService } from "./stats.service";

export const overview = asyncHandler(async (_req, res) => {
  res.json({ data: await statsService.overview() });
});
