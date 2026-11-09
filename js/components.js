

export function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };

    return entities[char];
  });
}

function safeImage(url) {
  if (typeof url !== "string" || !/^https?:\/\//i.test(url)) {
    return "";
  }

  return escapeHTML(url);
}

function formatNumber(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) return "—";

  return Number(number.toFixed(1)).toString();
}

//    MEAL CARD

export function renderMealCard(meal) {
  const id = escapeHTML(meal.id);
  const name = escapeHTML(meal.name || "Unnamed Meal");
  const category = escapeHTML(meal.category || "Uncategorized");
  const area = escapeHTML(meal.area || "Unknown Area");
  const image = safeImage(meal.thumbnail);

  return `
    <article
      class="recipe-card bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group"
      data-meal-id="${id}"
    >
      <div class="relative h-48 overflow-hidden bg-gray-100">
        ${
          image
            ? `<img
                class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                src="${image}"
                alt="${name}"
                loading="lazy"
              />`
            : `<div class="w-full h-full flex items-center justify-center text-gray-400">
                <i class="fa-solid fa-utensils text-4xl"></i>
              </div>`
        }

        <div class="absolute bottom-3 left-3 flex gap-2">
          <span class="px-2 py-1 bg-white/90 text-xs font-semibold rounded-full text-gray-700">
            ${category}
          </span>

          <span class="px-2 py-1 bg-emerald-500 text-xs font-semibold rounded-full text-white">
            ${area}
          </span>
        </div>
      </div>

      <div class="p-4">
        <h3 class="text-base font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-emerald-600">
          ${name}
        </h3>

        <div class="flex items-center justify-between text-xs text-gray-500">
          <span>
            <i class="fa-solid fa-utensils text-emerald-600 mr-1"></i>
            ${category}
          </span>

          <span>
            <i class="fa-solid fa-globe text-blue-500 mr-1"></i>
            ${area}
          </span>
        </div>
      </div>
    </article>
  `;
}

// CATEGORY CARD

export function renderCategoryCard(category) {
  const rawName =
    typeof category === "string"
      ? category
      : category?.name || "";

  // Hide Goat and Breakfast categories
  if (["Goat", "Breakfast"].includes(rawName)) {
    return "";
  }

  const name = escapeHTML(rawName);

  const colorThemes = {
    Beef: {
      card: "bg-gradient-to-br from-rose-50 to-red-50 border-rose-200 hover:border-rose-400",
      icon: "bg-gradient-to-br from-rose-400 to-red-500",
    },

    Chicken: {
      card: "bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200 hover:border-amber-400",
      icon: "bg-gradient-to-br from-amber-400 to-yellow-500",
    },

    Dessert: {
      card: "bg-gradient-to-br from-pink-50 to-rose-50 border-pink-200 hover:border-pink-400",
      icon: "bg-gradient-to-br from-pink-400 to-rose-500",
    },

    Seafood: {
      card: "bg-gradient-to-br from-sky-50 to-blue-50 border-sky-200 hover:border-sky-400",
      icon: "bg-gradient-to-br from-sky-400 to-blue-500",
    },

    Vegetarian: {
      card: "bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 hover:border-emerald-400",
      icon: "bg-gradient-to-br from-emerald-400 to-green-500",
    },

    Pasta: {
      card: "bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 hover:border-orange-400",
      icon: "bg-gradient-to-br from-orange-400 to-amber-500",
    },

    Lamb: {
      card: "bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200 hover:border-purple-400",
      icon: "bg-gradient-to-br from-purple-400 to-violet-500",
    },

    Miscellaneous: {
      card: "bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200 hover:border-indigo-400",
      icon: "bg-gradient-to-br from-indigo-400 to-blue-500",
    },

    Pork: {
      card: "bg-gradient-to-br from-fuchsia-50 to-pink-50 border-fuchsia-200 hover:border-fuchsia-400",
      icon: "bg-gradient-to-br from-fuchsia-400 to-pink-500",
    },

    Starter: {
      card: "bg-gradient-to-br from-cyan-50 to-teal-50 border-cyan-200 hover:border-cyan-400",
      icon: "bg-gradient-to-br from-cyan-400 to-teal-500",
    },
  };

  const theme = colorThemes[rawName] || {
    card: "bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200 hover:border-teal-400",
    icon: "bg-gradient-to-br from-teal-400 to-cyan-500",
  };

  const icon = "fa-utensils";

  return `
    <button
      type="button"
      class="category-card ${theme.card} rounded-xl p-3 hover:shadow-md transition-all group text-left"
      data-category="${name}"
    >
      <div class="flex items-center gap-2.5">
        <div class="text-white w-9 h-9 ${theme.icon} rounded-lg flex items-center justify-center shadow-sm">
          <i class="fa-solid ${icon}"></i>
        </div>

        <h3 class="text-sm font-bold text-gray-900">${name}</h3>
      </div>
    </button>
  `;
}

