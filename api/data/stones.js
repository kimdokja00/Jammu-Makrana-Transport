/**
 * Stone range catalogue.
 *
 * Images are referenced by path only; the client prefixes the asset base URL
 * (see client/src/lib/assets.js — those images still point at the previous
 * site and must be replaced with your own photography before launch).
 */
export const stones = [
  {
    name: 'Marble',
    slug: 'marble-manufacturer-in-india',
    tagline: 'Komal Minerals Supplier',
    category: 'Marble',
    image: 'products/Marble.jpg',
    origin: 'Rajasthan, India',
    order: 1,
    featured: true,
    description:
      'Our marble is quarried from the finest belts of Rajasthan and finished to a mirror polish. Each block is graded for vein consistency, so every slab carries the same depth of character across your project.',
    finishes: ['Polished', 'Honed', 'Sandblasted', 'Brushed'],
    applications: ['Flooring', 'Cladding', 'Countertops', 'Staircases'],
  },
  {
    name: 'North Granite',
    slug: 'north-granite-manufacturer-in-india',
    tagline: 'Komal Minerals Supplier',
    category: 'Granite',
    image: 'products/North Granite.jpg',
    origin: 'North India',
    order: 2,
    featured: true,
    description:
      'Hard, dense and remarkably uniform in tone, North Indian granite is the dependable choice for high-traffic surfaces. We cut, calibrate and finish to the thickness your specification calls for.',
    finishes: ['Polished', 'Flamed', 'Leather', 'Lappato'],
    applications: ['Kitchen tops', 'Flooring', 'Facades', 'Monuments'],
  },
  {
    name: 'South Granite',
    slug: 'south-granite-manufacturer-in-india',
    tagline: 'Komal Minerals Supplier',
    category: 'Granite',
    image: 'products/South Granite.jpg',
    origin: 'South India',
    order: 3,
    featured: true,
    description:
      'South Indian granite brings movement and colour to a surface, from deep charcoals to warm cinnamon tones. It takes an exceptional polish and holds its edge detail beautifully.',
    finishes: ['Polished', 'Honed', 'Shot blasted', 'Bush hammered'],
    applications: ['Flooring', 'Vanity tops', 'Steps', 'Exterior paving'],
  },
  {
    name: 'Sandstone',
    slug: 'sandstone-manufacturer-in-india',
    tagline: 'Komal Minerals Supplier',
    category: 'Sandstone',
    image: 'products/Sandstone.jpg',
    origin: 'Rajasthan, India',
    order: 4,
    featured: true,
    description:
      'Warm, tactile and naturally split, sandstone is the material of courtyards and colonnades. We supply paving, cladding and carved elements in matched batches for large elevations.',
    finishes: ['Natural split', 'Honed', 'Sandblasted', 'Rough'],
    applications: ['Paving', 'Wall cladding', 'Jali screens', 'Landscaping'],
  },
  {
    name: 'Limestone',
    slug: 'limestone-manufacturer-in-india',
    tagline: 'Komal Minerals Supplier',
    category: 'Limestone',
    image: 'products/Limestone.jpg',
    origin: 'Rajasthan, India',
    order: 5,
    featured: true,
    description:
      'Limestone offers a quiet, even surface with subtle fossil detail. It is a favourite for expansive flooring where consistency matters more than drama.',
    finishes: ['Honed', 'Polished', 'Tumbled', 'Brushed'],
    applications: ['Flooring', 'Cladding', 'Coping', 'Pool surrounds'],
  },
  {
    name: 'Slatestone',
    slug: 'slatestone-manufacturer-in-india',
    tagline: 'Komal Minerals Supplier',
    category: 'Slate',
    image: 'products/Slatestone.jpg',
    origin: 'Rajasthan, India',
    order: 6,
    featured: true,
    description:
      'Slate splits into crisp, thin sheets that age gracefully. Its riven face and earthy palette make it ideal for roofs, feature walls and hard-wearing floors.',
    finishes: ['Natural cleft', 'Honed', 'Polished', 'Brushed'],
    applications: ['Roofing', 'Feature walls', 'Flooring', 'Paving'],
  },
  {
    name: 'Granite',
    slug: 'granite-manufacturer-in-india',
    tagline: 'Komal Minerals Supplier',
    category: 'Granite',
    image: 'products/Granite.jpg',
    origin: 'India',
    order: 7,
    featured: false,
    description:
      'Across our full granite programme we stock slabs, tiles, steps and kerbs in a wide spread of colours and grain structures, all processed in-house for matched lots.',
    finishes: ['Polished', 'Flamed', 'Honed', 'Leather'],
    applications: ['Flooring', 'Countertops', 'Paving', 'Cladding'],
  },
  {
    name: 'Cobblestone',
    slug: 'cobblestone-manufacturer-in-india',
    tagline: 'Komal Minerals Supplier',
    category: 'Stone Products',
    image: 'products/cobblestone.jpg',
    origin: 'Rajasthan, India',
    order: 8,
    featured: false,
    description:
      'Hand-finished cobblestones and setts in granite, sandstone and basalt. Tumbled or riven, they bring a settled, pedestrian-scale texture to drives, plazas and garden walks.',
    finishes: ['Tumbled', 'Natural', 'Split face'],
    applications: ['Driveways', 'Plazas', 'Garden paths', 'Edging'],
  },
  {
    name: 'Sukabumi Stone',
    slug: 'sukabumi-stone-manufacturer-in-india',
    tagline: 'Komal Minerals Supplier',
    category: 'Speciality',
    image: 'products/Sukabumi Stone.jpg',
    origin: 'Indonesia',
    order: 9,
    featured: false,
    description:
      'Sukabumi is a green-grey zeolite-rich stone that stays cool underfoot and resists algae growth. It has become the standard finish for pool decks and spa surrounds.',
    finishes: ['Natural', 'Honed', 'Brushed'],
    applications: ['Pool decks', 'Spa surrounds', 'Wet areas', 'Bathrooms'],
  },
  {
    name: 'Black Lava Stone',
    slug: 'black-lava-stone-manufacturer-in-india',
    tagline: 'Komal Minerals Supplier',
    category: 'Speciality',
    image: 'products/Black Lava Stone.jpg',
    origin: 'Indonesia',
    order: 10,
    featured: false,
    description:
      'Volcanic lava stone is deeply textured, non-slip and thermally stable. Rendered in a matte black, it reads as modern and wears exceptionally well outdoors.',
    finishes: ['Natural', 'Honed', 'Sandblasted'],
    applications: ['Pool surrounds', 'Facades', 'Paving', 'Water features'],
  },
];

export default stones;
