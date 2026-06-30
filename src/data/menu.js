export const MENU = [
  { id: 1,  cat: 'Starters',      name: 'Paneer Tikka',         desc: 'Cottage cheese marinated in spices, grilled to perfection', price: 180, pprice: 18, emoji: '🧀', veg: true,  popular: true  },
  { id: 2,  cat: 'Starters',      name: 'Chicken 65',           desc: 'Crispy spiced chicken, South Indian style',                 price: 220, pprice: 22, emoji: '🍗', veg: false, popular: true  },
  { id: 3,  cat: 'Starters',      name: 'Veg Spring Rolls',     desc: 'Crispy rolls stuffed with veggies & noodles',               price: 150, pprice: 15, emoji: '🥢', veg: true,  popular: false },
  { id: 4,  cat: 'Main Course',   name: 'Butter Chicken',       desc: 'Creamy tomato-based chicken gravy',                         price: 320, pprice: 32, emoji: '🍛', veg: false, popular: true  },
  { id: 5,  cat: 'Main Course',   name: 'Dal Makhani',          desc: 'Slow-cooked black lentils in butter & cream',               price: 250, pprice: 25, emoji: '🫘', veg: true,  popular: false },
  { id: 6,  cat: 'Main Course',   name: 'Mutton Rogan Josh',    desc: 'Aromatic Kashmiri lamb curry',                              price: 380, pprice: 38, emoji: '🥩', veg: false, popular: false },
  { id: 7,  cat: 'Main Course',   name: 'Paneer Butter Masala', desc: 'Rich creamy paneer in tomato gravy',                        price: 290, pprice: 29, emoji: '🧀', veg: true,  popular: false },
  { id: 8,  cat: 'Rice & Breads', name: 'Biryani (Veg)',        desc: 'Fragrant basmati rice with veggies & whole spices',         price: 200, pprice: 20, emoji: '🍚', veg: true,  popular: false },
  { id: 9,  cat: 'Rice & Breads', name: 'Chicken Biryani',      desc: 'Dum-cooked aromatic rice with tender chicken',              price: 280, pprice: 28, emoji: '🍚', veg: false, popular: true  },
  { id: 10, cat: 'Rice & Breads', name: 'Garlic Naan',          desc: 'Soft naan with garlic butter, from tandoor',                price: 60,  pprice: 6,  emoji: '🫓', veg: true,  popular: false },
  { id: 11, cat: 'Rice & Breads', name: 'Jeera Rice',           desc: 'Steamed basmati with cumin tempering',                      price: 120, pprice: 12, emoji: '🍚', veg: true,  popular: false },
  { id: 12, cat: 'Desserts',      name: 'Gulab Jamun (6 pcs)',  desc: 'Soft milk-solid balls in rose sugar syrup',                 price: 120, pprice: 12, emoji: '🟤', veg: true,  popular: false },
  { id: 13, cat: 'Desserts',      name: 'Kheer',                desc: 'Creamy rice pudding with cardamom & nuts',                  price: 150, pprice: 15, emoji: '🍮', veg: true,  popular: false },
  { id: 14, cat: 'Drinks',        name: 'Mango Lassi',          desc: 'Chilled yogurt drink with fresh mango',                     price: 80,  pprice: 8,  emoji: '🥭', veg: true,  popular: false },
  { id: 15, cat: 'Drinks',        name: 'Masala Chai (10 cups)', desc: 'Spiced ginger-cardamom tea',                               price: 150, pprice: 15, emoji: '☕', veg: true,  popular: false },
];

export const CATEGORIES = ['All', ...new Set(MENU.map((i) => i.cat))];
