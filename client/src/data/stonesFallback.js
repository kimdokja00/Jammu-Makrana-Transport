/**
 * Client-side mirror of `api/data/stones.js`.
 *
 * Used only when /api/stones cannot be reached (e.g. the Express function has
 * not been wired to MongoDB yet), so the Stone Range page always renders.
 * Keep it in sync with the API seed data.
 */
export const stones = [
  { name: 'Marble', slug: 'marble-manufacturer-in-india', tagline: 'Komal Minerals Supplier', category: 'Marble', image: 'products/Marble.jpg', origin: 'Rajasthan, India', order: 1, featured: true },
  { name: 'North Granite', slug: 'north-granite-manufacturer-in-india', tagline: 'Komal Minerals Supplier', category: 'Granite', image: 'products/North Granite.jpg', origin: 'North India', order: 2, featured: true },
  { name: 'South Granite', slug: 'south-granite-manufacturer-in-india', tagline: 'Komal Minerals Supplier', category: 'Granite', image: 'products/South Granite.jpg', origin: 'South India', order: 3, featured: true },
  { name: 'Sandstone', slug: 'sandstone-manufacturer-in-india', tagline: 'Komal Minerals Supplier', category: 'Sandstone', image: 'products/Sandstone.jpg', origin: 'Rajasthan, India', order: 4, featured: true },
  { name: 'Limestone', slug: 'limestone-manufacturer-in-india', tagline: 'Komal Minerals Supplier', category: 'Limestone', image: 'products/Limestone.jpg', origin: 'Rajasthan, India', order: 5, featured: true },
  { name: 'Slatestone', slug: 'slatestone-manufacturer-in-india', tagline: 'Komal Minerals Supplier', category: 'Slate', image: 'products/Slatestone.jpg', origin: 'Rajasthan, India', order: 6, featured: true },
  { name: 'Granite', slug: 'granite-manufacturer-in-india', tagline: 'Komal Minerals Supplier', category: 'Granite', image: 'products/Granite.jpg', origin: 'India', order: 7, featured: false },
  { name: 'Cobblestone', slug: 'cobblestone-manufacturer-in-india', tagline: 'Komal Minerals Supplier', category: 'Stone Products', image: 'products/cobblestone.jpg', origin: 'Rajasthan, India', order: 8, featured: false },
  { name: 'Sukabumi Stone', slug: 'sukabumi-stone-manufacturer-in-india', tagline: 'Komal Minerals Supplier', category: 'Speciality', image: 'products/Sukabumi Stone.jpg', origin: 'Indonesia', order: 9, featured: false },
  { name: 'Black Lava Stone', slug: 'black-lava-stone-manufacturer-in-india', tagline: 'Komal Minerals Supplier', category: 'Speciality', image: 'products/Black Lava Stone.jpg', origin: 'Indonesia', order: 10, featured: false },
];

export default stones;
