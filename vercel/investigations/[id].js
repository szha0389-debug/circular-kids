import { vercelHandler } from "../_adapter.js";

export default vercelHandler(req => `/api/investigations/${req.query.id}`);
