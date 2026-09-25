/**
 * Common formatting helper utilities
 */

/**
 * Format number to Turkish Lira currency format
 * @param {number} amount
 * @returns {string} e.g. "3.499 ₺"
 */
export const formatCurrency = (amount) => {
  if (typeof amount !== "number") return "0 ₺";
  return `${amount.toLocaleString("tr-TR")} ₺`;
};

/**
 * Format ISO date string to Turkish local date
 * @param {string} dateString
 * @returns {string} e.g. "25 Eylül 2026"
 */
export const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

/**
 * Truncate text with ellipsis
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
export const truncateText = (text, maxLength = 80) => {
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};
