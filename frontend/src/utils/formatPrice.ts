/**
 * Format price to remove unnecessary decimal places
 * @param price - The price to format
 * @returns Formatted price string without .00 for whole numbers
 */
export const formatPrice = (price: number | string): string => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price
  
  // Check if the number is a whole number
  if (Number.isInteger(numPrice)) {
    return numPrice.toString()
  }
  
  // Otherwise, format with 2 decimal places
  return numPrice.toFixed(2)
}
