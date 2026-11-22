import React, { useEffect, useLayoutEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useCartStore } from '../store/cart';
import { useThemeStore } from '../store/theme';
import toast from 'react-hot-toast';
import type { Database } from '../types/supabase';
import { optimizeImageUrl, formatDescription } from '../lib/utils';
import { StoryModal } from '../components/StoryModal';
import { trackProductModalView } from '../services/analyticsService';
import { hasViewedStory } from '../lib/sessionManager';
import { getBusinessSlug } from '../lib/businessRoutes';
import { AnimatePresence, motion } from 'motion/react';
import { createPortal } from 'react-dom';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const DIETARY_ATTRS = [
  { key: 'is_vegan' as const, icon: 'leaf', label: 'Vegano' },
  { key: 'is_vegetarian' as const, icon: 'carrot', label: 'Vegetariano' },
  { key: 'is_gluten_free' as const, icon: 'wheat-awn', label: 'Sem glúten' },
  { key: 'is_spicy' as const, icon: 'pepper-hot', label: 'Picante' },
] as const;

const SPICY_LABELS: Record<number, string> = {
  1: 'Picante Leve',
  2: 'Picante Moderado',
  3: 'Picante Intenso',
};

function getDietaryLabel(attr: typeof DIETARY_ATTRS[number], product: { is_spicy: boolean; spicy_level?: number | null }) {
  if (attr.key === 'is_spicy') return SPICY_LABELS[product.spicy_level ?? 1] ?? 'Picante';
  return attr.label;
}

type Category = Database['public']['Tables']['categories']['Row'];
type Product = Database['public']['Tables']['products']['Row'];
type Extra = Database['public']['Tables']['extras']['Row'];
type Tag = Database['public']['Tables']['tags']['Row'];

interface ProductWithExtrasAndTags extends Product {
  extras: Extra[];
  tags: Tag[];
}

interface CategoryWithCount extends Category {
  productCount: number;
}

interface SelectedExtraWithQuantity {
  extra: Extra;
  quantity: number;
}

interface CachedMenu {
  categories: CategoryWithCount[];
  selectedCategory: string;
  products: ProductWithExtrasAndTags[];
  savedAt: number;
}

function menuCacheKey() {
  return `chefito-menu:${getBusinessSlug(window.location.pathname)}`;
}

function readCachedMenu(): CachedMenu | null {
  try {
    const cached = JSON.parse(sessionStorage.getItem(menuCacheKey()) || 'null') as CachedMenu | null;
    if (!cached || Date.now() - cached.savedAt > 300_000 || !Array.isArray(cached.categories) || !Array.isArray(cached.products)) return null;
    return cached;
  } catch {
    return null;
  }
}

