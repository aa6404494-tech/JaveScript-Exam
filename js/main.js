

import { ApiService } from "./meal.js";

import {
  renderMealCard,
  renderCategoryCard,
  renderProductCard,
  renderMealDetails,
  escapeHTML,
} from "./components.js";

//    MAIN APP

class NutriPlanApp {
  constructor() {
    this.api = new ApiService();

    this.meals = [];
    this.products = [];
    this.currentMeal = null;
    this.currentProductGrade = "";
    this.currentPage = "home";
    this.searchTimer = null;

    this.recipesGrid = document.getElementById("recipes-grid");
    this.categoriesGrid = document.getElementById("categories-grid");
    this.productsGrid = document.getElementById("products-grid");
    this.mealDetailsSection = document.getElementById("meal-details");

    this.foodLog = new FoodLog();

    this.sections = {
      home: [
        "search-filters-section",
        "meal-categories-section",
        "all-recipes-section",
      ],
      products: ["products-section"],
      foodlog: ["foodlog-section"],
    };
  }

  //     INITIALIZATION   

  async init() {
    this.bindEvents();
    this.setupNavigation();

    this.showPage(this.getPageFromHash());

    try {
      await Promise.allSettled([
        this.loadMeals(),
        this.loadCategories(),
        this.loadAreas(),
        this.loadProductCategories(),
      ]);
    } finally {
      this.hideLoading();
      this.foodLog.render();
    }
  }

  //   NAVIGATION 

  getPageFromHash() {
    const hash = window.location.hash.replace("#", "").toLowerCase();

    if (hash === "products") return "products";
    if (hash === "foodlog") return "foodlog";

    return "home";
  }

