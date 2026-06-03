export interface Garage {
  id: string;
  name: string;
  address: string;
  rating: number;
  reviewCount: number;
  services: string[];
  distance: string;
  phone: string;
  verified: boolean;
  image: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface SparePart {
  id: string;
  name: string;
  price: number;
  seller: string;
  location: string;
  condition: "New" | "Used";
  carModel: string;
  image: string;
  rating: number;
  distance?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export const garages: Garage[] = [
  {
    id: "1",
    name: "Abyssinia Auto Care",
    address: "Bole Road, Addis Ababa",
    rating: 4.8,
    reviewCount: 124,
    services: ["Engine Repair", "Oil Change", "Tire Service"],
    distance: "1.2 km",
    phone: "+251 91 234 5678",
    verified: true,
    image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&h=300&fit=crop",
    latitude: 9.0054,
    longitude: 38.7636,
  },
  {
    id: "2",
    name: "Merkato Garage Center",
    address: "Merkato, Addis Ababa",
    rating: 4.5,
    reviewCount: 89,
    services: ["Body Work", "Painting", "Electrical"],
    distance: "2.8 km",
    phone: "+251 91 345 6789",
    verified: true,
    image: "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=400&h=300&fit=crop",
    latitude: 9.0300,
    longitude: 38.7400,
  },
  {
    id: "3",
    name: "Piassa Motor Works",
    address: "Piassa, Addis Ababa",
    rating: 4.3,
    reviewCount: 56,
    services: ["Transmission", "Brake Service", "Diagnostics"],
    distance: "3.5 km",
    phone: "+251 91 456 7890",
    verified: false,
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=300&fit=crop",
    latitude: 9.0350,
    longitude: 38.7480,
  },
  {
    id: "4",
    name: "CMC Auto Repair",
    address: "CMC Area, Addis Ababa",
    rating: 4.7,
    reviewCount: 203,
    services: ["Full Service", "AC Repair", "Suspension"],
    distance: "4.1 km",
    phone: "+251 91 567 8901",
    verified: true,
    image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=300&fit=crop",
    latitude: 9.0450,
    longitude: 38.8100,
  },
  {
    id: "5",
    name: "Gerji Express Garage",
    address: "Gerji, Addis Ababa",
    rating: 4.1,
    reviewCount: 42,
    services: ["Quick Fix", "Battery Service", "Towing"],
    distance: "5.0 km",
    phone: "+251 91 678 9012",
    verified: true,
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=300&fit=crop",
    latitude: 9.0100,
    longitude: 38.8000,
  },
  {
    id: "6",
    name: "Summit Auto Solutions",
    address: "Summit Area, Addis Ababa",
    rating: 4.6,
    reviewCount: 167,
    services: ["Engine Overhaul", "Clutch Repair", "Exhaust"],
    distance: "6.3 km",
    phone: "+251 91 789 0123",
    verified: true,
    image: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400&h=300&fit=crop",
    latitude: 9.0200,
    longitude: 38.7200,
  },
];

export const spareParts: SparePart[] = [
  {
    id: "1",
    name: "Front Brake Pads Set",
    price: 2500,
    seller: "Addis Auto Parts",
    location: "Merkato, Addis Ababa",
    condition: "New",
    carModel: "Toyota Corolla 2015-2020",
    image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&h=300&fit=crop",
    rating: 4.7,
  },
  {
    id: "2",
    name: "Air Filter - Universal",
    price: 450,
    seller: "Bole Spare Parts",
    location: "Bole, Addis Ababa",
    condition: "New",
    carModel: "Universal Fit",
    image: "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=400&h=300&fit=crop",
    rating: 4.3,
  },
  {
    id: "3",
    name: "Alternator - Reconditioned",
    price: 5800,
    seller: "Piassa Motors Supply",
    location: "Piassa, Addis Ababa",
    condition: "Used",
    carModel: "Hyundai Tucson 2016-2021",
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=300&fit=crop",
    rating: 4.0,
  },
  {
    id: "4",
    name: "Side Mirror - Left",
    price: 1800,
    seller: "CMC Auto Supplies",
    location: "CMC, Addis Ababa",
    condition: "New",
    carModel: "Toyota Vitz 2012-2018",
    image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=300&fit=crop",
    rating: 4.5,
  },
  {
    id: "5",
    name: "Starter Motor",
    price: 7200,
    seller: "Gerji Parts Hub",
    location: "Gerji, Addis Ababa",
    condition: "New",
    carModel: "Suzuki Swift 2010-2017",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=300&fit=crop",
    rating: 4.8,
  },
  {
    id: "6",
    name: "Headlight Assembly - Right",
    price: 3400,
    seller: "Summit Spare Parts",
    location: "Summit, Addis Ababa",
    condition: "New",
    carModel: "Toyota Yaris 2014-2020",
    image: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400&h=300&fit=crop",
    rating: 4.2,
  },
];
