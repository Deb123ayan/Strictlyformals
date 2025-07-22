
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, ShoppingCart, Heart, Star, User, Bell, X, ChevronDown, ChevronUp, Menu } from 'lucide-react';
import PocketBase from 'pocketbase';

// Initialize PocketBase client
const pb = new PocketBase('http://127.0.0.1:8090'); // Replace with your PocketBase URL

// Define types
type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
  rating: number;
  reviews: number;
  brand: string;
  colors?: string[];
  sizes?: string[];
};

type CartItem = Product & {
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
};

type Category = {
  id: string;
  name: string;
  icon: JSX.Element;
};

type Order = {
  id: string;
  created: string;
  email: string;
  phone: string;
  deliveryAddress: string;
  deliveryDate: string;
  products: {
    productId: number;
    name: string;
    quantity: number;
    price: number;
    color?: string;
    size?: string;
  }[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
};

export default function Dashboard() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [likedItems, setLikedItems] = useState<Set<number>>(new Set());
  const [sortBy, setSortBy] = useState<string>('name');
  const [showCart, setShowCart] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 30000]);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [showMobileMenu, setShowMobileMenu] = useState<boolean>(false);
  const [checkoutInfo, setCheckoutInfo] = useState({
    email: '',
    phone: '',
    deliveryAddress: '',
    deliveryDate: ''
  });
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [productSelections, setProductSelections] = useState<{
    [key: number]: { selectedColor?: string; selectedSize?: string };
  }>({});
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Fetch order history function with AbortController
  const fetchOrderHistory = async (signal?: AbortSignal) => {
    if (!pb.authStore.model) {
      setOrderHistory([]);
      return;
    }
    try {
      const result = await pb.collection('orders').getFullList({
        filter: `email = "${pb.authStore.model.email}"`,
        sort: '-created',
        requestKey: `fetchOrderHistory_${Date.now()}`
      }, { signal });
      setOrderHistory(result as any);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error fetching order history:', err);
      }
    }
  };

  // Cancel order function
  const cancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    
    try {
      await pb.collection('orders').delete(orderId);
      const abortController = new AbortController();
      await fetchOrderHistory(abortController.signal);
      alert('Order cancelled successfully');
    } catch (err) {
      console.error('Error cancelling order:', err);
      alert('Failed to cancel order. Please try again.');
    }
  };

  // Fetch user email and order history if logged in
  useEffect(() => {
    if (!pb.authStore.model) {
      setOrderHistory([]);
      setCheckoutInfo(prev => ({ ...prev, email: '' }));
      return;
    }

    setCheckoutInfo(prev => ({
      ...prev,
      email: pb.authStore.model.email || ''
    }));

    const abortController = new AbortController();
    fetchOrderHistory(abortController.signal);

    return () => {
      console.log('Cleaning up order history fetch');
      abortController.abort();
    };
  }, [pb.authStore.model?.id]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Categories data
  const categories: Category[] = [
    { 
      id: 'all', 
      name: 'All Products', 
      icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M3 10h18M7 15h1m4 0h1m4 0h1M3 6h18M3 18h18" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    },
    { 
      id: 'blazers', 
      name: 'Blazers', 
      icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M16 20h4v-4M4 20h12M8 16V4h8v12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    },
    { 
      id: 'trousers', 
      name: 'Trousers', 
      icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M4 4h16v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4z" strokeWidth="2"/>
        <path d="M4 8h16" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    },
    { 
      id: 'watches', 
      name: 'Watches', 
      icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="12" cy="12" r="7" strokeWidth="2"/>
        <path d="M12 9v3l2 2M17 5l1 1M5 5l1 1" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    },
    { 
      id: 'ties', 
      name: 'Ties', 
      icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M15 5h2v14h-2M7 5h2v14H7" strokeWidth="2"/>
        <path d="M12 5v14" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    },
    { 
      id: 'shoes', 
      name: 'Shoes', 
      icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M4 12h16M4 12v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5M4 12l1-6h14l1 6" strokeWidth="2"/>
      </svg>
    }
  ];

  const colors = ['Navy', 'Black', 'Charcoal', 'Brown', 'Gray', 'White'];
  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  // Products data
  const products: Product[] = [
    // Blazers
    { id: 1, name: 'Classic Navy Blazer', category: 'blazers', price: 12999, image: 'https://handcmediastorage.blob.core.windows.net/productimages/CO/COPRA154-G01-126836-800px-1040px.jpg', rating: 4.8, reviews: 156, brand: 'Strictly Formals', colors: ['Navy', 'Black'], sizes: ['S', 'M', 'L', 'XL'] },
    { id: 2, name: 'Charcoal Grey Blazer', category: 'blazers', price: 14299, image: 'https://tse2.mm.bing.net/th/id/OIP.i_x8Ih204w-dgqHR7baUpwHaO0?rs=1&pid=ImgDetMain&o=7&rm=3', rating: 4.7, reviews: 98, brand: 'Executive', colors: ['Charcoal', 'Black'], sizes: ['S', 'M', 'L'] },
    { id: 3, name: 'Midnight Black Blazer', category: 'blazers', price: 15599, image: '/blazer-black.jpg', rating: 4.9, reviews: 203, brand: 'Premium', colors: ['Black'], sizes: ['M', 'L', 'XL'] },
    { id: 16, name: 'Double-Breasted Blazer', category: 'blazers', price: 16999, image: '/blazer-double.jpg', rating: 4.6, reviews: 87, brand: 'Heritage', colors: ['Navy', 'Gray'], sizes: ['M', 'L', 'XL', 'XXL'] },
    { id: 17, name: 'Linen Summer Blazer', category: 'blazers', price: 11999, image: '/blazer-linen.jpg', rating: 4.5, reviews: 134, brand: 'Tropical', colors: ['Beige', 'White'], sizes: ['S', 'M', 'L'] },
    { id: 18, name: 'Velvet Evening Blazer', category: 'blazers', price: 18999, image: '/blazer-velvet.jpg', rating: 4.9, reviews: 76, brand: 'Luxury', colors: ['Burgundy', 'Navy'], sizes: ['S', 'M', 'L', 'XL'] },
    { id: 36, name: 'Checkered Pattern Blazer', category: 'blazers', price: 13999, image: '/blazer-checkered.jpg', rating: 4.4, reviews: 112, brand: 'Modern', colors: ['Gray', 'Brown'], sizes: ['S', 'M', 'L'] },
    { id: 37, name: 'Tweed Heritage Blazer', category: 'blazers', price: 17499, image: '/blazer-tweed.jpg', rating: 4.7, reviews: 68, brand: 'Classic', colors: ['Brown', 'Green'], sizes: ['M', 'L', 'XL'] },
    { id: 38, name: 'Slim Fit Stretch Blazer', category: 'blazers', price: 14999, image: '/blazer-slim.jpg', rating: 4.6, reviews: 143, brand: 'Flex', colors: ['Navy', 'Charcoal'], sizes: ['S', 'M', 'L'] },
    { id: 39, name: 'White Dinner Jacket', category: 'blazers', price: 15999, image: '/blazer-white.jpg', rating: 4.8, reviews: 54, brand: 'Formal', colors: ['White'], sizes: ['M', 'L', 'XL'] },
    { id: 40, name: 'Shawl Collar Blazer', category: 'blazers', price: 16499, image: '/blazer-shawl.jpg', rating: 4.9, reviews: 87, brand: 'Elegance', colors: ['Black', 'Burgundy'], sizes: ['L', 'XL', 'XXL'] },
    { id: 41, name: 'Travel Wrinkle-Free Blazer', category: 'blazers', price: 13499, image: '/blazer-travel.jpg', rating: 4.5, reviews: 126, brand: 'Commuter', colors: ['Navy', 'Gray'], sizes: ['S', 'M', 'L', 'XL'] },
    // Trousers
    { id: 4, name: 'Tailored Dress Trousers', category: 'trousers', price: 6499, image: '/trousers-tailored.jpg', rating: 4.6, reviews: 87, brand: 'Strictly Formals', colors: ['Black', 'Gray'], sizes: ['30', '32', '34', '36'] },
    { id: 5, name: 'Slim Fit Formal Pants', category: 'trousers', price: 5599, image: '/trousers-slim.jpg', rating: 4.5, reviews: 124, brand: 'Modern Cut', colors: ['Black', 'Charcoal'], sizes: ['28', '30', '32', '34'] },
    { id: 6, name: 'Classic Pleated Trousers', category: 'trousers', price: 7299, image: '/trousers-pleated.jpg', rating: 4.7, reviews: 76, brand: 'Traditional', colors: ['Gray', 'Brown'], sizes: ['32', '34', '36'] },
    { id: 42, name: 'Wool Blend Dress Pants', category: 'trousers', price: 8499, image: '/trousers-wool.jpg', rating: 4.8, reviews: 92, brand: 'Winter', colors: ['Charcoal', 'Navy'], sizes: ['30', '32', '34', '36'] },
    { id: 43, name: 'Stretch Comfort Trousers', category: 'trousers', price: 6899, image: '/trousers-stretch.jpg', rating: 4.4, reviews: 156, brand: 'Flex', colors: ['Black', 'Gray'], sizes: ['28', '30', '32', '34', '36'] },
    { id: 44, name: 'Tuxedo Dress Pants', category: 'trousers', price: 8999, image: '/trousers-tuxedo.jpg', rating: 4.7, reviews: 64, brand: 'Formal', colors: ['Black'], sizes: ['30', '32', '34', '36'] },
    { id: 45, name: 'Cotton Blend Chinos', category: 'trousers', price: 5999, image: '/trousers-chinos.jpg', rating: 4.3, reviews: 187, brand: 'Casual', colors: ['Khaki', 'Navy'], sizes: ['28', '30', '32', '34'] },
    { id: 46, name: 'High-Waisted Trousers', category: 'trousers', price: 7799, image: '/trousers-highwaist.jpg', rating: 4.6, reviews: 78, brand: 'Vintage', colors: ['Gray', 'Brown'], sizes: ['30', '32', '34'] },
    { id: 47, name: 'Technical Performance Pants', category: 'trousers', price: 8999, image: '/trousers-tech.jpg', rating: 4.7, reviews: 112, brand: 'Active', colors: ['Black', 'Navy'], sizes: ['30', '32', '34', '36'] },
    { id: 48, name: 'Wide-Leg Dress Pants', category: 'trousers', price: 7599, image: '/trousers-wide.jpg', rating: 4.5, reviews: 65, brand: 'Modern', colors: ['Black', 'Charcoal'], sizes: ['32', '34', '36'] },
    { id: 49, name: 'Pin-Striped Trousers', category: 'trousers', price: 8199, image: '/trousers-pinstripe.jpg', rating: 4.8, reviews: 93, brand: 'Executive', colors: ['Navy', 'Gray'], sizes: ['30', '32', '34'] },
    { id: 50, name: 'Linen Summer Trousers', category: 'trousers', price: 6999, image: '/trousers-linen.jpg', rating: 4.4, reviews: 107, brand: 'Tropical', colors: ['Beige', 'White'], sizes: ['30', '32', '34'] },
    // Watches
    { id: 7, name: 'Executive Gold Watch', category: 'watches', price: 25999, image: '/watch-gold.jpg', rating: 4.9, reviews: 234, brand: 'Timepiece Co.', colors: ['Gold', 'Rose Gold'] },
    { id: 8, name: 'Silver Chronograph', category: 'watches', price: 19499, image: '/watch-silver.jpg', rating: 4.8, reviews: 187, brand: 'Precision', colors: ['Silver', 'Black'] },
    { id: 9, name: 'Classic Leather Watch', category: 'watches', price: 12999, image: '/watch-leather.jpg', rating: 4.6, reviews: 156, brand: 'Heritage', colors: ['Brown', 'Black'] },
    { id: 51, name: 'Minimalist Dress Watch', category: 'watches', price: 14999, image: '/watch-minimal.jpg', rating: 4.7, reviews: 98, brand: 'Simple', colors: ['Silver', 'Gold'] },
    { id: 52, name: 'Aviator Pilot Watch', category: 'watches', price: 21999, image: '/watch-aviator.jpg', rating: 4.8, reviews: 112, brand: 'Sky', colors: ['Black', 'Brown'] },
    { id: 53, name: 'Diver Professional Watch', category: 'watches', price: 27999, image: '/watch-diver.jpg', rating: 4.9, reviews: 87, brand: 'Ocean', colors: ['Black', 'Blue'] },
    { id: 54, name: 'Smart Hybrid Watch', category: 'watches', price: 17999, image: '/watch-smart.jpg', rating: 4.5, reviews: 203, brand: 'Tech', colors: ['Black', 'Silver'] },
    { id: 55, name: 'Skeleton Automatic Watch', category: 'watches', price: 34999, image: '/watch-skeleton.jpg', rating: 4.9, reviews: 56, brand: 'Mechanical', colors: ['Silver', 'Gold'] },
    { id: 56, name: 'Moonphase Dress Watch', category: 'watches', price: 28999, image: '/watch-moonphase.jpg', rating: 4.8, reviews: 72, brand: 'Celestial', colors: ['Silver', 'Rose Gold'] },
    { id: 57, name: 'GMT World Timer Watch', category: 'watches', price: 31999, image: '/watch-gmt.jpg', rating: 4.7, reviews: 64, brand: 'Traveler', colors: ['Black', 'Blue'] },
    { id: 58, name: 'Vintage Pocket Watch', category: 'watches', price: 15999, image: '/watch-pocket.jpg', rating: 4.6, reviews: 89, brand: 'Antique', colors: ['Silver', 'Gold'] },
    { id: 59, name: 'Carbon Fiber Sports Watch', category: 'watches', price: 23999, image: '/watch-carbon.jpg', rating: 4.5, reviews: 118, brand: 'Sport', colors: ['Black', 'Gray'] },
    // Ties
    { id: 10, name: 'Silk Paisley Tie', category: 'ties', price: 3899, image: '/tie-paisley.jpg', rating: 4.4, reviews: 67, brand: 'Strictly Formals', colors: ['Navy', 'Burgundy', 'Emerald'] },
    { id: 11, name: 'Classic Striped Tie', category: 'ties', price: 3499, image: '/tie-striped.jpg', rating: 4.5, reviews: 94, brand: 'Gentleman\'s', colors: ['Navy', 'Red', 'Silver'] },
    { id: 12, name: 'Luxury Bow Tie', category: 'ties', price: 5199, image: '/bowtie.jpg', rating: 4.7, reviews: 43, brand: 'Formal Wear', colors: ['Black', 'White', 'Burgundy'] },
    { id: 60, name: 'Silk Knit Tie', category: 'ties', price: 4599, image: '/tie-knit.jpg', rating: 4.6, reviews: 56, brand: 'Textured', colors: ['Navy', 'Burgundy', 'Charcoal'] },
    { id: 61, name: 'Geometric Pattern Tie', category: 'ties', price: 4299, image: '/tie-geometric.jpg', rating: 4.3, reviews: 78, brand: 'Modern', colors: ['Blue', 'Gray', 'Black'] },
    { id: 62, name: 'Wedding Silk Tie', category: 'ties', price: 4899, image: '/tie-wedding.jpg', rating: 4.8, reviews: 112, brand: 'Bridal', colors: ['Silver', 'Gold', 'Ivory'] },
    { id: 63, name: 'Cotton Casual Tie', category: 'ties', price: 3299, image: '/tie-cotton.jpg', rating: 4.2, reviews: 89, brand: 'Everyday', colors: ['Blue', 'Green', 'Brown'] },
    { id: 64, name: 'Wool Knit Tie', category: 'ties', price: 4199, image: '/tie-wool.jpg', rating: 4.5, reviews: 67, brand: 'Winter', colors: ['Burgundy', 'Navy', 'Gray'] },
    { id: 65, name: 'Seven-Fold Silk Tie', category: 'ties', price: 5799, image: '/tie-sevenfold.jpg', rating: 4.9, reviews: 84, brand: 'Luxury', colors: ['Black', 'Navy', 'Burgundy'] },
    { id: 66, name: 'Skinny Micro-Pattern Tie', category: 'ties', price: 3999, image: '/tie-skinny.jpg', rating: 4.4, reviews: 76, brand: 'Contemporary', colors: ['Black', 'Gray', 'Blue'] },
    { id: 67, name: 'Reversible Tie', category: 'ties', price: 4499, image: '/tie-reversible.jpg', rating: 4.3, reviews: 92, brand: 'Versatile', colors: ['Navy/Red', 'Black/Silver', 'Brown/Green'] },
    { id: 68, name: 'Hand-Painted Silk Tie', category: 'ties', price: 6499, image: '/tie-painted.jpg', rating: 4.7, reviews: 58, brand: 'Artisan', colors: ['Multicolor'] },
    // Shoes
    { id: 13, name: 'Oxford Leather Shoes', category: 'shoes', price: 10799, image: '/shoes-oxford.jpg', rating: 4.8, reviews: 178, brand: 'Strictly Formals', colors: ['Black', 'Brown'], sizes: ['7', '8', '9', '10', '11'] },
    { id: 14, name: 'Derby Dress Shoes', category: 'shoes', price: 9499, image: '/shoes-derby.jpg', rating: 4.6, reviews: 145, brand: 'Classic', colors: ['Black', 'Tan'], sizes: ['8', '9', '10', '11'] },
    { id: 15, name: 'Monk Strap Shoes', category: 'shoes', price: 11999, image: '/shoes-monk.jpg', rating: 4.9, reviews: 92, brand: 'Premium', colors: ['Brown', 'Black'], sizes: ['7', '8', '9', '10'] },
    { id: 69, name: 'Wholecut Dress Shoes', category: 'shoes', price: 13499, image: '/shoes-wholecut.jpg', rating: 4.8, reviews: 67, brand: 'Elegance', colors: ['Black', 'Oxblood'], sizes: ['7', '8', '9', '10', '11'] },
    { id: 70, name: 'Brogue Wingtip Shoes', category: 'shoes', price: 12499, image: '/shoes-brogue.jpg', rating: 4.7, reviews: 89, brand: 'Heritage', colors: ['Brown', 'Black'], sizes: ['8', '9', '10', '11'] },
    { id: 71, name: 'Patent Leather Shoes', category: 'shoes', price: 14999, image: '/shoes-patent.jpg', rating: 4.9, reviews: 56, brand: 'Luxury', colors: ['Black'], sizes: ['7', '8', '9', '10'] },
    { id: 72, name: 'Loafers', category: 'shoes', price: 9999, image: '/shoes-loafers.jpg', rating: 4.6, reviews: 134, brand: 'Comfort', colors: ['Brown', 'Black'], sizes: ['7', '8', '9', '10'] },
    { id: 73, name: 'Double Monk Strap Shoes', category: 'shoes', price: 13999, image: '/shoes-doublemonk.jpg', rating: 4.8, reviews: 78, brand: 'Premium', colors: ['Brown', 'Black'], sizes: ['8', '9', '10', '11'] },
    { id: 74, name: 'Cap-Toe Dress Shoes', category: 'shoes', price: 11999, image: '/shoes-captoe.jpg', rating: 4.7, reviews: 102, brand: 'Formal', colors: ['Black', 'Burgundy'], sizes: ['7', '8', '9', '10'] },
    { id: 75, name: 'Tassel Loafers', category: 'shoes', price: 10999, image: '/shoes-tassel.jpg', rating: 4.5, reviews: 87, brand: 'Classic', colors: ['Brown', 'Black'], sizes: ['8', '9', '10'] },
    { id: 76, name: 'Chelsea Boots', category: 'shoes', price: 12999, image: '/shoes-chelsea.jpg', rating: 4.6, reviews: 113, brand: 'Urban', colors: ['Black', 'Brown'], sizes: ['7', '8', '9', '10', '11'] },
    { id: 77, name: 'Opera Pumps', category: 'shoes', price: 15999, image: '/shoes-opera.jpg', rating: 4.9, reviews: 45, brand: 'Black Tie', colors: ['Black'], sizes: ['8', '9', '10'] },
    { id: 78, name: 'Espadrille Dress Shoes', category: 'shoes', price: 8999, image: '/shoes-espadrille.jpg', rating: 4.4, reviews: 96, brand: 'Summer', colors: ['White', 'Navy'], sizes: ['8', '9', '10'] }
  ];

  // Filter and sort products
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         product.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
    const matchesColor = selectedColors.length === 0 || 
                        (product.colors && product.colors.some(color => selectedColors.includes(color)));
    const matchesSize = selectedSizes.length === 0 || 
                       (product.sizes && product.sizes.some(size => selectedSizes.includes(size)));
    
    return matchesCategory && matchesSearch && matchesPrice && matchesColor && matchesSize;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'price-low': return a.price - b.price;
      case 'price-high': return b.price - a.price;
      case 'rating': return b.rating - a.rating;
      case 'reviews': return b.reviews - a.reviews;
      default: return a.name.localeCompare(b.name);
    }
  });

  // Cart functions
  const addToCart = (product: Product) => {
    const selections = productSelections[product.id] || {};
    if (product.colors && !selections.selectedColor) {
      alert('Please select a color before adding to cart');
      return;
    }
    if (product.sizes && !selections.selectedSize) {
      alert('Please select a size before adding to cart');
      return;
    }

    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => 
        item.id === product.id && 
        item.selectedColor === selections.selectedColor && 
        item.selectedSize === selections.selectedSize
      );
      
      if (existingItem) {
        return prevItems.map(item =>
          item.id === product.id && 
          item.selectedColor === selections.selectedColor && 
          item.selectedSize === selections.selectedSize 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      } else {
        return [...prevItems, { 
          ...product, 
          quantity: 1, 
          selectedColor: selections.selectedColor,
          selectedSize: selections.selectedSize 
        }];
      }
    });

    if (selectedProduct) {
      setSelectedProduct(null); // Close modal after adding to cart
    }
  };

  const removeFromCart = (productId: number, color?: string, size?: string) => {
    setCartItems(prevItems => prevItems.filter(item => 
      !(item.id === productId && item.selectedColor === color && item.selectedSize === size)
    ));
  };

  const updateQuantity = (productId: number, color: string | undefined, size: string | undefined, newQuantity: number) => {
    if (newQuantity < 1) return;
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === productId && item.selectedColor === color && item.selectedSize === size 
          ? { ...item, quantity: newQuantity } 
          : item
      )
    );
  };

  // Handle color and size selection
  const selectColor = (productId: number, color: string) => {
    setProductSelections(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        selectedColor: color
      }
    }));
  };

  const selectSize = (productId: number, size: string) => {
    setProductSelections(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        selectedSize: size
      }
    }));
  };

  // Generate delivery date options (5-10 days from today)
  const getDeliveryDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 5; i <= 10; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  // Set default delivery date
  useEffect(() => {
    const defaultDate = getDeliveryDates()[0];
    setCheckoutInfo(prev => ({
      ...prev,
      deliveryDate: defaultDate
    }));
  }, []);

  // Checkout function
  const handleCheckout = async () => {
    if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(checkoutInfo.email)) {
      alert('Please enter a valid email address');
      return;
    }
    if (!/^\d{10,15}$/.test(checkoutInfo.phone)) {
      alert('Please enter a valid phone number (10-15 digits)');
      return;
    }
    if (!checkoutInfo.deliveryAddress.trim()) {
      alert('Please enter a delivery address');
      return;
    }
    if (!checkoutInfo.deliveryDate) {
      alert('Please select a delivery date');
      return;
    }

    setIsCheckingOut(true);
    
    try {
      const orderData = {
        email: checkoutInfo.email,
        phone: checkoutInfo.phone,
        deliveryAddress: checkoutInfo.deliveryAddress,
        deliveryDate: checkoutInfo.deliveryDate,
        products: cartItems.map(item => ({
          productId: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          color: item.selectedColor,
          size: item.selectedSize
        })),
        totalAmount: subtotal > 10000 ? subtotal : subtotal + 500,
        status: 'pending'
      };

      await pb.collection('orders').create(orderData, { 
        $autoCancel: false,
        $cancelKey: 'orderCreation'
      });
      
      setCartItems([]);
      setShowCart(false);
      
      const abortController = new AbortController();
      await fetchOrderHistory(abortController.signal);
      
      alert('Order placed successfully!');
    } catch (err) {
      console.error('Error placing order:', err);
      alert('Failed to place order. Please try again.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Buy now function
  const handleBuyNow = (product: Product) => {
    const selections = productSelections[product.id] || {};
    if (product.colors && !selections.selectedColor) {
      alert('Please select a color before proceeding');
      return;
    }
    if (product.sizes && !selections.selectedSize) {
      alert('Please select a size before proceeding');
      return;
    }

    setCartItems([{
      ...product,
      quantity: 1,
      selectedColor: selections.selectedColor,
      selectedSize: selections.selectedSize
    }]);
    setSelectedProduct(null);
    setShowCart(true);
  };

  // Calculate cart totals
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  // Toggle like status
  const toggleLike = (productId: number) => {
    const newLikedItems = new Set(likedItems);
    if (newLikedItems.has(productId)) {
      newLikedItems.delete(productId);
    } else {
      newLikedItems.add(productId);
    }
    setLikedItems(newLikedItems);
  };

  // Toggle color filter
  const toggleColor = (color: string) => {
    setSelectedColors(prev => 
      prev.includes(color) 
        ? prev.filter(c => c !== color) 
        : [...prev, color]
    );
  };

  // Toggle size filter
  const toggleSize = (size: string) => {
    setSelectedSizes(prev => 
      prev.includes(size) 
        ? prev.filter(s => s !== size) 
        : [...prev, size]
    );
  };

  // Reset filters
  const resetFilters = () => {
    setSelectedCategory('all');
    setSearchTerm('');
    setSelectedColors([]);
    setSelectedSizes([]);
    setPriceRange([0, 30000]);
    setSortBy('name');
  };

  // Handle sign out
  const handleSignOut = () => {
    pb.authStore.clear();
    setShowMobileMenu(false);
    router.push('/signin');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 relative">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div className="lg:hidden flex items-center">
              <button 
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2 text-stone-600 hover:text-stone-900"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 lg:flex-none flex justify-center lg:justify-start">
              <div className="flex items-center">
                <div className="p-2 bg-gradient-to-br from-stone-900 to-stone-700 rounded-lg shadow-md">
                  <svg className="w-6 h-6 md:w-8 md:h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 15L8 11H16L12 15Z" fill="currentColor" className="text-amber-400"/>
                    <path d="M3 5H21V7H3V5Z" fill="currentColor" className="text-white"/>
                    <path d="M5 9H19V11H5V9Z" fill="currentColor" className="text-white"/>
                    <path d="M7 13H17V15H7V13Z" fill="currentColor" className="text-white"/>
                    <path d="M9 17H15V19H9V17Z" fill="currentColor" className="text-white"/>
                  </svg>
                </div>
                <div className="ml-2 md:ml-3">
                  <h1 className="text-xl md:text-2xl font-serif font-bold text-stone-900 tracking-wider">
                    STRICTLY FORMALS
                  </h1>
                  <p className="text-xs text-stone-500 tracking-widest hidden md:block">LUXURY FORMALWEAR</p>
                </div>
              </div>
            </div>
            <div className="hidden lg:block flex-1 max-w-xl mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search products, brands..."
                  className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-stone-500 outline-none transition-all duration-200 bg-stone-50"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center space-x-4 md:space-x-6">
              <button className="relative p-2 text-stone-600 hover:text-stone-900 transition-colors hidden md:block" onClick={() => router.push('/notification')}>
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button 
                className="p-2 text-stone-600 hover:text-stone-900 transition-colors hidden md:block"
                onClick={() => router.push('/profile')}
              >
                <User className="w-5 h-5" />
              </button>
              <button 
                className="p-2 text-stone-600 hover:text-stone-900 transition-colors hidden md:block"
                onClick={() => setShowHistory(true)}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M3 3h18v18H3V3z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 7v5l3 3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 7h-4v5h4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button 
                className="relative p-2 text-stone-600 hover:text-stone-900 transition-colors"
                onClick={() => setShowCart(true)}
              >
                <ShoppingCart className="w-5 h-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-br from-stone-900 to-stone-700 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                    {totalItems}
                  </span>
                )}
              </button>
              <button 
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left hover:bg-stone-100"
                  onClick={handleSignOut}
                >
                  <svg className="w-5 h-5 text-stone-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16 17l5-5-5-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M21 12H9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-sm font-medium">Sign Out</span>
                </button>
            </div>
          </div>
          <div className="lg:hidden pb-3 px-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search products, brands..."
                className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-stone-500 outline-none transition-all duration-200 bg-stone-50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {showMobileMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
              onClick={() => setShowMobileMenu(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', ease: 'easeInOut' }}
              className="fixed inset-y-0 left-0 w-72 bg-white shadow-2xl z-40 flex flex-col p-4"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-serif font-bold text-stone-900">Menu</h2>
                <button 
                  onClick={() => setShowMobileMenu(false)}
                  className="p-1 rounded-full hover:bg-stone-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left bg-stone-100">
                  <User className="w-5 h-5 text-stone-600" />
                  <span className="text-sm font-medium">My Account</span>
                </button>
                <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left hover:bg-stone-100">
                  <Bell className="w-5 h-5 text-stone-600" />
                  <span className="text-sm font-medium">Notifications</span>
                </button>
                <button 
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left hover:bg-stone-100"
                  onClick={() => {
                    setShowHistory(true);
                    setShowMobileMenu(false);
                  }}
                >
                  <svg className="w-5 h-5 text-stone-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M3 3h18v18H3V3z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 7v5l3 3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16 7h-4v5h4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-sm font-medium">Order History</span>
                </button>
               
                
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="w-full lg:w-72">
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
                <h3 className="text-lg font-serif font-semibold text-stone-900 mb-4">Categories</h3>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                        selectedCategory === category.id
                          ? 'bg-gradient-to-r from-stone-900 to-stone-700 text-white shadow-md'
                          : 'text-stone-600 hover:bg-stone-50 hover:shadow-sm'
                      }`}
                    >
                      <span className={`${selectedCategory === category.id ? 'text-amber-300' : 'text-stone-500'}`}>
                        {category.icon}
                      </span>
                      <span className="text-sm font-medium">{category.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
                <h3 className="text-lg font-serif font-semibold text-stone-900 mb-4">Price Range</h3>
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-stone-600 mb-2">
                    <span>{formatPrice(priceRange[0])}</span>
                    <span>{formatPrice(priceRange[1])}</span>
                  </div>
                  <div className="px-2">
                    <input
                      type="range"
                      min="0"
                      max="30000"
                      step="1000"
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                      className="w-full mb-4 accent-stone-900"
                    />
                    <input
                      type="range"
                      min="0"
                      max="30000"
                      step="1000"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                      className="w-full accent-stone-900"
                    />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
                <h3 className="text-lg font-serif font-semibold text-stone-900 mb-4">Colors</h3>
                <div className="grid grid-cols-3 gap-3">
                  {colors.map(color => (
                    <button
                      key={color}
                      onClick={() => toggleColor(color)}
                      className={`flex items-center justify-center py-2 px-3 rounded-md text-xs font-medium transition-all ${
                        selectedColors.includes(color)
                          ? 'bg-stone-900 text-white shadow-md'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
                <h3 className="text-lg font-serif font-semibold text-stone-900 mb-4">Sizes</h3>
                <div className="grid grid-cols-3 gap-3">
                  {sizes.map(size => (
                    <button
                      key={size}
                      onClick={() => toggleSize(size)}
                      className={`flex items-center justify-center py-2 px-3 rounded-md text-xs font-medium transition-all ${
                        selectedSizes.includes(size)
                          ? 'bg-stone-900 text-white shadow-md'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
                <h3 className="text-lg font-serif font-semibold text-stone-900 mb-4">Sort By</h3>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-2.5 border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-stone-500 outline-none text-sm bg-stone-50"
                >
                  <option value="name">Name (A-Z)</option>
                  <option value="price-low">Price (Low to High)</option>
                  <option value="price-high">Price (High to Low)</option>
                  <option value="rating">Highest Rated</option>
                  <option value="reviews">Most Reviews</option>
                </select>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-serif font-bold text-stone-900">
                  {selectedCategory === 'all' ? 'All Products' : categories.find(c => c.id === selectedCategory)?.name}
                </h2>
                <p className="text-stone-600 mt-1 text-sm">
                  Showing {filteredProducts.length} of {products.length} products
                </p>
              </div>
             
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              <AnimatePresence>
                {filteredProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden hover:shadow-lg transition-shadow duration-300 group cursor-pointer"
                    onClick={() => setSelectedProduct(product)}
                  >
                    <div className="relative h-56 md:h-64 bg-stone-100 flex items-center justify-center overflow-hidden">
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLike(product.id);
                        }}
                        className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md hover:shadow-lg transition-all hover:scale-110"
                      >
                        <Heart
                          className={`w-5 h-5 transition-colors ${
                            likedItems.has(product.id) ? 'fill-red-500 text-red-500' : 'text-stone-400 hover:text-red-500'
                          }`}
                        />
                      </button>
                      {product.rating >= 4.5 && (
                        <div className="absolute top-3 left-3 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded flex items-center">
                          <Star className="w-3 h-3 fill-white mr-1" />
                          Premium
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <div className="mb-3">
                        <h3 className="font-semibold text-stone-900 text-lg line-clamp-2">{product.name}</h3>
                        <p className="text-sm text-stone-600 font-medium">{product.brand}</p>
                      </div>
                      <div className="flex items-center space-x-2 mb-4">
                        <div className="flex items-center">
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                          <span className="text-sm text-stone-600 ml-1 font-medium">{product.rating}</span>
                        </div>
                        <span className="text-sm text-stone-400">({product.reviews} reviews)</span>
                      </div>
                      <div className="mb-4 space-y-2">
                        {product.colors && product.colors.length > 0 && (
                          <div>
                            <p className="text-xs text-stone-500 mb-1">Colors</p>
                            <div className="flex space-x-2">
                              {product.colors.map(color => (
                                <button
                                  key={color}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    selectColor(product.id, color);
                                  }}
                                  className={`w-6 h-6 rounded-full border-2 shadow-sm transition-all ${
                                    productSelections[product.id]?.selectedColor === color
                                      ? 'border-stone-900 scale-110'
                                      : 'border-stone-200'
                                  }`}
                                  style={{ backgroundColor: color.toLowerCase() }}
                                  title={color}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                        {product.sizes && product.sizes.length > 0 && (
                          <div>
                            <p className="text-xs text-stone-500 mb-1">Sizes</p>
                            <div className="flex flex-wrap gap-2">
                              {product.sizes.map(size => (
                                <button
                                  key={size}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    selectSize(product.id, size);
                                  }}
                                  className={`text-xs px-2 py-1 border rounded transition-all ${
                                    productSelections[product.id]?.selectedSize === size
                                      ? 'bg-stone-900 text-white border-stone-900'
                                      : 'border-stone-200 hover:bg-stone-100'
                                  }`}
                                >
                                  {size}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-lg md:text-xl font-bold text-stone-900">{formatPrice(product.price)}</span>
                          {product.price > 10000 && (
                            <p className="text-xs text-green-600 mt-1">Free Shipping</p>
                          )}
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(product);
                          }}
                          className="px-4 py-2.5 md:px-5 md:py-2.5 bg-gradient-to-r from-stone-900 to-stone-700 text-white rounded-lg hover:from-stone-800 hover:to-stone-600 transition-all shadow-md text-sm font-medium"
                        >
                          Add to Cart
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            {filteredProducts.length === 0 && (
              <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-stone-200">
                <div className="text-6xl mb-4 text-stone-300">🔍</div>
                <h3 className="text-xl font-semibold text-stone-900 mb-2">No products found</h3>
                <p className="text-stone-600 mb-6">Try adjusting your search or filters</p>
                <button
                  onClick={resetFilters}
                  className="px-6 py-2.5 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors shadow-sm text-base"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product Details Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setSelectedProduct(null)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'tween', ease: 'easeInOut' }}
              className="fixed inset-x-0 bottom-0 md:top-10 md:bottom-auto max-w-4xl mx-auto bg-white rounded-t-2xl md:rounded-2xl shadow-2xl z-50 max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 md:p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl md:text-2xl font-serif font-bold text-stone-900">{selectedProduct.name}</h2>
                  <button 
                    onClick={() => setSelectedProduct(null)}
                    className="p-2 rounded-full hover:bg-stone-100 transition-colors"
                  >
                    <X className="w-6 h-6 text-stone-600" />
                  </button>
                </div>
                <div className="md:flex gap-8">
                  <div className="md:w-1/2 mb-6 md:mb-0">
                    <div className="relative h-64 md:h-96 bg-stone-100 rounded-lg overflow-hidden">
                      <img 
                        src={selectedProduct.image} 
                        alt={selectedProduct.name}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => toggleLike(selectedProduct.id)}
                        className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md hover:shadow-lg transition-all hover:scale-110"
                      >
                        <Heart
                          className={`w-6 h-6 transition-colors ${
                            likedItems.has(selectedProduct.id) ? 'fill-red-500 text-red-500' : 'text-stone-400 hover:text-red-500'
                          }`}
                        />
                      </button>
                      {selectedProduct.rating >= 4.5 && (
                        <div className="absolute top-4 left-4 bg-amber-500 text-white text-sm font-bold px-3 py-1 rounded flex items-center">
                          <Star className="w-4 h-4 fill-white mr-1" />
                          Premium
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="md:w-1/2">
                    <p className="text-lg font-medium text-stone-600 mb-2">{selectedProduct.brand}</p>
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="flex items-center">
                        <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                        <span className="text-base text-stone-600 ml-1 font-medium">{selectedProduct.rating}</span>
                      </div>
                      <span className="text-base text-stone-400">({selectedProduct.reviews} reviews)</span>
                    </div>
                    <div className="mb-6">
                      <span className="text-2xl md:text-3xl font-bold text-stone-900">{formatPrice(selectedProduct.price)}</span>
                      {selectedProduct.price > 10000 && (
                        <p className="text-sm text-green-600 mt-1">Free Shipping</p>
                      )}
                    </div>
                    {selectedProduct.colors && selectedProduct.colors.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm text-stone-600 mb-2">Colors</p>
                        <div className="flex space-x-3">
                          {selectedProduct.colors.map(color => (
                            <button
                              key={color}
                              onClick={() => selectColor(selectedProduct.id, color)}
                              className={`w-8 h-8 rounded-full border-2 shadow-sm transition-all ${
                                productSelections[selectedProduct.id]?.selectedColor === color
                                  ? 'border-stone-900 scale-110'
                                  : 'border-stone-200'
                              }`}
                              style={{ backgroundColor: color.toLowerCase() }}
                              title={color}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedProduct.sizes && selectedProduct.sizes.length > 0 && (
                      <div className="mb-6">
                        <p className="text-sm text-stone-600 mb-2">Sizes</p>
                        <div className="flex flex-wrap gap-3">
                          {selectedProduct.sizes.map(size => (
                            <button
                              key={size}
                              onClick={() => selectSize(selectedProduct.id, size)}
                              className={`text-sm px-3 py-1.5 border rounded transition-all ${
                                productSelections[selectedProduct.id]?.selectedSize === size
                                  ? 'bg-stone-900 text-white border-stone-900'
                                  : 'border-stone-200 hover:bg-stone-100'
                              }`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex gap-4">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => addToCart(selectedProduct)}
                        className="flex-1 py-3 bg-gradient-to-r from-stone-900 to-stone-700 text-white rounded-lg hover:from-stone-800 hover:to-stone-600 transition-all shadow-md font-medium"
                      >
                        Add to Cart
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleBuyNow(selectedProduct)}
                        className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all shadow-md font-medium"
                      >
                        Buy Now
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <AnimatePresence>
        {showCart && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
              onClick={() => setShowCart(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', ease: 'easeInOut' }}
              className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
            >
              <div className="p-6 border-b border-stone-200 flex items-center justify-between bg-gradient-to-r from-stone-900 to-stone-700 text-white">
                <h2 className="text-xl font-serif font-bold">Your Cart ({totalItems})</h2>
                <button 
                  onClick={() => setShowCart(false)}
                  className="p-1 rounded-full hover:bg-stone-700/50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {cartItems.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-12 h-12 mx-auto text-stone-300 mb-4" />
                    <h3 className="text-lg font-medium text-stone-900 mb-2">Your cart is empty</h3>
                    <p className="text-base text-stone-600 mb-6">Start shopping to add items to your cart</p>
                    <button
                      onClick={() => setShowCart(false)}
                      className="px-6 py-2.5 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors shadow-sm text-base"
                    >
                      Continue Shopping
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-6">
                      {cartItems.map(item => (
                        <div key={`${item.id}-${item.selectedColor}-${item.selectedSize}`} className="flex gap-4 border-b border-stone-100 pb-6">
                          <div className="w-20 h-20 md:w-24 md:h-24 bg-stone-100 rounded-lg overflow-hidden flex-shrink-0">
                            <img 
                              src={item.image} 
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <h3 className="font-medium text-stone-900 text-base line-clamp-2">{item.name}</h3>
                              <button 
                                onClick={() => removeFromCart(item.id, item.selectedColor, item.selectedSize)}
                                className="text-stone-400 hover:text-stone-900 ml-2"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            <p className="text-sm text-stone-600 mb-1">{item.brand}</p>
                            {item.selectedColor && (
                              <p className="text-xs text-stone-500">Color: {item.selectedColor}</p>
                            )}
                            {item.selectedSize && (
                              <p className="text-xs text-stone-500">Size: {item.selectedSize}</p>
                            )}
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center border border-stone-200 rounded-lg overflow-hidden">
                                <button 
                                  className="px-3 py-1 text-stone-600 hover:bg-stone-100 transition-colors text-sm"
                                  onClick={() => updateQuantity(item.id, item.selectedColor, item.selectedSize, item.quantity - 1)}
                                >
                                  -
                                </button>
                                <span className="px-3 py-1 text-sm border-x border-stone-200">{item.quantity}</span>
                                <button 
                                  className="px-3 py-1 text-stone-600 hover:bg-stone-100 transition-colors text-sm"
                                  onClick={() => updateQuantity(item.id, item.selectedColor, item.selectedSize, item.quantity + 1)}
                                >
                                  +
                                </button>
                              </div>
                              <span className="font-medium text-stone-900 text-base">
                                {formatPrice(item.price * item.quantity)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-8 space-y-4">
                      <h3 className="font-medium text-stone-900">Checkout Information</h3>
                      <div>
                        <label className="block text-sm text-stone-600 mb-1">Email *</label>
                        <input
                          type="email"
                          className="w-full px-4 py-2 border border-stone-200 rounded-lg text-sm"
                          value={checkoutInfo.email}
                          onChange={(e) => setCheckoutInfo({...checkoutInfo, email: e.target.value})}
                          required
                          pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                        />
                        {checkoutInfo.email && !/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(checkoutInfo.email) && (
                          <p className="text-xs text-red-500 mt-1">Please enter a valid email address</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm text-stone-600 mb-1">Phone Number *</label>
                        <input
                          type="tel"
                          className="w-full px-4 py-2 border border-stone-200 rounded-lg text-sm"
                          value={checkoutInfo.phone}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            setCheckoutInfo({...checkoutInfo, phone: value});
                          }}
                          required
                          pattern="[0-9]{10,15}"
                          minLength={10}
                          maxLength={15}
                        />
                        {checkoutInfo.phone && !/^\d{10,15}$/.test(checkoutInfo.phone) && (
                          <p className="text-xs text-red-500 mt-1">Please enter a valid phone number (10-15 digits)</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm text-stone-600 mb-1">Delivery Address *</label>
                        <textarea
                          className="w-full px-4 py-2 border border-stone-200 rounded-lg text-sm min-h-[100px]"
                          value={checkoutInfo.deliveryAddress}
                          onChange={(e) => setCheckoutInfo({...checkoutInfo, deliveryAddress: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-stone-600 mb-1">Preferred Delivery Date *</label>
                        <select
                          className="w-full px-4 py-2 border border-stone-200 rounded-lg text-sm"
                          value={checkoutInfo.deliveryDate}
                          onChange={(e) => setCheckoutInfo({...checkoutInfo, deliveryDate: e.target.value})}
                          required
                        >
                          <option value="" disabled>Select delivery date</option>
                          {getDeliveryDates().map(date => (
                            <option key={date} value={date}>
                              {new Date(date).toLocaleDateString('en-IN', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </>
                )}
              </div>
            
              {cartItems.length > 0 && (
                <div className="p-6 border-t border-stone-200 bg-stone-50">
                  <div className="flex justify-between mb-3 text-base">
                    <span className="text-stone-600">Subtotal</span>
                    <span className="font-medium">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between mb-3 text-base">
                    <span className="text-stone-600">Shipping</span>
                    <span className="font-medium">{subtotal > 10000 ? 'FREE' : formatPrice(500)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-medium mb-6 pt-3 border-t border-stone-200">
                    <span>Total</span>
                    <span className="text-stone-900">{formatPrice(subtotal > 10000 ? subtotal : subtotal + 500)}</span>
                  </div>
                  <button 
                    onClick={handleCheckout}
                    disabled={isCheckingOut || !checkoutInfo.email || !checkoutInfo.phone || !checkoutInfo.deliveryAddress || !checkoutInfo.deliveryDate}
                    className="w-full py-3.5 bg-gradient-to-r from-stone-900 to-stone-700 text-white rounded-lg hover:from-stone-800 hover:to-stone-600 transition-all shadow-md font-medium text-base disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isCheckingOut ? 'Processing...' : 'Proceed to Checkout'}
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* History Drawer */}
      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
              onClick={() => setShowHistory(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', ease: 'easeInOut' }}
              className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
            >
              <div className="p-6 border-b border-stone-200 flex items-center justify-between bg-gradient-to-r from-stone-900 to-stone-700 text-white">
                <h2 className="text-xl font-serif font-bold">Order History</h2>
                <button 
                  onClick={() => setShowHistory(false)}
                  className="p-1 rounded-full hover:bg-stone-700/50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {orderHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-12 h-12 mx-auto text-stone-300 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M3 3h18v18H3V3z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M8 7v5l3 3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M16 7h-4v5h4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <h3 className="text-lg font-medium text-stone-900 mb-2">No order history</h3>
                    <p className="text-base text-stone-600 mb-6">Your past orders will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {orderHistory.map((order, index) => (
                      <div key={index} className="border-b border-stone-100 pb-6">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-medium text-stone-900">Order #{orderHistory.length - index}</h3>
                            <p className="text-sm text-stone-500">
                              {new Date(order.created).toLocaleDateString()} • 
                              <span className={`ml-2 capitalize ${
                                order.status === 'delivered' ? 'text-green-600' :
                                order.status === 'shipped' ? 'text-blue-600' :
                                order.status === 'processing' ? 'text-amber-600' : 
                                order.status === 'cancelled' ? 'text-red-600' : 'text-stone-600'
                              }`}>
                                {order.status}
                              </span>
                            </p>
                            <p className="text-sm text-stone-500">
                              Delivery Date: {new Date(order.deliveryDate).toLocaleDateString('en-IN', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                          <p className="font-medium">{formatPrice(order.totalAmount)}</p>
                        </div>
                        
                        <div className="space-y-3">
                          {order.products.map((product, pIndex) => {
                            const fullProduct = products.find(p => p.id === product.productId);
                            return (
                              <div key={pIndex} className="flex gap-3">
                                <div className="w-12 h-12 bg-stone-100 rounded-md overflow-hidden flex-shrink-0">
                                  {fullProduct?.image && (
                                    <img 
                                      src={fullProduct.image} 
                                      alt={product.name}
                                      className="w-full h-full object-cover"
                                    />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-stone-900">{product.name}</p>
                                  <div className="flex justify-between text-xs text-stone-500">
                                    <span>
                                      {product.quantity} × {formatPrice(product.price)}
                                      {product.color && ` • ${product.color}`}
                                      {product.size && ` • ${product.size}`}
                                    </span>
                                    <span>{formatPrice(product.price * product.quantity)}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Cancel Order Button (only for pending orders) */}
                        {order.status === 'pending' && (
                          <div className="mt-4">
                            <button
                              onClick={() => cancelOrder(order.id)}
                              className="w-full py-2 px-4 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                            >
                              Cancel Order
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}