// ─────────────────────────────────────────────────────────────
// Court Check — Court Database
// Regions: Hoboken NJ · Weehawken NJ
// ─────────────────────────────────────────────────────────────

export const COURTS = [

  // ─── HOBOKEN, NJ ──────────────────────────────────────────
  {
    id: 1,
    name: "Church Square Park",
    address: "400 Garden St, Hoboken, NJ 07030",
    city: "Hoboken, NJ",
    neighborhood: "Downtown Hoboken",
    lat: 40.741951,
    lng: -74.031640,
    googleMapsUrl: "https://maps.google.com/?q=40.741951,-74.031640",
    indoor: false,
    courts: 3,
    hoops: 6,
    lights: true,
    surface: "Asphalt",
    rating: 4.5,
    checkedIn: 0,
    maxPlayers: 20,
    needPlayers: false,
    runs: "Full Court",
    level: "Competitive",
    hours: null,
    fee: null,
    tags: ["Full Court", "Lights", "Competitive", "Renovated"],
  },
  {
    id: 4,
    name: "Columbus Park",
    address: "900 Clinton St, Hoboken, NJ 07030",
    city: "Hoboken, NJ",
    neighborhood: "South Hoboken",
    lat: 40.7493,
    lng: -74.0338,
    googleMapsUrl: "https://maps.google.com/?q=40.7493,-74.0338",
    indoor: false,
    courts: 1,
    hoops: 2,
    lights: true,
    surface: "Asphalt",
    rating: 3.9,
    checkedIn: 0,
    maxPlayers: 10,
    needPlayers: false,
    runs: "Full Court",
    level: "Casual",
    hours: null,
    fee: null,
    tags: ["Full Court", "Lights", "Casual"],
  },
  // ─── WEEHAWKEN, NJ ────────────────────────────────────────
  {
    id: 6,
    name: "Louisa Park",
    address: "915 JFK Blvd, Weehawken, NJ 07086",
    city: "Weehawken, NJ",
    neighborhood: "Weehawken",
    lat: 40.7635,
    lng: -74.0243,
    googleMapsUrl: "https://maps.google.com/?q=40.7635,-74.0243",
    indoor: false,
    courts: 2,
    hoops: 4,
    lights: true,
    surface: "Asphalt",
    rating: 3.8,
    checkedIn: 0,
    maxPlayers: 16,
    needPlayers: false,
    runs: "Full Court",
    level: "Casual",
    hours: null,
    fee: null,
    tags: ["Full Court", "Lights", "Casual"],
  },
];

export const getCourtStatus = (court) => {
  const ratio = court.checkedIn / court.maxPlayers;
  if (ratio === 0) return { label: "Empty", color: "#555", bg: "rgba(85,85,85,0.15)" };
  if (ratio < 0.4) return { label: "Light", color: "#22c55e", bg: "rgba(34,197,94,0.15)" };
  if (ratio < 0.75) return { label: "Active", color: "#eab308", bg: "rgba(234,179,8,0.15)" };
  return { label: "Packed", color: "#ef4444", bg: "rgba(239,68,68,0.15)" };
};