//  PRODUCT CARD

export function renderProductCard(product) {
  const barcode = escapeHTML(product.barcode || "");
  const name = escapeHTML(product.name || "Unknown Product");
  const brand = escapeHTML(product.brand || "Unknown Brand");
  const image = safeImage(product.image);

  const nutrients = product.nutrients || {};

  const calories = formatNumber(nutrients.calories);
  const protein = formatNumber(nutrients.protein);
  const carbs = formatNumber(nutrients.carbs);
  const fat = formatNumber(nutrients.fat);
  const sugar = formatNumber(nutrients.sugar);

  const grade = String(product.nutritionGrade || "unknown").toLowerCase();
  const validGrade = ["a", "b", "c", "d", "e"].includes(grade);

  const nova = product.novaGroup
    ? `<span class="absolute top-2 right-2 bg-lime-500 text-white text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center"
        title="NOVA ${escapeHTML(product.novaGroup)}">
        ${escapeHTML(product.novaGroup)}
      </span>`
    : "";

  return `
    <article class="product-card bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all group">
      <div class="relative h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
        ${
          image
            ? `<img
                class="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                src="${image}"
                alt="${name}"
                loading="lazy"
              />`
            : `<i class="fa-solid fa-box-open text-4xl text-gray-300"></i>`
        }

        ${
          validGrade
            ? `<span class="absolute top-2 left-2 bg-emerald-600 text-white text-xs font-bold px-2 py-1 rounded uppercase">
                Nutri-Score ${grade}
              </span>`
            : ""
        }

        ${nova}
      </div>

      <div class="p-4">
        <p class="text-xs text-emerald-600 font-semibold mb-1 truncate">
          ${brand}
        </p>

        <h3 class="font-bold text-gray-900 mb-2 line-clamp-2">
          ${name}
        </h3>

        <p class="text-xs text-gray-500 mb-3">
          Barcode: ${barcode || "Not available"}
        </p>

        <div class="flex items-center gap-3 text-xs text-gray-500 mb-3">
          <span>
            <i class="fa-solid fa-fire mr-1"></i>
            ${calories} kcal
          </span>
        </div>

        <div class="grid grid-cols-4 gap-1 text-center mb-4">
          <div class="bg-emerald-50 rounded p-1.5">
            <p class="text-xs font-bold text-emerald-700">${protein}g</p>
            <p class="text-[10px] text-gray-500">Protein</p>
          </div>

          <div class="bg-blue-50 rounded p-1.5">
            <p class="text-xs font-bold text-blue-700">${carbs}g</p>
            <p class="text-[10px] text-gray-500">Carbs</p>
          </div>

          <div class="bg-purple-50 rounded p-1.5">
            <p class="text-xs font-bold text-purple-700">${fat}g</p>
            <p class="text-[10px] text-gray-500">Fat</p>
          </div>

          <div class="bg-orange-50 rounded p-1.5">
            <p class="text-xs font-bold text-orange-700">${sugar}g</p>
            <p class="text-[10px] text-gray-500">Sugar</p>
          </div>
        </div>

        <button
          type="button"
          class="add-product-btn w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all text-sm font-semibold"
          data-barcode="${barcode}"
        >
          <i class="fa-solid fa-plus mr-1"></i>
          Add to Food Log
        </button>
      </div>
    </article>
  `;
}

// MEAL DETAILS

