import "./style.css";
import { PRODUCTS } from "./products.js";

    // 1. Store Configuration (Replace default number with your actual Anantapur store WhatsApp number)
    const STORE_CONFIG = {
      name: "Lokesh ANANTAPUR",
      whatsappNumber: localStorage.getItem("aura_store_whatsapp") || "919491132945"
    };


    // 3. Application State
    let activeCategory = "All";
    let selectedSizes = {}; // Tracks selected size per product ID
    let cart = JSON.parse(localStorage.getItem("aura_boutique_cart") || "[]");

    // Pre-select default size 'M' (or first available) for smooth 1-tap adding
    PRODUCTS.forEach(p => {
      selectedSizes[p.id] = p.sizes.includes("M") ? "M" : p.sizes[0];
    });

    // 4. Render Product Cards
    function renderProducts() {
      const grid = document.getElementById("product-grid");
      const emptyState = document.getElementById("empty-state");
      const searchQuery = document.getElementById("search-input").value.trim().toLowerCase();
      const sortBy = document.getElementById("sort-select").value;

      let filtered = PRODUCTS.filter(p => {
        const matchesCat = activeCategory === "All" || p.category === activeCategory;
        const matchesQuery =
          p.name.toLowerCase().includes(searchQuery) ||
          p.category.toLowerCase().includes(searchQuery) ||
          p.fabric.toLowerCase().includes(searchQuery);
        return matchesCat && matchesQuery;
      });

      if (sortBy === "price-low") {
        filtered.sort((a, b) => a.price - b.price);
      } else if (sortBy === "price-high") {
        filtered.sort((a, b) => b.price - a.price);
      }

      if (filtered.length === 0) {
        grid.innerHTML = "";
        emptyState.classList.remove("hidden");
        return;
      }

      emptyState.classList.add("hidden");
      grid.innerHTML = filtered.map(product => {
        const discountPct = Math.round(((product.mrp - product.price) / product.mrp) * 100);
        const currentSize = selectedSizes[product.id];

        const sizeButtons = product.sizes.map(sz => {
          const isSelected = sz === currentSize;
          return `
            <button
              type="button"
              onclick="selectSize('${product.id}', '${sz}')"
              class="w-8 h-8 rounded-lg text-xs font-bold transition border ${
                isSelected
                  ? "bg-brand-ink text-white border-brand-ink shadow-xs"
                  : "bg-brand-cream text-brand-ink border-stone-200 hover:border-brand-rose"
              }"
            >
              ${sz}
            </button>
          `;
        }).join("");

        return `
          <article class="animate-card bg-white rounded-3xl border border-stone-200/80 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
            <div>
              <!-- Product Image -->
              <div class="relative aspect-[4/5] bg-stone-100 overflow-hidden">
                <img
                  src="${product.image}"
                  onerror="this.src='https://placehold.co/600x750/F2ECE4/9F3A55?text=${encodeURIComponent(product.name)}'"
                  alt="${product.name}"
                  loading="lazy"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span class="absolute top-3 left-3 bg-white/95 backdrop-blur-xs text-brand-ink text-[11px] font-bold px-3 py-1 rounded-full shadow-xs">
                  ${product.badge}
                </span>
                <span class="absolute top-3 right-3 bg-brand-rose text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
                  ${discountPct}% OFF
                </span>
              </div>

              <!-- Product Details -->
              <div class="p-4 sm:p-5 space-y-3">
                <div>
                  <p class="text-[11px] font-semibold uppercase tracking-wider text-brand-rose">${product.category}</p>
                  <h3 class="font-serif text-xl font-bold text-brand-ink leading-snug mt-0.5">${product.name}</h3>
                  <p class="text-xs text-brand-muted mt-0.5">${product.fabric}</p>
                </div>

                <!-- Price Tag -->
                <div class="flex items-baseline gap-2">
                  <span class="text-lg font-bold text-brand-ink">₹${product.price.toLocaleString("en-IN")}</span>
                  <span class="text-xs text-brand-muted line-through">₹${product.mrp.toLocaleString("en-IN")}</span>
                </div>

                <!-- Size Selector -->
                <div class="pt-1">
                  <div class="flex items-center justify-between mb-1.5">
                    <span class="text-[11px] font-semibold text-brand-muted">Select Size:</span>
                    <span class="text-[11px] text-emerald-700 font-medium">In Stock</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    ${sizeButtons}
                  </div>
                </div>
              </div>
            </div>

            <!-- Add to Bag CTA -->
            <div class="px-4 sm:px-5 pb-4 sm:pb-5 pt-1">
              <button
                type="button"
                onclick="addToCart('${product.id}')"
                class="w-full bg-brand-cream hover:bg-brand-rose text-brand-ink hover:text-white border border-stone-200 hover:border-brand-rose font-semibold py-3 rounded-xl text-sm transition flex items-center justify-center gap-2"
              >
                <span>+ Add to Bag (${currentSize})</span>
              </button>
            </div>
          </article>
        `;
      }).join("");
    }

    // 5. Category & Size Interactions
    function filterCategory(category) {
      activeCategory = category;
      document.querySelectorAll(".cat-btn").forEach(btn => {
        if (btn.dataset.cat === category) {
          btn.className = "cat-btn active px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition bg-brand-ink text-white shadow-sm";
        } else {
          btn.className = "cat-btn px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition bg-white text-brand-ink border border-stone-200 hover:border-brand-rose";
        }
      });
      renderProducts();
    }

    function resetFilters() {
      document.getElementById("search-input").value = "";
      document.getElementById("sort-select").value = "featured";
      filterCategory("All");
    }

    function selectSize(productId, size) {
      selectedSizes[productId] = size;
      renderProducts();
    }

    // 6. Cart Management
    function saveCart() {
      localStorage.setItem("aura_boutique_cart", JSON.stringify(cart));
      updateCartUI();
    }

    function addToCart(productId) {
      const product = PRODUCTS.find(p => p.id === productId);
      if (!product) return;
      const size = selectedSizes[productId] || product.sizes[0];

      const existing = cart.find(item => item.id === productId && item.size === size);
      if (existing) {
        existing.qty += 1;
      } else {
        cart.push({
          id: product.id,
          name: product.name,
          price: product.price,
          mrp: product.mrp,
          size: size,
          image: product.image,
          qty: 1
        });
      }

      saveCart();
      showToast(`Added "${product.name}" (Size ${size}) to your bag`);
    }

    function updateQty(index, delta) {
      cart[index].qty += delta;
      if (cart[index].qty <= 0) {
        cart.splice(index, 1);
      }
      saveCart();
    }

    function updateCartUI() {
      const badge = document.getElementById("cart-badge");
      const container = document.getElementById("cart-items-container");
      const footer = document.getElementById("cart-footer");
      const totalEl = document.getElementById("cart-total");
      const savingsEl = document.getElementById("cart-savings");

      const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
      badge.textContent = totalItems;

      if (cart.length === 0) {
        footer.classList.add("hidden");
        container.innerHTML = `
          <div class="h-full flex flex-col items-center justify-center text-center py-12 px-4">
            <div class="w-16 h-16 rounded-2xl bg-brand-sand flex items-center justify-center text-2xl mb-3">🛍️</div>
            <p class="font-serif text-2xl font-bold text-brand-ink">Your bag is empty</p>
            <p class="text-xs text-brand-muted mt-1 max-w-xs">Select your favorite western, ethnic, or occasion wear pieces and send your order directly on WhatsApp.</p>
            <button onclick="toggleCart(false)" class="mt-5 bg-brand-rose text-white px-5 py-2.5 rounded-xl text-xs font-bold">
              Browse Collection
            </button>
          </div>
        `;
        return;
      }

      footer.classList.remove("hidden");

      let subtotal = 0;
      let totalMrp = 0;

      container.innerHTML = cart.map((item, idx) => {
        subtotal += item.price * item.qty;
        totalMrp += item.mrp * item.qty;

        return `
          <div class="bg-white p-3.5 rounded-2xl border border-stone-200/80 flex gap-3.5 items-center">
            <img
              src="${item.image}"
              onerror="this.src='https://placehold.co/150x180/F2ECE4/9F3A55?text=Item'"
              alt="${item.name}"
              class="w-16 h-20 rounded-xl object-cover bg-stone-100 shrink-0"
            />
            <div class="flex-1 min-w-0">
              <h4 class="font-semibold text-sm text-brand-ink truncate">${item.name}</h4>
              <p class="text-xs text-brand-muted mt-0.5">Size: <span class="font-bold text-brand-ink">${item.size}</span> • Code: ${item.id}</p>
              <div class="flex items-center justify-between mt-2">
                <span class="font-bold text-sm text-brand-rose">₹${(item.price * item.qty).toLocaleString("en-IN")}</span>
                <div class="flex items-center gap-2 bg-brand-cream border border-stone-200 rounded-lg px-1.5 py-0.5">
                  <button onclick="updateQty(${idx}, -1)" class="w-6 h-6 text-xs font-bold text-brand-ink hover:text-brand-rose">−</button>
                  <span class="text-xs font-bold min-w-[16px] text-center">${item.qty}</span>
                  <button onclick="updateQty(${idx}, 1)" class="w-6 h-6 text-xs font-bold text-brand-ink hover:text-brand-rose">+</button>
                </div>
              </div>
            </div>
          </div>
        `;
      }).join("");

      const savings = totalMrp - subtotal;
      savingsEl.textContent = `₹${savings.toLocaleString("en-IN")}`;
      totalEl.textContent = `₹${subtotal.toLocaleString("en-IN")}`;
    }

    function toggleCart(open) {
      const overlay = document.getElementById("cart-overlay");
      const drawer = document.getElementById("cart-drawer");
      if (open) {
        overlay.classList.remove("hidden");
        drawer.classList.remove("translate-x-full");
      } else {
        overlay.classList.add("hidden");
        drawer.classList.add("translate-x-full");
      }
    }

    // 7. Direct WhatsApp Checkout Integration
    function checkoutViaWhatsApp() {
      if (cart.length === 0) return;

      const custName = document.getElementById("cust-name").value.trim() || "Valued Customer";
      const deliveryMode = document.getElementById("delivery-mode").value;
      const custArea = document.getElementById("cust-area").value.trim() || "Anantapur";

      let total = 0;
      const itemLines = cart.map((item, i) => {
        const lineTotal = item.price * item.qty;
        total += lineTotal;
        return `${i + 1}. *${item.name}* (${item.id})\n   Size: *${item.size}* | Qty: ${item.qty} — ₹${lineTotal.toLocaleString("en-IN")}`;
      }).join("\n");

      const message =
        `Hello *${STORE_CONFIG.name}*! 🛍️\n` +
        `I would like to place an order from your boutique website:\n\n` +
        `*Selected Outfits:*\n${itemLines}\n\n` +
        `*Total Amount:* ₹${total.toLocaleString("en-IN")}\n` +
        `*Customer:* ${custName}\n` +
        `*Preference:* ${deliveryMode} (${custArea})\n\n` +
        `Please confirm size availability!`;

      const whatsappUrl = `https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    }

    function openDirectWhatsAppInquiry() {
      const msg = `Hi *${STORE_CONFIG.name}*! I visited your website and would like to join your WhatsApp VIP list for new arrivals in Anantapur.`;
      window.open(`https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer");
    }

    // 8. Store Owner Settings Modal
    function toggleSettingsModal(show) {
      const modal = document.getElementById("settings-modal");
      if (show) {
        document.getElementById("store-whatsapp-input").value = STORE_CONFIG.whatsappNumber;
        modal.classList.remove("hidden");
      } else {
        modal.classList.add("hidden");
      }
    }

    function saveStoreSettings() {
      const raw = document.getElementById("store-whatsapp-input").value.replace(/\D/g, "");
      if (raw.length < 10) {
        showToast("Please enter a valid 10-to-12 digit WhatsApp number");
        return;
      }
      STORE_CONFIG.whatsappNumber = raw;
      localStorage.setItem("aura_store_whatsapp", raw);
      toggleSettingsModal(false);
      showToast("Boutique WhatsApp number updated!");
    }

    // 9. Toast Helper
    let toastTimer;
    function showToast(text) {
      const toast = document.getElementById("toast");
      document.getElementById("toast-msg").textContent = text;
      toast.classList.remove("opacity-0");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => {
        toast.classList.add("opacity-0");
      }, 2500);
    }

    // Initialize Storefront on Load
    window.addEventListener("DOMContentLoaded", () => {
      renderProducts();
      updateCartUI();
    });
  

// Expose storefront actions for inline HTML event handlers
Object.assign(window, {
  renderProducts,
  filterCategory,
  resetFilters,
  selectSize,
  addToCart,
  updateQty,
  updateCartUI,
  toggleCart,
  checkoutViaWhatsApp,
  openDirectWhatsAppInquiry,
  toggleSettingsModal,
  saveStoreSettings,
  showToast
});
