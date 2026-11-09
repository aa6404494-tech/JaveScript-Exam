

export class ApiService {
  constructor() {
    this.baseURL = "https://nutriplan-api.vercel.app/api";
  }

  async request(endpoint) {
    const response = await fetch(`${this.baseURL}${endpoint}`);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || data.error);
    }

    return data;
  }

  // MEALS
  
  async getMeals() {
    const data = await this.request("/meals/search?q=chicken");
    return data.results || [];
  }

  async searchMeals(query) {
    const data = await this.request(
      `/meals/search?q=${encodeURIComponent(query)}`
    );

    return data.results || [];
  }

  async getMealById(id) {
    const data = await this.request(`/meals/${encodeURIComponent(id)}`);
    return data.result;
  }

  async getCategories() {
    const data = await this.request("/meals/categories");
    return data.results || [];
  }

  async getAreas() {
    const data = await this.request("/meals/areas");
    return data.results || [];
  }

  async filterMeals(filters = {}) {
    const params = new URLSearchParams();

    if (filters.category) {
      params.set("category", filters.category);
    }

    if (filters.area) {
      params.set("area", filters.area);
    }

    if (filters.ingredient) {
      params.set("ingredient", filters.ingredient);
    }

    params.set("limit", "25");

    const data = await this.request(`/meals/filter?${params.toString()}`);
    return data.results || [];
  }

  //  NUTRITION 

  async analyzeNutrition(recipeName, ingredients) {
    const response = await fetch(
      `${this.baseURL}/nutrition/analyze`,
      {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          "x-api-key": "WTQdGMf7fHqkhkDq6RTkFWC7PcCpHMmcr8GNPbbM",
        },
        body: JSON.stringify({
          recipeName,
          ingredients,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Nutrition API Error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(
        data.error?.message || "Nutrition analysis failed."
      );
    }

    return data.data;
  }

  //   PRODUCTS 

  async searchProducts(query) {
    const data = await this.request(
      `/products/search?q=${encodeURIComponent(query)}`
    );

    return data.results || [];
  }

  async getProductByBarcode(barcode) {
    const data = await this.request(
      `/products/barcode/${encodeURIComponent(barcode)}`
    );

    return data.result;
  }

  async getProductCategories() {
    const data = await this.request("/products/categories?page=1&limit=50");
    return data.results || [];
  }

  async getProductsByCategory(category) {
    const data = await this.request(
      `/products/category/${encodeURIComponent(category)}?page=1&limit=24`
    );

    return data.results || [];
  }
}