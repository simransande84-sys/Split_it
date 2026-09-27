const currencySymbol = new Proxy(
  { INR: "₹" },
  { get: () => "₹" }
);

export default currencySymbol;

