const currencySymbol = new Proxy(
  { INR: "₹" },
  { get: () => "₹" }
);

module.exports = currencySymbol;