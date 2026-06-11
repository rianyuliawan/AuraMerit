export const ROLE_LABELS = {
  bkd: "Operator BKD",
  evaluator: "Evaluator",
  public: "Publik",
};

export function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
