// Test the parseFoodCost logic
function parseFoodCost(priceStr, fallback = 400) {
  if (!priceStr) return fallback;
  const numbers = priceStr.replace(/,/g, '').match(/\d+/g);
  if (!numbers || numbers.length === 0) return fallback;
  const nums = numbers.map(Number);
  if (nums.length >= 2) return nums[0];
  return nums[0];
}

const testPrices = [
  "₹200–1,200",
  "₹400–1,400", 
  "₹600–1,800",
  "₹200–600",
  null,
  undefined
];

testPrices.forEach(p => {
  console.log(`"${p}" → ₹${parseFoodCost(p)}`);
});

// With 2 activities (free + ₹150) + 2 meals (₹200 + ₹400) = ₹750 total — fits in ₹2000!
console.log("\nSample budget plan: Free park + ₹150 activity + ₹200 meal + ₹400 meal = ₹" + (0 + 150 + 200 + 400));