  setupNavigation() {
    const navLinks = document.querySelectorAll(".nav-link");

    const pages = ["home", "products", "foodlog"];

    navLinks.forEach((link, index) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();

        const page = pages[index];

        if (page) {
          this.navigate(page);
        }

        this.closeSidebar();
      });
    });

    window.addEventListener("hashchange", () => {
      this.showPage(this.getPageFromHash());
    });

    const menuButton = document.getElementById("header-menu-btn");
    const closeButton = document.getElementById("sidebar-close-btn");
    const sidebarOverlay = document.getElementById("sidebar-overlay");

    menuButton?.addEventListener("click", () => this.openSidebar());
    closeButton?.addEventListener("click", () => this.closeSidebar());

    sidebarOverlay?.addEventListener("click", () => this.closeSidebar());
  }

  navigate(page) {
    if (!this.sections[page]) return;

    const hash = page === "home" ? "" : `#${page}`;

    if (window.location.hash !== hash) {
      window.location.hash = hash;
    } else {
      this.showPage(page);
    }
  }

  showPage(page) {
    if (!this.sections[page]) {
      page = "home";
    }

    this.currentPage = page;

    Object.values(this.sections).flat().forEach((id) => {
      const section = document.getElementById(id);

      if (section) {
        section.classList.add("hidden");
      }
    });

    this.mealDetailsSection?.classList.add("hidden");

    this.sections[page].forEach((id) => {
      document.getElementById(id)?.classList.remove("hidden");
    });

    const titles = {
      home: {
        title: "Meals",
        subtitle: "Discover delicious meals and recipes",
      },
      products: {
        title: "Products",
        subtitle: "Explore food products and their nutrition",
      },
      foodlog: {
        title: "Food Log",
        subtitle: "Track your daily nutrition",
      },
    };

    const pageInfo = titles[page];

    const headerTitle = document.querySelector("#header h1");
    const headerSubtitle = document.querySelector("#header p");

    if (headerTitle) {
      headerTitle.textContent = pageInfo.title;
    }

    if (headerSubtitle) {
      headerSubtitle.textContent = pageInfo.subtitle;
    }

    document.querySelectorAll(".nav-link").forEach((link, index) => {
      link.classList.toggle(
        "active",
        ["home", "products", "foodlog"][index] === page
      );
    });

    this.closeSidebar();
  }

  openSidebar() {
    document.getElementById("sidebar")?.classList.add("open");
    document.getElementById("sidebar-overlay")?.classList.add("active");
  }

  closeSidebar() {
    document.getElementById("sidebar")?.classList.remove("open");
    document.getElementById("sidebar-overlay")?.classList.remove("active");
  }

  //   EVENTS

  bindEvents() {
    document.getElementById("all-cuisines-btn")?.addEventListener("click", () => {
      this.loadMeals();
    });

    const searchInput = document.getElementById("search-input");

    searchInput?.addEventListener("input", (event) => {
      clearTimeout(this.searchTimer);

      const query = event.target.value.trim();

      this.searchTimer = setTimeout(() => {
        if (query) {
          this.searchMeals(query);
        } else {
          this.loadMeals();
        }
      }, 500);
    });

    this.recipesGrid?.addEventListener("click", (event) => {
      const card = event.target.closest("[data-meal-id]");

      if (card) {
        this.openMeal(card.dataset.mealId);
      }
    });

    this.categoriesGrid?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-category]");

      if (button) {
        this.filterByCategory(button.dataset.category);
      }
    });

    const productSearchButton = document.getElementById("search-product-btn");
    const productSearchInput = document.getElementById("product-search-input");

    productSearchButton?.addEventListener("click", () => {
      this.searchProducts(productSearchInput?.value.trim());
    });

    productSearchInput?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        this.searchProducts(event.target.value.trim());
      }
    });

    const barcodeInput = document.getElementById("barcode-input");
    const barcodeButton = document.getElementById("lookup-barcode-btn");

    barcodeButton?.addEventListener("click", () => {
      this.lookupBarcode(barcodeInput?.value.trim());
    });

    barcodeInput?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        this.lookupBarcode(event.target.value.trim());
      }
    });

    document.getElementById("product-categories")?.addEventListener(
      "click",
      (event) => {
        const button = event.target.closest("button");

        if (!button) return;

        const category =
          button.dataset.productCategory ||
          button.dataset.category;

        if (category) {
          this.loadProductsByCategory(category);
        }
      }
    );

    this.productsGrid?.addEventListener("click", (event) => {
      const button = event.target.closest(".add-product-btn");

      if (button) {
        this.addProductToLog(button.dataset.barcode);
      }
    });

    document.querySelectorAll(".nutri-score-filter").forEach((button) => {
      button.addEventListener("click", () => {
        this.currentProductGrade = (
          button.dataset.grade || ""
        ).toLowerCase();

        document.querySelectorAll(".nutri-score-filter").forEach((item) => {
          item.classList.remove("active");
        });

        button.classList.add("active");

        this.filterProductsByGrade();
      });
    });

    this.mealDetailsSection?.addEventListener("click", (event) => {
      if (event.target.closest("#back-to-meals-btn")) {
        this.hideMealDetails();
        return;
      }

      if (event.target.closest("#log-meal-btn")) {
        this.addMealToLog();
      }
    });

    document.getElementById("clear-foodlog")?.addEventListener(
      "click",
      () => this.foodLog.clear()
    );

    document.querySelectorAll(".quick-log-btn").forEach((button, index) => {
      button.addEventListener("click", () => {
        if (index === 0) {
          this.navigate("home");
        } else if (index === 1) {
          this.navigate("products");
        } else {
          this.showMessage(
            "info",
            "Add meals or products to your Food Log to track your nutrition."
          );
        }
      });
    });

    document.getElementById("grid-view-btn")?.addEventListener(
      "click",
      () => {
        this.recipesGrid?.classList.remove("grid-cols-1");
        this.recipesGrid?.classList.add(
          "grid-cols-1",
          "sm:grid-cols-2",
          "lg:grid-cols-3",
          "xl:grid-cols-4"
        );
      }
    );

    document.getElementById("list-view-btn")?.addEventListener(
      "click",
      () => {
        this.recipesGrid?.classList.remove(
          "sm:grid-cols-2",
          "lg:grid-cols-3",
          "xl:grid-cols-4"
        );

        this.recipesGrid?.classList.add("grid-cols-1");
      }
    );
  }

  //  MEALS

  async loadMeals() {
    this.showLoadingState(this.recipesGrid);

    try {
      this.meals = await this.api.getMeals();
      this.renderMeals();
    } catch (error) {
      this.showError(this.recipesGrid, error.message);
    }
  }

  async searchMeals(query) {
    if (!query) {
      this.loadMeals();
      return;
    }

    this.showLoadingState(this.recipesGrid);

    try {
      this.meals = await this.api.searchMeals(query);
      this.renderMeals();
    } catch (error) {
      this.showError(this.recipesGrid, error.message);
    }
  }

  renderMeals() {
    if (!this.recipesGrid) return;

    if (!Array.isArray(this.meals) || this.meals.length === 0) {
      this.recipesGrid.innerHTML = `
        <div class="col-span-full text-center py-10 text-gray-500">
          No meals found.
        </div>
      `;
      return;
    }

    this.recipesGrid.innerHTML = this.meals
      .map((meal) => renderMealCard(meal))
      .join("");
  }

  async loadCategories() {
    try {
      const categories = await this.api.getCategories();

      if (!this.categoriesGrid) return;

      this.categoriesGrid.innerHTML = categories
        .map((category) => renderCategoryCard(category))
        .join("");
    } catch (error) {
      console.error("Categories error:", error);
    }
  }

  //   AREAS

  async loadAreas() {
    try {
      const areas = await this.api.getAreas();

      let areaFilters = document.getElementById("area-filters");

      if (!areaFilters) {
        areaFilters = document.createElement("div");
        areaFilters.id = "area-filters";

        areaFilters.className =
          "flex flex-row flex-nowrap gap-2 shrink-0";

        document
          .getElementById("cuisine-filter-row")
          ?.appendChild(areaFilters);
      }

      areaFilters.innerHTML = areas
        .map((area) => {
          const name = escapeHTML(area.name || "");

          return `
            <button
              type="button"
              data-area="${name}"
              class="px-3 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-emerald-100 hover:text-emerald-700 text-sm transition whitespace-nowrap shrink-0"
            >
              ${name}
            </button>
          `;
        })
        .join("");

      areaFilters.addEventListener("click", (event) => {
        const button = event.target.closest("[data-area]");

        if (button) {
          this.filterByArea(button.dataset.area);
        }
      });
    } catch (error) {
      console.error("Areas error:", error);
    }
  }

  async filterByCategory(category) {
    this.showLoadingState(this.recipesGrid);

    try {
      this.meals = await this.api.filterMeals({ category });
      this.renderMeals();
    } catch (error) {
      this.showError(this.recipesGrid, error.message);
    }
  }

  async filterByArea(area) {
    this.showLoadingState(this.recipesGrid);

    try {
      this.meals = await this.api.filterMeals({ area });
      this.renderMeals();
    } catch (error) {
      this.showError(this.recipesGrid, error.message);
    }
  }

  async openMeal(id) {
    if (!id) return;

    try {
      this.mealDetailsSection?.classList.remove("hidden");

      const meal = await this.api.getMealById(id);

      if (!meal) {
        throw new Error("Meal details were not found.");
      }

      this.currentMeal = meal;

      let nutrition = null;

      try {
        const ingredients = Array.isArray(meal.ingredients)
          ? meal.ingredients
              .map((item) =>
                `${item.measure || ""} ${item.ingredient || ""}`.trim()
              )
              .filter(Boolean)
          : [];

        nutrition = await this.api.analyzeNutrition(
          meal.name,
          ingredients
        );
      } catch (nutritionError) {
        console.error("Nutrition error:", nutritionError);
      }

      this.mealDetailsSection.innerHTML = renderMealDetails(
        meal,
        nutrition
      );

      this.showMealDetails();
    } catch (error) {
      this.mealDetailsSection?.classList.add("hidden");
      this.showMessage("error", error.message);
    }
  }

  showMealDetails() {
    this.sections.home.forEach((id) => {
      document.getElementById(id)?.classList.add("hidden");
    });

    this.mealDetailsSection?.classList.remove("hidden");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  hideMealDetails() {
    this.currentMeal = null;
    this.mealDetailsSection?.classList.add("hidden");

    if (this.currentPage === "home") {
      this.sections.home.forEach((id) => {
        document.getElementById(id)?.classList.remove("hidden");
      });
    } else {
      this.showPage(this.currentPage);
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  //    PRODUCTS 

  async loadProductCategories() {
    try {
      const categories = await this.api.getProductCategories();

      const container = document.getElementById("product-categories");

      if (!container) return;

      const buttons = container.querySelectorAll("button");

      buttons.forEach((button) => {
        const label = button.textContent.trim().toLowerCase();

        const matchingCategory = categories.find((category) => {
          const categoryName = String(category.name || "").toLowerCase();

          return (
            categoryName === label ||
            categoryName.replace(/-/g, " ") === label
          );
        });

        if (matchingCategory) {
          button.dataset.productCategory = matchingCategory.name;
        }
      });

      const categoryAliases = {
        breakfast: "breakfast-cereals",
        dairy: "dairies",
        drinks: "beverages",
      };

      buttons.forEach((button) => {
        const label = button.textContent.trim().toLowerCase();

        if (categoryAliases[label]) {
          button.dataset.productCategory = categoryAliases[label];
        }
      });
    } catch (error) {
      console.error("Product categories error:", error);
    }
  }

  async searchProducts(query) {
    if (!query) {
      this.showMessage("info", "Please enter a product name.");
      return;
    }

    this.showLoadingState(this.productsGrid);

    try {
      this.products = await this.api.searchProducts(query);
      this.renderProducts();
    } catch (error) {
      this.showError(this.productsGrid, error.message);
    }
  }

  async lookupBarcode(barcode) {
    if (!barcode) {
      this.showMessage("info", "Please enter a barcode.");
      return;
    }

    this.showLoadingState(this.productsGrid);

    try {
      const product = await this.api.getProductByBarcode(barcode);

      this.products = product ? [product] : [];
      this.renderProducts();

      if (!product) {
        this.showMessage("info", "Product not found.");
      }
    } catch (error) {
      this.showError(this.productsGrid, error.message);
    }
  }

  async loadProductsByCategory(category) {
    if (!category) return;

    this.showLoadingState(this.productsGrid);

    try {
      this.products = await this.api.getProductsByCategory(category);
      this.renderProducts();
    } catch (error) {
      this.showError(this.productsGrid, error.message);
    }
  }

  renderProducts() {
    if (!this.productsGrid) return;

    const count = document.getElementById("products-count");

    if (count) {
      count.textContent = this.products.length;
    }

    this.filterProductsByGrade();
  }

  filterProductsByGrade() {
    if (!this.productsGrid) return;

    const filteredProducts = this.currentProductGrade
      ? this.products.filter((product) => {
          return (
            String(product.nutritionGrade || "").toLowerCase() ===
            this.currentProductGrade
          );
        })
      : this.products;

    if (filteredProducts.length === 0) {
      this.productsGrid.innerHTML = `
        <div class="col-span-full text-center py-10 text-gray-500">
          No products found.
        </div>
      `;
      return;
    }

    this.productsGrid.innerHTML = filteredProducts
      .map((product) => renderProductCard(product))
      .join("");
  }

  //  FOOD LOG ACTIONS

  addProductToLog(barcode) {
    const product = this.products.find(
      (item) => String(item.barcode) === String(barcode)
    );

    if (!product) {
      this.showMessage("error", "Product not found.");
      return;
    }

    const nutrients = product.nutrients || {};

    this.foodLog.add({
      id: `product-${product.barcode}-${Date.now()}`,
      name: product.name || "Unknown Product",
      type: "product",
      barcode: product.barcode || "",
      calories: Number(nutrients.calories) || 0,
      protein: Number(nutrients.protein) || 0,
      carbs: Number(nutrients.carbs) || 0,
      fat: Number(nutrients.fat) || 0,
      nutritionKnown: Object.values(nutrients).some(
        (value) => Number(value) > 0
      ),
    });

    this.showMessage("success", "Product added to your Food Log.");
  }

  addMealToLog() {
    if (!this.currentMeal) return;

    this.foodLog.add({
      id: `meal-${this.currentMeal.id}-${Date.now()}`,
      name: this.currentMeal.name || "Unknown Meal",
      type: "meal",
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      nutritionKnown: false,
    });

    this.showMessage(
      "success",
      "Meal added to your Food Log. Nutrition information is not available for this meal."
    );
  }

  // UI HELPERS 

  showLoading() {
    document.getElementById("app-loading-overlay")?.classList.remove("hidden");
  }

  hideLoading() {
    document.getElementById("app-loading-overlay")?.classList.add("hidden");
  }

  showLoadingState(container) {
    if (!container) return;

    container.innerHTML = `
      <div class="col-span-full flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
      </div>
    `;
  }

  showError(container, message) {
    if (!container) return;

    container.innerHTML = `
      <div class="col-span-full text-center py-10">
        <p class="text-red-500 mb-3">
          ${escapeHTML(message || "Something went wrong.")}
        </p>

        <button
          type="button"
          onclick="window.location.reload()"
          class="px-4 py-2 bg-emerald-600 text-white rounded-lg"
        >
          Try Again
        </button>
      </div>
    `;
  }

  showMessage(type, message) {
    if (typeof Swal !== "undefined") {
      Swal.fire({
        icon: type,
        text: message,
        confirmButtonColor: "#059669",
      });
    } else {
      alert(message);
    }
  }
}

//   FOOD LOG

class FoodLog {
  constructor() {
    this.goals = {
      calories: 2000,
      protein: 50,
      carbs: 250,
      fat: 65,
    };

    this.storageKey = `nutriplan-foodlog-${new Date().toLocaleDateString(
      "en-CA"
    )}`;

    this.items = this.load();
  }

  load() {
    try {
      const savedItems = localStorage.getItem(this.storageKey);

      return savedItems ? JSON.parse(savedItems) : [];
    } catch (error) {
      console.error("Food Log loading error:", error);
      return [];
    }
  }

  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.items));
    } catch (error) {
      console.error("Food Log saving error:", error);
    }
  }

  add(item) {
    this.items.push(item);
    this.save();
    this.render();
  }

  remove(id) {
    this.items = this.items.filter((item) => item.id !== id);

    this.save();
    this.render();
  }

  clear() {
    if (this.items.length === 0) return;

    const confirmed = confirm("Are you sure you want to clear your Food Log?");

    if (!confirmed) return;

    this.items = [];
    this.save();
    this.render();
  }

  getTotals() {
    const knownItems = this.items.filter(
      (item) => item.nutritionKnown === true
    );

    return knownItems.reduce(
      (totals, item) => {
        totals.calories += Number(item.calories) || 0;
        totals.protein += Number(item.protein) || 0;
        totals.carbs += Number(item.carbs) || 0;
        totals.fat += Number(item.fat) || 0;

        return totals;
      },
      {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
      }
    );
  }

  render() {
    const dateElement = document.getElementById("foodlog-date");

    if (dateElement) {
      dateElement.textContent = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }

    const container = document.getElementById("foodlog-today-section");

    if (!container) return;

    const totals = this.getTotals();

    container.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

        ${this.renderProgress(
          "Calories",
          totals.calories,
          this.goals.calories,
          "kcal",
          "orange"
        )}

        ${this.renderProgress(
          "Protein",
          totals.protein,
          this.goals.protein,
          "g",
          "emerald"
        )}

        ${this.renderProgress(
          "Carbs",
          totals.carbs,
          this.goals.carbs,
          "g",
          "blue"
        )}

        ${this.renderProgress(
          "Fat",
          totals.fat,
          this.goals.fat,
          "g",
          "purple"
        )}

      </div>

      <div class="bg-white rounded-xl shadow-sm p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold text-gray-900">
            Today's Logged Items
          </h3>

          <button
            type="button"
            id="foodlog-clear-btn"
            class="text-sm text-red-500 hover:text-red-700"
          >
            Clear All
          </button>
        </div>

        <div id="foodlog-items-container">
          ${
            this.items.length
              ? this.items.map((item) => this.renderItem(item)).join("")
              : `
                <p class="text-center text-gray-500 py-8">
                  No items logged yet.
                </p>
              `
          }
        </div>
      </div>
    `;

    container.querySelector("#foodlog-clear-btn")?.addEventListener(
      "click",
      () => this.clear()
    );

    container.querySelectorAll("[data-remove-item]").forEach((button) => {
      button.addEventListener("click", () => {
        this.remove(button.dataset.removeItem);
      });
    });
  }

  renderProgress(title, value, goal, unit, color) {
    const percentage = Math.min((value / goal) * 100, 100);

    const colors = {
      orange: {
        background: "bg-orange-50",
        text: "text-orange-700",
        bar: "bg-orange-500",
      },
      emerald: {
        background: "bg-emerald-50",
        text: "text-emerald-700",
        bar: "bg-emerald-500",
      },
      blue: {
        background: "bg-blue-50",
        text: "text-blue-700",
        bar: "bg-blue-500",
      },
      purple: {
        background: "bg-purple-50",
        text: "text-purple-700",
        bar: "bg-purple-500",
      },
    };

    const style = colors[color];

    return `
      <div class="${style.background} rounded-xl p-4">
        <p class="text-sm text-gray-600 mb-2">${title}</p>

        <p class="text-2xl font-bold ${style.text}">
          ${value.toFixed(1)} ${unit}
        </p>

        <div class="w-full bg-gray-200 rounded-full h-2 mt-3">
          <div
            class="${style.bar} h-2 rounded-full"
            style="width: ${percentage}%"
          ></div>
        </div>

        <p class="text-xs text-gray-500 mt-2">
          Goal: ${goal} ${unit}
        </p>
      </div>
    `;
  }

  renderItem(item) {
    const name = escapeHTML(item.name || "Unknown Item");

    const nutrition = item.nutritionKnown
      ? `
        <div class="flex flex-wrap gap-3 text-xs text-gray-500 mt-2">
          <span>${Number(item.calories || 0).toFixed(1)} kcal</span>
          <span>Protein: ${Number(item.protein || 0).toFixed(1)}g</span>
          <span>Carbs: ${Number(item.carbs || 0).toFixed(1)}g</span>
          <span>Fat: ${Number(item.fat || 0).toFixed(1)}g</span>
        </div>
      `
      : `
        <p class="text-xs text-gray-400 mt-2">
          Nutrition information unavailable.
        </p>
      `;

    return `
      <div class="flex items-center justify-between gap-4 border-b border-gray-100 py-4 last:border-0">

        <div class="min-w-0">
          <h4 class="font-semibold text-gray-800 break-words">
            ${name}
          </h4>

          <p class="text-xs text-gray-400 mt-1">
            ${item.type === "meal" ? "Meal" : "Product"}
          </p>

          ${nutrition}
        </div>

        <button
          type="button"
          data-remove-item="${escapeHTML(item.id)}"
          class="shrink-0 text-red-500 hover:text-red-700 p-2"
          aria-label="Remove item"
        >
          <i class="fa-solid fa-trash"></i>
        </button>

      </div>
    `;
  }
}

//   START APP 

document.addEventListener("DOMContentLoaded", () => {
  const app = new NutriPlanApp();
  app.init();
});