export default function Menu() {
  const initialMenu = useRef(readCachedMenu());
  const [categories, setCategories] = useState<CategoryWithCount[]>(() => initialMenu.current?.categories || []);
  const [products, setProducts] = useState<ProductWithExtrasAndTags[]>(() => initialMenu.current?.products || []);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(() => initialMenu.current?.selectedCategory || null);
  const [selectedExtras, setSelectedExtras] = useState<Record<string, SelectedExtraWithQuantity[]>>({});
  const [selectedProduct, setSelectedProduct] = useState<ProductWithExtrasAndTags | null>(null);
  const addItem = useCartStore((state) => state.addItem);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const { formatCurrency, settings } = useThemeStore();
  const productCardDescriptionLines = Math.max(0, Math.min(7, settings?.product_card_description_lines ?? 4));
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [modalImageLoaded, setModalImageLoaded] = useState(false);
  const categoriesRequestedRef = useRef(false);
  const lastRequestedCategoryRef = useRef<string | null>(null);
  const productsRequestIdRef = useRef(0);
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const categoryButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);
  const modalScrollRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [scrollMetrics, setScrollMetrics] = useState({ scrollLeft: 0, scrollWidth: 0, clientWidth: 0 });
  const [hasModalOverflow, setHasModalOverflow] = useState(false);
  const [modalScrollMetrics, setModalScrollMetrics] = useState({ scrollTop: 0, scrollHeight: 0, clientHeight: 0 });

  useLayoutEffect(() => {
    const button = selectedCategory ? categoryButtonRefs.current[selectedCategory] : null;
    if (!button) return;
    const update = () => setIndicator({ left: button.offsetLeft, width: button.offsetWidth });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(button);
    return () => observer.disconnect();
  }, [selectedCategory, categories]);

  useEffect(() => {
    if (!selectedCategory || categories.length === 0 || products.length === 0) return;
    try {
      sessionStorage.setItem(menuCacheKey(), JSON.stringify({ categories, selectedCategory, products, savedAt: Date.now() }));
    } catch {
      // The menu remains usable when browser storage is unavailable.
    }
  }, [categories, products, selectedCategory]);

  const openProductModal = useCallback((product: ProductWithExtrasAndTags) => {
    setModalImageLoaded(false);
    setSelectedProduct(product);
    setSelectedExtras(prev => ({ ...prev, [product.id]: [] }));
    document.body.style.overflow = 'hidden';
    const productSlug = product.slug || generateSlug(product.name);
    const businessSlug = getBusinessSlug(window.location.pathname);
    window.history.pushState({}, document.title, `/${businessSlug}/produto/${encodeURIComponent(productSlug)}`);

    trackProductModalView(product.id, product.name);
  }, []);

  const closeProductModal = useCallback(() => {
    setSelectedProduct(null);
    document.body.style.overflow = 'auto';
    const businessSlug = getBusinessSlug(window.location.pathname);
    history.pushState({}, document.title, `/${businessSlug}/`);
  }, []);

  useEffect(() => {
    const checkHashAndOpenProduct = async () => {
      const pathMatch = window.location.pathname.match(/^\/[^/]+\/produto\/([^/]+)$/);
      const requestedSlug = pathMatch ? decodeURIComponent(pathMatch[1]) : window.location.hash.slice(1);
      if (!requestedSlug) return;

      const { data: productsData } = await supabase
        .from('products')
        .select(`
          *,
          product_extras (
            extras (*)
          ),
          product_tags (
            tags (*)
          )
        `)
        .eq('active', true)
        .eq('slug', requestedSlug)
        .limit(1);

      if (productsData) {
        const matchingProduct = productsData[0];
        if (matchingProduct) {
          const productWithExtrasAndTags = {
            ...matchingProduct,
            extras: matchingProduct.product_extras?.map((pe: { extras: Extra }) => pe.extras) || [],
            tags: matchingProduct.product_tags?.map((pt: { tags: Tag }) => pt.tags) || [],
            has_custom_tag: matchingProduct.has_custom_tag || false
          };
          openProductModal(productWithExtrasAndTags);
        }
      }
    };

    checkHashAndOpenProduct();
  }, [openProductModal]);

  useEffect(() => {
    if (!settings) return;

    const firstImageUrl = settings.story_images?.[0]?.url;
    const shouldAutoOpenStory =
      settings.story_enabled &&
      settings.story_auto_open &&
      settings.story_images &&
      settings.story_images.length > 0 &&
      firstImageUrl &&
      !hasViewedStory(firstImageUrl);

    if (shouldAutoOpenStory) {
      const timer = setTimeout(() => {
        setIsStoryModalOpen(true);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [settings]);

  useEffect(() => {
    if (categoriesRequestedRef.current) return;
    categoriesRequestedRef.current = true;
    const fetchCategories = async () => {
      const [categoriesResult, productCountsResult] = await Promise.all([
        supabase.from('categories').select('*').order('order'),
        supabase.from('products').select('category_id').eq('active', true),
      ]);
      const { data: categoriesData, error: categoriesError } = categoriesResult;
      
      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError);
        return;
      }

      const counts = new Map<string, number>();
      if (productCountsResult.error) console.error('Error fetching product counts:', productCountsResult.error);
      for (const product of productCountsResult.data || []) {
        counts.set(product.category_id, (counts.get(product.category_id) || 0) + 1);
      }
      const categoriesWithCount = (categoriesData || []).map(category => ({
        ...category,
        productCount: counts.get(category.id) || 0,
      }));
      
      setCategories(categoriesWithCount);
      if (categoriesWithCount.length > 0) {
        setSelectedCategory(categoriesWithCount[0].id);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!selectedCategory) return;
      if (lastRequestedCategoryRef.current === selectedCategory) return;
      lastRequestedCategoryRef.current = selectedCategory;
      const requestId = ++productsRequestIdRef.current;

      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          product_extras (
            extras (*)
          ),
          product_tags (
            tags (*)
          )
        `)
        .eq('category_id', selectedCategory)
        .eq('active', true)
        .order('order');
      
      if (productsError) {
        console.error('Error fetching products:', productsError);
        lastRequestedCategoryRef.current = null;
        return;
      }
      if (requestId !== productsRequestIdRef.current) return;

      const productsWithExtrasAndTags = productsData?.map(product => ({
        ...product,
        extras: product.product_extras?.map(pe => pe.extras) || [],
        tags: product.product_tags?.map(pt => pt.tags) || [],
        has_custom_tag: product.has_custom_tag || false
      })) || [];
      
      setProducts(productsWithExtrasAndTags);
      setSelectedExtras({});

      // Scroll para o topo quando a categoria muda
      window.scrollTo(0, 0);

    };

    fetchProducts();
  }, [selectedCategory]);

  const handleAddToCart = (product: ProductWithExtrasAndTags) => {
    const productExtras = selectedExtras[product.id] || [];

    if (product.require_extra && productExtras.length === 0) {
      toast.error('Escolha uma opção antes de adicionar ao carrinho');
      return;
    }

    setAddingToCart(product.id);
    const cartExtras = productExtras.map(({ extra, quantity }) => ({
      id: extra.id,
      name: extra.name,
      price: extra.price,
      quantity
    }));

    addItem({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      extras: cartExtras
    });
    setSelectedExtras(prev => ({ ...prev, [product.id]: [] }));
    toast.success('Item adicionado ao carrinho!');
    setTimeout(() => setAddingToCart(null), 500);
  };

  const selectExclusiveExtra = (productId: string, extra: Extra) => {
    setSelectedExtras(prev => ({
      ...prev,
      [productId]: [{ extra, quantity: 1 }]
    }));
  };

  const canAddToCart = (product: ProductWithExtrasAndTags) => {
    if (!product.require_extra) return true;
    return (selectedExtras[product.id] || []).length > 0;
  };

  const toggleExtra = (productId: string, extra: Extra) => {
    setSelectedExtras(prev => {
      const currentExtras = prev[productId] || [];
      const extraIndex = currentExtras.findIndex(e => e.extra.id === extra.id);
      
      if (extraIndex > -1) {
        // Remove extra
        return {
          ...prev,
          [productId]: currentExtras.filter(e => e.extra.id !== extra.id)
        };
      } else {
        // Add extra with quantity 1
        return {
          ...prev,
          [productId]: [...currentExtras, { extra, quantity: 1 }]
        };
      }
    });
  };

  const updateExtraQuantity = (productId: string, extraId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      // Remove extra if quantity is 0 or less
      setSelectedExtras(prev => ({
        ...prev,
        [productId]: (prev[productId] || []).filter(e => e.extra.id !== extraId)
      }));
    } else {
      // Update quantity
      setSelectedExtras(prev => ({
        ...prev,
        [productId]: (prev[productId] || []).map(e => 
          e.extra.id === extraId ? { ...e, quantity: newQuantity } : e
        )
      }));
    }
  };

  const calculateTotal = (product: ProductWithExtrasAndTags) => {
    const extrasTotal = (selectedExtras[product.id] || [])
      .reduce((sum, { extra, quantity }) => sum + (extra.price * quantity), 0);
    return Number(product.price) + extrasTotal;
  };

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const el = modalScrollRef.current;
    if (!el || !selectedProduct) {
      setHasModalOverflow(false);
      setModalScrollMetrics({ scrollTop: 0, scrollHeight: 0, clientHeight: 0 });
      return;
    }

    const checkModalOverflow = () => {
      const hasVerticalOverflow = el.scrollHeight > el.clientHeight + 1;
      setHasModalOverflow(hasVerticalOverflow);
      setModalScrollMetrics({
        scrollTop: el.scrollTop,
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
      });
    };

    checkModalOverflow();

    const resizeObserver = new ResizeObserver(checkModalOverflow);
    resizeObserver.observe(el);
    Array.from(el.children).forEach(child => resizeObserver.observe(child));
    el.addEventListener('scroll', checkModalOverflow, { passive: true });
    window.addEventListener('resize', checkModalOverflow);

    return () => {
      resizeObserver.disconnect();
      el.removeEventListener('scroll', checkModalOverflow);
      window.removeEventListener('resize', checkModalOverflow);
    };
  }, [selectedProduct, selectedExtras]);

  useEffect(() => {
    const el = categoryScrollRef.current;
    const checkOverflow = () => {
      if (!el) return;
      const hasHorizontalOverflow = el.scrollWidth > el.clientWidth + 1;
      setHasOverflow(hasHorizontalOverflow);
      setCanScrollLeft(el.scrollLeft > 1);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
      setScrollMetrics({
        scrollLeft: el.scrollLeft,
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
      });
    };

    checkOverflow();

    const resizeObserver = new ResizeObserver(checkOverflow);
    if (el) {
      resizeObserver.observe(el);
      el.addEventListener('scroll', checkOverflow, { passive: true });
    }

    window.addEventListener('resize', checkOverflow);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', checkOverflow);
      if (el) el.removeEventListener('scroll', checkOverflow);
    };
  }, [categories, settings?.story_enabled, settings?.story_images]);

  // Convert vertical wheel to horizontal scroll on desktop/tablet
  useEffect(() => {
    const el = categoryScrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY === 0) return;
      if (el.scrollWidth <= el.clientWidth) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [categories]);

  // Center the selected category button within the scroll container
  useEffect(() => {
    const el = categoryScrollRef.current;
    if (!el || !selectedCategory) return;
    const btn = categoryButtonRefs.current[selectedCategory];
    if (!btn) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 0) return;
    const target = btn.offsetLeft - (el.clientWidth / 2) + (btn.offsetWidth / 2);
    const clamped = Math.max(0, Math.min(maxScroll, target));
    el.scrollTo({ left: clamped, behavior: 'smooth' });
  }, [selectedCategory, categories]);

  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const showStoryButton = settings?.story_enabled && settings?.story_images && settings.story_images.length > 0;
  // Fixed thumb size for a clean position indicator (decoupled from viewport ratio)
  const scrollbarThumbWidth = 18;
  const scrollRatio = hasOverflow && scrollMetrics.scrollWidth > scrollMetrics.clientWidth
    ? scrollMetrics.scrollLeft / (scrollMetrics.scrollWidth - scrollMetrics.clientWidth)
    : 0;
  const scrollbarThumbLeft = Math.min(Math.max(scrollRatio, 0), 1) * (100 - scrollbarThumbWidth);
  const modalScrollbarThumbHeight = 18;
  const modalScrollRatio = hasModalOverflow && modalScrollMetrics.scrollHeight > modalScrollMetrics.clientHeight
    ? modalScrollMetrics.scrollTop / (modalScrollMetrics.scrollHeight - modalScrollMetrics.clientHeight)
    : 0;
  const modalScrollbarThumbTop = Math.min(Math.max(modalScrollRatio, 0), 1) * (100 - modalScrollbarThumbHeight);

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div
        initial={false}
        animate={{ x: '-50%', y: isScrolled ? 0 : 68 }}
        transition={{ duration: 0.42, ease: [0.4, 0, 0.2, 1] }}
        className="fixed top-3 left-1/2 z-40 w-[calc(100%-32px)] max-w-[88rem] h-14 bg-white/90 backdrop-blur-xl rounded-full">

        <div className="relative rounded-2xl">
          {showStoryButton && (
            <button
              onClick={() => setIsStoryModalOpen(true)}
              aria-label="Ver novidades do negócio"
              className="absolute left-2 top-2 z-10 w-10 h-10 rounded-full font-medium transition-colors flex items-center justify-center bg-accent text-gray-50"
            >
              <span className="absolute w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gray-50/20" />
              <i className="fa-solid fa-megaphone text-xs sm:text-sm text-white relative z-10 -translate-x-px" />
            </button>
          )}
          {(() => {
            // Smooth ease-out fade using multi-stop gradient (perceptually soft)
            const fadeLeft = canScrollLeft
              ? 'rgba(0,0,0,0) 0px, rgba(0,0,0,0.15) 12px, rgba(0,0,0,0.5) 28px, rgba(0,0,0,0.85) 44px, #000 64px'
              : '#000 0px';
            const fadeRight = canScrollRight
              ? '#000 calc(100% - 64px), rgba(0,0,0,0.85) calc(100% - 44px), rgba(0,0,0,0.5) calc(100% - 28px), rgba(0,0,0,0.15) calc(100% - 12px), rgba(0,0,0,0) 100%'
              : '#000 100%';
            const maskImage = `linear-gradient(to right, ${fadeLeft}, ${fadeRight})`;
            return (
              <div
                ref={categoryScrollRef}
                style={{ WebkitMaskImage: maskImage, maskImage }}
                className={`flex h-14 overflow-x-auto pt-1 custom-scrollbar category-scrollbar ${showStoryButton ? 'mx-14' : 'mx-2'} transition-[mask-image] duration-300 ${!hasOverflow ? 'justify-center' : ''}`}
              >

            <div className="relative flex space-x-1.5 sm:space-x-2 px-1">
              {categories.map((category) => (
                <button
                  key={category.id}
                  ref={(node) => { categoryButtonRefs.current[category.id] = node; }}
                  onClick={() => setSelectedCategory(category.id)}
                  aria-pressed={selectedCategory === category.id}
                  className={`relative px-3 sm:px-5 py-3 transition-colors whitespace-nowrap text-sm sm:text-base ${
                    selectedCategory === category.id
                      ? 'text-accent font-bold'
                      : 'text-gray-600 font-medium hover:text-accent'
                  }`}
                >
                  {category.name}
                  <span className="ml-1.5 sm:ml-2 text-xs text-gray-500">
                    {category.productCount}
                  </span>
                </button>
              ))}
              {indicator && (
                <motion.span
                  aria-hidden="true"
                  className="absolute left-0 bottom-0 h-[0.1rem] bg-accent"
                  initial={false}
                  animate={{ x: indicator.left, width: indicator.width }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                />
              )}
            </div>
              </div>
            );
          })()}
          {hasOverflow && (
            <div
              className="absolute bottom-1 left-1/2 -translate-x-1/2 w-[34%] sm:w-[32%] h-[4px] rounded-full overflow-hidden cursor-pointer touch-none bg-gray-200/60 group"
              onPointerDown={(e) => {
                e.preventDefault();
                const track = e.currentTarget;
                const el = categoryScrollRef.current;
                if (!el) return;
                track.setPointerCapture(e.pointerId);
                const thumb = track.firstElementChild as HTMLElement | null;
                if (thumb) thumb.style.transition = 'none';
                const trackRect = track.getBoundingClientRect();
                const thumbWidthPx = (scrollbarThumbWidth / 100) * trackRect.width;
                const maxScroll = el.scrollWidth - el.clientWidth;
                const usable = trackRect.width - thumbWidthPx;
                const thumbLeftPx = (scrollbarThumbLeft / 100) * trackRect.width;
                if (maxScroll <= 0 || usable <= 0) return;
                const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
                const cursorOnThumb =
                  e.clientX - trackRect.left >= thumbLeftPx &&
                  e.clientX - trackRect.left <= thumbLeftPx + thumbWidthPx;
                const dragOffset = cursorOnThumb
                  ? e.clientX - trackRect.left - thumbLeftPx
                  : thumbWidthPx / 2;
                const scrollToPointer = (clientX: number) => {
                  const nextThumbLeft = clamp(clientX - trackRect.left - dragOffset, 0, usable);
                  el.scrollLeft = (nextThumbLeft / usable) * maxScroll;
                };
                scrollToPointer(e.clientX);
                const move = (ev: PointerEvent) => scrollToPointer(ev.clientX);
                const up = (ev: PointerEvent) => {
                  if (thumb) thumb.style.transition = '';
                  if (track.hasPointerCapture(ev.pointerId)) track.releasePointerCapture(ev.pointerId);
                  window.removeEventListener('pointermove', move);
                  window.removeEventListener('pointerup', up);
                  window.removeEventListener('pointercancel', up);
                };
                window.addEventListener('pointermove', move);
                window.addEventListener('pointerup', up);
                window.addEventListener('pointercancel', up);
              }}
            >
              <div
                className="absolute top-0 h-full rounded-full bg-gray-400/40 group-hover:bg-gray-500/60 transition-[left,width,background-color] duration-150 ease-out"
                style={{
                  width: `${scrollbarThumbWidth}%`,
                  left: `${scrollbarThumbLeft}%`,
                }}
              />
            </div>
          )}
        </div>

      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 py-4 mt-16 sm:mt-20">
        {products.map((product) => {
          const imageUrl = optimizeImageUrl(product.image_url);
          const hasImageError = imageErrors.has(product.image_url);
          const isImageLoaded = loadedImages.has(product.image_url);

          return (
            <div
              key={product.id}
              className={`group relative bg-gray-50/90 backdrop-blur-sm rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-[transform,box-shadow] duration-200 flex flex-col h-full ${
                addingToCart === product.id ? 'scale-95 opacity-75' : ''
              }`}
            >
              <div 
                className="relative aspect-[4/2] overflow-hidden cursor-pointer bg-gray-100"
                onClick={() => openProductModal(product)}
              >
                {!hasImageError && <div aria-hidden className={`image-skeleton absolute inset-0 ${isImageLoaded ? 'image-skeleton-ready' : ''}`} />}
                {product.image_blur && !hasImageError && (
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-cover bg-center scale-110 blur-lg"
                    style={{ backgroundImage: `url(${product.image_blur})` }}
                  />
                )}
                {hasImageError ? (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <i className="fas fa-eye-slash text-3xl text-gray-400"></i>
                  </div>
                ) : (
                  <img
                    src={imageUrl}
                    alt={product.name}
                    loading="lazy"
                    decoding="async"
                    className={`relative w-full h-full object-cover transform group-hover:scale-110 transition-[opacity,transform] duration-500 ${
                      isImageLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                    onLoad={() => {
                      console.log('Image loaded in card:', imageUrl);
                      setLoadedImages(prev => new Set([...prev, product.image_url]));
                    }}
                    onError={() => {
                      console.error('Error loading image in card:', imageUrl);
                      setImageErrors(prev => new Set([...prev, product.image_url]));
                    }}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
              
              <div className="p-4 sm:p-6 flex flex-col flex-1">
                <h3
                  className="text-lg sm:text-2xl font-bold text-gray-800 font-title mb-1.5 sm:mb-2 cursor-pointer hover:text-accent transition-colors"
                  onClick={() => openProductModal(product)}
                >
                  {product.name}
                </h3>
                {DIETARY_ATTRS.some(a => product[a.key]) && (
                  <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                    {DIETARY_ATTRS.filter(a => product[a.key]).map(a => (
                      <span key={a.key} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100">
                        {a.key === 'is_spicy'
                          ? Array.from({ length: product.spicy_level ?? 1 }).map((_, i) => (
                              <i key={i} className={`fas fa-${a.icon} text-xs text-gray-600`}></i>
                            ))
                          : <i className={`fas fa-${a.icon} text-xs text-gray-600`}></i>
                        }
                        <span className="text-xs text-gray-600 font-medium ml-0.5">{getDietaryLabel(a, product)}</span>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex-1 mb-4 sm:mb-6">
                  {productCardDescriptionLines > 0 && product.description && (
                    <p
                      className="text-gray-600 text-xs sm:text-sm font-body overflow-hidden"
                      style={{ display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: productCardDescriptionLines }}
                    >
                      {formatDescription(product.description.replace(/\s*\n+\s*/g, ' '))}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-gray-100">
                  <div className="flex flex-col">
                    <span className="text-xs sm:text-sm text-gray-500">
                      {product.require_extra && product.extras.length > 0 ? 'A partir de' : 'Preço'}
                    </span>
                    <span className="text-xl sm:text-2xl font-bold text-accent">
                      {product.require_extra && product.extras.length > 0
                        ? formatCurrency(Number(product.price) + Math.min(...product.extras.map(e => Number(e.price))))
                        : formatCurrency(Number(product.price))}
                    </span>
                  </div>
                  <button
                    onClick={() => openProductModal(product)}
                    className="btn btn-primary !rounded-full text-sm sm:text-base px-4 sm:px-6"
                  >
                    <span>Ver produto</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {createPortal(<AnimatePresence>
      {selectedProduct && (
        <motion.div
          key={selectedProduct.id}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          className="fixed inset-0 bg-gray-950/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-[60] p-0 sm:p-4" onClick={closeProductModal}>
          <motion.div
            initial={{ opacity: 0, transform: 'translateY(18px) scale(0.98)' }}
            animate={{ opacity: 1, transform: 'translateY(0) scale(1)' }}
            exit={{ opacity: 0, transform: 'translateY(12px) scale(0.99)' }}
            transition={{ duration: 0.26, ease: [0.23, 1, 0.32, 1] }}
            className="bg-gray-50/95 backdrop-blur-xl rounded-t-2xl sm:rounded-3xl w-full max-w-4xl sm:max-w-[717px] max-h-[75vh] sm:max-h-[90vh] overflow-hidden shadow-[var(--shadow-overlay)] relative" onClick={e => e.stopPropagation()}>
            <div className="relative aspect-[16/9] bg-gray-100 overflow-hidden">
              {selectedProduct.image_url ? (
                <>
                  <div aria-hidden className={`image-skeleton absolute inset-0 ${modalImageLoaded ? 'image-skeleton-ready' : ''}`} />
                  {selectedProduct.image_blur && (
                    <div
                      aria-hidden
                      className="absolute inset-0 bg-cover bg-center scale-110 blur-lg"
                      style={{ backgroundImage: `url(${selectedProduct.image_blur})` }}
                    />
                  )}
                  <img
                    src={optimizeImageUrl(selectedProduct.image_url)}
                    alt={selectedProduct.name}
                    loading="eager"
                    decoding="async"
                    className={`relative w-full h-full object-cover transition-opacity duration-500 ${
                      modalImageLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                    onLoad={() => setModalImageLoaded(true)}
                    onError={(e) => {
                      console.error('Error loading image in modal:', selectedProduct.image_url);
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const iconContainer = target.parentElement?.querySelector('.fallback-icon');
                      if (iconContainer) {
                        (iconContainer as HTMLElement).style.display = 'flex';
                      }
                    }}
                  />
                  <div className="fallback-icon absolute inset-0 bg-gray-100 flex items-center justify-center" style={{ display: 'none' }}>
                    <i className="fas fa-eye-slash text-4xl text-gray-400"></i>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                  <i className="fas fa-eye-slash text-4xl text-gray-400"></i>
                </div>
              )}
              <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success('Link copiado!');
                  }}
                  aria-label="Copiar link do produto"
                  className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-gray-50/90 backdrop-blur-sm rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
                >
                  <i className="fas fa-link text-sm sm:text-base text-gray-500"></i>
                </button>
                <button
                  onClick={closeProductModal}
                  aria-label="Fechar produto"
                  className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-gray-50/90 backdrop-blur-sm rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
                >
                  <i className="fas fa-xmark text-lg sm:text-xl text-gray-500"></i>
                </button>
              </div>
            </div>

            <div className="md:hidden border-b border-gray-200 bg-gray-50 p-3 sticky top-0 z-10">
              <button
                onClick={() => {
                  if (!canAddToCart(selectedProduct)) {
                    toast.error(`Escolha ${selectedProduct.extras_label ? `uma opção de ${selectedProduct.extras_label.toLowerCase()}` : 'uma opção'} antes de continuar`);
                    return;
                  }
                  handleAddToCart(selectedProduct);
                  closeProductModal();
                }}
                disabled={!canAddToCart(selectedProduct)}
                className="w-full btn btn-primary text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{canAddToCart(selectedProduct) ? 'Adicionar ao carrinho' : `Escolha ${selectedProduct.extras_label || 'uma opção'}`}</span>
                <span className="opacity-70">•</span>
                <span>{formatCurrency(calculateTotal(selectedProduct))}</span>
              </button>
            </div>

            <div className="relative flex flex-col max-h-[calc(75vh-15.6rem-4.5rem)] sm:max-h-[calc(90vh-16rem)] min-h-0">

              <div ref={modalScrollRef} className="overflow-y-auto modal-product-scroll p-4 pr-7 sm:p-8 sm:pr-10">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 sm:gap-6">
                  <div className="flex-1">
                    <h2 className="text-xl sm:text-3xl font-bold text-gray-800 font-title mb-2 sm:mb-4">
                      {selectedProduct.name}
                    </h2>
                    <div className="prose prose-gray">
                      <p className="text-gray-600 font-body whitespace-pre-line text-sm sm:text-base">
                        {selectedProduct.description ? formatDescription(selectedProduct.description) : null}
                      </p>
                    </div>

                    {(selectedProduct.tags.length > 0 || selectedProduct.has_custom_tag || DIETARY_ATTRS.some(a => selectedProduct[a.key])) && (
                      <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-4 sm:mt-6">
                        {selectedProduct.tags.map(tag => (
                          <span
                            key={tag.id}
                            className="inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium bg-gray-100 text-gray-800"
                          >
                            <i className={`fas fa-${tag.icon} mr-1.5 sm:mr-2`}></i>
                            {tag.name}
                          </span>
                        ))}
                        {(() => {
                          const parts: string[] = [];
                          if (selectedProduct.has_custom_tag && selectedProduct.custom_tag_text) {
                            parts.push(selectedProduct.custom_tag_text);
                          }
                          DIETARY_ATTRS.forEach(a => {
                            if (selectedProduct[a.key]) parts.push(a.label);
                          });
                          if (parts.length === 0) return null;
                          return (
                            <span className="inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium bg-gray-100 text-gray-800">
                              <i className="fas fa-circle-info mr-1.5 sm:mr-2"></i>
                              {parts.join(' \u2022 ')}
                            </span>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  <div className="hidden md:block w-full md:w-72 bg-gray-100 rounded-2xl p-4 sm:p-6">
                    <div className="flex md:flex-col items-center justify-between md:justify-start md:text-center gap-3 mb-0 md:mb-6">
                      <span className="text-xs sm:text-sm text-gray-500">Preço total</span>
                      <div className="text-2xl sm:text-3xl font-bold text-accent">
                        {formatCurrency(calculateTotal(selectedProduct))}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (!canAddToCart(selectedProduct)) {
                          toast.error(`Escolha ${selectedProduct.extras_label ? `uma opção de ${selectedProduct.extras_label.toLowerCase()}` : 'uma opção'} antes de continuar`);
                          return;
                        }
                        handleAddToCart(selectedProduct);
                        closeProductModal();
                      }}
                      disabled={!canAddToCart(selectedProduct)}
                      className="w-full btn btn-primary text-sm sm:text-base mt-3 md:mt-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {canAddToCart(selectedProduct) ? 'Adicionar ao carrinho' : `Escolha ${selectedProduct.extras_label || 'uma opção'}`}
                    </button>
                  </div>
                </div>

                {selectedProduct.extras.length > 0 && (
                  <div className="mt-6 sm:mt-8 pb-4">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 font-title mb-3 sm:mb-4">
                      {selectedProduct.require_extra
                        ? (selectedProduct.extras_label || 'Escolha uma opção')
                        : 'Personalize seu pedido'}
                      {selectedProduct.require_extra && (
                        <span className="ml-2 text-xs font-normal text-accent">(obrigatório)</span>
                      )}
                    </h3>
                    <div className="grid grid-cols-1 gap-2 sm:gap-3">
                      {selectedProduct.extras.map((extra) => {
                        const selectedExtra = (selectedExtras[selectedProduct.id] || [])
                          .find(e => e.extra.id === extra.id);
                        const isSelected = !!selectedExtra;
                        const quantity = selectedExtra?.quantity || 0;
                        const isRequired = selectedProduct.require_extra;

                        return (
                          <div
                            key={extra.id}
                            className="px-3 py-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                          >
                            <label className="flex items-center justify-between cursor-pointer group/extra">
                              <div className="flex items-center min-w-0">
                                <div className="relative flex items-center justify-center flex-shrink-0">
                                  <input
                                    type={isRequired ? 'radio' : 'checkbox'}
                                    name={isRequired ? `extra-${selectedProduct.id}` : undefined}
                                    checked={isSelected}
                                    onChange={() => isRequired
                                      ? selectExclusiveExtra(selectedProduct.id, extra)
                                      : toggleExtra(selectedProduct.id, extra)}
                                    className="w-5 h-5 border-2 border-gray-300 rounded-full appearance-none checked:border-accent checked:bg-accent transition-colors duration-200 cursor-pointer relative z-10"
                                  />
                                </div>
                                <span className="ml-2.5 font-medium text-gray-700 group-hover/extra:text-gray-900 truncate">
                                  {extra.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                {isSelected && !isRequired && (
                                  <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200">
                                    <button
                                      onClick={(e) => { e.preventDefault(); updateExtraQuantity(selectedProduct.id, extra.id, quantity - 1); }}
                                      className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-l-lg transition-colors text-sm"
                                    >
                                      <i className="fas fa-minus text-xs"></i>
                                    </button>
                                    <span className="w-6 text-center font-medium text-sm">{quantity}</span>
                                    <button
                                      onClick={(e) => { e.preventDefault(); updateExtraQuantity(selectedProduct.id, extra.id, quantity + 1); }}
                                      className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-r-lg transition-colors text-sm"
                                    >
                                      <i className="fas fa-plus-circle text-xs"></i>
                                    </button>
                                  </div>
                                )}
                                <span className="text-accent font-semibold text-sm whitespace-nowrap">
                                  + {formatCurrency(Number(extra.price) * (isSelected && !isRequired ? quantity : 1))}
                                </span>
                              </div>
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              {hasModalOverflow && (
                <div
                  className="absolute right-2 sm:right-3 top-4 bottom-4 w-[4px] rounded-full overflow-hidden cursor-pointer touch-none bg-gray-200/60 group"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    const track = e.currentTarget;
                    const el = modalScrollRef.current;
                    if (!el) return;
                    track.setPointerCapture(e.pointerId);
                    const thumb = track.firstElementChild as HTMLElement | null;
                    if (thumb) thumb.style.transition = 'none';
                    const trackRect = track.getBoundingClientRect();
                    const thumbHeightPx = (modalScrollbarThumbHeight / 100) * trackRect.height;
                    const maxScroll = el.scrollHeight - el.clientHeight;
                    const usable = trackRect.height - thumbHeightPx;
                    const thumbTopPx = (modalScrollbarThumbTop / 100) * trackRect.height;
                    if (maxScroll <= 0 || usable <= 0) return;
                    const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
                    const cursorOnThumb =
                      e.clientY - trackRect.top >= thumbTopPx &&
                      e.clientY - trackRect.top <= thumbTopPx + thumbHeightPx;
                    const dragOffset = cursorOnThumb
                      ? e.clientY - trackRect.top - thumbTopPx
                      : thumbHeightPx / 2;
                    const scrollToPointer = (clientY: number) => {
                      const nextThumbTop = clamp(clientY - trackRect.top - dragOffset, 0, usable);
                      el.scrollTop = (nextThumbTop / usable) * maxScroll;
                    };
                    scrollToPointer(e.clientY);
                    const move = (ev: PointerEvent) => scrollToPointer(ev.clientY);
                    const up = (ev: PointerEvent) => {
                      if (thumb) thumb.style.transition = '';
                      if (track.hasPointerCapture(ev.pointerId)) track.releasePointerCapture(ev.pointerId);
                      window.removeEventListener('pointermove', move);
                      window.removeEventListener('pointerup', up);
                      window.removeEventListener('pointercancel', up);
                    };
                    window.addEventListener('pointermove', move);
                    window.addEventListener('pointerup', up);
                    window.addEventListener('pointercancel', up);
                  }}
                >
                  <div
                    className="absolute left-0 w-full rounded-full bg-gray-400/40 group-hover:bg-gray-500/60 transition-[top,height,background-color] duration-150 ease-out"
                    style={{
                      height: `${modalScrollbarThumbHeight}%`,
                      top: `${modalScrollbarThumbTop}%`,
                    }}
                  />
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>, document.body)}

      {showStoryButton && (
        <StoryModal
          isOpen={isStoryModalOpen}
          onClose={() => setIsStoryModalOpen(false)}
          images={settings?.story_images || []}
          format={settings?.story_image_format || 'vertical'}
        />
      )}
    </div>
  );
}