export function renderMealDetails(meal, nutrition = null) {
  const name = escapeHTML(meal.name || "Unnamed Meal");
  const category = escapeHTML(meal.category || "Unknown");
  const area = escapeHTML(meal.area || "Unknown");
  const image = safeImage(meal.thumbnail);

  const ingredients = Array.isArray(meal.ingredients)
    ? meal.ingredients
    : [];

  const instructions = Array.isArray(meal.instructions)
    ? meal.instructions
    : [];

  const videoId = getYouTubeId(meal.youtube);

  const perServing = nutrition?.perServing || {};

  const calories = Number(perServing.calories);

  const nutritionItems = [
    { name: "Protein", value: perServing.protein, unit: "g" },
    { name: "Carbs", value: perServing.carbs, unit: "g" },
    { name: "Fat", value: perServing.fat, unit: "g" },
    { name: "Sugar", value: perServing.sugar, unit: "g" },
    { name: "Fiber", value: perServing.fiber, unit: "g" },
    { name: "Saturated Fat", value: perServing.saturatedFat, unit: "g" },
    { name: "Cholesterol", value: perServing.cholesterol, unit: "mg" },
    { name: "Sodium", value: perServing.sodium, unit: "mg" },
  ];

  const ingredientHTML = ingredients.length
    ? ingredients
        .map((item) => {
          const ingredient = escapeHTML(item.ingredient || "");
          const measure = escapeHTML(item.measure || "");

          return `
            <label class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-emerald-50 transition-colors">
              <input
                type="checkbox"
                class="ingredient-checkbox w-5 h-5 text-emerald-600 rounded border-gray-300"
              />

              <span class="text-gray-700">
                <span class="font-medium text-gray-900">${measure}</span>
                ${ingredient}
              </span>
            </label>
          `;
        })
        .join("")
    : `<p class="text-gray-500">No ingredients available.</p>`;

  const instructionsHTML = instructions.length
    ? instructions
        .map(
          (step, index) => `
            <div class="flex gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
              <div class="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
                ${index + 1}
              </div>

              <p class="text-gray-700 leading-relaxed pt-2">
                ${escapeHTML(step)}
              </p>
            </div>
          `
        )
        .join("")
    : `<p class="text-gray-500">No instructions available.</p>`;

  return `
    <div class="max-w-7xl mx-auto">
      <button
        id="back-to-meals-btn"
        class="flex items-center gap-2 text-gray-600 hover:text-emerald-600 font-medium mb-6"
      >
        <i class="fa-solid fa-arrow-left"></i>
        Back to Recipes
      </button>

      <div class="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
        <div class="relative h-80 md:h-96 bg-gray-200">
          ${
            image
              ? `<img src="${image}" alt="${name}" class="w-full h-full object-cover" />`
              : ""
          }

          <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>

          <div class="absolute bottom-0 left-0 right-0 p-8">
            <div class="flex gap-3 mb-3">
              <span class="px-3 py-1 bg-emerald-500 text-white text-sm rounded-full">
                ${category}
              </span>

              <span class="px-3 py-1 bg-blue-500 text-white text-sm rounded-full">
                ${area}
              </span>
            </div>

            <h1 class="text-3xl md:text-4xl font-bold text-white mb-2">
              ${name}
            </h1>
          </div>
        </div>
      </div>

      <div class="flex flex-wrap gap-3 mb-8">
        <button
          id="log-meal-btn"
          data-meal-id="${escapeHTML(meal.id)}"
          class="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
        >
          <i class="fa-solid fa-clipboard-list"></i>
          Log This Meal
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2 space-y-8">

          <div class="bg-white rounded-2xl shadow-lg p-6">
            <h2 class="text-xl font-bold text-gray-900 mb-4">
              <i class="fa-solid fa-list-check text-emerald-600 mr-2"></i>
              Ingredients (${ingredients.length})
            </h2>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              ${ingredientHTML}
            </div>
          </div>

          <div class="bg-white rounded-2xl shadow-lg p-6">
            <h2 class="text-xl font-bold text-gray-900 mb-4">
              <i class="fa-solid fa-shoe-prints text-emerald-600 mr-2"></i>
              Instructions
            </h2>

            <div class="space-y-4">
              ${instructionsHTML}
            </div>
          </div>

          ${
            videoId
              ? `<div class="bg-white rounded-2xl shadow-lg p-6">
                  <h2 class="text-xl font-bold text-gray-900 mb-4">
                    <i class="fa-solid fa-video text-red-500 mr-2"></i>
                    Video Tutorial
                  </h2>

                  <div class="relative aspect-video rounded-xl overflow-hidden bg-gray-100">
                    <iframe
                      src="https://www.youtube.com/embed/${videoId}"
                      class="absolute inset-0 w-full h-full"
                      title="Meal preparation video"
                      allowfullscreen
                    ></iframe>
                  </div>
                </div>`
              : ""
          }
        </div>

        <div class="space-y-6 lg:sticky lg:top-6 lg:self-start h-fit">
          <div class="bg-white rounded-2xl shadow-lg p-6">
            <h2 class="text-xl font-bold text-gray-900 mb-4">
              <i class="fa-solid fa-chart-pie text-emerald-600 mr-2"></i>
              Nutrition Facts
            </h2>

            <div class="bg-orange-50 rounded-xl p-5 text-center mb-4">
              <i class="fa-solid fa-fire text-orange-500 text-3xl mb-2"></i>

              <p class="text-sm text-gray-500 mb-1">
                Calories Per Serving
              </p>

              <p class="text-3xl font-bold text-orange-600">
                ${
                  Number.isFinite(calories)
                    ? calories.toFixed(0)
                    : "—"
                }
                <span class="text-base">kcal</span>
              </p>
            </div>

            <div class="grid grid-cols-2 gap-3">
              ${nutritionItems
                .map(
                  (item) => `
                    <div class="bg-gray-50 rounded-xl p-3">
                      <p class="text-xs text-gray-500 mb-1">
                        ${item.name}
                      </p>

                      <p class="text-lg font-bold text-gray-900">
                        ${
                          item.value !== undefined && item.value !== null
                            ? `${formatNumber(item.value)} ${item.unit}`
                            : "—"
                        }
                      </p>
                    </div>
                  `
                )
                .join("")}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function getYouTubeId(url = "") {
  if (typeof url !== "string") return "";

  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );

  return match ? match[1] : "";
}